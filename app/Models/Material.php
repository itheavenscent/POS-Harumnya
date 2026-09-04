<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

/**
 * Material = gabungan bekas Ingredient (bahan baku) + PackagingMaterial
 * (bahan kemasan). `material_type` membedakan keduanya:
 *   - bahan_baku    → dipakai di variant_recipes/product_recipes (resep parfum).
 *     ingredient_type di kategori (oil/alcohol/other) menentukan scaling resep
 *     dan resolusi custom order.
 *   - bahan_kemasan → add-on POS, bisa jadi "rakitan" (is_assembly + BOM di
 *     packaging_recipes / components()/usedInAssemblies()).
 */
class Material extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'material_category_id',
        'material_type',
        'code',
        'name',
        'unit',
        'description',
        'image',
        'size_id',
        'average_cost',
        'selling_price',
        'is_available_as_addon',
        'purchase_price',
        'is_free',
        'free_condition_note',
        'is_assembly',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'average_cost'           => 'decimal:4',
        'selling_price'          => 'decimal:2',
        'purchase_price'         => 'decimal:2',
        'is_active'              => 'boolean',
        'is_available_as_addon'  => 'boolean',
        'is_assembly'            => 'boolean',
        'is_free'                => 'boolean',
        'sort_order'             => 'integer',
    ];

    protected $appends = ['image_url'];

    // ─── Relationships ────────────────────────────────────────────────────

    public function category(): BelongsTo
    {
        return $this->belongsTo(MaterialCategory::class, 'material_category_id');
    }

    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class);
    }

    public function variantRecipes(): HasMany
    {
        return $this->hasMany(VariantRecipe::class, 'ingredient_id');
    }

    public function productRecipes(): HasMany
    {
        return $this->hasMany(ProductRecipe::class, 'ingredient_id');
    }

    public function warehouseIngredientStocks(): HasMany
    {
        return $this->hasMany(WarehouseIngredientStock::class, 'ingredient_id');
    }

    public function storeIngredientStocks(): HasMany
    {
        return $this->hasMany(StoreIngredientStock::class, 'ingredient_id');
    }

    public function warehousePackagingStocks(): HasMany
    {
        return $this->hasMany(WarehousePackagingStock::class, 'packaging_material_id');
    }

    public function storePackagingStocks(): HasMany
    {
        return $this->hasMany(StorePackagingStock::class, 'packaging_material_id');
    }

    /** Baris BOM: komponen-komponen penyusun kemasan rakitan ini (bahan_kemasan saja). */
    public function components(): HasMany
    {
        return $this->hasMany(PackagingRecipe::class, 'parent_packaging_id');
    }

    /** Baris BOM di mana material ini dipakai sebagai komponen rakitan lain. */
    public function usedInAssemblies(): HasMany
    {
        return $this->hasMany(PackagingRecipe::class, 'component_packaging_id');
    }

    // ─── Accessors ────────────────────────────────────────────────────────

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? Storage::disk('public')->url($this->image) : null;
    }

    /**
     * Harga efektif yang ditagih ke pelanggan (bahan_kemasan).
     * Jika is_free = true → 0, meski selling_price terisi.
     */
    public function getEffectiveSellingPriceAttribute(): int
    {
        return $this->is_free ? 0 : (int) $this->selling_price;
    }

    /**
     * Margin jual vs HPP (average_cost) — bahan_kemasan.
     * Jika is_free → margin negatif = biaya subsidi kemasan.
     */
    public function getMarginPercentageAttribute(): float
    {
        $avgCost = (float) $this->average_cost;
        $effectivePrice = $this->effective_selling_price;

        if ($avgCost <= 0) return 0;

        if ($this->is_free) {
            return -100.0;
        }

        if ($effectivePrice <= 0) return 0;

        return round((($effectivePrice - $avgCost) / $effectivePrice) * 100, 2);
    }

    /**
     * Profit (atau biaya subsidi) per unit — bahan_kemasan.
     * Negatif jika is_free (seluruh average_cost jadi beban).
     */
    public function getProfitPerUnitAttribute(): int
    {
        return $this->effective_selling_price - (int) round((float) $this->average_cost);
    }

    // ─── Assembly Helpers (bahan_kemasan) ─────────────────────────────────

    public function isAssembly(): bool
    {
        return (bool) $this->is_assembly;
    }

    /**
     * HPP rakitan = Σ (biaya komponen × quantity).
     * Untuk material non-rakitan → average_cost sendiri.
     * Komponen WAJIB sudah di-load via components.component agar tidak N+1.
     */
    public function getAssembledCostAttribute(): float
    {
        return $this->resolveAssembledCost();
    }

    private function resolveAssembledCost(array $visited = []): float
    {
        if (! $this->is_assembly) {
            return (float) $this->average_cost;
        }

        // Guard terhadap BOM siklik (A berisi B, B berisi A).
        if (in_array($this->id, $visited, true)) {
            return 0.0;
        }
        $visited[] = $this->id;

        return (float) $this->components->sum(function ($line) use ($visited) {
            $component = $line->component;
            if (! $component) {
                return 0.0;
            }

            $unitCost = $component->is_assembly
                ? $component->resolveAssembledCost($visited)
                : (float) $component->average_cost;

            return $unitCost * (int) $line->quantity;
        });
    }

    // ─── Scopes ───────────────────────────────────────────────────────────

    public function scopeSearch($query, string $term)
    {
        $lower = mb_strtolower($term);

        return $query->where(function ($q) use ($lower) {
            $q->whereRaw('LOWER(name) LIKE ?', ["%{$lower}%"])
              ->orWhereRaw('LOWER(code) LIKE ?', ["%{$lower}%"]);
        });
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBahanBaku($query)
    {
        return $query->where('material_type', 'bahan_baku');
    }

    public function scopeBahanKemasan($query)
    {
        return $query->where('material_type', 'bahan_kemasan');
    }

    public function scopeAvailableAsAddon($query)
    {
        return $query->where('is_active', true)
                     ->where('is_available_as_addon', true);
    }

    public function scopeFree($query)
    {
        return $query->where('is_free', true);
    }
}
