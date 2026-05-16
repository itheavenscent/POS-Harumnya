<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\CashDrawer;
use App\Models\CashDrawerTransaction;
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

        $summary = $this->getSummaryData($drawer);

        return Inertia::render('Dashboard/Shifts/Current', [
            'drawer' => $drawer,
            'summary' => $summary,
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
            'actual_ending_cash' => 'nullable|numeric|min:0',
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

        $totalCashIn = CashDrawerTransaction::where('cash_drawer_id', $drawer->id)
            ->where('type', 'cash_in')
            ->sum('amount');

        $totalCashOut = CashDrawerTransaction::where('cash_drawer_id', $drawer->id)
            ->where('type', 'cash_out')
            ->sum('amount');

        $expected = $drawer->starting_cash + $cashSales + $totalCashIn - $totalCashOut;
        $actual = $request->input('actual_ending_cash', $expected);
        $difference = $actual - $expected;

        $drawer->update([
            'closed_at' => now(),
            'expected_ending_cash' => $expected,
            'actual_ending_cash' => $actual,
            'difference' => $difference,
            'total_cash_sales' => $cashSales,
            'total_non_cash_sales' => $nonCashSales,
            'status' => 'closed',
            'notes' => $request->notes,
        ]);

        return back()->with('success', 'Shift berhasil ditutup.');
    }

    public function storeTransaction(Request $request)
    {
        $request->validate([
            'type' => 'required|in:cash_in,cash_out',
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string|max:255',
        ]);

        $user = Auth::user();
        $drawer = CashDrawer::where('store_id', $user->default_store_id)
            ->where('cashier_id', $user->id)
            ->where('status', 'open')
            ->firstOrFail();

        CashDrawerTransaction::create([
            'cash_drawer_id' => $drawer->id,
            'type' => $request->type,
            'amount' => $request->amount,
            'description' => $request->description,
            'user_id' => $user->id,
        ]);

        return back()->with('success', 'Transaksi kas berhasil dicatat.');
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $isSuperAdmin = $user->hasRole('super-admin');

        $query = CashDrawer::with(['cashier', 'store'])
            ->where('status', 'closed');

        if (!$isSuperAdmin && !$user->hasRole('admin')) {
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
            'isAdmin' => $isSuperAdmin || $user->hasRole('admin'),
        ]);
    }

    public function show($id)
    {
        $drawer = CashDrawer::with(['store', 'cashier'])->findOrFail($id);
        $summary = $this->getSummaryData($drawer);

        return Inertia::render('Dashboard/Shifts/Show', [
            'drawer' => $drawer,
            'summary' => $summary,
            'isAdmin' => Auth::user()->hasRole('super-admin') || Auth::user()->hasRole('admin'),
        ]);
    }

    public function printRecap($id)
    {
        $drawer = CashDrawer::with(['store', 'cashier'])->findOrFail($id);
        
        // Izinkan cetak rekap meskipun shift masih buka (X-Report)
        abort_if($drawer->cashier_id !== Auth::id() && !Auth::user()->hasRole('super-admin') && !Auth::user()->hasRole('admin'), 403);
        
        $summary = $this->getSummaryData($drawer);

        return Inertia::render('Dashboard/Transactions/PrintShift', [
            'drawer' => $drawer,
            'summary' => $summary,
        ]);
    }

    private function getSummaryData(CashDrawer $drawer)
    {
        $salesSummary = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->selectRaw('
                COUNT(DISTINCT sales.id) as total_transactions,
                SUM(sale_items.qty) as total_items_sold,
                SUM(sale_items.subtotal) as gross_sales,
                SUM(sale_items.cogs_total) as total_cogs
            ')
            ->first();

        $categorySummary = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->select(
                DB::raw("CASE WHEN sale_items.variant_name IS NOT NULL THEN 'Parfum' WHEN sale_items.reward_item_id IS NOT NULL THEN 'Hadiah / Promo' ELSE 'Kemasan & Lainnya' END as name"),
                DB::raw('SUM(sale_items.qty) as qty'),
                DB::raw('SUM(sale_items.subtotal) as total')
            )
            ->groupBy(DB::raw("CASE WHEN sale_items.variant_name IS NOT NULL THEN 'Parfum' WHEN sale_items.reward_item_id IS NOT NULL THEN 'Hadiah / Promo' ELSE 'Kemasan & Lainnya' END"))
            ->get();

        $itemsSold = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->select(
                'sale_items.product_name',
                'sale_items.variant_name',
                'sale_items.intensity_code',
                'sale_items.size_ml',
                DB::raw('SUM(sale_items.qty) as total_qty'),
                DB::raw('SUM(sale_items.subtotal) as total_amount')
            )
            ->groupBy('sale_items.product_name', 'sale_items.variant_name', 'sale_items.intensity_code', 'sale_items.size_ml')
            ->orderBy('total_qty', 'desc')
            ->get();

        $cashTransactions = CashDrawerTransaction::where('cash_drawer_id', $drawer->id)
            ->with('user:id,name')
            ->get();

        $paymentSummary = DB::table('sale_payments')
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->join('payment_methods', 'sale_payments.payment_method_id', '=', 'payment_methods.id')
            ->where('sales.cash_drawer_id', $drawer->id)
            ->where('sales.status', 'completed')
            ->select(
                'payment_methods.name',
                DB::raw('COUNT(sale_payments.id) as count'),
                DB::raw('SUM(sale_payments.amount) as total')
            )
            ->groupBy('payment_methods.name')
            ->get();

        return [
            'transactions' => $salesSummary->total_transactions ?? 0,
            'items_sold' => (int)($salesSummary->total_items_sold ?? 0),
            'gross_sales' => (float)($salesSummary->gross_sales ?? 0),
            'total_cogs' => (float)($salesSummary->total_cogs ?? 0),
            'categories' => $categorySummary,
            'items' => $itemsSold,
            'cash_transactions' => $cashTransactions,
            'total_cash_in' => (float)$cashTransactions->where('type', 'cash_in')->sum('amount'),
            'total_cash_out' => (float)$cashTransactions->where('type', 'cash_out')->sum('amount'),
            'payments' => $paymentSummary,
        ];
    }
}
