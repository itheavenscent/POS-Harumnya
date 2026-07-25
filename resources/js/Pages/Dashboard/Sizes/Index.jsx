import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import Button from "@/Components/Dashboard/Button";
import {
    IconCirclePlus, IconDatabaseOff, IconPencilCog, IconTrash,
    IconScale, IconCircleCheck, IconCircleX, IconFilter, IconRefresh,
    IconX, IconCheck, IconAlertTriangle,
} from "@tabler/icons-react";
import Search from "@/Components/Dashboard/Search";
import Pagination from "@/Components/Dashboard/Pagination";
import PageHeader from "@/Components/Dashboard/PageHeader";
import toast from "react-hot-toast";

// =============================================================================
// Atoms
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

function SizeCategoryLabel({ volumeMl }) {
    let label = "Small";
    if (volumeMl >= 100) {
        label = "Large";
    } else if (volumeMl >= 50) {
        label = "Medium";
    }
    return (
        <p className="font-medium text-[12px] text-[#0f172a] dark:text-white whitespace-nowrap">
            {label}
        </p>
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
                            Hapus Ukuran "{item?.name}"?
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

function FilterModal({ show, onClose, filters, onApply }) {
    const [tempFilters, setTempFilters] = useState(filters);

    if (!show) return null;

    const selectCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all";

    const handleApply = () => { onApply(tempFilters); onClose(); };
    const handleReset = () => {
        const reset = { is_active: "", per_page: 20 };
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
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Filter Ukuran</h3>
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">Hapus {count} Ukuran?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                    Tindakan ini tidak dapat dibatalkan. Data yang dipilih akan dihapus secara permanen.
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

export default function Index({ sizes, filters }) {
    const [selectedIds, setSelectedIds]               = useState([]);
    const [showFilterModal, setShowFilterModal]       = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [deleteModal, setDeleteModal]               = useState({ show: false, item: null, loading: false });
    const [currentFilters, setCurrentFilters]         = useState({
        is_active: filters?.is_active ?? "",
        per_page:  filters?.per_page  || 20,
    });

    // ── Selection ─────────────────────────────────────────────────────────────
    const handleSelect    = (id, checked) => setSelectedIds(prev => checked ? [...prev, id] : prev.filter(sid => sid !== id));
    const handleSelectAll = (checked)     => setSelectedIds(checked ? sizes.data.map(s => s.id) : []);
    const allSelected     = sizes.data.length > 0 && selectedIds.length === sizes.data.length;

    // ── Single Delete ─────────────────────────────────────────────────────────
    const confirmDelete = (size) => setDeleteModal({ show: true, item: size, loading: false });
    const closeDelete   = ()     => setDeleteModal({ show: false, item: null, loading: false });

    const handleDelete = () => {
        setDeleteModal(prev => ({ ...prev, loading: true }));
        router.delete(route("sizes.destroy", deleteModal.item.id), {
            onSuccess: () => {
                closeDelete();
                toast.success("Ukuran berhasil dihapus! 🗑️");
            },
            onError: () => {
                closeDelete();
                toast.error("Gagal menghapus ukuran, coba lagi.");
            },
        });
    };

    // ── Bulk Delete ───────────────────────────────────────────────────────────
    const handleBulkDelete = () => {
        router.post(route("sizes.bulk-delete"), { ids: selectedIds }, {
            onSuccess: () => {
                setSelectedIds([]);
                setShowBulkDeleteModal(false);
                toast.success(`${selectedIds.length} ukuran berhasil dihapus!`);
            },
            onError: () => toast.error("Terjadi kesalahan saat menghapus ukuran"),
        });
    };

    // ── Filters ───────────────────────────────────────────────────────────────
    const handleApplyFilters = (newFilters) => {
        setCurrentFilters(newFilters);
        const clean = {};
        if (filters?.search)             clean.search    = filters.search;
        if (newFilters.is_active !== "") clean.is_active = newFilters.is_active;
        if (newFilters.per_page)         clean.per_page  = newFilters.per_page;
        router.get(route("sizes.index"), clean, { preserveState: false, preserveScroll: false, replace: true });
    };

    const handleRefresh = () => {
        router.reload({ only: ["sizes"] });
        toast.success("Data berhasil diperbarui!");
    };

    const hasActiveFilters = currentFilters.is_active !== "";

    return (
        <>
            <Head title="Ukuran Produk" />

            {/* ── Header ── */}
            <PageHeader
                title="Ukuran Produk"
                description={
                    <span className="flex items-center gap-1.5 mt-1">
                        <span>{sizes.total ?? sizes.data?.length ?? 0} Total Ukuran</span>
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
                        <Search url={route("sizes.index")} placeholder="Cari nama atau volume (ml)..." />
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
                            href={route("sizes.create")}
                            label="Tambah Ukuran"
                        />
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <IconCheck size={20} className="text-slate-700 dark:text-slate-300" />
                            <span className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                                {selectedIds.length} ukuran dipilih
                            </span>
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
                        {currentFilters.is_active !== "" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                Status: {currentFilters.is_active === "1" ? "Aktif" : "Tidak Aktif"}
                                <button onClick={() => handleApplyFilters({ ...currentFilters, is_active: "" })} className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                                    <IconX size={12} strokeWidth={3} />
                                </button>
                            </span>
                        )}
                        <button onClick={() => handleApplyFilters({ is_active: "", per_page: 20 })} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:underline">Reset Semua</button>
                    </div>
                )}
            </div>

            {/* ── Table ── */}
            {sizes.data.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-4 py-4 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 rounded-[5px] border-2 border-slate-300 text-slate-700 focus:ring-2 focus:ring-primary-500"
                                        />
                                    </th>
                                    {[
                                        { label: "No",       cls: "text-left"   },
                                        { label: "Nama",     cls: "text-left"   },
                                        { label: "Volume",   cls: "text-left"   },
                                        { label: "Kategori", cls: "text-center" },
                                        { label: "Urutan",   cls: "text-center" },
                                        { label: "Status",   cls: "text-center" },
                                        { label: "Dibuat",   cls: "text-left"   },
                                        { label: "Aksi",     cls: "text-right"  },
                                    ].map(h => (
                                        <th key={h.label} className={`px-4 py-4 ${h.cls} text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider`}>
                                            {h.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {sizes.data.map((size, i) => (
                                    <tr key={size.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(size.id)}
                                                onChange={(e) => handleSelect(size.id, e.target.checked)}
                                                className="w-4 h-4 rounded-[5px] border-2 border-slate-300 text-slate-700 focus:ring-2 focus:ring-primary-500"
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            {i + 1 + (sizes.current_page - 1) * sizes.per_page}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0">
                                                    <IconScale size={18} strokeWidth={1.5} />
                                                </div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{size.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {size.volume_ml} ml
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <SizeCategoryLabel volumeMl={size.volume_ml} />
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="font-semibold text-[14px] text-[#0f172a] dark:text-white">
                                                #{size.sort_order}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center">
                                                <StatusBadge isActive={size.is_active} />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{size.created_at}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={route("sizes.edit", size.id)}
                                                    className="p-2 rounded-lg bg-warning-100 border border-slate-300 text-slate-700 hover:bg-warning-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-warning-900/70 transition-all"
                                                    title="Edit"
                                                >
                                                    <IconPencilCog size={16} strokeWidth={2} />
                                                </Link>
                                                <button
                                                    onClick={() => confirmDelete(size)}
                                                    className="p-2 rounded-lg bg-danger-100 border border-slate-300 text-slate-700 hover:bg-danger-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-danger-900/70 transition-all"
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
                        {filters?.search ? "Tidak Ada Hasil" : "Belum Ada Ukuran"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
                        {filters?.search
                            ? `Tidak ditemukan ukuran dengan kata kunci "${filters.search}"`
                            : "Mulai dengan menambahkan ukuran produk pertama"
                        }
                    </p>
                    {!filters?.search && (
                        <Button
                            type="link"
                            icon={<IconCirclePlus size={20} strokeWidth={2} />}
                            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-lg shadow-primary-500/40 font-semibold"
                            label="Tambah Ukuran Sekarang"
                            href={route("sizes.create")}
                        />
                    )}
                </div>
            )}

            {sizes.last_page > 1 && (
                <div className="mt-6">
                    <Pagination links={sizes.links} />
                </div>
            )}

            <FilterModal
                show={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                filters={currentFilters}
                onApply={handleApplyFilters}
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
