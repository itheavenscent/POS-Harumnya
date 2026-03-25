<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    use HasUuids;

    protected $table    = 'carts';
    protected $fillable = [
        'cashier_id',
        'store_id',
        'variant_id',
        'intensity_id',       // nullable untuk custom order
        'size_id',            // nullable untuk custom order
        'product_id',
        'unit_price',
        'qty',
        'customer_id',
        'sales_person_id',
        'hold_id',
        'hold_label',
        'held_at',
        'cart_expires_at',
        // ── Custom order ──────────────────────────────────────────────────
        'is_custom_order',
        'custom_oil_qty',
        'custom_alcohol_qty',
        'custom_other_qty',
        'custom_total_volume',
        'custom_unit_price',
        'alcohol_cost_snapshot',
        // ─────────────────────────────────────────────────────────────────
        'notes',
    ];

    protected $casts = [
        'unit_price'             => 'decimal:2',
        'qty'                    => 'integer',
        'held_at'                => 'datetime',
        'cart_expires_at'        => 'datetime',
        // Custom order
        'is_custom_order'        => 'boolean',
        'custom_oil_qty'         => 'integer',
        'custom_alcohol_qty'     => 'integer',
        'custom_other_qty'       => 'integer',
        'custom_total_volume'    => 'integer',
        'custom_unit_price'      => 'decimal:2',
        'alcohol_cost_snapshot'  => 'decimal:4',
    ];

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(Variant::class, 'variant_id');
    }

    public function intensity(): BelongsTo
    {
        return $this->belongsTo(Intensity::class, 'intensity_id');
    }

    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class, 'size_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function packagings(): HasMany
    {
        return $this->hasMany(CartPackaging::class, 'cart_id');
    }
}
