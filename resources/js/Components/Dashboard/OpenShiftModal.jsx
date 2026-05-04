import React from "react";
import { useForm } from "@inertiajs/react";
import { IconX, IconCash, IconCheck } from "@tabler/icons-react";

export default function OpenShiftModal({ isOpen, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        starting_cash: 0,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("cash-drawers.open"), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                            <IconCash size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Buka Shift Kasir</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Inisialisasi modal awal laci kasir</p>
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
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400">
                        Masukkan jumlah uang tunai (modal awal) yang ada di laci kasir saat ini untuk memulai transaksi.
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Modal Awal (Rp)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                            <input
                                type="text"
                                value={data.starting_cash ? new Intl.NumberFormat("id-ID").format(data.starting_cash) : ""}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    setData("starting_cash", val ? parseInt(val) : 0);
                                }}
                                className={`w-full h-14 pl-12 pr-4 rounded-xl border-2 dark:bg-slate-950 dark:text-white text-xl font-black focus:outline-none transition-all ${
                                    errors.starting_cash
                                        ? "border-red-500 ring-red-500/20"
                                        : "border-slate-100 dark:border-slate-800 focus:border-rose-500"
                                }`}
                                placeholder="0"
                                required
                                autoFocus
                            />
                        </div>
                        {errors.starting_cash && <p className="mt-1 text-xs text-red-500 font-medium">{errors.starting_cash}</p>}
                    </div>

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
                            className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm transition-all shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconCheck size={18} />
                                    Buka Shift Sekarang
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
