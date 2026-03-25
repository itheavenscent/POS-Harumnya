import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    IconCirclePlus, IconDatabaseOff, IconPencil, IconTrash, IconLayoutGrid,
    IconList, IconTruckDelivery, IconCircleCheck, IconCircleX, IconFilter,
    IconRefresh, IconUser, IconCreditCard, IconX, IconAlertTriangle,
    IconMailFilled, IconPhoneFilled, IconFilterOff,
} from "@tabler/icons-react";
import Search from "@/Components/Dashboard/Search";
import Pagination from "@/Components/Dashboard/Pagination";
import Button from "@/Components/Dashboard/Button";
import toast from "react-hot-toast";

// =============================================================================
// DeleteModal
// =============================================================================

function DeleteModal({ show, item, onConfirm, onClose, loading }) {
    if (!show) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
        >
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                        <IconAlertTriangle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <h3 id="delete-modal-title" className="font-bold text-slate-900 dark:text-white text-base">
                            Hapus Supplier?
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            <strong>{item?.name}</strong> akan dihapus. Tindakan ini dapat dipulihkan nanti.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800
                            text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700
                            text-white transition-colors disabled:opacity-60 flex items-center gap-2"
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
// SupplierCard (Grid mode)
// =============================================================================

function SupplierCard({ supplier, onDelete }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white
                    flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                    <IconTruckDelivery size={24} />
                </div>
                <StatusBadge isActive={supplier.is_active} />
            </div>

            <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate mb-1 text-base">
                {supplier.name}
            </h3>
            <code className="text-[10px] bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded text-teal-600 dark:text-teal-400 font-mono uppercase">
                {supplier.code}
            </code>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <IconUser size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{supplier.contact_person || "Tidak ada kontak"}</span>
                </div>
                {supplier.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <IconMailFilled size={14} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <IconCreditCard size={14} className="text-slate-400 flex-shrink-0" />
                    <span>{supplier.payment_term_label}</span>
                </div>
                {supplier.payment_term !== "cash" && supplier.credit_limit > 0 && (
                    <div className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded">
                        Limit: {supplier.formatted_credit_limit}
                    </div>
                )}
            </div>

            <div className="mt-4 flex gap-2">
                <Link
                    href={route("suppliers.edit", supplier.id)}
                    className="flex-1 text-center py-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/30
                        text-teal-700 dark:text-teal-400 text-xs font-bold
                        hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                >
                    Edit Detail
                </Link>
                <button
                    onClick={() => onDelete(supplier)}
                    className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500
                        dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title={`Hapus ${supplier.name}`}
                    aria-label={`Hapus ${supplier.name}`}
                >
                    <IconTrash size={15} />
                </button>
            </div>
        </div>
    );
}

// =============================================================================
// StatusBadge
// =============================================================================

function StatusBadge({ isActive }) {
    return isActive ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-teal-600 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-full">
            <IconCircleCheck size={14} /> Aktif
        </span>
    ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
            <IconCircleX size={14} /> Nonaktif
        </span>
    );
}

// =============================================================================
// FilterPanel
// =============================================================================

function FilterPanel({ filters, paymentTerms, onFilterChange, onClearFilters }) {
    const [open, setOpen] = useState(false);

    const hasFilters = filters.is_active !== undefined && filters.is_active !== ""
        || !!filters.payment_term;

    const activeCount = [
        filters.is_active !== undefined && filters.is_active !== "",
        !!filters.payment_term,
    ].filter(Boolean).length;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    open || hasFilters
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-500/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                aria-expanded={open}
                aria-haspopup="true"
            >
                <IconFilter size={18} />
                Filter
                {activeCount > 0 && (
                    <span className="bg-white/20 px-1.5 rounded-full text-xs">{activeCount}</span>
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white">Filter Data</h3>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                aria-label="Tutup filter"
                            >
                                <IconX size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Status */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Status Supplier
                                </label>
                                <select
                                    value={filters.is_active ?? ""}
                                    onChange={(e) => onFilterChange("is_active", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </div>

                            {/* Payment term — dari prop server */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Termin Pembayaran
                                </label>
                                <select
                                    value={filters.payment_term || ""}
                                    onChange={(e) => onFilterChange("payment_term", e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="">Semua Termin</option>
                                    {paymentTerms.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2 border-t dark:border-slate-800">
                                <button
                                    onClick={() => { onClearFilters(); setOpen(false); }}
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                                >
                                    <IconFilterOff size={15} /> Reset
                                </button>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
                                >
                                    Terapkan
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// =============================================================================
// Index Page
// =============================================================================

export default function Index({ suppliers, filters, paymentTerms = [] }) {
    const [viewMode,     setViewMode]     = useState("list");
    const [deleteModal,  setDeleteModal]  = useState({ show: false, item: null, loading: false });

    // ── Delete ────────────────────────────────────────────────────────────

    const confirmDelete = (supplier) => setDeleteModal({ show: true, item: supplier, loading: false });
    const closeDelete   = ()         => setDeleteModal({ show: false, item: null,     loading: false });

    const handleDelete = () => {
        setDeleteModal((prev) => ({ ...prev, loading: true }));
        router.delete(route("suppliers.destroy", deleteModal.item.id), {
            onSuccess: () => { closeDelete(); toast.success("Supplier berhasil dihapus! 🗑️"); },
            onError:   () => { closeDelete(); toast.error("Gagal menghapus supplier."); },
        });
    };

    // ── Filter ────────────────────────────────────────────────────────────

    const handleFilterChange = (key, value) => {
        router.get(
            route("suppliers.index"),
            { ...filters, [key]: value || undefined },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleClearFilters = () => {
        router.get(
            route("suppliers.index"),
            { search: filters.search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleRefresh = () => router.reload({ only: ["suppliers"] });

    // ── Computed ──────────────────────────────────────────────────────────

    const activeFiltersCount = [
        filters.is_active !== undefined && filters.is_active !== "",
        !!filters.payment_term,
    ].filter(Boolean).length;

    const hasData      = suppliers.data.length > 0;
    const hasSearchOrFilter = filters.search || activeFiltersCount > 0;

    return (
        <>
            <Head title="Data Supplier" />

            {/* ── Header ── */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-teal-600 rounded-lg text-white shadow-lg shadow-teal-500/30">
                            <IconTruckDelivery size={20} />
                        </div>
                        Data Supplier
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1 ml-11">
                        {suppliers.total} Supplier Terdaftar
                        {activeFiltersCount > 0 && (
                            <span className="ml-2 text-teal-600">• {activeFiltersCount} filter aktif</span>
                        )}
                    </p>
                </div>
                <Button
                    type="link"
                    href={route("suppliers.create")}
                    icon={<IconCirclePlus size={18} />}
                    className="bg-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/30 hover:bg-teal-700"
                    label="Tambah Supplier"
                />
            </div>

            {/* ── Toolbar ── */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="w-full sm:w-80">
                    <Search url={route("suppliers.index")} placeholder="Cari nama, kode, email, telepon..." />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleRefresh}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Refresh data"
                        aria-label="Refresh data"
                    >
                        <IconRefresh size={18} />
                    </button>

                    <FilterPanel
                        filters={filters}
                        paymentTerms={paymentTerms}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                    />

                    {/* View toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" role="group" aria-label="Tampilan">
                        {[
                            { mode: "grid", icon: <IconLayoutGrid size={18} />, label: "Grid view" },
                            { mode: "list", icon: <IconList size={18} />,       label: "List view" },
                        ].map(({ mode, icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`p-1.5 rounded-lg transition-all ${
                                    viewMode === mode
                                        ? "bg-white dark:bg-slate-900 shadow text-teal-600"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                                title={label}
                                aria-label={label}
                                aria-pressed={viewMode === mode}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Active Filter Chips ── */}
            {activeFiltersCount > 0 && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter aktif:</span>

                    {filters.is_active !== undefined && filters.is_active !== "" && (
                        <FilterChip
                            label={`Status: ${filters.is_active === "1" ? "Aktif" : "Nonaktif"}`}
                            onRemove={() => handleFilterChange("is_active", "")}
                        />
                    )}
                    {filters.payment_term && (
                        <FilterChip
                            label={`Termin: ${paymentTerms.find(t => t.value === filters.payment_term)?.label ?? filters.payment_term}`}
                            onRemove={() => handleFilterChange("payment_term", "")}
                        />
                    )}

                    <button
                        onClick={handleClearFilters}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                    >
                        Reset semua
                    </button>
                </div>
            )}

            {/* ── Content ── */}
            {hasData ? (
                viewMode === "list" ? (
                    <SupplierTable
                        data={suppliers.data}
                        onDelete={confirmDelete}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {suppliers.data.map((item) => (
                            <SupplierCard key={item.id} supplier={item} onDelete={confirmDelete} />
                        ))}
                    </div>
                )
            ) : (
                <EmptyState
                    hasSearchOrFilter={hasSearchOrFilter}
                    onClearFilters={handleClearFilters}
                />
            )}

            {hasData && (
                <div className="mt-8">
                    <Pagination links={suppliers.links} />
                </div>
            )}

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

// ─── Sub-komponen ─────────────────────────────────────────────────────────────

function FilterChip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg text-xs font-medium">
            {label}
            <button
                onClick={onRemove}
                className="hover:bg-teal-100 dark:hover:bg-teal-900/50 rounded p-0.5 transition-colors"
                aria-label={`Hapus filter ${label}`}
            >
                <IconX size={12} />
            </button>
        </span>
    );
}

function SupplierTable({ data, onDelete }) {
    const headers = [
        { label: "Supplier / Kode", cls: "" },
        { label: "Kontak",          cls: "" },
        { label: "Termin / Limit",  cls: "" },
        { label: "Status",          cls: "text-center" },
        { label: "Aksi",            cls: "text-right" },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            {headers.map((h) => (
                                <th
                                    key={h.label}
                                    className={`px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider ${h.cls}`}
                                >
                                    {h.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold dark:text-slate-200 block">{item.name}</span>
                                    <code className="text-[10px] font-mono text-teal-600 dark:text-teal-400 uppercase mt-0.5">
                                        {item.code}
                                    </code>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm space-y-1">
                                        <p className="font-semibold dark:text-slate-300 flex items-center gap-1.5">
                                            <IconUser size={14} className="text-slate-400" />
                                            {item.contact_person || "—"}
                                        </p>
                                        {item.email && (
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <IconMailFilled size={12} className="text-slate-400" />
                                                {item.email}
                                            </p>
                                        )}
                                        {item.phone && (
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                                <IconPhoneFilled size={12} className="text-slate-400" />
                                                {item.phone}
                                            </p>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-semibold dark:text-slate-300">{item.payment_term_label}</p>
                                    {item.credit_limit > 0 && (
                                        <p className="text-xs text-slate-500 mt-1">Limit: {item.formatted_credit_limit}</p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge isActive={item.is_active} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={route("suppliers.edit", item.id)}
                                            className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600
                                                dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors"
                                            title={`Edit ${item.name}`}
                                        >
                                            <IconPencil size={16} />
                                        </Link>
                                        <button
                                            onClick={() => onDelete(item)}
                                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500
                                                dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                            title={`Hapus ${item.name}`}
                                        >
                                            <IconTrash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EmptyState({ hasSearchOrFilter, onClearFilters }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl">
            <IconDatabaseOff size={64} className="text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-bold dark:text-white mb-1">
                {hasSearchOrFilter ? "Tidak ada hasil" : "Data Supplier Kosong"}
            </h3>
            <p className="text-sm text-slate-500 mb-4 text-center max-w-xs">
                {hasSearchOrFilter
                    ? "Coba ubah kata kunci atau hapus filter yang aktif."
                    : "Mulai tambahkan supplier pertama Anda."}
            </p>
            {hasSearchOrFilter ? (
                <button
                    onClick={onClearFilters}
                    className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300
                        rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    Reset Filter
                </button>
            ) : (
                <Button
                    type="link"
                    href={route("suppliers.create")}
                    label="Tambah Supplier Baru"
                    icon={<IconCirclePlus size={18} />}
                    className="bg-teal-600 text-white px-6 py-2.5 shadow-lg shadow-teal-500/30 hover:bg-teal-700"
                />
            )}
        </div>
    );
}
