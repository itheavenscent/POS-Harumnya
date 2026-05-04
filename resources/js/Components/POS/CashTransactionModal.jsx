import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { IconX, IconArrowsExchange, IconArrowUpRight, IconArrowDownLeft, IconCheck } from "@tabler/icons-react";
import toast from "react-hot-toast";

export default function CashTransactionModal({ isOpen, onClose }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        type: "cash_in",
        amount: "",
        description: "",
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("cash-drawers.store-transaction"), {
            onSuccess: () => {
                toast.success("Transaksi kas berhasil dicatat");
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <IconArrowsExchange size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Cash In / Cash Out</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Catat pengeluaran/pemasukan kas shift</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <IconX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setData("type", "cash_in")}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                                data.type === "cash_in"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                    : "border-slate-100 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                            }`}
                        >
                            <IconArrowDownLeft size={18} />
                            <span className="font-bold text-sm">Cash In</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setData("type", "cash_out")}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                                data.type === "cash_out"
                                    ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                                    : "border-slate-100 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                            }`}
                        >
                            <IconArrowUpRight size={18} />
                            <span className="font-bold text-sm">Cash Out</span>
                        </button>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Jumlah (Rp)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                            <input
                                type="number"
                                value={data.amount}
                                onChange={(e) => setData("amount", e.target.value)}
                                className={`w-full h-12 pl-12 pr-4 rounded-xl border-2 dark:bg-slate-950 dark:text-white text-lg font-black focus:outline-none transition-all ${
                                    errors.amount
                                        ? "border-red-500 ring-red-500/20"
                                        : "border-slate-100 dark:border-slate-800 focus:border-cyan-500"
                                }`}
                                placeholder="0"
                                required
                            />
                        </div>
                        {errors.amount && <p className="mt-1 text-xs text-red-500 font-medium">{errors.amount}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Keterangan / Alasan
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-slate-950 dark:text-white text-sm font-medium focus:outline-none transition-all resize-none ${
                                errors.description
                                    ? "border-red-500 ring-red-500/20"
                                    : "border-slate-100 dark:border-slate-800 focus:border-cyan-500"
                            }`}
                            placeholder="Contoh: Beli bensin, Tambah modal kembalian..."
                            rows={3}
                            required
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-500 font-medium">{errors.description}</p>}
                    </div>

                    {/* Footer */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full h-12 rounded-xl bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-700 text-white font-black text-sm transition-all shadow-lg shadow-slate-900/20 dark:shadow-cyan-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconCheck size={18} />
                                    Simpan Transaksi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
