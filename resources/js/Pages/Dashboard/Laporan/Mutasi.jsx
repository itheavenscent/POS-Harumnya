import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router } from "@inertiajs/react";
import Table from "@/Components/Dashboard/Table";
import { 
    IconHistory, 
    IconBuildingStore, 
    IconCalendar, 
    IconFilter, 
    IconRefresh,
    IconSearch,
    IconDownload
} from "@tabler/icons-react";

// Format helper for numbers
const fmtNum = (n) => new Intl.NumberFormat("id-ID").format(n || 0);

// Helper to style changes
const renderChangeCell = (val) => {
    if (val > 0) {
        return <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{fmtNum(val)}</span>;
    }
    if (val < 0) {
        return <span className="text-rose-600 dark:text-rose-450 font-semibold">{fmtNum(val)}</span>;
    }
    return <span className="text-slate-400 dark:text-slate-600">0</span>;
};

export default function Mutasi({ mutations = [], stores = [], warehouses = [], filters = {}, isSuperAdmin = false }) {
    // State for local filters
    const [lf, setLf] = useState({
        location: filters.location ?? "",
        date_from: filters.date_from ?? "",
        date_to: filters.date_to ?? "",
    });

    const setF = (key, value) => {
        setLf(prev => ({ ...prev, [key]: value }));
    };

    // Client-side search state for materials
    const [search, setSearch] = useState("");

    // Apply filters
    const applyFilters = () => {
        router.get(
            route("laporan.mutasi"),
            {
                location: lf.location || undefined,
                date_from: lf.date_from || undefined,
                date_to: lf.date_to || undefined,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Reset filters
    const resetFilters = () => {
        const today = new Date().toISOString().slice(0, 10);
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
        
        setLf({
            location: "",
            date_from: startOfMonth,
            date_to: today,
        });

        router.get(
            route("laporan.mutasi"),
            {
                location: undefined,
                date_from: startOfMonth,
                date_to: today,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Filter mutations client-side based on search term
    const filteredMutations = mutations.filter(item => {
        const term = search.toLowerCase();
        return item.name.toLowerCase().includes(term) || item.code.toLowerCase().includes(term);
    });

    // Get active location label
    let activeLocationName = "Semua Lokasi";
    if (filters.location) {
        if (filters.location.startsWith("store:")) {
            const id = filters.location.split(":")[1];
            activeLocationName = `Toko: ` + (stores.find(s => s.id === id)?.name ?? "Unknown");
        } else if (filters.location.startsWith("warehouse:")) {
            const id = filters.location.split(":")[1];
            activeLocationName = `Gudang: ` + (warehouses.find(w => w.id === id)?.name ?? "Unknown");
        }
    }

    return (
        <>
            <Head title="Laporan Mutasi Bahan & Kemasan" />
            
            <div className="space-y-6">
                {/* ── HEADER ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <IconHistory className="text-primary-600" size={28} /> Mutasi Bahan & Kemasan
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5 font-medium">
                            <IconCalendar size={13} /> Periode: <span className="underline">{filters.date_from || "-"}</span> s/d <span className="underline">{filters.date_to || "-"}</span>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <IconBuildingStore size={13} /> Lokasi: <span className="font-bold text-slate-800 dark:text-slate-200">{activeLocationName}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href={route('laporan.mutasi.export', filters)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors">
                            <IconDownload size={13} /> Export Excel
                        </a>
                        <button onClick={() => window.print()}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <IconDownload size={13} /> Cetak
                        </button>
                    </div>
                </div>

                {/* ── FILTER CARD ── */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <IconFilter size={18} className="text-slate-400" />
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Filter Pencarian</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="text-xs font-bold block mb-2 text-slate-700 dark:text-slate-300">Toko / Gudang</label>
                            <select
                                value={lf.location}
                                onChange={e => setF("location", e.target.value)}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="">Semua Lokasi</option>
                                <optgroup label="Toko / Cabang">
                                    {stores.map(s => (
                                        <option key={s.id} value={`store:${s.id}`}>{s.name}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Gudang">
                                    {warehouses.map(w => (
                                        <option key={w.id} value={`warehouse:${w.id}`}>{w.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold block mb-2 text-slate-700 dark:text-slate-300">Tanggal Mulai</label>
                            <input
                                type="date"
                                value={lf.date_from}
                                onChange={e => setF("date_from", e.target.value)}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-sm focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <div>
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
                                <IconFilter size={14} /> Submit
                            </button>
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
                                title="Reset Filter"
                            >
                                <IconRefresh size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── CLIENT-SIDE SEARCH BAR ── */}
                <div className="relative max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <IconSearch size={18} />
                    </span>
                    <input
                        type="text"
                        placeholder="Cari bahan baku atau kemasan berdasarkan nama/kode..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>

                {/* ── MUTATION TABLE CARD ── */}
                <Table.Card title="Daftar Mutasi Stok Bahan & Kemasan">
                    <Table>
                        <Table.Thead>
                            <tr>
                                <Table.Th className="pl-6">Bahan / Kemasan</Table.Th>
                                <Table.Th className="text-right">Beginning Balance</Table.Th>
                                <Table.Th className="text-right">Stock Take</Table.Th>
                                <Table.Th className="text-right">Sell Through</Table.Th>
                                <Table.Th className="text-right">Purchase Order</Table.Th>
                                <Table.Th className="text-right">Manufacturing</Table.Th>
                                <Table.Th className="text-right">Transfer</Table.Th>
                                <Table.Th className="text-right">Adjustment</Table.Th>
                                <Table.Th className="text-right pr-6">Ending Balance</Table.Th>
                                <Table.Th className="w-20 text-center">Unit</Table.Th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredMutations.length > 0 ? (
                                filteredMutations.map((item) => (
                                    <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <Table.Td className="pl-6">
                                            <div className="font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">{item.code}</div>
                                        </Table.Td>
                                        <Table.Td className="text-right font-medium text-slate-700 dark:text-slate-350">{fmtNum(item.beginning)}</Table.Td>
                                        <Table.Td className="text-right">{renderChangeCell(item.stock_take)}</Table.Td>
                                        <Table.Td className="text-right">{renderChangeCell(item.sell_through)}</Table.Td>
                                        <Table.Td className="text-right">{renderChangeCell(item.purchase_order)}</Table.Td>
                                        <Table.Td className="text-right">{renderChangeCell(item.manufacturing)}</Table.Td>
                                        <Table.Td className="text-right">{renderChangeCell(item.transfer)}</Table.Td>
                                        <Table.Td className="text-right">{renderChangeCell(item.adjustment)}</Table.Td>
                                        <Table.Td className="text-right font-bold text-slate-900 dark:text-slate-100 pr-6">{fmtNum(item.ending)}</Table.Td>
                                        <Table.Td className="text-center text-xs text-slate-400 dark:text-slate-500 font-mono">{item.unit}</Table.Td>
                                    </tr>
                                ))
                            ) : (
                                <Table.Empty colSpan={10} colSpanNumber={10} message="Tidak ada pergerakan stok mutasi bahan/kemasan pada filter ini." />
                            )}
                        </Table.Tbody>
                    </Table>
                </Table.Card>
            </div>
        </>
    );
}

Mutasi.layout = (page) => <DashboardLayout children={page} />;
