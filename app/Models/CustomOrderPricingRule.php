<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomOrderPricingRule extends Model
{
    use HasUuids, SoftDeletes;

    protected $table    = 'custom_order_pricing_rules';
    protected $fillable = [
        'variant_id',
        'price_per_ml_oil',
        'min_oil_ml',
        'max_oil_ml',
        'min_ratio_note',
        'valid_from',
        'valid_until',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'price_per_ml_oil' => 'decimal:4',
        'min_oil_ml'       => 'integer',
        'max_oil_ml'       => 'integer',
        'valid_from'       => 'date',
        'valid_until'      => 'date',
        'is_active'        => 'boolean',
    ];

    public function variant(): BelongsTo
    {
        return $this->belongsTo(Variant::class);
    }

    /**
     * Scope: aturan yang sedang aktif dan berlaku hari ini.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('valid_from')->orWhereDate('valid_from', '<=', today()))
            ->where(fn ($q) => $q->whereNull('valid_until')->orWhereDate('valid_until', '>=', today()));
    }

    /**
     * Cari rule yang paling relevan untuk variant tertentu.
     * Spesifik variant lebih prioritas dari global (null).
     */
    public static function findForVariant(?string $variantId): ?self
    {
        return static::active()
            ->where(fn ($q) => $q->where('variant_id', $variantId)->orWhereNull('variant_id'))
            ->orderByRaw('variant_id IS NULL ASC')
            ->first();
    }
}
