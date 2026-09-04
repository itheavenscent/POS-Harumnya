<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaterialCategory extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'material_type',
        'code',
        'name',
        'description',
        'ingredient_type',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────

    public function materials()
    {
        return $this->hasMany(Material::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeBahanBaku($query)
    {
        return $query->where('material_type', 'bahan_baku');
    }

    public function scopeBahanKemasan($query)
    {
        return $query->where('material_type', 'bahan_kemasan');
    }
}
