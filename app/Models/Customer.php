<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'phone',
        'email',
        'address',
        'birth_date',
        'gender',
        'points',
        'lifetime_points_earned',
        'lifetime_spending',
        'total_transactions',
        'is_active',
        'registered_at',
    ];

    protected $casts = [
        'birth_date'             => 'date',
        'registered_at'          => 'datetime',
        'is_active'              => 'boolean',
        'points'                 => 'integer',
        'lifetime_points_earned' => 'integer',
        'lifetime_spending'      => 'decimal:2',
        'total_transactions'     => 'integer',
    ];

    // ─── Boot ─────────────────────────────────────────────────────────

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Customer $customer) {
            if (empty($customer->code)) {
                $customer->code = 'CUST-' . now()->format('Ym') . '-'
                    . strtoupper(bin2hex(random_bytes(3)));
            }
            $customer->registered_at ??= now();
        });
    }

    // ─── Business Logic ───────────────────────────────────────────────

    /**
     * Update denormalized fields setelah transaksi selesai.
     * Dipanggil dari service/observer.
     */
    public function syncAfterSale(float $saleAmount, int $pointsEarned): void
    {
        $this->increment('total_transactions');
        $this->increment('lifetime_points_earned', $pointsEarned);
        $this->increment('lifetime_spending', $saleAmount);
        $this->increment('points', $pointsEarned);
    }

    // ─── Scopes ───────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSegment($query, ?string $segment)
    {
        return match ($segment) {
            'vip'   => $query->where('lifetime_spending', '>', 5_000_000),
            'new'   => $query->where('created_at', '>=', now()->subDays(30)),
            'active' => $query->where('total_transactions', '>', 0),
            default => $query,
        };
    }

    // ─── Relations ────────────────────────────────────────────────────

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function pointLedgers(): HasMany
    {
        return $this->hasMany(CustomerPointLedger::class);
    }
}
