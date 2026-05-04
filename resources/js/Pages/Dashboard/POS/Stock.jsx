import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import { IconSearch, IconBox, IconDroplet, IconPackage, IconBottle, IconChevronRight, IconAlertTriangle } from "@tabler/icons-react";
import { useDebounce } from "use-debounce";

export default function Stock({ stocks, filters }) {
    const [search, setSearch] = React.useState(filters.search || "");
    const [activeType, setActiveType] = React.useState(filters.type || "ingredient");
    const [debouncedSearch] = useDebounce(search, 500);

    React.useEffect(() => {
        router.get(
            route("pos.stock"),
            { search: debouncedSearch, type: activeType },
            { preserveState: true, replace: true }
        );
    }, [debouncedSearch, activeType]);

    return (
        <POSLayout>
            <Head title="Stok Toko" />
            
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
                {/* Header */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Stok Toko</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Daftar inventori tersedia di toko Anda</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveType("ingredient")}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeType === "ingredient" 
                                        ? "bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                            >
                                Bahan Baku
                            </button>
                            <button
                                onClick={() => setActiveType("packaging")}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeType === "packaging" 
                                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                            >
                                Kemasan
                            </button>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari item..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stok Saat Ini</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Terakhir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {stocks.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <IconBox size={48} stroke={1} />
                                                <p className="text-sm">Tidak ada data stok ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    stocks.data.map((stock) => {
                                        const item = stock.ingredient || stock.packagingMaterial;
                                        const isLow = stock.min_stock !== null && stock.quantity < stock.min_stock;
                                        
                                        return (
                                            <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                                                            activeType === "ingredient" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" :
                                                            "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                                                        }`}>
                                                            {activeType === "ingredient" ? <IconDroplet size={20} /> : <IconPackage size={20} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                                {item?.name}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono text-slate-400 uppercase">
                                                                    {item?.code || "NO-CODE"}
                                                                </span>
                                                                {item?.category && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold uppercase">
                                                                        {item.category.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-lg font-black ${
                                                                isLow ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
                                                            }`}>
                                                                {Number(stock.quantity).toLocaleString("id-ID")}
                                                            </span>
                                                            {isLow && <IconAlertTriangle size={14} className="text-rose-500" />}
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                                                            {activeType === "ingredient" ? (item?.unit || "Unit") : "Pcs"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                                        {new Date(stock.updated_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {new Date(stock.updated_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">
                            Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{stocks.from || 0}</span> sampai <span className="font-bold text-slate-700 dark:text-slate-300">{stocks.to || 0}</span> dari <span className="font-bold text-slate-700 dark:text-slate-300">{stocks.total}</span> data
                        </p>
                        <div className="flex gap-2">
                            {stocks.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || "#"}
                                    className={`h-8 px-3 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                        link.active
                                            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20"
                                            : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                                    } ${!link.url && "opacity-50 cursor-not-allowed"}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </POSLayout>
    );
}
