<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiscountApplicability extends Model
{
    use HasUuids;

    protected $table = 'discount_applicabilities';

    protected $fillable = [
        'discount_type_id',
        'variant_id',
        'intensity_id',
        'size_id',
    ];

    // Semua FK nullable — null = berlaku untuk semua
    protected $casts = [
        // UUID fields — tidak perlu cast khusus, HasUuids sudah handle
    ];

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function discountType(): BelongsTo
    {
        return $this->belongsTo(DiscountType::class, 'discount_type_id');
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
}
