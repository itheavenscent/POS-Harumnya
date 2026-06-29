import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import { IconSearch, IconTransfer, IconCalendar, IconChevronRight, IconCheck, IconX, IconEye, IconBuildingStore } from "@tabler/icons-react";
import { useDebounce } from "use-debounce";

const STATUS_CFG = {
    in_transit: { label: "Dalam Perjalanan", cls: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
    completed:  { label: "Selesai",          cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
    cancelled:  { label: "Dibatalkan",       cls: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" },
};

export default function Index({ transfers, filters }) {
    const [search, setSearch] = React.useState(filters.search || "");
    const [status, setStatus] = React.useState(filters.status || "");
    const [debouncedSearch] = useDebounce(search, 500);

    const isFirstRender = React.useRef(true);

    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        router.get(
            route("pos.fulfillment.index"),
            { search: debouncedSearch, status: status },
            { preserveState: true, replace: true }
        );
    }, [debouncedSearch, status]);

    return (
        <POSLayout>
            <Head title="Fulfillment (Penerimaan Barang)" />
            
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
                {/* Header */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Fulfillment</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Terima pengiriman barang dari Gudang/Toko ke toko Anda</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button
                                onClick={() => setStatus("")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    status === "" 
                                        ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setStatus("in_transit")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    status === "in_transit" 
                                        ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                            >
                                Perjalanan
                            </button>
                            <button
                                onClick={() => setStatus("completed")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    status === "completed" 
                                        ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                            >
                                Selesai
                            </button>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nomor transfer..."
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
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Transfer / Tanggal</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengirim / Asal</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Jumlah Barang</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transfers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <IconTransfer size={48} stroke={1} />
                                                <p className="text-sm">Tidak ada kiriman barang untuk toko Anda</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transfers.data.map((transfer) => {
                                        const st = STATUS_CFG[transfer.status] || { label: transfer.status, cls: "bg-slate-50 text-slate-600" };
                                        const itemCount = transfer.items ? transfer.items.length : 0;
                                        
                                        return (
                                            <tr key={transfer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                                                            {transfer.transfer_number}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                                                            <IconCalendar size={12} />
                                                            {new Date(transfer.transfer_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                            <IconBuildingStore size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                                {transfer.from_name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 capitalize">
                                                                Tipe: {transfer.from_location_type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300 text-sm">
                                                    {itemCount} Item
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border flex items-center gap-1 ${st.cls}`}>
                                                            {transfer.status === "completed" && <IconCheck size={10} />}
                                                            {transfer.status === "cancelled" && <IconX size={10} />}
                                                            {st.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center">
                                                        {transfer.status === "in_transit" ? (
                                                            <Link
                                                                href={route("pos.fulfillment.show", transfer.id)}
                                                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 shadow-sm shadow-violet-900/10"
                                                            >
                                                                Terima Barang
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                href={route("pos.fulfillment.show", transfer.id)}
                                                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-cyan-600 hover:border-cyan-200 transition-all bg-white dark:bg-slate-900 shadow-sm"
                                                                title="Lihat Detail"
                                                            >
                                                                <IconEye size={16} />
                                                            </Link>
                                                        )}
                                                    </div>
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
                            Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{transfers.from || 0}</span> sampai <span className="font-bold text-slate-700 dark:text-slate-300">{transfers.to || 0}</span> dari <span className="font-bold text-slate-700 dark:text-slate-300">{transfers.total}</span> data
                        </p>
                        <div className="flex gap-2">
                            {transfers.links.map((link, i) => (
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
