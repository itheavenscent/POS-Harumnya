import React, { useState, useRef, useEffect, useMemo } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import {
    IconArrowLeft, IconDeviceFloppy, IconAdjustments, IconPlus, IconTrash,
    IconInfoCircle, IconTrendingUp, IconTrendingDown,
    IconSearch, IconX, IconChevronDown, IconLoader2,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

const fmt    = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(parseInt(n) || 0);
const fmtQty = (n) => parseInt(n || 0).toLocaleString("id-ID");

// ─── SearchSelect ─────────────────────────────────────────────────────────────
function SearchSelect({ options, value, onChange, placeholder = "Cari...", renderOption, disabled = false }) {
    const [open,  setOpen]  = useState(false);
    const [query, setQuery] = useState("");
    const ref               = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const filtered = useMemo(() =>
        query.trim() === "" ? options
            : options.filter((o) => renderOption(o).toLowerCase().includes(query.toLowerCase())),
        [options, query]
    );
    const selected = options.find((o) => String(o.id) === String(value));
    const handleSelect = (id) => { onChange(id); setOpen(false); setQuery(""); };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => { setOpen((v) => !v); setQuery(""); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors
                    ${disabled
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                        : open
                            ? "border-orange-400 ring-2 ring-orange-100 bg-white dark:bg-slate-950"
                            : "border-slate-200 bg-white dark:bg-slate-950 hover:border-slate-300"
                    }`}
            >
                <span className={`truncate ${selected ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-400"}`}>
                    {selected ? renderOption(selected) : placeholder}
                </span>
                {value && !disabled
                    ? <IconX size={14} className="text-slate-400 shrink-0 hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); onChange(""); }} />
                    : <IconChevronDown size={14} className="text-slate-400 shrink-0" />
                }
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <IconSearch size={13} className="text-slate-400 shrink-0" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ketik untuk mencari..."
                                className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-300 min-w-0"
                            />
                            {query && (
                                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setQuery("")}>
                                    <IconX size={12} className="text-slate-400" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0
                            ? <p className="px-4 py-3 text-xs text-slate-400 text-center">Tidak ditemukan</p>
                            : filtered.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelect(o.id)}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors
                                        ${String(o.id) === String(value)
                                            ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 font-bold"
                                            : "text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                        }`}
                                >
                                    {renderOption(o)}
                                </button>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────
function ItemRow({ item, idx, allItems, usedItemIds, items, setData, errors, onFetchQty, removeItem, updateItem, loadingIdx }) {
    const diff    = (parseInt(item.physical_quantity) || 0) - (parseInt(item.system_quantity) || 0);
    const valDiff = Math.round(Math.abs(diff) * (parseFloat(item.unit_cost) || 0));
    const ing     = allItems.find((i) => i._type === item.item_type && i.id === item.item_id);
    const itemOptions = allItems.filter(
        (i) => i._type === item.item_type && (!usedItemIds.includes(i.id) || i.id === item.item_id)
    );
    const isLoading = loadingIdx === idx;

    return (
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-3 border border-slate-100 dark:border-slate-700/50">

            {/* Row 1: Tipe + Item + Remove */}
            <div className="flex items-start gap-2">
                {/* Tipe */}
                <div className="w-28 sm:w-32 shrink-0">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Tipe</label>
                    <select
                        value={item.item_type}
                        onChange={(e) => setData("items", items.map((it, i) =>
                            i === idx ? { ...it, item_type: e.target.value, item_id: "", system_quantity: 0, physical_quantity: "", unit_cost: 0.0 } : it
                        ))}
                        className="w-full rounded-xl border-slate-200 dark:bg-slate-900 text-xs py-2"
                    >
                        <option value="ingredient">Ingredient</option>
                        <option value="packaging_material">Packaging</option>
                    </select>
                </div>

                {/* Item */}
                <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Item</label>
                    <SearchSelect
                        options={itemOptions}
                        value={item.item_id}
                        onChange={(v) => {
                            // Reset item dulu — gunakan `items` prop (nilai terkini dari dataRef)
                            setData("items", items.map((it, i) =>
                                i === idx ? { ...it, item_id: v, system_quantity: 0, physical_quantity: "", unit_cost: 0.0 } : it
                            ));
                            // Kirim item_type & item_id eksplisit — TIDAK baca dari state
                            if (v) onFetchQty(idx, item.item_type, v);
                        }}
                        placeholder="Cari item..."
                        renderOption={(i) => `${i.name} (${i.code})`}
                    />
                    {errors[`items.${idx}.item_id`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${idx}.item_id`]}</p>
                    )}
                    {ing && <p className="text-xs text-slate-400 mt-0.5">{ing.unit}</p>}
                </div>

                {/* Remove */}
                {items.length > 1 && (
                    <div className="pt-5 shrink-0">
                        <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <IconTrash size={15} />
                        </button>
                    </div>
                )}
            </div>

            {/* Row 2: Qty Sistem + Qty Fisik */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                        Qty Sistem
                        {isLoading && <IconLoader2 size={10} className="inline ml-1 animate-spin text-orange-400" />}
                    </label>
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-100 dark:bg-slate-700 px-3 py-2 text-sm text-right text-slate-500 font-mono">
                        {fmtQty(item.system_quantity)}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Qty Fisik *</label>
                    <input
                        type="number"
                        step="1"
                        min="0"
                        value={item.physical_quantity}
                        onChange={(e) => updateItem(idx, "physical_quantity", e.target.value)}
                        className="w-full rounded-xl border-slate-200 dark:bg-slate-900 text-sm text-right"
                        placeholder="0"
                    />
                    {errors[`items.${idx}.physical_quantity`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`items.${idx}.physical_quantity`]}</p>
                    )}
                </div>
            </div>

            {/* Difference preview */}
            {item.physical_quantity !== "" && (
                <div className={`flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border ${
                    diff > 0 ? "bg-success-50 border-success-200 text-success-700"
                    : diff < 0 ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-slate-100 border-slate-200 text-slate-500"
                }`}>
                    <div className="flex items-center gap-1.5">
                        {diff > 0 ? <IconTrendingUp size={14} /> : diff < 0 ? <IconTrendingDown size={14} /> : null}
                        <span>Selisih: {diff > 0 ? "+" : ""}{fmtQty(diff)} {ing?.unit ?? "unit"}</span>
                    </div>
                    <span className="text-xs font-semibold opacity-80">Nilai: {fmt(valDiff)}</span>
                </div>
            )}

            {/* Item notes */}
            <input
                type="text"
                value={item.notes}
                onChange={(e) => updateItem(idx, "notes", e.target.value)}
                placeholder="Catatan item (opsional)..."
                className="w-full rounded-xl border-slate-200 dark:bg-slate-900 text-xs"
            />
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Create({ warehouses, stores, ingredients, packagingMaterials, typeOptions }) {
    const { data, setData, post, processing, errors } = useForm({
        location_type:   "warehouse",
        location_id:     "",
        adjustment_date: new Date().toISOString().split("T")[0],
        type:            "stock_opname",
        notes:           "",
        items: [{ item_type: "ingredient", item_id: "", system_quantity: 0, physical_quantity: "", unit_cost: 0.0, notes: "" }],
    });

    const [loadingIdx, setLoadingIdx] = useState(null);

    // ─── dataRef: selalu tunjuk ke nilai data terkini ──────────────────────────
    // Digunakan di fetchSystemQty (async) agar tidak membaca snapshot lama
    // dari closure — khususnya location_id, location_type, dan items.
    const dataRef = useRef(data);
    useEffect(() => { dataRef.current = data; }, [data]);

    const locations   = data.location_type === "warehouse" ? warehouses : stores;
    const usedItemIds = data.items.map((i) => i.item_id).filter(Boolean);

    const allItems = useMemo(() => [
        ...ingredients.map((i)       => ({ ...i, _type: "ingredient" })),
        ...packagingMaterials.map((p) => ({ ...p, _type: "packaging_material" })),
    ], [ingredients, packagingMaterials]);

    // ─── fetchSystemQty ────────────────────────────────────────────────────────
    // FIX: Tidak pakai useCallback (menghindari stale closure).
    //
    // Root cause error sebelumnya:
    //   setData("items", (prevItems) => ...) — Inertia useForm TIDAK mendukung
    //   functional updater. Inertia menyimpan fungsi itu sebagai value,
    //   sehingga data.items menjadi Function, bukan Array → .map() crash.
    //
    // Fix:
    //   1. Baca items terkini dari dataRef.current.items (selalu fresh)
    //   2. item_type & item_id diterima sebagai parameter eksplisit
    //   3. Baca location_type & location_id dari dataRef.current
    const fetchSystemQty = async (idx, itemType, itemId) => {
        const { location_type, location_id } = dataRef.current;
        if (!location_id || !itemId) return;

        setLoadingIdx(idx);
        try {
            const res = await fetch(route("stock-adjustments.current-stock"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || "",
                },
                body: JSON.stringify({
                    location_type,
                    location_id,
                    item_type: itemType,
                    item_id:   itemId,
                }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            // Baca items terkini dari dataRef — BUKAN dari closure
            const freshItems = dataRef.current.items;
            setData("items", freshItems.map((item, i) =>
                i === idx ? {
                    ...item,
                    system_quantity: parseInt(json.quantity)       || 0,
                    unit_cost:       parseFloat(json.average_cost) || 0.0,
                } : item
            ));
        } catch (err) {
            console.error("fetchSystemQty:", err);
            toast.error("Gagal mengambil stok sistem.");
        } finally {
            setLoadingIdx(null);
        }
    };

    const addItem    = () => setData("items", [...data.items, { item_type: "ingredient", item_id: "", system_quantity: 0, physical_quantity: "", unit_cost: 0.0, notes: "" }]);
    const removeItem = (idx) => setData("items", data.items.filter((_, i) => i !== idx));
    const updateItem = (idx, key, value) =>
        setData("items", data.items.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));

    const submit = (e) => {
        e.preventDefault();
        post(route("stock-adjustments.store"), {
            onSuccess: () => toast.success("Adjustment berhasil disimpan!"),
        });
    };

    return (
        <>
            <Head title="Buat Penyesuaian Stok" />
            <div className="max-w-5xl mx-auto">
                <Link
                    href={route("stock-adjustments.index")}
                    className="flex items-center gap-2 text-slate-500 mb-4 hover:text-orange-600 text-sm transition-colors"
                >
                    <IconArrowLeft size={18} /> Kembali
                </Link>

                <form onSubmit={submit} className="space-y-4 sm:space-y-6">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-4 sm:p-6 shadow-lg">
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <IconAdjustments size={24} className="shrink-0" /> Buat Penyesuaian Stok
                        </h2>
                        <p className="text-orange-100 text-xs sm:text-sm mt-1">
                            Stock opname, barang rusak, hilang, atau penyesuaian lainnya
                        </p>
                    </div>

                    {/* Info */}
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 flex gap-2 sm:gap-3">
                        <IconInfoCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                            Sistem otomatis mengambil stok saat ini. Masukkan <strong>qty fisik hasil hitung</strong> — selisih dihitung otomatis.
                            Stok berubah hanya saat adjustment <strong>Diselesaikan</strong>.
                        </p>
                    </div>

                    {/* Informasi Adjustment */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm uppercase tracking-wide border-b pb-2">
                            Informasi Adjustment
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

                            {/* Location type */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                    Tipe Lokasi *
                                </label>
                                <div className="flex gap-2">
                                    {["warehouse", "store"].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setData((prev) => ({
                                                ...prev,
                                                location_type: t,
                                                location_id:   "",
                                                items: [{ item_type: "ingredient", item_id: "", system_quantity: 0, physical_quantity: "", unit_cost: 0.0, notes: "" }],
                                            }))}
                                            className={`flex-1 py-2 sm:py-2.5 rounded-xl border-2 font-bold text-xs transition-all ${
                                                data.location_type === t
                                                    ? "border-orange-400 bg-orange-50 text-orange-700"
                                                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                                            }`}
                                        >
                                            {t === "warehouse" ? "Gudang" : "Toko"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                    {data.location_type === "warehouse" ? "Gudang" : "Toko"} *
                                </label>
                                <SearchSelect
                                    options={locations}
                                    value={data.location_id}
                                    onChange={(v) => setData((prev) => ({
                                        ...prev,
                                        location_id: v,
                                        items: [{ item_type: "ingredient", item_id: "", system_quantity: 0, physical_quantity: "", unit_cost: 0.0, notes: "" }],
                                    }))}
                                    placeholder={`Cari ${data.location_type === "warehouse" ? "gudang" : "toko"}...`}
                                    renderOption={(l) => `${l.name} (${l.code})`}
                                />
                                {errors.location_id && <p className="text-red-500 text-xs mt-1">{errors.location_id}</p>}
                            </div>

                            {/* Tipe Adjustment */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                                    Tipe Adjustment *
                                </label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData("type", e.target.value)}
                                    className="w-full rounded-xl border-slate-200 dark:bg-slate-950 text-sm"
                                >
                                    {typeOptions.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                            </div>

                            {/* Date */}
                            <Input
                                label="Tanggal *"
                                type="date"
                                value={data.adjustment_date}
                                onChange={(e) => setData("adjustment_date", e.target.value)}
                                errors={errors.adjustment_date}
                            />
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm uppercase tracking-wide">
                                Item Adjustment
                            </h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold text-orange-600 px-2.5 sm:px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors"
                            >
                                <IconPlus size={14} />
                                <span className="hidden xs:inline">Tambah Item</span>
                                <span className="xs:hidden">Tambah</span>
                            </button>
                        </div>

                        {errors.items && <p className="text-red-500 text-xs">{errors.items}</p>}

                        <div className="space-y-3">
                            {data.items.map((item, idx) => (
                                <ItemRow
                                    key={idx}
                                    item={item}
                                    idx={idx}
                                    allItems={allItems}
                                    usedItemIds={usedItemIds}
                                    items={data.items}
                                    setData={setData}
                                    errors={errors}
                                    onFetchQty={fetchSystemQty}
                                    removeItem={removeItem}
                                    updateItem={updateItem}
                                    loadingIdx={loadingIdx}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-5">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Catatan Adjustment
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border-slate-200 dark:bg-slate-950 text-sm resize-none"
                            placeholder="Catatan atau keterangan tambahan..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pb-4 sm:pb-0">
                        <Link
                            href={route("stock-adjustments.index")}
                            className="w-full sm:w-auto text-center px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-7 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-500/30 text-sm hover:from-orange-600 hover:to-orange-700 transition-all"
                        >
                            <IconDeviceFloppy size={18} />
                            {processing ? "Menyimpan..." : "Simpan sebagai Draft"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
