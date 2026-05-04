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

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Shift Info Card */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Waktu Buka:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">
                                {new Date(activeCashDrawer.opened_at).toLocaleString('id-ID', { 
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Modal Awal:</span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold">
                                Rp {parseFloat(activeCashDrawer.starting_cash).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <IconAlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                            Silakan hitung total uang tunai fisik yang ada di laci saat ini (termasuk modal awal) dan masukkan nominalnya di bawah ini.
                        </p>
                    </div>

                    {/* Actual Cash Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Total Uang Tunai di Laci (Rp)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                            <input
                                type="text"
                                value={data.actual_ending_cash ? new Intl.NumberFormat("id-ID").format(data.actual_ending_cash) : ""}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    setData("actual_ending_cash", val ? parseInt(val) : 0);
                                }}
                                className={`w-full h-14 pl-12 pr-4 rounded-xl border-2 dark:bg-slate-950 dark:text-white text-xl font-black focus:outline-none transition-all ${
                                    errors.actual_ending_cash
                                        ? "border-red-500 ring-red-500/20"
                                        : "border-slate-100 dark:border-slate-800 focus:border-emerald-500"
                                }`}
                                placeholder="0"
                                required
                                autoFocus
                            />
                        </div>
                        {errors.actual_ending_cash && <p className="mt-1 text-xs text-red-500 font-medium">{errors.actual_ending_cash}</p>}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <IconNotes size={14} />
                            Catatan (Opsional)
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            rows={2}
                            className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-slate-950 dark:text-white text-sm font-medium focus:outline-none transition-all resize-none ${
                                errors.notes
                                    ? "border-red-500 ring-red-500/20"
                                    : "border-slate-100 dark:border-slate-800 focus:border-emerald-500"
                            }`}
                            placeholder="Contoh: Ada selisih karena pembulatan..."
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl border-2 border-slate-100 dark:border-slate-800 font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconCheck size={18} />
                                    Tutup Shift & Cetak Rekap
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
