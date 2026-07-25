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
import PageHeader from "@/Components/Dashboard/PageHeader";
import toast from "react-hot-toast";

// =============================================================================
// Helpers
// =============================================================================

const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);

function StatusBadge({ isActive }) {
    return isActive ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#e6fcf5] text-[#09a374] dark:bg-emerald-950/30 dark:text-[#34d399] border border-[#c3fae8] dark:border-emerald-800/20">
            Aktif
        </span>
    ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#f1f3f5] text-[#868e96] dark:bg-slate-800/40 dark:text-[#a6a7ab] border border-[#e9ecef] dark:border-slate-700/30">
            Tidak Aktif
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
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                        <IconAlertTriangle size={20} className="text-slate-700" />
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
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-slate-800 flex items-center justify-center">
                            <IconFilter size={20} className="text-slate-700 dark:text-slate-300" />
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
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                    <IconAlertTriangle size={24} className="text-slate-700 dark:text-slate-300" />
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
            <PageHeader
                title="Harga Intensitas & Ukuran"
                description={
                    <span className="flex items-center gap-1.5 mt-1">
                        <span>{intensitySizePrices.total ?? intensitySizePrices.data?.length ?? 0} Total Harga</span>
                        {selectedIds.length > 0 && (
                            <>
                                <span className="text-slate-355 dark:text-slate-655">•</span>
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
                        <Search url={route("intensity-size-prices.index")} placeholder="Cari intensitas, ukuran, atau catatan..." />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleRefresh}
                            className="w-11 h-11 rounded-[9px] border border-[#e8e8e8] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-center transition-colors cursor-pointer"
                            title="Refresh Data"
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
                        <Button
                            type="add"
                            href={route("intensity-size-prices.create")}
                            label="Tambah Harga"
                        />
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <IconCheck size={20} className="text-slate-700 dark:text-slate-300" />
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
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                <IconDropletFilled size={12} />
                                {intensities.find(i => i.id === currentFilters.intensity_id)?.name}
                                <button onClick={() => handleApplyFilters({ ...currentFilters, intensity_id: "" })} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                                    <IconX size={12} strokeWidth={3} />
                                </button>
                            </span>
                        )}
                        {currentFilters.size_id && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                <IconScale size={12} />
                                {sizes.find(s => s.id === currentFilters.size_id)?.name}
                                <button onClick={() => handleApplyFilters({ ...currentFilters, size_id: "" })} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                                    <IconX size={12} strokeWidth={3} />
                                </button>
                            </span>
                        )}
                        {currentFilters.is_active !== "" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                Status: {currentFilters.is_active === "1" ? "Aktif" : "Tidak Aktif"}
                                <button onClick={() => handleApplyFilters({ ...currentFilters, is_active: "" })} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                                    <IconX size={12} strokeWidth={3} />
                                </button>
                            </span>
                        )}
                        <button onClick={() => handleApplyFilters({ intensity_id: "", size_id: "", is_active: "", per_page: 20 })} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline">Reset Semua</button>
                    </div>
                )}
            </div>
            {/* ── Table ── */}
            {intensitySizePrices.data.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                    <th className="px-4 py-4 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={e => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 rounded-[5px] border-2 border-slate-300 text-[#09a374] focus:ring-2 focus:ring-[#09a374] cursor-pointer focus:ring-offset-0"
                                        />
                                    </th>
                                    {[
                                        { label: "NO",         cls: "text-left w-12" },
                                        { label: "INTENSITAS", cls: "text-left"      },
                                        { label: "UKURAN",     cls: "text-left"      },
                                        { label: "HARGA",      cls: "text-left"      },
                                        { label: "CATATAN",    cls: "text-left"      },
                                        { label: "STATUS",     cls: "text-center"    },
                                        { label: "DIBUAT",     cls: "text-left"      },
                                        { label: "AKSI",       cls: "text-right"     },
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
                                                className="w-4 h-4 rounded-[5px] border-2 border-slate-300 text-[#09a374] focus:ring-2 focus:ring-[#09a374] cursor-pointer focus:ring-offset-0"
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {i + 1 + (intensitySizePrices.current_page - 1) * intensitySizePrices.per_page}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-[#0f172a] dark:text-white">
                                                    {item.intensity?.name ?? "—"}
                                                </p>
                                                {item.intensity?.code && (
                                                    <span className="text-[11px] font-medium text-slate-400 uppercase">
                                                        {item.intensity.code}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-semibold text-[#0f172a] dark:text-white">
                                                {item.size?.name ?? "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-semibold text-[#0f172a] dark:text-white whitespace-nowrap">
                                                {item.price_formatted ?? formatRupiah(item.price)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 max-w-[200px]">
                                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                {item.notes || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center">
                                                <StatusBadge isActive={item.is_active} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{item.created_at}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-end gap-3.5">
                                                <Link
                                                    href={route("intensity-size-prices.edit", item.id)}
                                                    className="text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-white transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <IconPencilCog size={18} strokeWidth={1.8} />
                                                </Link>
                                                <button
                                                    onClick={() => confirmDelete(item)}
                                                    className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                                                    title="Hapus"
                                                >
                                                    <IconTrash size={18} strokeWidth={1.8} />
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
