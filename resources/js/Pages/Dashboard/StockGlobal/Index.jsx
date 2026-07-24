import React, { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import Button from "@/Components/Dashboard/Button";
import {
    IconCirclePlus, IconDatabaseOff, IconPencilCog, IconTrash,
    IconPackages, IconAlertTriangle, IconTrendingUp, IconClock,
    IconBuildingWarehouse, IconBuildingStore, IconChartBar, IconCurrencyDollar,
    IconInfoCircle, IconBottle, IconBox, IconSearch, IconX,
} from "@tabler/icons-react";
import Table from "@/Components/Dashboard/Table";
import Pagination from "@/Components/Dashboard/Pagination";

export default function Index({
    stocks    = { data: [], links: [] },
    locations = [],
    scope     = "warehouse",
    itemType  = "ingredient",
    summary   = { total_items: 0, low_stock: 0, out_of_stock: 0, over_stock: 0, total_value: 0 },
    filters   = {},
}) {
    const [searchTerm,       setSearchTerm]       = useState(filters.search       || "");
    const [selectedLocation, setSelectedLocation] = useState(filters.location_id  || "");
    const [selectedStatus,   setSelectedStatus]   = useState(filters.stock_status || "");

    const filtersRef = useRef({ searchTerm, selectedLocation, selectedStatus });
    useEffect(() => {
        filtersRef.current = { searchTerm, selectedLocation, selectedStatus };
    }, [searchTerm, selectedLocation, selectedStatus]);

    const debounceTimer = useRef(null);

    const isWarehouse = scope === "warehouse";
    const editRoute    = isWarehouse ? "warehouse-stocks.edit"    : "store-stocks.edit";
    const destroyRoute = isWarehouse ? "warehouse-stocks.destroy" : "store-stocks.destroy";
    const createRoute  = isWarehouse ? "warehouse-stocks.create"  : "store-stocks.create";
    // controller edit/destroy expects item_type as 'ingredient' | 'packaging'
    const legacyItemType = itemType;

    // Truncate cents → IDR utuh (hindari pembulatan naik cents jadi +Rp1)
    const fmt = (n) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Math.trunc(n || 0));
    const fmtNum = (n) => parseInt(n ?? 0, 10).toLocaleString("id-ID");
    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString("id-ID", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        }) : "-";

    const getStockStatus = (s) => {
        const qty = parseInt(s.quantity ?? 0, 10);
        const min = parseInt(s.min_stock ?? 0, 10);
        const max = parseInt(s.max_stock ?? 0, 10);
        if (qty < 0)              return { label: "Negatif",     icon: <IconAlertTriangle size={12} /> };
        if (qty === 0)            return { label: "Habis",       icon: <IconPackages size={12} /> };
        if (min > 0 && qty < min) return { label: "Stok Rendah", icon: <IconAlertTriangle size={12} /> };
        if (max > 0 && qty > max) return { label: "Overstock",   icon: <IconTrendingUp size={12} /> };
        return                    { label: "Normal",       icon: null };
    };

    const navigateWithFilters = (overrides = {}) => {
        const { searchTerm, selectedLocation, selectedStatus } = filtersRef.current;
        const params = {
            scope,
            item_type:   itemType,
            search:      searchTerm      || undefined,
            location_id: selectedLocation || undefined,
            stock_status: selectedStatus || undefined,
            ...overrides,
        };
        const cleaned = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ""));
        router.get(route("stock-global.index"), cleaned, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => navigateWithFilters({ search: val || undefined }), 500);
    };
    const clearSearch = () => { setSearchTerm(""); clearTimeout(debounceTimer.current); navigateWithFilters({ search: undefined }); };

    // Switching scope/itemType resets location filter (locations differ per scope)
    const switchScope = (s) =>
        router.get(route("stock-global.index"), { scope: s, item_type: itemType }, { replace: true });
    const switchItemType = (t) =>
        router.get(route("stock-global.index"), { scope, item_type: t }, { replace: true });

    return (
        <>
            <Head title="Stok Global" />

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <IconPackages size={28} className="text-slate-700" />
                        Stok Global
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                        Monitoring stok gudang &amp; toko dalam satu tampilan. Gunakan filter untuk membedakan.
                    </p>
                </div>
                <Button
                    type="link"
                    icon={<IconCirclePlus size={18} />}
                    className="bg-primary-500 hover:bg-primary-600 text-white shadow-md transition-all"
                    label={`Daftarkan Stok ${isWarehouse ? "Gudang" : "Toko"}`}
                    href={route(createRoute)}
                />
            </div>

            {/* Scope toggle: Gudang / Toko */}
            <div className="mb-4 grid grid-cols-2 gap-4">
                {[
                    { key: "warehouse", label: "Gudang", sub: "Stok di gudang",  Icon: IconBuildingWarehouse },
                    { key: "store",     label: "Toko",   sub: "Stok di toko",    Icon: IconBuildingStore },
                ].map(({ key, label, sub, Icon }) => {
                    const active = scope === key;
                    return (
                        <button key={key} onClick={() => switchScope(key)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                                active ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                       : "border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-900"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg ${active ? "bg-primary-500" : "bg-slate-200"}`}>
                                    <Icon size={22} className={active ? "text-white" : "text-slate-600"} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-sm">{label}</div>
                                    <div className="text-xs text-slate-500">{sub}</div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Item type toggle: Bahan / Kemasan */}
            <div className="mb-6 grid grid-cols-2 gap-4">
                {[
                    { key: "ingredient", label: "Bahan Baku", sub: "Ingredient",       Icon: IconBottle, color: "emerald" },
                    { key: "packaging",  label: "Kemasan",    sub: "Kemasan & Botol",  Icon: IconBox,    color: "violet" },
                ].map(({ key, label, sub, Icon, color }) => {
                    const active = itemType === key;
                    return (
                        <button key={key} onClick={() => switchItemType(key)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                                active ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20`
                                       : "border-slate-200 hover:border-slate-300 bg-white dark:bg-slate-900"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg ${active ? `bg-${color}-500` : "bg-slate-200"}`}>
                                    <Icon size={22} className={active ? "text-white" : "text-slate-600"} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-white text-sm">{label}</div>
                                    <div className="text-xs text-slate-500">{sub}</div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[
                    { label: "Total Item",   value: summary.total_items,        Icon: IconChartBar },
                    { label: "Low Stock",    value: summary.low_stock,          Icon: IconAlertTriangle, accent: "border-l-danger-500" },
                    { label: "Out of Stock", value: summary.out_of_stock,       Icon: IconPackages },
                    { label: "Overstock",    value: summary.over_stock,         Icon: IconTrendingUp,    accent: "border-l-warning-500" },
                    { label: "Nilai Aset",   value: fmt(summary.total_value),   Icon: IconCurrencyDollar, accent: "border-l-success-500" },
                ].map(({ label, value, Icon, accent }) => (
                    <div key={label}
                        className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between gap-3 ${accent ? `border-l-4 ${accent}` : ""}`}>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">{label}</p>
                            <p className="text-xl font-black leading-none text-slate-800 dark:text-slate-200">{value}</p>
                        </div>
                        <div className="p-2.5 rounded-lg shrink-0 bg-slate-100 dark:bg-slate-800">
                            <Icon size={20} className="text-slate-700" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input type="text" value={searchTerm} onChange={handleSearchChange}
                        placeholder={`Cari ${itemType === "ingredient" ? "bahan" : "kemasan"} atau ${isWarehouse ? "gudang" : "toko"}...`}
                        className="w-full pl-9 pr-8 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary-500 focus:border-primary-500 text-sm" />
                    {searchTerm && (
                        <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <IconX size={15} />
                        </button>
                    )}
                </div>
                <select value={selectedLocation}
                    onChange={(e) => { setSelectedLocation(e.target.value); navigateWithFilters({ location_id: e.target.value || undefined }); }}
                    className="w-full md:w-52 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm">
                    <option value="">Semua {isWarehouse ? "Gudang" : "Toko"}</option>
                    {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                    ))}
                </select>
                <select value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); navigateWithFilters({ stock_status: e.target.value || undefined }); }}
                    className="w-full md:w-44 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-sm">
                    <option value="">Semua Status</option>
                    <option value="low">Stok Rendah</option>
                    <option value="out">Stok Habis / Negatif</option>
                    <option value="over">Overstock</option>
                </select>
            </div>

            {/* Table */}
            {stocks?.data?.length > 0 ? (
                <Table.Card title={`Stok ${isWarehouse ? "Gudang" : "Toko"} — ${itemType === "ingredient" ? "Bahan Baku" : "Kemasan"}`}>
                    <Table>
                        <Table.Thead>
                            <tr>
                                <Table.Th className="w-10 text-center">No</Table.Th>
                                <Table.Th>Item &amp; {isWarehouse ? "Gudang" : "Toko"}</Table.Th>
                                <Table.Th className="text-right">Kuantitas</Table.Th>
                                <Table.Th className="text-center">Min / Max</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Terakhir Masuk</Table.Th>
                                <Table.Th className="text-right">Nilai</Table.Th>
                                <Table.Th className="w-20 text-center">Aksi</Table.Th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {stocks.data.map((item, i) => {
                                const status = getStockStatus(item);
                                const qty    = parseInt(item.quantity ?? 0, 10);
                                const rowNum = i + 1 + (stocks.current_page - 1) * stocks.per_page;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
                                        <Table.Td className="text-center text-slate-400 text-sm font-medium">{rowNum}</Table.Td>
                                        <Table.Td>
                                            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.item_name}</div>
                                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                {isWarehouse ? <IconBuildingWarehouse size={11} /> : <IconBuildingStore size={11} />}
                                                <span>{item.location_name}</span>
                                                <span className="text-slate-300">·</span>
                                                <span className="font-mono uppercase">{item.item_code}</span>
                                            </div>
                                        </Table.Td>
                                        <Table.Td className="text-right">
                                            <div className="text-base font-black tabular-nums text-slate-800 dark:text-slate-200">
                                                {qty.toLocaleString("id-ID")}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.item_unit}</div>
                                        </Table.Td>
                                        <Table.Td className="text-center">
                                            <div className="text-[11px] font-semibold text-slate-500 space-y-0.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="text-slate-400">Min</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.min_stock != null ? fmtNum(item.min_stock) : "—"}</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-1">
                                                    <span className="text-slate-400">Max</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.max_stock != null ? fmtNum(item.max_stock) : "—"}</span>
                                                </div>
                                            </div>
                                        </Table.Td>
                                        <Table.Td>
                                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-black uppercase border bg-slate-100 text-slate-700 border-slate-300">
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        </Table.Td>
                                        <Table.Td>
                                            <div className="text-[11px] space-y-0.5">
                                                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                    <IconClock size={11} />
                                                    {fmtDate(item.last_in_at || item.updated_at)}
                                                </div>
                                                {item.last_in_qty ? (
                                                    <div className="text-slate-700 font-semibold">
                                                        +{parseInt(item.last_in_qty, 10).toLocaleString("id-ID")} {item.item_unit}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </Table.Td>
                                        <Table.Td className="text-right">
                                            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm tabular-nums">{fmt(item.total_value)}</div>
                                            <div className="text-[10px] text-slate-400 tabular-nums">@ {fmt(item.average_cost)}/unit</div>
                                        </Table.Td>
                                        <Table.Td>
                                            <div className="flex justify-center gap-1.5">
                                                <Button type="edit" icon={<IconPencilCog size={14} />}
                                                    className="p-1.5 bg-slate-100 text-slate-700 hover:bg-amber-100 border-slate-300 rounded-lg"
                                                    href={route(editRoute, { id: item.id, item_type: legacyItemType })} />
                                                <Button type="delete" icon={<IconTrash size={14} />}
                                                    className="p-1.5 bg-slate-100 text-slate-700 hover:bg-rose-100 border-slate-300 rounded-lg"
                                                    url={route(destroyRoute, { id: item.id, item_type: legacyItemType })} />
                                            </div>
                                        </Table.Td>
                                    </tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Table.Card>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                        <IconDatabaseOff size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Tidak ada data stok</h3>
                    <p className="text-slate-500 text-sm max-w-xs text-center mt-1">
                        {(searchTerm || selectedLocation || selectedStatus)
                            ? "Tidak ada hasil untuk filter yang dipilih."
                            : `Belum ada stok ${itemType === "ingredient" ? "bahan" : "kemasan"} di ${isWarehouse ? "gudang" : "toko"}.`}
                    </p>
                </div>
            )}

            <div className="mt-6">
                <Pagination links={stocks?.links || []} />
            </div>

            <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700/30 flex gap-3 items-start">
                <IconInfoCircle className="text-slate-700 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Informasi:</strong> Gunakan filter <strong>Gudang/Toko</strong> dan <strong>Bahan/Kemasan</strong> untuk membedakan data.
                    Penambahan qty hanya melalui <strong>Purchase Order</strong>, <strong>Transfer</strong>, atau <strong>Penyesuaian Stok</strong>.
                </p>
            </div>
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
