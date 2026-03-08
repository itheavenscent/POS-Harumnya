import React, { useState, useEffect, useMemo, useRef } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import {
    IconArrowLeft, IconDeviceFloppy, IconFlask, IconPlus, IconTrash,
    IconAlertCircle, IconInfoCircle, IconSearch, IconX, IconChevronDown,
    IconPencilCog,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

// ─── SearchSelect ─────────────────────────────────────────────────────────────
function SearchSelect({
    options,
    value,
    onChange,
    placeholder = "Cari...",
    renderOption,
    disabled = false,
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const filtered = useMemo(() =>
        query.trim() === ""
            ? options
            : options.filter((o) =>
                renderOption(o).toLowerCase().includes(query.toLowerCase())
            ),
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
                            ? "border-violet-400 ring-2 ring-violet-100 bg-white dark:bg-slate-950"
                            : "border-slate-200 bg-white dark:bg-slate-950 hover:border-slate-300"
                    }`}
            >
                <span className={selected
                    ? "text-slate-800 dark:text-slate-200 font-medium truncate"
                    : "text-slate-400"
                }>
                    {selected ? renderOption(selected) : placeholder}
                </span>
                {value && !disabled ? (
                    <IconX
                        size={14}
                        className="text-slate-400 shrink-0 hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); onChange(""); }}
                    />
                ) : (
                    <IconChevronDown size={14} className="text-slate-400 shrink-0" />
                )}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <IconSearch size={13} className="text-slate-400 shrink-0" />
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ketik untuk mencari..."
                                className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-300"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setQuery("")}
                                >
                                    <IconX size={12} className="text-slate-400" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-slate-400 text-center">Tidak ditemukan</p>
                        ) : (
                            filtered.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleSelect(o.id)}
                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors
                                        ${String(o.id) === String(value)
                                            ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 font-bold"
                                            : "text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                                        }`}
                                >
                                    {renderOption(o)}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Edit({ repack, warehouses, stores, ingredients }) {
    const { data, setData, put, processing, errors } = useForm({
        repack_ingredient_id: repack.output_ingredient_id ?? "",
        output_quantity:      String(repack.output_quantity ?? ""),
        repack_date:          repack.repack_date
            ? repack.repack_date.split("T")[0]
            : new Date().toISOString().split("T")[0],
        notes: repack.notes ?? "",
        items: repack.items?.length
            ? repack.items.map((i) => ({
                ingredient_id: i.ingredient_id,
                quantity:      String(i.quantity),
            }))
            : [{ ingredient_id: "", quantity: "" }],
    });

    // stockInfo menyimpan average_cost (decimal float) per ingredient_id
    const [stockInfo, setStockInfo] = useState(() => {
        // Inisialisasi dari data item yang sudah ada (unit_cost dari DB)
        const init = {};
        repack.items?.forEach((i) => {
            if (i.ingredient_id) {
                init[i.ingredient_id] = { average_cost: i.unit_cost ?? 0 };
            }
        });
        return init;
    });

    // Lokasi dikunci — tidak bisa diubah saat edit
    const locationLabel =
        repack.location_type === "warehouse"
            ? (warehouses.find((w) => w.id === repack.location_id)?.name ?? "-")
            : (stores.find((s) => s.id === repack.location_id)?.name ?? "-");

    const outputIngredient = ingredients.find((i) => i.id === data.repack_ingredient_id);

    // total_cost per item = qty × avg_cost
    const totalInputCost = data.items.reduce((sum, item) => {
        const info = stockInfo[item.ingredient_id];
        const cost = info ? parseFloat(info.average_cost) || 0 : 0;
        return sum + (parseInt(item.quantity) || 0) * cost;
    }, 0);

    // output_cost = totalInputCost / output_quantity
    const estOutputCost = parseInt(data.output_quantity) > 0
        ? totalInputCost / parseInt(data.output_quantity)
        : 0;

    const fmt = (n) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency", currency: "IDR", minimumFractionDigits: 0,
        }).format(parseFloat(n) || 0);

    const addItem = () => setData("items", [...data.items, { ingredient_id: "", quantity: "" }]);
    const removeItem = (idx) => setData("items", data.items.filter((_, i) => i !== idx));

    const usedIngredientIds = data.items.map((i) => i.ingredient_id).filter(Boolean);

    const ingredientOptionsFor = (idx) =>
        ingredients.filter((i) =>
            i.id === data.items[idx].ingredient_id || !usedIngredientIds.includes(i.id)
        );

    const submit = (e) => {
        e.preventDefault();
        put(route("repacks.update", repack.id), {
            onSuccess: () => toast.success("Repack berhasil diperbarui!"),
        });
    };

    return (
        <>
            <Head title={`Edit Repack ${repack.repack_number}`} />
            <div className="max-w-5xl mx-auto">
                <Link
                    href={route("repacks.show", repack.id)}
                    className="flex items-center gap-2 text-slate-500 mb-4 hover:text-primary-600 transition-all text-sm"
                >
                    <IconArrowLeft size={18} /> Kembali ke Detail
                </Link>

                <form onSubmit={submit} className="space-y-6">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <IconPencilCog size={28} /> Edit Repack
                        </h2>
                        <p className="text-amber-100 text-sm mt-1">
                            <span className="font-mono font-bold">{repack.repack_number}</span>
                            {" "}· Status:{" "}
                            <span className="capitalize font-semibold">{repack.status}</span>
                        </p>
                    </div>

                    {/* Info box */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 flex gap-3">
                        <IconInfoCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-700 dark:text-amber-300">
                            <p className="font-bold mb-1">Catatan pengeditan:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-xs">
                                <li>Lokasi repack <strong>tidak dapat diubah</strong> setelah dibuat</li>
                                <li>Cost akan dihitung ulang berdasarkan stok rata-rata terkini</li>
                                <li>Perubahan hanya berlaku untuk repack berstatus <strong>Draft</strong> atau <strong>Pending</strong></li>
                            </ul>
                        </div>
                    </div>

                    {/* Location & Date — lokasi dikunci */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-6 space-y-5">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 border-b pb-2 text-sm uppercase tracking-wide">
                            Informasi Repack
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {/* Location type — read only */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Tipe Lokasi
                                </label>
                                <div className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 text-sm text-slate-500 font-medium capitalize">
                                    {repack.location_type === "warehouse" ? "🏭 Gudang" : "🏪 Toko"}
                                </div>
                            </div>

                            {/* Location — read only */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    {repack.location_type === "warehouse" ? "Gudang" : "Toko"}
                                    <span className="ml-2 text-xs font-normal text-slate-400">(tidak dapat diubah)</span>
                                </label>
                                <div className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                    {locationLabel}
                                </div>
                            </div>

                            {/* Date */}
                            <Input
                                label="Tanggal Repack *"
                                type="date"
                                value={data.repack_date}
                                onChange={(e) => setData("repack_date", e.target.value)}
                                errors={errors.repack_date}
                            />
                        </div>
                    </div>

                    {/* Input Items */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">
                                Ingredient Input (Bahan yang Dikurangi)
                            </h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 px-3 py-1.5 bg-violet-50 rounded-lg border border-violet-200"
                            >
                                <IconPlus size={14} /> Tambah Bahan
                            </button>
                        </div>

                        {errors.items && <p className="text-red-500 text-xs">{errors.items}</p>}

                        <div className="space-y-3">
                            {data.items.map((item, idx) => {
                                const ing = ingredients.find((i) => i.id === item.ingredient_id);
                                const options = ingredientOptionsFor(idx);

                                return (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-12 gap-3 items-start p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                                    >
                                        {/* Ingredient searchable */}
                                        <div className="col-span-7">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">
                                                Ingredient {idx + 1}
                                            </label>
                                            <SearchSelect
                                                options={options}
                                                value={item.ingredient_id}
                                                onChange={(v) =>
                                                    setData("items", data.items.map((it, i) =>
                                                        i === idx
                                                            ? { ...it, ingredient_id: v, quantity: "" }
                                                            : it
                                                    ))
                                                }
                                                placeholder="Cari ingredient..."
                                                renderOption={(i) => `${i.name} (${i.code}) · ${i.unit}`}
                                            />
                                            {errors[`items.${idx}.ingredient_id`] && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors[`items.${idx}.ingredient_id`]}
                                                </p>
                                            )}
                                            {ing && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Kategori: {ing.category?.name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-4">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">
                                                Jumlah
                                            </label>
                                            <div className="flex gap-1 items-center">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        setData("items", data.items.map((it, i) =>
                                                            i === idx
                                                                ? { ...it, quantity: e.target.value }
                                                                : it
                                                        ))
                                                    }
                                                    placeholder="0"
                                                    className="w-full rounded-xl border-slate-200 dark:bg-slate-900 text-sm"
                                                />
                                                {ing && (
                                                    <span className="text-xs text-slate-400 shrink-0">
                                                        {ing.unit}
                                                    </span>
                                                )}
                                            </div>
                                            {errors[`items.${idx}.quantity`] && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors[`items.${idx}.quantity`]}
                                                </p>
                                            )}
                                        </div>

                                        {/* Remove button */}
                                        <div className="col-span-1 flex items-end pb-0.5 justify-center">
                                            {data.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <IconTrash size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total input cost preview */}
                        {totalInputCost > 0 && (
                            <div className="flex justify-end">
                                <div className="text-right text-xs text-slate-500">
                                    <span>Estimasi total cost input: </span>
                                    <span className="font-bold text-slate-700">{fmt(totalInputCost)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Output */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-6 space-y-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 border-b pb-2 text-sm uppercase tracking-wide">
                            Ingredient Output (Hasil Repack)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Ingredient Hasil Repack *
                                </label>
                                <SearchSelect
                                    options={ingredients}
                                    value={data.repack_ingredient_id}
                                    onChange={(v) => setData("repack_ingredient_id", v)}
                                    placeholder="Cari ingredient output..."
                                    renderOption={(i) => `${i.name} (${i.code}) · ${i.unit}`}
                                />
                                {errors.repack_ingredient_id && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <IconAlertCircle size={12} /> {errors.repack_ingredient_id}
                                    </p>
                                )}
                            </div>

                            {/* output_quantity */}
                            <Input
                                label="Jumlah Output *"
                                type="number"
                                step="1"
                                min="1"
                                value={data.output_quantity}
                                onChange={(e) => setData("output_quantity", e.target.value)}
                                errors={errors.output_quantity}
                                placeholder="0"
                                suffix={outputIngredient?.unit || "unit"}
                            />
                        </div>

                        {/* Cost preview */}
                        {parseInt(data.output_quantity) > 0 && (
                            <div className="grid grid-cols-3 gap-3 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200">
                                <div className="text-center">
                                    <p className="text-xs text-violet-600 font-bold mb-1">Total Cost Input</p>
                                    <p className="font-black text-violet-700 text-lg">{fmt(totalInputCost)}</p>
                                </div>
                                <div className="text-center border-x border-violet-200">
                                    <p className="text-xs text-violet-600 font-bold mb-1">Output Qty</p>
                                    <p className="font-black text-violet-700 text-lg">
                                        {parseInt(data.output_quantity || 0).toLocaleString("id-ID")}
                                        <span className="text-sm ml-1">{outputIngredient?.unit || "unit"}</span>
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-violet-600 font-bold mb-1">Est. Cost/Unit</p>
                                    <p className="font-black text-violet-700 text-lg">{fmt(estOutputCost)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 rounded-2xl p-6">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Catatan
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData("notes", e.target.value)}
                            rows={3}
                            placeholder="Catatan tambahan..."
                            className="w-full rounded-xl border-slate-200 dark:bg-slate-950 text-sm resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link
                            href={route("repacks.show", repack.id)}
                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-7 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold flex items-center gap-2 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 text-sm"
                        >
                            <IconDeviceFloppy size={18} />
                            {processing ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Edit.layout = (page) => <DashboardLayout children={page} />;
