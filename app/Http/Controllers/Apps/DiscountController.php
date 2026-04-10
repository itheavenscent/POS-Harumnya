<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\DiscountType;
use App\Models\Store;
use App\Models\Variant;
use App\Models\Intensity;
use App\Models\Size;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DiscountController extends Controller
{
    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function index(Request $request)
    {
        $discounts = DiscountType::query()
            ->with(['stores.store:id,name', 'rewards'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%' . $request->search . '%';
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', $search)
                          ->orWhere('code', 'like', $search);
                });
            })
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->type))
            ->when(
                $request->filled('is_active'),
                fn ($q) => $q->where('is_active', $request->boolean('is_active'))
            )
            ->orderByDesc('priority')
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dashboard/Discounts/Index', [
            'discounts' => $discounts,
            'filters'   => $request->only(['search', 'type', 'is_active']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------------

    public function create()
    {
        return Inertia::render('Dashboard/Discounts/Create', $this->formData());
    }

    // -------------------------------------------------------------------------
    // Store
    // -------------------------------------------------------------------------

    public function store(Request $request)
    {
        $validated = $this->validateDiscount($request);

        DB::beginTransaction();
        try {
            $discount = DiscountType::create(
                collect($validated)->except(['store_ids', 'applicabilities', 'requirements', 'rewards'])->all()
            );

            $this->syncStores($discount, $validated['store_ids'] ?? []);
            $this->syncApplicabilities($discount, $validated['applicabilities'] ?? []);
            $this->syncRequirements($discount, $validated['requirements'] ?? []);
            $this->syncRewardsWithPools($discount, $validated['rewards'] ?? []);

            DB::commit();

            return redirect()
                ->route('discounts.index')
                ->with('success', 'Promo berhasil dibuat!');

        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return back()
                ->withInput()
                ->with('error', 'Gagal menyimpan promo: ' . $e->getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Edit
    // -------------------------------------------------------------------------

    public function edit(DiscountType $discount)
    {
        $discount->load([
            'stores.store:id,name',
            'applicabilities.variant:id,name',
            'applicabilities.intensity:id,name,code',
            'applicabilities.size:id,name,volume_ml',
            'requirements.variant:id,name',
            'requirements.intensity:id,name,code',
            'requirements.size:id,name,volume_ml',
            'rewards.variant:id,name',
            'rewards.intensity:id,name,code',
            'rewards.size:id,name,volume_ml',
            'rewards.pools',
        ]);

        return Inertia::render('Dashboard/Discounts/Edit', [
            'discount' => $discount,
            ...$this->formData(),
        ]);
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------

    public function update(Request $request, DiscountType $discount)
    {
        $validated = $this->validateDiscount($request, $discount->id);

        DB::beginTransaction();
        try {
            $discount->update(
                collect($validated)->except(['store_ids', 'applicabilities', 'requirements', 'rewards'])->all()
            );

            $this->syncStores($discount, $validated['store_ids'] ?? []);

            $discount->applicabilities()->delete();
            $this->syncApplicabilities($discount, $validated['applicabilities'] ?? []);

            $discount->requirements()->delete();
            $this->syncRequirements($discount, $validated['requirements'] ?? []);

            // Hapus pools dulu (cascade Eloquent tidak otomatis via DB)
            foreach ($discount->rewards()->with('pools')->get() as $reward) {
                $reward->pools()->delete();
            }
            $discount->rewards()->delete();
            $this->syncRewardsWithPools($discount, $validated['rewards'] ?? []);

            DB::commit();

            return redirect()
                ->route('discounts.index')
                ->with('success', 'Promo berhasil diperbarui!');

        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return back()
                ->withInput()
                ->with('error', 'Gagal memperbarui promo: ' . $e->getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Destroy
    // -------------------------------------------------------------------------

    public function destroy(DiscountType $discount)
    {
        DB::beginTransaction();
        try {
            foreach ($discount->rewards()->with('pools')->get() as $reward) {
                $reward->pools()->delete();
            }
            $discount->rewards()->delete();
            $discount->requirements()->delete();
            $discount->applicabilities()->delete();
            $discount->stores()->delete();
            $discount->delete(); // soft delete

            DB::commit();

            return redirect()
                ->route('discounts.index')
                ->with('success', 'Promo berhasil dihapus!');

        } catch (\Throwable $e) {
            DB::rollBack();
            report($e);

            return back()->with('error', 'Gagal menghapus promo: ' . $e->getMessage());
        }
    }

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    /**
     * Validasi terpusat untuk store & update.
     * $ignoreId diisi pada update agar unique:discount_types,code mengabaikan record saat ini.
     */
    private function validateDiscount(Request $request, ?string $ignoreId = null): array
    {
        $uniqueCode = 'unique:discount_types,code' . ($ignoreId ? ",{$ignoreId}" : '');

        return $request->validate([
            // ── Core ──────────────────────────────────────────────────────────
            'code'                  => ['required', 'string', 'max:50', $uniqueCode],
            'name'                  => ['required', 'string', 'max:255'],
            'type'                  => ['required', 'in:percentage,fixed_amount,buy_x_get_y,free_product,game_reward,bundle'],
            'value'                 => ['nullable', 'numeric', 'min:0'],
            'description'           => ['nullable', 'string'],
            'terms_conditions'      => ['nullable', 'array'],

            // ── Buy X Get Y ───────────────────────────────────────────────────
            'buy_quantity'          => ['nullable', 'integer', 'min:1'],
            'get_quantity'          => ['nullable', 'integer', 'min:1'],
            'get_product_type'      => ['nullable', 'in:same,specific,lower_intensity,choose_from_pool,choose_variant'],

            // ── Constraints ───────────────────────────────────────────────────
            'min_purchase_amount'   => ['nullable', 'numeric', 'min:0'],
            'min_purchase_quantity' => ['nullable', 'integer', 'min:0'],
            'max_discount_amount'   => ['nullable', 'numeric', 'min:0'],

            // ── Period ────────────────────────────────────────────────────────
            'start_date'            => ['nullable', 'date'],
            'end_date'              => ['nullable', 'date', 'after_or_equal:start_date'],
            'start_time'            => ['nullable', 'date_format:H:i,H:i:s'],
            'end_time'              => ['nullable', 'date_format:H:i,H:i:s'],

            // ── Game ──────────────────────────────────────────────────────────
            'is_game_reward'        => ['boolean'],
            'game_probability'      => ['nullable', 'integer', 'min:1', 'max:100'],

            // ── Flags ─────────────────────────────────────────────────────────
            'priority'              => ['integer', 'min:0', 'max:255'],
            'is_combinable'         => ['boolean'],
            'is_active'             => ['boolean'],

            // ── Stores ────────────────────────────────────────────────────────
            'store_ids'             => ['nullable', 'array'],
            'store_ids.*'           => ['uuid', 'exists:stores,id'],

            // ── Applicabilities ───────────────────────────────────────────────
            'applicabilities'          => ['nullable', 'array'],
            'applicabilities.*.variant_id'   => ['nullable', 'uuid', 'exists:variants,id'],
            'applicabilities.*.intensity_id' => ['nullable', 'uuid', 'exists:intensities,id'],
            'applicabilities.*.size_id'      => ['nullable', 'uuid', 'exists:sizes,id'],

            // ── Requirements ──────────────────────────────────────────────────
            'requirements'                       => ['nullable', 'array'],
            'requirements.*.variant_id'          => ['nullable', 'uuid', 'exists:variants,id'],
            'requirements.*.intensity_id'        => ['nullable', 'uuid', 'exists:intensities,id'],
            'requirements.*.size_id'             => ['nullable', 'uuid', 'exists:sizes,id'],
            'requirements.*.required_quantity'   => ['required_with:requirements.*', 'integer', 'min:1'],
            'requirements.*.matching_mode'       => ['nullable', 'in:all,any'],
            'requirements.*.group_key'           => ['nullable', 'string', 'max:50'],

            // ── Rewards ───────────────────────────────────────────────────────
            'rewards'                            => ['nullable', 'array'],
            'rewards.*.variant_id'               => ['nullable', 'uuid', 'exists:variants,id'],
            'rewards.*.intensity_id'             => ['nullable', 'uuid', 'exists:intensities,id'],
            'rewards.*.size_id'                  => ['nullable', 'uuid', 'exists:sizes,id'],
            'rewards.*.reward_quantity'          => ['required_with:rewards.*', 'integer', 'min:1'],
            'rewards.*.customer_can_choose'      => ['boolean'],
            'rewards.*.is_pool'                  => ['boolean'],
            'rewards.*.max_choices'              => ['nullable', 'integer', 'min:1'],
            'rewards.*.discount_percentage'      => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rewards.*.fixed_price'              => ['nullable', 'numeric', 'min:0'],
            'rewards.*.priority'                 => ['integer', 'min:0'],

            // ── Reward Pools ──────────────────────────────────────────────────
            'rewards.*.pools'                    => ['nullable', 'array'],
            'rewards.*.pools.*.label'            => ['required_with:rewards.*.pools.*', 'string', 'max:255'],
            'rewards.*.pools.*.product_id'       => ['nullable', 'uuid', 'exists:products,id'],
            'rewards.*.pools.*.variant_id'       => ['nullable', 'uuid', 'exists:variants,id'],
            'rewards.*.pools.*.intensity_id'     => ['nullable', 'uuid', 'exists:intensities,id'],
            'rewards.*.pools.*.size_id'          => ['nullable', 'uuid', 'exists:sizes,id'],
            'rewards.*.pools.*.image_url'        => ['nullable', 'string', 'max:500'],
            'rewards.*.pools.*.fixed_price'      => ['nullable', 'numeric', 'min:0'],
            'rewards.*.pools.*.probability'      => ['nullable', 'integer', 'min:1', 'max:100'],
            'rewards.*.pools.*.is_active'        => ['boolean'],
            'rewards.*.pools.*.sort_order'       => ['integer', 'min:0'],
        ], [
            'code.unique'              => 'Kode promo sudah digunakan.',
            'end_date.after_or_equal'  => 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
            'start_time.date_format'   => 'Format jam mulai harus HH:MM atau HH:MM:SS.',
            'end_time.date_format'     => 'Format jam selesai harus HH:MM atau HH:MM:SS.',
            'game_probability.max'     => 'Probabilitas tidak boleh lebih dari 100.',
        ]);
    }

    // -------------------------------------------------------------------------
    // Private Helpers
    // -------------------------------------------------------------------------

    /**
     * Master data untuk form Create & Edit.
     */
    private function formData(): array
    {
        return [
            'stores'      => Store::select('id', 'name')
                                ->where('is_active', true)
                                ->orderBy('name')
                                ->get(),
            'variants'    => Variant::select('id', 'name')
                                ->where('is_active', true)
                                ->orderBy('sort_order')
                                ->get(),
            'intensities' => Intensity::select('id', 'name', 'code')
                                ->where('is_active', true)
                                ->orderBy('sort_order')
                                ->get(),
            'sizes'       => Size::select('id', 'name', 'volume_ml')
                                ->where('is_active', true)
                                ->orderBy('sort_order')
                                ->get(),
        ];
    }

    /**
     * Sync store assignments.
     * Pola: delete-then-insert agar tidak bentrok dengan unique constraint.
     */
    private function syncStores(DiscountType $discount, array $storeIds): void
    {
        DB::table('discount_stores')
            ->where('discount_type_id', $discount->id)
            ->delete();

        if (empty($storeIds)) {
            return;
        }

        $uniqueIds = array_values(array_unique($storeIds));
        $now       = now();

        $rows = array_map(fn ($id) => [
            'id'               => (string) Str::uuid(),
            'discount_type_id' => $discount->id,
            'store_id'         => $id,
            'created_at'       => $now,
            'updated_at'       => $now,
        ], $uniqueIds);

        DB::table('discount_stores')->insert($rows);
    }

    /**
     * Buat baris applicabilities baru (delete dilakukan oleh caller pada update).
     */
    private function syncApplicabilities(DiscountType $discount, array $items): void
    {
        foreach ($items as $item) {
            $discount->applicabilities()->create([
                'variant_id'   => $item['variant_id']   ?? null,
                'intensity_id' => $item['intensity_id'] ?? null,
                'size_id'      => $item['size_id']      ?? null,
            ]);
        }
    }

    /**
     * Buat baris requirements baru (delete dilakukan oleh caller pada update).
     */
    private function syncRequirements(DiscountType $discount, array $items): void
    {
        foreach ($items as $item) {
            $discount->requirements()->create([
                'variant_id'        => $item['variant_id']        ?? null,
                'intensity_id'      => $item['intensity_id']      ?? null,
                'size_id'           => $item['size_id']           ?? null,
                'required_quantity' => $item['required_quantity'] ?? 1,
                'matching_mode'     => $item['matching_mode']     ?? 'all',
                'group_key'         => $item['group_key']         ?? null,
            ]);
        }
    }

    /**
     * Buat rewards + nested pool items.
     * Pool hanya dibuat jika reward.is_pool = true dan ada items.
     */
    private function syncRewardsWithPools(DiscountType $discount, array $rewards): void
    {
        foreach ($rewards as $index => $rewardData) {
            $reward = $discount->rewards()->create([
                'variant_id'          => $rewardData['variant_id']          ?? null,
                'intensity_id'        => $rewardData['intensity_id']        ?? null,
                'size_id'             => $rewardData['size_id']             ?? null,
                'reward_quantity'     => $rewardData['reward_quantity']     ?? 1,
                'customer_can_choose' => (bool) ($rewardData['customer_can_choose'] ?? false),
                'is_pool'             => (bool) ($rewardData['is_pool']             ?? false),
                'max_choices'         => $rewardData['max_choices']         ?? null,
                'discount_percentage' => $rewardData['discount_percentage'] ?? null,
                'fixed_price'         => $rewardData['fixed_price']         ?? null,
                'priority'            => $rewardData['priority']            ?? 0,
            ]);

            $pools = $rewardData['pools'] ?? [];

            if (! empty($rewardData['is_pool']) && ! empty($pools)) {
                foreach ($pools as $i => $poolItem) {
                    $reward->pools()->create([
                        'product_id'   => $poolItem['product_id']   ?? null,
                        'variant_id'   => $poolItem['variant_id']   ?? null,
                        'intensity_id' => $poolItem['intensity_id'] ?? null,
                        'size_id'      => $poolItem['size_id']      ?? null,
                        'label'        => $poolItem['label'],
                        'image_url'    => $poolItem['image_url']    ?? null,
                        'fixed_price'  => $poolItem['fixed_price']  ?? 0,
                        'probability'  => $poolItem['probability']  ?? null,
                        'is_active'    => (bool) ($poolItem['is_active']  ?? true),
                        'sort_order'   => $poolItem['sort_order']   ?? $i,
                    ]);
                }
            }
        }
    }
}
