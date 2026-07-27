import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import toast from "react-hot-toast";
import POSLayout from "@/Layouts/POSLayout";
import {
    IconBottle, IconChevronRight, IconFlask,
    IconMinus, IconPackage, IconPlus, IconReceipt,
    IconSearch, IconShoppingCart, IconTrash, IconX, IconUser,
    IconClock, IconCheck, IconAlertTriangle, IconTag,
    IconChevronDown, IconPercentage, IconCurrencyDollar,
    IconUserPlus, IconPhone, IconMail,
    IconBox, IconStar, IconDroplet,
    IconBuildingStore, IconAdjustments, IconFlask2,
    IconArrowLeft, IconShoppingBag
} from "@tabler/icons-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v = 0) =>
    Number(v || 0).toLocaleString("id-ID", {
        style: "currency", currency: "IDR", minimumFractionDigits: 0,
    });

const toRupiahDisplay = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const num = parseFloat(val);
    if (isNaN(num)) return "";
    return num.toLocaleString("id-ID");
};
const parseRupiah = (str) => str.replace(/\./g, "").replace(",", ".");

const GENDER_LABEL = { male: "Pria", female: "Wanita", unisex: "Unisex" };
const GENDER_COLOR = {
    male: "bg-blue-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    female: "bg-pink-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    unisex: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};
const INTENSITY_COLORS = [
    { bg: "bg-violet-600", bar: "bg-violet-500", light: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", text: "text-violet-700 dark:text-violet-300" },
    { bg: "bg-blue-600", bar: "bg-blue-500", light: "bg-slate-100 dark:bg-blue-950/30", border: "border-slate-300 dark:border-slate-700", text: "text-slate-700 dark:text-slate-300" },
    { bg: "bg-teal-600", bar: "bg-teal-500", light: "bg-slate-100 dark:bg-teal-950/30", border: "border-slate-300 dark:border-slate-700", text: "text-slate-700 dark:text-slate-300" },
    { bg: "bg-rose-600", bar: "bg-rose-500", light: "bg-slate-100 dark:bg-rose-950/30", border: "border-slate-300 dark:border-slate-700", text: "text-slate-700 dark:text-slate-300" },
    { bg: "bg-amber-600", bar: "bg-amber-500", light: "bg-slate-100 dark:bg-amber-950/30", border: "border-slate-300 dark:border-slate-700", text: "text-slate-700 dark:text-slate-300" },
];
const PKG_BG = ["bg-orange-500", "bg-violet-500", "bg-rose-500", "bg-teal-500", "bg-sky-500"];

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function Modal({ show, onClose, children, maxW = "max-w-lg" }) {
    useEffect(() => {
        document.body.style.overflow = show ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [show]);
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full ${maxW} bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col`} style={{ maxHeight: "92vh" }}>
                <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Custom Order Modal ───────────────────────────────────────────────────────
function CustomOrderModal({ show, onClose, variants = [], loading = false, onConfirm, initialVariant = null }) {
    const [step, setStep] = useState(initialVariant ? 2 : 1);
    const [selectedVariant, setSelectedVariant] = useState(initialVariant);
    const [oilQty, setOilQty] = useState("");
    const [alcoholQty, setAlcoholQty] = useState("");
    const [customPrice, setCustomPrice] = useState("");
    const [priceOverride, setPriceOverride] = useState(false);
    const [priceData, setPriceData] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(false);
    const [priceError, setPriceError] = useState(null);
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState("");
    const [filterGender, setFilterGender] = useState("all");
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState("");
    const [selectedPkgs, setSelectedPkgs] = useState([]);

    // Reset saat modal ditutup
    useEffect(() => {
        if (!show) {
            setStep(initialVariant ? 2 : 1);
            setSelectedVariant(initialVariant ?? null);
            setOilQty(""); setAlcoholQty(""); setCustomPrice("");
            setPriceOverride(false); setPriceData(null); setPriceError(null);
            setErrors({}); setSearch(""); setFilterGender("all");
            setQty(1); setNotes(""); setSelectedPkgs([]);
        }
    }, [show]);

    // Sync bila initialVariant berubah
    useEffect(() => {
        if (show && initialVariant) {
            setSelectedVariant(initialVariant);
            setStep(2);
            setOilQty(""); setAlcoholQty(""); setCustomPrice("");
            setPriceOverride(false); setPriceData(null); setPriceError(null);
        }
    }, [initialVariant]);

    // Fetch harga otomatis — debounce 400ms
    useEffect(() => {
        const oil = Number(oilQty) || 0;
        const alc = Number(alcoholQty) || 0;

        if (!selectedVariant || oil < 1) return;
        if (priceOverride) return;
        if (alc > oil) return;

        setPriceError(null);

        const timeout = setTimeout(async () => {
            setLoadingPrice(true);
            try {
                const res = await axios.get(route("transactions.get-custom-price"), {
                    params: {
                        variant_id: selectedVariant.id,
                        oil_qty: oil,
                        alcohol_qty: alc,
                    },
                });
                if (res.data.success) {
                    const d = res.data.data;
                    setCustomPrice(String(d.calculated_price));
                    setPriceData(d);
                    setPriceError(null);
                } else {
                    setPriceError(res.data.message ?? "Gagal menghitung harga");
                    setCustomPrice("");
                    setPriceData(null);
                }
            } catch (err) {
                const msg = err?.response?.data?.message
                    ?? err?.response?.data?.errors?.oil_qty?.[0]
                    ?? err?.response?.data?.errors?.variant_id?.[0]
                    ?? "Gagal menghitung harga. Isi manual atau hubungi admin.";
                setPriceError(msg);
                setCustomPrice("");
                setPriceData(null);
            } finally {
                setLoadingPrice(false);
            }
        }, 400);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVariant?.id, oilQty, alcoholQty, priceOverride]);

    // Validasi komposisi real-time
    const compositionErrors = useMemo(() => {
        const errs = {};
        const oil = Number(oilQty) || 0;
        const alc = Number(alcoholQty) || 0;
        if (oil < 1) errs.oil = "Oil qty wajib diisi";
        if (alc < 0) errs.alcohol = "Alkohol tidak boleh negatif";
        if (oil > 0 && alc > oil) errs.alcohol = `Alkohol (${alc}ml) tidak boleh melebihi oil (${oil}ml). Rasio min 1:1.`;
        if (priceData?.min_oil_ml && oil > 0 && oil < priceData.min_oil_ml)
            errs.oil = `Minimum oil ${priceData.min_oil_ml}ml`;
        if (priceData?.max_oil_ml && oil > priceData.max_oil_ml)
            errs.oil = `Maximum oil ${priceData.max_oil_ml}ml`;
        return errs;
    }, [oilQty, alcoholQty, priceData]);

    const totalVolume = (Number(oilQty) || 0) + (Number(alcoholQty) || 0);
    const finalPrice = Number(customPrice) || 0;
    const isCompositionValid = Object.keys(compositionErrors).length === 0 && Number(oilQty) > 0;

    const filteredVariants = useMemo(() => {
        let f = variants;
        if (filterGender !== "all") f = f.filter(v => v.gender === filterGender);
        if (search) f = f.filter(v =>
            v.name.toLowerCase().includes(search.toLowerCase()) ||
            (v.code ?? "").toLowerCase().includes(search.toLowerCase())
        );
        return f;
    }, [variants, search, filterGender]);

    const handleConfirm = () => {
        if (!selectedVariant || !isCompositionValid) return;
        if (finalPrice <= 0) { setErrors({ price: "Harga harus lebih dari 0" }); return; }
        onConfirm({
            variant_id: selectedVariant.id,
            oil_qty: Number(oilQty),
            alcohol_qty: Number(alcoholQty) || 0,
            custom_unit_price: finalPrice,
            qty,
            notes,
            packaging_ids: selectedPkgs,
        });
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-lg">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-xs text-slate-400 mb-0.5">Custom Order</p>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-slate-800 flex items-center justify-center">
                            <IconAdjustments size={16} className="text-slate-700" />
                        </span>
                        Komposisi Bebas
                    </h3>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-red-950/30 hover:text-slate-700 flex items-center justify-center transition-colors">
                    <IconX size={16} />
                </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center px-5 py-3 gap-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                {[{ n: 1, label: "Pilih Varian" }, { n: 2, label: "Komposisi & Harga" }].map(s => (
                    <React.Fragment key={s.n}>
                        <button
                            onClick={() => {
                                if (s.n === 1 && step === 2 && initialVariant) {
                                    onClose();
                                } else if (s.n < step || (s.n === 2 && selectedVariant)) {
                                    setStep(s.n);
                                }
                            }}
                            className={`flex items-center gap-2 text-xs font-bold transition-colors ${step === s.n ? "text-slate-700 dark:text-slate-300" :
                                step > s.n ? "text-slate-700 cursor-pointer hover:opacity-80" :
                                    "text-slate-400 cursor-not-allowed"
                                }`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === s.n ? "bg-amber-500 text-white" :
                                step > s.n ? "bg-emerald-500 text-white" :
                                    "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                }`}>
                                {step > s.n ? <IconCheck size={11} /> : s.n}
                            </span>
                            {s.label}
                        </button>
                        {s.n < 2 && <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />}
                    </React.Fragment>
                ))}
            </div>

            {/* ── STEP 1: Pilih Varian ── */}
            {step === 1 && (
                <>
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 space-y-2">
                        <div className="relative">
                            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Cari varian..." value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500" />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            {[{ value: "all", label: "Semua" }, { value: "male", label: "Pria" }, { value: "female", label: "Wanita" }, { value: "unisex", label: "Unisex" }].map(g => (
                                <button key={g.value} onClick={() => setFilterGender(g.value)}
                                    className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${filterGender === g.value ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"}`}>
                                    {g.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-y-auto p-4 flex-1">
                        {loading ? (
                            <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Memuat varian...</span>
                            </div>
                        ) : filteredVariants.length === 0 ? (
                            <div className="py-12 text-center">
                                <IconAlertTriangle size={32} className="mx-auto mb-2 text-amber-400" />
                                <p className="text-sm text-slate-500">
                                    {search || filterGender !== "all" ? "Tidak ada varian sesuai filter" : "Tidak ada varian tersedia"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredVariants.map((variant, idx) => (
                                    <button key={variant.id}
                                        onClick={() => { setSelectedVariant(variant); setStep(2); }}
                                        className="group flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-amber-600 bg-white dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-amber-950/20 transition-all text-left">
                                        <div className={`w-10 h-10 rounded-xl ${INTENSITY_COLORS[idx % INTENSITY_COLORS.length].bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                            <IconDroplet size={17} className="text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight truncate">{variant.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                {variant.code && <span className="text-[10px] text-slate-400 font-mono">{variant.code}</span>}
                                                {variant.gender && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${GENDER_COLOR[variant.gender] ?? ""}`}>
                                                        {GENDER_LABEL[variant.gender] ?? variant.gender}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <IconChevronRight size={14} className="text-slate-300 group-hover:text-slate-700 flex-shrink-0 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── STEP 2: Komposisi & Harga ── */}
            {step === 2 && selectedVariant && (
                <>
                    <div className="overflow-y-auto flex-1 p-5 space-y-4">
                        {/* Variant info */}
                        <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-amber-950/20 border border-slate-300 dark:border-slate-700 rounded-xl">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <IconDroplet size={16} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-700 dark:text-amber-200 text-sm truncate">{selectedVariant.name}</p>
                                {priceData?.price_per_ml_oil ? (
                                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                                        {fmt(priceData.price_per_ml_oil)}/ml · {priceData.oil_ingredient_name ?? "ingredient oil"}
                                    </p>
                                ) : loadingPrice ? null : (
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        Isi jumlah oil untuk kalkulasi harga otomatis
                                    </p>
                                )}
                            </div>
                            {loadingPrice && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                        </div>

                        {/* Error kalkulasi harga dari backend */}
                        {priceError && (
                            <div className="flex items-start gap-2 p-3 bg-slate-100 dark:bg-red-950/20 border border-slate-300 dark:border-slate-700 rounded-xl">
                                <IconAlertTriangle size={14} className="text-slate-700 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-700 dark:text-slate-300">{priceError}</p>
                            </div>
                        )}

                        {/* Aturan rasio */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                            <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <IconAlertTriangle size={12} className="text-slate-700" /> Aturan Komposisi
                            </p>
                            <p>• Alkohol <span className="font-semibold text-slate-700 dark:text-slate-300">GRATIS</span> ke customer (HPP tetap dihitung)</p>
                            <p>• Rasio minimum oil:alkohol = <span className="font-bold">1:1</span></p>
                            <p>• Contoh valid: 27ml oil + 3ml alkohol ✓</p>
                            <p>• Contoh tidak valid: 10ml oil + 15ml alkohol ✗</p>
                        </div>

                        {/* Input komposisi */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                                    Oil (ml) *
                                </label>
                                <input
                                    type="number" min="1" inputMode="numeric"
                                    value={oilQty}
                                    onChange={e => {
                                        setOilQty(e.target.value);
                                        setPriceOverride(false);
                                        setPriceData(null);
                                        setPriceError(null);
                                        setCustomPrice("");
                                    }}
                                    placeholder="cth: 27"
                                    className={`w-full h-11 px-3 rounded-xl border text-center text-lg font-black focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white ${compositionErrors.oil
                                        ? "border-slate-300 bg-slate-100 dark:bg-red-950/20 focus:ring-red-400/30"
                                        : "border-slate-200 dark:border-slate-700 bg-slate-50 focus:ring-amber-500/30 focus:border-amber-500"
                                        }`}
                                />
                                {compositionErrors.oil && <p className="text-xs text-slate-700 mt-1">{compositionErrors.oil}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
                                    Alkohol (ml)
                                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black rounded ml-auto">GRATIS</span>
                                </label>
                                <input
                                    type="number" min="0" inputMode="numeric"
                                    value={alcoholQty}
                                    onChange={e => {
                                        setAlcoholQty(e.target.value);
                                        setPriceError(null);
                                    }}
                                    placeholder="cth: 3"
                                    className={`w-full h-11 px-3 rounded-xl border text-center text-lg font-black focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white ${compositionErrors.alcohol
                                        ? "border-slate-300 bg-slate-100 dark:bg-red-950/20 focus:ring-red-400/30"
                                        : "border-slate-200 dark:border-slate-700 bg-slate-50 focus:ring-blue-500/30 focus:border-slate-300"
                                        }`}
                                />
                                {compositionErrors.alcohol && <p className="text-xs text-slate-700 mt-1">{compositionErrors.alcohol}</p>}
                            </div>
                        </div>

                        {/* Total volume */}
                        {totalVolume > 0 && (
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <div className="flex-1 text-xs text-slate-500">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{totalVolume}ml</span> total · {Number(oilQty) || 0}ml oil + {Number(alcoholQty) || 0}ml alkohol
                                </div>
                                {isCompositionValid && (
                                    <span className="flex items-center gap-1 text-xs text-slate-700 font-bold">
                                        <IconCheck size={13} /> Rasio valid
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Harga */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                    Harga Jual (Rp)
                                    {priceData && !priceOverride && (
                                        <span className="ml-1.5 text-[10px] font-normal text-slate-700">
                                            · otomatis dari harga jual oil
                                        </span>
                                    )}
                                </label>
                                {priceData?.calculated_price > 0 && priceOverride && (
                                    <button onClick={() => { setPriceOverride(false); setCustomPrice(String(priceData.calculated_price)); }}
                                        className="text-[10px] text-slate-700 font-bold hover:underline">
                                        Reset ke {fmt(priceData.calculated_price)}
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                <input
                                    type="text" inputMode="numeric"
                                    value={toRupiahDisplay(customPrice)}
                                    onChange={e => { setCustomPrice(e.target.value.replace(/\D/g, "")); setPriceOverride(true); }}
                                    placeholder="0"
                                    className={`w-full h-12 pl-10 pr-16 rounded-xl border text-xl font-black focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white ${errors.price
                                        ? "border-slate-300 bg-slate-100 focus:ring-red-400/30"
                                        : !priceOverride && customPrice
                                            ? "border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-amber-950/10 focus:ring-amber-500/30 focus:border-amber-500"
                                            : "border-slate-200 dark:border-slate-700 bg-slate-50 focus:ring-amber-500/30 focus:border-amber-500"
                                        }`}
                                />
                                {customPrice && (
                                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded ${priceOverride
                                        ? "bg-slate-100 dark:bg-slate-700 text-slate-500"
                                        : "bg-amber-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                        }`}>
                                        {priceOverride ? "manual" : "auto"}
                                    </span>
                                )}
                            </div>
                            {errors.price && <p className="text-xs text-slate-700 mt-1">{errors.price}</p>}
                            {!priceData && !priceError && Number(oilQty) > 0 && !loadingPrice && !customPrice && (
                                <p className="text-xs text-slate-700 mt-1 flex items-center gap-1">
                                    <IconAlertTriangle size={11} /> Menghitung harga...
                                </p>
                            )}
                            {priceError && !customPrice && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Isi harga manual di atas, atau perbaiki ingredient oil di master data.
                                </p>
                            )}
                        </div>

                        {/* Qty */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">Jumlah Botol</label>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                    <IconMinus size={14} />
                                </button>
                                <span className="text-xl font-black text-slate-800 dark:text-white w-8 text-center">{qty}</span>
                                <button onClick={() => setQty(q => Math.min(99, q + 1))}
                                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                    <IconPlus size={14} />
                                </button>
                                {finalPrice > 0 && qty > 1 && (
                                    <span className="text-sm text-slate-500 ml-2">= {fmt(finalPrice * qty)}</span>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">Catatan (opsional)</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                                placeholder="Misal: campuran khusus pelanggan, tambah bahan X..."
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 p-4 flex gap-2">
                        <button onClick={() => {
                            if (initialVariant) onClose();
                            else setStep(1);
                        }}
                            className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
                            ← Ganti Varian
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!isCompositionValid || finalPrice <= 0}
                            className={`flex-1 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${isCompositionValid && finalPrice > 0
                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                }`}>
                            <IconShoppingCart size={15} />
                            Tambah ke Keranjang {finalPrice > 0 && `· ${fmt(finalPrice * qty)}`}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
}

// ─── Intensity Modal (pilih intensitas setelah varian dipilih) ────────────────
function IntensityModal({ show, onClose, variant, intensities, loading, onSelect, onSelectCustom }) {
    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-xs text-slate-400 mb-0.5">Pilih Konsentrasi</p>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{variant?.name}</h3>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors">
                    <IconX size={16} />
                </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
                {loading ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Memuat konsentrasi...</span>
                    </div>
                ) : intensities.length === 0 ? (
                    <div className="py-12 text-center">
                        <IconAlertTriangle size={32} className="mx-auto mb-2 text-amber-400" />
                        <p className="text-sm text-slate-500">Tidak ada konsentrasi tersedia untuk varian ini</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                        {/* Opsi Custom Order (Komposisi Bebas) */}
                        <div className="mb-1 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <button onClick={() => { onSelectCustom(variant); onClose(); }}
                                className="group w-full relative p-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-amber-950/20 hover:border-slate-300 hover:bg-slate-100 text-left transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm flex-shrink-0">
                                        <IconAdjustments size={18} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-slate-700 dark:text-amber-200 text-sm">Komposisi Bebas</p>
                                        <span className="text-[10px] text-slate-700 dark:text-slate-300 block mt-0.5">Tentukan rasio ml minyak & alkohol sendiri</span>
                                    </div>
                                    <IconChevronRight size={14} className="text-slate-700 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>
                        </div>

                        {intensities.map((intensity, i) => {
                            const c = INTENSITY_COLORS[i % INTENSITY_COLORS.length];
                            const oilPct = parseFloat(intensity.oil_ratio) || 0;
                            return (
                                <button key={intensity.id} onClick={() => { onSelect(intensity); onClose(); }}
                                    className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${c.border} ${c.light} hover:shadow-md`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                            <IconFlask size={18} className="text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 dark:text-white text-sm">{intensity.name}</p>
                                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${c.light} ${c.text}`}>{intensity.code}</span>
                                        </div>
                                        <IconChevronRight size={14} className={`${c.text} flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity`} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] text-slate-500">
                                            <span>Kadar minyak</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{intensity.oil_ratio}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                                            <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${Math.min(oilPct, 100)}%` }} />
                                        </div>
                                        <div className="text-[11px] text-slate-400">Alkohol {intensity.alcohol_ratio}%</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ─── Size Modal ───────────────────────────────────────────────────────────────
function SizeModal({ show, onClose, variant, intensity, sizes, loading, onSelect }) {
    return (
        <Modal show={show} onClose={onClose} maxW="max-w-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-xs text-slate-400 mb-0.5">Pilih Ukuran</p>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug">
                        <span className="text-slate-700 dark:text-slate-300">{intensity?.code}</span> · {variant?.name}
                    </h3>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors">
                    <IconX size={16} />
                </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
                {loading ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Mengecek stok...</span>
                    </div>
                ) : sizes.length === 0 ? (
                    <div className="py-12 text-center">
                        <IconAlertTriangle size={32} className="mx-auto mb-2 text-amber-400" />
                        <p className="text-sm text-slate-500">Tidak ada ukuran tersedia</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2.5">
                        {sizes.map((size) => (
                            <button key={size.id} onClick={() => { onSelect(size); onClose(); }}
                                className="group flex flex-col items-center p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-primary-600 bg-white dark:bg-slate-800/50 hover:bg-slate-100/50 dark:hover:bg-primary-950/20 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-2 shadow-sm">
                                    <IconBottle size={18} className="text-white" />
                                </div>
                                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{size.volume_ml}</p>
                                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">ml</p>
                                {size.price != null && (
                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1.5 text-center">{fmt(size.price)}</p>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ─── Packaging Modal ──────────────────────────────────────────────────────────
function PackagingModal({ show, onClose, packagingMaterials = [], selectedPkgs = [], onToggle, onAddStandalone, isPendingMode = false, onSubmitPending = null, isSubmitting = false }) {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("addon");
    const filtered = useMemo(() => {
        if (!search) return packagingMaterials;
        return packagingMaterials.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) || (p.code ?? "").toLowerCase().includes(search.toLowerCase())
        );
    }, [packagingMaterials, search]);
    const PKG_BG_LIST = ["bg-orange-500", "bg-violet-500", "bg-rose-500", "bg-teal-500", "bg-sky-500", "bg-amber-500", "bg-indigo-500"];
    return (
        <Modal show={show} onClose={onClose} maxW="max-w-xl">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Kemasan Parfum</h3>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"><IconX size={16} /></button>
            </div>
            {!isPendingMode && (
                <div className="flex border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <button onClick={() => setActiveTab("addon")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${activeTab === "addon" ? "text-slate-700 border-b-2 border-primary-500" : "text-slate-400 hover:text-slate-600"}`}><IconPackage size={13} /> Kemasan Parfum Ini</button>
                    <button onClick={() => setActiveTab("standalone")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${activeTab === "standalone" ? "text-slate-700 border-b-2 border-orange-500" : "text-slate-400 hover:text-slate-600"}`}><IconBox size={13} /> Kemasan Satuan</button>
                </div>
            )}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Cari kemasan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                </div>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
                {filtered.map((pkg, idx) => {
                    const bg = PKG_BG_LIST[idx % PKG_BG_LIST.length];
                    const isOn = selectedPkgs.includes(pkg.id);
                    if (isPendingMode || activeTab === "addon") return (
                        <button key={pkg.id} onClick={() => onToggle(pkg.id)} className={`group flex items-center gap-3 p-3.5 mb-2 rounded-xl border-2 text-left transition-all w-full ${isOn ? "border-slate-300 bg-slate-100 dark:bg-primary-950/20" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50"}`}>
                            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><IconBox size={18} className="text-white" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{pkg.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {pkg.is_free ? <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-slate-800 text-slate-700 rounded font-black">GRATIS</span> : <span className="text-[10px] font-bold text-slate-700">+{fmt(pkg.selling_price)}</span>}
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isOn ? "bg-primary-500" : "bg-slate-100 dark:bg-slate-700"}`}>{isOn ? <IconCheck size={13} className="text-white" /> : <IconPlus size={13} className="text-slate-400" />}</div>
                        </button>
                    );
                    return (
                        <button key={pkg.id} onClick={() => { onAddStandalone(pkg); onClose(); }} className="group flex items-center gap-3 p-3.5 mb-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300 text-left transition-all w-full">
                            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><IconBox size={18} className="text-white" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{pkg.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {pkg.is_free ? <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-slate-700 rounded font-black">GRATIS</span> : <span className="text-[10px] font-bold text-slate-700">{fmt(pkg.selling_price)}</span>}
                                </div>
                            </div>
                            <IconPlus size={13} className="text-slate-400 group-hover:text-slate-700 flex-shrink-0" />
                        </button>
                    );
                })}
            </div>

            {isPendingMode && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50">
                    <button onClick={onSubmitPending} disabled={isSubmitting} className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50">
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <IconCheck size={18} />
                                Lanjut & Tambah ke Keranjang
                            </>
                        )}
                    </button>
                </div>
            )}
        </Modal>
    );
}

// ─── Eligible Promo Pop-up Modal ─────────────────────────────────────────────
function EligiblePromoModal({ show, promos = [], onClose, onPickReward, onAddDiscount }) {
    if (!show || promos.length === 0) return null;
    const promo = promos[0];
    const isRewardType = promo?.type === 'game_reward' || promo?.type === 'buy_x_get_y';
    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-3xl">{promo?.trigger === 'loyalty_points' ? '🏆' : '🎡'}</span>
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Selamat! Promo Tersedia 🎉</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Transaksi ini memenuhi syarat untuk:
                </p>
                <p className="text-base font-black text-slate-700 dark:text-slate-300 mb-4">{promo?.name}</p>
                {promo?.trigger === 'loyalty_points' && (
                    <p className="text-xs text-slate-400 mb-4">
                        Poin customer: <span className="font-bold text-slate-700">{promo.customer_points}</span> / {promo.points_needed} poin
                    </p>
                )}
                <p className="text-xs text-slate-400 mb-6">{promo?.description}</p>
                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition">
                        Abaikan
                    </button>
                    <button
                        onClick={() => { onClose(); if (isRewardType) onPickReward(promo); else onAddDiscount(promo); }}
                        className="flex-1 py-3 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30 transition">
                        {isRewardType ? 'Pilih Reward 🎁' : 'Ambil Promo'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─── Choose Reward Modal ──────────────────────────────────────────────────────
function ChooseRewardModal({ show, onClose, promo, variants = [], loadingVariants = false, onAddFreeItem }) {
    const rewards = promo?.rewards || [
        "P50 Selected Varian",
        "Atomizer",
        "Cashback",
        "Luxury Fragrance Travel Size",
        "Room Spray 100ml",
        "Pengharum Mobil"
    ];
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [search, setSearch] = useState("");
    const reward = promo?.rewards?.[0];
    const rewardLabel = reward?.intensity_code
        ? `P${reward.size_ml} ${reward.intensity_code} (pilih varian)`
        : promo?.name || 'Reward Gratis';

    const filtered = useMemo(() => {
        if (!search) return variants;
        return variants.filter(v => v.name.toLowerCase().includes(search.toLowerCase()) ||
            (v.code ?? '').toLowerCase().includes(search.toLowerCase()));
    }, [variants, search]);

    useEffect(() => { if (!show) { setSelectedVariant(null); setSearch(''); } }, [show]);

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-xs text-slate-400 mb-0.5">Reward Gratis</p>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="text-lg">🎁</span> {promo?.name}
                    </h3>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors">
                    <IconX size={16} />
                </button>
            </div>
            <div className="px-5 py-3 bg-slate-100 dark:bg-amber-950/20 border-b border-amber-100 dark:border-slate-700/40 flex-shrink-0">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    Hadiah: <span className="font-black">{rewardLabel}</span> — GRATIS!
                </p>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Cari varian parfum..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
            </div>
            <div className="overflow-y-auto p-4 flex-1 space-y-2">
                {loadingVariants ? (
                    <div className="py-10 flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Memuat varian...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">Tidak ada varian</div>
                ) : (
                    filtered.map((v, idx) => (
                        <button key={v.id} onClick={() => setSelectedVariant(v)}
                            className={`group w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                                selectedVariant?.id === v.id
                                    ? 'border-amber-500 bg-slate-100 dark:bg-amber-950/20'
                                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                            }`}>
                            <div className={`w-10 h-10 rounded-xl ${INTENSITY_COLORS[idx % INTENSITY_COLORS.length].bg} flex items-center justify-center flex-shrink-0`}>
                                <IconDroplet size={16} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{v.name}</p>
                                {v.code && <p className="text-[10px] text-slate-400 font-mono">{v.code}</p>}
                            </div>
                            {selectedVariant?.id === v.id && <IconCheck size={16} className="text-slate-700 flex-shrink-0" />}
                        </button>
                    ))
                )}
            </div>
            <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 p-4">
                <button
                    onClick={() => { if (selectedVariant) { onAddFreeItem(selectedVariant, promo); onClose(); } }}
                    disabled={!selectedVariant}
                    className={`w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                        selectedVariant
                            ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}>
                    <IconShoppingCart size={16} />
                    {selectedVariant ? `Tambah "${selectedVariant.name}" ke Keranjang (GRATIS)` : 'Pilih Varian Dulu'}
                </button>
            </div>
        </Modal>
    );
}

// ─── Game / Spin Wheel Modal ──────────────────────────────────────────────────
function GameRewardModal({ show, onClose, promo, onAddDirectReward, onOpenVariantPicker }) {
    // Build slices/options from promo rewards details
    const wheelItems = useMemo(() => {
        if (!promo) return [];
        const details = promo.rewards_details || promo.rewards || [];
        const list = [];
        details.forEach(reward => {
            if (reward.is_pool && reward.pools && reward.pools.length > 0) {
                reward.pools.forEach(pool => {
                    list.push({
                        ...pool,
                        parentReward: reward
                    });
                });
            } else {
                list.push({
                    ...reward,
                    label: reward.reward_type === 'points' 
                        ? `${reward.points_amount} Poin`
                        : reward.reward_type === 'reward_item' 
                            ? reward.reward_item_name || 'Merchandise'
                            : `Varian Parfum (P${reward.size_ml || '30'} ${reward.intensity_code || 'EDT'})`
                });
            }
        });
        return list;
    }, [promo]);

    const handleClaim = (item) => {
        if (!item) return;

        if (item.reward_type === 'variant') {
            onOpenVariantPicker(promo, item);
        } else {
            onAddDirectReward(item, promo);
        }
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-xs text-slate-400 mb-0.5">Pilih Hadiah Promo</p>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="text-lg">🎁</span> {promo?.name || "Pilih Hadiah"}
                    </h3>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors">
                    <IconX size={16} />
                </button>
            </div>

            <div className="px-5 py-3 bg-slate-100 dark:bg-amber-950/20 border-b border-amber-100 dark:border-slate-700/40 flex-shrink-0">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                    {promo?.description || "Silakan pilih hadiah di bawah ini untuk transaksi pelanggan."}
                </p>
            </div>

            {wheelItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">Tidak ada hadiah yang dapat dipilih.</div>
            ) : (
                <div className="p-6 flex-1 flex flex-col justify-center min-h-[250px] overflow-y-auto max-h-[360px]">
                    <div className="w-full space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Daftar Pilihan Hadiah</p>
                        {wheelItems.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleClaim(item)}
                                className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-500 hover:bg-slate-100/20 transition text-left group shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-slate-800 text-slate-700 flex items-center justify-center font-bold text-sm">
                                        {item.reward_type === 'points' ? '🪙' : item.reward_type === 'reward_item' ? '🎁' : '🧪'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</p>
                                        <p className="text-[10px] text-slate-400 capitalize">{item.reward_type}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                    Pilih →
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ─── Discount Modal ───────────────────────────────────────────────────────────
function DiscountModal({ show, onClose, discounts = [], subtotal = 0, onSelect, eligiblePromos = [], onPickReward }) {
    const [search, setSearch] = useState("");
    const [manualAmount, setManualAmount] = useState("");
    const eligibleIds = useMemo(() => new Set((eligiblePromos || []).map(p => p.id)), [eligiblePromos]);

    const filtered = useMemo(() => {
        if (!search) return discounts;
        return discounts.filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            (d.code ?? "").toLowerCase().includes(search.toLowerCase())
        );
    }, [discounts, search]);

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                    <IconTag size={20} className="text-slate-700" /> Pilih Diskon
                </h3>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"><IconX size={16} /></button>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Cari diskon atau voucher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
            </div>
            <div className="overflow-y-auto p-4 flex-1 space-y-2">
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 mb-4">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">Input Diskon Manual (Rp)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                            <input type="text" inputMode="numeric" value={toRupiahDisplay(manualAmount)} onChange={e => setManualAmount(parseRupiah(e.target.value).replace(/\D/g, ""))} placeholder="0" className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                        </div>
                        <button onClick={() => { const amt = Number(manualAmount) || 0; if (amt > 0) { onSelect({ id: "__manual__", name: "Diskon Manual", amount: amt }); onClose(); } }} disabled={!manualAmount || Number(manualAmount) <= 0} className="px-4 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl disabled:opacity-50 text-sm">Terapkan</button>
                    </div>
                </div>

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Diskon & Promo Tersedia</p>
                {filtered.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">Tidak ada diskon</div>
                ) : (
                    filtered.map(d => {
                        const isEligible = eligibleIds.has(d.id);
                        const isRewardType = d.type === 'game_reward' || d.type === 'buy_x_get_y';
                        let calcAmount = 0;
                        if (!isRewardType) {
                            if (d.type === 'percentage') {
                                calcAmount = subtotal * (d.value / 100);
                                if (d.max_discount_amount > 0 && calcAmount > d.max_discount_amount) calcAmount = d.max_discount_amount;
                            } else { calcAmount = d.value; }
                        }
                        const eligible = isEligible || (!d.min_purchase_amount || subtotal >= d.min_purchase_amount);
                        const eligiblePromo = (eligiblePromos || []).find(p => p.id === d.id);
                        return (
                            <button key={d.id} disabled={!eligible} onClick={() => {
                                if (isRewardType && isEligible && eligiblePromo) { onClose(); onPickReward && onPickReward(eligiblePromo); }
                                else if (!isRewardType) { onSelect({ ...d, amount: calcAmount }); onClose(); }
                            }} className={`group relative flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all w-full ${
                                isEligible ? 'border-slate-300 dark:border-amber-600 bg-slate-100/50 dark:bg-amber-950/20 hover:border-amber-500 shadow-sm'
                                : eligible ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                                : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 opacity-60 cursor-not-allowed'
                            }`}>
                                {isEligible && <span className="absolute -top-2 right-3 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full animate-pulse">✓ ELIGIBLE</span>}
                                <div className={`w-10 h-10 rounded-xl ${isEligible ? 'bg-amber-100 text-slate-700 dark:bg-slate-800' : eligible ? 'bg-emerald-100 text-slate-700 dark:bg-slate-800' : 'bg-slate-200 text-slate-400 dark:bg-slate-700'} flex items-center justify-center flex-shrink-0`}><IconTag size={18} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{d.name}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{d.description || (isRewardType ? 'Item Gratis' : d.type === 'percentage' ? `Diskon ${d.value}%` : `Potongan Rp ${d.value}`)}</p>
                                    {!eligible && <p className="text-[10px] text-slate-700 mt-1 font-bold">Minimal belanja: {fmt(d.min_purchase_amount)}</p>}
                                </div>
                                {eligible && <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-black text-slate-700">-{fmt(calcAmount)}</p>
                                </div>}
                            </button>
                        );
                    })
                )}
            </div>
        </Modal>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN INDEX
// ═══════════════════════════════════════════════════════════════════════════════
export default function Index({
    carts = [], carts_total = 0, heldCarts = [], intensities = [],
    customers = [], salesPeople = [], packagingMaterials = [],
    paymentMethods = [], discounts = [],
    storeId = null, storeName = null, error = null,
    activeCashDrawer = null,
    loyalty_reward_threshold = 30, loyalty_reward_description = "Free parfum P30 EDT + Botol",
    autoPromo = null,
}) {
    // ── State: customer & sales ────────────────────────────────────────────────
    const [localCustomers, setLocalCustomers] = useState(customers);
    useEffect(() => {
        setLocalCustomers(prev => {
            const map = new Map();
            prev.forEach(c => map.set(c.id, c));
            customers.forEach(c => map.set(c.id, c));
            return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
        });
    }, [customers]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
    const [salesSearch, setSalesSearch] = useState("");
    const [showSalesDropdown, setShowSalesDropdown] = useState(false);

    // ── State: payment ─────────────────────────────────────────────────────────
    const [selectedDiscount, setSelectedDiscount] = useState(null);
    const [cashInput, setCashInput] = useState("");
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [localAutoPromo, setLocalAutoPromo] = useState(autoPromo);

    useEffect(() => {
        setLocalAutoPromo(autoPromo);
    }, [autoPromo]);

    // ── State: cart ────────────────────────────────────────────────────────────
    const [custName, setCustName] = useState("");
    const [custPhone, setCustPhone] = useState("");
    const [custBirthDate, setCustBirthDate] = useState("");
    const [custGender, setCustGender] = useState("");
    const [removingId, setRemovingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [isHolding, setIsHolding] = useState(false);
    const [cartPackagings, setCartPackagings] = useState([]);

    // ── State: regular order builder ───────────────────────────────────────────
    const [selectedIntensity, setSelectedIntensity] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedPkgs, setSelectedPkgs] = useState([]);
    // Katalog varian POS
    const [catalogVariants, setCatalogVariants] = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [catalogSearch, setCatalogSearch] = useState("");
    const [catalogGender, setCatalogGender] = useState("all");
    // Intensitas untuk varian terpilih
    const [availableIntensities, setAvailableIntensities] = useState([]);
    const [loadingIntensities, setLoadingIntensities] = useState(false);
    const [showIntensityModal, setShowIntensityModal] = useState(false);
    // Ukuran
    const [availableSizes, setAvailableSizes] = useState([]);
    const [loadingSizes, setLoadingSizes] = useState(false);
    const [showSizeModal, setShowSizeModal] = useState(false);
    // Kemasan
    const [showPackagingModal, setShowPackagingModal] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [pendingOrder, setPendingOrder] = useState(null);

    // ── State: custom order ────────────────────────────────────────────────────
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customVariants, setCustomVariants] = useState([]);
    const [loadingCustomVariants, setLoadingCustomVariants] = useState(false);
    const [addingCustomToCart, setAddingCustomToCart] = useState(false);
    const [customTabVariant, setCustomTabVariant] = useState(null);

    // ── State: misc ────────────────────────────────────────────────────────────
    const [mobileView, setMobileView] = useState("catalog");
    const [leftTab, setLeftTab] = useState("parfum");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [pendingReward, setSelectedReward] = useState(null);

    // ── State: eligible promo / reward ─────────────────────────────────────────
    const [eligiblePromos, setEligiblePromos] = useState([]);
    const [showEligibleModal, setShowEligibleModal] = useState(false);
    const [shownEligibleIds, setShownEligibleIds] = useState(new Set());
    const [showChooseRewardModal, setShowChooseRewardModal] = useState(false);
    const [activePromoForReward, setActivePromoForReward] = useState(null);
    const [rewardVariants, setRewardVariants] = useState([]);
    const [loadingRewardVariants, setLoadingRewardVariants] = useState(false);

    // ── State: auto promo ──────────────────────────────────────────────────────
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [lastTriggeredPromoId, setLastTriggeredPromoId] = useState(null);
    const [showGameModal, setShowGameModal] = useState(false);
    const [activeGamePromo, setActiveGamePromo] = useState(null);
    const [chosenPoolRewardItem, setChosenPoolRewardItem] = useState(null);

    const customerRef = useRef(null);

    useEffect(() => { if (error) toast.error(error); }, [error]);

    // Effect untuk trigger promo otomatis
    useEffect(() => {
        if (autoPromo && autoPromo.id !== lastTriggeredPromoId) {
            setShowPromoModal(true);
            setLastTriggeredPromoId(autoPromo.id);

            // Suara notif pendek jika diinginkan
            // new Audio('/sounds/notification.mp3').play().catch(() => {});
        } else if (!autoPromo) {
            setLastTriggeredPromoId(null);
            setShowPromoModal(false);
        }
    }, [autoPromo, lastTriggeredPromoId]);
    useEffect(() => {
        if (paymentMethods.length > 0 && !selectedPaymentId) setSelectedPaymentId(paymentMethods[0].id);
    }, [paymentMethods]);
    useEffect(() => {
        const handler = (e) => {
            if (customerRef.current && !customerRef.current.contains(e.target)) setShowCustomerDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Derived ────────────────────────────────────────────────────────────────
    const discountAmount = useMemo(() => {
        if (!selectedDiscount) return 0;
        if (selectedDiscount.id === "__manual__") return selectedDiscount.amount ?? 0;
        if (selectedDiscount.type === 'percentage') {
            const base = (carts_total ?? 0) + cartPackagings.reduce((s, p) => s + (p.pkg.is_free ? 0 : Number(p.pkg.selling_price || 0)) * p.qty, 0);
            let amt = base * ((selectedDiscount.value ?? 0) / 100);
            if (selectedDiscount.max_discount_amount > 0 && amt > selectedDiscount.max_discount_amount) amt = selectedDiscount.max_discount_amount;
            return amt;
        }
        return selectedDiscount.amount ?? selectedDiscount.value ?? 0;
    }, [selectedDiscount, carts_total, cartPackagings]);
    const subtotal = useMemo(() => carts_total ?? 0, [carts_total]);
    const pkgCartTotal = useMemo(() => cartPackagings.reduce((s, p) => s + (p.pkg.is_free ? 0 : Number(p.pkg.selling_price || 0)) * p.qty, 0), [cartPackagings]);
    const payable = useMemo(() => Math.max(subtotal + pkgCartTotal - discountAmount, 0), [subtotal, pkgCartTotal, discountAmount]);
    const cartCount = useMemo(() => carts.reduce((t, i) => t + Number(i.qty), 0), [carts]);
    const pkgCartCount = useMemo(() => cartPackagings.reduce((s, p) => s + p.qty, 0), [cartPackagings]);
    const totalCartCount = cartCount + pkgCartCount;
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentId);
    const isCash = !selectedMethod || selectedMethod.type === "cash" || selectedMethod.can_give_change;
    const cash = useMemo(() => (isCash ? Math.max(0, Number(cashInput) || 0) : payable), [cashInput, isCash, payable]);
    const kembalian = Math.max(0, cash - payable);

    useEffect(() => { if (!isCash) setCashInput(String(payable)); }, [isCash, payable]);

    // (Obsolete frontend auto-promo calculation removed in favor of backend-driven engine)


    // Promo hadiah eligible diklaim lewat modal "Tambah Diskon / Voucher"
    // (baris PROMO TERSEDIA) dan popup otomatis — tanpa tombol khusus.

    // ── Effect: check eligible discounts when cart or customer changes ──────────
    const cartFingerprint = useMemo(() => carts.map(c => `${c.id}:${c.qty}`).join(','), [carts]);
    useEffect(() => {
        if (carts.length === 0) { setEligiblePromos([]); return; }
        const params = {};
        if (selectedCustomer?.id) params.customer_id = selectedCustomer.id;
        axios.get(route('transactions.check-eligible-discounts'), { params })
            .then(res => {
                if (res.data.success) {
                    const newEligible = res.data.data || [];
                    setEligiblePromos(newEligible);
                    const newPromo = newEligible.find(p => !shownEligibleIds.has(p.id));
                    if (newPromo) {
                        setShowEligibleModal(true);
                        setShownEligibleIds(prev => new Set([...prev, newPromo.id]));
                    }
                }
            })
            .catch(() => {});
    }, [cartFingerprint, selectedCustomer?.id]);

    // ── Fetch katalog varian POS ───────────────────────────────────────────────
    const fetchCatalogVariants = async () => {
        if (loadingCatalog || catalogVariants.length > 0) return;
        setLoadingCatalog(true);
        try {
            const res = await axios.get(route("transactions.get-variants-pos"));
            if (res.data.success) setCatalogVariants(res.data.data);
            else toast.error(res.data.message ?? "Gagal memuat varian");
        } catch { toast.error("Gagal memuat varian"); } finally { setLoadingCatalog(false); }
    };

    // Fetch intensitas untuk varian yang dipilih
    const fetchIntensities = async (variantId) => {
        setLoadingIntensities(true); setAvailableIntensities([]);
        try {
            const res = await axios.get(route("transactions.get-intensities"), { params: { variant_id: variantId } });
            if (res.data.success) setAvailableIntensities(res.data.data);
            else toast.error(res.data.message ?? "Gagal memuat konsentrasi");
        } catch { toast.error("Gagal memuat konsentrasi"); } finally { setLoadingIntensities(false); }
    };

    const fetchSizes = async (intensityId, variantId) => {
        setLoadingSizes(true); setAvailableSizes([]);
        try {
            const res = await axios.get(route("transactions.get-sizes"), { params: { intensity_id: intensityId, variant_id: variantId } });
            if (res.data.success) setAvailableSizes(res.data.data);
            else toast.error(res.data.message ?? "Gagal memuat ukuran");
        } catch { toast.error("Gagal memuat ukuran"); } finally { setLoadingSizes(false); }
    };

    // ── Fetch variants for custom order ────────────────────────────────────────
    const fetchCustomVariants = async () => {
        if (loadingCustomVariants) return;
        setLoadingCustomVariants(true);
        try {
            const res = await axios.get(route("transactions.get-variants-custom"));
            if (res.data.success) {
                setCustomVariants(res.data.data ?? []);
            } else {
                toast.error(res.data.message ?? "Gagal memuat varian");
            }
        } catch (err) {
            const status = err?.response?.status;
            const body = err?.response?.data;
            const msg = status === 404
                ? "Route tidak ditemukan (404). Pastikan route sudah didaftarkan."
                : status === 403 ? "Akses ditolak (403)."
                    : status === 500 ? (body?.message ?? "Server error (500). Cek log Laravel.")
                        : (body?.message ?? `Gagal memuat varian (${status ?? "network error"})`);
            toast.error(msg);
        } finally {
            setLoadingCustomVariants(false);
        }
    };

    // ── Custom order helpers ───────────────────────────────────────────────────
    const openCustomModal = () => {
        setCustomTabVariant(null);
        setShowCustomModal(true);
        if (customVariants.length === 0) fetchCustomVariants();
    };

    const openCustomModalWithVariant = (variant) => {
        setCustomTabVariant(variant);
        setShowCustomModal(true);
        if (customVariants.length === 0) fetchCustomVariants();
    };

    // ── Reward picker helpers ──────────────────────────────────────────────────
    const handleOpenRewardPicker = async (promo) => {
        const reward = promo?.rewards_details?.[0] || promo?.rewards?.[0];
        
        // If it's a game promo or has a pool, open GameRewardModal
        if (promo?.type === 'game_reward' || reward?.is_pool) {
            setActiveGamePromo(promo);
            setShowGameModal(true);
            return;
        }

        // If it's a direct reward (points or merchandise without pool), apply immediately
        if (reward && !reward.is_pool && reward.reward_type !== 'variant') {
            handleAddDirectReward(reward, promo);
            return;
        }

        // If it's a direct variant reward, show ChooseRewardModal
        setActivePromoForReward(promo);
        setShowChooseRewardModal(true);
        // Load variants if not already loaded (reuse catalog or fetch fresh)
        if (catalogVariants.length > 0) {
            setRewardVariants(catalogVariants);
        } else {
            setLoadingRewardVariants(true);
            try {
                const res = await axios.get(route('transactions.get-variants-pos'));
                if (res.data.success) setRewardVariants(res.data.data);
            } catch { toast.error('Gagal memuat varian'); }
            finally { setLoadingRewardVariants(false); }
        }
    };

    const handleAddDirectReward = (rewardOrPool, promo) => {
        if (!promo) return;
        const type = rewardOrPool?.reward_type;
        const label = type === 'points' 
            ? `${promo.name} - ${rewardOrPool.points_amount} Poin` 
            : `${promo.name} - ${rewardOrPool.reward_item_name || 'Merchandise'}`;

        router.post(route('transactions.add-reward-to-cart'), {
            discount_type_id: promo.id,
            reward_type: type,
            reward_item_id: rewardOrPool?.reward_item_id ?? null,
            points_amount: rewardOrPool?.points_amount ?? null,
            reward_label: label,
        }, {
            preserveScroll: true,
            onSuccess: () => toast.success(`✅ Reward "${label}" berhasil ditambahkan!`),
            onError: (err) => toast.error(Object.values(err)[0] ?? 'Gagal menambahkan reward'),
        });
    };

    const handleAddFreeItem = (variant, promo) => {
        if (!variant || !promo) return;
        const reward = chosenPoolRewardItem || promo?.rewards_details?.[0] || promo?.rewards?.[0];
        const label = `${promo.name} - ${variant.name}`;
        router.post(route('transactions.add-reward-to-cart'), {
            discount_type_id: promo.id,
            variant_id: variant.id,
            intensity_id: reward?.intensity_id ?? null,
            size_id: reward?.size_id ?? null,
            packaging_material_id: reward?.packaging_material_id ?? null,
            reward_label: label,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`✅ Item reward "${variant.name}" ditambahkan ke keranjang (GRATIS)!`);
                setChosenPoolRewardItem(null);
            },
            onError: (err) => toast.error(Object.values(err)[0] ?? 'Gagal menambahkan reward'),
        });
    };

    // Load katalog varian saat tab parfum aktif
    useEffect(() => {
        if (leftTab === "parfum" && catalogVariants.length === 0) fetchCatalogVariants();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leftTab]);

    // ── Regular order builder (alur: Varian → Intensitas → Ukuran) ─────────────
    const selectCatalogVariant = (variant) => {
        setSelectedVariant(variant);
        setSelectedIntensity(null);
        setAvailableIntensities([]);
        setAvailableSizes([]);
        setSelectedPkgs([]);
        setShowIntensityModal(true);
        fetchIntensities(variant.id);
    };

    const selectIntensity = (intensity) => {
        setSelectedIntensity(intensity);
        setAvailableSizes([]);
        setTimeout(() => setShowSizeModal(true), 80);
        fetchSizes(intensity.id, selectedVariant.id);
    };

    const selectSize = (size) => {
        if (!selectedIntensity || !selectedVariant) { toast.error("Lengkapi pilihan"); return; }

        const payload = {
            intensity_id: selectedIntensity.id, variant_id: selectedVariant.id,
            size_id: size.id, qty: 1
        };

        setSelectedPkgs([]);
        setShowSizeModal(false);
        submitPendingOrder({ type: "regular", payload });
    };

    // ── Custom order handler ───────────────────────────────────────────────────
    const handleCustomConfirm = (payload) => {
        setSelectedPkgs([]);
        setShowCustomModal(false);
        submitPendingOrder({ type: "custom", payload });
    };

    const handleApplyReward = (rewardName) => {
        const name = rewardName.toLowerCase();

        // 1. Jika reward mengandung "Spin Wheel", buka modal spin
        if (name.includes("spin wheel")) {
            toast.success("Silakan lakukan Spin Wheel! 🎡");
            // setOpenSpinModal(true); 
            return;
        }

        // 2. Jika reward adalah produk (misal: "P30 EDT" atau "P10 EDT")
        if (name.includes("p30") || name.includes("p10") || name.includes("parfum") || name.includes("item")) {
            toast.loading(`Menyiapkan ${rewardName}...`);
            // Beritahu user untuk memilih varian lewat katalog
            setSelectedCategory("parfum");
            setCatalogSearch("");
            setSelectedReward({ name: rewardName, is_free: true });
            toast.dismiss();
            toast.info(`Silakan pilih varian Parfum untuk hadiah: ${rewardName}. Harga akan menjadi Rp 0.`, { duration: 5000 });
        } else {
            toast.success(`Reward "${rewardName}" terpilih!`);
        }
    };

    const submitPendingOrder = (overrideOrder = null) => {
        if (!activeCashDrawer) {
            toast.error("Silakan buka shift terlebih dahulu!");
            return;
        }
        const order = overrideOrder || pendingOrder;
        if (!order) return;

        const isCustom = order.type === "custom";
        const finalPayload = {
            ...order.payload,
            packaging_ids: selectedPkgs,
            is_free: pendingReward?.is_free || false
        };

        const stateSetter = isCustom ? setAddingCustomToCart : setAddingToCart;
        const submitRoute = isCustom ? "transactions.add-custom-to-cart" : "transactions.add-to-cart";
        const successMsg = pendingReward?.is_free ? `Hadiah ${pendingReward.name} ditambahkan!` : (isCustom ? "Custom order ditambahkan ke keranjang!" : "Ditambahkan ke keranjang!");

        stateSetter(true);
        router.post(route(submitRoute), finalPayload, {
            preserveScroll: true, preserveState: true, only: ["carts", "carts_total"],
            onSuccess: () => {
                toast.success(successMsg);
                if (!isCustom) {
                    setSelectedIntensity(null); setSelectedVariant(null);
                    setAvailableIntensities([]); setAvailableSizes([]);
                }
                setSelectedPkgs([]);
                setSelectedReward(null);
                stateSetter(false);
                // Kembali ke halaman katalog (landing Parfume/Botol/Kemasan) setelah item masuk keranjang.
                setSelectedCategory(null);
                setMobileView("catalog");
                setPendingOrder(null);
                setShowPackagingModal(false);
            },
            onError: (errs) => {
                const msg = typeof errs === "object" ? Object.values(errs)[0] : (errs?.message || "Gagal menambahkan");
                toast.error(msg); stateSetter(false);
            },
        });
    };

    const handleClosePackagingModal = () => {
        if (pendingOrder) {
            submitPendingOrder();
        } else {
            setShowPackagingModal(false);
        }
    };

    const togglePkg = (pkgId) => setSelectedPkgs(prev => prev.includes(pkgId) ? prev.filter(id => id !== pkgId) : [...prev, pkgId]);

    // ── Cart actions ───────────────────────────────────────────────────────────
    const handleUpdateQty = (cartId, newQty) => {
        if (newQty < 1) return;
        setUpdatingId(cartId);
        router.patch(route("transactions.update-cart", cartId), { qty: newQty }, {
            preserveScroll: true, preserveState: true, only: ["carts", "carts_total"],
            onFinish: () => setUpdatingId(null),
        });
    };

    const handleRemove = (cartId) => {
        const item = carts.find(c => c.id === cartId);
        if (item && (item.is_game_reward || item.points_amount !== null)) {
            setLastTriggeredPromoId(null);
        }
        setRemovingId(cartId);
        router.delete(route("transactions.destroy-cart", cartId), {
            preserveScroll: true, preserveState: true, only: ["carts", "carts_total"],
            onSuccess: () => { toast.success("Item dihapus"); setRemovingId(null); },
            onError: () => { toast.error("Gagal menghapus"); setRemovingId(null); },
        });
    };

    const handleHold = () => {
        if (!carts.length) { toast.error("Keranjang kosong"); return; }
        setIsHolding(true);
        router.post(route("transactions.hold"), { label: "Hold " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }, {
            preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "heldCarts"],
            onSuccess: () => { toast.success("Transaksi ditahan"); setIsHolding(false); setCartPackagings([]); },
            onFinish: () => setIsHolding(false),
        });
    };

    const handleResume = (holdId) => router.post(route("transactions.resume", holdId), {}, { preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "heldCarts"] });
    const handleDeleteHeld = (holdId) => { if (!confirm("Hapus transaksi yang ditahan?")) return; router.delete(route("transactions.delete-held", holdId), { preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "heldCarts"] }); };

    const handleAddPkg = (pkg) => {
        setCartPackagings(prev => {
            const idx = prev.findIndex(p => p.pkg.id === pkg.id);
            if (idx >= 0) return prev.map((p, i) => i === idx ? { ...p, qty: p.qty + 1 } : p);
            return [...prev, { pkg, qty: 1 }];
        });
        toast.success(`${pkg.name} ditambahkan`);
        // Kembali ke halaman katalog (landing Parfume/Botol/Kemasan) setelah item masuk keranjang.
        setSelectedCategory(null);
        setMobileView("catalog");
    };

    const handleUpdatePkgQty = (pkgId, delta) =>
        setCartPackagings(prev => prev.map(p => p.pkg.id === pkgId ? { ...p, qty: Math.max(0, p.qty + delta) } : p).filter(p => p.qty > 0));

    const handleCheckout = () => { if (!carts.length && !cartPackagings.length) { toast.error("Keranjang kosong"); return; } setShowPaymentModal(true); };

    const handleSubmit = () => {
        if (!selectedSalesPerson?.id) { toast.error("Sales wajib dipilih!"); return; }
        if (isCash && cash < payable) { toast.error("Jumlah bayar kurang dari total"); return; }
        setIsSubmitting(true);
        router.post(route("transactions.store"), {
            customer_id: selectedCustomer?.id ?? null,
            sales_person_id: selectedSalesPerson?.id ?? null,
            payment_method_id: selectedPaymentId,
            discount_type_id: selectedDiscount?.id !== "__manual__" ? (selectedDiscount?.id ?? null) : null,
            discount_amount: discountAmount, cash_amount: isCash ? cash : null,
            standalone_packagings: cartPackagings.map(p => ({ packaging_material_id: p.pkg.id, qty: p.qty })),
        }, { onError: (errs) => { setIsSubmitting(false); toast.error(errs?.message || "Gagal menyimpan transaksi"); } });
    };

    const handleStoreCustomer = (e) => {
        e.preventDefault();
        if (!custName) { toast.error("Nama pelanggan wajib diisi"); return; }
        setIsSubmitting(true);
        axios.post(route("customers.store-ajax"), {
            name: custName,
            phone: custPhone,
            birth_date: custBirthDate,
            gender: custGender,
        }).then((res) => {
            setIsSubmitting(false);
            setShowAddCustomer(false);
            setCustName("");
            setCustPhone("");
            setCustBirthDate("");
            setCustGender("");
            toast.success("Pelanggan berhasil ditambahkan");
            
            const newCust = res.data.customer;
            setLocalCustomers(prev => [newCust, ...prev]);
            setSelectedCustomer(newCust);
        }).catch((err) => {
            setIsSubmitting(false);
            const errs = err.response?.data?.errors;
            toast.error(errs?.phone?.[0] || errs?.name?.[0] || "Gagal menambah pelanggan");
        });
    };

    const getCartItemTotal = (item) => {
        const pkgTotal = (item.packagings ?? []).reduce((s, p) => s + Number(p.unit_price || 0) * Number(p.qty || 1), 0);
        return (Number(item.unit_price || 0) + pkgTotal / (item.qty || 1)) * Number(item.qty || 1);
    };

    const filteredCustomers = useMemo(() => {
        const list = customerSearch ? localCustomers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone ?? "").includes(customerSearch)) : localCustomers;
        return list.slice(0, 8);
    }, [customers, customerSearch]);

    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <>
            <Head title="Transaksi POS" />

            {/* Modals — alur baru: Varian → Intensitas → Ukuran → Kemasan */}
            <IntensityModal show={showIntensityModal} onClose={() => setShowIntensityModal(false)} variant={selectedVariant} intensities={availableIntensities} loading={loadingIntensities} onSelect={selectIntensity} onSelectCustom={openCustomModalWithVariant} />
            <SizeModal show={showSizeModal} onClose={() => setShowSizeModal(false)} variant={selectedVariant} intensity={selectedIntensity} sizes={availableSizes} loading={loadingSizes} onSelect={selectSize} />
            <CustomOrderModal
                show={showCustomModal}
                onClose={() => { setShowCustomModal(false); setCustomTabVariant(null); }}
                variants={customVariants}
                loading={loadingCustomVariants}
                onConfirm={handleCustomConfirm}
                initialVariant={customTabVariant}
            />

            <GameRewardModal
                show={showPromoModal}
                onClose={() => setShowPromoModal(false)}
                promo={autoPromo}
                onAddDirectReward={handleAddDirectReward}
                onOpenVariantPicker={(promo, poolItem) => {
                    setActivePromoForReward(promo);
                    if (catalogVariants.length > 0) {
                        setRewardVariants(catalogVariants);
                    }
                    setChosenPoolRewardItem(poolItem);
                    setShowChooseRewardModal(true);
                }}
            />

            <GameRewardModal
                show={showGameModal}
                onClose={() => setShowGameModal(false)}
                promo={activeGamePromo}
                onAddDirectReward={handleAddDirectReward}
                onOpenVariantPicker={(promo, poolItem) => {
                    setActivePromoForReward(promo);
                    if (catalogVariants.length > 0) {
                        setRewardVariants(catalogVariants);
                    }
                    setChosenPoolRewardItem(poolItem);
                    setShowChooseRewardModal(true);
                }}
            />

            {/* Loading overlay */}
            {(addingToCart || addingCustomToCart) && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl">
                        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm font-bold text-slate-700 dark:text-white">
                            {addingCustomToCart ? "Menambahkan custom order..." : "Menambahkan ke keranjang..."}
                        </p>
                    </div>
                </div>
            )}

            <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Mobile tab bar */}
                <div className="md:hidden flex-shrink-0 flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => setMobileView("catalog")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${mobileView === "catalog" ? "text-slate-700 border-b-2 border-primary-500" : "text-slate-400"}`}>
                        <IconFlask size={14} /> Katalog
                    </button>
                    <button onClick={() => setMobileView("cart")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors relative ${mobileView === "cart" ? "text-slate-700 border-b-2 border-primary-500" : "text-slate-400"}`}>
                        <IconShoppingCart size={14} /> Keranjang
                        {totalCartCount > 0 && <span className="absolute top-2 right-[20%] w-4 h-4 bg-primary-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{totalCartCount > 9 ? "9+" : totalCartCount}</span>}
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* ── LEFT: Catalog ────────────────────────────────────── */}
                    <div className={`flex-1 flex flex-col overflow-hidden ${mobileView === "catalog" ? "flex" : "hidden md:flex"}`}>
                        {/* ── Header & Back Button ── */}
                        {selectedCategory && (
                            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                    >
                                        <IconArrowLeft size={18} />
                                    </button>
                                    <h1 className="font-black text-slate-800 dark:text-white text-base capitalize">
                                        {selectedCategory === 'packaging' ? 'Botol' : selectedCategory === 'spunbond' ? 'Kemasan' : selectedCategory}
                                    </h1>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                    Pilih Item
                                </div>
                            </div>
                        )}

                        {/* ── Category Selection View ── */}
                        {!selectedCategory && (
                            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {/* Card Parfum */}
                                    <button onClick={() => setSelectedCategory('parfum')} className="group relative p-4 rounded-2xl border-2 text-left transition-all border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                                                <IconFlask size={20} className="text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-slate-800 dark:text-white text-sm leading-tight">Parfume</p>
                                                <span className="text-[10px] text-slate-400 mt-0.5 block">Varian, konsentrasi, ukuran</span>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black flex-shrink-0 bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                                                Katalog
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <span className="text-[11px] text-slate-400 font-semibold">+ Pilih →</span>
                                        </div>
                                    </button>

                                    {/* Card Kemasan */}
                                    <button onClick={() => setSelectedCategory('packaging')} className="group relative p-4 rounded-2xl border-2 text-left transition-all border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                                                <IconBox size={20} className="text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-slate-800 dark:text-white text-sm leading-tight">Botol</p>
                                                <span className="text-[10px] text-slate-400 mt-0.5 block">Botol, tutup spray, aksesoris</span>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black flex-shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                                                Katalog
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <span className="text-[11px] text-slate-400 font-semibold">+ Pilih →</span>
                                        </div>
                                    </button>

                                    {/* Card Spunbond */}
                                    <button onClick={() => setSelectedCategory('spunbond')} className="group relative p-4 rounded-2xl border-2 text-left transition-all border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                                                <IconShoppingBag size={20} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-slate-800 dark:text-white text-sm leading-tight">Kemasan</p>
                                                <span className="text-[10px] text-slate-400 mt-0.5 block">Tas spunbond eksklusif</span>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black flex-shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                Katalog
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <span className="text-[11px] text-slate-400 font-semibold">+ Pilih →</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── TAB PARFUM Content ── */}
                        {selectedCategory === "parfum" && (
                            <div className="flex-1 overflow-y-auto p-4">
                                {/* Search + filter gender */}
                                <div className="flex gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="Cari varian..." value={catalogSearch}
                                            onChange={e => setCatalogSearch(e.target.value)}
                                            className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white" />
                                    </div>
                                    <div className="flex gap-1">
                                        {["all", "male", "female"].map(g => (
                                            <button key={g} onClick={() => setCatalogGender(g)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${catalogGender === g ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                                                    }`}>
                                                {g === "all" ? "Semua" : g === "male" ? "Pria" : "Wanita"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {loadingCatalog ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-sm">Memuat katalog...</span>
                                    </div>
                                ) : (() => {
                                    const filtered = catalogVariants.filter(v => {
                                        const matchSearch = !catalogSearch ||
                                            v.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                                            (v.code ?? "").toLowerCase().includes(catalogSearch.toLowerCase());
                                        const matchGender = catalogGender === "all" || v.gender === catalogGender;
                                        return matchSearch && matchGender;
                                    });
                                    return filtered.length === 0 && !loadingCatalog ? (
                                        <div className="flex flex-col items-center justify-center py-16">
                                            <IconAlertTriangle size={28} className="text-amber-400 mb-2" />
                                            <p className="font-semibold text-slate-500 text-sm">Tidak ada varian ditemukan</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
                                            {filtered.map((variant, idx) => {
                                                const genderColor = variant.gender === "male"
                                                    ? "bg-blue-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                    : variant.gender === "female"
                                                        ? "bg-pink-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                        : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300";
                                                const accentBg = INTENSITY_COLORS[idx % INTENSITY_COLORS.length].bg;
                                                return (
                                                    <button key={variant.id} onClick={() => selectCatalogVariant(variant)}
                                                        className="group relative p-4 rounded-2xl border-2 text-left transition-all border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-primary-600 hover:shadow-md">
                                                        <div className="flex items-start gap-2 mb-3">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-black text-slate-800 dark:text-white text-sm leading-tight">{variant.name}</p>
                                                                {variant.code && <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{variant.code}</span>}
                                                            </div>
                                                            {variant.gender && (
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black flex-shrink-0 ${genderColor}`}>
                                                                    {GENDER_LABEL[variant.gender] ?? variant.gender}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-end">
                                                            <span className="text-[11px] text-slate-400 font-semibold">+ Pilih →</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}

                                            {/* Card Custom Order */}
                                            <button onClick={openCustomModal}
                                                className="group relative p-4 rounded-2xl border-2 border-dashed text-left transition-all border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-amber-950/20 hover:border-slate-300 dark:hover:border-amber-600 hover:shadow-md">
                                                <div className="flex items-start gap-2 mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-slate-700 dark:text-amber-200 text-sm leading-tight">Komposisi Bebas</p>
                                                        <span className="text-[10px] text-slate-700/70 font-mono mt-0.5 block">CUSTOM</span>
                                                    </div>
                                                    <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm flex-shrink-0">
                                                        <IconAdjustments size={16} className="text-white" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    <span className="text-[11px] text-slate-700 font-semibold">+ Buat →</span>
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* ── TAB KEMASAN / SPUNBOND Content ── */}
                        {(selectedCategory === "packaging" || selectedCategory === "spunbond") && (
                            <div className="flex-1 overflow-y-auto p-4">
                                {(() => {
                                    const items = packagingMaterials.filter(pkg => {
                                        const isSpunbond = pkg.name.toLowerCase().includes('kresek') || pkg.name.toLowerCase().includes('spunbond');
                                        return selectedCategory === 'spunbond' ? isSpunbond : !isSpunbond;
                                    });

                                    return items.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16">
                                            <IconBox size={28} className="text-slate-300 dark:text-slate-600 mb-3" />
                                            <p className="font-semibold text-slate-500">Belum ada item di kategori ini</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[11px] text-slate-400 mb-3 uppercase tracking-wider font-bold">
                                                Klik item untuk menambahkan langsung ke keranjang
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                                                {items.map((pkg, i) => {
                                                    const bg = ["bg-orange-500", "bg-violet-500", "bg-rose-500", "bg-teal-500", "bg-sky-500", "bg-amber-500", "bg-indigo-500"][i % 7];
                                                    const inCart = cartPackagings.find(p => p.pkg.id === pkg.id);
                                                    return (
                                                        <button key={pkg.id} onClick={() => handleAddPkg(pkg)}
                                                            className={`group relative flex flex-col rounded-2xl border-2 text-left overflow-hidden transition-all ${inCart ? "border-orange-400 dark:border-orange-600 ring-2 ring-orange-500/20 bg-slate-50 dark:bg-orange-950/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md"}`}>

                                                            {/* Gambar besar — aspect persegi, object-contain agar botol utuh */}
                                                            <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                                {pkg.image_url ? (
                                                                    <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-contain p-2" />
                                                                ) : (
                                                                    <div className={`w-full h-full ${bg} flex items-center justify-center`}>
                                                                        <IconBox size={44} className="text-white/90" />
                                                                    </div>
                                                                )}
                                                                {inCart && (
                                                                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-black bg-orange-500 text-white shadow-sm">
                                                                        {inCart.qty}x
                                                                    </span>
                                                                )}
                                                                {pkg.is_free && !inCart && (
                                                                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-sm">
                                                                        GRATIS
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex flex-col gap-1 p-3">
                                                                <p className="font-black text-slate-800 dark:text-white text-sm leading-tight line-clamp-2">{pkg.name}</p>
                                                                {pkg.code && <span className="text-[10px] text-slate-400 font-mono">{pkg.code}</span>}
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                                                                        {pkg.is_free ? "Rp 0" : fmt(pkg.selling_price)}
                                                                    </span>
                                                                    <span className="text-[11px] text-orange-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">+ Tambah</span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Cart ───────────────────────────────────────── */}
                    <div className={`w-full md:w-[340px] lg:w-[400px] xl:w-[460px] flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 ${mobileView === "cart" ? "flex" : "hidden md:flex"}`}>
                        {/* Sales Person & Pelanggan dipindah ke halaman Pembayaran */}

                        {/* Held carts */}
                        {heldCarts.length > 0 && (
                            <div className="flex-shrink-0 border-b border-slate-100 dark:border-slate-800 px-3 py-2 bg-slate-100 dark:bg-amber-950/20">
                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1"><IconClock size={10} /> Ditahan ({heldCarts.length})</p>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {heldCarts.map(h => (
                                        <div key={h.hold_id} className="flex-shrink-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
                                            <div><p className="text-xs font-bold text-slate-800 dark:text-white">{h.label}</p><p className="text-xs text-slate-400">{fmt(h.total)}</p></div>
                                            <button onClick={() => handleResume(h.hold_id)} className="text-xs text-slate-700 font-bold hover:underline">Lanjut</button>
                                            <button onClick={() => handleDeleteHeld(h.hold_id)} className="text-red-400 hover:text-slate-700"><IconX size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cart header */}
                        <div className="flex-shrink-0 px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <IconShoppingCart size={11} /> Keranjang
                                {totalCartCount > 0 && <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-black">{totalCartCount}</span>}
                            </p>
                            {carts.length > 0 && (
                                <button onClick={handleHold} disabled={isHolding} className="text-[11px] text-slate-700 font-bold flex items-center gap-1 px-2 py-1 hover:bg-slate-100 dark:hover:bg-amber-950/30 rounded-lg transition-colors">
                                    <IconClock size={11} /> Tahan
                                </button>
                            )}
                        </div>

                        {/* Pelanggan (dipindah dari halaman pembayaran ke atas keranjang) */}
                        <div className="flex-shrink-0 px-3 py-2 border-b border-slate-100 dark:border-slate-800 relative" ref={customerRef}>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><IconUser size={10} /> Pelanggan</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="text" placeholder="Cari / pilih pelanggan (No. Telepon)..."
                                        value={selectedCustomer ? (selectedCustomer.phone || selectedCustomer.name) : customerSearch}
                                        onClick={() => { if (selectedCustomer) { setSelectedCustomer(null); setCustomerSearch(""); } setShowCustomerDropdown(true); }}
                                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); if (selectedCustomer) setSelectedCustomer(null); }}
                                        className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                    />
                                </div>
                                <button onClick={() => setShowAddCustomer(true)} className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-primary-950/30 text-slate-700 flex items-center justify-center hover:bg-primary-100 flex-shrink-0" title="Tambah Pelanggan Baru">
                                    <IconUserPlus size={15} />
                                </button>
                            </div>
                            {selectedCustomer && (
                                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                    <p className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1"><IconCheck size={11} /> {selectedCustomer.phone || selectedCustomer.name}</p>
                                    {Number(selectedCustomer.points ?? 0) > 0 && <span className="text-[10px] text-slate-500 font-bold">{Number(selectedCustomer.points).toLocaleString("id-ID")} poin</span>}
                                    {Number(selectedCustomer.points ?? 0) >= loyalty_reward_threshold && <span className="ml-auto text-[10px] font-black text-amber-600">🏆 Reward tersedia</span>}
                                </div>
                            )}
                            {showCustomerDropdown && !selectedCustomer && (
                                <div className="absolute top-full left-3 right-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30 overflow-hidden max-h-44 overflow-y-auto">
                                    <button onClick={() => { setSelectedCustomer({ id: null, name: "Pelanggan Umum" }); setShowCustomerDropdown(false); setCustomerSearch(""); }} className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800">👤 Pelanggan Umum (Walk-in)</button>
                                    {filteredCustomers.map(c => (
                                        <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(""); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                            <p className="font-semibold text-xs text-slate-800 dark:text-white">{c.phone || "Tanpa No. HP"}</p>
                                            <p className="text-[10px] text-slate-400">{c.name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
                            {carts.length === 0 && cartPackagings.length === 0 ? (
                                <div className="py-10 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><IconShoppingCart size={22} className="text-slate-300 dark:text-slate-600" /></div>
                                    <p className="text-sm font-semibold text-slate-400">Keranjang kosong</p>
                                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Pilih parfum dari katalog</p>
                                </div>
                            ) : (
                                <>
                                    {carts.map(item => {
                                        const isPointReward = item.points_amount !== null && item.points_amount !== undefined;
                                        return (
                                            <div key={item.id} className={`rounded-xl p-3 transition-opacity ${removingId === item.id ? "opacity-40" : ""} ${isPointReward ? "bg-slate-100 dark:bg-emerald-950/20 border border-emerald-100 dark:border-slate-700/50 animate-pulse" : item.is_custom_order ? "bg-slate-100 dark:bg-amber-950/20 border border-amber-100 dark:border-slate-700/50" : "bg-slate-50 dark:bg-slate-800/60"}`}>
                                                <div className="flex items-start gap-2.5">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${isPointReward ? "bg-emerald-500" : item.is_custom_order ? "bg-amber-500" : "bg-gradient-to-br from-primary-500 to-primary-700"}`}>
                                                        {isPointReward ? <IconStar size={15} className="text-white" /> : item.is_custom_order ? <IconAdjustments size={15} className="text-white" /> : <IconBottle size={15} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        {isPointReward ? (
                                                            <>
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">
                                                                        {item.notes ?? `Reward: +${item.points_amount} Poin`}
                                                                    </p>
                                                                </div>
                                                                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 font-bold">
                                                                    Poin ditambahkan otomatis setelah checkout
                                                                </p>
                                                                <div className="flex items-center justify-between mt-1.5">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="w-7 text-left text-sm font-bold text-slate-500 dark:text-slate-400">Qty: {item.qty}</span>
                                                                    </div>
                                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                                                                        🎁 GRATIS
                                                                    </span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">{item.variant?.name ?? "Parfum Custom"}</p>
                                                                    {item.is_custom_order && <span className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-slate-700 dark:text-amber-200 text-[9px] font-black rounded flex-shrink-0">CUSTOM</span>}
                                                                </div>
                                                                {item.is_custom_order ? (
                                                                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                                                                        {item.custom_oil_qty}ml oil · {item.custom_alcohol_qty ?? 0}ml alkohol
                                                                        <span className="ml-1.5 px-1 py-0.5 bg-emerald-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-black rounded">alkohol gratis</span>
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                                        <span className="font-semibold text-slate-700">{item.intensity?.code}</span> · {item.size?.volume_ml}ml
                                                                    </p>
                                                                )}
                                                                {(item.packagings ?? []).length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {item.packagings.map((p, pi) => (
                                                                            <span key={pi} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${p.packaging_material?.is_free ? "bg-emerald-100 dark:bg-slate-800 text-slate-700" : "bg-orange-100 dark:bg-slate-800 text-slate-700"}`}>
                                                                                {p.packaging_material?.name ?? "Kemasan"}{p.packaging_material?.is_free && " 🎁"}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center justify-between mt-1.5">
                                                                    <div className="flex items-center gap-1">
                                                                        <button onClick={() => handleUpdateQty(item.id, item.qty - 1)} disabled={item.qty <= 1 || updatingId === item.id} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"><IconMinus size={10} /></button>
                                                                        <span className="w-7 text-center text-sm font-bold text-slate-800 dark:text-white">{item.qty}</span>
                                                                        <button onClick={() => handleUpdateQty(item.id, item.qty + 1)} disabled={updatingId === item.id} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"><IconPlus size={10} /></button>
                                                                    </div>
                                                                    {Number(item.unit_price) === 0 ? (
                                                                        <div className="flex flex-col items-end">
                                                                            {Number(item.original_price ?? 0) > 0 && (
                                                                                <span className="text-xs text-slate-400 dark:text-slate-500 line-through font-semibold">
                                                                                    {fmt(Number(item.original_price) * item.qty)}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                                🎁 GRATIS
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <p className={`text-sm font-black ${item.is_custom_order ? "text-slate-700 dark:text-slate-300" : "text-slate-700 dark:text-slate-300"}`}>{fmt(getCartItemTotal(item))}</p>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <button onClick={() => handleRemove(item.id)} disabled={removingId === item.id} className="p-1.5 text-slate-300 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0"><IconTrash size={13} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Kemasan standalone */}
                                    {cartPackagings.length > 0 && (
                                        <>
                                            {carts.length > 0 && <div className="flex items-center gap-2 py-0.5"><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><IconPackage size={9} /> Kemasan</span><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" /></div>}
                                            {cartPackagings.map(({ pkg, qty }, i) => (
                                                <div key={pkg.id} className="bg-slate-100 dark:bg-orange-950/20 border border-orange-100 dark:border-slate-700/50 rounded-xl p-3 flex items-center gap-2.5">
                                                    <div className={`w-9 h-9 rounded-xl ${PKG_BG[i % PKG_BG.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}><IconBox size={15} className="text-white" /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{pkg.name}</p>
                                                            {pkg.is_free && <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-slate-800 text-slate-700 text-[9px] font-black rounded flex-shrink-0">GRATIS</span>}
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1.5">
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => handleUpdatePkgQty(pkg.id, -1)} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"><IconMinus size={10} /></button>
                                                                <span className="w-7 text-center text-sm font-bold text-slate-800 dark:text-white">{qty}</span>
                                                                <button onClick={() => handleUpdatePkgQty(pkg.id, 1)} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"><IconPlus size={10} /></button>
                                                            </div>
                                                            <p className={`text-sm font-black ${pkg.is_free ? "text-slate-700" : "text-slate-700"}`}>{pkg.is_free ? "GRATIS" : fmt((pkg.is_free ? 0 : Number(pkg.selling_price || 0)) * qty)}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleUpdatePkgQty(pkg.id, -qty)} className="p-1.5 text-slate-300 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0"><IconTrash size={13} /></button>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {packagingMaterials.length > 0 && (
                                        <button onClick={() => setShowPackagingModal(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-100/50 transition-all text-left">
                                            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0"><IconPackage size={15} className="text-slate-700" /></div>
                                            <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tambah Kemasan Satuan</p><p className="text-[10px] text-slate-400 mt-0.5">{packagingMaterials.length} jenis tersedia</p></div>
                                            <IconChevronRight size={13} className="text-orange-300 flex-shrink-0" />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Summary + checkout */}
                        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2.5">
                            <button onClick={() => setShowDiscountModal(true)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all relative ${selectedDiscount ? "border-slate-300 bg-slate-100 dark:bg-emerald-950/30" : "border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-100/50"}`}>
                                {eligiblePromos.length > 0 && !selectedDiscount && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-amber-500/40 animate-bounce">
                                        {eligiblePromos.length}
                                    </span>
                                )}
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedDiscount ? "bg-emerald-100 dark:bg-slate-800" : "bg-slate-100 dark:bg-slate-800"}`}><IconTag size={13} className={selectedDiscount ? "text-slate-700" : "text-slate-400"} /></div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className={`text-xs font-bold truncate ${selectedDiscount ? "text-slate-700 dark:text-slate-300" : "text-slate-500"}`}>{selectedDiscount ? selectedDiscount.name : "Tambah Diskon / Voucher"}</p>
                                    {selectedDiscount && <p className="text-[10px] text-slate-700 font-semibold">-{fmt(selectedDiscount.amount)}</p>}
                                    {eligiblePromos.length > 0 && !selectedDiscount && <p className="text-[9px] text-slate-700 font-black animate-pulse">PROMO TERSEDIA!</p>}
                                </div>
                                {selectedDiscount ? <button onClick={e => { e.stopPropagation(); setSelectedDiscount(null); }} className="p-0.5 text-slate-400 hover:text-slate-700 flex-shrink-0"><IconX size={13} /></button> : <IconChevronRight size={13} className="text-slate-300 flex-shrink-0" />}
                            </button>


                            <div className="space-y-1">
                                {subtotal > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Parfum</span><span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(subtotal)}</span></div>}
                                {pkgCartTotal > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Kemasan</span><span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(pkgCartTotal)}</span></div>}
                                {discountAmount > 0 && <div className="flex justify-between text-xs"><span className="text-slate-700 dark:text-slate-300">Diskon</span><span className="text-slate-700 font-bold">-{fmt(discountAmount)}</span></div>}
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span className="font-black text-slate-800 dark:text-white text-sm">Total</span>
                                    <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{fmt(payable)}</span>
                                </div>
                            </div>

                            <button onClick={handleCheckout} disabled={!totalCartCount}
                                className={`w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${totalCartCount ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}>
                                <IconReceipt size={16} />
                                {totalCartCount ? `Bayar ${fmt(payable)}` : "Keranjang Kosong"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Halaman Pembayaran (full-screen, bukan modal) ───────────────── */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950">
                    {/* Header halaman — slim */}
                    <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-2">
                        <button onClick={() => setShowPaymentModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors" title="Kembali ke keranjang">
                            <IconArrowLeft size={18} />
                        </button>
                        <h1 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                            <IconReceipt size={16} className="text-primary-600" /> Pembayaran
                        </h1>
                        <span className="ml-auto text-lg font-black text-primary-600">{fmt(payable)}</span>
                    </div>

                    {/* Body — selalu 2 kolom (juga di tab kecil) agar tidak perlu scroll */}
                    <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                        <div className="mx-auto max-w-4xl grid grid-cols-3 gap-2 sm:gap-3">
                            {/* ── Kolom kanan (kecil): Sales (Pelanggan dipindah ke atas keranjang) ── */}
                            <div className="col-span-1 order-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2.5 h-fit">
                                {/* Sales Person (wajib) */}
                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><IconUser size={10} /> Sales <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="text" placeholder="Pilih Sales..."
                                            value={selectedSalesPerson ? selectedSalesPerson.name : salesSearch}
                                            onClick={() => { if (selectedSalesPerson) { setSelectedSalesPerson(null); setSalesSearch(""); } setShowSalesDropdown(true); }}
                                            onChange={e => { setSalesSearch(e.target.value); setShowSalesDropdown(true); if (selectedSalesPerson) setSelectedSalesPerson(null); }}
                                            className={`w-full h-9 pl-8 pr-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white bg-slate-50 dark:bg-slate-800 ${selectedSalesPerson ? "border-slate-200 dark:border-slate-700" : "border-red-200 dark:border-red-900/50"}`}
                                        />
                                    </div>
                                    {showSalesDropdown && !selectedSalesPerson && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-30 overflow-hidden max-h-44 overflow-y-auto">
                                            {salesPeople.filter(s => s.name.toLowerCase().includes(salesSearch.toLowerCase())).map(s => (
                                                <button key={s.id} onClick={() => { setSelectedSalesPerson(s); setShowSalesDropdown(false); setSalesSearch(""); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                    <p className="font-semibold text-xs text-slate-800 dark:text-white">{s.name}</p>
                                                    <p className="text-[10px] text-slate-400">{s.code}</p>
                                                </button>
                                            ))}
                                            {salesPeople.length === 0 && <p className="p-3 text-center text-xs text-slate-400">Belum ada sales</p>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Kolom kiri (besar): Metode & tunai ── */}
                            <div className="col-span-2 order-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2.5 h-fit">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Metode Pembayaran</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {paymentMethods.map(method => (
                                            <button key={method.id} onClick={() => setSelectedPaymentId(method.id)}
                                                className={`px-3 py-2 rounded-lg border-2 text-left transition-all flex items-center justify-between gap-1 ${selectedPaymentId === method.id ? "border-primary-500 bg-slate-100 dark:bg-primary-950/30" : "border-slate-200 dark:border-slate-700"}`}>
                                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300 truncate">{method.name}</span>
                                                {selectedPaymentId === method.id && <IconCheck size={14} className="text-primary-600 flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {isCash && (
                                    <div className="space-y-2 pt-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nominal Cepat</p>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {[payable, Math.ceil(payable / 10000) * 10000, Math.ceil(payable / 50000) * 50000, Math.ceil(payable / 100000) * 100000]
                                                .filter((v, i, a) => a.indexOf(v) === i && v >= payable).slice(0, 4)
                                                .map(amt => (
                                                    <button key={amt} onClick={() => setCashInput(String(amt))}
                                                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${Number(cashInput) === amt ? "bg-primary-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                                                        {(amt / 1000).toLocaleString("id-ID")}rb
                                                    </button>
                                                ))}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                            <input type="text" inputMode="numeric" value={cashInput} onChange={e => setCashInput(e.target.value.replace(/\D/g, ""))} placeholder="Jumlah diterima"
                                                className="w-full h-11 pl-10 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-lg font-black focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                                        </div>
                                        {cash >= payable && payable > 0 && (
                                            <div className="flex justify-between items-center px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-slate-700 rounded-lg">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Kembalian</span>
                                                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{fmt(kembalian)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer sticky */}
                    <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-2.5">
                        {discountAmount > 0 && (
                            <div className="mx-auto max-w-4xl flex justify-end gap-3 text-[11px] text-slate-500 mb-1.5">
                                <span>{selectedDiscount?.name || "Diskon"}: <span className="font-bold text-slate-700 dark:text-slate-300">-{fmt(discountAmount)}</span></span>
                            </div>
                        )}
                        <div className="mx-auto max-w-4xl flex items-center gap-2">
                            <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2.5 rounded-lg border-2 border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Kembali</button>
                            <button onClick={handleSubmit} disabled={(isCash && cash < payable) || isSubmitting || !selectedPaymentId}
                                className={`flex-1 py-2.5 rounded-lg font-black text-sm flex items-center justify-center gap-2 transition-all ${(!isCash || cash >= payable) && !isSubmitting && selectedPaymentId ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}>
                                {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memproses...</> : <><IconReceipt size={15} /> Selesaikan · {fmt(payable)}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Eligible Promo & Reward Modals ────────────────────────────── */}
            <EligiblePromoModal
                show={showEligibleModal}
                promos={eligiblePromos}
                onClose={() => setShowEligibleModal(false)}
                onPickReward={handleOpenRewardPicker}
                onAddDiscount={(promo) => {
                    let obj = { ...promo };
                    if (promo.type === 'percentage') {
                        obj.amount = subtotal * (promo.value / 100);
                        if (promo.max_discount_amount > 0 && obj.amount > promo.max_discount_amount) obj.amount = promo.max_discount_amount;
                    } else { obj.amount = promo.value || 0; }
                    setSelectedDiscount(obj);
                    toast.success(`Promo "${promo.name}" diterapkan!`);
                }}
            />

            <ChooseRewardModal
                show={showChooseRewardModal}
                onClose={() => { setShowChooseRewardModal(false); setChosenPoolRewardItem(null); }}
                promo={activePromoForReward}
                variants={rewardVariants}
                loadingVariants={loadingRewardVariants}
                onAddFreeItem={handleAddFreeItem}
            />

            <DiscountModal
                show={showDiscountModal}
                onClose={() => setShowDiscountModal(false)}
                discounts={discounts}
                subtotal={subtotal + pkgCartTotal}
                onSelect={setSelectedDiscount}
                eligiblePromos={eligiblePromos}
                onPickReward={handleOpenRewardPicker}
            />

            {/* ── Auto Promo Modal ───────────────────────────────────────────── */}
            <Modal show={localAutoPromo !== null} onClose={() => {
                if (localAutoPromo) setDismissedPromos(prev => [...prev, localAutoPromo.id]);
                setLocalAutoPromo(null);
            }} maxW="max-w-md">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm border-4 border-white dark:border-slate-900">
                        <span className="text-3xl">🎁</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 leading-tight">Selamat! Promo Tersedia 🎉</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">
                        Pelanggan telah memenuhi syarat untuk mendapatkan <span className="font-bold text-slate-700 dark:text-slate-300">{localAutoPromo?.name}</span>.
                        {Number(localAutoPromo?.min_purchase_amount) > 0 && <span className="block mt-1 text-xs text-slate-400">Syarat minimal belanja {fmt(localAutoPromo?.min_purchase_amount)} telah tercapai.</span>}
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (localAutoPromo) setDismissedPromos(prev => [...prev, localAutoPromo.id]);
                                setLocalAutoPromo(null);
                            }}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex justify-center items-center gap-2">
                            Abaikan
                        </button>
                        <button
                            onClick={() => {
                                if (localAutoPromo?.rewards && localAutoPromo.rewards.length > 0) {
                                    // Jika ada reward pilihan (item/pool), buka modal game/spin-wheel
                                    setActiveGamePromo(localAutoPromo);
                                    setShowGameModal(true);
                                    setLocalAutoPromo(null);
                                } else {
                                    // Hitung amount dari diskon (disamakan dengan format selectedDiscount)
                                    let obj = { ...localAutoPromo };
                                    if (localAutoPromo?.type === 'percentage') {
                                        obj.amount = (subtotal + pkgCartTotal) * (localAutoPromo.value / 100);
                                        if (localAutoPromo.max_discount_amount > 0 && obj.amount > localAutoPromo.max_discount_amount) {
                                            obj.amount = localAutoPromo.max_discount_amount;
                                        }
                                    } else {
                                        obj.amount = localAutoPromo?.value || 0;
                                    }

                                    setSelectedDiscount(obj);
                                    setLocalAutoPromo(null);
                                    toast.success(`Promo ${localAutoPromo?.name} berhasil diterapkan!`);
                                }
                            }}
                            className="flex-1 py-3 rounded-xl font-black text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition flex justify-center items-center gap-2">
                            Ambil Promo
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Add Customer Modal ─────────────────────────────────────────── */}
            <Modal show={showAddCustomer} onClose={() => setShowAddCustomer(false)} maxW="max-w-md">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <IconUserPlus size={18} className="text-slate-700" />
                        Tambah Pelanggan Baru
                    </h3>
                    <button onClick={() => setShowAddCustomer(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"><IconX size={16} /></button>
                </div>
                <form onSubmit={handleStoreCustomer} className="p-5 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Nama Lengkap *</label>
                        <input
                            type="text" value={custName} onChange={e => setCustName(e.target.value)}
                            placeholder="Contoh: Budi Santoso"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Nomor WhatsApp / HP</label>
                        <input
                            type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)}
                            placeholder="Contoh: 08123456789"
                            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Tgl Lahir</label>
                            <input
                                type="date" value={custBirthDate} onChange={e => setCustBirthDate(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Jenis Kelamin</label>
                            <select
                                value={custGender} onChange={e => setCustGender(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                            >
                                <option value="">Pilih...</option>
                                <option value="male">Laki-laki</option>
                                <option value="female">Perempuan</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setShowAddCustomer(false)} className="flex-1 h-11 rounded-xl border-2 border-slate-100 font-bold text-slate-500 hover:bg-slate-50 transition-all text-sm">Batal</button>
                        <button type="submit" disabled={isSubmitting || !custName} className="flex-[2] h-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-black text-sm transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50">
                            {isSubmitting ? "Menyimpan..." : "Simpan Pelanggan"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

Index.layout = page => <POSLayout children={page} />;
