import React from "react";
import { Head, router } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import { IconUserBolt, IconTrophy, IconReceipt, IconBox, IconCash } from "@tabler/icons-react";

const fmt = (v = 0) =>
    Number(v || 0).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtNum = (v = 0) => Number(v || 0).toLocaleString("id-ID");

const MEDAL = ["from-amber-400 to-amber-600", "from-slate-300 to-slate-500", "from-orange-400 to-orange-600"];

export default function SalesRanking({ storeName, filters, ranking = [] }) {
    const [dateFrom, setDateFrom] = React.useState(filters.date_from);
    const [dateTo, setDateTo] = React.useState(filters.date_to);

    const applyFilter = () => {
        router.get(route("pos.sales-ranking"), { date_from: dateFrom, date_to: dateTo },
            { preserveState: true, replace: true });
    };

    const topRevenue = Math.max(1, ...ranking.map((r) => r.total_revenue));

    return (
        <POSLayout>
            <Head title="Ranking Sales" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
                {/* Header */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <IconUserBolt size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">Ranking Sales</h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{storeName}</p>
                        </div>
                    </div>

                    <div className="flex items-end gap-2 flex-wrap">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dari</label>
                            <input type="date" value={dateFrom} max={dateTo}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-9 px-3 rounded-lg border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm focus:outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sampai</label>
                            <input type="date" value={dateTo} min={dateFrom}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-9 px-3 rounded-lg border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm focus:outline-none focus:border-emerald-500" />
                        </div>
                        <button onClick={applyFilter}
                            className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors">
                            Terapkan
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    {ranking.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <IconTrophy size={48} stroke={1} />
                            <p className="text-sm mt-2">Belum ada transaksi sales pada rentang ini.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {ranking.map((r, i) => (
                                <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center gap-4">
                                    {/* Rank badge */}
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-white shadow-md ${
                                        i < 3 ? `bg-gradient-to-br ${MEDAL[i]}` : "bg-slate-300 dark:bg-slate-700"
                                    }`}>
                                        {i < 3 ? <IconTrophy size={20} /> : <span className="text-sm">{i + 1}</span>}
                                    </div>

                                    {/* Name + bar */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-black text-slate-800 dark:text-white truncate">{r.name}</p>
                                            <span className="text-[10px] font-mono font-bold text-slate-400">{r.code}</span>
                                        </div>
                                        <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                                                style={{ width: `${Math.max(4, (r.total_revenue / topRevenue) * 100)}%` }} />
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-[11px] font-bold text-slate-500">
                                            <span className="flex items-center gap-1"><IconReceipt size={12} /> {fmtNum(r.transactions_count)} transaksi</span>
                                            <span className="flex items-center gap-1"><IconBox size={12} /> {fmtNum(r.total_items_sold)} item</span>
                                            <span className="flex items-center gap-1"><IconCash size={12} /> Avg {fmt(r.average_sales)}</span>
                                        </div>
                                    </div>

                                    {/* Revenue */}
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                        <p className="text-base font-black text-emerald-600">{fmt(r.total_revenue)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </POSLayout>
    );
}
