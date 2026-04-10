<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiscountUsage extends Model
{
    use HasUuids;

    protected $table = 'discount_usages';

    protected $fillable = [
        'discount_type_id',
        'order_id',       // FK → sales.id (constraint ditambahkan di migration 14)
        'store_id',
        'customer_id',    // FK → customers.id (BUKAN users! constraint di migration 14)
        'discount_amount',
        'original_amount',
        'final_amount',
        'applied_to_items',
        'reward_items',
        'is_game_reward',
        'game_type',
        'game_result',
        'chosen_reward_pool_id',
        'used_at',
    ];

    protected $casts = [
        'discount_amount'  => 'decimal:2',
        'original_amount'  => 'decimal:2',
        'final_amount'     => 'decimal:2',
        'applied_to_items' => 'array',
        'reward_items'     => 'array',
        'is_game_reward'   => 'boolean',
        'used_at'          => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function discountType(): BelongsTo
    {
        return $this->belongsTo(DiscountType::class, 'discount_type_id');
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    /**
     * FK ke tabel customers (BUKAN users!).
     * Constraint FK ditambahkan di migration 14.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /**
     * FK ke tabel sales.
     * Constraint FK ditambahkan di migration 14.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'order_id');
    }

    public function chosenRewardPool(): BelongsTo
    {
        return $this->belongsTo(DiscountRewardPool::class, 'chosen_reward_pool_id');
    }
}
