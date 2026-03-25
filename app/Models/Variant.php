<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Variant extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'code',
        'name',
        'gender',
        'description',
        'image',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array<string>
     */
    protected $hidden = [];

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        // Auto-generate UUID
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // =========================================================================
    // Accessors
    // =========================================================================

    /**
     * Get the full image URL.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }

        return asset('storage/variants/' . $this->image);
    }

    // =========================================================================
    // Scopes
    // =========================================================================

    /**
     * Scope: Search by name, code, or description.
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'LIKE', "%{$search}%")
              ->orWhere('code', 'LIKE', "%{$search}%")
              ->orWhere('description', 'LIKE', "%{$search}%");
        });
    }

    /**
     * Scope: Filter by gender.
     */
    public function scopeGender($query, string $gender)
    {
        return $query->where('gender', $gender);
    }

    /**
     * Scope: Filter by active status.
     */
    public function scopeActive($query, bool $isActive = true)
    {
        return $query->where('is_active', $isActive);
    }

    /**
     * Scope: Only active variants.
     */
    public function scopeOnlyActive($query)
    {
        return $query->where('is_active', true);
    }
}
