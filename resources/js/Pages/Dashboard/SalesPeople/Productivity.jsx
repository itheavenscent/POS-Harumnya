import React, { useState, useCallback } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import Table from "@/Components/Dashboard/Table";
import Pagination from "@/Components/Dashboard/Pagination";
import { 
    IconUsers, 
    IconBuildingStore, 
    IconCalendar, 
    IconTrendingUp, 
    IconAward, 
    IconReceipt, 
    IconFilter, 
    IconRotateCcw 
} from "@tabler/icons-react";

// Format Helpers
const formatRp = (n) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);

const formatNum = (n) => 
    new Intl.NumberFormat("id-ID").format(n || 0);

export default function Productivity({ ranking = [], transactions = {}, stores = [], salesPeopleDropdown = [], filters = {}, isSuperAdmin = false }) {
    // State for filters
    const [lf, setLf] = useState({
        store_id: filters.store_id ?? "",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
        sales_person_id: filters.sales_person_id ?? "",
    });

    const setF = (key, value) => {
        setLf(prev => ({ ...prev, [key]: value }));
    };

    // Apply filters
    const applyFilters = () => {
        router.get(
            route("sales-people.productivity"),
            {
                store_id: lf.store_id || undefined,
                date_from: lf.date_from || undefined,
                date_to: lf.date_to || undefined,
                sales_person_id: lf.sales_person_id || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Reset filters
    const resetFilters = () => {
        const today = new Date().toISOString().slice(0, 10);
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
        
        setLf({
            store_id: "",
            date_from: startOfMonth,
            date_to: today,
            sales_person_id: "",
        });

        router.get(
            route("sales-people.productivity"),
            {
                store_id: undefined,
                date_from: startOfMonth,
                date_to: today,
                sales_person_id: undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Get selected store name for header context
    const activeStoreName = stores.find(s => String(s.id) === String(filters.store_id))?.name ?? "Semua Toko";

    // Split ranking for podium (top 3) and table (rest)
    const podiumSales = ranking.slice(0, 3);
    const tableSales = ranking.slice(3);

    // Color and visual helper for podium
    const podiumConfig = [
        { rank: 1, badgeColor: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 border-amber-300", iconColor: "text-amber-500", scale: "scale-105 z-10 border-2 border-amber-300 shadow-md" },
        { rank: 2, badgeColor: "bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-300", iconColor: "text-slate-400", scale: "scale-100 border border-slate-200 dark:border-slate-800" },
        { rank: 3, badgeColor: "bg-amber-700/10 text-amber-800 border-amber-700/20", iconColor: "text-amber-700", scale: "scale-95 border border-slate-200 dark:border-slate-800" }
    ];

    // Reorder for visual: 2nd place on left, 1st in center, 3rd on right
    const visualPodium = [];
    if (podiumSales[1]) visualPodium.push({ ...podiumSales[1], ...podiumConfig[1] });
    if (podiumSales[0]) visualPodium.push({ ...podiumSales[0], ...podiumConfig[0] });
    if (podiumSales[2]) visualPodium.push({ ...podiumSales[2], ...podiumConfig[2] });

    return (
        <>
            <Head title="Ranking Produktivitas Sales" />
            
            <div className="space-y-6">
                {/* ── HEADER ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <IconTrendingUp className="text-primary-600" size={28} /> Ranking Produktivitas Sales
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                            <IconCalendar size={13} /> Periode: <span className="underline">{filters.date_from || "-"}</span> s/d <span className="underline">{filters.date_to || "-"}</span>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <IconBuildingStore size={13} /> Toko: <span className="font-bold text-slate-800 dark:text-slate-200">{activeStoreName}</span>
                        </p>
                    </div>
                </div>

                {/* ── FILTER CARD ── */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <IconFilter size={18} className="text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Filter Pencarian</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {isSuperAdmin && (
                            <div>
                                <label className="text-xs font-bold block mb-2 text-slate-700 dark:text-slate-300">Toko / Cabang</label>
                                <select
                                    value={lf.store_id}
                                    onChange={e => setF("store_id", e.target.value)}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm focus:ring-primary-500 focus:border-primary-500"
                                >
                                    <option value="">Semua Toko</option>
                                    {stores.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        <div className={!isSuperAdmin ? "md:col-span-2" : ""}>
                            <label className="text-xs font-bold block mb-2 text-slate-700 dark:text-slate-300">Tanggal Mulai</label>
                            <input
                                type="date"
                                value={lf.date_from}
                                onChange={e => setF("date_from", e.target.value)}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div className={!isSuperAdmin ? "md:col-span-2" : ""}>
                            <label className="text-xs font-bold block mb-2 text-slate-700 dark:text-slate-300">Tanggal Selesai</label>
                            <input
                                type="date"
                                value={lf.date_to}
                                onChange={e => setF("date_to", e.target.value)}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={applyFilters}
                                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <IconFilter size={14} /> Filter
                            </button>
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                                title="Reset Filter"
                            >
                                <IconRotateCcw size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── VISUAL PODIUM TOP 3 ── */}
                {podiumSales.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-4">
                        {visualPodium.map((s, idx) => (
                            <div 
                                key={s.id} 
                                className={`bg-white dark:bg-slate-900 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm relative transition-all duration-300 ${s.scale}`}
                            >
                                {/* Position Crown/Badge */}
                                <div className={`absolute -top-4 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-md border ${s.badgeColor}`}>
                                    {s.rank}
                                </div>

                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center mb-3">
                                    <IconAward size={32} className={s.iconColor} />
                                </div>

                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base line-clamp-1">{s.name}</h4>
                                <code className="text-[10px] text-slate-400 font-mono mb-2">{s.code}</code>
                                <p className="text-xs text-slate-500 mb-1">{s.store_name || "-"}</p>

                                <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 text-xs">
                                    <div>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Transaksi</p>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">{formatNum(s.transactions_count)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Pcs Terjual</p>
                                        <p className="font-bold text-slate-700 dark:text-slate-300">{formatNum(s.total_items_sold)}</p>
                                    </div>
                                </div>

                                <div className="mt-3 w-full bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Penjualan</p>
                                    <p className="text-sm font-black text-primary-600 dark:text-primary-400">{formatRp(s.total_revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── RANKING LIST SECTION ── */}
                <Table.Card title="Peringkat Produktivitas Sales">
                    <Table>
                        <Table.Thead>
                            <tr>
                                <Table.Th className="w-16 text-center">Peringkat</Table.Th>
                                <Table.Th>Sales</Table.Th>
                                <Table.Th>Toko / Cabang</Table.Th>
                                <Table.Th className="text-center">Jumlah Transaksi</Table.Th>
                                <Table.Th className="text-center">Item Terjual</Table.Th>
                                <Table.Th className="text-right">Rata-rata/Transaksi</Table.Th>
                                <Table.Th className="text-right">Total Penjualan</Table.Th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {ranking.length > 0 ? (
                                ranking.map((s, index) => (
                                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <Table.Td className="text-center">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                                                index === 0 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                                                index === 1 ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300" :
                                                index === 2 ? "bg-amber-700/10 text-amber-800 dark:bg-amber-700/20 dark:text-amber-550" :
                                                "text-slate-500"
                                            }`}>
                                                {index + 1}
                                            </span>
                                        </Table.Td>
                                        <Table.Td>
                                            <div className="font-bold text-slate-800 dark:text-slate-200">{s.name}</div>
                                            <div className="text-xs text-slate-400 font-mono">{s.code}</div>
                                        </Table.Td>
                                        <Table.Td>{s.store_name || "-"}</Table.Td>
                                        <Table.Td className="text-center font-semibold text-slate-700 dark:text-slate-300">{formatNum(s.transactions_count)}</Table.Td>
                                        <Table.Td className="text-center font-semibold text-slate-700 dark:text-slate-300">{formatNum(s.total_items_sold)}</Table.Td>
                                        <Table.Td className="text-right font-medium text-slate-700 dark:text-slate-300">{formatRp(s.average_sales)}</Table.Td>
                                        <Table.Td className="text-right font-bold text-primary-600 dark:text-primary-400">{formatRp(s.total_revenue)}</Table.Td>
                                    </tr>
                                ))
                            ) : (
                                <Table.Empty colSpan={7} colSpanNumber={7} message="Tidak ada data penjualan sales pada filter ini." />
                            )}
                        </Table.Tbody>
                    </Table>
                </Table.Card>

                {/* ── DETAIL TRANSACTIONS SECTION ── */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <IconReceipt className="text-slate-500" /> Detail Transaksi Terkait
                            </h2>
                            <p className="text-xs text-slate-500">Daftar transaksi individu yang dicapai oleh sales.</p>
                        </div>
                        
                        {/* Dropdown specific sales filter */}
                        <div className="w-full md:w-64">
                            <select
                                value={lf.sales_person_id}
                                onChange={e => {
                                    setF("sales_person_id", e.target.value);
                                    // Trigger reload immediately for transaction filtering
                                    router.get(
                                        route("sales-people.productivity"),
                                        {
                                            store_id: lf.store_id || undefined,
                                            date_from: lf.date_from || undefined,
                                            date_to: lf.date_to || undefined,
                                            sales_person_id: e.target.value || undefined,
                                        },
                                        { preserveState: true, preserveScroll: true }
                                    );
                                }}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-xs focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Semua Sales</option>
                                {salesPeopleDropdown.map(sp => (
                                    <option key={sp.id} value={sp.id}>{sp.name} ({sp.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Table.Card title="Daftar Transaksi Sales">
                        <Table>
                            <Table.Thead>
                                <tr>
                                    <Table.Th>No. Transaksi</Table.Th>
                                    <Table.Th>Tanggal</Table.Th>
                                    <Table.Th>Sales</Table.Th>
                                    <Table.Th>Toko / Cabang</Table.Th>
                                    <Table.Th>Pelanggan</Table.Th>
                                    <Table.Th className="text-right">Total Transaksi</Table.Th>
                                    <Table.Th className="w-10"></Table.Th>
                                </tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {transactions.data && transactions.data.length > 0 ? (
                                    transactions.data.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <Table.Td className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">
                                                {tx.sale_number}
                                            </Table.Td>
                                            <Table.Td className="text-slate-500 dark:text-slate-400">
                                                {new Date(tx.sold_at).toLocaleDateString("id-ID", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </Table.Td>
                                            <Table.Td>
                                                <div className="font-semibold text-slate-800 dark:text-slate-200">{tx.sales_person?.name || tx.sales_person_name || "-"}</div>
                                                {tx.sales_person?.code && (
                                                    <div className="text-[10px] text-slate-400 font-mono">{tx.sales_person.code}</div>
                                                )}
                                            </Table.Td>
                                            <Table.Td>{tx.store?.name || "-"}</Table.Td>
                                            <Table.Td>{tx.customer?.name || tx.customer_name || "Guest Customer"}</Table.Td>
                                            <Table.Td className="text-right font-bold text-slate-800 dark:text-slate-200">
                                                {formatRp(tx.total)}
                                            </Table.Td>
                                            <Table.Td>
                                                <Link 
                                                    href={route("transactions.print", tx.sale_number)} 
                                                    target="_blank"
                                                    className="px-2.5 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-all"
                                                >
                                                    Cetak
                                                </Link>
                                            </Table.Td>
                                        </tr>
                                    ))
                                ) : (
                                    <Table.Empty colSpan={7} colSpanNumber={7} message="Tidak ada riwayat transaksi sales pada filter ini." />
                                )}
                            </Table.Tbody>
                        </Table>
                    </Table.Card>
                    
                    <div className="mt-4">
                        <Pagination links={transactions.links} />
                    </div>
                </div>
            </div>
        </>
    );
}

Productivity.layout = (page) => <DashboardLayout children={page} />;
