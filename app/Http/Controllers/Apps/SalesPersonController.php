<?php

namespace App\Http\Controllers\Apps;

use App\Models\Store;
use App\Models\SalesPerson;
use App\Models\SalesTarget;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class SalesPersonController extends Controller
{
    /**
     * Tampilan Daftar Sales People
     */
    public function index(Request $request)
    {
        $salesPeople = SalesPerson::with('store:id,name')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ilike', "%{$search}%")
                      ->orWhere('code', 'ilike', "%{$search}%")
                      ->orWhere('phone', 'ilike', "%{$search}%")
                      ->orWhere('email', 'ilike', "%{$search}%");
                });
            })

            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dashboard/SalesPeople/Index', [
            'salesPeople' => $salesPeople,
            'filters'     => $request->only(['search'])
        ]);
    }

    /**
     * Tampilan Form Tambah Sales
     */
    public function create()
    {
        return Inertia::render('Dashboard/SalesPeople/Create', [
            'stores' => Store::where('is_active', true)->get(['id', 'name'])
        ]);
    }

    /**
     * Proses Simpan Sales Baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_id'  => 'required|exists:stores,id',
            'code'      => 'required|string|max:50|unique:sales_people,code',
            'name'      => 'required|string|max:255',
            'phone'     => 'nullable|string|max:20',
            'email'     => 'nullable|email|max:100',
            'join_date' => 'nullable|date',
            'is_active' => 'boolean'
        ]);

        // Generate UUID
        $validated['id'] = (string) Str::uuid();

        SalesPerson::create($validated);

        return to_route('sales-people.index')
            ->with('success', 'Tenaga penjual berhasil ditambahkan!');
    }

    /**
     * Tampilan Form Edit Sales
     */
    public function edit(SalesPerson $salesPerson)
    {
        return Inertia::render('Dashboard/SalesPeople/Edit', [
            'salesPerson' => $salesPerson,
            'stores'      => Store::where('is_active', true)->get(['id', 'name'])
        ]);
    }

    /**
     * Proses Update Data Sales
     */
    public function update(Request $request, SalesPerson $salesPerson)
    {
        $request->validate([
            'store_id'  => 'required|exists:stores,id',
            'code'      => [
                'required',
                'string',
                'max:50',
                Rule::unique('sales_people', 'code')->ignore($salesPerson->id)
            ],
            'name'      => 'required|string|max:255',
            'phone'     => 'nullable|string|max:20',
            'email'     => 'nullable|email|max:100',
            'join_date' => 'nullable|date',
            'is_active' => 'boolean'
        ]);

        $salesPerson->update($request->all());

        return to_route('sales-people.index')
            ->with('success', 'Data tenaga penjual berhasil diperbarui!');
    }

    /**
     * Hapus Sales (Soft Delete)
     */
    public function destroy(SalesPerson $salesPerson)
    {
        $salesPerson->delete();

        return to_route('sales-people.index')
            ->with('success', 'Tenaga penjual berhasil dihapus!');
    }

    /**
     * Tampilan Manajemen Target
     */
    public function targets(SalesPerson $salesPerson)
    {
        $targets = SalesTarget::where('sales_person_id', $salesPerson->id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        // Penghasilan realisasi per bulan untuk sales ini (transaksi selesai).
        $driver    = DB::getDriverName();
        $yearExpr  = $driver === 'pgsql' ? "EXTRACT(YEAR FROM sold_at)::int"  : "YEAR(sold_at)";
        $monthExpr = $driver === 'pgsql' ? "EXTRACT(MONTH FROM sold_at)::int" : "MONTH(sold_at)";

        $realized = DB::table('sales')
            ->where('sales_person_id', $salesPerson->id)
            ->where('status', 'completed')
            ->whereNull('deleted_at')
            ->selectRaw("
                {$yearExpr}                  AS year,
                {$monthExpr}                 AS month,
                COUNT(*)                     AS transactions,
                COALESCE(SUM(total), 0)      AS revenue
            ")
            ->groupByRaw("{$yearExpr}, {$monthExpr}")
            ->get()
            ->keyBy(fn ($r) => (int) $r->year . '-' . (int) $r->month);

        // Sematkan penghasilan + jumlah transaksi ke tiap baris target.
        $targets->each(function ($t) use ($realized) {
            $key = (int) $t->year . '-' . (int) $t->month;
            $row = $realized->get($key);
            $t->realized_revenue     = $row ? (float) $row->revenue      : 0;
            $t->realized_transactions = $row ? (int)  $row->transactions : 0;
        });

        return Inertia::render('Dashboard/SalesPeople/Targets', [
            'salesPerson' => $salesPerson->load('store:id,name'),
            'targets'     => $targets
        ]);
    }

    /**
     * Proses Simpan/Update Target Bulanan
     */
    public function storeTarget(Request $request, SalesPerson $salesPerson)
    {
        $validated = $request->validate([
            'year'            => 'required|integer|min:2020|max:2099',
            'month'           => 'required|integer|between:1,12',
            'target_amount'   => 'nullable|numeric|min:0',
            'target_quantity' => 'nullable|numeric|min:0',
        ], [
            'year.required'  => 'Tahun wajib diisi.',
            'month.required' => 'Bulan wajib diisi.',
        ]);

        // Generate UUID untuk record baru
        $validated['id'] = (string) Str::uuid();

        // Gunakan updateOrCreate untuk menghindari duplikasi kombinasi Sales+Tahun+Bulan
        SalesTarget::updateOrCreate(
            [
                'sales_person_id' => $salesPerson->id,
                'year'            => $validated['year'],
                'month'           => $validated['month'],
            ],
            [
                'id'              => $validated['id'],
                'target_amount'   => $validated['target_amount'] ?? null,
                'target_quantity' => $validated['target_quantity'] ?? null,
            ]
        );

        return back()->with('success', 'Target berhasil diperbarui!');
    }

    /**
     * Tampilan Ranking & Detail Produktivitas Sales
     */
    public function productivity(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : ($user->hasRole('super-admin') || $user->hasRole('admin'));

        // ── Filter params ─────────────────────────────────────────────────────
        // Non-super-admin TIDAK BOLEH override store_id dari request (IDOR) —
        // selalu dikunci ke toko default mereka sendiri.
        $storeId   = $isSuperAdmin
            ? $request->input('store_id')
            : ($user->default_store_id ?? null);
        $dateFrom  = $request->input('date_from', \Illuminate\Support\Carbon::now()->startOfMonth()->toDateString());
        $dateTo    = $request->input('date_to', \Illuminate\Support\Carbon::now()->toDateString());
        $salesPersonId = $request->input('sales_person_id');

        $dateFromDt = \Illuminate\Support\Carbon::parse($dateFrom)->startOfDay();
        $dateToDt   = \Illuminate\Support\Carbon::parse($dateTo)->endOfDay();
        
        $dateFromDtStr = $dateFromDt->toDateTimeString();
        $dateToDtStr   = $dateToDt->toDateTimeString();

        // ── Stores Dropdown ──
        $stores = Store::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // ── Sales People Dropdown (for filtering transactions) ──
        $salesPeopleDropdown = SalesPerson::where('is_active', true)
            ->when(!$isSuperAdmin && $user->default_store_id, function ($q) use ($user) {
                $q->where('store_id', $user->default_store_id);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        // ── 1. Ranking Query (Grouped by Sales Person) ──
        $ranking = DB::table('sales')
            ->join('sales_people', 'sales.sales_person_id', '=', 'sales_people.id')
            ->leftJoin('stores', 'sales_people.store_id', '=', 'stores.id')
            ->where('sales.status', 'completed')
            ->whereNull('sales.deleted_at')
            ->whereNull('sales_people.deleted_at')
            ->whereBetween('sales.sold_at', [$dateFromDtStr, $dateToDtStr])
            ->when($storeId, function ($q) use ($storeId) {
                $q->where('sales.store_id', $storeId);
            })
            ->selectRaw('
                sales_people.id,
                sales_people.name,
                sales_people.code,
                stores.name as store_name,
                COUNT(sales.id) as transactions_count,
                COALESCE(SUM(sales.total), 0) as total_revenue,
                COALESCE(AVG(sales.total), 0) as average_sales,
                COALESCE((
                    SELECT SUM(qty)
                    FROM sale_items
                    WHERE sale_items.sale_id IN (
                        SELECT s.id
                        FROM sales s
                        WHERE s.sales_person_id = sales_people.id
                          AND s.status = \'completed\'
                          AND s.deleted_at IS NULL
                          AND s.sold_at BETWEEN ? AND ?
                          ' . ($storeId ? 'AND s.store_id = ?' : '') . '
                    )
                ), 0) as total_items_sold
            ', $storeId ? [$dateFromDtStr, $dateToDtStr, $storeId] : [$dateFromDtStr, $dateToDtStr])
            ->groupBy('sales_people.id', 'sales_people.name', 'sales_people.code', 'stores.name')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(fn ($r) => [
                'id'                 => $r->id,
                'name'               => $r->name,
                'code'               => $r->code,
                'store_name'         => $r->store_name,
                'transactions_count' => (int) $r->transactions_count,
                'total_revenue'      => (float) $r->total_revenue,
                'average_sales'      => (float) $r->average_sales,
                'total_items_sold'   => (int) $r->total_items_sold,
            ]);

        // ── 2. Detail Transactions Query ──
        $transactionsQuery = \App\Models\Sale::query()
            ->with(['salesPerson:id,name,code', 'store:id,name', 'customer:id,name'])
            ->where('status', 'completed')
            ->whereNotNull('sales_person_id')
            ->whereBetween('sold_at', [$dateFromDtStr, $dateToDtStr])
            ->when($storeId, function ($q) use ($storeId) {
                $q->where('store_id', $storeId);
            })
            ->when($salesPersonId, function ($q) use ($salesPersonId) {
                $q->where('sales_person_id', $salesPersonId);
            })
            ->orderByDesc('sold_at');

        $transactions = $transactionsQuery->paginate(10)->withQueryString();

        return Inertia::render('Dashboard/SalesPeople/Productivity', [
            'ranking'             => $ranking,
            'transactions'        => $transactions,
            'stores'              => $stores,
            'salesPeopleDropdown' => $salesPeopleDropdown,
            'filters'             => [
                'store_id'        => $storeId,
                'date_from'       => $dateFrom,
                'date_to'         => $dateTo,
                'sales_person_id' => $salesPersonId,
            ],
            'isSuperAdmin'        => $isSuperAdmin,
        ]);
    }
}

