<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaleItem extends Model
{
    use HasUuids;

    protected $table    = 'sale_items';
    protected $fillable = [
        'sale_id', 'product_id',
        'product_name', 'product_sku',
        'variant_name', 'intensity_code', 'size_ml',
        'variant_id_snapshot',
        'intensity_id_snapshot',
        'size_id_snapshot',
        'qty', 'unit_price', 'item_discount', 'subtotal',
        'is_free',
        'cogs_per_unit', 'cogs_total',
        'line_gross_profit', 'line_gross_margin_pct',
        'reward_item_id',
        // ── Custom order fields ────────────────────────────────────────────
        'is_custom_order',
        'custom_oil_qty',
        'custom_alcohol_qty',
        'custom_other_qty',
        'custom_total_volume',
        'alcohol_is_free',
        'alcohol_cogs_per_unit',
        'alcohol_cogs_total',
        // ──────────────────────────────────────────────────────────────────
        'notes',
    ];

    protected $casts = [
        'qty'                   => 'integer',
        'is_free'                => 'boolean',
        'unit_price'            => 'decimal:2',
        'item_discount'         => 'decimal:2',
        'subtotal'              => 'decimal:2',
        'cogs_per_unit'         => 'decimal:4',
        'cogs_total'            => 'decimal:2',
        'line_gross_profit'     => 'decimal:2',
        'line_gross_margin_pct' => 'decimal:2',
        'size_ml'               => 'integer',
        // Custom order
        'is_custom_order'       => 'boolean',
        'custom_oil_qty'        => 'integer',
        'custom_alcohol_qty'    => 'integer',
        'custom_other_qty'      => 'integer',
        'custom_total_volume'   => 'integer',
        'alcohol_is_free'       => 'boolean',
        'alcohol_cogs_per_unit' => 'decimal:4',
        'alcohol_cogs_total'    => 'decimal:2',
    ];

    /**
     * Hitung margin persen aman untuk kolom line_gross_margin_pct decimal(9,2).
     * Mengembalikan 0 bila subtotal <= 0, dan meng-clamp ke rentang kolom agar
     * COGS/HPP abnormal (mis. rakitan kemasan bermasalah) tak memicu overflow 22003.
     */
    public static function marginPct($subtotal, $profit): float
    {
        $sub = (float) $subtotal;
        if ($sub <= 0) return 0.0;

        $pct = round(((float) $profit) / $sub * 100, 2);

        // decimal(9,2) → ±9.999.999,99
        return max(-9999999.99, min(9999999.99, $pct));
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function rewardItem(): BelongsTo
    {
        return $this->belongsTo(RewardItem::class, 'reward_item_id');
    }

    public function packagings(): HasMany
    {
        return $this->hasMany(SaleItemPackaging::class, 'sale_item_id');
    }
}
