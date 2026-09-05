import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    IconPlus, IconFlask, IconEye,
    IconFileImport, IconDownload, IconFileSpreadsheet,
    IconSearch,
} from "@tabler/icons-react";
import PageHeader from "@/Components/Dashboard/PageHeader";
import Button from "@/Components/Dashboard/Button";
import Search from "@/Components/Dashboard/Search";
import Pagination from "@/Components/Dashboard/Pagination";

const GenderIcon = ({ gender }) => {
    const map = { male: "♂", female: "♀", unisex: "⚥" };
    const color = { male: "text-blue-500", female: "text-pink-500", unisex: "text-purple-500" };
    if (!gender || !map[gender]) return null;
    return <span className={`font-bold ${color[gender]}`} title={gender}>{map[gender]}</span>;
};

const StatusBadge = ({ isAllGenerated, isAnyGenerated }) => {
    if (isAllGenerated) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#e6fcf5] text-[#09a374] dark:bg-emerald-950/20 dark:text-[#34d399] border border-[#c3fae8] dark:border-emerald-800/30">
                Semua Generated
            </span>
        );
    }
    if (isAnyGenerated) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#fff9db] text-[#e67e22] dark:bg-amber-950/20 dark:text-[#fbbf24] border border-[#ffe066] dark:border-amber-800/30">
                Sebagian Generated
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#fff5f5] text-[#e74c3c] dark:bg-red-950/20 dark:text-[#f87171] border border-[#ffc9c9] dark:border-red-800/30">
            Belum Generated
        </span>
    );
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ stats }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 shadow-sm mb-6">
            <div className="text-center px-4 py-2 md:py-0">
                <div className="text-2xl sm:text-[26px] font-bold text-[#0f172a] dark:text-white leading-none mb-1.5 tabular-nums">
                    {stats.total_variants}
                </div>
                <div className="text-xs font-semibold text-slate-450 dark:text-slate-500">Total Variant</div>
            </div>
            <div className="text-center px-4 py-2 md:py-0">
                <div className="text-2xl sm:text-[26px] font-bold text-[#0f172a] dark:text-white leading-none mb-1.5 tabular-nums">
                    {stats.total_formulas}
                </div>
                <div className="text-xs font-semibold text-slate-450 dark:text-slate-500">Total Formula</div>
            </div>
            <div className="text-center px-4 py-2 md:py-0">
                <div className="text-2xl sm:text-[26px] font-bold text-[#09a374] dark:text-[#34d399] leading-none mb-1.5 tabular-nums">
                    {stats.total_generated}/{stats.total_formulas}
                </div>
                <div className="text-xs font-semibold text-slate-450 dark:text-slate-500">Sudah Generated</div>
            </div>
            <div className="text-center px-4 py-2 md:py-0">
                <div className="text-2xl sm:text-[26px] font-bold text-[#0f172a] dark:text-white leading-none mb-1.5 tabular-nums">
                    {stats.total_ingredients}
                </div>
                <div className="text-xs font-semibold text-slate-450 dark:text-slate-500">Total Bahan</div>
            </div>
        </div>
    );
}

// ─── Main Index ───────────────────────────────────────────────────────────────
export default function Index({ variantRecipes, filters, stats }) {
    const rows = variantRecipes.data ?? [];
    const hasAnyData = stats.total_variants > 0;

    const handleFilter = (status) => {
        router.get(route("recipes.index"), { ...filters, status, page: undefined }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        router.get(route("recipes.index"), {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Formula Variant" />

            {/* ── Page Header ── */}
            <PageHeader
                title="Formula Variant"
                description="Base recipe 30ml — tersusun per variant & intensitas"
            />

            {/* ── Stats ── */}
            {hasAnyData && <StatsBar stats={stats} />}

            {/* ── Search & Filter ── */}
            {hasAnyData && (
                <div className="flex flex-col xl:flex-row gap-3.5 mb-6 items-stretch xl:items-center justify-between">
                    <div className="w-full xl:w-[320px] flex-shrink-0">
                        <Search
                            url={route("recipes.index")}
                            placeholder="Cari variant, kode, intensitas…"
                            value={filters.search}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto flex-nowrap scrollbar-none py-1">
                        {/* Segmented control */}
                        <div className="flex bg-[#f7f9fc] dark:bg-slate-850 border border-[#e8e8e8] dark:border-slate-700 rounded-[9px] p-[3px] h-11 overflow-x-auto flex-nowrap flex-shrink-0 scrollbar-none" role="group">
                            {[
                                { key: "all", label: "Semua" },
                                { key: "all_generated", label: "Semua Generated", dot: "bg-[#09a374]" },
                                { key: "generated", label: "Sebagian", dot: "bg-[#e67e22]" },
                                { key: "pending", label: "Belum", dot: "bg-[#e74c3c]" },
                            ].map(({ key, label, dot }) => (
                                <button
                                    key={key}
                                    onClick={() => handleFilter(key)}
                                    className={`h-[36px] rounded-[7px] px-3.5 flex items-center gap-2 text-xs font-semibold border-0 transition-all cursor-pointer flex-shrink-0 ${
                                        (filters.status || "all") === key
                                            ? "bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white shadow-[0px_1px_2px_rgba(15,23,41,0.06)] border border-[#e8e8e8] dark:border-slate-700"
                                            : "bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                                    }`}
                                >
                                    {dot && <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />}
                                    {label}
                                </button>
                            ))}
                        </div>

                        <a
                            href={route("recipes.import.template")}
                            className="h-11 px-4 bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[9px] text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer flex-shrink-0"
                        >
                            <IconDownload size={15} /> Template
                        </a>

                        <a
                            href={route("recipes.export")}
                            className="h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[9px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer flex-shrink-0"
                        >
                            <IconFileSpreadsheet size={15} /> Export Excel
                        </a>

                        <Link
                            href={route("recipes.import.index")}
                            className="h-11 px-4 bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[9px] text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer flex-shrink-0"
                        >
                            <IconFileImport size={15} /> Import
                        </Link>

                        <Button
                            type="add"
                            href={route("recipes.create")}
                            label="Tambah Formula"
                            className="flex-shrink-0"
                        />
                    </div>
                </div>
            )}

            {hasAnyData && (filters.search || (filters.status && filters.status !== "all")) && (
                <p className="text-xs text-slate-500 mb-3">
                    Menampilkan <strong>{variantRecipes.total}</strong> variant sesuai filter
                </p>
            )}

            {/* ── Table ── */}
            {!hasAnyData ? (
                <div className="bg-white dark:bg-slate-900 p-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <IconFlask size={32} className="text-teal-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1">Belum ada formula variant</p>
                    <p className="text-sm text-slate-400 mb-5">Mulai buat formula pertama Anda</p>
                    <Link
                        href={route("recipes.create")}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-500/30"
                    >
                        <IconPlus size={18} /> Buat Formula Baru
                    </Link>
                </div>
            ) : rows.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <IconSearch size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-semibold">Tidak ada hasil yang sesuai</p>
                    <button onClick={resetFilters} className="mt-3 text-sm text-slate-700 hover:underline">
                        Reset filter
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3.5">Variant</th>
                                    <th className="px-5 py-3.5">Intensitas</th>
                                    <th className="px-5 py-3.5 text-center">Total Bahan</th>
                                    <th className="px-5 py-3.5 text-center">Generated</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rows.map((group) => {
                                    const generatedCount = group.intensities.filter(i => i.is_generated).length;
                                    return (
                                        <tr key={group.variant_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{group.variant.name}</span>
                                                    <GenderIcon gender={group.variant.gender} />
                                                </div>
                                                <div className="text-[10px] font-mono text-slate-400 uppercase">{group.variant.code}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-wrap gap-1">
                                                    {group.intensities.map((it, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                                        >
                                                            {it.intensity?.code ?? "—"}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                                {group.total_ingredients}
                                            </td>
                                            <td className="px-5 py-3.5 text-center text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                                {generatedCount}/{group.intensity_count}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <StatusBadge isAllGenerated={group.is_all_generated} isAnyGenerated={group.is_any_generated} />
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Link
                                                    href={route("recipes.by-variant", group.variant_id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-teal-900/30 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    <IconEye size={13} /> Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Pagination links={variantRecipes.links} />
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
