import React, { useState } from "react";
import { Head, router, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Pagination from "@/Components/Dashboard/Pagination";
import {
    IconDatabaseOff, IconSearch, IconHistory, IconReceipt,
    IconPrinter, IconFilter, IconX, IconTrendingUp, IconCalendar,
    IconRefresh, IconEye, IconUser, IconFlask, IconBox, IconBuildingStore,
    IconFileSpreadsheet
} from "@tabler/icons-react";

const defaultFilters = { q: "", date_from: "", date_to: "", status: "", store_id: "" };

const fmt = (v = 0) =>
    Number(v || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Cek apakah transaksi terjadi pada hari yang sama (hari H).
// Pembatalan hanya boleh di hari H — selaras dengan rule HPP di backend.
const isSameDay = (soldAt) => {
    if (!soldAt) return false;
    const d = new Date(soldAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && d.getDate() === now.getDate();
};

// Format sold_at (timestamp) menjadi tanggal & waktu
const fmtSoldAt = (soldAt) => {
    if (!soldAt) return { date: "-", time: "" };
    const d = new Date(soldAt);
    return {
        date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
};

const STATUS_BADGE = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    cancelled:  "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
    refunded:   "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    pending:    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    draft:      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABEL = {
    completed: "Selesai", cancelled: "Dibatalkan",
    refunded: "Refund", pending: "Pending", draft: "Draft",
};

export default function History({ sales, filters, summary = {}, stores = [], isAdmin = false, canCancelSale = false, canPrint = false }) {
    const [q,          setQ]          = useState(filters.q          || "");
    const [dateFrom,   setDateFrom]   = useState(filters.date_from  || "");
    const [dateTo,     setDateTo]     = useState(filters.date_to    || "");
    const [status,     setStatus]     = useState(filters.status     || "");
    const [storeId,    setStoreId]    = useState(filters.store_id   || "");
    const [showFilters,  setShowFilters]  = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);
    const [showCancelSale, setShowCancelSale] = useState(false);
    const [cancelReason, setCancelReason]     = useState("");
    const [cancellingSale, setCancellingSale] = useState(false);

    // Derived: current filter state as object
    const filterData = { q, date_from: dateFrom, date_to: dateTo, status, store_id: storeId };

    const handleCancelSale = () => {
        if (!selectedSale || !cancelReason.trim()) return;
        setCancellingSale(true);
        router.post(route("transactions.cancel-sale", selectedSale.id), { reason: cancelReason }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCancelSale(false);
                setCancelReason("");
                setSelectedSale(null);
            },
            onFinish: () => setCancellingSale(false),
        });
    };

    const applyFilters = (e) => {
        e.preventDefault();
        const f = { q, date_from: dateFrom, date_to: dateTo, status, store_id: storeId };
        Object.keys(f).forEach(k => { if (!f[k]) delete f[k]; });
        router.get(route("transactions.history"), f, { preserveScroll: true, preserveState: true, replace: true });
        setShowFilters(false);
    };

    const resetFilters = () => {
        setQ(""); setDateFrom(""); setDateTo(""); setStatus(""); setStoreId("");
        router.get(route("transactions.history"), {}, { preserveState: false, replace: true });
    };

    const rows        = sales?.data         ?? [];
    const links       = sales?.links        ?? [];
    const currentPage = sales?.current_page ?? 1;
    const perPage     = Number(sales?.per_page || 20);
    const hasFilter   = q || dateFrom || dateTo || status || storeId;

    // URL export mengikuti filter aktif
    const exportUrl = (() => {
        const params = Object.fromEntries(Object.entries(filterData).filter(([, v]) => v));
        const qs = new URLSearchParams(params).toString();
        return route("transactions.history.export") + (qs ? `?${qs}` : "");
    })();

    // Summary dari controller — gunakan kolom decimal langsung
    const sumStats = summary && typeof summary === "object" ? summary : {};

    // Nama toko yang sedang difilter
    const selectedStoreName = storeId
        ? (stores.find(s => String(s.id) === String(storeId))?.name ?? "")
        : "";

    return (
        <>
            <Head title="Riwayat Transaksi"/>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <IconHistory size={28} className="text-primary-500"/>
                            Riwayat Transaksi
                            {isAdmin && (
                                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-full">
                                    All Toko
                                </span>
                            )}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {sales?.total ?? 0} transaksi tercatat
                            {selectedStoreName && (
                                <span className="ml-1 font-semibold text-primary-600 dark:text-primary-400">
                                    · {selectedStoreName}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                                showFilters || hasFilter
                                    ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-950/50 dark:border-primary-800 dark:text-primary-400"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            }`}>
                            <IconFilter size={18}/>
                            Filter
                            {hasFilter && <span className="w-2 h-2 rounded-full bg-primary-500"/>}
                        </button>
                        <a href={exportUrl} target="_blank" rel="noopener"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400 text-sm font-medium transition-colors">
                            <IconFileSpreadsheet size={18}/> Export Excel
                        </a>
                        <Link href={route("transactions.index")}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors shadow-lg shadow-primary-500/30">
                            <IconReceipt size={18}/> Transaksi Baru
                        </Link>
                    </div>
                </div>

                {/* Search bar — cari no. invoice / nama pelanggan */}
                <form onSubmit={applyFilters} className="relative">
                    <IconSearch size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                    <input
                        type="text"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cari no. invoice (mis. INV-20260731-00043) / nama pelanggan…"
                        className="w-full pl-11 pr-28 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                    />
                    {q && (
                        <button type="button"
                            onClick={() => { setQ(""); router.get(route("transactions.history"), { ...filterData, q: "" }, { preserveScroll: true, preserveState: true, replace: true }); }}
                            className="absolute right-[86px] top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <IconX size={16}/>
                        </button>
                    )}
                    <button type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold cursor-pointer">
                        Cari
                    </button>
                </form>

                {/* Summary Cards */}
                {Object.keys(sumStats).length > 0 && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {[
                            {
                                label: "Total Transaksi",
                                value: sumStats.total_transactions ?? 0,
                                display: v => Number(v).toLocaleString("id-ID"),
                                suffix: "trx",
                                color: "text-slate-700 dark:text-slate-200",
                            },
                            {
                                label: "Total Revenue",
                                value: sumStats.total_revenue ?? 0,
                                display: fmt,
                                color: "text-primary-600 dark:text-primary-400",
                            },
                            {
                                label: "Total HPP",
                                value: sumStats.total_cogs ?? 0,
                                display: fmt,
                                color: "text-slate-500",
                            },
                            {
                                label: "Gross Profit",
                                value: sumStats.total_gross_profit ?? 0,
                                display: fmt,
                                color: "text-emerald-600 dark:text-emerald-400",
                            },
                            {
                                label: "Avg Margin",
                                value: sumStats.avg_margin ?? 0,
                                display: v => `${parseFloat(v).toFixed(2)}%`,
                                color: "text-blue-600 dark:text-blue-400",
                            },
                        ].map(card => (
                            <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{card.label}</p>
                                <p className={`text-base font-black ${card.color}`}>{card.display(card.value)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                        <form onSubmit={applyFilters}>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                                {/* Search: sale_number atau customer_name */}
                                <div className={isAdmin ? "xl:col-span-1" : "xl:col-span-2"}>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        No. Transaksi / Pelanggan
                                    </label>
                                    <input type="text" placeholder="INV/... atau nama pelanggan"
                                        value={q}
                                        onChange={e => setQ(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>

                                {/* Filter Toko — hanya untuk admin */}
                                {isAdmin && (
                                    <div className="xl:col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Toko
                                        </label>
                                        <select value={storeId} onChange={e => setStoreId(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                                            <option value="">Semua Toko</option>
                                            {stores.map(store => (
                                                <option key={store.id} value={store.id}>{store.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tanggal Mulai</label>
                                    <input type="date" value={dateFrom}
                                        onChange={e => setDateFrom(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tanggal Akhir</label>
                                    <input type="date" value={dateTo}
                                        onChange={e => setDateTo(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
                                    <select value={status} onChange={e => setStatus(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                                        <option value="">Semua Status</option>
                                        <option value="completed">Selesai</option>
                                        <option value="pending">Pending</option>
                                        <option value="cancelled">Dibatalkan</option>
                                        <option value="refunded">Refund</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>

                                <div className="flex items-end gap-2">
                                    <button type="submit"
                                        className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors">
                                        <IconSearch size={18}/> Cari
                                    </button>
                                    {hasFilter && (
                                        <button type="button" onClick={resetFilters}
                                            className="h-11 px-4 inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <IconRefresh size={18}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table */}
                {rows.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        {[
                                            { label: "No",             cls: "text-left" },
                                            { label: "No. Transaksi",  cls: "text-left" },
                                            { label: "Tanggal",        cls: "text-left" },
                                            ...(isAdmin ? [{ label: "Toko", cls: "text-left" }] : []),
                                            { label: "Kasir",          cls: "text-left" },
                                            { label: "Pelanggan",      cls: "text-left" },
                                            { label: "Item",           cls: "text-center" },
                                            { label: "Subtotal",       cls: "text-right" },
                                            { label: "Diskon",         cls: "text-right" },
                                            { label: "Total",          cls: "text-right" },
                                            { label: "Profit",         cls: "text-right" },
                                            { label: "Margin",         cls: "text-right" },
                                            { label: "Status",         cls: "text-center" },
                                            { label: "",               cls: "text-center" },
                                        ].map(h => (
                                            <th key={h.label} className={`px-4 py-4 ${h.cls} text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap`}>
                                                {h.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {rows.map((sale, index) => {
                                        // sold_at adalah timestamp; parse untuk tampil tanggal & waktu
                                        const { date, time } = fmtSoldAt(sale.sold_at);

                                        // items_count dari withCount('items') di controller
                                        const itemCount = sale.items_count ?? sale.sale_items_count ?? 0;

                                        return (
                                            <tr key={sale.id} onClick={() => setSelectedSale(sale)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                                                <td className="px-4 py-4 text-sm text-slate-500">
                                                    {index + 1 + (currentPage - 1) * perPage}
                                                </td>

                                                {/* sale_number */}
                                                <td className="px-4 py-4">
                                                    <span className="text-sm font-semibold font-mono text-slate-900 dark:text-white">
                                                        {sale.sale_number}
                                                    </span>
                                                </td>

                                                {/* sold_at → date + time */}
                                                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        <IconCalendar size={12} className="text-slate-400 flex-shrink-0"/>
                                                        <span>{date}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 ml-4">{time}</div>
                                                </td>

                                                {/* Nama toko — hanya untuk admin */}
                                                {isAdmin && (
                                                    <td className="px-4 py-4">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md whitespace-nowrap">
                                                            <IconBuildingStore size={11}/>
                                                            {sale.store?.name ?? "-"}
                                                        </span>
                                                    </td>
                                                )}

                                                {/* cashier (User) — dari relasi eager-loaded */}
                                                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {sale.cashier?.name ?? sale.cashier_name ?? "-"}
                                                </td>

                                                {/* customer — dari relasi atau snapshot */}
                                                <td className="px-4 py-4">
                                                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                                                        {sale.customer?.name ?? sale.customer_name ?? "Umum"}
                                                    </span>
                                                </td>

                                                {/* item count */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-full">
                                                        {itemCount}
                                                    </span>
                                                </td>

                                                {/* subtotal = subtotal_perfume + subtotal_packaging */}
                                                <td className="px-4 py-4 text-right text-sm text-slate-500">
                                                    {fmt(sale.subtotal)}
                                                </td>

                                                {/* discount_amount */}
                                                <td className="px-4 py-4 text-right text-sm text-red-500">
                                                    {Number(sale.discount_amount) > 0
                                                        ? `- ${fmt(sale.discount_amount)}`
                                                        : "—"
                                                    }
                                                </td>

                                                {/* total */}
                                                <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                                                    {fmt(sale.total)}
                                                </td>

                                                {/* gross_profit — bisa negatif */}
                                                <td className="px-4 py-4 text-right text-sm font-semibold">
                                                    <span className={Number(sale.gross_profit) >= 0
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-red-500"}>
                                                        {fmt(sale.gross_profit)}
                                                    </span>
                                                </td>

                                                {/* gross_margin_pct */}
                                                <td className="px-4 py-4 text-right">
                                                    <span className={`flex items-center justify-end gap-1 text-xs font-bold ${
                                                        Number(sale.gross_margin_pct) >= 0
                                                            ? "text-emerald-600 dark:text-emerald-400"
                                                            : "text-red-500"
                                                    }`}>
                                                        <IconTrendingUp size={12}/>
                                                        {parseFloat(sale.gross_margin_pct ?? 0).toFixed(2)}%
                                                    </span>
                                                </td>

                                                {/* status */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase ${STATUS_BADGE[sale.status] ?? "bg-slate-100 text-slate-500"}`}>
                                                        {STATUS_LABEL[sale.status] ?? sale.status}
                                                    </span>
                                                </td>

                                                {/* Print link */}
                                                <td className="px-4 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); }}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                                                            title="Detail Transaksi">
                                                            <IconEye size={18}/>
                                                        </button>
                                                        {canPrint && (
                                                            <Link
                                                                href={route("transactions.print", sale.sale_number)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/50 transition-colors"
                                                                title="Cetak Struk">
                                                                <IconPrinter size={18}/>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <IconDatabaseOff size={32} className="text-slate-400" strokeWidth={1.5}/>
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">Belum Ada Transaksi</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {hasFilter ? "Tidak ada transaksi sesuai filter." : "Transaksi akan muncul di sini."}
                        </p>
                        {hasFilter && (
                            <button onClick={resetFilters}
                                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <IconRefresh size={16}/> Reset Filter
                            </button>
                        )}
                    </div>
                )}

                {links.length > 3 && <Pagination links={links}/>}
            </div>

            {/* Detail Modal */}
            {selectedSale && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedSale(null)}/>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Detail Transaksi</h3>
                                <p className="text-sm font-mono text-primary-600 font-bold">{selectedSale.sale_number}</p>
                                {isAdmin && selectedSale.store?.name && (
                                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full uppercase">
                                        <IconBuildingStore size={10}/> {selectedSale.store.name}
                                    </span>
                                )}
                            </div>
                            <button onClick={() => setSelectedSale(null)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
                                <IconX size={24}/>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</p>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                                        {fmtSoldAt(selectedSale.sold_at).date} <br/>
                                        <span className="text-xs text-slate-400 font-medium">{fmtSoldAt(selectedSale.sold_at).time}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kasir</p>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <IconUser size={14} className="text-slate-400"/>
                                        {selectedSale.cashier?.name ?? "-"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sales Person</p>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                        <IconBuildingStore size={14} className="text-emerald-500"/>
                                        {selectedSale.sales_person?.name ?? "-"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</p>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white">
                                        {selectedSale.customer?.name ?? selectedSale.customer_name ?? "Umum"}
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Barang yang Terjual</p>
                                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
                                    {selectedSale.items?.map((item, i) => (
                                        <div key={i} className="p-4 bg-slate-50/50 dark:bg-slate-800/30">
                                            <div className="flex justify-between gap-4 mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-800 dark:text-white">{item.product_name}</span>
                                                        {item.is_custom_order && <span className="px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-600 text-[10px] font-black rounded uppercase">Custom</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        {item.variant_name} • {item.intensity_code} • {item.size_ml}ml
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-slate-800 dark:text-white">{fmt(Number(item.unit_price) * Number(item.qty))}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{item.qty}x {fmt(item.unit_price)}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Packagings */}
                                            {item.packagings?.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-wrap gap-2">
                                                    {item.packagings.map((pkg, pi) => (
                                                        <div key={pi} className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                            <IconBox size={10} className="text-slate-400"/>
                                                            {pkg.packaging_material?.name ?? "Kemasan"} 
                                                            <span className="text-emerald-500 font-black">{Number(pkg.unit_price) === 0 ? "FREE" : fmt(pkg.unit_price)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode Pembayaran</p>
                                    <div className="space-y-2">
                                        {selectedSale.payments?.map((pm, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                                                <div className="text-xs font-bold text-slate-800 dark:text-white">{pm.payment_method?.name}</div>
                                                <div className="text-sm font-black text-primary-600">{fmt(pm.amount)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rangkuman Biaya</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal</span>
                                            <span className="font-bold text-slate-800 dark:text-white">{fmt(selectedSale.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Diskon</span>
                                            <span className="font-bold text-red-500">-{fmt(selectedSale.discount_amount)}</span>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                                            <span className="text-sm font-black text-slate-800 dark:text-white">Grand Total</span>
                                            <span className="text-lg font-black text-primary-600">{fmt(selectedSale.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-3">
                            <div>
                                {canCancelSale && selectedSale.status === "completed" && (
                                    isSameDay(selectedSale.sold_at) ? (
                                        <button onClick={() => setShowCancelSale(true)}
                                            className="px-6 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 text-sm font-bold flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors">
                                            <IconX size={18}/> Batalkan Transaksi
                                        </button>
                                    ) : (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[16rem]">
                                            Pembatalan hanya dapat dilakukan pada hari yang sama dengan transaksi (hari H).
                                        </p>
                                    )
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setSelectedSale(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                    Tutup
                                </button>
                                {canPrint && (
                                    <Link href={route("transactions.print", selectedSale.sale_number)} className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-sm font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform">
                                        <IconPrinter size={18}/> Cetak Struk
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Sale Modal */}
            {showCancelSale && selectedSale && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowCancelSale(false)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                            <IconX size={20} className="text-red-500" /> Batalkan Transaksi
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Transaksi <strong className="font-mono">{selectedSale.sale_number}</strong> akan dibatalkan.
                            Stok akan dikembalikan dan poin pelanggan disesuaikan. Tindakan ini tidak dapat diurungkan.
                        </p>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Alasan Pembatalan
                        </label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                            placeholder="Contoh: Salah input, pelanggan membatalkan..."
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm font-medium focus:outline-none focus:border-red-400 transition-all resize-none mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setShowCancelSale(false); setCancelReason(""); }}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                Batal
                            </button>
                            <button
                                onClick={handleCancelSale}
                                disabled={!cancelReason.trim() || cancellingSale}
                                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                {cancellingSale
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <IconX size={16}/>}
                                Konfirmasi Pembatalan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

History.layout = page => <DashboardLayout children={page}/>;
