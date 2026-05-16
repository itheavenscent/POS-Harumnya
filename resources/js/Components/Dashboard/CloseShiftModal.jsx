import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { IconX, IconCashBanknote, IconCheck, IconAlertTriangle, IconNotes } from "@tabler/icons-react";

export default function CloseShiftModal({ isOpen, onClose, activeCashDrawer }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        actual_ending_cash: 0,
        notes: "",
    });

    useEffect(() => {
        if (isOpen && activeCashDrawer) {
            setData("actual_ending_cash", 0);
        }
    }, [isOpen, activeCashDrawer]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("cash-drawers.close", activeCashDrawer.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!isOpen || !activeCashDrawer) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <IconCashBanknote size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Tutup Shift Kasir</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Finalisasi & cetak rekapitulasi shift</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <IconX size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-emerald-500/20">
                            <IconCheck size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-emerald-800 dark:text-emerald-400">Konfirmasi Tutup Shift</p>
                            <p className="text-xs text-emerald-600/80 dark:text-emerald-500/80 mt-0.5 leading-relaxed">
                                Anda akan menutup shift saat ini. Semua data transaksi akan direkapitulasi dan Anda dapat mencetak laporan setelah ini.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waktu Buka</span>
                            <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                                {new Date(activeCashDrawer.opened_at).toLocaleString('id-ID', { 
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/50">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Modal Awal</span>
                            <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                                Rp {parseFloat(activeCashDrawer.starting_cash).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl border-2 border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconCheck size={18} />
                                    Tutup Shift Sekarang
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
