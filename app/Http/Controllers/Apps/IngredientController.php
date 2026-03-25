<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ingredient\StoreIngredientRequest;
use App\Http\Requests\Ingredient\UpdateIngredientRequest;
use App\Models\Ingredient;
use App\Models\IngredientCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class IngredientController extends Controller
{
    // ─── Ingredients ─────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $ingredients = Ingredient::query()
            ->with('category:id,name,ingredient_type')
            ->when($request->search,      fn($q) => $q->search($request->search))
            ->when($request->category_id, fn($q) => $q->where('ingredient_category_id', $request->category_id))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn($item) => [
                'id'            => $item->id,
                'code'          => $item->code,
                'name'          => $item->name,
                'unit'          => $item->unit,
                'description'   => $item->description,
                'image_url'     => $item->image_url,
                'average_cost'  => $item->average_cost,
                'selling_price' => $item->selling_price,
                'is_active'     => $item->is_active,
                'sort_order'    => $item->sort_order,
                'category'      => $item->category ? [
                    'id'              => $item->category->id,
                    'name'            => $item->category->name,
                    'ingredient_type' => $item->category->ingredient_type,
                ] : null,
            ]);

        $categories = IngredientCategory::orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'ingredient_type', 'sort_order', 'is_active']);

        return Inertia::render('Dashboard/Ingredients/Index', [
            'ingredients' => $ingredients,
            'categories'  => $categories,
            'filters'     => $request->only(['search', 'category_id']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Ingredients/Create', [
            'categories' => IngredientCategory::where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'ingredient_type']),
        ]);
    }

    public function store(StoreIngredientRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('ingredients', 'public');
        }

        // Normalise nullable numerics
        $data['average_cost']  = 0;
        $data['selling_price'] = isset($data['selling_price']) && $data['selling_price'] !== ''
            ? $data['selling_price']
            : null;
        $data['sort_order'] = $data['sort_order'] ?? 0;

        Ingredient::create($data);

        return redirect()->route('ingredients.index')
            ->with('success', 'Bahan Baku berhasil ditambahkan!');
    }

    public function edit(Ingredient $ingredient)
    {
        return Inertia::render('Dashboard/Ingredients/Edit', [
            'ingredient' => [
                'id'                     => $ingredient->id,
                'code'                   => $ingredient->code,
                'name'                   => $ingredient->name,
                'unit'                   => $ingredient->unit,
                'description'            => $ingredient->description,
                'image_url'              => $ingredient->image_url,
                'average_cost'           => $ingredient->average_cost,
                'selling_price'          => $ingredient->selling_price,
                'is_active'              => $ingredient->is_active,
                'sort_order'             => $ingredient->sort_order,
                'ingredient_category_id' => $ingredient->ingredient_category_id,
            ],
            'categories' => IngredientCategory::orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'ingredient_type']),
        ]);
    }

    public function update(UpdateIngredientRequest $request, Ingredient $ingredient)
    {
        $data = $request->validated();

        // ── Penanganan foto ────────────────────────────────────────────────
        if ($request->hasFile('image')) {
            // Ada file baru → hapus lama lalu simpan baru
            if ($ingredient->image) {
                Storage::disk('public')->delete($ingredient->image);
            }
            $data['image'] = $request->file('image')->store('ingredients', 'public');

        } elseif ($request->boolean('remove_image')) {
            // User eksplisit hapus foto tanpa upload pengganti
            if ($ingredient->image) {
                Storage::disk('public')->delete($ingredient->image);
            }
            $data['image'] = null;

        } else {
            // Tidak ada perubahan foto → buang key agar tidak ter-overwrite null
            unset($data['image']);
        }

        // Buang remove_image dari data sebelum update (bukan kolom DB)
        unset($data['remove_image']);

        // Normalise nullable numerics
        $data['selling_price'] = array_key_exists('selling_price', $data) && $data['selling_price'] !== ''
            ? $data['selling_price']
            : null;
        $data['sort_order'] = $data['sort_order'] ?? $ingredient->sort_order;

        $ingredient->update($data);

        return redirect()->route('ingredients.index')
            ->with('success', 'Bahan Baku berhasil diperbarui!');
    }

    public function destroy(Ingredient $ingredient)
    {
        if ($ingredient->variantRecipes()->exists()) {
            return back()->with('error', 'Gagal: Bahan masih digunakan di formula variant.');
        }

        if ($ingredient->productRecipes()->exists()) {
            return back()->with('error', 'Gagal: Bahan masih digunakan di resep produk.');
        }

        // Soft delete: foto TIDAK dihapus dari disk supaya bisa di-restore.
        // Hapus file fisik hanya saat forceDelete via scheduled cleanup job.
        $ingredient->delete();

        return back()->with('success', 'Bahan Baku berhasil dihapus!');
    }

    // ─── Categories ───────────────────────────────────────────────────────

    public function storeCategory(Request $request)
    {
        IngredientCategory::create($request->validate([
            'code'            => 'required|string|max:50|unique:ingredient_categories,code',
            'name'            => 'required|string|max:100',
            'ingredient_type' => ['required', Rule::in(['oil', 'alcohol', 'other'])],
            'description'     => 'nullable|string|max:500',
            'sort_order'      => 'nullable|integer|min:0',
            'is_active'       => 'boolean',
        ]));

        return back()->with('success', 'Kategori Bahan berhasil ditambahkan!');
    }

    public function updateCategory(Request $request, IngredientCategory $category)
    {
        $category->update($request->validate([
            'code'            => ['required', 'string', 'max:50', Rule::unique('ingredient_categories')->ignore($category->id)],
            'name'            => 'required|string|max:100',
            'ingredient_type' => ['required', Rule::in(['oil', 'alcohol', 'other'])],
            'description'     => 'nullable|string|max:500',
            'sort_order'      => 'nullable|integer|min:0',
            'is_active'       => 'boolean',
        ]));

        return back()->with('success', 'Kategori berhasil diperbarui!');
    }

    public function destroyCategory(IngredientCategory $category)
    {
        if ($category->ingredients()->exists()) {
            return back()->with('error', 'Gagal: Kategori masih memiliki bahan baku. Pindahkan atau hapus bahan terlebih dahulu.');
        }

        $category->delete();

        return back()->with('success', 'Kategori berhasil dihapus!');
    }
}
