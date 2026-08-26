<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PackagingRecipe — satu baris BOM: 1 komponen penyusun kemasan rakitan.
 *
 * parent    = kemasan rakitan (mis. Botol A)
 * component = komponen (ring spray / tutup / botol), PackagingMaterial tersendiri
 * quantity  = jumlah komponen per 1 unit rakitan
 */
class PackagingRecipe extends Model
{
    use HasUuids;

    protected $table = 'packaging_recipes';

    protected $fillable = [
        'parent_packaging_id',
        'component_packaging_id',
        'quantity',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function parent(): BelongsTo
    {
        return $this->belongsTo(PackagingMaterial::class, 'parent_packaging_id');
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(PackagingMaterial::class, 'component_packaging_id')->withTrashed();
    }
}
