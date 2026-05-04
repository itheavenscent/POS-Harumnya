import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import { IconSearch, IconReceipt, IconUser, IconCalendar, IconChevronRight, IconPrinter, IconCheck, IconX } from "@tabler/icons-react";
import { useDebounce } from "use-debounce";

const fmt = (v = 0) =>
    Number(v || 0).toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    });

export default function Transactions({ sales, filters }) {
    const [search, setSearch] = React.useState(filters.search || "");
    const [debouncedSearch] = useDebounce(search, 500);

    React.useEffect(() => {
        router.get(
            route("pos.transactions"),
            { search: debouncedSearch },
            { preserveState: true, replace: true }
        );
    }, [debouncedSearch]);

    return (
        <POSLayout>
            <Head title="Riwayat Transaksi" />
            
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
                {/* Header */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white">Riwayat Transaksi</h2>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">Daftar penjualan toko Anda</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari no. faktur / pelanggan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
                        />
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu & Invoice</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sales.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <IconReceipt size={48} stroke={1} />
                                                <p className="text-sm">Tidak ada riwayat transaksi ditemukan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sales.data.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                                                        {sale.sale_number}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                                                        <IconCalendar size={12} />
                                                        {new Date(sale.sold_at).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                        <IconUser size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                            {sale.customer_name || "Umum / Guest"}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            Kasir: {sale.cashier_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-black text-slate-800 dark:text-white">
                                                    {fmt(sale.total)}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    {sale.items_count || 0} item
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 ${
                                                        sale.status === "completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                        sale.status === "pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                                        "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                                                    }`}>
                                                        {sale.status === "completed" ? <IconCheck size={10} /> : sale.status === "pending" ? null : <IconX size={10} />}
                                                        {sale.status === "completed" ? "Selesai" : sale.status === "pending" ? "Menunggu" : "Dibatalkan"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={route("transactions.print", sale.sale_number)}
                                                        target="_blank"
                                                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-cyan-600 hover:border-cyan-200 transition-all shadow-sm"
                                                        title="Cetak Struk"
                                                    >
                                                        <IconPrinter size={16} />
                                                    </Link>
                                                    {/* In the future: View Details Modal */}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">
                            Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{sales.from || 0}</span> sampai <span className="font-bold text-slate-700 dark:text-slate-300">{sales.to || 0}</span> dari <span className="font-bold text-slate-700 dark:text-slate-300">{sales.total}</span> data
                        </p>
                        <div className="flex gap-2">
                            {sales.links.map((link, i) => (
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
