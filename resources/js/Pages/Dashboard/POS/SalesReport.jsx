import React from "react";
import { Head, router } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import {
    IconChartArrowsVertical, IconReceipt, IconCash, IconBox,
    IconDiscount2, IconUsers, IconTrendingUp, IconWallet,
} from "@tabler/icons-react";

const fmt = (v = 0) =>
    Number(v || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
const fmtNum = (v = 0) => Number(v || 0).toLocaleString("id-ID");

export default function SalesReport({ storeName, filters, summary, trend = [], topVariants = [], paymentBreakdown = [] }) {
    const [dateFrom, setDateFrom] = React.useState(filters.date_from);
    const [dateTo, setDateTo] = React.useState(filters.date_to);

    const applyFilter = () => {
        router.get(route("pos.sales-report"), { date_from: dateFrom, date_to: dateTo },
            { preserveState: true, replace: true });
    };

    const maxRevenue = Math.max(1, ...trend.map((t) => t.revenue));

    const payTotalAmount = paymentBreakdown.reduce((s, p) => s + Number(p.amount || 0), 0);
    const payTotalCount = paymentBreakdown.reduce((s, p) => s + Number(p.count || 0), 0);
    const payColor = (type) => ({
        cash: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
        qris: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
        transfer: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
        debit: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    }[type] || "bg-slate-100 text-slate-500 dark:bg-slate-800");

    const cards = [
        { label: "Total Transaksi", value: fmtNum(summary.totalTransactions), icon: IconReceipt,   color: "cyan" },
        { label: "Total Penjualan", value: fmt(summary.totalRevenue),         icon: IconCash,      color: "emerald" },
        { label: "Item Terjual",    value: fmtNum(summary.totalItemsSold),     icon: IconBox,       color: "violet" },
        { label: "Rata-rata Order", value: fmt(summary.avgOrder),             icon: IconTrendingUp,color: "amber" },
        { label: "Total Diskon",    value: fmt(summary.totalDiscount),        icon: IconDiscount2, color: "rose" },
        { label: "Pelanggan Unik",  value: fmtNum(summary.uniqueCustomers),   icon: IconUsers,     color: "blue" },
    ];

    const colorCls = {
        cyan:    "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        violet:  "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
        amber:   "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        rose:    "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
        blue:    "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    };

    return (
        <POSLayout>
            <Head title="Laporan Penjualan" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
                {/* Header */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <IconChartArrowsVertical size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">Laporan Penjualan</h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{storeName}</p>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 flex-wrap">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dari</label>
                            <input type="date" value={dateFrom} max={dateTo}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-9 px-3 rounded-lg border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm focus:outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sampai</label>
                            <input type="date" value={dateTo} min={dateFrom}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-9 px-3 rounded-lg border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm focus:outline-none focus:border-cyan-500" />
                        </div>
                        <button onClick={applyFilter}
                            className="h-9 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold transition-colors">
                            Terapkan
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        {cards.map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorCls[color]}`}>
                                    <Icon size={18} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                                <p className="text-lg font-black text-slate-800 dark:text-white mt-0.5 truncate">{value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Trend */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Tren Penjualan Harian</h3>
                            {trend.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">Belum ada data pada rentang ini.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {trend.map((t, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="w-14 text-[11px] font-bold text-slate-500 shrink-0">{t.label}</span>
                                            <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-end px-2"
                                                    style={{ width: `${Math.max(6, (t.revenue / maxRevenue) * 100)}%` }}>
                                                    <span className="text-[10px] font-black text-white whitespace-nowrap">{fmt(t.revenue)}</span>
                                                </div>
                                            </div>
                                            <span className="w-10 text-[11px] font-bold text-slate-400 text-right shrink-0">{t.transactions}x</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top variants */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Varian Terlaris</h3>
                            {topVariants.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">Belum ada data pada rentang ini.</p>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {topVariants.map((v, i) => (
                                        <div key={i} className="flex items-center gap-3 py-2.5">
                                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                                                i < 3 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                            }`}>{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{v.name}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-slate-800 dark:text-white">{fmtNum(v.qty)} pcs</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{fmt(v.revenue)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metode Pembayaran */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
                                <IconWallet size={17} />
                            </div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white">Metode Pembayaran</h3>
                        </div>
                        {paymentBreakdown.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-8">Belum ada data pada rentang ini.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {paymentBreakdown.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                                            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${payColor(p.type)}`}>
                                                <IconCash size={17} />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{p.method}</p>
                                                <p className="text-[11px] font-bold text-slate-400">{fmtNum(p.count)} transaksi</p>
                                            </div>
                                            <p className="text-sm font-black text-slate-800 dark:text-white text-right shrink-0">{fmt(p.amount)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total ({fmtNum(payTotalCount)} transaksi)</span>
                                    <span className="text-base font-black text-slate-800 dark:text-white">{fmt(payTotalAmount)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </POSLayout>
    );
}
