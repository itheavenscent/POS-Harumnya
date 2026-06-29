import React, { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import { IconArrowLeft, IconCheck, IconDownload, IconAlertTriangle, IconClock, IconBuildingStore } from "@tabler/icons-react";
import toast from "react-hot-toast";

const STATUS_CFG = {
    in_transit: { label: "Dalam Perjalanan", cls: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800" },
    completed:  { label: "Selesai",          cls: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" },
    cancelled:  { label: "Dibatalkan",       cls: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800" },
};

export default function Show({ transfer }) {
    const [rcvdQtys, setRcvdQtys] = useState({});
    const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split("T")[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fmtQty = (n) => parseInt(n || 0).toLocaleString("id-ID");
    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString("id-ID", {
            day: "2-digit", month: "long", year: "numeric",
        }) : "-";

    const st = STATUS_CFG[transfer.status] || { label: transfer.status, cls: "bg-slate-50 text-slate-600" };

    const handleReceive = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const items = transfer.items.map((item) => ({
            id: item.id,
            quantity_received: parseInt(rcvdQtys[item.id] ?? item.quantity_sent) || 0,
        }));

        router.post(
            route("pos.fulfillment.receive", transfer.id),
            { items, actual_arrival_date: arrivalDate },
            {
                onSuccess: () => {
                    toast.success("Penerimaan barang berhasil diproses!");
                },
                onError: (errors) => {
                    toast.error(Object.values(errors)[0] || "Terjadi kesalahan saat menerima barang");
                    setIsSubmitting(false);
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    return (
        <POSLayout>
            <Head title={`Fulfillment ${transfer.transfer_number}`} />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
                {/* Top Action Bar */}
                <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <Link
                        href={route("pos.fulfillment.index")}
                        className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 text-sm font-bold transition-colors"
                    >
                        <IconArrowLeft size={18} /> Kembali ke Daftar
                    </Link>

                    <span className={`text-xs px-3 py-1 rounded-full font-black border uppercase tracking-wider ${st.cls}`}>
                        {st.label}
                    </span>
                </div>

                <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
                    {/* Information Cards */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-2xl text-cyan-600">
                                    <IconBuildingStore size={28} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No. Transfer</p>
                                    <h1 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                                        {transfer.transfer_number}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Route Map */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ASAL PENGIRIMAN</span>
                                <span className="text-sm font-black text-slate-850 dark:text-slate-200">{transfer.from_name}</span>
                                <span className="block text-[10px] text-slate-400 capitalize mt-0.5">Tipe: {transfer.from_location_type}</span>
                            </div>
                            <div className="p-4 bg-cyan-50/40 dark:bg-cyan-950/20 rounded-2xl border border-cyan-100/50 dark:border-cyan-900/30">
                                <span className="block text-[10px] font-black text-cyan-600/80 dark:text-cyan-400 uppercase tracking-widest mb-1">TUJUAN (TOKO ANDA)</span>
                                <span className="text-sm font-black text-slate-850 dark:text-slate-200">{transfer.to_name}</span>
                                <span className="block text-[10px] text-slate-400 capitalize mt-0.5">Tipe: {transfer.to_location_type}</span>
                            </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-xs">
                            {[
                                { label: "Tgl Transfer", value: fmtDate(transfer.transfer_date) },
                                { label: "Est. Tiba", value: fmtDate(transfer.expected_arrival_date) },
                                { label: "Tiba Aktual", value: transfer.actual_arrival_date ? fmtDate(transfer.actual_arrival_date) : "-" },
                                { label: "Pengirim", value: transfer.sender?.name ?? "-" },
                            ].map(({ label, value }) => (
                                <div key={label} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                    <span className="block font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">{label}</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{value}</span>
                                </div>
                            ))}
                        </div>

                        {transfer.notes && (
                            <div className="mt-4 p-4 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-100/50 dark:border-yellow-900/30 rounded-2xl text-xs text-slate-600 dark:text-slate-400">
                                <span className="font-bold block mb-1">Catatan Pengirim:</span>
                                {transfer.notes}
                            </div>
                        )}
                    </div>

                    {/* Form Penerimaan Barang */}
                    {transfer.status === "in_transit" ? (
                        <form onSubmit={handleReceive} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-violet-600">
                                    <IconDownload size={20} />
                                    <h2 className="font-black text-slate-800 dark:text-white text-base">Konfirmasi Penerimaan Barang</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Tgl Tiba Aktual:</label>
                                    <input
                                        type="date"
                                        required
                                        value={arrivalDate}
                                        onChange={(e) => setArrivalDate(e.target.value)}
                                        className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-xs focus:outline-none focus:border-cyan-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Table of Items */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Barang</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Dikirim</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Diterima</th>
                                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Stok Toko Saat Ini</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {transfer.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-850 dark:text-white">{item.item_name}</p>
                                                    <span className="text-[10px] font-mono text-slate-400 uppercase">{item.item_code} · {item.item_unit}</span>
                                                    {item.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">Catatan: {item.notes}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-slate-700 dark:text-slate-350 text-sm">
                                                    {fmtQty(item.quantity_sent)} <span className="text-xs font-normal text-slate-400">{item.item_unit}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-end">
                                                        <div className="w-24 relative">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                required
                                                                value={rcvdQtys[item.id] ?? item.quantity_sent}
                                                                onChange={(e) => setRcvdQtys({ ...rcvdQtys, [item.id]: e.target.value })}
                                                                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-xs text-right pr-3 focus:outline-none focus:border-cyan-500 font-bold"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">
                                                    {fmtQty(item.dest_stock)} <span className="font-normal text-slate-400">{item.item_unit}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Submit Button */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                                <Link
                                    href={route("pos.fulfillment.index")}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-violet-900/10 hover:scale-[1.02]"
                                >
                                    <IconCheck size={16} />
                                    {isSubmitting ? "Memproses..." : "Konfirmasi Diterima"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Read-only View for Completed / Cancelled Transfers */
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-slate-500">
                                <IconClock size={18} />
                                <h2 className="font-black text-slate-850 dark:text-white text-xs uppercase tracking-wide">
                                    Item yang Diterima
                                </h2>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/40">
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Nama Barang</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Diminta</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Dikirim</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Diterima</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {transfer.items.map((item) => {
                                        const matches = parseInt(item.quantity_received) === parseInt(item.quantity_sent);
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-850 dark:text-white">{item.item_name}</p>
                                                    <span className="text-[10px] font-mono text-slate-400 uppercase">{item.item_code} · {item.item_unit}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-slate-500">
                                                    {fmtQty(item.quantity_requested)} <span className="font-normal text-slate-400">{item.item_unit}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-slate-500">
                                                    {fmtQty(item.quantity_sent)} <span className="font-normal text-slate-400">{item.item_unit}</span>
                                                </td>
                                                <td className={`px-6 py-4 text-right text-sm font-bold ${matches ? "text-emerald-600" : "text-amber-600"}`}>
                                                    {fmtQty(item.quantity_received)} <span className="text-xs font-normal text-slate-400">{item.item_unit}</span>
                                                    {!matches && (
                                                        <span className="block text-[9px] font-black text-amber-500 mt-0.5 uppercase tracking-wider flex items-center justify-end gap-1">
                                                            <IconAlertTriangle size={10} /> Selisih {fmtQty(item.quantity_sent - item.quantity_received)}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </POSLayout>
    );
}
