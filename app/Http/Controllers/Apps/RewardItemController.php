<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\RewardItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class RewardItemController extends Controller
{
    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function index(Request $request)
    {
        $items = RewardItem::query()
            ->when($request->filled('search'), function ($q) use ($request) {
                $s = '%' . $request->search . '%';
                $q->where(fn($inner) => $inner
                    ->where('name', 'like', $s)
                    ->orWhere('code', 'like', $s)
                );
            })
            ->when($request->filled('category'), fn($q) => $q->where('category', $request->category))
            ->when(
                $request->filled('is_active'),
                fn($q) => $q->where('is_active', $request->boolean('is_active'))
            )
            ->orderBy('sort_order')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Dashboard/RewardItems/Index', [
            'items'      => $items,
            'filters'    => $request->only(['search', 'category', 'is_active']),
            'categories' => $this->categoryOptions(),
        ]);
    }

    // -------------------------------------------------------------------------
    // Store (modal-based, return JSON)
    // -------------------------------------------------------------------------

    public function store(Request $request)
    {
        $validated = $this->validateItem($request);

        $item = RewardItem::create($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Reward item berhasil ditambahkan.',
                'data'    => $item,
            ]);
        }

        return redirect()
            ->route('reward-items.index')
            ->with('success', 'Reward item berhasil ditambahkan.');
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------

    public function update(Request $request, RewardItem $rewardItem)
    {
        $validated = $this->validateItem($request, $rewardItem->id);

        $rewardItem->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Reward item berhasil diperbarui.',
                'data'    => $rewardItem->fresh(),
            ]);
        }

        return redirect()
            ->route('reward-items.index')
            ->with('success', 'Reward item berhasil diperbarui.');
    }

    // -------------------------------------------------------------------------
    // Destroy
    // -------------------------------------------------------------------------

    public function destroy(RewardItem $rewardItem)
    {
        $rewardItem->delete();

        return redirect()
            ->route('reward-items.index')
            ->with('success', 'Reward item berhasil dihapus.');
    }

    // -------------------------------------------------------------------------
    // Toggle active
    // -------------------------------------------------------------------------

    public function toggle(RewardItem $rewardItem)
    {
        $rewardItem->update(['is_active' => !$rewardItem->is_active]);

        return back()->with('success', 'Status berhasil diubah.');
    }

    // -------------------------------------------------------------------------
    // API — list for dropdowns
    // -------------------------------------------------------------------------

    public function apiList()
    {
        $items = RewardItem::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'category', 'cost_price', 'selling_value', 'stock_qty']);

        return response()->json(['success' => true, 'data' => $items]);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function validateItem(Request $request, ?string $ignoreId = null): array
    {
        $uniqueCode = 'unique:reward_items,code' . ($ignoreId ? ",{$ignoreId}" : '');

        return $request->validate([
            'code'          => ['required', 'string', 'max:50', $uniqueCode],
            'name'          => ['required', 'string', 'max:255'],
            'description'   => ['nullable', 'string'],
            'category'      => ['required', 'string', 'max:100'],
            'cost_price'    => ['required', 'numeric', 'min:0'],
            'selling_value' => ['nullable', 'numeric', 'min:0'],
            'stock_qty'     => ['nullable', 'integer', 'min:0'],
            'is_active'     => ['boolean'],
            'sort_order'    => ['integer', 'min:0'],
        ], [
            'code.unique' => 'Kode reward sudah digunakan.',
        ]);
    }

    private function categoryOptions(): array
    {
        return [
            ['value' => 'merchandise', 'label' => 'Merchandise'],
            ['value' => 'voucher',     'label' => 'Voucher'],
            ['value' => 'food',        'label' => 'Makanan & Minuman'],
            ['value' => 'cash',        'label' => 'Cashback / Uang Tunai'],
            ['value' => 'service',     'label' => 'Layanan'],
            ['value' => 'other',       'label' => 'Lainnya'],
        ];
    }
}
