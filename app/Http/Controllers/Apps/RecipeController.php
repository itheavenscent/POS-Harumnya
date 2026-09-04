<?php

namespace App\Http\Controllers\Apps;

use App\Models\Variant;
use App\Models\Intensity;
use App\Models\Size;
use App\Models\Material;
use App\Models\VariantRecipe;
use App\Models\Product;
use App\Models\ProductRecipe;
use App\Models\IntensitySizeQuantity;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;

class RecipeController extends Controller
{
    // =========================================================================
    // INDEX — Grouped by Variant
    // =========================================================================

    public function index()
    {
        // Ambil semua kombinasi variant+intensity beserta aggregate
        $raw = VariantRecipe::with(['variant', 'intensity', 'ingredient.category'])
            ->select('variant_id', 'intensity_id')
            ->selectRaw('COUNT(*) as ingredient_count')
            ->selectRaw('SUM(base_quantity) as total_volume')
            ->groupBy('variant_id', 'intensity_id')
            ->get();

        // Group per variant_id
        $grouped = $raw->groupBy('variant_id');

        $variantGroups = $grouped->map(function ($items) {
            $firstItem = $items->first();
            $variant   = $firstItem->variant;

            // Bangun data per intensity
            $intensities = $items->map(function ($item) {
                $recipes = VariantRecipe::with('ingredient.category')
                    ->where('variant_id', $item->variant_id)
                    ->where('intensity_id', $item->intensity_id)
                    ->get();

                $sizeQuantities = IntensitySizeQuantity::with('size')
                    ->where('intensity_id', $item->intensity_id)
                    ->where('is_active', true)
                    ->get()
                    ->sortBy('size.volume_ml');

                $generatedSizes = Product::where('variant_id', $item->variant_id)
                    ->where('intensity_id', $item->intensity_id)
                    ->pluck('size_id')
                    ->toArray();

                return [
                    'variant_id'       => $item->variant_id,
                    'intensity_id'     => $item->intensity_id,
                    'intensity'        => $item->intensity,
                    'ingredient_count' => $item->ingredient_count,
                    'total_volume'     => $item->total_volume,
                    'recipes'          => $recipes,
                    'generated_sizes'  => $generatedSizes,
                    'is_generated'     => count($generatedSizes) > 0,
                    // Semua baris satu formula (variant+intensity) di-flag bersamaan,
                    // jadi cukup ambil dari baris pertama.
                    'is_active'        => (bool) ($recipes->first()->is_active ?? true),
                    'size_scaling'     => $sizeQuantities->map(fn($q) => [
                        'size_id'          => $q->size->id,
                        'size_name'        => $q->size->name,
                        'volume_ml'        => $q->size->volume_ml,
                        'total_volume'     => $q->total_volume,
                        'oil_quantity'     => $q->oil_quantity,
                        'alcohol_quantity' => $q->alcohol_quantity,
                        'other_quantity'   => $q->other_quantity ?? 0,
                        'ingredients'      => $this->buildScaledIngredients($recipes, $q),
                    ])->values(),
                ];
            })->values();

            $isAnyGenerated = $intensities->contains('is_generated', true);
            $isAllGenerated = $intensities->every(fn($i) => $i['is_generated']);

            return [
                'variant'           => $variant,
                'variant_id'        => $variant->id,
                'intensity_count'   => $intensities->count(),
                'total_ingredients' => $intensities->sum('ingredient_count'),
                'is_any_generated'  => $isAnyGenerated,
                'is_all_generated'  => $isAllGenerated,
                'intensities'       => $intensities,
            ];
        })->values();

        return Inertia::render('Dashboard/Recipes/Index', [
            'variantRecipes' => $variantGroups,
        ]);
    }

    // =========================================================================
    // EXPORT EXCEL — Formula & Resep (rapi, siap download)
    // =========================================================================

    public function exportExcel()
    {
        // Semua baris resep, urut variant → intensity → bahan.
        $recipes = VariantRecipe::with([
                'variant:id,code,name',
                'intensity:id,code,name',
                'ingredient:id,name,unit,material_category_id',
                'ingredient.category:id,ingredient_type',
            ])
            ->get()
            ->sort(function ($a, $b) {
                return [$a->variant->name ?? '', $a->intensity->code ?? '', $a->ingredient->name ?? '']
                   <=> [$b->variant->name ?? '', $b->intensity->code ?? '', $b->ingredient->name ?? ''];
            })
            ->values();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();

        // Style helper.
        $titleStyle = [
            'font'      => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => 'solid', 'startColor' => ['rgb' => '7C3AED']],
            'alignment' => ['horizontal' => 'center', 'vertical' => 'center'],
        ];
        $headStyle = [
            'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => 'solid', 'startColor' => ['rgb' => '4338CA']],
            'alignment' => ['horizontal' => 'center', 'vertical' => 'center'],
            'borders'   => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['rgb' => 'C7D2FE']]],
        ];
        $groupStyle = [
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'EDE9FE']],
        ];
        $typeLabel = ['oil' => 'Bibit/Oil', 'alcohol' => 'Alkohol', 'other' => 'Lainnya'];

        // ── SHEET 1: FORMULA DASAR (base 30 ml) ──────────────────────────────
        $s1 = $spreadsheet->getActiveSheet();
        $s1->setTitle('Formula Dasar');

        $s1->setCellValue('A1', 'FORMULA & RESEP PARFUM — BASE 30 ML');
        $s1->mergeCells('A1:F1');
        $s1->getStyle('A1')->applyFromArray($titleStyle);
        $s1->getRowDimension(1)->setRowHeight(24);

        $s1->setCellValue('A2', 'Diekspor: ' . now()->format('d/m/Y H:i') . ' WIB');
        $s1->mergeCells('A2:F2');
        $s1->getStyle('A2')->getFont()->setItalic(true)->setSize(9)->getColor()->setRGB('64748B');

        $headers = ['No', 'Bahan', 'Tipe', 'Base Qty', 'Satuan', 'Catatan'];
        foreach ($headers as $i => $h) {
            $s1->setCellValue(chr(65 + $i) . '4', $h);
        }
        $s1->getStyle('A4:F4')->applyFromArray($headStyle);

        $row = 5;
        $grouped = $recipes->groupBy(fn ($r) => ($r->variant->id ?? '') . '|' . ($r->intensity->id ?? ''));

        foreach ($grouped as $items) {
            $first    = $items->first();
            $vName    = trim(($first->variant->name ?? '—') . ' (' . ($first->variant->code ?? '?') . ')');
            $iName    = ($first->intensity->code ?? '—') . ' — ' . ($first->intensity->name ?? '');
            $totalBase = $items->sum(fn ($r) => (float) $r->base_quantity);

            // Baris group header (variant + intensity).
            $s1->setCellValue('A' . $row, $vName . '  •  ' . $iName);
            $s1->mergeCells("A{$row}:F{$row}");
            $s1->getStyle("A{$row}:F{$row}")->applyFromArray($groupStyle);
            $row++;

            $no = 1;
            foreach ($items as $r) {
                $type = $r->ingredient->category->ingredient_type ?? 'other';
                $s1->setCellValue('A' . $row, $no++);
                $s1->setCellValue('B' . $row, $r->ingredient->name ?? '—');
                $s1->setCellValue('C' . $row, $typeLabel[$type] ?? ucfirst($type));
                $s1->setCellValue('D' . $row, (float) $r->base_quantity);
                $s1->setCellValue('E' . $row, $r->unit ?? 'ml');
                $s1->setCellValue('F' . $row, $r->notes ?? '');
                $s1->getStyle("A{$row}:F{$row}")->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['rgb' => 'E2E8F0']]],
                ]);
                $s1->getStyle("A{$row}")->getAlignment()->setHorizontal('center');
                $s1->getStyle("D{$row}")->getAlignment()->setHorizontal('right');
                $row++;
            }

            // Baris total base per kombinasi.
            $s1->setCellValue('C' . $row, 'TOTAL');
            $s1->setCellValue('D' . $row, $totalBase);
            $s1->setCellValue('E' . $row, $first->unit ?? 'ml');
            $s1->getStyle("A{$row}:F{$row}")->getFont()->setBold(true);
            $s1->getStyle("C{$row}")->getAlignment()->setHorizontal('right');
            $s1->getStyle("D{$row}")->getAlignment()->setHorizontal('right');
            $s1->getStyle("A{$row}:F{$row}")->getFill()
               ->setFillType('solid')->getStartColor()->setRGB('F1F5F9');
            $row += 2; // spasi antar group
        }

        if ($recipes->isEmpty()) {
            $s1->setCellValue('A5', 'Belum ada data resep.');
            $s1->mergeCells('A5:F5');
        }

        foreach (range('A', 'F') as $col) {
            $s1->getColumnDimension($col)->setAutoSize(true);
        }
        $s1->freezePane('A5');

        // ── SHEET 2: SKALA PER UKURAN ────────────────────────────────────────
        $s2 = $spreadsheet->createSheet();
        $s2->setTitle('Skala per Ukuran');

        $s2->setCellValue('A1', 'SKALA RESEP PER UKURAN BOTOL');
        $s2->mergeCells('A1:G1');
        $s2->getStyle('A1')->applyFromArray($titleStyle);
        $s2->getRowDimension(1)->setRowHeight(24);

        $h2 = ['Varian', 'Intensitas', 'Ukuran', 'Bahan', 'Tipe', 'Qty', 'Satuan'];
        foreach ($h2 as $i => $h) {
            $s2->setCellValue(chr(65 + $i) . '3', $h);
        }
        $s2->getStyle('A3:G3')->applyFromArray($headStyle);

        $row2 = 4;
        foreach ($grouped as $items) {
            $first   = $items->first();
            $recipesForCombo = $items; // sudah punya ingredient loaded
            $vLabel  = trim(($first->variant->name ?? '—') . ' (' . ($first->variant->code ?? '?') . ')');
            $iLabel  = $first->intensity->code ?? '—';

            $sizes = IntensitySizeQuantity::with('size')
                ->where('intensity_id', $first->intensity_id)
                ->where('is_active', true)
                ->get()
                ->sortBy(fn ($q) => $q->size->volume_ml ?? 0);

            foreach ($sizes as $sq) {
                $sizeLabel = ($sq->size->name ?? '') . ' (' . ($sq->size->volume_ml ?? '?') . ' ml)';
                foreach ($this->buildScaledIngredients($recipesForCombo, $sq) as $ing) {
                    $s2->setCellValue('A' . $row2, $vLabel);
                    $s2->setCellValue('B' . $row2, $iLabel);
                    $s2->setCellValue('C' . $row2, $sizeLabel);
                    $s2->setCellValue('D' . $row2, $ing['name']);
                    $s2->setCellValue('E' . $row2, $typeLabel[$ing['ingredient_type']] ?? ucfirst($ing['ingredient_type']));
                    $s2->setCellValue('F' . $row2, (float) $ing['scaled_quantity']);
                    $s2->setCellValue('G' . $row2, $ing['unit'] ?? 'ml');
                    $s2->getStyle("F{$row2}")->getAlignment()->setHorizontal('right');
                    $s2->getStyle("A{$row2}:G{$row2}")->applyFromArray([
                        'borders' => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['rgb' => 'E2E8F0']]],
                    ]);
                    $row2++;
                }
            }
        }

        if ($row2 === 4) {
            $s2->setCellValue('A4', 'Belum ada skala ukuran aktif.');
            $s2->mergeCells('A4:G4');
        }

        foreach (range('A', 'G') as $col) {
            $s2->getColumnDimension($col)->setAutoSize(true);
        }
        $s2->freezePane('A4');

        $spreadsheet->setActiveSheetIndex(0);

        $filename = 'Formula_Resep_' . now()->format('Ymd_His') . '.xlsx';

        return response()->streamDownload(function () use ($spreadsheet) {
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet))->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    public function create()
    {
        $intensities = Intensity::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'code', 'name', 'oil_ratio', 'alcohol_ratio']);

        $intensitySizeQuantities = IntensitySizeQuantity::with('size:id,name,volume_ml')
            ->where('is_active', true)
            ->get()
            ->sortBy('size.volume_ml')
            ->map(fn($q) => [
                'intensity_id'     => $q->intensity_id,
                'size'             => $q->size,
                'oil_quantity'     => (int) $q->oil_quantity,
                'alcohol_quantity' => (int) $q->alcohol_quantity,
                'other_quantity'   => (int) ($q->other_quantity ?? 0),
                'total_volume'     => (int) $q->total_volume,
            ])->values()->toArray();

        return Inertia::render('Dashboard/Recipes/Create', [
            'variants'   => Variant::where('is_active', true)
                ->orderBy('sort_order')
                ->get(['id', 'code', 'name', 'gender']),
            'intensities'             => $intensities,
            'ingredients'             => Material::bahanBaku()
                ->with('category:id,name,ingredient_type')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'unit', 'material_category_id']),
            'intensitySizeQuantities' => $intensitySizeQuantities,
        ]);
    }

    // =========================================================================
    // STORE
    // =========================================================================

    public function store(Request $request)
    {
        $validated = $request->validate([
            'variant_id'            => 'required|exists:variants,id',
            'intensity_id'          => 'required|exists:intensities,id',
            'items'                 => 'required|array|min:1',
            'items.*.ingredient_id' => [
                'required',
                Rule::exists('materials', 'id')->where('material_type', 'bahan_baku'),
            ],
            'items.*.base_quantity' => 'required|numeric|min:0.01',
            'items.*.unit'          => 'nullable|string|max:50',
            'items.*.notes'         => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated) {
            // Pertahankan status aktif/nonaktif kalau formula ini sudah ada sebelumnya.
            $wasActive = VariantRecipe::where('variant_id', $validated['variant_id'])
                ->where('intensity_id', $validated['intensity_id'])
                ->value('is_active') ?? true;

            VariantRecipe::where('variant_id', $validated['variant_id'])
                ->where('intensity_id', $validated['intensity_id'])
                ->delete();

            foreach ($validated['items'] as $item) {
                VariantRecipe::create([
                    'variant_id'    => $validated['variant_id'],
                    'intensity_id'  => $validated['intensity_id'],
                    'ingredient_id' => $item['ingredient_id'],
                    'base_quantity' => $item['base_quantity'],
                    'unit'          => $item['unit'] ?? 'ml',
                    'notes'         => $item['notes'] ?? null,
                    'is_active'     => $wasActive,
                ]);
            }
        });

        return to_route('recipes.index')
            ->with('success', 'Formula variant berhasil disimpan untuk base 30ml');
    }

    // =========================================================================
    // SHOW
    // =========================================================================

    public function show($variant_id, $intensity_id)
    {
        $recipes = VariantRecipe::with(['ingredient.category', 'variant', 'intensity'])
            ->where('variant_id', $variant_id)
            ->where('intensity_id', $intensity_id)
            ->get();

        if ($recipes->isEmpty()) {
            abort(404, 'Formula tidak ditemukan.');
        }

        $variant   = Variant::findOrFail($variant_id);
        $intensity = Intensity::findOrFail($intensity_id);

        return Inertia::render('Dashboard/Recipes/Show', [
            'recipes'     => $recipes,
            'variant'     => $variant,
            'intensity'   => $intensity,
            'sizePreview' => $this->calculateSizePreview($recipes, $intensity_id),
        ]);
    }

    // =========================================================================
    // EDIT
    // =========================================================================

    public function edit($variant_id, $intensity_id)
    {
        $recipes   = VariantRecipe::with(['ingredient.category'])
            ->where('variant_id', $variant_id)
            ->where('intensity_id', $intensity_id)
            ->get();

        if ($recipes->isEmpty()) {
            abort(404, 'Formula tidak ditemukan.');
        }

        $variant   = Variant::findOrFail($variant_id);
        $intensity = Intensity::findOrFail($intensity_id);

        $sizeQuantities = IntensitySizeQuantity::with('size:id,name,volume_ml')
            ->where('intensity_id', $intensity_id)
            ->where('is_active', true)
            ->get()
            ->sortBy('size.volume_ml')
            ->map(fn($q) => [
                'size'             => $q->size,
                'oil_quantity'     => $q->oil_quantity,
                'alcohol_quantity' => $q->alcohol_quantity,
                'other_quantity'   => $q->other_quantity ?? 0,
                'total_volume'     => $q->total_volume,
            ])->values();

        return Inertia::render('Dashboard/Recipes/Edit', [
            'variant'        => $variant,
            'intensity'      => $intensity,
            'recipes'        => $recipes->map(fn($r) => [
                'id'            => $r->id,
                'ingredient_id' => $r->ingredient_id,
                'base_quantity' => $r->base_quantity,
                'unit'          => $r->unit,
                'notes'         => $r->notes,
                'ingredient'    => $r->ingredient,
            ]),
            'variants'       => Variant::where('is_active', true)->get(['id', 'code', 'name']),
            'intensities'    => Intensity::where('is_active', true)->get(['id', 'code', 'name']),
            'ingredients'    => Material::bahanBaku()
                ->with('category:id,name,ingredient_type')
                ->where('is_active', true)
                ->get(['id', 'code', 'name', 'unit', 'material_category_id']),
            'sizeQuantities' => $sizeQuantities,
        ]);
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    public function update(Request $request, $variant_id, $intensity_id)
    {
        $validated = $request->validate([
            'items'                 => 'required|array|min:1',
            'items.*.ingredient_id' => [
                'required',
                Rule::exists('materials', 'id')->where('material_type', 'bahan_baku'),
            ],
            'items.*.base_quantity' => 'required|numeric|min:0.01',
            'items.*.unit'          => 'nullable|string|max:50',
            'items.*.notes'         => 'nullable|string|max:255',
        ]);

        Variant::findOrFail($variant_id);
        Intensity::findOrFail($intensity_id);

        DB::transaction(function () use ($validated, $variant_id, $intensity_id) {
            // Pertahankan status aktif/nonaktif — delete+recreate tidak boleh
            // diam-diam mengaktifkan kembali formula yang sengaja dinonaktifkan.
            $wasActive = VariantRecipe::where('variant_id', $variant_id)
                ->where('intensity_id', $intensity_id)
                ->value('is_active') ?? true;

            VariantRecipe::where('variant_id', $variant_id)
                ->where('intensity_id', $intensity_id)
                ->delete();

            foreach ($validated['items'] as $item) {
                VariantRecipe::create([
                    'variant_id'    => $variant_id,
                    'intensity_id'  => $intensity_id,
                    'ingredient_id' => $item['ingredient_id'],
                    'base_quantity' => $item['base_quantity'],
                    'unit'          => $item['unit'] ?? 'ml',
                    'notes'         => $item['notes'] ?? null,
                    'is_active'     => $wasActive,
                ]);
            }
        });

        return to_route('recipes.index')
            ->with('success', 'Formula variant berhasil diupdate');
    }

    // =========================================================================
    // TOGGLE ACTIVE — nonaktifkan/aktifkan formula (variant+intensity) tanpa hapus
    // =========================================================================

    public function toggleActive($variant_id, $intensity_id)
    {
        $rows = VariantRecipe::forVariantIntensity($variant_id, $intensity_id)->get();

        if ($rows->isEmpty()) {
            return back()->with('error', 'Formula tidak ditemukan.');
        }

        $newStatus = ! (bool) ($rows->first()->is_active ?? true);

        VariantRecipe::forVariantIntensity($variant_id, $intensity_id)
            ->update(['is_active' => $newStatus]);

        return back()->with('success', $newStatus
            ? 'Formula diaktifkan kembali.'
            : 'Formula dinonaktifkan. Formula ini tidak bisa dipakai untuk generate product baru selama nonaktif.');
    }

    // =========================================================================
    // DESTROY
    // =========================================================================

    public function destroy($variant_id, $intensity_id)
    {
        $exists = VariantRecipe::where('variant_id', $variant_id)
            ->where('intensity_id', $intensity_id)
            ->exists();

        if (!$exists) {
            return back()->with('error', 'Formula tidak ditemukan.');
        }

        DB::transaction(function () use ($variant_id, $intensity_id) {
            VariantRecipe::where('variant_id', $variant_id)
                ->where('intensity_id', $intensity_id)
                ->delete();
        });

        return back()->with('success', 'Formula variant berhasil dihapus');
    }

    // =========================================================================
    // GENERATE PRODUCTS
    // =========================================================================

    public function generateProducts(Request $request, string $variant_id, string $intensity_id)
    {
        $request->validate([
            'regenerate' => 'boolean',
        ]);

        $regenerate = (bool) $request->input('regenerate', false);
        $variant    = Variant::findOrFail($variant_id);
        $intensity  = Intensity::findOrFail($intensity_id);
        $sizes      = Size::where('is_active', true)->get();

        $recipes = VariantRecipe::with('ingredient.category')
            ->where('variant_id', $variant_id)
            ->where('intensity_id', $intensity_id)
            ->get();

        if ($recipes->isEmpty()) {
            return back()->with('error', 'Formula belum ada — buat formula terlebih dahulu.');
        }

        if (! (bool) ($recipes->first()->is_active ?? true)) {
            return back()->with('error', 'Formula ini nonaktif — aktifkan kembali sebelum generate product.');
        }

        if (!$regenerate) {
            $existingCount = Product::where('variant_id', $variant_id)
                ->where('intensity_id', $intensity_id)
                ->count();

            if ($existingCount > 0) {
                return back()->with('warning', 'Products sudah pernah di-generate. Gunakan Regenerate untuk membuat ulang.');
            }
        }

        $generated = 0;
        $skipped   = 0;
        $details   = [];

        DB::transaction(function () use (
            $sizes, $variant, $intensity, $variant_id, $intensity_id,
            $recipes, $regenerate, &$generated, &$skipped, &$details
        ) {
            foreach ($sizes as $size) {
                $sku = $this->generateSKU($variant, $intensity, $size);

                // Lookup by the unique key (sku) so a pre-existing/seeded product
                // with a different id-tuple is matched instead of colliding on insert.
                $existingProduct = Product::withTrashed()
                    ->where(function ($q) use ($variant_id, $intensity_id, $size, $sku) {
                        $q->where(function ($qq) use ($variant_id, $intensity_id, $size) {
                            $qq->where('variant_id', $variant_id)
                               ->where('intensity_id', $intensity_id)
                               ->where('size_id', $size->id);
                        })->orWhere('sku', $sku);
                    })
                    ->first();

                // Skip hanya jika produk LIVE (bukan soft-deleted) sudah ada dan
                // tidak sedang regenerate. Produk trashed harus di-restore, bukan
                // dilewati — kalau tidak, POS tetap kosong walau notif "berhasil".
                if ($existingProduct && !$existingProduct->trashed() && !$regenerate) {
                    $skipped++;
                    $details[] = ['size' => $size->name, 'status' => 'skipped', 'reason' => 'Product sudah ada'];
                    continue;
                }

                $priceRecord = DB::table('intensity_size_prices')
                    ->where('intensity_id', $intensity_id)
                    ->where('size_id', $size->id)
                    ->where('is_active', true)
                    ->first();

                if (!$priceRecord) {
                    $skipped++;
                    $details[] = ['size' => $size->name, 'status' => 'skipped', 'reason' => 'Harga belum dikonfigurasi'];
                    continue;
                }

                $intensityQty = IntensitySizeQuantity::getFor($intensity_id, $size->id);
                if (!$intensityQty) {
                    $skipped++;
                    $details[] = ['size' => $size->name, 'status' => 'skipped', 'reason' => 'Kalibrasi belum dikonfigurasi'];
                    continue;
                }

                $scaledMap = VariantRecipe::scaleCollection($recipes, $intensityQty);

                if ($existingProduct) {
                    if ($existingProduct->trashed()) {
                        $existingProduct->restore();
                    }
                    $existingProduct->recipes()->delete();

                    $product = $existingProduct;
                    $product->update([
                        'sku'           => $sku,
                        'variant_id'    => $variant_id,
                        'intensity_id'  => $intensity_id,
                        'size_id'       => $size->id,
                        'name'          => "{$variant->name} - {$intensity->code} - {$size->name}",
                        'selling_price' => $priceRecord->price,
                        'is_active'     => true,
                    ]);
                } else {
                    $product = Product::create([
                        'sku'           => $sku,
                        'variant_id'    => $variant_id,
                        'intensity_id'  => $intensity_id,
                        'size_id'       => $size->id,
                        'name'          => "{$variant->name} - {$intensity->code} - {$size->name}",
                        'selling_price' => $priceRecord->price,
                        'is_active'     => true,
                    ]);
                }

                foreach ($recipes as $idx => $recipe) {
                    $scaledQty  = $scaledMap[$idx] ?? 0;
                    $ingredient = $recipe->ingredient;

                    ProductRecipe::create([
                        'product_id'    => $product->id,
                        'ingredient_id' => $recipe->ingredient_id,
                        'quantity'      => $scaledQty,
                        'unit'          => $recipe->unit,
                        'unit_cost'     => $ingredient->average_cost ?? 0,
                        'total_cost'    => $scaledQty * ($ingredient->average_cost ?? 0),
                    ]);
                }

                $product->calculateProductionCost();

                $generated++;
                $details[] = ['size' => $size->name, 'status' => 'generated', 'sku' => $product->sku, 'recipes' => $recipes->count()];
            }
        });

        $message = $generated > 0
            ? "{$generated} product berhasil di-generate" . ($skipped > 0 ? ", {$skipped} dilewati" : "")
            : "Tidak ada product baru — {$skipped} size dilewati";

        return back()
            ->with($generated > 0 ? 'success' : 'warning', $message)
            ->with('generateDetails', $details);
    }

    // =========================================================================
    // IMPORT — Download Template
    // =========================================================================

    public function importTemplate()
    {
        $variants    = Variant::where('is_active', true)->orderBy('code')->get(['code', 'name', 'gender']);
        $intensities = Intensity::where('is_active', true)->orderBy('code')->get(['code', 'name', 'oil_ratio', 'alcohol_ratio']);
        $ingredients = Material::bahanBaku()->where('is_active', true)->orderBy('code')->get(['code', 'name', 'unit']);

        // Build workbook dari scratch — tidak bergantung pada file base yang bisa hilang.
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();

        // ── Sheet 1: Import Data ──
        $dataSheet = $spreadsheet->getActiveSheet();
        $dataSheet->setTitle('Import Data');

        $dataSheet->setCellValue('A1', 'TEMPLATE IMPORT FORMULA VARIANT');
        $dataSheet->mergeCells('A1:F1');
        $dataSheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '7C3AED']],
            'alignment' => ['horizontal' => 'center'],
        ]);

        $dataSheet->setCellValue('A2',
            'Isi data mulai baris 4. WAJIB: variant_code, intensity_code, ingredient_code, base_quantity. '
            . 'Total base_quantity per kombinasi = 30ml. Lihat sheet "Referensi Kode". '
            . 'Template dibuat: ' . now()->format('d/m/Y H:i') . ' WIB.'
        );
        $dataSheet->mergeCells('A2:F2');
        $dataSheet->getStyle('A2')->applyFromArray([
            'font' => ['size' => 9, 'italic' => true, 'color' => ['rgb' => 'B45309']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'FEF3C7']],
            'alignment' => ['wrapText' => true],
        ]);

        $headers = ['variant_code', 'intensity_code', 'ingredient_code', 'base_quantity', 'unit', 'notes'];
        foreach ($headers as $i => $h) {
            $col = chr(65 + $i);
            $dataSheet->setCellValue("{$col}3", $h);
            $dataSheet->getStyle("{$col}3")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '1E293B']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'E2E8F0']],
                'borders' => ['bottom' => ['borderStyle' => 'thin']],
            ]);
        }

        // Baris contoh
        $examples = [
            ['FOF', 'EDP', 'BB-001', 12, 'ml', 'Contoh — hapus baris ini'],
            ['FOF', 'EDP', 'ALC-001', 18, 'ml', 'Contoh — hapus baris ini'],
        ];
        $r = 4;
        foreach ($examples as $ex) {
            foreach ($ex as $ci => $cv) {
                $dataSheet->setCellValue(chr(65 + $ci) . $r, $cv);
            }
            $dataSheet->getStyle("A{$r}:F{$r}")->getFont()->setItalic(true)->getColor()->setRGB('94A3B8');
            $r++;
        }

        foreach (range('A', 'F') as $col) {
            $dataSheet->getColumnDimension($col)->setAutoSize(true);
        }

        // ── Sheet 2: Referensi Kode ──
        $refSheet = $spreadsheet->createSheet();
        $refSheet->setTitle('Referensi Kode');
        $refSheet->setCellValue('A1', 'DAFTAR KODE REFERENSI');
        $refSheet->mergeCells('A1:C1');
        $refSheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '0F172A']],
            'alignment' => ['horizontal' => 'center'],
        ]);
        $this->fillReferenceSheet($refSheet, $variants, $intensities, $ingredients);
        foreach (range('A', 'C') as $col) {
            $refSheet->getColumnDimension($col)->setAutoSize(true);
        }

        $spreadsheet->setActiveSheetIndex(0);

        $filename = 'template_import_formula_variant_' . now()->format('Ymd_His') . '.xlsx';
        $tmpDir   = storage_path('app/tmp');
        if (!is_dir($tmpDir)) mkdir($tmpDir, 0755, true);
        $tmpPath = $tmpDir . '/' . $filename;

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save($tmpPath);

        return response()->download($tmpPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    // =========================================================================
    // IMPORT — Index Page
    // =========================================================================

    public function importIndex()
    {
        return Inertia::render('Dashboard/Recipes/Import');
    }

    // =========================================================================
    // IMPORT — Validate
    // =========================================================================

    public function importValidate(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls|max:5120']);

        try {
            $rows   = $this->parseExcel($request->file('file'));
            $result = $this->validateRows($rows);
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Recipe import validate error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal membaca file Excel: ' . $e->getMessage()], 422);
        }
    }

    // =========================================================================
    // IMPORT — Store
    // =========================================================================

    public function importStore(Request $request)
    {
        $request->validate([
            'file'        => 'required|file|mimes:xlsx,xls|max:5120',
            'overwrite'   => 'boolean',
            'skip_errors' => 'boolean',
        ]);

        $overwrite  = $request->boolean('overwrite', true);
        $skipErrors = $request->boolean('skip_errors', true);

        try {
            $rows   = $this->parseExcel($request->file('file'));
            $result = $this->validateRows($rows);
        } catch (\Exception $e) {
            Log::error('Recipe import store error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal membaca file: ' . $e->getMessage()], 422);
        }

        if (!$skipErrors && count($result['errors']) > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Import dibatalkan: ' . count($result['errors']) . ' baris error.',
                'errors'  => $result['errors'],
                'summary' => $result['summary'],
            ], 422);
        }

        if (count($result['valid_rows']) === 0) {
            return response()->json([
                'success' => false, 'message' => 'Tidak ada baris valid.',
                'errors' => $result['errors'], 'summary' => $result['summary'],
                'imported' => 0, 'skipped' => 0, 'overwritten' => 0,
            ], 422);
        }

        $imported = $skipped = $overwritten = 0;

        try {
            DB::transaction(function () use ($result, $overwrite, &$imported, &$skipped, &$overwritten) {
                $groups = [];
                foreach ($result['valid_rows'] as $row) {
                    $key = $row['variant_id'] . '|' . $row['intensity_id'];
                    $groups[$key][] = $row;
                }

                foreach ($groups as $key => $items) {
                    [$variantId, $intensityId] = explode('|', $key);

                    $exists = VariantRecipe::where('variant_id', $variantId)
                        ->where('intensity_id', $intensityId)->exists();

                    if ($exists && !$overwrite) { $skipped += count($items); continue; }
                    if ($exists) {
                        VariantRecipe::where('variant_id', $variantId)->where('intensity_id', $intensityId)->delete();
                        $overwritten++;
                    }

                    foreach ($items as $item) {
                        VariantRecipe::create([
                            'variant_id'    => $variantId,
                            'intensity_id'  => $intensityId,
                            'ingredient_id' => $item['ingredient_id'],
                            'base_quantity' => $item['base_quantity'],
                            'unit'          => $item['unit'],
                            'notes'         => $item['notes'],
                        ]);
                        $imported++;
                    }
                }
            });
        } catch (\Exception $e) {
            Log::error('Recipe import transaction error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Kesalahan: ' . $e->getMessage()], 500);
        }

        return response()->json([
            'success'     => true,
            'message'     => "Import selesai: {$imported} baris disimpan, {$skipped} dilewati, {$overwritten} ditimpa.",
            'imported'    => $imported, 'skipped' => $skipped, 'overwritten' => $overwritten,
            'errors'      => $result['errors'], 'summary' => $result['summary'],
        ]);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private function calculateSizePreview($recipes, string $intensityId): array
    {
        $sizes = Size::where('is_active', true)->orderBy('volume_ml')->get();

        return $sizes->map(function ($size) use ($recipes, $intensityId) {
            $intensityQty = IntensitySizeQuantity::getFor($intensityId, $size->id);

            if (!$intensityQty) {
                $baseTotalVolume = $recipes->sum(fn($r) => (float) $r->base_quantity);
                return [
                    'size'          => $size,
                    'total_volume'  => $size->volume_ml,
                    'is_calibrated' => false,
                    'ingredients'   => $recipes->map(fn($recipe) => [
                        'ingredient'        => $recipe->ingredient,
                        'ingredient_type'   => $recipe->ingredient->category->ingredient_type ?? 'other',
                        'original_quantity' => (float) $recipe->base_quantity,
                        'scaled_quantity'   => $recipe->getFallbackScaledQty($baseTotalVolume, $size->volume_ml),
                        'unit'              => $recipe->unit,
                    ])->values(),
                ];
            }

            $scaledMap = VariantRecipe::scaleCollection($recipes, $intensityQty);

            return [
                'size'             => $size,
                'total_volume'     => $intensityQty->total_volume,
                'is_calibrated'    => true,
                'oil_quantity'     => $intensityQty->oil_quantity,
                'alcohol_quantity' => $intensityQty->alcohol_quantity,
                'other_quantity'   => $intensityQty->other_quantity ?? 0,
                'ingredients'      => $recipes->map(function ($recipe, $idx) use ($scaledMap) {
                    return [
                        'ingredient'        => $recipe->ingredient,
                        'ingredient_type'   => $recipe->ingredient->category->ingredient_type ?? 'other',
                        'original_quantity' => (float) $recipe->base_quantity,
                        'scaled_quantity'   => $scaledMap[$idx] ?? 0,
                        'unit'              => $recipe->unit,
                    ];
                })->values(),
            ];
        })->toArray();
    }

    private function buildScaledIngredients($recipes, IntensitySizeQuantity $intensityQty): array
    {
        $scaledMap = VariantRecipe::scaleCollection($recipes, $intensityQty);

        return $recipes->map(function ($recipe, $idx) use ($scaledMap) {
            return [
                'ingredient_id'   => $recipe->ingredient_id,
                'name'            => $recipe->ingredient->name ?? '—',
                'ingredient_type' => $recipe->ingredient->category->ingredient_type ?? 'other',
                'scaled_quantity' => $scaledMap[$idx] ?? 0,
                'unit'            => $recipe->unit,
            ];
        })->values()->toArray();
    }

    private function generateSKU($variant, $intensity, $size): string
    {
        // Pakai kode variant PENUH — bukan 3 huruf pertama.
        // substr(...,0,3) bikin "HER" dan "HERO" tabrakan → SKU tidak unik antar variant.
        return sprintf('%s-%s-%d',
            strtoupper($variant->code),
            strtoupper($intensity->code),
            $size->volume_ml
        );
    }

    private function parseExcel($file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet       = $spreadsheet->getSheetByName('Import Data') ?? $spreadsheet->getActiveSheet();
        $rows        = [];
        $maxRow      = $sheet->getHighestDataRow();

        for ($r = 4; $r <= $maxRow; $r++) {
            $variantCode    = trim((string) $sheet->getCell("A{$r}")->getValue());
            $intensityCode  = trim((string) $sheet->getCell("B{$r}")->getValue());
            $ingredientCode = trim((string) $sheet->getCell("C{$r}")->getValue());
            $baseQuantity   = $sheet->getCell("D{$r}")->getValue();
            $unit           = trim((string) ($sheet->getCell("E{$r}")->getValue() ?? 'ml')) ?: 'ml';
            $notes          = trim((string) ($sheet->getCell("F{$r}")->getValue() ?? ''));

            if ($variantCode === '' && $intensityCode === '' && $ingredientCode === '') continue;

            $rows[] = [
                'row'             => $r,
                'variant_code'    => $variantCode,
                'intensity_code'  => $intensityCode,
                'ingredient_code' => $ingredientCode,
                'base_quantity'   => $baseQuantity,
                'unit'            => $unit,
                'notes'           => $notes,
            ];
        }
        return $rows;
    }

    private function validateRows(array $rows): array
    {
        $variants    = Variant::where('is_active', true)->pluck('id', 'code');
        $intensities = Intensity::where('is_active', true)->pluck('id', 'code');
        $ingredients = Material::bahanBaku()->where('is_active', true)->pluck('id', 'code');

        $validRows = [];
        $errorRows = [];
        $groupQty  = [];

        foreach ($rows as $row) {
            $rowErrors = [];

            if (empty($row['variant_code']))    $rowErrors[] = 'variant_code wajib diisi';
            elseif (!$variants->has($row['variant_code'])) $rowErrors[] = "variant_code '{$row['variant_code']}' tidak ditemukan";

            if (empty($row['intensity_code']))  $rowErrors[] = 'intensity_code wajib diisi';
            elseif (!$intensities->has($row['intensity_code'])) $rowErrors[] = "intensity_code '{$row['intensity_code']}' tidak ditemukan";

            if (empty($row['ingredient_code'])) $rowErrors[] = 'ingredient_code wajib diisi';
            elseif (!$ingredients->has($row['ingredient_code'])) $rowErrors[] = "ingredient_code '{$row['ingredient_code']}' tidak ditemukan";

            $qty = is_numeric($row['base_quantity']) ? (float) $row['base_quantity'] : null;
            if ($qty === null) $rowErrors[] = 'base_quantity harus angka';
            elseif ($qty <= 0) $rowErrors[] = 'base_quantity harus > 0';

            if (!empty($rowErrors)) {
                $errorRows[] = ['row' => $row['row'], 'data' => $row, 'errors' => $rowErrors];
                continue;
            }

            $groupKey = $row['variant_code'] . '|' . $row['intensity_code'];
            $groupQty[$groupKey] = ($groupQty[$groupKey] ?? 0) + $qty;

            $validRows[] = array_merge($row, [
                'variant_id'    => $variants->get($row['variant_code']),
                'intensity_id'  => $intensities->get($row['intensity_code']),
                'ingredient_id' => $ingredients->get($row['ingredient_code']),
                'base_quantity' => $qty,
            ]);
        }

        $volumeWarnings = [];
        foreach ($groupQty as $key => $total) {
            if (abs($total - 30) > 0.5) {
                [$vc, $ic] = explode('|', $key);
                $volumeWarnings[] = "Kombinasi {$vc} + {$ic}: total = {$total}ml (seharusnya 30ml)";
            }
        }

        $summary = [];
        $grouped = collect($validRows)->groupBy(fn($r) => $r['variant_code'] . ' + ' . $r['intensity_code']);
        foreach ($grouped as $combo => $items) {
            $total     = $items->sum('base_quantity');
            $summary[] = [
                'combination'      => $combo,
                'ingredient_count' => $items->count(),
                'total_volume'     => round($total, 2),
                'is_valid_volume'  => abs($total - 30) <= 0.5,
            ];
        }

        return [
            'valid_rows'      => $validRows,
            'errors'          => $errorRows,
            'volume_warnings' => $volumeWarnings,
            'summary'         => $summary,
            'total_rows'      => count($rows),
            'valid_count'     => count($validRows),
            'error_count'     => count($errorRows),
        ];
    }

    private function fillReferenceSheet($sheet, $variants, $intensities, $ingredients): void
    {
        $headerStyle = [
            'font' => ['bold' => true, 'size' => 9, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'EEF2FF']],
        ];
        $dataStyle = ['font' => ['size' => 9], 'alignment' => ['vertical' => 'center']];

        $row = 2;

        $sections = [
            ['title' => 'KODE VARIANT',    'color' => '7C3AED', 'headers' => ['A' => 'Kode', 'B' => 'Nama Variant',    'C' => 'Gender'],             'data' => $variants,    'fields' => ['code', 'name', 'gender']],
            ['title' => 'KODE INTENSITAS', 'color' => '0369A1', 'headers' => ['A' => 'Kode', 'B' => 'Nama Intensitas', 'C' => 'Rasio (Oil:Alcohol)'], 'data' => $intensities, 'fields' => ['code', 'name', null]],
            ['title' => 'KODE BAHAN BAKU', 'color' => '065F46', 'headers' => ['A' => 'Kode', 'B' => 'Nama Bahan',      'C' => 'Satuan'],             'data' => $ingredients, 'fields' => ['code', 'name', 'unit']],
        ];

        foreach ($sections as $section) {
            $sheet->setCellValue("A{$row}", $section['title']);
            $sheet->mergeCells("A{$row}:C{$row}");
            $sheet->getStyle("A{$row}")->applyFromArray([
                'font'      => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill'      => ['fillType' => 'solid', 'startColor' => ['rgb' => $section['color']]],
                'alignment' => ['horizontal' => 'center'],
            ]);
            $row++;

            foreach ($section['headers'] as $col => $label) {
                $sheet->setCellValue("{$col}{$row}", $label);
                $sheet->getStyle("{$col}{$row}")->applyFromArray($headerStyle);
            }
            $row++;

            foreach ($section['data'] as $item) {
                $sheet->setCellValue("A{$row}", $item->{$section['fields'][0]});
                $sheet->setCellValue("B{$row}", $item->{$section['fields'][1]});
                if ($section['fields'][2]) {
                    $val = $section['title'] === 'KODE INTENSITAS'
                        ? "{$item->oil_ratio}:{$item->alcohol_ratio}"
                        : $item->{$section['fields'][2]};
                    $sheet->setCellValue("C{$row}", $val);
                }
                $sheet->getStyle("A{$row}:C{$row}")->applyFromArray($dataStyle);
                $row++;
            }
            $row++;
        }
    }
}