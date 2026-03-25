import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import Button from "@/Components/Dashboard/Button";
import {
    IconCirclePlus, IconDatabaseOff, IconPencilCog, IconTrash,
    IconCurrencyDollar, IconCircleCheck, IconCircleX, IconFilter,
    IconRefresh, IconX, IconCheck, IconAlertTriangle, IconDropletFilled, IconScale,
} from "@tabler/icons-react";
import Search from "@/Components/Dashboard/Search";
import Pagination from "@/Components/Dashboard/Pagination";
import toast from "react-hot-toast";

// =============================================================================
// Helpers
// =============================================================================

const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);

function StatusBadge({ isActive }) {
    return isActive ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-400 shadow-sm">
            <IconCircleCheck size={14} strokeWidth={2.5} /> Aktif
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shadow-sm">
            <IconCircleX size={14} strokeWidth={2.5} /> Tidak Aktif
        </span>
    );
}

// =============================================================================
// Delete Modal (state-driven)
// =============================================================================

function DeleteModal({ show, item, onConfirm, onClose, loading }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                        <IconAlertTriangle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            Hapus Harga Ini?
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tindakan ini tidak dapat dibatalkan.
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
// Filter Modal
// =============================================================================

function FilterModal({ show, onClose, filters, onApply, intensities, sizes }) {
    const [tempFilters, setTempFilters] = useState(filters);

    if (!show) return null;

    const selectCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all";

    const handleApply = () => { onApply(tempFilters); onClose(); };
    const handleReset = () => {
        const reset = { intensity_id: "", size_id: "", is_active: "", per_page: 20 };
        setTempFilters(reset); onApply(reset); onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                            <IconFilter size={20} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Filter Harga</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <IconX size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {[
                        {
                            label: "Intensitas", key: "intensity_id",
                            options: intensities.map(i => ({ value: i.id, label: i.name })),
                            placeholder: "Semua Intensitas",
                        },
                        {
                            label: "Ukuran", key: "size_id",
                            options: sizes.map(s => ({ value: s.id, label: `${s.name} (${s.volume_ml} ml)` })),
                            placeholder: "Semua Ukuran",
                        },
                    ].map(({ label, key, options, placeholder }) => (
                        <div key={key}>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
                            <select
                                value={tempFilters[key]}
                                onChange={e => setTempFilters({ ...tempFilters, [key]: e.target.value })}
                                className={selectCls}
                            >
                                <option value="">{placeholder}</option>
                                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                        <select
                            value={tempFilters.is_active}
                            onChange={e => setTempFilters({ ...tempFilters, is_active: e.target.value })}
                            className={selectCls}
                        >
                            <option value="">Semua Status</option>
                            <option value="1">✅ Aktif</option>
                            <option value="0">❌ Tidak Aktif</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Per halaman</label>
                        <select
                            value={tempFilters.per_page}
                            onChange={e => setTempFilters({ ...tempFilters, per_page: e.target.value })}
                            className={selectCls}
                        >
                            {["10", "20", "50", "100"].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
                    <button onClick={handleReset} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Reset</button>
                    <button onClick={handleApply} className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30">Terapkan</button>
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
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                    <IconAlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">Hapus {count} Harga?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                    Tindakan ini tidak dapat dibatalkan. Data harga yang dipilih akan dihapus secara permanen.
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

export default function Index({ intensitySizePrices, filters, intensities, sizes }) {
    const [selectedIds, setSelectedIds]                 = useState([]);
    const [showFilterModal, setShowFilterModal]         = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [deleteModal, setDeleteModal]                 = useState({ show: false, item: null, loading: false });
    const [currentFilters, setCurrentFilters]           = useState({
        intensity_id: filters?.intensity_id ?? "",
        size_id:      filters?.size_id      ?? "",
        is_active:    filters?.is_active    ?? "",
        per_page:     filters?.per_page     || 20,
    });

    // ── Selection ─────────────────────────────────────────────────────────────
    const handleSelect    = (id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(sid => sid !== id));
    const handleSelectAll = (checked)     => setSelectedIds(checked ? intensitySizePrices.data.map(item => item.id) : []);
    const allSelected     = intensitySizePrices.data.length > 0 && selectedIds.length === intensitySizePrices.data.length;

    // ── Single Delete ─────────────────────────────────────────────────────────
    const confirmDelete = (price) => setDeleteModal({ show: true, item: price, loading: false });
    const closeDelete   = ()      => setDeleteModal({ show: false, item: null, loading: false });

    const handleDelete = () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));
        router.delete(route("intensity-size-prices.destroy", deleteModal.item.id), {
            onSuccess: () => {
                closeDelete();
                toast.success("Harga berhasil dihapus! 🗑️");
            },
            onError: () => {
                closeDelete();
                toast.error("Gagal menghapus harga, coba lagi.");
            },
        });
    };

    // ── Bulk Delete ───────────────────────────────────────────────────────────
    const handleBulkDelete = () => {
        router.post(route("intensity-size-prices.bulk-delete"), { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setShowBulkDeleteModal(false);
                toast.success(`${selectedIds.length} harga berhasil dihapus!`);
            },
            onError: () => toast.error("Terjadi kesalahan saat menghapus harga"),
        });
    };

    // ── Filters ───────────────────────────────────────────────────────────────
    const handleApplyFilters = (newFilters) => {
        setCurrentFilters(newFilters);
        const clean = {};
        if (filters?.search)             clean.search       = filters.search;
        if (newFilters.intensity_id)     clean.intensity_id = newFilters.intensity_id;
        if (newFilters.size_id)          clean.size_id      = newFilters.size_id;
        if (newFilters.is_active !== "") clean.is_active    = newFilters.is_active;
        if (newFilters.per_page)         clean.per_page     = newFilters.per_page;
        router.get(route("intensity-size-prices.index"), clean, { preserveState: false, preserveScroll: false, replace: true });
    };

    const handleRefresh = () => { router.reload({ only: ["intensitySizePrices"] }); toast.success("Data berhasil diperbarui!"); };

    const hasActiveFilters = !!(currentFilters.intensity_id || currentFilters.size_id || currentFilters.is_active !== "");

    return (
        <>
            <Head title="Harga Intensitas & Ukuran" />

            {/* ── Header ── */}
            <div className="mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <IconCurrencyDollar size={24} className="text-white" strokeWidth={2} />
                            </div>
                            Harga Intensitas & Ukuran
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                                {intensitySizePrices.total ?? intensitySizePrices.data?.length ?? 0} Total Harga
                            </span>
                            {selectedIds.length > 0 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 text-xs font-semibold">
                                    {selectedIds.length} Dipilih
                                </span>
                            )}
                        </p>
                    </div>
                    <Button
                        type="link"
                        icon={<IconCirclePlus size={20} strokeWidth={2} />}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg shadow-primary-500/40 font-semibold"
                        label="Tambah Harga"
                        href={route("intensity-size-prices.create")}
                    />
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <div className="w-full sm:w-96">
                        <Search url={route("intensity-size-prices.index")} placeholder="Cari intensitas, ukuran, atau catatan..." />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Refresh"
                        >
                            <IconRefresh size={20} strokeWidth={2} />
                        </button>
                        <button
                            onClick={() => setShowFilterModal(true)}
                            className={`p-2.5 rounded-xl transition-colors relative ${
                                hasActiveFilters
                                    ? "bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                            title="Filter"
                        >
                            <IconFilter size={20} strokeWidth={2} />
                            {hasActiveFilters && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-600 rounded-full border-2 border-white dark:border-slate-900" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
                        <div className="flex items-center gap-3">
                            <IconCheck size={20} className="text-primary-600 dark:text-primary-400" />
                            <span className="text-sm font-semibold text-primary-900 dark:text-primary-100">{selectedIds.length} harga dipilih</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedIds([])} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all">Batal</button>
                            <button onClick={() => setShowBulkDeleteModal(true)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all flex items-center gap-2">
                                <IconTrash size={16} strokeWidth={2} /> Hapus {selectedIds.length} Item
                            </button>
                        </div>
                    </div>
                )}

                {/* Active Filter Tags */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter Aktif:</span>
                        {currentFilters.intensity_id && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                                <IconDropletFilled size={12} />
                                {intensities.find(i => i.id === currentFilters.intensity_id)?.name}
                                <button onClick={() => handleApplyFilters({ ...currentFilters, intensity_id: "" })} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                                    <IconX size={12} strokeWidth={3} />
                                </button>
                            </span>
                        )}
                        {currentFilters.size_id && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                                <IconScale size={12} />
                                {sizes.find(s => s.id === currentFilters.size_id)?.name}
                                <button onClick={() => handleApplyFilters({ ...currentFilters, size_id: "" })} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                                    <IconX size={12} strokeWidth={3} />
                                </button>
                            </span>
                        )}
                        {currentFilters.is_active !== "" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                                Status: {currentFilters.is_active === "1" ? "Aktif" : "Tidak Aktif"}
                                <button onClick={() => handleApplyFilters({ ...currentFilters, is_active: "" })} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                                    <IconX size={12} strokeWidth={3} />
                                </button>
                            </span>
                        )}
                        <button onClick={() => handleApplyFilters({ intensity_id: "", size_id: "", is_active: "", per_page: 20 })} className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">Reset Semua</button>
                    </div>
                )}
            </div>

            {/* ── Table ── */}
            {intensitySizePrices.data.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-4 py-4 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={e => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 rounded border-2 border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                        />
                                    </th>
                                    {[
                                        { label: "No",         cls: "text-left"   },
                                        { label: "Intensitas", cls: "text-left"   },
                                        { label: "Ukuran",     cls: "text-left"   },
                                        { label: "Harga",      cls: "text-right"  },
                                        { label: "Catatan",    cls: "text-left"   },
                                        { label: "Status",     cls: "text-center" },
                                        { label: "Dibuat",     cls: "text-left"   },
                                        { label: "Aksi",       cls: "text-right"  },
                                    ].map(h => (
                                        <th key={h.label} className={`px-4 py-4 ${h.cls} text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider`}>
                                            {h.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {intensitySizePrices.data.map((item, i) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={e => handleSelect(item.id, e.target.checked)}
                                                className="w-4 h-4 rounded border-2 border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {i + 1 + (intensitySizePrices.current_page - 1) * intensitySizePrices.per_page}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                                                    <IconDropletFilled size={15} className="text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.intensity?.name ?? "—"}</p>
                                                    {item.intensity?.code && (
                                                        <code className="text-xs text-slate-500 dark:text-slate-400 font-mono">{item.intensity.code}</code>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <IconScale size={14} className="text-slate-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.size?.name ?? "—"}</p>
                                                    {item.size?.volume_ml && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.size.volume_ml} ml</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                                {item.price_formatted ?? formatRupiah(item.price)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 max-w-[200px]">
                                            {item.notes
                                                ? <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{item.notes}</p>
                                                : <span className="text-xs text-slate-400 italic">—</span>
                                            }
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center">
                                                <StatusBadge isActive={item.is_active} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{item.created_at}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={route("intensity-size-prices.edit", item.id)}
                                                    className="p-2 rounded-lg bg-warning-100 border border-warning-200 text-warning-600 hover:bg-warning-200 dark:bg-warning-900/50 dark:border-warning-800 dark:text-warning-400 dark:hover:bg-warning-900/70 transition-all"
                                                    title="Edit"
                                                >
                                                    <IconPencilCog size={16} strokeWidth={2} />
                                                </Link>
                                                <button
                                                    onClick={() => confirmDelete(item)}
                                                    className="p-2 rounded-lg bg-danger-100 border border-danger-200 text-danger-600 hover:bg-danger-200 dark:bg-danger-900/50 dark:border-danger-800 dark:text-danger-400 dark:hover:bg-danger-900/70 transition-all"
                                                    title="Hapus"
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
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-5">
                        <IconDatabaseOff size={40} className="text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                        {filters?.search ? "Tidak Ada Hasil" : "Belum Ada Harga"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
                        {filters?.search
                            ? `Tidak ditemukan harga dengan kata kunci "${filters.search}"`
                            : "Mulai dengan menambahkan harga intensitas dan ukuran pertama"
                        }
                    </p>
                    {!filters?.search && (
                        <Button
                            type="link"
                            icon={<IconCirclePlus size={20} strokeWidth={2} />}
                            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg shadow-primary-500/40 font-semibold"
                            label="Tambah Harga Sekarang"
                            href={route("intensity-size-prices.create")}
                        />
                    )}
                </div>
            )}

            {intensitySizePrices.last_page > 1 && (
                <div className="mt-6">
                    <Pagination links={intensitySizePrices.links} />
                </div>
            )}

            <FilterModal
                show={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={currentFilters}
                onApply={handleApplyFilters}
                intensities={intensities}
                sizes={sizes}
            />
            <BulkDeleteModal
                show={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                count={selectedIds.length}
            />
            <DeleteModal
                show={deleteModal.show}
                item={deleteModal.item}
                loading={deleteModal.loading}
                onConfirm={handleDelete}
                onClose={closeDelete}
            />
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
