<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class Supplier extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $keyType    = 'string';
    public    $incrementing = false;

    protected $fillable = [
        'code',
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'payment_term',
        'credit_limit',
        'is_active',
    ];

    protected $casts = [
        'credit_limit' => 'float',   // decimal:2 di DB; float di PHP agar aritmatika lancar
        'is_active'    => 'boolean',
        'deleted_at'   => 'datetime',
    ];

    // ─── Konstanta ────────────────────────────────────────────────────────

    public const PAYMENT_TERMS = [
        'cash'      => 'Tunai (Cash)',
        'credit_7'  => 'Kredit 7 Hari',
        'credit_14' => 'Kredit 14 Hari',
        'credit_30' => 'Kredit 30 Hari',
        'credit_60' => 'Kredit 60 Hari',
    ];

    /** Kolom yang boleh digunakan untuk ORDER BY (whitelist SQL-injection-safe) */
    public const SORTABLE_COLUMNS = [
        'name', 'code', 'payment_term', 'credit_limit', 'is_active', 'created_at',
    ];

    /** Ukuran halaman yang diizinkan */
    public const ALLOWED_PER_PAGE = [10, 12, 25, 50, 100];

    // ─── Accessors ────────────────────────────────────────────────────────

    public function getPaymentTermLabelAttribute(): string
    {
        return self::PAYMENT_TERMS[$this->payment_term] ?? $this->payment_term;
    }

    public function getFormattedCreditLimitAttribute(): string
    {
        return 'Rp ' . number_format((float) $this->credit_limit, 0, ',', '.');
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_active ? 'Aktif' : 'Nonaktif';
    }

    // ─── Scopes ───────────────────────────────────────────────────────────

    public function scopeSearch(Builder $query, string $keyword): Builder
    {
        $kw = '%' . mb_strtolower(trim($keyword)) . '%';

        return $query->where(function (Builder $q) use ($kw) {
            $q->whereRaw('LOWER(name) LIKE ?', [$kw])
              ->orWhereRaw('LOWER(code) LIKE ?', [$kw])
              ->orWhereRaw('LOWER(email) LIKE ?', [$kw])
              ->orWhereRaw('LOWER(contact_person) LIKE ?', [$kw])
              ->orWhere('phone', 'like', $kw);
        });
    }

    public function scopeByPaymentTerm(Builder $query, string $term): Builder
    {
        return $query->where('payment_term', $term);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }
}
