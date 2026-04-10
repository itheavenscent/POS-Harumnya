import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    IconSearch, IconPackage, IconTrendingUp,
    IconCurrencyDollar, IconEye, IconToggleLeft, IconToggleRight,
    IconRefresh, IconChevronDown, IconChevronRight, IconX,
    IconFlask, IconSparkles, IconUsers,
} from "@tabler/icons-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(n ?? 0);

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "slate" }) {
    const colors = {
        indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
        green: "bg-green-50 border-green-100 text-green-600",
        amber: "bg-amber-50 border-amber-100 text-amber-600",
        purple: "bg-purple-50 border-purple-100 text-purple-600",
        slate: "bg-slate-50 border-slate-100 text-slate-500",
    };
    return (
        <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${colors[color]}`}>
                {icon}
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-0.5">{value}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
            {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
        </div>
    );
}

// ─── Intensity Badge ──────────────────────────────────────────────────────────
function IntensityBadge({ code }) {
    const map = {
        EDT: "bg-blue-100 text-blue-700",
        EDP: "bg-purple-100 text-purple-700",
        EXT: "bg-rose-100 text-rose-700",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[code] ?? "bg-slate-100 text-slate-600"}`}>
            {code}
        </span>
    );
}

// ─── Margin Badge ─────────────────────────────────────────────────────────────
function MarginBadge({ pct }) {
    const n = parseFloat(pct) || 0;
    const cls = n >= 60 ? "bg-green-100 text-green-700"
        : n >= 40 ? "bg-amber-100 text-amber-700"
            : "bg-red-100 text-red-700";
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>
            {n.toFixed(1)}%
        </span>
    );
}

// ─── Gender Badge ─────────────────────────────────────────────────────────────
function GenderBadge({ gender }) {
    const map = {
        male: "bg-sky-100 text-sky-700",
        female: "bg-pink-100 text-pink-700",
        unisex: "bg-violet-100 text-violet-700",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[gender] ?? "bg-slate-100 text-slate-500"}`}>
            {gender}
        </span>
    );
}

// ─── Product Row ──────────────────────────────────────────────────────────────
function ProductRow({ product, onToggle }) {
    const margin = parseFloat(product.gross_margin_percentage) || 0;

    return (
        <tr className="hover:bg-slate-50/70 transition-colors border-b border-slate-100 last:border-0">
            {/* SKU + Name */}
            <td className="pl-14 pr-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-6 rounded-full flex-shrink-0 ${product.is_active ? "bg-green-400" : "bg-slate-200"}`} />
                    <div>
                        <div className="font-bold text-slate-800 text-sm font-mono">{product.sku}</div>
                        <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{product.name}</div>
                    </div>
                </div>
            </td>

            {/* Intensity + Size */}
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                    <IntensityBadge code={product.intensity?.code} />
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {product.size?.volume_ml}ml
                    </span>
                </div>
            </td>

            {/* Harga Jual */}
            <td className="px-4 py-3.5 text-right">
                <div className="font-bold text-slate-800 text-sm">{fmt(product.selling_price)}</div>
            </td>

            {/* HPP */}
            <td className="px-4 py-3.5 text-right">
                <div className="text-sm text-slate-500">{fmt(product.production_cost)}</div>
            </td>

            {/* Margin */}
            <td className="px-4 py-3.5 text-center">
                <div className="flex flex-col items-center gap-1">
                    <MarginBadge pct={margin} />
                    <div className="text-xs text-slate-400">{fmt(product.gross_profit)}</div>
                </div>
            </td>

            {/* Bahan */}
            <td className="px-4 py-3.5 text-center">
                <span className="text-sm font-semibold text-slate-600">{product.recipes?.length ?? 0}</span>
                <div className="text-xs text-slate-400">items</div>
            </td>

            {/* Actions */}
            <td className="px-4 py-3.5">
                <div className="flex items-center gap-1 justify-end">
                    <Link href={route('products.show', product.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Lihat Detail">
                        <IconEye size={16} />
                    </Link>
                    <button onClick={() => onToggle(product)}
                        className={`p-2 rounded-lg transition ${product.is_active
                            ? "text-green-600 hover:bg-green-50"
                            : "text-slate-400 hover:bg-slate-100"}`}
                        title={product.is_active ? "Nonaktifkan" : "Aktifkan"}>
                        {product.is_active
                            ? <IconToggleRight size={16} />
                            : <IconToggleLeft size={16} />}
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─── Variant Group ────────────────────────────────────────────────────────────
function VariantGroup({ group, onToggle, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    const { variant, products, total_products, active_products, avg_margin, min_price, max_price } = group;

    const marginColor = avg_margin >= 60 ? "text-green-600"
        : avg_margin >= 40 ? "text-amber-600"
            : "text-red-500";

    return (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-4">
            {/* Group Header */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition group"
            >
                <div className="flex items-center gap-4">
                    {/* Chevron */}
                    <div className={`w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}>
                        <IconChevronRight size={14} />
                    </div>

                    {/* Variant code pill */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-black text-xs">{variant?.code?.slice(0, 2)}</span>
                    </div>

                    {/* Variant name */}
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-base">{variant?.name}</span>
                            <GenderBadge gender={variant?.gender} />
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">{variant?.code}</div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center hidden sm:block">
                        <div className="text-sm font-bold text-slate-700">{total_products}</div>
                        <div className="text-xs text-slate-400">produk</div>
                    </div>
                    <div className="text-center hidden sm:block">
                        <div className="text-sm font-bold text-green-600">{active_products}</div>
                        <div className="text-xs text-slate-400">aktif</div>
                    </div>
                    <div className="text-center hidden md:block">
                        <div className={`text-sm font-bold ${marginColor}`}>{avg_margin}%</div>
                        <div className="text-xs text-slate-400">avg margin</div>
                    </div>
                    <div className="text-center hidden lg:block">
                        <div className="text-xs font-semibold text-slate-600">{fmt(min_price)}</div>
                        <div className="text-xs text-slate-400">– {fmt(max_price)}</div>
                        <div className="text-xs text-slate-400">range harga</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${open ? "bg-indigo-400" : "bg-slate-300"}`} />
                </div>
            </button>

            {/* Collapsible product table */}
            {open && (
                <div className="border-t border-slate-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="pl-14 pr-5 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        SKU / Nama
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Intensitas / Ukuran
                                    </th>
                                    <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Harga Jual
                                    </th>
                                    <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        HPP
                                    </th>
                                    <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Margin
                                    </th>
                                    <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Bahan
                                    </th>
                                    <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <ProductRow
                                        key={product.id}
                                        product={product}
                                        onToggle={onToggle}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Group footer */}
                    <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                            {total_products} produk · {active_products} aktif · {total_products - active_products} nonaktif
                        </span>
                        <Link href={route('recipes.index', { variant_id: variant?.id })}
                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">
                            <IconFlask size={13} /> Lihat Formula
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ filters, variants, intensities, sizes, onChange, onReset }) {
    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <div className="bg-white rounded-2xl border shadow-sm p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari SKU atau nama produk..."
                        value={filters.search || ""}
                        onChange={e => onChange({ ...filters, search: e.target.value })}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border-slate-200 focus:ring-2 focus:ring-indigo-300"
                    />
                </div>

                {/* Variant */}
                <select value={filters.variant_id || ""}
                    onChange={e => onChange({ ...filters, variant_id: e.target.value })}
                    className="text-sm rounded-xl border-slate-200 py-2 pr-8">
                    <option value="">Semua Varian</option>
                    {variants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>

                {/* Intensity */}
                <select value={filters.intensity_id || ""}
                    onChange={e => onChange({ ...filters, intensity_id: e.target.value })}
                    className="text-sm rounded-xl border-slate-200 py-2 pr-8">
                    <option value="">Semua Intensitas</option>
                    {intensities.map(i => <option key={i.id} value={i.id}>{i.name} ({i.code})</option>)}
                </select>

                {/* Size */}
                <select value={filters.size_id || ""}
                    onChange={e => onChange({ ...filters, size_id: e.target.value })}
                    className="text-sm rounded-xl border-slate-200 py-2 pr-8">
                    <option value="">Semua Ukuran</option>
                    {sizes.map(s => <option key={s.id} value={s.id}>{s.volume_ml}ml</option>)}
                </select>

                {/* Status */}
                <select value={filters.is_active ?? ""}
                    onChange={e => onChange({ ...filters, is_active: e.target.value })}
                    className="text-sm rounded-xl border-slate-200 py-2 pr-8">
                    <option value="">Semua Status</option>
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                </select>

                {/* Reset */}
                {hasFilters && (
                    <button onClick={onReset}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition font-semibold">
                        <IconX size={15} /> Reset
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Index({ grouped, stats, filters: initFilters, variants, intensities, sizes }) {
    const [filters, setFilters] = useState(initFilters ?? {});
    const [allOpen, setAllOpen] = useState(true);
    const [openKey, setOpenKey] = useState(null); // force re-render trick

    const applyFilters = (newFilters) => {
        setFilters(newFilters);
        router.get(route('products.index'), newFilters, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    };

    const resetFilters = () => applyFilters({});

    const handleToggle = (product) => {
        router.patch(route('products.toggle-active', product.id), {}, {
            preserveScroll: true,
        });
    };

    const groups = grouped ?? [];
    const totalShown = groups.reduce((s, g) => s + g.total_products, 0);

    return (
        <>
            <Head title="Produk & Harga" />

            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Produk & Harga</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Catalog produk dikelompokkan per varian
                    </p>
                </div>
                <Link href={route('recipes.index')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition shadow-sm">
                    <IconFlask size={16} /> Kelola Formula
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon={<IconPackage size={18} />} color="indigo"
                    label="Total Produk" value={stats.total_products}
                    sub={`${stats.active_products} aktif`} />
                <StatCard icon={<IconUsers size={18} />} color="purple"
                    label="Varian Aktif" value={stats.total_variants}
                    sub="kombinasi unik" />
                <StatCard icon={<IconTrendingUp size={18} />} color="green"
                    label="Avg Margin" value={`${stats.avg_margin}%`}
                    sub="gross margin" />
                <StatCard icon={<IconSparkles size={18} />} color="amber"
                    label="Produk Nonaktif" value={stats.total_products - stats.active_products}
                    sub="perlu diaktifkan" />
            </div>

            {/* Filter */}
            <FilterBar
                filters={filters}
                variants={variants}
                intensities={intensities}
                sizes={sizes}
                onChange={applyFilters}
                onReset={resetFilters}
            />

            {/* Group controls */}
            {groups.length > 0 && (
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-sm text-slate-500">
                        <span className="font-bold text-slate-700">{groups.length}</span> varian ·{" "}
                        <span className="font-bold text-slate-700">{totalShown}</span> produk ditampilkan
                    </span>
                </div>
            )}

            {/* Grouped Content */}
            {groups.length === 0 ? (
                <div className="bg-white rounded-2xl border shadow-sm text-center py-20">
                    <IconPackage size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-semibold mb-2">Belum ada produk</p>
                    <p className="text-slate-400 text-sm mb-6">
                        Generate produk terlebih dahulu dari menu Formula Variant
                    </p>
                    <Link href={route('recipes.index')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                        <IconFlask size={17} /> Ke Formula Variant
                    </Link>
                </div>
            ) : (
                groups.map((group, idx) => (
                    <VariantGroup
                        key={group.variant?.id ?? idx}
                        group={group}
                        onToggle={handleToggle}
                        defaultOpen={idx === 0}
                    />
                ))
            )}
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;