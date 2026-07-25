import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    IconCirclePlus, IconDatabaseOff, IconPencilCog, IconTrash,
    IconLayoutGrid, IconList, IconBolt, IconCircleCheck, IconCircleX,
    IconFilter, IconRefresh, IconX, IconCheck, IconAlertTriangle,
    IconDropletFilled, IconFlask, IconBottle, IconRuler, IconChevronDown,
} from "@tabler/icons-react";
import Search from "@/Components/Dashboard/Search";
import Pagination from "@/Components/Dashboard/Pagination";
import Button from "@/Components/Dashboard/Button";
import PageHeader from "@/Components/Dashboard/PageHeader";
import toast from "react-hot-toast";

// =============================================================================
// Helpers
// =============================================================================

function StatusBadge({ isActive }) {
    return isActive ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-success-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm">
            <IconCircleCheck size={14} strokeWidth={2.5} /> Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shadow-sm">
            <IconCircleX size={14} strokeWidth={2.5} /> Tidak Aktif
        </span>
    );
}

function ConcentrationBadge({ level }) {
    const configs = {
        extreme:  { bg: "bg-red-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",             label: "Extrait",   ratio: "2:1" },
        strong:   { bg: "bg-orange-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", label: "EDP",       ratio: "1:1" },
        moderate: { bg: "bg-blue-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",          label: "EDT",       ratio: "1:2" },
        light:    { bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",         label: "Body Mist", ratio: "1:4" },
    };
    const cfg = configs[level] ?? configs.light;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg}`}>
            <span>{cfg.label}</span>
            <span className="opacity-60 font-mono">({cfg.ratio})</span>
        </span>
    );
}

// =============================================================================
// SizeQuantityMiniTable
// =============================================================================

function SizeQuantityMiniTable({ sizeQuantities }) {
    if (!sizeQuantities || sizeQuantities.length === 0) {
        return (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <IconAlertTriangle size={14} className="text-slate-400 flex-shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Belum ada konfigurasi volume
                </span>
            </div>
        );
    }
    return (
        <div className="w-full mt-2">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-[#f1f5f9] dark:border-slate-800">
                        <th className="pb-2 text-left font-medium text-[11px] text-[#5e7e9a] dark:text-slate-400">Ukuran</th>
                        <th className="pb-2 text-right font-medium text-[11px] text-[#5e7e9a] dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#02a9b1]" /> Bibit
                            </span>
                        </th>
                        <th className="pb-2 text-right font-medium text-[11px] text-[#5e7e9a] dark:text-slate-400">
                            <span className="inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#015e96]" /> Alkohol
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] dark:divide-slate-800">
                    {sizeQuantities.map((q, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 font-bold text-[12px] text-[#0f172a] dark:text-white">
                                {q.volume_ml}ml
                            </td>
                            <td className="py-2.5 text-right font-semibold text-[12px] text-[#02a9b1] dark:text-[#04cbd4]">
                                {q.oil_quantity} ml
                            </td>
                            <td className="py-2.5 text-right font-semibold text-[12px] text-[#015e96] dark:text-[#047bbd]">
                                {q.alcohol_quantity} ml
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// =============================================================================
// Delete Modal
// =============================================================================

function DeleteModal({ show, item, onConfirm, onClose, loading }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                        <IconAlertTriangle size={20} className="text-slate-700" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            Hapus Level "{item?.name}"?
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Data volume per ukuran juga akan terhapus.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                        {loading && (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Intensity Card
// =============================================================================

function IntensityCard({ intensity, isSelected, onSelect, onDelete }) {
    const [showQty, setShowQty] = useState(false);
    const hasQty = intensity.size_quantities && intensity.size_quantities.length > 0;

    const configs = {
        extreme:  { label: "Extrait",   ratio: "2:1" },
        strong:   { label: "EDP",       ratio: "1:1" },
        moderate: { label: "EDT",       ratio: "1:2" },
        light:    { label: "Body Mist", ratio: "1:4" },
    };

    const oil = parseInt(intensity.oil_ratio) || 1;
    const alc = parseInt(intensity.alcohol_ratio) || 1;
    const maxVal = Math.max(oil, alc);
    const oilHeight = `${(oil / maxVal) * 100}%`;
    const alcHeight = `${(alc / maxVal) * 100}%`;

    return (
        <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-[16px] p-5 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col justify-between">
            {/* Header info */}
            <div className="flex items-start gap-3">
                <div className="pt-0.5">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(intensity.id, e.target.checked)}
                        className="w-[18px] h-[18px] rounded-sm  border-[#CBD5E1] dark:border-slate-700 text-[#02a9b1] focus:ring-[#02a9b1] cursor-pointer"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[15px] text-[#0f172a] dark:text-white leading-[20px] truncate">
                        {intensity.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-[12px] text-[#94a3b8] dark:text-slate-400">
                            {intensity.code}
                        </span>
                        {intensity.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#10b981]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Aktif
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#64748b]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" /> Tidak Aktif
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Ratio block */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/40 border border-[#f1f5f9] dark:border-slate-800/80 rounded-[12px] p-4 flex flex-col gap-2.5 mt-4">
                <span className="font-bold text-[10px] text-[#5e7e9a] dark:text-slate-450 tracking-[0.5px] uppercase">
                    KOMPOSISI RATIO
                </span>
                <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
                    {/* Bibit Card */}
                    <div className="flex flex-col items-center flex-1 max-w-[84px]">
                        <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[8px] overflow-hidden flex flex-col justify-end w-full h-[68px] relative">
                            <div
                                className="w-full bg-gradient-to-t from-[#02a9b1] to-[#04cbd4] rounded-t-[6px] flex items-center justify-center transition-all duration-300"
                                style={{ height: oilHeight }}
                            >
                                {parseInt(oilHeight) >= 30 && (
                                    <span className="font-bold text-[14px] text-white select-none">
                                        {oil}
                                    </span>
                                )}
                            </div>
                            {parseInt(oilHeight) < 30 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="font-bold text-[14px] text-[#02a9b1] dark:text-[#04cbd4] select-none">
                                        {oil}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="font-semibold text-[11px] text-[#5e7e9a] dark:text-slate-400 mt-1.5 text-center">
                            Bibit
                        </span>
                    </div>

                    {/* Separator */}
                    <span className="font-bold text-[18px] text-[#94a3b8] dark:text-slate-500 self-center pb-5">:</span>

                    {/* Alkohol Card */}
                    <div className="flex flex-col items-center flex-1 max-w-[84px]">
                        <div className="bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 rounded-[8px] overflow-hidden flex flex-col justify-end w-full h-[68px] relative">
                            <div
                                className="w-full bg-gradient-to-t from-[#015e96] to-[#047bbd] rounded-t-[6px] flex items-center justify-center transition-all duration-300"
                                style={{ height: alcHeight }}
                            >
                                {parseInt(alcHeight) >= 30 && (
                                    <span className="font-bold text-[14px] text-white select-none">
                                        {alc}
                                    </span>
                                )}
                            </div>
                            {parseInt(alcHeight) < 30 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="font-bold text-[14px] text-[#015e96] dark:text-[#047bbd] select-none">
                                        {alc}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="font-semibold text-[11px] text-[#5e7e9a] dark:text-slate-400 mt-1.5 text-center">
                            Alkohol
                        </span>
                    </div>
                </div>
            </div>

            {/* Collapsible Quantity Per Size */}
            <div className="pt-3.5 mt-4 border-t border-[#f1f5f9] dark:border-slate-800/80">
                <button
                    type="button"
                    onClick={() => setShowQty(!showQty)}
                    className="w-full flex items-center justify-between text-[12px] font-semibold text-[#5e7e9a] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white transition-colors mb-2 cursor-pointer border-none bg-transparent"
                >
                    <span>
                        {configs[intensity.concentration_level]?.label || 'Lainnya'} ({intensity.oil_ratio}:{intensity.alcohol_ratio})
                    </span>
                    <span className="flex items-center gap-1 text-[#0f172a] dark:text-white font-semibold">
                        {intensity.size_quantities?.length || 0} ukuran
                        {showQty ? <IconChevronDown size={14} className="rotate-180 transition-transform duration-250" /> : <IconChevronDown size={14} className="transition-transform duration-250" />}
                    </span>
                </button>
                {showQty && <SizeQuantityMiniTable sizeQuantities={intensity.size_quantities} />}
            </div>

            {/* Edit / Delete actions */}
            <div className="flex gap-2 mt-4">
                <Link
                    href={route("intensities.edit", intensity.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-[#e2e8f0] dark:border-slate-750 text-[#0f172a] dark:text-white transition-all font-semibold text-[13px]"
                >
                    <IconPencilCog size={15} /> Edit
                </Link>
                <button
                    onClick={() => onDelete(intensity)}
                    className="px-3.5 py-2.5 rounded-[8px] border border-[#e2e8f0] dark:border-slate-750 hover:bg-red-50 dark:hover:bg-red-950/20 text-[#ef4444] transition-all cursor-pointer bg-transparent"
                >
                    <IconTrash size={15} />
                </button>
            </div>
        </div>
    );
}

// =============================================================================
// Filter Modal
// =============================================================================

function FilterModal({ show, onClose, filters, onApply }) {
    const [tempFilters, setTempFilters] = useState(filters);
    if (!show) return null;

    const selectCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 transition-all";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-slate-800 flex items-center justify-center">
                            <IconFilter size={20} className="text-slate-700 dark:text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Filter Intensitas</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <IconX size={20} className="text-slate-500" />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                        <select
                            value={tempFilters.is_active}
                            onChange={(e) => setTempFilters({ ...tempFilters, is_active: e.target.value })}
                            className={selectCls}
                        >
                            <option value="">Semua Status</option>
                            <option value="1">✅ Aktif</option>
                            <option value="0">❌ Tidak Aktif</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tampilkan per halaman</label>
                        <select
                            value={tempFilters.per_page}
                            onChange={(e) => setTempFilters({ ...tempFilters, per_page: e.target.value })}
                            className={selectCls}
                        >
                            {[12, 24, 48, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => { const r = { is_active: "", per_page: 12 }; setTempFilters(r); onApply(r); onClose(); }}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        Reset
                    </button>
                    <button
                        onClick={() => { onApply(tempFilters); onClose(); }}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30"
                    >
                        Terapkan
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Bulk Delete Modal
// =============================================================================

function BulkDeleteModal({ show, onClose, onConfirm, count }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <IconAlertTriangle size={24} className="text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">Hapus {count} Intensitas?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                    Tindakan ini tidak dapat dibatalkan. Data volume per ukuran juga akan terhapus.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Batal</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-500/30">Hapus Sekarang</button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// Index Page
// =============================================================================

export default function Index({ intensities, filters }) {
    const [viewMode, setViewMode]               = useState("grid");
    const [selectedIds, setSelectedIds]         = useState([]);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showBulkDelete, setShowBulkDelete]   = useState(false);
    const [deleteModal, setDeleteModal]         = useState({ show: false, item: null, loading: false });
    const [currentFilters, setCurrentFilters]   = useState({
        is_active: filters?.is_active ?? "",
        per_page:  filters?.per_page  || 12,
    });

    // ── Selection ─────────────────────────────────────────────────────────────
    const handleSelect    = (id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(sid => sid !== id));
    const handleSelectAll = (checked)     => setSelectedIds(checked ? intensities.data.map(i => i.id) : []);
    const allSelected     = intensities.data.length > 0 && selectedIds.length === intensities.data.length;

    // ── Single Delete ─────────────────────────────────────────────────────────
    const confirmDelete = (intensity) => setDeleteModal({ show: true, item: intensity, loading: false });
    const closeDelete   = ()          => setDeleteModal({ show: false, item: null, loading: false });

    const handleDelete = () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));
        router.delete(route("intensities.destroy", deleteModal.item.id), {
            onSuccess: () => { closeDelete(); toast.success("Level intensitas berhasil dihapus! 🗑️"); },
            onError:   () => { closeDelete(); toast.error("Gagal menghapus level intensitas, coba lagi."); },
        });
    };

    // ── Bulk Delete ───────────────────────────────────────────────────────────
    const handleBulkDelete = () => {
        router.post(route("intensities.bulk-delete"), { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setShowBulkDelete(false);
                toast.success(`${selectedIds.length} intensitas berhasil dihapus!`);
            },
            onError: () => toast.error("Terjadi kesalahan saat menghapus intensitas"),
        });
    };

    // ── Filters ───────────────────────────────────────────────────────────────
    const handleApplyFilters = (newFilters) => {
        setCurrentFilters(newFilters);
        const clean = {};
        if (filters?.search)             clean.search    = filters.search;
        if (newFilters.is_active !== "") clean.is_active = newFilters.is_active;
        if (newFilters.per_page)         clean.per_page  = newFilters.per_page;
        router.get(route("intensities.index"), clean, { preserveState: false, replace: true });
    };

    const hasActiveFilters = currentFilters.is_active !== "";

    return (
        <>
            <Head title="Level Intensitas" />

            {/* ── Header ── */}
            <PageHeader
                title="Level Intensitas"
                description={
                    <span className="flex items-center gap-1.5 mt-1">
                        <span>{intensities.total ?? intensities.data?.length ?? 0} Total Level</span>
                        {selectedIds.length > 0 && (
                            <>
                                <span className="text-slate-350 dark:text-slate-650">•</span>
                                <span className="text-[#02a9b1] dark:text-[#04cbd4] font-semibold">
                                    {selectedIds.length} dipilih
                                </span>
                            </>
                        )}
                    </span>
                }
            />

            {/* ── Toolbar ── */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <div className="w-full sm:w-[360px]">
                        <Search url={route("intensities.index")} placeholder="Cari nama atau kode..." />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => router.reload({ only: ["intensities"] })}
                            className="w-11 h-11 rounded-[9px] border border-[#e8e8e8] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-center transition-colors cursor-pointer"
                            title="Refresh"
                        >
                            <IconRefresh size={16} />
                        </button>
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className={`w-11 h-11 rounded-[9px] border flex items-center justify-center transition-colors cursor-pointer relative ${
                                hasActiveFilters
                                    ? "bg-primary-100 dark:bg-slate-800 border-[#02a9b1] text-[#02a9b1]"
                                    : "bg-white dark:bg-slate-900 border-[#e8e8e8] dark:border-slate-700 text-[#0f172a] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-750"
                            }`}
                            title="Filter"
                        >
                            <IconFilter size={16} />
                            {hasActiveFilters && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#02a9b1] rounded-full border-2 border-white dark:border-slate-900" />
                            )}
                        </button>
                        <div className="flex items-center gap-[2px] bg-[#f7f9fc] dark:bg-slate-850 border border-[#e8e8e8] dark:border-slate-700 rounded-[9px] p-[3px] h-11">
                            {[["grid", <IconLayoutGrid size={15} />], ["list", <IconList size={15} />]].map(([mode, icon]) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`size-[36px] rounded-[7px] flex items-center justify-center transition-all border-0 cursor-pointer ${
                                        viewMode === mode
                                            ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-[0px_1px_2px_rgba(15,23,41,0.06)] border border-[#e8e8e8] dark:border-slate-700"
                                            : "bg-transparent text-slate-450 hover:text-slate-700 dark:hover:text-slate-350"
                                    }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                        <Button
                            type="add"
                            href={route("intensities.create")}
                            label="Tambah Level"
                        />
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <IconCheck size={20} className="text-slate-700 dark:text-slate-300" />
                            <span className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                                {selectedIds.length} intensitas dipilih
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedIds([])} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all">Batal</button>
                            <button onClick={() => setShowBulkDelete(true)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all flex items-center gap-2">
                                <IconTrash size={16} strokeWidth={2} /> Hapus {selectedIds.length} Item
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Filter Tags */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter Aktif:</span>
                        {currentFilters.is_active !== "" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                Status: {currentFilters.is_active === "1" ? "Aktif" : "Tidak Aktif"}
                                <button onClick={() => handleApplyFilters({ ...currentFilters, is_active: "" })} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                                    <IconX size={12} strokeWidth={3} />
                                </button>
                            </span>
                        )}
                        <button onClick={() => handleApplyFilters({ is_active: "", per_page: 12 })} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline">Reset Semua</button>
                    </div>
                )}
            </div>

            {/* ── Content ── */}
            {intensities.data.length > 0 ? (
                viewMode === "grid" ? (
                    <>
                        <div className="mb-4">
                            <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2.5 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 rounded-sm  border-[1.40px] border-slate-300 text-slate-700 focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Pilih Semua ({intensities.data.length})
                                </span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {intensities.data.map((intensity) => (
                                <IntensityCard
                                    key={intensity.id}
                                    intensity={intensity}
                                    isSelected={selectedIds.includes(intensity.id)}
                                    onSelect={handleSelect}
                                    onDelete={confirmDelete}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                        <th className="px-4 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                className="w-4 h-4 rounded border-2 border-slate-300 text-slate-700 focus:ring-2 focus:ring-primary-500"
                                            />
                                        </th>
                                        {["No", "Level", "Ratio", "Level Konsentrasi", "Volume per Ukuran", "Status", "Aksi"].map(h => (
                                            <th key={h} className={`px-4 py-4 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ${
                                                h === "Aksi" ? "text-right" : ["Status", "Level Konsentrasi"].includes(h) ? "text-center" : "text-left"
                                            }`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {intensities.data.map((intensity, i) => (
                                        <tr key={intensity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(intensity.id)}
                                                    onChange={(e) => handleSelect(intensity.id, e.target.checked)}
                                                    className="w-4 h-4 rounded border-2 border-slate-300 text-slate-700 focus:ring-2 focus:ring-primary-500"
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {i + 1 + (intensities.current_page - 1) * intensities.per_page}
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{intensity.name}</p>
                                                <code className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">{intensity.code}</code>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <IconFlask size={12} className="text-slate-700" />
                                                        <span className="text-xs text-slate-600 dark:text-slate-400">Bibit: <strong>{intensity.oil_ratio}</strong></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <IconBottle size={12} className="text-slate-700" />
                                                        <span className="text-xs text-slate-600 dark:text-slate-400">Alkohol: <strong>{intensity.alcohol_ratio}</strong></span>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-slate-500">{intensity.ratio_display}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <ConcentrationBadge level={intensity.concentration_level} />
                                            </td>
                                            <td className="px-4 py-4">
                                                {intensity.size_quantities && intensity.size_quantities.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {intensity.size_quantities.map((q, qi) => (
                                                            <div key={qi} className="flex items-center gap-2 text-xs">
                                                                <span className="font-bold text-slate-600 dark:text-slate-300 w-10">{q.volume_ml}ml</span>
                                                                <span className="text-slate-700 font-semibold">{q.oil_quantity}</span>
                                                                <span className="text-slate-300">+</span>
                                                                <span className="text-slate-700 font-semibold">{q.alcohol_quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                                                        <IconAlertTriangle size={12} /> Belum diisi
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex justify-center">
                                                    <StatusBadge isActive={intensity.is_active} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Link
                                                        href={route("intensities.edit", intensity.id)}
                                                        className="p-2 rounded-lg bg-warning-100 border border-slate-300 text-slate-700 hover:bg-warning-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 transition-all"
                                                    >
                                                        <IconPencilCog size={16} strokeWidth={2} />
                                                    </Link>
                                                    <button
                                                        onClick={() => confirmDelete(intensity)}
                                                        className="p-2 rounded-lg bg-danger-100 border border-slate-300 text-slate-700 hover:bg-danger-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 transition-all"
                                                    >
                                                        <IconTrash size={16} strokeWidth={2} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-5">
                        <IconDatabaseOff size={40} className="text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                        {filters?.search ? "Tidak Ada Hasil" : "Belum Ada Level Intensitas"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
                        {filters?.search
                            ? `Tidak ditemukan dengan kata kunci "${filters.search}"`
                            : "Mulai dengan menambahkan level intensitas pertama"
                        }
                    </p>
                    {!filters?.search && (
                        <Button
                            type="link"
                            icon={<IconCirclePlus size={20} strokeWidth={2} />}
                            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/40 font-semibold"
                            label="Tambah Level Sekarang"
                            href={route("intensities.create")}
                        />
                    )}
                </div>
            )}

            {intensities.last_page > 1 && (
                <div className="mt-6">
                    <Pagination links={intensities.links} />
                </div>
            )}

            <FilterModal show={showFilterModal} onClose={() => setShowFilterModal(false)} filters={currentFilters} onApply={handleApplyFilters} />
            <BulkDeleteModal show={showBulkDelete} onClose={() => setShowBulkDelete(false)} onConfirm={handleBulkDelete} count={selectedIds.length} />
            <DeleteModal show={deleteModal.show} item={deleteModal.item} loading={deleteModal.loading} onConfirm={handleDelete} onClose={closeDelete} />
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
