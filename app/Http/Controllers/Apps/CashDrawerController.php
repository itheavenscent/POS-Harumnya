<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\CashDrawer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashDrawerController extends Controller
{
    public function current()
    {
        $user = Auth::user();
        $storeId = $user->default_store_id;

        $drawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        if (!$drawer) {
            return Inertia::render('Dashboard/Shifts/NoActiveShift');
        }

        // Calculate current sales for the active drawer
        $salesSummary = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->selectRaw('
                COUNT(DISTINCT sales.id) as total_transactions,
                SUM(sale_items.qty) as total_items_sold,
                SUM(sale_items.subtotal) as gross_sales
            ')
            ->first();

        $cashSales = DB::table('sale_payments')
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->where('sale_payments.payment_method_type', 'cash')
            ->sum('sale_payments.amount');

        $nonCashSales = DB::table('sale_payments')
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->where('sale_payments.payment_method_type', '!=', 'cash')
            ->sum('sale_payments.amount');

        return Inertia::render('Dashboard/Shifts/Current', [
            'drawer' => $drawer,
            'summary' => [
                'transactions' => $salesSummary->total_transactions ?? 0,
                'items_sold' => (int)($salesSummary->total_items_sold ?? 0),
                'gross_sales' => (float)($salesSummary->gross_sales ?? 0),
                'cash_sales' => (float)$cashSales,
                'non_cash_sales' => (float)$nonCashSales,
            ],
        ]);
    }

    public function open(Request $request)
    {
        $request->validate([
            'starting_cash' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();
        $storeId = $user->default_store_id;

        if (!$storeId) {
            return back()->withErrors(['error' => 'Anda tidak memiliki toko default.']);
        }

        $activeDrawer = CashDrawer::where('store_id', $storeId)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        if ($activeDrawer) {
            return back()->withErrors(['error' => 'Anda masih memiliki shift yang terbuka. Tutup terlebih dahulu.']);
        }

        CashDrawer::create([
            'store_id' => $storeId,
            'cashier_id' => $user->id,
            'opened_at' => now(),
            'starting_cash' => $request->starting_cash,
            'status' => 'open',
        ]);

        return back()->with('success', 'Shift berhasil dibuka.');
    }

    public function close(Request $request, $id)
    {
        $request->validate([
            'actual_ending_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string'
        ]);

        $drawer = CashDrawer::where('id', $id)
            ->where('cashier_id', Auth::id())
            ->where('status', 'open')
            ->firstOrFail();

        $cashSales = DB::table('sale_payments')
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->where('sale_payments.payment_method_type', 'cash')
            ->sum('sale_payments.amount');

        $nonCashSales = DB::table('sale_payments')
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->where('sale_payments.payment_method_type', '!=', 'cash')
            ->sum('sale_payments.amount');

        $expected = $drawer->starting_cash + $cashSales;
        $difference = $request->actual_ending_cash - $expected;

        $drawer->update([
            'closed_at' => now(),
            'expected_ending_cash' => $expected,
            'actual_ending_cash' => $request->actual_ending_cash,
            'difference' => $difference,
            'total_cash_sales' => $cashSales,
            'total_non_cash_sales' => $nonCashSales,
            'status' => 'closed',
            'notes' => $request->notes,
        ]);

        return back()->with('success', 'Shift berhasil ditutup.');
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('super-admin');

        $query = CashDrawer::with(['cashier', 'store'])
            ->where('status', 'closed');

        if (!$isSuperAdmin) {
            $query->where('store_id', $user->default_store_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('opened_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('opened_at', '<=', $request->date_to);
        }

        $drawers = $query->latest('opened_at')->paginate(20)->withQueryString();

        return Inertia::render('Dashboard/Shifts/Index', [
            'drawers' => $drawers,
            'filters' => $request->only(['date_from', 'date_to']),
        ]);
    }

    public function show($id)
    {
        $drawer = CashDrawer::with(['store', 'cashier'])->findOrFail($id);
        
        $salesSummary = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->selectRaw('
                COUNT(DISTINCT sales.id) as total_transactions,
                SUM(sale_items.qty) as total_items_sold,
                SUM(sale_items.subtotal) as gross_sales
            ')
            ->first();

        // Get breakdown by category or other details if needed
        // Get breakdown by approximate category (Parfum vs Others)
        // Since the v2 schema doesn't have a direct product -> category link,
        // we group by the presence of variant_name.
        $categorySummary = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->select(
                DB::raw("CASE WHEN sale_items.variant_name IS NOT NULL THEN 'Parfum' ELSE 'Kemasan & Lainnya' END as name"),
                DB::raw('SUM(sale_items.qty) as qty'),
                DB::raw('SUM(sale_items.subtotal) as total')
            )
            ->groupBy(DB::raw("CASE WHEN sale_items.variant_name IS NOT NULL THEN 'Parfum' ELSE 'Kemasan & Lainnya' END"))
            ->get();


        return Inertia::render('Dashboard/Shifts/Show', [
            'drawer' => $drawer,
            'summary' => [
                'transactions' => $salesSummary->total_transactions ?? 0,
                'items_sold' => (int)($salesSummary->total_items_sold ?? 0),
                'gross_sales' => (float)($salesSummary->gross_sales ?? 0),
                'categories' => $categorySummary,
            ],
        ]);
    }

    public function printRecap($id)
    {
        $drawer = CashDrawer::with(['store', 'cashier'])->findOrFail($id);
        
        abort_if($drawer->status !== 'closed', 403, 'Shift belum ditutup.');
        abort_if($drawer->cashier_id !== Auth::id() && !Auth::user()->hasRole('super-admin'), 403);
        
        return Inertia::render('Dashboard/Transactions/PrintShift', [
            'drawer' => $drawer,
        ]);
    }
}
