import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import POSLayout from "@/Layouts/POSLayout";
import OpenShiftModal from "@/Components/Dashboard/OpenShiftModal";
import {
    IconCash,
    IconHistory,
    IconAlertCircle,
    IconPlus
} from "@tabler/icons-react";

export default function NoActiveShift() {
    const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);

    return (
        <POSLayout>
            <Head title="Shift" />
            <div className="flex h-full bg-white dark:bg-slate-950 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50 text-slate-400">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                             Shift
                        </h2>
                    </div>
                    <nav className="flex-1 p-3 space-y-1">
                        <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest">Pengaturan Shift</p>
                        <div className="px-4 py-2.5 rounded-xl text-slate-300 font-medium text-sm flex items-center justify-between">
                            <span>Pilihan Shift</span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase font-black">Tidak Aktif</span>
                        </div>
                        <div className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-400 font-bold text-sm">
                            Shift Saat Ini
                        </div>
                        <Link
                            href={route("cash-drawers.index")}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 font-bold text-sm transition-colors"
                        >
                            <span className="flex-1">Histori Shift</span>
                        </Link>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/20 dark:bg-slate-900/10">
                    <div className="max-w-sm w-full text-center space-y-6">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-300">
                            <IconCash size={40} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Tidak Ada Shift Aktif</h2>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Anda belum membuka shift hari ini. Silakan buka shift untuk mulai melakukan transaksi.
                            </p>
                        </div>
                        <div className="pt-4 flex flex-col gap-3">
                            <button
                                onClick={() => setIsOpenModalOpen(true)}
                                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                            >
                                <IconPlus size={18} />
                                Buka Shift Sekarang
                            </button>
                            <Link
                                href={route("cash-drawers.index")}
                                className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                <IconHistory size={18} />
                                Lihat Histori Shift
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {isOpenModalOpen && (
                <OpenShiftModal
                    isOpen={isOpenModalOpen}
                    onClose={() => setIsOpenModalOpen(false)}
                />
            )}
        </POSLayout>
    );
}
