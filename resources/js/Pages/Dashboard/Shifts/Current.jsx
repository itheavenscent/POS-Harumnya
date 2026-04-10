import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import CloseShiftModal from "@/Components/Dashboard/CloseShiftModal";
import {
    IconPrinter,
    IconCash,
    IconChevronRight,
    IconClock,
    IconUser,
    IconBuildingStore,
    IconPackage,
    IconReceipt,
    IconArrowLeft
} from "@tabler/icons-react";

export default function Current({ drawer, summary }) {
    const { props } = usePage();
    const { auth } = props;
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

    const fmt = (v = 0) =>
        Number(v || 0).toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        });

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }) + " at " + new Date(date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    return (
        <POSLayout>
            <Head title="Shift Saat Ini" />
            <div className="flex h-full bg-white dark:bg-slate-950 overflow-hidden">
                {/* Left Sidebar (Module Navigation) */}
                <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                             Shift
                        </h2>
                    </div>
                    <nav className="flex-1 p-3 space-y-1">
                        <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengaturan Shift</p>
                        <div className="px-4 py-2.5 rounded-xl text-slate-400 font-medium text-sm flex items-center justify-between">
                            <span>Pilihan Shift</span>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase font-black">Tidak Aktif</span>
                        </div>
                        <Link
                            href={route("cash-drawers.current")}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/20"
                        >
                            <span className="flex-1">Shift Saat Ini</span>
                        </Link>
                        <Link
                            href={route("cash-drawers.index")}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 font-bold text-sm transition-colors"
                        >
                            <span className="flex-1">Histori Shift</span>
                        </Link>
                    </nav>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Heaven Scent</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950">
                    {/* Header */}
                    <div className="border-b border-slate-200 dark:border-slate-800 px-8 py-6">
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white text-center">Shift Saat Ini</h1>
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/10 p-8">
                        <div className="max-w-3xl mx-auto space-y-8">
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setIsCloseModalOpen(true)}
                                    className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    Akhiri Shift
                                </button>
                                <Link
                                    href={route("cash-drawers.print", drawer.id)}
                                    target="_blank"
                                    className="h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    Cetak Laporan Shift
                                </Link>
                            </div>

                            {/* Shift Details Section */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detil Shift</h3>
                                    <div className="space-y-4 px-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">Nama</span>
                                            <span className="text-slate-800 dark:text-white font-bold">{drawer.cashier?.name || auth.user.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">Outlet</span>
                                            <span className="text-slate-800 dark:text-white font-bold">{drawer.store?.name || "Heaven Scent POS"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">Mulai Shift</span>
                                            <span className="text-slate-800 dark:text-white font-bold">{formatDate(drawer.opened_at)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm hover:bg-slate-100 dark:hover:bg-slate-800/50 p-2 rounded-lg cursor-pointer transition-colors group">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">Kas Keluar / Kas Masuk</span>
                                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                                <span>0</span>
                                                <IconChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detil Pemesanan (KECUALI MOKA ORDER DELIVERY)</h3>
                                    <div className="space-y-4 px-2">
                                        <div className="flex items-center justify-between text-sm hover:bg-slate-100 dark:hover:bg-slate-800/50 p-2 rounded-lg cursor-pointer transition-colors group">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">Produk Terjual</span>
                                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                                <span>{summary.items_sold}</span>
                                                <IconChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm hover:bg-slate-100 dark:hover:bg-slate-800/50 p-2 rounded-lg cursor-pointer transition-colors group">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">Produk Refund</span>
                                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                                                <span>0</span>
                                                <IconChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Detil Pemesanan (HANYA MOKA ORDER DELIVERY)</h3>
                                    {/* Placeholder for Moka Style compatibility */}
                                    <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-center">
                                        <p className="text-xs text-slate-500 font-medium italic">Tidak ada transaksi delivery</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isCloseModalOpen && (
                <CloseShiftModal
                    isOpen={isCloseModalOpen}
                    onClose={() => setIsCloseModalOpen(false)}
                    activeCashDrawer={drawer}
                />
            )}
        </POSLayout>
    );
}
