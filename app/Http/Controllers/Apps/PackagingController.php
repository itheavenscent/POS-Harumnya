<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\PackagingCategory;
use App\Models\PackagingMaterial;
use App\Models\Size;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class PackagingController extends Controller
{
    public function index(Request $request)
    {
        $materials = PackagingMaterial::query()
            ->with([
                'category:id,name',
                'size:id,name',
                // Komponen + stok komponen → hitung ketersediaan rakitan
                'components.component' => fn ($q) => $q
                    ->withSum('warehouseStocks as warehouse_qty', 'quantity')
                    ->withSum('storeStocks as store_qty', 'quantity'),
            ])
            ->withSum('warehouseStocks as warehouse_qty', 'quantity')
            ->withSum('storeStocks as store_qty', 'quantity')
            ->when($request->search,      fn($q) => $q->search($request->search))
            ->when($request->category_id, fn($q) => $q->where('packaging_category_id', $request->category_id))
            ->when($request->filled('is_assembly'), fn($q) => $q->where('is_assembly', $request->boolean('is_assembly')))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(function ($item) {
                if ($item->is_assembly && $item->components->isNotEmpty()) {
                    // Stok rakitan virtual = min(stok komponen ÷ qty per unit)
                    $totalQty = (int) $item->components->min(function ($line) {
                        $compStock = (int) ($line->component?->warehouse_qty ?? 0)
                                   + (int) ($line->component?->store_qty ?? 0);
                        $per = max(1, (int) $line->quantity);
                        return intdiv($compStock, $per);
                    });
                    // HPP rakitan = Σ komponen
                    $avgCost = (float) $item->assembled_cost;
                } else {
                    $totalQty = (int) ($item->warehouse_qty ?? 0) + (int) ($item->store_qty ?? 0);
                    $avgCost  = $totalQty > 0 ? $item->average_cost : 0;
                }

                return [
                'id'                    => $item->id,
                'code'                  => $item->code,
                'name'                  => $item->name,
                'unit'                  => $item->unit,
                'image_url'             => $item->image_url,
                'description'           => $item->description,
                'purchase_price'        => $item->purchase_price,
                'selling_price'         => $item->selling_price,
                'is_free'               => $item->is_free,
                'free_condition_note'   => $item->free_condition_note,
                'effective_selling_price' => $item->effective_selling_price,
                'total_qty'             => $totalQty,
                // Stok habis → HPP ikut 0
                'average_cost'          => $avgCost,
                'is_available_as_addon' => $item->is_available_as_addon,
                'is_assembly'           => $item->is_assembly,
                'is_active'             => $item->is_active,
                'sort_order'            => $item->sort_order,
                'category'              => $item->category
                    ? ['id' => $item->category->id, 'name' => $item->category->name]
                    : null,
                'size' => $item->size
                    ? ['id' => $item->size->id, 'name' => $item->size->name]
                    : null,
                ];
            });

        $categories = PackagingCategory::orderBy('sort_order')->orderBy('name')->get();

        return Inertia::render('Dashboard/Packaging/Index', [
            'materials'  => $materials,
            'categories' => $categories,
            'filters'    => $request->only(['search', 'category_id', 'tab', 'is_assembly']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Packaging/Create', [
            'categories' => PackagingCategory::where('is_active', true)->orderBy('sort_order')->get(),
            'sizes'      => Size::orderBy('sort_order')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'packaging_category_id' => 'required|exists:packaging_categories,id',
            'code'                  => 'required|string|max:100|unique:packaging_materials,code',
            'name'                  => 'required|string|max:255',
            'unit'                  => 'required|string|max:50',
            'size_id'               => 'nullable|exists:sizes,id',
            'image'                 => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'description'           => 'nullable|string',
            'purchase_price'        => 'nullable|numeric|min:0',
            'selling_price'         => 'nullable|numeric|min:0',
            'is_free'               => 'boolean',
            'free_condition_note'   => 'nullable|string|max:255',
            'is_available_as_addon' => 'boolean',
            'is_assembly'           => 'boolean',
            'is_active'             => 'boolean',
            'sort_order'            => 'nullable|integer|min:0',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('packaging', 'public');
        }

        $data['average_cost'] = $data['purchase_price'] ?? 0;
        $data['sort_order']   = $data['sort_order'] ?? 0;

        // Jika is_free aktif tapi selling_price tidak diset, pastikan 0
        if (!empty($data['is_free'])) {
            $data['selling_price'] = $data['selling_price'] ?? 0;
        }

        PackagingMaterial::create($data);

        return redirect()->route('packaging.index')
            ->with('success', 'Material kemasan berhasil ditambahkan!');
    }

    public function edit(PackagingMaterial $packaging)
    {
        return Inertia::render('Dashboard/Packaging/Edit', [
            'packaging' => [
                'id'                    => $packaging->id,
                'code'                  => $packaging->code,
                'name'                  => $packaging->name,
                'unit'                  => $packaging->unit,
                'size_id'               => $packaging->size_id,
                'image_url'             => $packaging->image_url,
                'description'           => $packaging->description,
                'purchase_price'        => $packaging->purchase_price,
                'selling_price'         => $packaging->selling_price,
                'is_free'               => $packaging->is_free,
                'free_condition_note'   => $packaging->free_condition_note,
                'average_cost'          => $packaging->average_cost,
                'is_available_as_addon' => $packaging->is_available_as_addon,
                'is_assembly'           => $packaging->is_assembly,
                'is_active'             => $packaging->is_active,
                'sort_order'            => $packaging->sort_order,
                'packaging_category_id' => $packaging->packaging_category_id,
            ],
            'categories' => PackagingCategory::orderBy('sort_order')->get(),
            'sizes'      => Size::orderBy('sort_order')->get(),
        ]);
    }

    // ─── Assembly BOM (Komponen Rakitan) ─────────────────────────────────

    /**
     * Halaman kelola komponen (BOM) untuk kemasan rakitan.
     */
    public function editComponents(PackagingMaterial $packaging)
    {
        $packaging->load('components.component:id,code,name,unit,average_cost');

        // Kandidat komponen: material lain (bukan diri sendiri, bukan rakitan lain
        // untuk cegah BOM bersarang), aktif.
        $candidates = PackagingMaterial::query()
            ->where('id', '!=', $packaging->id)
            ->where('is_assembly', false)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'unit', 'average_cost']);

        return Inertia::render('Dashboard/Packaging/Components', [
            'packaging' => [
                'id'          => $packaging->id,
                'code'        => $packaging->code,
                'name'        => $packaging->name,
                'unit'        => $packaging->unit,
                'is_assembly' => $packaging->is_assembly,
            ],
            'components' => $packaging->components->map(fn ($line) => [
                'id'                     => $line->id,
                'component_packaging_id' => $line->component_packaging_id,
                'name'                   => $line->component?->name,
                'code'                   => $line->component?->code,
                'unit'                   => $line->component?->unit,
                'average_cost'           => (float) ($line->component?->average_cost ?? 0),
                'quantity'               => $line->quantity,
            ])->values(),
            'candidates' => $candidates,
        ]);
    }

    /**
     * Simpan (sync) daftar komponen BOM untuk kemasan rakitan.
     */
    public function syncComponents(Request $request, PackagingMaterial $packaging)
    {
        $data = $request->validate([
            'components'                          => 'present|array',
            'components.*.component_packaging_id' => [
                'required', 'uuid', 'exists:packaging_materials,id',
                Rule::notIn(PackagingMaterial::where('is_assembly', true)->pluck('id')),
            ],
            'components.*.quantity'               => 'required|integer|min:1',
        ], [
            'components.*.component_packaging_id.not_in' => 'Komponen tidak boleh kemasan rakitan lain (BOM bersarang tidak didukung).',
        ], [
            'components.*.component_packaging_id' => 'komponen',
            'components.*.quantity'               => 'jumlah',
        ]);

        // Cegah komponen = diri sendiri & duplikat.
        $seen = [];
        foreach ($data['components'] as $row) {
            $cid = $row['component_packaging_id'];
            if ($cid === $packaging->id) {
                return back()->with('error', 'Komponen tidak boleh kemasan itu sendiri.');
            }
            if (isset($seen[$cid])) {
                return back()->with('error', 'Ada komponen duplikat.');
            }
            $seen[$cid] = true;
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($packaging, $data) {
            $packaging->components()->delete();

            foreach ($data['components'] as $row) {
                $packaging->components()->create([
                    'component_packaging_id' => $row['component_packaging_id'],
                    'quantity'               => (int) $row['quantity'],
                ]);
            }

            // Otomatis tandai sebagai rakitan jika punya komponen.
            $packaging->update(['is_assembly' => count($data['components']) > 0]);
        });

        return redirect()->route('packaging.index')
            ->with('success', 'Komponen rakitan berhasil disimpan!');
    }

    public function update(Request $request, PackagingMaterial $packaging)
    {
        $data = $request->validate([
            'packaging_category_id' => 'required|exists:packaging_categories,id',
            'code'                  => ['required', 'string', 'max:100', Rule::unique('packaging_materials')->ignore($packaging->id)],
            'name'                  => 'required|string|max:255',
            'unit'                  => 'required|string|max:50',
            'size_id'               => 'nullable|exists:sizes,id',
            'image'                 => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'description'           => 'nullable|string',
            'purchase_price'        => 'nullable|numeric|min:0',
            'selling_price'         => 'nullable|numeric|min:0',
            'is_free'               => 'boolean',
            'free_condition_note'   => 'nullable|string|max:255',
            'is_available_as_addon' => 'boolean',
            'is_assembly'           => 'boolean',
            'is_active'             => 'boolean',
            'sort_order'            => 'nullable|integer|min:0',
            // average_cost TIDAK boleh diubah manual — hanya via WAC saat purchase
        ]);

        if ($request->hasFile('image')) {
            if ($packaging->image) {
                Storage::disk('public')->delete($packaging->image);
            }
            $data['image'] = $request->file('image')->store('packaging', 'public');
        } else {
            unset($data['image']);
        }

        if ((float) $packaging->average_cost === 0.0 && isset($data['purchase_price'])) {
            $data['average_cost'] = $data['purchase_price'];
        }

        $packaging->update($data);

        return redirect()->route('packaging.index')
            ->with('success', 'Material kemasan berhasil diperbarui!');
    }

    public function destroy(PackagingMaterial $packaging)
    {
        if ($packaging->image) {
            Storage::disk('public')->delete($packaging->image);
        }
        $packaging->delete();
        return back()->with('success', 'Material kemasan berhasil dihapus!');
    }

    // ─── Category Actions ────────────────────────────────────────────────

    public function storeCategory(Request $request)
    {
        PackagingCategory::create($request->validate([
            'code'        => 'required|string|max:50|unique:packaging_categories,code',
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
            'sort_order'  => 'nullable|integer|min:0',
        ]));
        return back()->with('success', 'Kategori berhasil dibuat!');
    }

    public function updateCategory(Request $request, PackagingCategory $category)
    {
        $category->update($request->validate([
            'code'        => ['required', 'string', 'max:50', Rule::unique('packaging_categories')->ignore($category->id)],
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
            'sort_order'  => 'nullable|integer|min:0',
        ]));
        return back()->with('success', 'Kategori diperbarui!');
    }

    public function destroyCategory(PackagingCategory $category)
    {
        if ($category->materials()->exists()) {
            return back()->with('error', 'Gagal: Kategori masih memiliki material di dalamnya. Pindahkan atau hapus material terlebih dahulu.');
        }
        $category->delete();
        return back()->with('success', 'Kategori berhasil dihapus!');
    }
}
