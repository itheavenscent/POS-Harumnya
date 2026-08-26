import React, { useMemo, useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    IconArrowLeft, IconDeviceFloppy, IconTable, IconInfoCircle,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import MoneyInput from "@/Components/Dashboard/MoneyInput";

function buildGrid(intensities, sizes, cells) {
    const map = {};
    intensities.forEach(i => {
        map[i.id] = {};
        sizes.forEach(s => {
            map[i.id][s.id] = { price: "", is_active: false };
        });
    });
    cells.forEach(c => {
        if (map[c.intensity_id] && map[c.intensity_id][c.size_id] !== undefined) {
            map[c.intensity_id][c.size_id] = {
                price: c.price ? String(c.price) : "",
                is_active: !!c.is_active,
            };
        }
    });
    return map;
}

export default function Matrix({ intensities, sizes, cells }) {
    const initial = useMemo(() => buildGrid(intensities, sizes, cells), [intensities, sizes, cells]);
    const [grid, setGrid]   = useState(initial);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty]   = useState(false);

    const toggle = (intensityId, sizeId) => {
        setGrid(prev => ({
            ...prev,
            [intensityId]: {
                ...prev[intensityId],
                [sizeId]: { ...prev[intensityId][sizeId], is_active: !prev[intensityId][sizeId].is_active },
            },
        }));
        setDirty(true);
    };

    const setPrice = (intensityId, sizeId, parsed) => {
        setGrid(prev => ({
            ...prev,
            [intensityId]: {
                ...prev[intensityId],
                [sizeId]: { ...prev[intensityId][sizeId], price: parsed === "0.00" ? "" : parsed },
            },
        }));
        setDirty(true);
    };

    const submit = () => {
        const payload = [];
        const missingPrice = [];

        intensities.forEach(i => {
            sizes.forEach(s => {
                const cell = grid[i.id][s.id];
                if (cell.is_active && (!cell.price || Number(cell.price) <= 0)) {
                    missingPrice.push(`${i.name} × ${s.name}`);
                }
                payload.push({
                    intensity_id: i.id,
                    size_id: s.id,
                    price: cell.price === "" ? null : Number(cell.price),
                    is_active: !!cell.is_active,
                });
            });
        });

        if (missingPrice.length > 0) {
            toast.error(`Isi harga untuk: ${missingPrice.slice(0, 3).join(", ")}${missingPrice.length > 3 ? ` +${missingPrice.length - 3} lagi` : ""}`);
            return;
        }

        setSaving(true);
        router.post(route("intensity-size-prices.matrix.update"), { cells: payload }, {
            preserveScroll: true,
            onSuccess: () => { toast.success("Ukuran jual & harga tersimpan!"); setDirty(false); },
            onError:   () => toast.error("Gagal menyimpan, periksa kembali isian"),
            onFinish:  () => setSaving(false),
        });
    };

    return (
        <>
            <Head title="Ukuran Jual per Intensitas" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Link
                            href={route("intensity-size-prices.index")}
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors mb-3"
                        >
                            <IconArrowLeft size={16} /> Lihat sebagai daftar / riwayat
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="p-2 bg-teal-600 rounded-lg text-white shadow-lg shadow-teal-500/30">
                                <IconTable size={20} />
                            </div>
                            Ukuran Jual per Intensitas
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 ml-11">
                            Nyalakan ukuran yang dijual untuk tiap intensitas dan isi harganya.
                        </p>
                    </div>
                    <button
                        onClick={submit}
                        disabled={saving || !dirty}
                        className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-teal-500/30 flex-shrink-0"
                    >
                        {saving
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <IconDeviceFloppy size={18} />}
                        {saving ? "Menyimpan..." : "Simpan Semua"}
                    </button>
                </div>

                <div className="flex items-start gap-2 mb-5 p-3 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900 rounded-xl">
                    <IconInfoCircle size={15} className="text-teal-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                        Ukuran yang dimatikan otomatis tidak muncul di kasir dan tidak ikut ter-generate jadi produk.
                        Contoh: intensitas <strong>Pure</strong> cuma dijual ukuran 10ml — nyalakan kolom 10ml saja untuk baris Pure, matikan sisanya.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[640px]">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 dark:bg-slate-800/40">
                                        Intensitas
                                    </th>
                                    {sizes.map(s => (
                                        <th key={s.id} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">
                                            {s.name} <span className="text-slate-400 font-medium normal-case">({s.volume_ml}ml)</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {intensities.map((i, idx) => (
                                    <tr key={i.id} className={idx % 2 === 1 ? "bg-slate-50/50 dark:bg-slate-800/20" : ""}>
                                        <td className="px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white sticky left-0 bg-inherit whitespace-nowrap">
                                            {i.name} <span className="text-slate-400 font-mono text-xs">({i.code})</span>
                                        </td>
                                        {sizes.map(s => {
                                            const cell = grid[i.id][s.id];
                                            return (
                                                <td key={s.id} className="px-3 py-3 text-center align-middle">
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={cell.is_active}
                                                                onChange={() => toggle(i.id, s.id)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600" />
                                                        </label>
                                                        {cell.is_active && (
                                                            <MoneyInput
                                                                value={cell.price}
                                                                onChange={parsed => setPrice(i.id, s.id, parsed)}
                                                                placeholder="Rp 0"
                                                                className="w-24 text-center text-xs py-1 px-1.5 border focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

Matrix.layout = page => <DashboardLayout children={page} />;
