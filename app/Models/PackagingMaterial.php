<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class PackagingMaterial extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'packaging_category_id',
        'unit',
        'code',
        'name',
        'size_id',
        'image',
        'description',
        'is_available_as_addon',
        'is_assembly',
        // Pricing
        'purchase_price',
        'selling_price',
        'is_free',
        'free_condition_note',
        'average_cost',
        // Status
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active'             => 'boolean',
        'is_available_as_addon' => 'boolean',
        'is_assembly'           => 'boolean',
        'is_free'               => 'boolean',
        'sort_order'            => 'integer',
        'purchase_price'        => 'decimal:2',
        'selling_price'         => 'decimal:2',
        'average_cost'          => 'decimal:4',
    ];

    protected $appends = ['image_url'];

    // ─── Accessors ──────────────────────────────────────────────────────

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? Storage::url($this->image) : null;
    }

    /**
     * Harga efektif yang ditagih ke pelanggan.
     * Jika is_free = true → 0, meski selling_price terisi.
     */
    public function getEffectiveSellingPriceAttribute(): int
    {
        return $this->is_free ? 0 : (int) $this->selling_price;
    }

    /**
     * Margin jual vs HPP (average_cost).
     * Jika is_free → margin negatif = biaya subsidi kemasan.
     */
    public function getMarginPercentageAttribute(): float
    {
        $avgCost     = (float) $this->average_cost;
        $effectivePrice = $this->effective_selling_price;

        if ($avgCost <= 0) return 0;

        // Jika gratis: margin = -100% dari sisi pendapatan, tapi kita hitung subsidi
        if ($this->is_free) {
            return -100.0;
        }

        if ($effectivePrice <= 0) return 0;

        return round((($effectivePrice - $avgCost) / $effectivePrice) * 100, 2);
    }

    /**
     * Profit (atau biaya subsidi) per unit.
     * Negatif jika is_free (seluruh average_cost jadi beban).
     */
    public function getProfitPerUnitAttribute(): int
    {
        return $this->effective_selling_price - (int) round((float) $this->average_cost);
    }

    // ─── Relations ──────────────────────────────────────────────────────

    public function category(): BelongsTo
    {
        return $this->belongsTo(PackagingCategory::class, 'packaging_category_id');
    }

    public function size(): BelongsTo
    {
        return $this->belongsTo(Size::class);
    }

    public function warehouseStocks(): HasMany
    {
        return $this->hasMany(WarehousePackagingStock::class, 'packaging_material_id');
    }

    public function storeStocks(): HasMany
    {
        return $this->hasMany(StorePackagingStock::class, 'packaging_material_id');
    }

    /**
     * Baris BOM: komponen-komponen penyusun kemasan rakitan ini.
     */
    public function components(): HasMany
    {
        return $this->hasMany(PackagingRecipe::class, 'parent_packaging_id');
    }

    /**
     * Baris BOM di mana material ini dipakai sebagai komponen rakitan lain.
     */
    public function usedInAssemblies(): HasMany
    {
        return $this->hasMany(PackagingRecipe::class, 'component_packaging_id');
    }

    // ─── Assembly Helpers ───────────────────────────────────────────────

    /**
     * Apakah kemasan ini rakitan (punya BOM komponen).
     */
    public function isAssembly(): bool
    {
        return (bool) $this->is_assembly;
    }

    /**
     * HPP rakitan = Σ (biaya komponen × quantity).
     * Untuk material non-rakitan → average_cost sendiri.
     * Komponen seharusnya tidak boleh rakitan lain (dicegah saat simpan BOM),
     * tapi tetap dihitung rekursif untuk jaga-jaga data lama/tidak konsisten —
     * average_cost milik rakitan adalah data basi (tidak pernah di-update oleh
     * PO/WAC karena rakitan sendiri tidak pernah diterima/dibeli langsung).
     * Komponen WAJIB sudah di-load via components.component agar tidak N+1.
     */
    public function getAssembledCostAttribute(): float
    {
        return $this->resolveAssembledCost();
    }

    private function resolveAssembledCost(array $visited = []): float
    {
        if (! $this->is_assembly) {
            return (float) $this->average_cost;
        }

        // Guard terhadap BOM siklik (A berisi B, B berisi A).
        if (in_array($this->id, $visited, true)) {
            return 0.0;
        }
        $visited[] = $this->id;

        return (float) $this->components->sum(function ($line) use ($visited) {
            $component = $line->component;
            if (! $component) {
                return 0.0;
            }

            $unitCost = $component->is_assembly
                ? $component->resolveAssembledCost($visited)
                : (float) $component->average_cost;

            return $unitCost * (int) $line->quantity;
        });
    }

    // ─── Scopes ─────────────────────────────────────────────────────────

    public function scopeSearch($query, string $search)
    {
        $term = mb_strtolower($search);

        return $query->where(fn($q) =>
            $q->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
              ->orWhereRaw('LOWER(code) LIKE ?', ["%{$term}%"])
        );
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAvailableAsAddon($query)
    {
        return $query->where('is_active', true)
                     ->where('is_available_as_addon', true);
    }

    public function scopeFree($query)
    {
        return $query->where('is_free', true);
    }

    // ─── WAC Update Helper ───────────────────────────────────────────────

    /**
     * Update average_cost dengan formula WAC saat purchase diterima.
     * average_cost tetap dihitung meski is_free = true → laporan HPP akurat.
     *
     * @param int   $qtyReceived   Jumlah yang diterima dari PO
     * @param int   $purchasePrice Harga beli per unit di PO ini
     * @param float $currentStock  Stok total SEBELUM penambahan ini
     */
    public function updateAverageCost(int $qtyReceived, int $purchasePrice, float $currentStock): void
    {
        $oldCost = (float) $this->average_cost;
        $oldQty  = $currentStock;

        if (($oldQty + $qtyReceived) <= 0) return;

        // WAC = (stok_lama × cost_lama + qty_baru × harga_beli_baru) / (stok_lama + qty_baru)
        $newAvgCost = (($oldQty * $oldCost) + ($qtyReceived * $purchasePrice))
                    / ($oldQty + $qtyReceived);

        $this->update([
            'average_cost'   => round($newAvgCost, 4),
            'purchase_price' => $purchasePrice,
        ]);
    }
}
