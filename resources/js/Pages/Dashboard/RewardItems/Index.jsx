import React, { useState } from "react";
import { Head, useForm, router } from "@inertiajs/react";
import {
    IconGift,
    IconPlus,
    IconTrash,
    IconPencil,
    IconToggleLeft,
    IconToggleRight,
    IconSearch,
    IconPackage,
    IconCurrencyDollar,
    IconTag,
} from "@tabler/icons-react";
import DashboardLayout from "@/Layouts/DashboardLayout";

const fmt = (n) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n ?? 0);

const CATEGORY_LABELS = {
    merchandise: "Merchandise",
    voucher: "Voucher",
    food: "Makanan & Minuman",
    cash: "Cashback",
    service: "Layanan",
    other: "Lainnya",
};

const CATEGORY_COLORS = {
    merchandise: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    voucher: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    food: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    cash: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    service: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

// ─── Modal Form ────────────────────────────────────────────────────────────────

function ItemModal({ item = null, categories, onClose }) {
    const isEdit = !!item;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: item?.code ?? "",
        name: item?.name ?? "",
        description: item?.description ?? "",
        category: item?.category ?? "merchandise",
        cost_price: item?.cost_price ?? 0,
        selling_value: item?.selling_value ?? "",
        stock_qty: item?.stock_qty ?? "",
        is_active: item?.is_active ?? true,
        sort_order: item?.sort_order ?? 0,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route("reward-items.update", item.id), {
                onSuccess: () => onClose(),
            });
        } else {
            post(route("reward-items.store"), {
                onSuccess: () => { reset(); onClose(); },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <IconGift size={18} className="text-purple-500" />
                        {isEdit ? "Edit Reward Item" : "Tambah Reward Item"}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
                </div>

                <form onSubmit={submit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Code */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kode *</label>
                            <input
                                value={data.code}
                                onChange={e => setData("code", e.target.value)}
                                placeholder="MERCH-001"
                                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 focus:border-transparent"
                            />
                            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                        </div>
                        {/* Category */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kategori *</label>
                            <select
                                value={data.category}
                                onChange={e => setData("category", e.target.value)}
                                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                            >
                                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Hadiah *</label>
                        <input
                            value={data.name}
                            onChange={e => setData("name", e.target.value)}
                            placeholder="Kaos Harumnya"
                            className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 focus:border-transparent"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Deskripsi</label>
                        <textarea
                            value={data.description}
                            onChange={e => setData("description", e.target.value)}
                            rows={2}
                            placeholder="Keterangan tambahan..."
                            className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Cost Price */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                HPP / Harga Pokok *
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.cost_price}
                                onChange={e => setData("cost_price", e.target.value)}
                                onWheel={e => e.target.blur()}
                                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">Biaya yang ditanggung toko</p>
                            {errors.cost_price && <p className="text-red-500 text-xs mt-1">{errors.cost_price}</p>}
                        </div>
                        {/* Selling Value */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Nilai Ekuivalen
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.selling_value}
                                onChange={e => setData("selling_value", e.target.value)}
                                onWheel={e => e.target.blur()}
                                placeholder="—"
                                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">Untuk voucher / cashback</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Stock */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Stok</label>
                            <input
                                type="number"
                                min="0"
                                value={data.stock_qty}
                                onChange={e => setData("stock_qty", e.target.value)}
                                onWheel={e => e.target.blur()}
                                placeholder="Kosong = unlimited"
                                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                            />
                        </div>
                        {/* Sort Order */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Urutan</label>
                            <input
                                type="number"
                                min="0"
                                value={data.sort_order}
                                onChange={e => setData("sort_order", Number(e.target.value))}
                                onWheel={e => e.target.blur()}
                                className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
                            />
                        </div>
                    </div>

                    {/* Is Active */}
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={e => setData("is_active", e.target.checked)}
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-400"
                        />
                        Aktif (dapat dipilih sebagai reward)
                    </label>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 transition-all shadow-md"
                        >
                            {processing ? "Menyimpan..." : isEdit ? "Perbarui" : "Simpan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RewardItemsIndex({ items, filters, categories }) {
    const [modal, setModal] = useState(null); // null | 'create' | item object
    const [search, setSearch] = useState(filters.search ?? "");

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route("reward-items.index"), { search }, { preserveState: true });
    };

    const handleToggle = (item) => {
        router.patch(route("reward-items.toggle", item.id), {}, { preserveScroll: true });
    };

    const handleDelete = (item) => {
        if (!confirm(`Hapus "${item.name}"? Reward ini tidak akan bisa dipilih lagi di promo.`)) return;
        router.delete(route("reward-items.destroy", item.id), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Master Reward Items" />

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <IconGift size={26} className="text-purple-500" />
                        Master Reward Items
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Kelola hadiah/reward non-parfum (merchandise, voucher, dll) dengan HPP untuk pelacakan pengeluaran.
                    </p>
                </div>
                <button
                    onClick={() => setModal("create")}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/30 transition-all"
                >
                    <IconPlus size={16} />
                    Tambah Reward
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-3">
                <div className="relative flex-1 max-w-sm">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari nama atau kode..."
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-700"
                    />
                </div>
                <button type="submit" className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-sm rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors">
                    Cari
                </button>
            </form>

            {/* Stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Item", value: items.total, icon: <IconGift size={18} className="text-purple-500" /> },
                    { label: "Aktif", value: items.data.filter(i => i.is_active).length, icon: <IconToggleRight size={18} className="text-emerald-500" /> },
                    { label: "HPP Terendah", value: items.data.length > 0 ? fmt(Math.min(...items.data.map(i => i.cost_price || 0))) : fmt(0), icon: <IconCurrencyDollar size={18} className="text-blue-500" /> },
                    { label: "HPP Tertinggi", value: items.data.length > 0 ? fmt(Math.max(...items.data.map(i => i.cost_price || 0))) : fmt(0), icon: <IconTag size={18} className="text-amber-500" /> },
                ].map((s, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">{s.icon}</div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kode / Nama</th>
                            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Kategori</th>
                            <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">HPP</th>
                            <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Nilai</th>
                            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Stok</th>
                            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 dark:text-slate-600">
                                    <IconPackage size={40} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Belum ada reward item. Tambahkan hadiah pertama.</p>
                                </td>
                            </tr>
                        ) : items.data.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-5 py-3.5">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</p>
                                    <p className="text-xs text-slate-400 font-mono">{item.code}</p>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other}`}>
                                        {CATEGORY_LABELS[item.category] ?? item.category}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 text-right font-semibold text-red-600 dark:text-red-400">
                                    {fmt(item.cost_price)}
                                </td>
                                <td className="px-5 py-3.5 text-right text-slate-500 dark:text-slate-400">
                                    {item.selling_value ? fmt(item.selling_value) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                    {item.stock_qty == null ? (
                                        <span className="text-xs text-slate-400 italic">∞</span>
                                    ) : (
                                        <span className={`text-xs font-semibold ${item.stock_qty === 0 ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
                                            {item.stock_qty}
                                        </span>
                                    )}
                                </td>
                                <td className="px-5 py-3.5 text-center">
                                    <button onClick={() => handleToggle(item)} className="transition-colors">
                                        {item.is_active
                                            ? <IconToggleRight size={22} className="text-emerald-500 hover:text-emerald-600" />
                                            : <IconToggleLeft size={22} className="text-slate-300 dark:text-slate-600 hover:text-slate-400" />}
                                    </button>
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => setModal(item)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                            title="Edit"
                                        >
                                            <IconPencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                            title="Hapus"
                                        >
                                            <IconTrash size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {items.last_page > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500">
                            {items.from}–{items.to} dari {items.total} item
                        </p>
                        <div className="flex gap-1">
                            {items.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                        link.active
                                            ? "bg-purple-600 text-white"
                                            : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modal !== null && (
                <ItemModal
                    item={modal === "create" ? null : modal}
                    categories={categories}
                    onClose={() => setModal(null)}
                />
            )}
        </>
    );
}

RewardItemsIndex.layout = (page) => <DashboardLayout children={page} />;
