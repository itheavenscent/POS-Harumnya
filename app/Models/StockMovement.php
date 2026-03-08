<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * StockMovement
 *
 * Satu model untuk semua pergerakan stok lintas modul.
 *
 * @property string      $id
 * @property string      $location_type    warehouse|store
 * @property string      $location_id
 * @property string      $movement_type    purchase_in|transfer_in|transfer_out|adjustment_in|adjustment_out|waste|sale_deduction|...
 * @property string      $item_type        ingredient|packaging_material
 * @property string      $item_id
 * @property int         $qty_change       SIGNED (negatif=keluar, positif=masuk)
 * @property int         $qty_before
 * @property int         $qty_after
 * @property float       $unit_cost        decimal(15,4)
 * @property float       $total_cost       decimal(15,2)
 * @property float       $avg_cost_before  decimal(15,4)
 * @property float       $avg_cost_after   decimal(15,4)
 * @property string      $reference_type   FQCN (App\Models\Sale, dll)
 * @property string      $reference_id
 * @property string|null $reference_number
 * @property \Carbon\Carbon $movement_date
 * @property int|null    $created_by
 * @property string|null $notes
 */
class StockMovement extends Model
{
        use HasUuids;
    protected $fillable = [
        'location_type',
        'location_id',
        'movement_type',
        'item_type',
        'item_id',
        'qty_change',
        'qty_before',
        'qty_after',
        'unit_cost',
        'total_cost',
        'avg_cost_before',
        'avg_cost_after',
        'reference_type',
        'reference_id',
        'reference_number',
        'movement_date',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'qty_change'      => 'integer',
        'qty_before'      => 'integer',
        'qty_after'       => 'integer',
        'unit_cost'       => 'float',
        'total_cost'      => 'float',
        'avg_cost_before' => 'float',
        'avg_cost_after'  => 'float',
        'movement_date'   => 'date',
    ];

    // ── Relations ─────────────────────────────────────────────────────────────

    /**
     * Alias 'creator' agar kompatibel dengan with('creator:id,name')
     * yang sudah dipakai di StockAdjustmentController & StockTransferController.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForLocation(Builder $query, string $type, string $id): Builder
    {
        return $query->where('location_type', $type)->where('location_id', $id);
    }

    public function scopeForStore(Builder $query, string $storeId): Builder
    {
        return $query->where('location_type', 'store')->where('location_id', $storeId);
    }

    public function scopeForWarehouse(Builder $query, string $warehouseId): Builder
    {
        return $query->where('location_type', 'warehouse')->where('location_id', $warehouseId);
    }

    public function scopeForItem(Builder $query, string $itemType, string $itemId): Builder
    {
        return $query->where('item_type', $itemType)->where('item_id', $itemId);
    }

    public function scopeForReference(Builder $query, string $referenceId): Builder
    {
        return $query->where('reference_id', $referenceId);
    }

    public function scopeSaleDeductions(Builder $query): Builder
    {
        return $query->where('movement_type', 'sale_deduction');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isOut(): bool { return $this->qty_change < 0; }
    public function isIn(): bool  { return $this->qty_change > 0; }
    public function absQty(): int { return abs($this->qty_change); }
}
