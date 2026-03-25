<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Ingredient extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'ingredient_category_id',
        'code',
        'name',
        'unit',
        'description',
        'image',
        'average_cost',
        'selling_price',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'average_cost'  => 'decimal:4',
        'selling_price' => 'decimal:2',
        'is_active'     => 'boolean',
        'sort_order'    => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────

    public function category()
    {
        return $this->belongsTo(IngredientCategory::class, 'ingredient_category_id');
    }

    public function variantRecipes()
    {
        return $this->hasMany(\App\Models\VariantRecipe::class);
    }

    public function productRecipes()
    {
        return $this->hasMany(\App\Models\ProductRecipe::class);
    }

    // ─── Accessors ────────────────────────────────────────────────────────

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? Storage::disk('public')->url($this->image) : null;
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

    // ─── WAC Update ──────────────────────────────────────────────────────

    /**
     * Update average_cost menggunakan Weighted Average Cost (WAC).
     * Dipanggil dari PurchaseController::receive() setelah stok masuk.
     *
     * Formula:
     *   new_avg = (old_qty × old_cost + received_qty × purchase_price)
     *             / (old_qty + received_qty)
     *
     * @param int   $qtyReceived   Jumlah unit yang diterima dari PO
     * @param int   $purchasePrice Harga beli per unit di PO ini (rupiah)
     * @param float $currentStock  Total stok semua lokasi SEBELUM penambahan ini
     */
    public function updateAverageCost(int $qtyReceived, int $purchasePrice, float $currentStock): void
    {
        if ($qtyReceived <= 0) return;

        $oldCost = (float) $this->average_cost;
        $oldQty  = max(0, $currentStock);
        $newTotal = $oldQty + $qtyReceived;

        if ($newTotal <= 0) return;

        $newAvgCost = (($oldQty * $oldCost) + ($qtyReceived * $purchasePrice)) / $newTotal;

        $this->update(['average_cost' => round($newAvgCost, 4)]);
    }
}
