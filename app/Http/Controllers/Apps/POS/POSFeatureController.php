<?php

namespace App\Http\Controllers\Apps\POS;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\StoreIngredientStock;
use App\Models\StorePackagingStock;
use App\Models\CashDrawer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class POSFeatureController extends Controller
{
    /**
     * View-only stock for the current store.
     */
    public function stock(Request $request): Response
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;
        $type = $request->input('type', 'ingredient');

        if ($type === 'ingredient') {
            $stocks = StoreIngredientStock::with(['ingredient.category'])
                ->where('store_id', $storeId)
                ->when($request->search, function ($query, $search) {
                    $query->whereHas('ingredient', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('code', 'like', "%{$search}%");
                    });
                })
                ->latest('updated_at')
                ->paginate(20)
                ->withQueryString();
        } else {
            $stocks = StorePackagingStock::with(['packagingMaterial.category', 'packagingMaterial.size'])
                ->where('store_id', $storeId)
                ->when($request->search, function ($query, $search) {
                    $query->whereHas('packagingMaterial', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%")
                          ->orWhere('code', 'like', "%{$search}%");
                    });
                })
                ->latest('updated_at')
                ->paginate(20)
                ->withQueryString();
        }

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/POS/Stock', [
            'stocks' => $stocks,
            'filters' => $request->only(['search', 'type']),
            'activeCashDrawer' => $activeCashDrawer,
        ]);
    }

    /**
     * View-only transaction history for the current store.
     */
    public function transactions(Request $request): Response
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        $sales = Sale::with(['customer', 'salesPerson', 'items.packagings.packagingMaterial', 'payments.paymentMethod'])
            ->withCount('items')
            ->where('store_id', $storeId)
            ->when(!$user->hasRole('super-admin') && !$user->hasPermissionTo('transactions-all'), function ($query) use ($user) {
                $query->where('cashier_id', $user->id);
            })
            ->when($request->search, function ($query, $search) {
                $query->where('sale_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%");
            })
            ->latest('sold_at')
            ->paginate(20)
            ->withQueryString();

        $activeCashDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->latest()
            ->first();

        return Inertia::render('Dashboard/POS/Transactions', [
            'sales' => $sales,
            'filters' => $request->only(['search']),
            'activeCashDrawer' => $activeCashDrawer,
        ]);
    }
}
