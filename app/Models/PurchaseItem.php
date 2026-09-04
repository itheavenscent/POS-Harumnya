<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PurchaseItem extends Model
{
    use HasUuids;

    protected $fillable = [
        'purchase_id', 'item_type', 'item_id',
        'quantity', 'received_quantity', 'unit_price', 'subtotal', 'is_free', 'notes',
    ];

    protected $casts = [
        // ★ bigInteger SIGNED (retur bisa negatif)
        'quantity'          => 'integer',
        'received_quantity' => 'integer',
        // ★ decimal(15,2) sesuai migration 006
        'unit_price'        => 'decimal:2',
        'subtotal'          => 'decimal:2',
        'is_free'           => 'boolean',
    ];

    protected $appends = ['missing_quantity'];

    public function purchase() { return $this->belongsTo(Purchase::class); }

    public function getMissingQuantityAttribute(): int
    {
        return $this->quantity - $this->received_quantity;
    }

    // ─── Lazy-resolved item attributes (dipakai di Show page) ────────────────
    // Catatan: accessor ini melakukan query per-item.
    // Untuk performa tinggi, gunakan eager-load di controller.

    public function getItemNameAttribute(): string
    {
        return Material::find($this->item_id)?->name ?? '-';
    }

    public function getItemCodeAttribute(): string
    {
        return Material::find($this->item_id)?->code ?? '-';
    }

    public function getItemUnitAttribute(): string
    {
        $m = Material::with('size')->find($this->item_id);
        $defaultUnit = $this->item_type === 'ingredient' ? 'unit' : 'pcs';
        return $m?->unit ?? $m?->size?->name ?? $defaultUnit;
    }
}
