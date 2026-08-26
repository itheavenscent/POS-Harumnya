import React, { useMemo } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import {
    IconArrowLeft, IconDeviceFloppy, IconPackage,
    IconPlus, IconTrash, IconInfoCircle, IconStack2,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

const fmt = (v = 0) => Number(v || 0).toLocaleString("id-ID");

export default function Components({ packaging, components, candidates }) {
    const { data, setData, put, processing } = useForm({
        components: components.map(c => ({
            component_packaging_id: c.component_packaging_id,
            quantity: c.quantity,
            // metadata display saja
            name: c.name,
            code: c.code,
            unit: c.unit,
            average_cost: c.average_cost,
        })),
    });

    // Kandidat yang belum dipakai
    const usedIds = new Set(data.components.map(c => c.component_packaging_id));
    const available = candidates.filter(c => !usedIds.has(c.id));

    const assembledCost = useMemo(
        () => data.components.reduce((s, c) => s + (Number(c.average_cost) || 0) * (Number(c.quantity) || 0), 0),
        [data.components]
    );

    const addComponent = (id) => {
        const cand = candidates.find(c => c.id === id);
        if (!cand) return;
        setData("components", [
            ...data.components,
            {
                component_packaging_id: cand.id,
                quantity: 1,
                name: cand.name,
                code: cand.code,
                unit: cand.unit,
                average_cost: Number(cand.average_cost) || 0,
            },
        ]);
    };

    const setQty = (idx, qty) => {
        const next = [...data.components];
        next[idx] = { ...next[idx], quantity: Math.max(1, Number(qty) || 1) };
        setData("components", next);
    };

    const removeRow = (idx) => {
        setData("components", data.components.filter((_, i) => i !== idx));
    };

    const submit = (e) => {
        e.preventDefault();
        put(route("packaging.components.sync", packaging.id), {
            onSuccess: () => toast.success("Komponen rakitan disimpan"),
            onError:   () => toast.error("Gagal menyimpan komponen"),
        });
    };

    return (
        <>
            <Head title={`Komponen ${packaging.name}`} />
            <div className="max-w-4xl mx-auto px-4 py-6">
                <Link
                    href={route("packaging.edit", packaging.id)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 mb-5 font-medium transition-colors"
                >
                    <IconArrowLeft size={16} /> Kembali ke Edit Kemasan
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                        <IconStack2 size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Komponen Rakitan</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            <span className="font-mono text-slate-400">{packaging.code}</span> · {packaging.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-2 mb-5 p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 rounded-xl">
                    <IconInfoCircle size={15} className="text-teal-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Kemasan rakitan tidak punya stok sendiri. Saat terjual, stok tiap komponen di
                        bawah ini otomatis berkurang (jumlah × qty). HPP rakitan = total HPP komponen.
                    </p>
                </div>

                <form onSubmit={submit}>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                            <IconPackage size={18} className="text-indigo-500" /> Daftar Komponen
                        </h2>

                        {/* Tambah komponen */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tambah Komponen</label>
                            <div className="relative">
                                <select
                                    value=""
                                    onChange={e => { if (e.target.value) addComponent(e.target.value); }}
                                    disabled={available.length === 0}
                                    className="appearance-none w-full h-10 pl-3 pr-8 rounded-xl border bg-white dark:bg-slate-950 dark:text-white text-sm border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 transition-all"
                                >
                                    <option value="">{available.length ? "Pilih komponen…" : "Semua kandidat sudah dipakai"}</option>
                                    {available.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code}) · HPP {fmt(Math.round(c.average_cost))}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                                    <IconPlus size={16} className="text-slate-400" />
                                </div>
                            </div>
                        </div>

                        {/* Baris komponen */}
                        {data.components.length === 0 ? (
                            <div className="py-10 text-center text-slate-400 text-sm border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                                Belum ada komponen. Tambahkan minimal 1 komponen.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.components.map((c, idx) => (
                                    <div key={c.component_packaging_id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{c.name}</p>
                                            <p className="text-[11px] text-slate-400 font-mono">{c.code} · HPP {fmt(Math.round(c.average_cost))}/{c.unit}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                min={1}
                                                value={c.quantity}
                                                onChange={e => setQty(idx, e.target.value)}
                                                className="w-16 h-9 text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            />
                                            <span className="text-xs text-slate-400 w-8">{c.unit}</span>
                                        </div>
                                        <div className="text-right w-24 hidden sm:block">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                Rp {fmt(Math.round((Number(c.average_cost) || 0) * (Number(c.quantity) || 0)))}
                                            </p>
                                            <p className="text-[10px] text-slate-400">subtotal HPP</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeRow(idx)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                        >
                                            <IconTrash size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Total HPP rakitan */}
                        {data.components.length > 0 && (
                            <div className="mt-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 flex items-center justify-between text-sm">
                                <span className="text-indigo-700 dark:text-indigo-400 font-medium">HPP Rakitan (total komponen)</span>
                                <span className="font-bold text-lg text-indigo-700 dark:text-indigo-400">Rp {fmt(Math.round(assembledCost))}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 transition-colors"
                        >
                            {processing
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <IconDeviceFloppy size={20} />
                            }
                            {processing ? "Menyimpan…" : "Simpan Komponen"}
                        </button>
                        <Link
                            href={route("packaging.index")}
                            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl flex items-center justify-center text-sm transition-colors"
                        >
                            Batal
                        </Link>
                    </div>
                </form>
            </div>
        </>
    );
}

Components.layout = page => <DashboardLayout children={page} />;
