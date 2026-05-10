import React from "react";
import { Head, Link } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import AppLayout from "@/Layouts/DashboardLayout";
import {
    IconArrowLeft,
    IconPrinter,
    IconCash,
    IconChevronRight,
    IconCalendar,
    IconUser,
    IconBuildingStore,
    IconCheck,
    IconPackage,
    IconFlask
} from "@tabler/icons-react";

export default function Show({ drawer, summary, isAdmin }) {
    const fmt = (v = 0) =>
        Number(v || 0).toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        });

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }) + " at " + new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const Layout = isAdmin ? AppLayout : POSLayout;

    return (
        <Layout>
            <Head title={`Detail Shift - ${drawer.cashier?.name}`} />
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
                {/* Header Section */}
                <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("cash-drawers.index")}
                                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <IconArrowLeft size={18} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                                    Detil Shift
                                </h1>
                                <p className="text-xs text-slate-500 font-medium capitalize">
                                    Status: {drawer.status}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <Link
                                href={route("cash-drawers.print", drawer.id)}
                                target="_blank"
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                <IconPrinter size={16} />
                                Cetak Laporan
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <IconCash size={64} />
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Mulai Shift</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white">{fmt(drawer.starting_cash)}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <IconCheck size={64} />
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Akhir Shift (Aktual)</p>
                                <p className="text-xl font-black text-emerald-600">{fmt(drawer.actual_ending_cash)}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <IconArrowLeft size={64} />
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Selisih</p>
                                <p className={`text-xl font-black ${Number(drawer.difference) >= 0 ? 'text-cyan-600' : 'text-rose-600'}`}>{fmt(drawer.difference)}</p>
                            </div>
                        </div>

                        {/* Detail Tables */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* General Info */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                        Informasi Umum
                                    </h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                                        <div className="flex items-center gap-3">
                                            <IconUser size={16} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-500">Nama</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{drawer.cashier?.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                                        <div className="flex items-center gap-3">
                                            <IconBuildingStore size={16} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-500">Outlet</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-800 dark:text-white">{drawer.store?.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                                        <div className="flex items-center gap-3">
                                            <IconCalendar size={16} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-500">Mulai Shift</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-800 dark:text-white text-right">{formatDate(drawer.opened_at)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pb-1">
                                        <div className="flex items-center gap-3">
                                            <IconCalendar size={16} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-500">Selesai Shift</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-800 dark:text-white text-right">{drawer.closed_at ? formatDate(drawer.closed_at) : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sales Summary */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                        Ringkasan Penjualan
                                    </h3>
                                </div>
                                <div className="p-5 space-y-4 text-sm">
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 py-1">
                                        <span>Total Transaksi</span>
                                        <span className="font-bold text-slate-800 dark:text-white">{summary.transactions} x</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 py-1">
                                        <span>Produk Terjual</span>
                                        <span className="font-bold text-slate-800 dark:text-white">{summary.items_sold} item</span>
                                    </div>
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 py-1">
                                        <span>Penjualan Tunai</span>
                                        <span className="font-bold text-slate-800 dark:text-white">{fmt(drawer.total_cash_sales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 py-1">
                                        <span>Penjualan Non-Tunai</span>
                                        <span className="font-bold text-slate-800 dark:text-white">{fmt(drawer.total_non_cash_sales)}</span>
                                    </div>
                                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                                    <div className="flex justify-between items-center py-1">
                                        <span className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-[10px]">Total Penjualan Kotor</span>
                                        <span className="font-black text-xl text-cyan-600">{fmt(summary.gross_sales)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Sold History */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                    History Barang Terjual
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-5 py-3 text-left">Produk</th>
                                            <th className="px-5 py-3 text-center">Qty</th>
                                            <th className="px-5 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {summary.items?.length > 0 ? (
                                            summary.items.map((item, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-5 py-3">
                                                        <p className="font-bold text-slate-800 dark:text-white">{item.product_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            {item.variant_name} {item.intensity_code ? `· ${item.intensity_code}` : ''} {item.size_ml ? `· ${item.size_ml}ml` : ''}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-3 text-center font-bold text-slate-600 dark:text-slate-400">
                                                        {item.total_qty}
                                                    </td>
                                                    <td className="px-5 py-3 text-right font-black text-slate-800 dark:text-white">
                                                        {fmt(item.total_amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="px-5 py-8 text-center text-slate-400 italic">Belum ada barang terjual</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Cash Transactions (In/Out) History */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                                    History Cash In & Cash Out
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-5 py-3 text-left">Waktu</th>
                                            <th className="px-5 py-3 text-left">Keterangan</th>
                                            <th className="px-5 py-3 text-center">Tipe</th>
                                            <th className="px-5 py-3 text-right">Jumlah</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {summary.cash_transactions?.length > 0 ? (
                                            summary.cash_transactions.map((tr, i) => (
                                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-5 py-3 whitespace-nowrap">
                                                        <p className="text-xs font-bold text-slate-800 dark:text-white">{new Date(tr.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">{new Date(tr.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <p className="font-medium text-slate-700 dark:text-slate-300">{tr.description}</p>
                                                        <p className="text-[10px] text-slate-400">Oleh: {tr.user?.name}</p>
                                                    </td>
                                                    <td className="px-5 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${tr.type === 'cash_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {tr.type === 'cash_in' ? 'In' : 'Out'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-5 py-3 text-right font-black ${tr.type === 'cash_in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {tr.type === 'cash_in' ? '+' : '-'} {fmt(tr.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-5 py-8 text-center text-slate-400 italic">Tidak ada transaksi kas</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Breakdown by Category */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                             <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <h3 className="font-black text-slate-800 dark:text-white text-base uppercase tracking-wider">
                                    Penjualan per Kategori
                                </h3>
                            </div>
                            <div className="p-2">
                                <div className="grid grid-cols-1 gap-1">
                                    {summary.categories.length > 0 ? (
                                        summary.categories.map((cat, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-600 transition-colors">
                                                        <IconPackage size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white">{cat.name}</p>
                                                        <p className="text-[11px] font-medium text-slate-500">{cat.qty} Produk Terjual</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-slate-800 dark:text-white">{fmt(cat.total)}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center">
                                            <p className="text-sm text-slate-500">Tidak ada data penjualan per kategori</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Breakdown by Payment Method */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                             <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <h3 className="font-black text-slate-800 dark:text-white text-base uppercase tracking-wider">
                                    Penjualan per Metode Pembayaran
                                </h3>
                            </div>
                            <div className="p-2">
                                <div className="grid grid-cols-1 gap-1">
                                    {summary.payments?.length > 0 ? (
                                        summary.payments.map((pay, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-600 transition-colors">
                                                        <IconCash size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white">{pay.name}</p>
                                                        <p className="text-[11px] font-medium text-slate-500">{pay.count} Transaksi</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-slate-800 dark:text-white">{fmt(pay.total)}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center">
                                            <p className="text-sm text-slate-500">Tidak ada data pembayaran</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {drawer.notes && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                                <h4 className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Catatan Shift</h4>
                                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed italic">
                                    "{drawer.notes}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
