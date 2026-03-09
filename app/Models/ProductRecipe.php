<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductRecipe extends Model
{
    use HasUuids;

    protected $fillable = [
        'product_id',
        'ingredient_id',
        'quantity',
        'unit',
        'unit_cost',
        'total_cost',
        'notes',
    ];

    protected $casts = [
        // quantity: smallInteger di DB, tapi bisa desimal saat scaling — pakai float
        'quantity'   => 'float',
        // unit_cost: DECIMAL(15,4) di DB — butuh presisi 4 desimal
        'unit_cost'  => 'decimal:4',
        // FIX: total_cost di DB adalah DECIMAL(15,2), bukan integer.
        // Cast ke 'integer' sebelumnya menyebabkan nilai desimal ditruncate
        // dan tidak konsisten dengan definisi kolom di migration.
        'total_cost' => 'decimal:2',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    // ── Business Logic ─────────────────────────────────────────────────────────

    /**
     * Update cost berdasarkan current ingredient average_cost (WAC).
     */
    public function updateCost(): void
    {
        $ingredient     = $this->ingredient;
        $this->unit_cost  = $ingredient->average_cost ?? 0;
        $this->total_cost = round($this->quantity * $this->unit_cost, 2);
        $this->save();
    }

    // ── Accessors ──────────────────────────────────────────────────────────────

    public function getFormattedQuantityAttribute(): string
    {
        return number_format($this->quantity, 2) . ' ' . $this->unit;
    }

    public function getFormattedTotalCostAttribute(): string
    {
        return 'Rp ' . number_format($this->total_cost, 0, ',', '.');
    }
}
