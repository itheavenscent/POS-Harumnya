import React, { useState, useMemo, useRef, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import {
    IconArrowLeft, IconDeviceFloppy, IconShoppingBag,
    IconPlus, IconTrash, IconLock, IconBuilding,
    IconSearch, IconX, IconChevronDown, IconInfoCircle
} from "@tabler/icons-react";
import toast from "react-hot-toast";

// ─── Money helpers (decimal 15,2) ─────────────────────────────────────────────
const fmtRp = (n) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 2,
    }).format(parseFloat(n) || 0);

const parseDecimal = (str) => {
    const cleaned = String(str).replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? "0" : num.toFixed(2);
};

const displayDecimal = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return "";
    return num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// ─── Searchable dropdown ──────────────────────────────────────────────────────
function SearchSelect({ options, value, onChange, placeholder = "Cari...", renderOption, disabled = false }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef(null);

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
    const selected = options.find((o) => o.id === value);

    return (
        <div ref={ref} className="relative">
            <button type="button" disabled={disabled}
                onClick={() => { setOpen((v) => !v); setQuery(""); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors
                    ${disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                        : open ? "border-amber-400 ring-2 ring-amber-100 bg-white dark:bg-slate-950"
                            : "border-slate-200 bg-white dark:bg-slate-950 hover:border-slate-300"}`}>
                <span className={`truncate ${selected ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-400"}`}>
                    {selected ? renderOption(selected) : placeholder}
                </span>
                {value && !disabled
                    ? <IconX size={14} className="text-slate-400 shrink-0" onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false); }} />
                    : <IconChevronDown size={14} className="text-slate-400 shrink-0" />}
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <IconSearch size={13} className="text-slate-400 shrink-0" />
                            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ketik untuk mencari..."
                                className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-300 min-w-0" />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0
                            ? <p className="px-4 py-3 text-xs text-slate-400 text-center">Tidak ditemukan</p>
                            : filtered.map((o) => (
                                <button key={o.id} type="button"
                                    onClick={() => { onChange(o.id); setOpen(false); setQuery(""); }}
                                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors
                                        ${o.id === value ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                                    {renderOption(o)}
                                </button>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Decimal money input ──────────────────────────────────────────────────────
function MoneyInput({ value, onChange, placeholder = "0", className = "" }) {
    const [display, setDisplay] = useState(displayDecimal(value));

    useEffect(() => {
        setDisplay(displayDecimal(value));
    }, [value]);

    const handleChange = (e) => {
        const raw = e.target.value.replace(/[^\d.,]/g, "");
        setDisplay(raw);
    };

    const handleBlur = () => {
        const parsed = parseDecimal(display);
        const num = parseFloat(parsed);
        setDisplay(num === 0 ? "" : num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
        onChange(parsed);
    };

    return (
        <input type="text" inputMode="decimal" value={display}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`rounded-xl border-slate-200 dark:bg-slate-900 text-sm text-right ${className}`} />
    );
}

const PAYMENT_LABELS = {
    cash: "Tunai", credit_7: "Kredit 7 Hari", credit_14: "Kredit 14 Hari",
    credit_30: "Kredit 30 Hari", credit_60: "Kredit 60 Hari",
};

export default function Edit({ purchase, suppliers, warehouses, stores, ingredients, packagingMaterials }) {
    const { data, setData, put, processing, errors } = useForm({
        supplier_id: purchase.supplier_id ?? "",
        purchase_date: (purchase.purchase_date ?? "").split("T")[0],
        expected_delivery_date: purchase.expected_delivery_date ?? "",
        tax: String(parseFloat(purchase.tax) || 0),
        discount: String(parseFloat(purchase.discount) || 0),
        shipping_cost: String(parseFloat(purchase.shipping_cost) || 0),
        notes: purchase.notes ?? "",
        items: (purchase.items ?? []).map((i) => {
            const qty = parseInt(i.quantity) || 0;
            const unitP = parseFloat(i.unit_price) || 0;
            return {
                item_type: i.item_type,
                item_id: i.item_id,
                quantity: i.quantity,
                total_price: String(qty * unitP), // Hitung Harga Total awal dari DB
                unit_price: String(unitP),       // Simpan Harga Unit untuk dikirim ke backend
                notes: i.notes ?? "",
            };
        }),
    });

    const selectedSupplier = suppliers.find((s) => s.id === data.supplier_id);

    const allItems = useMemo(() => [
        ...ingredients.map((i) => ({ ...i, _type: "ingredient" })),
        ...packagingMaterials.map((p) => ({ ...p, _type: "packaging_material" })),
    ], [ingredients, packagingMaterials]);

    const usedItemIds = data.items.map((i) => i.item_id).filter(Boolean);
    const addItem = () => setData("items", [...data.items, { item_type: "ingredient", item_id: "", quantity: "", total_price: "0", unit_price: "0", notes: "" }]);
    const removeItem = (idx) => setData("items", data.items.filter((_, i) => i !== idx));

    // Perhitungan otomatis Harga/Unit saat Qty atau Harga Total berubah
    const updateItem = (idx, key, val) => {
        setData("items", data.items.map((item, i) => {
            if (i !== idx) return item;

            const newItem = { ...item, [key]: val };

            const qty = parseInt(key === 'quantity' ? val : item.quantity) || 0;
            const total = parseFloat(key === 'total_price' ? val : item.total_price) || 0;

            if (qty > 0) {
                newItem.unit_price = String(total / qty);
            } else {
                newItem.unit_price = "0";
            }

            return newItem;
        }));
    };

    // Auto-isi harga jika user mengganti item pada mode Edit
    const selectItem = (idx, itemId, allItemsList) => {
        const found = allItemsList.find((i) => i.id === itemId);
        const refPrice = parseFloat(found?.average_cost ?? found?.purchase_price ?? "0");

        setData("items", data.items.map((item, i) => {
            if (i !== idx) return item;

            const qty = parseInt(item.quantity) || 1;
            const currentTotal = parseFloat(item.total_price) || 0;
            const newTotal = currentTotal > 0 ? currentTotal : (refPrice * qty);

            return {
                ...item,
                item_id: itemId,
                total_price: String(newTotal),
                unit_price: String(newTotal / qty),
            };
        }));
    };

    // Subtotal kini menjumlahkan kolom total_price
    const subtotal = data.items.reduce((s, i) => s + (parseFloat(i.total_price) || 0), 0);

    const total = subtotal
        + (parseFloat(data.tax) || 0)
        + (parseFloat(data.shipping_cost) || 0)
        - (parseFloat(data.discount) || 0);

    const submit = (e) => {
        e.preventDefault();
        put(route("purchases.update", purchase.id), {
            onSuccess: () => toast.success("Purchase Order berhasil diperbarui!"),
        });
    };

    return (
        <>
            <Head title={`Edit PO ${purchase.purchase_number}`} />
            <div className="max-w-5xl mx-auto px-4 sm:px-0 pb-10">
                <Link href={route("purchases.show", purchase.id)}
                    className="inline-flex items-center gap-2 text-slate-500 mb-4 hover:text-amber-600 text-sm font-medium">
                    <IconArrowLeft size={18} /> Kembali
                </Link>

                <form onSubmit={submit} className="space-y-4 sm:space-y-6">
                    {/* Banner */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-5 sm:p-6 shadow-lg">
                        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <IconShoppingBag size={24} className="sm:w-7 sm:h-7" /> Edit Purchase Order
                        </h2>
                        <p className="text-amber-100 text-xs sm:text-sm mt-1.5 flex items-center flex-wrap gap-1">
                            {purchase.purchase_number} <span className="hidden sm:inline">·</span>
                            <span className="block sm:inline mt-0.5 sm:mt-0">
                                Status: <span className="font-bold capitalize bg-amber-700/30 px-2 py-0.5 rounded-md">{purchase.status_label}</span>
                            </span>
                        </p>
                    </div>

                    {/* Destinasi — read-only */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <IconLock size={16} className="text-slate-400 shrink-0" />
                            <strong className="text-sm text-slate-700 dark:text-slate-300">Destinasi:</strong>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 pl-6 sm:pl-0">
                            {purchase.destination_name}
                            <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
                            <span className="capitalize">{purchase.destination_type}</span>
                            <span className="ml-2 text-xs text-slate-400 italic block sm:inline mt-1 sm:mt-0">(tidak dapat diubah)</span>
                        </p>
                    </div>

                    {/* PO Info */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide border-b pb-2">Informasi PO</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1.5">Supplier *</label>
                                <SearchSelect
                                    options={suppliers}
                                    value={data.supplier_id}
                                    onChange={(v) => setData("supplier_id", v)}
                                    placeholder="Cari supplier..."
                                    renderOption={(s) => `${s.name} (${s.code})`} />
                                {errors.supplier_id && <p className="text-red-500 text-xs mt-1">{errors.supplier_id}</p>}
                                {selectedSupplier && (
                                    <div className="mt-2 p-2.5 bg-amber-50 rounded-xl text-xs text-amber-700 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <div className="flex items-center gap-1 font-semibold">
                                            <IconBuilding size={14} />
                                            {PAYMENT_LABELS[selectedSupplier.payment_term] ?? "-"}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Input label="Tanggal PO *" type="date" value={data.purchase_date}
                                onChange={(e) => setData("purchase_date", e.target.value)} errors={errors.purchase_date} />
                            <Input label="Est. Tgl Tiba" type="date" value={data.expected_delivery_date}
                                onChange={(e) => setData("expected_delivery_date", e.target.value)} errors={errors.expected_delivery_date} />
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Item Pembelian</h3>
                            <button type="button" onClick={addItem}
                                className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 px-4 py-2 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors w-full sm:w-auto">
                                <IconPlus size={16} /> Tambah Item
                            </button>
                        </div>
                        {errors.items && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{errors.items}</p>}

                        <div className="space-y-4">
                            {data.items.map((item, idx) => {
                                const qty = parseInt(item.quantity) || 0;
                                const unitPrice = parseFloat(item.unit_price) || 0;
                                const filtered = allItems.filter((i) =>
                                    i._type === item.item_type && (!usedItemIds.includes(i.id) || i.id === item.item_id)
                                );
                                const ing = allItems.find((i) => i._type === item.item_type && i.id === item.item_id);

                                return (
                                    <div key={idx} className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-4 border border-slate-100">

                                        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-3 items-start">

                                            {/* Tipe */}
                                            <div className="col-span-2 lg:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Tipe</label>
                                                <select value={item.item_type}
                                                    onChange={(e) => updateItem(idx, "item_type", e.target.value)}
                                                    className="w-full rounded-xl border-slate-200 dark:bg-slate-900 text-sm py-2.5 focus:ring-amber-500">
                                                    <option value="ingredient">Ingredient</option>
                                                    <option value="packaging_material">Packaging</option>
                                                </select>
                                            </div>

                                            {/* Item */}
                                            <div className="col-span-2 lg:col-span-3">
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Item</label>
                                                <SearchSelect
                                                    options={filtered}
                                                    value={item.item_id}
                                                    onChange={(v) => selectItem(idx, v, filtered)}
                                                    placeholder="Cari item..."
                                                    renderOption={(i) => `${i.name} (${i.code})`} />
                                                {errors[`items.${idx}.item_id`] && (
                                                    <p className="text-red-500 text-xs mt-1">{errors[`items.${idx}.item_id`]}</p>
                                                )}
                                            </div>

                                            {/* Qty */}
                                            <div className="col-span-1 lg:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 truncate">
                                                    Qty {ing ? `(${ing.unit ?? ing.size?.name ?? "pcs"})` : ""}
                                                </label>
                                                <input type="number" step="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                                    className="w-full rounded-xl border-slate-200 dark:bg-slate-900 text-sm text-right py-2.5 focus:ring-amber-500"
                                                    placeholder="0" />
                                                {errors[`items.${idx}.quantity`] && (
                                                    <p className="text-red-500 text-xs mt-1">{errors[`items.${idx}.quantity`]}</p>
                                                )}
                                            </div>

                                            {/* Harga Total (INPUT) */}
                                            <div className="col-span-1 lg:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 truncate">Harga Total (Rp)</label>
                                                <MoneyInput
                                                    value={item.total_price}
                                                    onChange={(v) => updateItem(idx, "total_price", v)}
                                                    className="w-full py-2.5 focus:ring-amber-500" />
                                                {errors[`items.${idx}.unit_price`] && (
                                                    <p className="text-red-500 text-xs mt-1">{errors[`items.${idx}.unit_price`]}</p>
                                                )}
                                            </div>

                                            {/* Harga/Unit (SHOW ONLY) */}
                                            <div className="col-span-2 lg:col-span-2">
                                                <label className="block text-xs font-bold text-amber-400 mb-1.5 lg:invisible hidden lg:block">_</label>
                                                <div className="w-full bg-amber-50/50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-amber-100 flex flex-col justify-center min-h-[42px]">
                                                    <span className="text-[10px] uppercase font-bold text-amber-600 mb-0.5">Harga / Unit</span>
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                        {qty > 0 ? fmtRp(unitPrice) : "-"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Hapus */}
                                            <div className="col-span-2 lg:col-span-1 flex justify-end lg:justify-center items-end lg:pb-1">
                                                {data.items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(idx)}
                                                        className="flex items-center gap-1 px-3 py-2.5 lg:p-2.5 text-red-600 bg-red-100 hover:bg-red-200 rounded-xl transition-colors lg:mt-6 text-xs font-bold w-full lg:w-auto justify-center">
                                                        <IconTrash size={16} /> <span className="lg:hidden">Hapus Item</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Catatan Item */}
                                        <div className="pt-2">
                                            <input type="text" value={item.notes}
                                                onChange={(e) => updateItem(idx, "notes", e.target.value)}
                                                placeholder="Catatan item (opsional)..."
                                                className="w-full rounded-xl border-slate-200 dark:bg-slate-900 text-sm py-2 focus:ring-amber-500" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Biaya + Ringkasan */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b pb-2">Biaya Tambahan</h3>
                            {[
                                { label: "PPN / Tax", key: "tax" },
                                { label: "Ongkos Kirim", key: "shipping_cost" },
                                { label: "Diskon", key: "discount" },
                            ].map(({ label, key }) => (
                                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                    <label className="text-sm font-medium text-slate-600 sm:w-32 shrink-0">{label}</label>
                                    <MoneyInput value={data[key]} onChange={(v) => setData(key, v)} className="w-full sm:flex-1 py-2 focus:ring-amber-500" />
                                </div>
                            ))}
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-3">
                            <h3 className="font-bold text-amber-800 text-sm uppercase tracking-wide border-b border-amber-200 pb-2">Ringkasan</h3>
                            <div className="space-y-2.5">
                                {[
                                    { label: "Subtotal", value: subtotal },
                                    { label: "PPN / Tax", value: parseFloat(data.tax) || 0 },
                                    { label: "Ongkir", value: parseFloat(data.shipping_cost) || 0 },
                                    { label: "Diskon", value: -(parseFloat(data.discount) || 0) },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between text-sm">
                                        <span className="text-slate-600 font-medium">{label}</span>
                                        <span className={`font-bold ${value < 0 ? "text-red-600" : "text-slate-800"}`}>
                                            {value < 0 ? "- " : ""}{fmtRp(Math.abs(value))}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center text-lg sm:text-xl font-black border-t-2 border-amber-200 pt-3 mt-3">
                                <span className="text-amber-800">TOTAL</span>
                                <span className="text-amber-800 bg-white px-3 py-1 rounded-lg shadow-sm border border-amber-100">
                                    {fmtRp(total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Catatan Utama */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Catatan PO</label>
                        <textarea value={data.notes} onChange={(e) => setData("notes", e.target.value)}
                            rows={3} className="w-full rounded-xl border-slate-200 dark:bg-slate-950 text-sm resize-none focus:ring-amber-500"
                            placeholder="Instruksi pengiriman, keterangan khusus, dll..." />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                        <Link href={route("purchases.show", purchase.id)}
                            className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm text-center transition-colors shadow-sm">
                            Batal
                        </Link>
                        <button type="submit" disabled={processing}
                            className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/30 text-sm transition-all">
                            <IconDeviceFloppy size={20} />
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
Edit.layout = (page) => <DashboardLayout children={page} />;