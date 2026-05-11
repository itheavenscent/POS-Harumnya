import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import { IconSearch, IconReceipt, IconUser, IconCalendar, IconChevronRight, IconPrinter, IconCheck, IconX, IconEye, IconBox, IconBuildingStore } from "@tabler/icons-react";
import { useDebounce } from "use-debounce";

const fmt = (v = 0) =>
    Number(v || 0).toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    });

const fmtSoldAt = (soldAt) => {
    if (!soldAt) return { date: "-", time: "" };
    const d = new Date(soldAt);
    return {
        date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
        time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
};

export default function Transactions({ sales, filters }) {
    const [search, setSearch] = React.useState(filters.search || "");
    const [selectedSale, setSelectedSale] = React.useState(null);
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
                                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedSale(sale)}>
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
                                                <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setSelectedSale(sale)}
                                                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-cyan-600 hover:border-cyan-200 transition-all shadow-sm"
                                                        title="Detail Transaksi"
                                                    >
                                                        <IconEye size={16} />
                                                    </button>
                                                    <Link
                                                        href={route("transactions.print", sale.sale_number)}
                                                        target="_blank"
                                                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-cyan-600 hover:border-cyan-200 transition-all shadow-sm"
                                                        title="Cetak Struk"
                                                    >
                                                        <IconPrinter size={16} />
                                                    </Link>
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

            {/* Detail Modal */}
            {selectedSale && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedSale(null)}/>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Detail Transaksi</h3>
                                <p className="text-sm font-mono text-cyan-600 font-bold">{selectedSale.sale_number}</p>
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
                                        {selectedSale.cashier_name ?? "-"}
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
                                        {selectedSale.customer_name ?? "Umum"}
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
                                                    <p className="text-sm font-black text-slate-800 dark:text-white">{fmt(item.subtotal)}</p>
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
                                                <div className="text-sm font-black text-cyan-600">{fmt(pm.amount)}</div>
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
                                            <span className="text-lg font-black text-cyan-600">{fmt(selectedSale.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setSelectedSale(null)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                Tutup
                            </button>
                            <Link href={route("transactions.print", selectedSale.sale_number)} className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-sm font-bold flex items-center gap-2 hover:scale-[1.02] transition-transform">
                                <IconPrinter size={18}/> Cetak Struk
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </POSLayout>
    );
}
