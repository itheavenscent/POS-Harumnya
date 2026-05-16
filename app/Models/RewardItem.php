<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RewardItem extends Model
{
    use HasUuids, SoftDeletes;

    protected $table = 'reward_items';

    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'cost_price',
        'selling_value',
        'image',
        'stock_qty',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'cost_price'    => 'decimal:2',
        'selling_value' => 'decimal:2',
        'stock_qty'     => 'integer',
        'is_active'     => 'boolean',
        'sort_order'    => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    /** Reward rules yang memakai item ini */
    public function discountRewards(): HasMany
    {
        return $this->hasMany(DiscountReward::class, 'reward_item_id');
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /** URL gambar lengkap */
    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? asset('storage/reward-items/' . $this->image) : null;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function getCategoryLabel(): string
    {
        return match ($this->category) {
            'merchandise' => 'Merchandise',
            'voucher'     => 'Voucher',
            'food'        => 'Makanan & Minuman',
            'cash'        => 'Cashback / Uang Tunai',
            'service'     => 'Layanan',
            default       => ucfirst($this->category),
        };
    }
}
