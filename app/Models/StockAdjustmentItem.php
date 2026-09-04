<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StockAdjustmentItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'stock_adjustment_id', 'item_type', 'item_id',
        'system_quantity', 'physical_quantity', 'difference',
        'unit_cost', 'value_difference', 'notes',
    ];

    protected $casts = [
        // Schema: bigInteger SIGNED — hitung fisik bisa 0, sama, atau berbeda dari sistem
        'system_quantity'   => 'integer',
        'physical_quantity' => 'integer',
        // Schema: bigInteger SIGNED — positif = surplus, negatif = kurang
        'difference'        => 'integer',
        // Schema: decimal(15,4) — snapshot WAC saat adjustment
        'unit_cost'         => 'decimal:4',
        // Schema: decimal(15,2) — |difference| × unit_cost dalam rupiah (2 desimal)
        'value_difference'  => 'decimal:2',
    ];

    public function stockAdjustment()
    {
        return $this->belongsTo(StockAdjustment::class);
    }

    public function getItemNameAttribute(): string
    {
        return Material::find($this->item_id)?->name ?? '-';
    }

    public function getItemUnitAttribute(): string
    {
        $m = Material::with('size')->find($this->item_id);
        $defaultUnit = $this->item_type === 'ingredient' ? 'unit' : 'pcs';
        return $m?->unit ?? $m?->size?->name ?? $defaultUnit;
    }

    public function getDirectionAttribute(): string
    {
        if ($this->difference > 0) return 'surplus';
        if ($this->difference < 0) return 'shortage';
        return 'match';
    }
}
