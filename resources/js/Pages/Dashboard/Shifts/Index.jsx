import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import {
    IconCalendar,
    IconChevronRight,
    IconSearch,
    IconArrowLeft,
    IconCash,
    IconHistory,
    IconPrinter,
    IconEye
} from "@tabler/icons-react";

export default function Index({ drawers, filters }) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route("cash-drawers.index"), {
            date_from: dateFrom,
            date_to: dateTo,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const fmt = (v = 0) =>
        Number(v || 0).toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        });

    return (
        <POSLayout>
            <Head title="Histori Shift" />
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
                {/* Header Section */}
                <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href={route("dashboard")}
                                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-colors"
                            >
                                <IconArrowLeft size={18} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                                    Histori Shift
                                </h1>
                                <p className="text-xs text-slate-500 font-medium">
                                    Lihat riwayat pembukaan dan penutupan kasir
                                </p>
                            </div>
                        </div>

                        {/* Filters */}
                        <form onSubmit={handleFilter} className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                                <IconCalendar size={16} className="text-slate-400 mr-2" />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-200 p-0"
                                />
                                <span className="mx-2 text-slate-400">sampai</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-sm text-slate-700 dark:text-slate-200 p-0"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-600/20 transition-all"
                            >
                                Filter
                            </button>
                        </form>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Kasir</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Buka</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Tutup</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Diharapkan</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Aktual</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Selisih</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {drawers.data.length > 0 ? (
                                    drawers.data.map((drawer) => {
                                        const diff = Number(drawer.difference);
                                        return (
                                            <tr key={drawer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                                            <IconCash size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 dark:text-white text-sm">{drawer.cashier?.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{drawer.store?.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                        {new Date(drawer.opened_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {new Date(drawer.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                        {drawer.closed_at ? new Date(drawer.closed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        {drawer.closed_at ? new Date(drawer.closed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {fmt(drawer.expected_ending_cash)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {fmt(drawer.actual_ending_cash)}
                                                </td>
                                                <td className={`px-6 py-4 text-right text-sm font-black ${diff === 0 ? "text-emerald-500" : diff > 0 ? "text-cyan-500" : "text-rose-500"}`}>
                                                    {fmt(drawer.difference)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            href={route("cash-drawers.show", drawer.id)}
                                                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-cyan-600 transition-colors"
                                                            title="Detail Summary"
                                                        >
                                                            <IconEye size={18} />
                                                        </Link>
                                                        <Link
                                                            href={route("cash-drawers.print", drawer.id)}
                                                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-cyan-600 transition-colors"
                                                            title="Print Recap"
                                                            target="_blank"
                                                        >
                                                            <IconPrinter size={18} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center">
                                            <IconHistory size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-3" />
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">Belo ada riwayat shift yang tersimpan</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {drawers.links.length > 3 && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex gap-1">
                                {drawers.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                            link.active
                                                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                                        } ${!link.url ? "opacity-50 cursor-not-allowed" : ""}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </POSLayout>
    );
}
