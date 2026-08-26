<?php

namespace App\Http\Controllers\Laporan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

/**
 * LaporanPenjualanController — PRODUCTION READY
 *
 * FIX KRITIS dari versi lama:
 *   [1] byVariant / byIntensity / bySize / byGender:
 *       INNER JOIN ke products → data made-to-order (product_id=NULL) hilang.
 *       Fix: gunakan snapshot columns (variant_id_snapshot, intensity_id_snapshot,
 *       size_id_snapshot, variant_name, intensity_code, size_ml) di sale_items.
 *
 *   [2] topPackaging: INNER JOIN ke packaging_materials → data hilang jika
 *       packaging dihapus (packaging_material_id=NULL).
 *       Fix: gunakan snapshot packaging_name + packaging_code.
 *
 *   [3] byCashier: INNER JOIN ke users → transaksi dengan cashier yang sudah
 *       dihapus tidak masuk laporan.
 *       Fix: LEFT JOIN + gunakan snapshot cashier_name dari sales.
 *
 *   [4] groupExpr / labelExpr: hardcoded PostgreSQL saja.
 *       Fix: helper groupExpression() yang support MySQL & PostgreSQL.
 *
 *   [5] recentTransactions: tambah total_items_sold per transaksi
 *       (dihitung dari sale_items).
 *
 *   [6] byGender: ambil dari snapshot variant_id_snapshot + variants.gender.
 *       Jika variant sudah dihapus tapi snapshot ada, data tetap masuk
 *       via LEFT JOIN + COALESCE.
 *
 *   [7] Semua kolom harga di-cast ke float (decimal 15,2), bukan int.
 */
class LaporanPenjualanController extends Controller
{
    public function index(Request $request)
    {
        $user         = auth()->user();
        $isSuperAdmin = (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : false) || $user->can('view-all-stores');

        // ── Filter params ─────────────────────────────────────────────────────
        // Non-super-admin TIDAK BOLEH override store_id dari request (IDOR) —
        // selalu dikunci ke toko default mereka sendiri.
        $storeId  = $isSuperAdmin
            ? $request->input('store_id')
            : ($user->default_store_id ?? null);
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo   = $request->input('date_to', Carbon::now()->toDateString());
        $groupBy  = $request->input('group_by', 'day');       // day | week | month
        $status   = $request->input('status', 'completed');   // completed | all | cancelled | refunded

        // sold_at adalah TIMESTAMP → pakai full day range
        $dateFromDt = Carbon::parse($dateFrom)->startOfDay();
        $dateToDt   = Carbon::parse($dateTo)->endOfDay();
        
        if ($dateFromDt->diffInDays($dateToDt) > 90) {
            $dateFromDt = $dateToDt->copy()->subDays(90)->startOfDay();
        }

        // ── Daftar toko (dropdown) ────────────────────────────────────────────
        $stores = DB::table('stores')
            ->where('is_active', true)
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        // ── DB expressions per driver ─────────────────────────────────────────
        [$groupExpr, $labelExpr] = $this->groupExpression($groupBy);

     
        // ══════════════════════════════════════════════════════════════════════
        //  DATA RETRIEVAL
        // ══════════════════════════════════════════════════════════════════════

        $summary    = $this->getSummary($storeId, $status, $dateFromDt, $dateToDt);
        $trendData  = $this->getTrendData($storeId, $status, $dateFromDt, $dateToDt, $groupExpr, $labelExpr);
        $breakdowns = $this->getProductBreakdowns($storeId, $status, $dateFromDt, $dateToDt);
        $rankings   = $this->getPeopleRankings($storeId, $status, $dateFromDt, $dateToDt, $isSuperAdmin);
        $miscData   = $this->getMiscReportData($storeId, $status, $dateFromDt, $dateToDt, $groupExpr, $labelExpr);
        $byPayment  = $this->getPaymentBreakdown($storeId, $status, $dateFromDt, $dateToDt);

        // ══════════════════════════════════════════════════════════════════════
        //  RETURN
        // ══════════════════════════════════════════════════════════════════════
        return Inertia::render('Dashboard/Laporan/Penjualan', [
            'filters' => [
                'store_id'  => $storeId,
                'date_from' => $dateFromDt->toDateString(),
                'date_to'   => $dateToDt->toDateString(),
                'group_by'  => $groupBy,
                'status'    => $status,
            ],
            'stores'       => $stores,
            'isSuperAdmin' => $isSuperAdmin,

            'summary'            => $summary,
            'trendData'          => $trendData,
            'byIntensity'        => $breakdowns['byIntensity'],
            'bySize'             => $breakdowns['bySize'],
            'byGender'           => $breakdowns['byGender'],
            'byVariant'          => $breakdowns['byVariant'],
            'topCustomers'       => $rankings['topCustomers'],
            'byCashier'          => $rankings['byCashier'],
            'byStore'            => $rankings['byStore'],
            'bySalesPerson'      => $rankings['bySalesPerson'],
            'topPackaging'       => $miscData['topPackaging'],
            'hourlyData'         => $miscData['hourlyData'],
            'memberTrend'        => $miscData['memberTrend'],
            'recentTransactions' => $miscData['recentTransactions'],
            'byPayment'          => $byPayment,
        ]);
    }

    /**
     * Breakdown total transaksi per metode pembayaran.
     * total_amount = kas bersih: untuk tunai, kembalian (sales.change_amount) dikurangi
     * karena sale_payments.amount menyimpan uang yang diserahkan customer.
     * Menghormati filter store/tanggal/status yang sama dengan laporan.
     */
    private function getPaymentBreakdown($storeId, $status, $dateFromDt, $dateToDt): array
    {
        return DB::table('sale_payments')
            ->join('sales', 'sale_payments.sale_id', '=', 'sales.id')
            ->leftJoin('payment_methods', 'sale_payments.payment_method_id', '=', 'payment_methods.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw("
                COALESCE(sale_payments.payment_method_name, payment_methods.name, 'Tidak Diketahui') AS method_name,
                COALESCE(sale_payments.payment_method_type, payment_methods.type, 'other')           AS method_type,
                COUNT(DISTINCT sales.id)                                                             AS tx_count,
                COALESCE(SUM(sale_payments.amount - CASE WHEN sale_payments.payment_method_type = 'cash' THEN sales.change_amount ELSE 0 END), 0) AS total_amount,
                COALESCE(SUM(sale_payments.admin_fee), 0)                                            AS total_admin_fee
            ")
            ->groupBy(
                'sale_payments.payment_method_name',
                'sale_payments.payment_method_type',
                'payment_methods.name',
                'payment_methods.type'
            )
            ->orderByDesc('total_amount')
            ->get()
            ->map(fn ($r) => [
                'method_name'     => $r->method_name,
                'method_type'     => $r->method_type,
                'tx_count'        => (int)   $r->tx_count,
                'total_amount'    => (float) round($r->total_amount, 2),
                'total_admin_fee' => (float) round($r->total_admin_fee, 2),
            ])
            ->toArray();
    }


    // ── Helper ────────────────────────────────────────────────────────────────

    /**
     * Kembalikan [groupExpr, labelExpr] sesuai driver DB.
     * Support MySQL/MariaDB dan PostgreSQL.
     */
    private function groupExpression(string $groupBy): array
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            return match ($groupBy) {
                'week'  => [
                    "TO_CHAR(DATE_TRUNC('week', sold_at), 'IYYY-IW')",
                    "CONCAT('Mg ', EXTRACT(WEEK FROM sold_at)::int)",
                ],
                'month' => [
                    "TO_CHAR(DATE_TRUNC('month', sold_at), 'YYYY-MM')",
                    "TO_CHAR(sold_at, 'Mon YYYY')",
                ],
                default => [
                    "DATE(sold_at)::text",
                    "TO_CHAR(sold_at, 'DD Mon')",
                ],
            };
        }

        // MySQL / MariaDB (default)
        return match ($groupBy) {
            'week'  => [
                "DATE_FORMAT(sold_at, '%x-W%v')",
                "CONCAT('Mg ', WEEK(sold_at))",
            ],
            'month' => [
                "DATE_FORMAT(sold_at, '%Y-%m')",
                "DATE_FORMAT(sold_at, '%b %Y')",
            ],
            default => [
                "DATE(sold_at)",
                "DATE_FORMAT(sold_at, '%d %b')",
            ],
        };
    }

    /**
     * Get summary data for the report.
     */
    private function getSummary($storeId, $status, $dateFromDt, $dateToDt): array
    {
        $summary = DB::table('sales')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->whereBetween('sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw("
                COUNT(*)                                                        AS total_transactions,
                COALESCE(SUM(total), 0)                                         AS total_revenue,
                COALESCE(SUM(subtotal), 0)                                      AS gross_sales,
                COALESCE(SUM(discount_amount), 0)                               AS total_discount,
                COALESCE(AVG(total), 0)                                         AS avg_order_value,
                COUNT(DISTINCT customer_id)                                     AS unique_customers,
                COUNT(DISTINCT cashier_id)                                      AS active_cashiers,
                COUNT(DISTINCT store_id)                                        AS active_stores,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)           AS completed_count,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)           AS cancelled_count,
                SUM(CASE WHEN status = 'refunded'  THEN 1 ELSE 0 END)           AS refunded_count,
                SUM(CASE WHEN customer_id IS NOT NULL THEN 1 ELSE 0 END)        AS member_tx,
                SUM(CASE WHEN customer_id IS NULL     THEN 1 ELSE 0 END)        AS walkin_tx
            ")
            ->first();

        $totalItemsSold = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->sum('sale_items.qty');

        // Kartu "Total Transaksi" harus menampilkan semua transaksi yang selesai + dibatalkan,
        // dan kartu "Dibatalkan" harus menghitung transaksi batal — keduanya tidak boleh
        // ikut terfilter oleh dropdown status (yang default-nya 'completed').
        $statusCounts = DB::table('sales')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->whereBetween('sold_at', [$dateFromDt, $dateToDt])
            ->whereIn('status', ['completed', 'cancelled'])
            ->selectRaw("
                COUNT(*)                                              AS total_all,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_all
            ")
            ->first();

        return [
            'totalTransactions' => (int)   $statusCounts->total_all,
            'totalRevenue'      => (float) round($summary->total_revenue, 2),
            'grossSales'        => (float) round($summary->gross_sales, 2),
            'totalDiscount'     => (float) round($summary->total_discount, 2),
            'totalItemsSold'    => (int)   $totalItemsSold,
            'avgOrderValue'     => (float) round($summary->avg_order_value, 2),
            'uniqueCustomers'   => (int)   $summary->unique_customers,
            'activeCashiers'    => (int)   $summary->active_cashiers,
            'activeStores'      => (int)   $summary->active_stores,
            'completedCount'    => (int)   $summary->completed_count,
            'cancelledCount'    => (int)   $statusCounts->cancelled_all,
            'refundedCount'     => (int)   $summary->refunded_count,
            'memberTx'          => (int)   $summary->member_tx,
            'walkinTx'          => (int)   $summary->walkin_tx,
            // Pakai statusCounts (unfiltered by dropdown status) — bukan $summary,
            // yang sudah ke-filter status sehingga completed_count == total_transactions
            // (selalu ~100%) saat filter default 'completed' dipakai.
            'completionRate'    => $statusCounts->total_all > 0
                ? round((($statusCounts->total_all - $statusCounts->cancelled_all) / $statusCounts->total_all) * 100, 2)
                : 0,
            'memberRate'        => $summary->total_transactions > 0 ? round(($summary->member_tx / $summary->total_transactions) * 100, 2) : 0,
        ];
    }

    /**
     * Get trend data for the report.
     */
    private function getTrendData($storeId, $status, $dateFromDt, $dateToDt, $groupExpr, $labelExpr): array
    {
        return DB::table('sales')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->whereBetween('sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw("
                {$groupExpr}                                                    AS period_key,
                {$labelExpr}                                                    AS label,
                COUNT(*)                                                        AS transactions,
                COALESCE(SUM(total), 0)                                         AS revenue,
                COALESCE(SUM(subtotal), 0)                                      AS gross_sales,
                COALESCE(SUM(discount_amount), 0)                               AS discount,
                COALESCE(AVG(total), 0)                                         AS avg_order,
                COUNT(DISTINCT customer_id)                                     AS unique_customers,
                SUM(CASE WHEN customer_id IS NOT NULL THEN 1 ELSE 0 END)        AS member_tx
            ")
            ->groupByRaw("{$groupExpr}, {$labelExpr}")
            ->orderByRaw($groupExpr)
            ->get()
            ->map(fn ($r) => [
                'label'            => $r->label,
                'transactions'     => (int)   $r->transactions,
                'revenue'          => (float) round($r->revenue, 2),
                'gross_sales'      => (float) round($r->gross_sales, 2),
                'discount'         => (float) round($r->discount, 2),
                'avg_order'        => (float) round($r->avg_order, 2),
                'unique_customers' => (int)   $r->unique_customers,
                'member_tx'        => (int)   $r->member_tx,
            ])
            ->toArray();
    }

    /**
     * Get product breakdown data (Variant, Intensity, Size, Gender).
     */
    private function getProductBreakdowns($storeId, $status, $dateFromDt, $dateToDt): array
    {
        // By Variant
        $byVariant = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('variants', 'sale_items.variant_id_snapshot', '=', 'variants.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->whereNotNull('sale_items.variant_id_snapshot')
            ->selectRaw('
                sale_items.variant_id_snapshot                                      AS variant_id,
                COALESCE(variants.name, sale_items.variant_name, \'Unknown\')       AS name,
                COALESCE(variants.gender, \'unisex\')                               AS gender,
                SUM(sale_items.qty)                                                 AS qty,
                COALESCE(SUM(sale_items.subtotal), 0)                               AS revenue,
                COALESCE(AVG(sale_items.unit_price), 0)                             AS avg_price,
                COUNT(DISTINCT sales.id)                                            AS tx_count
            ')
            ->groupBy(
                'sale_items.variant_id_snapshot',
                'variants.name',
                'variants.gender',
                'sale_items.variant_name'
            )
            ->orderByDesc('qty')
            ->limit(15)
            ->get()
            ->map(fn ($r) => [
                'id'        => $r->variant_id,
                'name'      => $r->name,
                'gender'    => $r->gender,
                'qty'       => (int)   $r->qty,
                'revenue'   => (float) $r->revenue,
                'avg_price' => (float) $r->avg_price,
                'tx_count'  => (int)   $r->tx_count,
            ])
            ->toArray();

        // By Intensity
        $byIntensityRaw = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('intensities', 'sale_items.intensity_id_snapshot', '=', 'intensities.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->whereNotNull('sale_items.intensity_id_snapshot')
            ->selectRaw('
                sale_items.intensity_id_snapshot                                AS intensity_id,
                COALESCE(intensities.code, sale_items.intensity_code)           AS code,
                COALESCE(intensities.name, sale_items.intensity_code)           AS name,
                SUM(sale_items.qty)                                             AS qty,
                COALESCE(SUM(sale_items.subtotal), 0)                           AS revenue,
                COUNT(DISTINCT sales.id)                                        AS tx_count
            ')
            ->groupBy(
                'sale_items.intensity_id_snapshot',
                'intensities.code',
                'intensities.name',
                'sale_items.intensity_code'
            )
            ->orderByDesc('qty')
            ->get();

        $totalQtyInt = $byIntensityRaw->sum('qty');
        $byIntensity = $byIntensityRaw->map(fn ($r) => [
            'code'     => $r->code,
            'name'     => $r->name,
            'qty'      => (int)   $r->qty,
            'revenue'  => (float) $r->revenue,
            'tx_count' => (int)   $r->tx_count,
            'pct'      => $totalQtyInt > 0 ? round(($r->qty / $totalQtyInt) * 100, 1) : 0,
        ])->toArray();

        // By Size
        $bySize = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('sizes', 'sale_items.size_id_snapshot', '=', 'sizes.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->whereNotNull('sale_items.size_id_snapshot')
            ->selectRaw('
                sale_items.size_id_snapshot                                     AS size_id,
                COALESCE(sale_items.size_ml, sizes.volume_ml)                   AS volume_ml,
                COALESCE(sizes.name, CONCAT(sale_items.size_ml, \'ml\'))        AS name,
                SUM(sale_items.qty)                                             AS qty,
                COALESCE(SUM(sale_items.subtotal), 0)                           AS revenue
            ')
            ->groupBy(
                'sale_items.size_id_snapshot',
                'sale_items.size_ml',
                'sizes.volume_ml',
                'sizes.name'
            )
            ->orderByDesc('qty')
            ->get()
            ->map(fn ($r) => [
                'volume_ml' => (int)   $r->volume_ml,
                'name'      => $r->name,
                'qty'       => (int)   $r->qty,
                'revenue'   => (float) $r->revenue,
            ])
            ->toArray();

        // By Gender
        $byGender = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('variants', 'sale_items.variant_id_snapshot', '=', 'variants.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw('
                COALESCE(variants.gender, \'unisex\')    AS gender,
                SUM(sale_items.qty)                     AS qty,
                COALESCE(SUM(sale_items.subtotal), 0)   AS revenue,
                COUNT(DISTINCT sales.id)                AS tx_count
            ')
            ->groupByRaw('COALESCE(variants.gender, \'unisex\')')
            ->orderByDesc('qty')
            ->get()
            ->map(fn ($r) => [
                'gender'   => $r->gender,
                'qty'      => (int)   $r->qty,
                'revenue'  => (float) $r->revenue,
                'tx_count' => (int)   $r->tx_count,
            ])
            ->toArray();

        return [
            'byVariant'   => $byVariant,
            'byIntensity' => $byIntensity,
            'bySize'      => $bySize,
            'byGender'    => $byGender,
        ];
    }

    /**
     * Get people rankings and performance (Customers, Cashiers, Stores, SalesPeople).
     */
    private function getPeopleRankings($storeId, $status, $dateFromDt, $dateToDt, $isSuperAdmin): array
    {
        // Top Customers
        $topCustomers = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw('
                customers.id,
                customers.name,
                customers.phone,
                customers.points                        AS current_points,
                COUNT(sales.id)                         AS total_orders,
                COALESCE(SUM(sales.total), 0)           AS total_spending,
                COALESCE(AVG(sales.total), 0)           AS avg_order,
                MAX(DATE(sales.sold_at))                AS last_purchase
            ')
            ->groupBy(
                'customers.id',
                'customers.name',
                'customers.phone',
                'customers.points'
            )
            ->orderByDesc('total_spending')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'id'             => $r->id,
                'name'           => $r->name,
                'phone'          => $r->phone,
                'current_points' => (int)   $r->current_points,
                'total_orders'   => (int)   $r->total_orders,
                'total_spending' => (float) $r->total_spending,
                'avg_order'      => (float) $r->avg_order,
                'last_purchase'  => $r->last_purchase ? Carbon::parse($r->last_purchase)->format('d M Y') : '-',
            ])
            ->toArray();

        // By Cashier
        $byCashier = DB::table('sales')
            ->leftJoin('users', 'sales.cashier_id', '=', 'users.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->whereNotNull('sales.cashier_id')
            ->selectRaw('
                sales.cashier_id,
                COALESCE(sales.cashier_name, users.name, \'(Kasir Dihapus)\')  AS name,
                COUNT(sales.id)                                                 AS total_transactions,
                COALESCE(SUM(sales.total), 0)                                   AS total_revenue,
                COALESCE(AVG(sales.total), 0)                                   AS avg_order,
                COUNT(DISTINCT sales.customer_id)                               AS unique_customers
            ')
            ->groupBy('sales.cashier_id', 'users.name', 'sales.cashier_name')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(fn ($r) => [
                'id'                 => $r->cashier_id,
                'name'               => $r->name,
                'total_transactions' => (int)   $r->total_transactions,
                'total_revenue'      => (float) $r->total_revenue,
                'avg_order'          => (float) $r->avg_order,
                'unique_customers'   => (int)   $r->unique_customers,
            ])
            ->toArray();

        // By Store
        $byStore = [];
        if ($isSuperAdmin) {
            $byStoreRaw = DB::table('sales')
                ->join('stores', 'sales.store_id', '=', 'stores.id')
                ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
                ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
                ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
                ->selectRaw("
                    stores.id,
                    stores.name,
                    stores.code,
                    COUNT(sales.id)                                                 AS transactions,
                    COALESCE(SUM(sales.total), 0)                                   AS revenue,
                    COALESCE(AVG(sales.total), 0)                                   AS avg_order,
                    COUNT(DISTINCT sales.customer_id)                               AS unique_customers,
                    SUM(CASE WHEN sales.customer_id IS NOT NULL THEN 1 ELSE 0 END)  AS member_tx
                ")
                ->groupBy('stores.id', 'stores.name', 'stores.code')
                ->orderByDesc('revenue')
                ->get();

            $totalRevStore = $byStoreRaw->sum('revenue');
            $byStore = $byStoreRaw->map(fn ($r) => [
                'id'               => $r->id,
                'name'             => $r->name,
                'code'             => $r->code,
                'transactions'     => (int)   $r->transactions,
                'revenue'          => (float) $r->revenue,
                'avg_order'        => (float) $r->avg_order,
                'unique_customers' => (int)   $r->unique_customers,
                'member_tx'        => (int)   $r->member_tx,
                'share_pct'        => $totalRevStore > 0 ? round(($r->revenue / $totalRevStore) * 100, 1) : 0,
            ])->toArray();
        }

        // By Sales Person
        $bySalesPerson = DB::table('sales')
            ->join('sales_people', 'sales.sales_person_id', '=', 'sales_people.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw('
                sales_people.id,
                COALESCE(sales.sales_person_name, sales_people.name)    AS name,
                sales_people.code,
                COUNT(sales.id)                                         AS transactions,
                COALESCE(SUM(sales.total), 0)                           AS revenue,
                COALESCE(AVG(sales.total), 0)                           AS avg_order,
                COUNT(DISTINCT sales.customer_id)                       AS unique_customers
            ')
            ->groupBy(
                'sales_people.id',
                'sales_people.name',
                'sales_people.code',
                'sales.sales_person_name'
            )
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => [
                'id'               => $r->id,
                'name'             => $r->name,
                'code'               => $r->code,
                'transactions'     => (int)   $r->transactions,
                'revenue'          => (float) $r->revenue,
                'avg_order'        => (float) $r->avg_order,
                'unique_customers' => (int)   $r->unique_customers,
            ])->toArray();

        return [
            'topCustomers'  => $topCustomers,
            'byCashier'     => $byCashier,
            'byStore'       => $byStore,
            'bySalesPerson' => $bySalesPerson,
        ];
    }

    /**
     * Get misc data for the report (Packaging, Hourly, Member Trend, Recent Transactions).
     */
    private function getMiscReportData($storeId, $status, $dateFromDt, $dateToDt, $groupExpr, $labelExpr): array
    {
        // Top Packaging
        $topPackaging = DB::table('sale_item_packagings')
            ->join('sale_items', 'sale_item_packagings.sale_item_id', '=', 'sale_items.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->leftJoin('packaging_materials', 'sale_item_packagings.packaging_material_id', '=', 'packaging_materials.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw('
                sale_item_packagings.packaging_name                             AS name,
                COALESCE(sale_item_packagings.packaging_code,
                         packaging_materials.code)                              AS code,
                SUM(sale_item_packagings.qty)                                   AS qty,
                COALESCE(SUM(sale_item_packagings.subtotal), 0)                 AS revenue
            ')
            ->groupBy(
                'sale_item_packagings.packaging_name',
                'sale_item_packagings.packaging_code',
                'packaging_materials.code'
            )
            ->orderByDesc('qty')
            ->limit(10)
            ->get()
            ->map(fn ($r) => [
                'name'    => $r->name,
                'code'    => $r->code,
                'qty'     => (int)   $r->qty,
                'revenue' => (float) $r->revenue,
            ])
            ->toArray();

        // Hourly Heatmap
        $driver       = DB::getDriverName();
        $hourExpr     = $driver === 'pgsql' ? 'EXTRACT(HOUR FROM sold_at)::int' : 'HOUR(sold_at)';
        $byHourRaw = DB::table('sales')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->whereBetween('sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw("
                {$hourExpr}             AS hour,
                COUNT(*)                AS transactions,
                COALESCE(SUM(total), 0) AS revenue
            ")
            ->groupByRaw($hourExpr)
            ->orderByRaw($hourExpr)
            ->get()
            ->keyBy('hour');

        $hourlyData = collect(range(0, 23))->map(fn ($h) => [
            'hour'         => $h,
            'label'        => sprintf('%02d:00', $h),
            'transactions' => isset($byHourRaw[$h]) ? (int) $byHourRaw[$h]->transactions : 0,
            'revenue'      => isset($byHourRaw[$h]) ? (float) $byHourRaw[$h]->revenue    : 0,
        ])->toArray();

        // Member Trend
        $memberTrend = DB::table('sales')
            ->when($storeId, fn ($q) => $q->where('store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->whereBetween('sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw("
                {$groupExpr}                                                            AS period_key,
                {$labelExpr}                                                            AS label,
                SUM(CASE WHEN customer_id IS NOT NULL THEN 1 ELSE 0 END)                AS member,
                SUM(CASE WHEN customer_id IS NULL     THEN 1 ELSE 0 END)                AS walkin,
                COALESCE(SUM(CASE WHEN customer_id IS NOT NULL THEN total ELSE 0 END), 0) AS member_revenue,
                COALESCE(SUM(CASE WHEN customer_id IS NULL     THEN total ELSE 0 END), 0) AS walkin_revenue
            ")
            ->groupByRaw("{$groupExpr}, {$labelExpr}")
            ->orderByRaw($groupExpr)
            ->get()
            ->map(fn ($r) => [
                'label'          => $r->label,
                'member'         => (int)   $r->member,
                'walkin'         => (int)   $r->walkin,
                'member_revenue' => (float) $r->member_revenue,
                'walkin_revenue' => (float) $r->walkin_revenue,
            ])
            ->toArray();

        // Recent Transactions
        $recentTransactions = DB::table('sales')
            ->leftJoin('customers',    'sales.customer_id',     '=', 'customers.id')
            ->leftJoin('users',        'sales.cashier_id',      '=', 'users.id')
            ->leftJoin('sales_people', 'sales.sales_person_id', '=', 'sales_people.id')
            ->join('stores',           'sales.store_id',        '=', 'stores.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->selectRaw('
                sales.id                                                        AS sale_id,
                sales.sale_number,
                sales.sold_at,
                sales.status,
                sales.subtotal,
                sales.discount_amount,
                sales.total,
                stores.name                                                     AS store_name,
                COALESCE(sales.customer_name, customers.name)                   AS customer_name,
                COALESCE(sales.cashier_name, users.name)                        AS cashier_name,
                COALESCE(sales.sales_person_name, sales_people.name)            AS sales_person_name
            ')
            ->orderByDesc('sales.sold_at')
            ->limit(50)
            ->get();

        $saleIds        = $recentTransactions->pluck('sale_id');
        $itemsPerSale   = DB::table('sale_items')
            ->whereIn('sale_id', $saleIds)
            ->selectRaw('sale_id, SUM(qty) AS total_qty')
            ->groupBy('sale_id')
            ->pluck('total_qty', 'sale_id');

        $recentTransactions = $recentTransactions->map(fn ($r) => [
            'invoice'        => $r->sale_number,
            'date'           => Carbon::parse($r->sold_at)->setTimezone('Asia/Jakarta')->format('d M Y'),
            'time'           => Carbon::parse($r->sold_at)->setTimezone('Asia/Jakarta')->format('H:i'),
            'status'         => $r->status,
            'store'          => $r->store_name,
            'customer'       => $r->customer_name ?? 'Walk-in',
            'cashier'        => $r->cashier_name  ?? '-',
            'sales_person'   => $r->sales_person_name ?? '-',
            'total_items'    => (int) ($itemsPerSale[$r->sale_id] ?? 0),
            'gross_sales'    => (float) $r->subtotal,
            'discount'       => (float) $r->discount_amount,
            'total'          => (float) $r->total,
        ])->toArray();

        return [
            'topPackaging'       => $topPackaging,
            'hourlyData'         => $hourlyData,
            'memberTrend'        => $memberTrend,
            'recentTransactions' => $recentTransactions,
        ];
    }

    public function exportExcel(Request $request)
    {
        $user         = auth()->user();
        $isSuperAdmin = (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : false) || $user->can('view-all-stores');

        // Non-super-admin TIDAK BOLEH override store_id dari request (IDOR) —
        // selalu dikunci ke toko default mereka sendiri.
        $storeId  = $isSuperAdmin
            ? $request->input('store_id')
            : ($user->default_store_id ?? null);
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo   = $request->input('date_to', Carbon::now()->toDateString());
        $status   = $request->input('status', 'completed');

        $dateFromDt = Carbon::parse($dateFrom)->startOfDay();
        $dateToDt   = Carbon::parse($dateTo)->endOfDay();

        if ($dateFromDt->diffInDays($dateToDt) > 90) {
            $dateFromDt = $dateToDt->copy()->subDays(90)->startOfDay();
        }

        $sales = DB::table('sales')
            ->leftJoin('customers',    'sales.customer_id',     '=', 'customers.id')
            ->leftJoin('users',        'sales.cashier_id',      '=', 'users.id')
            ->leftJoin('sales_people', 'sales.sales_person_id', '=', 'sales_people.id')
            ->join('stores',           'sales.store_id',        '=', 'stores.id')
            ->when($storeId, fn ($q) => $q->where('sales.store_id', $storeId))
            ->when($status !== 'all', fn ($q) => $q->where('sales.status', $status))
            ->whereBetween('sales.sold_at', [$dateFromDt, $dateToDt])
            ->select([
                'sales.id',
                'sales.sale_number',
                'sales.sold_at',
                'sales.status',
                'sales.subtotal',
                'sales.discount_amount',
                'sales.total',
                'stores.name as store_name',
                DB::raw('COALESCE(customers.phone, sales.customer_name) as customer_phone'),
                DB::raw('COALESCE(sales.cashier_name, users.name) as cashier_name'),
                DB::raw('COALESCE(sales.sales_person_name, sales_people.name) as sales_person_name'),
            ])
            ->orderByDesc('sales.sold_at')
            ->get();

        $saleIds = $sales->pluck('id')->toArray();

        $saleItems = DB::table('sale_items')
            ->whereIn('sale_id', $saleIds)
            ->select(['sale_id', 'product_name', 'variant_name', 'intensity_code', 'size_ml', 'qty', 'unit_price', 'subtotal'])
            ->get()
            ->groupBy('sale_id');

        $saleDiscounts = DB::table('sale_discounts')
            ->whereIn('sale_id', $saleIds)
            ->select(['sale_id', 'discount_name', 'applied_amount'])
            ->get()
            ->groupBy('sale_id');

        $salePayments = DB::table('sale_payments')
            ->whereIn('sale_id', $saleIds)
            ->select(['sale_id', 'payment_method_name', 'amount'])
            ->get()
            ->groupBy('sale_id');

        $filename = "Laporan_Penjualan_{$dateFromDt->format('Ymd')}_{$dateToDt->format('Ymd')}.xlsx";

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Penjualan');

        $sheet->fromArray([
            'No. Invoice', 'Tanggal', 'Waktu', 'Status', 'Toko',
            'No.Telp', 'Kasir', 'Sales Person',
            'Item', 'Variant', 'Qty',
            'Gross Sales', 'Discount Applied', 'Total', 'Payment Method',
        ], null, 'A1');
        $sheet->getStyle('A1:O1')->getFont()->setBold(true);

        $row = 2;
        foreach ($sales as $sale) {
            $items = $saleItems[$sale->id] ?? collect();
            $discApplied = ($saleDiscounts[$sale->id] ?? collect())
                ->map(fn ($d) => $d->discount_name . ' (-' . number_format($d->applied_amount, 2, ',', '.') . ')')
                ->implode('; ');
            $payMethods = ($salePayments[$sale->id] ?? collect())
                ->map(fn ($p) => $p->payment_method_name)
                ->unique()->implode(', ');

            // Data transaksi yang diulang penuh di tiap baris item (tidak dikosongkan).
            $base = [
                $sale->sale_number,
                Carbon::parse($sale->sold_at)->setTimezone('Asia/Jakarta')->format('Y-m-d'),
                Carbon::parse($sale->sold_at)->setTimezone('Asia/Jakarta')->format('H:i:s'),
                $sale->status,
                $sale->store_name,
                $sale->customer_phone ?? '-',
                $sale->cashier_name ?? '-',
                $sale->sales_person_name ?? '-',
            ];

            if ($items->isEmpty()) {
                $sheet->fromArray(array_merge($base, [
                    '-', '-', 0, (float) $sale->subtotal,
                    $discApplied ?: '-', (float) $sale->total, $payMethods ?: '-',
                ]), null, 'A' . $row);
                $row++;
                continue;
            }

            foreach ($items as $item) {
                $itemName = $item->product_name
                    ?: implode(' ', array_filter([$item->variant_name, $item->intensity_code, $item->size_ml ? $item->size_ml . 'ml' : null]));

                $sheet->fromArray(array_merge($base, [
                    $itemName ?: '-',
                    $item->variant_name ?? '-',
                    (int)   $item->qty,
                    (float) $item->subtotal,
                    $discApplied ?: '-',
                    (float) $sale->total,
                    $payMethods ?: '-',
                ]), null, 'A' . $row);
                $row++;
            }
        }

        foreach (range('A', 'O') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // ── Sheet: Breakdown Metode Pembayaran ────────────────────────────────
        $byPayment = $this->getPaymentBreakdown($storeId, $status, $dateFromDt, $dateToDt);
        $paySheet  = $spreadsheet->createSheet();
        $paySheet->setTitle('Metode Pembayaran');
        $paySheet->fromArray(
            ['Metode', 'Tipe', 'Jumlah Transaksi', 'Total (Kas Bersih)', 'Total Biaya Admin'],
            null,
            'A1'
        );
        $paySheet->getStyle('A1:E1')->getFont()->setBold(true);

        $pRow = 2;
        foreach ($byPayment as $p) {
            $paySheet->fromArray([
                $p['method_name'],
                $p['method_type'],
                (int)   $p['tx_count'],
                (float) $p['total_amount'],
                (float) $p['total_admin_fee'],
            ], null, 'A' . $pRow);
            $pRow++;
        }
        $paySheet->setCellValue('A' . $pRow, 'TOTAL');
        $paySheet->getStyle('A' . $pRow . ':E' . $pRow)->getFont()->setBold(true);
        $paySheet->setCellValue('C' . $pRow, array_sum(array_column($byPayment, 'tx_count')));
        $paySheet->setCellValue('D' . $pRow, array_sum(array_column($byPayment, 'total_amount')));
        $paySheet->setCellValue('E' . $pRow, array_sum(array_column($byPayment, 'total_admin_fee')));

        foreach (range('A', 'E') as $col) {
            $paySheet->getColumnDimension($col)->setAutoSize(true);
        }

        return response()->streamDownload(function () use ($spreadsheet) {
            (new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet))->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}

