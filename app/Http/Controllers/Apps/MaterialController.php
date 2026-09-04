<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Http\Requests\Material\StoreMaterialRequest;
use App\Http\Requests\Material\UpdateMaterialRequest;
use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\Size;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MaterialController extends Controller
{
    // ─── Materials ───────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $materialType = $request->input('material_type', 'bahan_baku');
        $isKemasan    = $materialType === 'bahan_kemasan';

        $query = Material::query()
            ->where('material_type', $materialType)
            ->with('category:id,name,ingredient_type,material_type');

        if ($isKemasan) {
            $query->with([
                'size:id,name',
                // Komponen + stok komponen → hitung ketersediaan rakitan
                'components.component' => fn ($q) => $q
                    ->withSum('warehousePackagingStocks as warehouse_qty', 'quantity')
                    ->withSum('storePackagingStocks as store_qty', 'quantity'),
            ])
            ->withSum('warehousePackagingStocks as warehouse_qty', 'quantity')
            ->withSum('storePackagingStocks as store_qty', 'quantity')
            ->when($request->filled('is_assembly'), fn ($q) => $q->where('is_assembly', $request->boolean('is_assembly')));
        } else {
            $query->withSum('warehouseIngredientStocks as warehouse_qty', 'quantity')
                  ->withSum('storeIngredientStocks as store_qty', 'quantity');
        }

        $materials = $query
            ->when($request->search,      fn ($q) => $q->search($request->search))
            ->when($request->category_id, fn ($q) => $q->where('material_category_id', $request->category_id))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate($isKemasan ? 10 : 15)
            ->withQueryString()
            ->through(function ($item) use ($isKemasan) {
                if ($isKemasan) {
                    if ($item->is_assembly && $item->components->isNotEmpty()) {
                        // Stok rakitan virtual = min(stok komponen ÷ qty per unit)
                        $totalQty = (int) $item->components->min(function ($line) {
                            $compStock = (int) ($line->component?->warehouse_qty ?? 0)
                                       + (int) ($line->component?->store_qty ?? 0);
                            $per = max(1, (int) $line->quantity);
                            return intdiv($compStock, $per);
                        });
                        $avgCost = (float) $item->assembled_cost;
                    } else {
                        $totalQty = (int) ($item->warehouse_qty ?? 0) + (int) ($item->store_qty ?? 0);
                        $avgCost  = $totalQty > 0 ? $item->average_cost : 0;
                    }

                    return [
                        'id'                       => $item->id,
                        'code'                     => $item->code,
                        'name'                     => $item->name,
                        'unit'                     => $item->unit,
                        'image_url'                => $item->image_url,
                        'description'              => $item->description,
                        'purchase_price'           => $item->purchase_price,
                        'selling_price'            => $item->selling_price,
                        'is_free'                  => $item->is_free,
                        'free_condition_note'      => $item->free_condition_note,
                        'effective_selling_price'  => $item->effective_selling_price,
                        'total_qty'                => $totalQty,
                        'average_cost'             => $avgCost,
                        'is_available_as_addon'    => $item->is_available_as_addon,
                        'is_assembly'              => $item->is_assembly,
                        'is_active'                => $item->is_active,
                        'sort_order'               => $item->sort_order,
                        'category'                 => $item->category
                            ? ['id' => $item->category->id, 'name' => $item->category->name]
                            : null,
                        'size' => $item->size
                            ? ['id' => $item->size->id, 'name' => $item->size->name]
                            : null,
                    ];
                }

                $totalQty = (int) ($item->warehouse_qty ?? 0) + (int) ($item->store_qty ?? 0);

                return [
                    'id'            => $item->id,
                    'code'          => $item->code,
                    'name'          => $item->name,
                    'unit'          => $item->unit,
                    'description'   => $item->description,
                    'image_url'     => $item->image_url,
                    'total_qty'     => $totalQty,
                    // Stok habis → HPP ikut 0
                    'average_cost'  => $totalQty > 0 ? $item->average_cost : 0,
                    'selling_price' => $item->selling_price,
                    'is_active'     => $item->is_active,
                    'sort_order'    => $item->sort_order,
                    'category'      => $item->category ? [
                        'id'              => $item->category->id,
                        'name'            => $item->category->name,
                        'ingredient_type' => $item->category->ingredient_type,
                    ] : null,
                ];
            });

        $categories = MaterialCategory::where('material_type', $materialType)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'material_type', 'ingredient_type', 'sort_order', 'is_active']);

        return Inertia::render('Dashboard/Materials/Index', [
            'materials'     => $materials,
            'categories'    => $categories,
            'material_type' => $materialType,
            'filters'       => $request->only(['search', 'category_id', 'tab', 'is_assembly']),
        ]);
    }

    public function create(Request $request)
    {
        $materialType = $request->input('material_type', 'bahan_baku');

        return Inertia::render('Dashboard/Materials/Create', [
            'material_type' => $materialType,
            'categories'    => MaterialCategory::where('material_type', $materialType)
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'ingredient_type']),
            'sizes' => Size::orderBy('sort_order')->get(),
        ]);
    }

    public function store(StoreMaterialRequest $request)
    {
        $data = $request->validated();
        $isKemasan = $data['material_type'] === 'bahan_kemasan';

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('materials', 'public');
        }

        $data['selling_price'] = isset($data['selling_price']) && $data['selling_price'] !== ''
            ? $data['selling_price']
            : null;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        if ($isKemasan) {
            $data['average_cost'] = $data['purchase_price'] ?? 0;
            if (! empty($data['is_free'])) {
                $data['selling_price'] = $data['selling_price'] ?? 0;
            }
        } else {
            $data['average_cost'] = 0;
            unset($data['size_id'], $data['purchase_price'], $data['is_free'], $data['free_condition_note'], $data['is_available_as_addon'], $data['is_assembly']);
        }

        Material::create($data);

        $label = $isKemasan ? 'Material kemasan' : 'Bahan Baku';

        return redirect()->route('materials.index', ['material_type' => $data['material_type']])
            ->with('success', "{$label} berhasil ditambahkan!");
    }

    public function edit(Material $material)
    {
        $isKemasan = $material->material_type === 'bahan_kemasan';

        return Inertia::render('Dashboard/Materials/Edit', [
            'material' => [
                'id'                     => $material->id,
                'material_type'          => $material->material_type,
                'code'                   => $material->code,
                'name'                   => $material->name,
                'unit'                   => $material->unit,
                'description'            => $material->description,
                'image_url'              => $material->image_url,
                'average_cost'           => $material->average_cost,
                'selling_price'          => $material->selling_price,
                'is_active'              => $material->is_active,
                'sort_order'             => $material->sort_order,
                'material_category_id'   => $material->material_category_id,
                'size_id'                => $material->size_id,
                'purchase_price'         => $material->purchase_price,
                'is_free'                => $material->is_free,
                'free_condition_note'    => $material->free_condition_note,
                'is_available_as_addon'  => $material->is_available_as_addon,
                'is_assembly'            => $material->is_assembly,
            ],
            'categories' => MaterialCategory::where('material_type', $material->material_type)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'ingredient_type']),
            'sizes' => Size::orderBy('sort_order')->get(),
        ]);
    }

    public function update(UpdateMaterialRequest $request, Material $material)
    {
        $data = $request->validated();
        $isKemasan = $data['material_type'] === 'bahan_kemasan';

        if ($request->hasFile('image')) {
            if ($material->image) {
                Storage::disk('public')->delete($material->image);
            }
            $data['image'] = $request->file('image')->store('materials', 'public');
        } elseif ($request->boolean('remove_image')) {
            if ($material->image) {
                Storage::disk('public')->delete($material->image);
            }
            $data['image'] = null;
        } else {
            unset($data['image']);
        }
        unset($data['remove_image']);

        $data['selling_price'] = array_key_exists('selling_price', $data) && $data['selling_price'] !== ''
            ? $data['selling_price']
            : null;
        $data['sort_order'] = $data['sort_order'] ?? $material->sort_order;

        if ($isKemasan) {
            // average_cost TIDAK boleh diubah manual — hanya via WAC saat purchase.
            // Bootstrap sekali saja kalau masih 0 (material baru dibuat, belum pernah PO).
            if ((float) $material->average_cost === 0.0 && isset($data['purchase_price'])) {
                $data['average_cost'] = $data['purchase_price'];
            }
            if (! empty($data['is_free'])) {
                $data['selling_price'] = $data['selling_price'] ?? 0;
            }
        } else {
            unset($data['size_id'], $data['purchase_price'], $data['is_free'], $data['free_condition_note'], $data['is_available_as_addon'], $data['is_assembly']);
        }

        $material->update($data);

        $label = $isKemasan ? 'Material kemasan' : 'Bahan Baku';

        return redirect()->route('materials.index', ['material_type' => $data['material_type']])
            ->with('success', "{$label} berhasil diperbarui!");
    }

    public function destroy(Material $material)
    {
        $label = $material->material_type === 'bahan_kemasan' ? 'Material kemasan' : 'Bahan Baku';

        if ($material->material_type === 'bahan_baku') {
            if ($material->variantRecipes()->exists()) {
                return back()->with('error', 'Gagal: Bahan masih digunakan di formula variant.');
            }
            if ($material->productRecipes()->exists()) {
                return back()->with('error', 'Gagal: Bahan masih digunakan di resep produk.');
            }
        }

        // Soft delete: foto TIDAK dihapus dari disk supaya bisa di-restore.
        $material->delete();

        return back()->with('success', "{$label} berhasil dihapus!");
    }

    // ─── Assembly BOM (Komponen Rakitan, bahan_kemasan saja) ─────────────

    public function editComponents(Material $material)
    {
        $material->load('components.component:id,code,name,unit,average_cost');

        $candidates = Material::query()
            ->where('material_type', 'bahan_kemasan')
            ->where('id', '!=', $material->id)
            ->where('is_assembly', false)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'unit', 'average_cost']);

        return Inertia::render('Dashboard/Materials/Components', [
            'material' => [
                'id'          => $material->id,
                'code'        => $material->code,
                'name'        => $material->name,
                'unit'        => $material->unit,
                'is_assembly' => $material->is_assembly,
            ],
            'components' => $material->components->map(fn ($line) => [
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

    public function syncComponents(Request $request, Material $material)
    {
        $data = $request->validate([
            'components'                          => 'present|array',
            'components.*.component_packaging_id' => [
                'required', 'uuid',
                Rule::exists('materials', 'id')->where('material_type', 'bahan_kemasan'),
                Rule::notIn(Material::where('material_type', 'bahan_kemasan')->where('is_assembly', true)->pluck('id')),
            ],
            'components.*.quantity' => 'required|integer|min:1',
        ], [
            'components.*.component_packaging_id.not_in' => 'Komponen tidak boleh kemasan rakitan lain (BOM bersarang tidak didukung).',
        ], [
            'components.*.component_packaging_id' => 'komponen',
            'components.*.quantity'                => 'jumlah',
        ]);

        $seen = [];
        foreach ($data['components'] as $row) {
            $cid = $row['component_packaging_id'];
            if ($cid === $material->id) {
                return back()->with('error', 'Komponen tidak boleh kemasan itu sendiri.');
            }
            if (isset($seen[$cid])) {
                return back()->with('error', 'Ada komponen duplikat.');
            }
            $seen[$cid] = true;
        }

        DB::transaction(function () use ($material, $data) {
            $material->components()->delete();

            foreach ($data['components'] as $row) {
                $material->components()->create([
                    'component_packaging_id' => $row['component_packaging_id'],
                    'quantity'               => (int) $row['quantity'],
                ]);
            }

            $material->update(['is_assembly' => count($data['components']) > 0]);
        });

        return redirect()->route('materials.index', ['material_type' => 'bahan_kemasan'])
            ->with('success', 'Komponen rakitan berhasil disimpan!');
    }

    // ─── Categories ───────────────────────────────────────────────────────

    public function storeCategory(Request $request)
    {
        $materialType = $request->input('material_type', 'bahan_baku');

        $rules = [
            'material_type' => ['required', Rule::in(['bahan_baku', 'bahan_kemasan'])],
            'code'           => ['required', 'string', 'max:50', 'unique:material_categories,code'],
            'name'           => ['required', 'string', 'max:100'],
            'description'    => ['nullable', 'string', 'max:500'],
            'sort_order'     => ['nullable', 'integer', 'min:0'],
            'is_active'      => ['boolean'],
        ];
        if ($materialType === 'bahan_baku') {
            $rules['ingredient_type'] = ['required', Rule::in(['oil', 'alcohol', 'other'])];
        }

        $data = $request->validate($rules);
        MaterialCategory::create($data);

        return back()->with('success', 'Kategori berhasil ditambahkan!');
    }

    public function updateCategory(Request $request, MaterialCategory $category)
    {
        $rules = [
            'code'        => ['required', 'string', 'max:50', Rule::unique('material_categories')->ignore($category->id)],
            'name'        => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'is_active'   => ['boolean'],
        ];
        if ($category->material_type === 'bahan_baku') {
            $rules['ingredient_type'] = ['required', Rule::in(['oil', 'alcohol', 'other'])];
        }

        $category->update($request->validate($rules));

        return back()->with('success', 'Kategori berhasil diperbarui!');
    }

    public function destroyCategory(MaterialCategory $category)
    {
        if ($category->materials()->exists()) {
            return back()->with('error', 'Gagal: Kategori masih memiliki material di dalamnya. Pindahkan atau hapus material terlebih dahulu.');
        }

        $category->delete();

        return back()->with('success', 'Kategori berhasil dihapus!');
    }
}
