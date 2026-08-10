import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import axios from "axios";
import toast from "react-hot-toast";
import { HugeiconsIcon } from "@hugeicons/react";
import { PerfumeIcon, Package01Icon, ShoppingCart01Icon, CreditCardIcon, QrCodeIcon, Money03Icon, ShoppingBag02Icon } from "@hugeicons/core-free-icons";
import POSLayout from "@/Layouts/POSLayout";
import CategoryIcon from "@/Components/Dashboard/CategoryIcon";
import ButtonBayar from "@/Components/POS/ButtonBayar";
import Alert, { showAlert } from "@/Components/Alert";
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
// Set true untuk menampilkan kembali opsi "Komposisi Bebas" (custom order)
const SHOW_KOMPOSISI_BEBAS = false;

function IntensityModal({ show, onClose, variant, intensities, loading, onSelect, onSelectCustom, selectedIntensity }) {
    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            {/* Header */}
            <div className="px-[20px] py-[14px] border-b border-[#e8e8e8] dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex flex-col gap-[2px] items-start">
                    <p className="text-[14px] font-medium text-[#64748b] dark:text-slate-400 leading-[1.4]">
                        Pilih Konsentrasi
                    </p>
                    <h3 className="font-semibold text-[#1e293b] dark:text-white text-[16px] leading-[1.4]">
                        {variant?.name}
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="size-[36px] bg-[#f1f5f9] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[16px] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                    <IconX size={16} />
                </button>
            </div>

            {/* Options Body */}
            <div className="p-[16px] overflow-y-auto flex-1 max-h-[70vh]">
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
                    <div className="flex flex-col gap-[10px]">
                        {/* Opsi Custom Order (Komposisi Bebas) */}
                        {SHOW_KOMPOSISI_BEBAS && (
                            <button
                                type="button"
                                onClick={() => { onSelectCustom(variant); onClose(); }}
                                className="bg-white dark:bg-slate-900 border-2 border-dashed border-[#e8e8e8] dark:border-slate-800 rounded-[6px] p-[14px] flex items-center justify-between hover:border-amber-400 transition-all text-left cursor-pointer w-full group"
                            >
                                <div className="flex items-center gap-[10px]">
                                    <div className="bg-amber-100 dark:bg-amber-950/40 px-[8px] py-[4px] rounded-full text-amber-700 dark:text-amber-300 text-[12px] font-bold">
                                        CUSTOM
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#0f172a] dark:text-white text-[15px]">Komposisi Bebas</p>
                                        <p className="text-[12px] text-[#64748b] dark:text-slate-400">Tentukan rasio ml minyak & alkohol sendiri</p>
                                    </div>
                                </div>
                                <IconChevronRight size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                            </button>
                        )}

                        {/* List Konsentrasi (EDT, EDP, Extrait, Pure, dll) */}
                        {intensities.map((intensity) => {
                            const oNum = parseFloat(intensity.oil_ratio) || 0;
                            const aNum = parseFloat(intensity.alcohol_ratio) || 0;
                            const isSelected = selectedIntensity?.id === intensity.id;
                            const isPure = (intensity.name ?? "").toLowerCase().includes("pure") || aNum === 0;

                            // Calculate actual percentage of oil bar width (ratio parts or percentages)
                            let oilPct = 0;
                            if (isPure) {
                                oilPct = 100;
                            } else if (oNum > 0 || aNum > 0) {
                                const totalParts = oNum + aNum;
                                oilPct = (oNum / totalParts) * 100;
                            }

                            // Format simplified ratio text (e.g. 1:2, 1:1, 2:1, 1:0)
                            let ratioText = `${oNum}:${aNum}`;
                            if (isPure) {
                                ratioText = "1:0";
                            } else if (oNum > 0 && aNum > 0) {
                                const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));
                                const oInt = Math.round(oNum);
                                const aInt = Math.round(aNum);
                                const d = gcd(oInt, aInt);
                                ratioText = d > 0 ? `${oInt / d}:${aInt / d}` : `${oInt}:${aInt}`;
                            }

                            return (
                                <button
                                    key={intensity.id}
                                    type="button"
                                    onClick={() => { onSelect(intensity); onClose(); }}
                                    className={`flex flex-col gap-[12px] p-[14px] rounded-[6px] relative text-left transition-all group cursor-pointer w-full bg-white dark:bg-slate-900 ${
                                        isSelected
                                            ? "border-[1.5px] border-[#54b8c3] shadow-sm"
                                            : "border border-[#e8e8e8] dark:border-slate-800 hover:border-[#54b8c3] dark:hover:border-teal-500 hover:shadow-sm"
                                    }`}
                                >
                                    {/* Head */}
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-[6px] flex-1 min-w-0">
                                            <div className="bg-[#f7f7f7] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 px-[6px] py-[2px] rounded-full shrink-0">
                                                <span className="text-[12px] font-medium text-[#64748b] dark:text-slate-300 leading-[1.4]">
                                                    {intensity.code}
                                                </span>
                                            </div>
                                            <p className="font-semibold text-[#0f172a] dark:text-white text-[16px] leading-[1.4] truncate">
                                                {intensity.name}
                                            </p>
                                        </div>
                                        {isSelected ? (
                                            <div className="bg-[#54b8c3] border border-[#3ebdcb] size-[20px] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
                                                <IconCheck size={12} stroke={3} />
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-800 border-[1.5px] border-[#cbd5e1] dark:border-slate-600 size-[20px] rounded-full shrink-0 group-hover:border-[#54b8c3] transition-colors" />
                                        )}
                                    </div>

                                    {/* Ratio & Legend */}
                                    <div className="flex flex-col gap-[8px] w-full">
                                        <div className="flex items-center justify-between text-[12px] leading-[16px]">
                                            <div className="flex items-center gap-[6px]">
                                                <span className="size-[8px] rounded-full bg-[#54b8c3] inline-block shrink-0" />
                                                <span className="text-[#64748b] dark:text-slate-400">Kadar minyak</span>
                                            </div>
                                            <span className="font-semibold text-[#0f172a] dark:text-white">
                                                {ratioText}
                                            </span>
                                            <div className="flex items-center gap-[6px]">
                                                <span className="text-[#64748b] dark:text-slate-400">Alkohol</span>
                                                <span className="size-[8px] rounded-full bg-[#cbd5e1] dark:bg-slate-600 inline-block shrink-0" />
                                            </div>
                                        </div>

                                        {/* Progress bar mix with diagonal striped line fill for minyak */}
                                        <div className="bg-[#cbd5e1] dark:bg-slate-800 flex items-center rounded-full w-full h-[8px] overflow-hidden">
                                            <div
                                                className="h-[8px] rounded-full transition-all"
                                                style={{
                                                    width: `${Math.min(Math.max(oilPct, 0), 100)}%`,
                                                    background: "repeating-linear-gradient(135deg, #54b8c3, #54b8c3 4px, #42a4af 4px, #42a4af 8px)",
                                                }}
                                            />
                                        </div>
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
function SizeModal({ show, onClose, onBack, variant, intensity, sizes, loading, onSelect }) {
    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            {/* Header */}
            <div className="px-[20px] py-[16px] border-b border-[#e8e8e8] dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-[10px]">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            aria-label="Kembali ke pilih konsentrasi"
                            className="size-[32px] rounded-[10px] bg-[#f1f5f9] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                        >
                            <IconArrowLeft size={16} />
                        </button>
                    )}
                    <div className="flex flex-col gap-[2px] items-start">
                        <p className="text-[14px] font-medium text-[#64748b] dark:text-slate-400 leading-[1.4]">
                            Pilih Ukuran
                        </p>
                        <h3 className="font-semibold text-[#0f172a] dark:text-white text-[16px] leading-[1.4]">
                            {intensity?.code ? `${intensity.code} · ` : ""}{variant?.name}
                        </h3>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="size-[36px] bg-[#f1f5f9] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[16px] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
                >
                    <IconX size={16} />
                </button>
            </div>

            {/* Options Body */}
            <div className="p-[16px] overflow-y-auto flex-1 max-h-[70vh]">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                        {sizes.map((size) => (
                            <button
                                key={size.id}
                                type="button"
                                onClick={() => { onSelect(size); onClose(); }}
                                className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex gap-[14px] items-center p-[12px] rounded-[8px] text-left hover:border-[#54b8c3] dark:hover:border-teal-500 hover:shadow-sm transition-all group cursor-pointer w-full"
                            >
                                {/* Category Icon dengan Hugeicons PerfumeIcon */}
                                <CategoryIcon
                                    icon={
                                        <HugeiconsIcon
                                            icon={PerfumeIcon}
                                            size={20}
                                            color="currentColor"
                                            strokeWidth={1.5}
                                        />
                                    }
                                    variant="teal"
                                    size="size-[40px]"
                                />

                                {/* Text Area */}
                                <div className="flex flex-col gap-[2px] items-start min-w-0 flex-1">
                                    <div className="flex items-baseline gap-[3px]">
                                        <span className="font-medium text-[#0f172a] dark:text-white text-[14px] leading-[1.4]">
                                            {size.volume_ml}
                                        </span>
                                        <span className="font-normal text-[#94a3b8] dark:text-slate-400 text-[12px] leading-[16px]">
                                            ml
                                        </span>
                                    </div>
                                    {size.price != null && (
                                        <p className="font-semibold text-[#0f172a] dark:text-white text-[16px] leading-[1.4]">
                                            {fmt(size.price)}
                                        </p>
                                    )}
                                </div>
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
    const filtered = useMemo(() => {
        if (!search) return packagingMaterials;
        return packagingMaterials.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) || (p.code ?? "").toLowerCase().includes(search.toLowerCase())
        );
    }, [packagingMaterials, search]);

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-lg">
            {/* Header */}
            <div className="px-[20px] py-[16px] h-[60px] border-b border-[#e8e8e8] dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-[#0f172a] dark:text-white text-[16px] leading-[1.4]">
                    Kemasan Parfum
                </h3>
                <button
                    type="button"
                    onClick={onClose}
                    className="size-[36px] bg-[#f1f5f9] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[16px] flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
                >
                    <IconX size={16} />
                </button>
            </div>

            {/* Filter Search */}
            <div className="px-[16px] pt-[12px] pb-[4px] shrink-0">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-[12px] top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari kemasan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-[36px] pl-[34px] pr-[12px] rounded-[8px] border border-[#e8e8e8] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-800 text-[13px] text-[#0f172a] dark:text-white focus:outline-none focus:border-[#54b8c3] transition-colors"
                    />
                </div>
            </div>

            {/* Options List */}
            <div className="p-[16px] overflow-y-auto flex-1 max-h-[70vh]">
                {filtered.length === 0 ? (
                    <div className="py-12 text-center">
                        <IconAlertTriangle size={32} className="mx-auto mb-2 text-amber-400" />
                        <p className="text-sm text-slate-500">Tidak ada kemasan ditemukan</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                        {filtered.map((pkg) => {
                            const isOn = selectedPkgs.includes(pkg.id);
                            const isFree = pkg.is_free || parseFloat(pkg.selling_price ?? pkg.price ?? 0) === 0;
                            const nameLower = (pkg.name || "").toLowerCase();
                            const isBag = nameLower.includes("bag") || nameLower.includes("kresek") || nameLower.includes("plastik") || nameLower.includes("tas");
                            const cardIcon = isBag ? Package01Icon : PerfumeIcon;

                            if (isPendingMode) {
                                return (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => onToggle(pkg.id)}
                                        className={`bg-white dark:bg-slate-900 flex gap-[14px] items-center p-[12px] rounded-[8px] text-left transition-all group cursor-pointer w-full ${
                                            isOn
                                                ? "border-[1.5px] border-[#54b8c3] shadow-sm"
                                                : "border border-[#e8e8e8] dark:border-slate-800 hover:border-[#54b8c3] dark:hover:border-teal-500 hover:shadow-sm"
                                        }`}
                                    >
                                        <CategoryIcon
                                            icon={
                                                <HugeiconsIcon
                                                    icon={cardIcon}
                                                    size={20}
                                                    color="currentColor"
                                                    strokeWidth={1.5}
                                                />
                                            }
                                            variant="teal"
                                            size="size-[40px]"
                                        />
                                        <div className="flex flex-col gap-[2px] items-start min-w-0 flex-1 overflow-hidden">
                                            <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[1.4] whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                                {pkg.name}
                                            </p>
                                            {isFree ? (
                                                <p className="font-medium text-[#0f894d] dark:text-emerald-400 text-[12px] leading-[1.4]">
                                                    GRATIS
                                                </p>
                                            ) : (
                                                <p className="font-medium text-[#0f172a] dark:text-white text-[12px] leading-[1.4]">
                                                    {fmt(pkg.selling_price ?? pkg.price)}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            }

                            return (
                                <button
                                    key={pkg.id}
                                    type="button"
                                    onClick={() => { onAddStandalone(pkg); onClose(); }}
                                    className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex gap-[14px] items-center p-[12px] rounded-[8px] text-left hover:border-[#54b8c3] dark:hover:border-teal-500 hover:shadow-sm transition-all group cursor-pointer w-full"
                                >
                                    <CategoryIcon
                                        icon={
                                            <HugeiconsIcon
                                                icon={cardIcon}
                                                size={20}
                                                color="currentColor"
                                                strokeWidth={1.5}
                                            />
                                        }
                                        variant="teal"
                                        size="size-[40px]"
                                    />
                                    <div className="flex flex-col gap-[2px] items-start min-w-0 flex-1 overflow-hidden">
                                        <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[1.4] whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                            {pkg.name}
                                        </p>
                                        {isFree ? (
                                            <p className="font-medium text-[#0f894d] dark:text-emerald-400 text-[12px] leading-[1.4]">
                                                GRATIS
                                            </p>
                                        ) : (
                                            <p className="font-medium text-[#0f172a] dark:text-white text-[12px] leading-[1.4]">
                                                {fmt(pkg.selling_price ?? pkg.price)}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Pending Mode */}
            {isPendingMode && (
                <div className="p-[16px] border-t border-[#e8e8e8] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900 shrink-0">
                    <button
                        type="button"
                        onClick={onSubmitPending}
                        disabled={isSubmitting}
                        className="w-full h-[44px] rounded-[8px] bg-[#36adba] hover:bg-[#2c9ca8] text-white font-semibold text-[14px] transition-all flex items-center justify-center gap-[8px] cursor-pointer shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

// ─── Discount Modal (1:1 Figma Node 3420:18770) ──────────────────────────────
function DiscountModal({ show, onClose, discounts = [], subtotal = 0, onSelect, eligiblePromos = [], onPickReward }) {
    const [search, setSearch] = useState("");
    const [manualAmount, setManualAmount] = useState("");
    const eligibleIds = useMemo(() => new Set((eligiblePromos || []).map(p => p.id)), [eligiblePromos]);

    const filtered = useMemo(() => {
        if (!search.trim()) return discounts;
        const q = search.toLowerCase();
        return discounts.filter(d =>
            d.name.toLowerCase().includes(q) ||
            (d.code ?? "").toLowerCase().includes(q)
        );
    }, [discounts, search]);

    const { availablePromos, unavailablePromos } = useMemo(() => {
        const available = [];
        const unavailable = [];
        filtered.forEach(d => {
            const isEligible = eligibleIds.has(d.id);
            const isRewardType = d.type === 'game_reward' || d.type === 'buy_x_get_y';
            const eligible = isRewardType ? isEligible : (!d.min_purchase_amount || subtotal >= d.min_purchase_amount);
            if (eligible) {
                available.push(d);
            } else {
                unavailable.push(d);
            }
        });
        return { availablePromos: available, unavailablePromos: unavailable };
    }, [filtered, eligibleIds, subtotal]);

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-lg">
            <div className="bg-white dark:bg-slate-900 rounded-[12px] border border-[#e8e8e8] dark:border-slate-800 overflow-hidden flex flex-col w-full shadow-2xl">
                {/* Header (1:1 Figma Node 3420:18771) */}
                <div className="h-[60px] px-[20px] py-[16px] border-b border-[#e8e8e8] dark:border-slate-800 flex items-center justify-between shrink-0">
                    <p className="font-semibold text-[16px] text-[#0f172a] dark:text-white leading-[1.4]">
                        Pilih Diskon
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="size-[36px] bg-[#f1f5f9] dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#64748b] dark:text-slate-400 rounded-[16px] flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <IconX size={16} />
                    </button>
                </div>

                {/* Body Form (1:1 Figma Node 3420:18777) */}
                <div className="p-[20px] flex flex-col gap-[16px] overflow-y-auto max-h-[80vh]">
                    {/* Search Bar (1:1 Figma Node 3420:18870) */}
                    <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-700 flex gap-[8px] h-[37px] items-center px-[10px] py-[8px] rounded-[8px] w-full">
                        <IconSearch size={16} className="text-[#64748b] dark:text-slate-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Cari diskon atau voucher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-0 text-[12px] text-[#0f172a] dark:text-white placeholder-[#64748b] dark:placeholder-slate-400 focus:outline-none focus:ring-0 p-0 leading-[1.4]"
                        />
                    </div>

                    {/* Input Diskon Manual (1:1 Figma Node 3420:18876) */}
                    <div className="bg-[#fbfbfb] dark:bg-slate-800/40 border border-[#e8e8e8] dark:border-slate-800 flex gap-[10px] items-end px-[16px] py-[10px] rounded-[12px] w-full">
                        <div className="flex-1 flex flex-col gap-[8px]">
                            <p className="font-semibold text-[14px] text-[#0f172a] dark:text-white leading-[1.4]">
                                Input Diskon Manual (Rp)
                            </p>
                            <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-700 flex h-[37px] items-center px-[12px] py-[8px] rounded-[8px] w-full">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={toRupiahDisplay(manualAmount)}
                                    onChange={(e) => setManualAmount(parseRupiah(e.target.value).replace(/\D/g, ""))}
                                    placeholder="Masukkan diskon manual"
                                    className="w-full bg-transparent border-0 text-[12px] text-[#0f172a] dark:text-white placeholder-[#64748b] dark:placeholder-slate-400 focus:outline-none focus:ring-0 p-0 leading-[1.4]"
                                />
                            </div>
                        </div>

                        <ButtonBayar
                            type="button"
                            label="Terapkan"
                            payable={0}
                            onClick={() => {
                                const amt = Number(manualAmount) || 0;
                                if (amt > 0) {
                                    onSelect({ id: "__manual__", name: "Diskon Manual", amount: amt });
                                    onClose();
                                }
                            }}
                            disabled={!manualAmount || Number(manualAmount) <= 0}
                            variant={manualAmount && Number(manualAmount) > 0 ? "teal" : "teal"}
                            className="!w-auto shrink-0 h-[37px] px-5"
                        />
                    </div>

                    {/* Diskon & Promo Tersedia (1:1 Figma Node 3442:18853) */}
                    <div className="flex flex-col gap-[10px] w-full">
                        <p className="font-semibold text-[14px] text-[#0f172a] dark:text-white leading-[1.4]">
                            Diskon & Promo Tersedia
                        </p>
                        {availablePromos.length === 0 ? (
                            <p className="py-4 text-center text-xs text-[#64748b] dark:text-slate-400">
                                Tidak ada promo tersedia
                            </p>
                        ) : (
                            <div className="flex flex-col gap-[8px] w-full">
                                {availablePromos.map((d) => {
                                    const isEligible = eligibleIds.has(d.id);
                                    const isRewardType = d.type === 'game_reward' || d.type === 'buy_x_get_y';
                                    let calcAmount = 0;
                                    if (!isRewardType) {
                                        if (d.type === 'percentage') {
                                            calcAmount = subtotal * (d.value / 100);
                                            if (d.max_discount_amount > 0 && calcAmount > d.max_discount_amount) calcAmount = d.max_discount_amount;
                                        } else {
                                            calcAmount = d.value;
                                        }
                                    }
                                    const eligiblePromo = (eligiblePromos || []).find(p => p.id === d.id);

                                    return (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() => {
                                                if (isRewardType && isEligible && eligiblePromo) {
                                                    onClose();
                                                    onPickReward && onPickReward(eligiblePromo);
                                                } else if (!isRewardType) {
                                                    onSelect({ ...d, amount: calcAmount });
                                                    onClose();
                                                }
                                            }}
                                            className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 rounded-[8px] p-[12px] flex gap-[14px] items-start w-full hover:border-[#54b8c3] dark:hover:border-teal-500 transition-all cursor-pointer text-left shadow-sm group"
                                        >
                                            <CategoryIcon
                                                icon={<HugeiconsIcon icon={ShoppingBag02Icon} size={18} />}
                                                variant="teal"
                                                size="size-[30px]"
                                                rounded="rounded-md"
                                                className="shrink-0 mt-0.5"
                                            />
                                            <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                                                <p className="font-semibold text-[14px] text-[#0f172a] dark:text-white leading-[1.2] truncate">
                                                    {d.name}
                                                </p>
                                                <p className="font-medium text-[12px] text-[#64748b] dark:text-slate-400 leading-[1.4] line-clamp-2">
                                                    {d.description || (isRewardType ? 'Item Gratis' : d.type === 'percentage' ? `Diskon ${d.value}%` : `Potongan Rp ${d.value}`)}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-[14px] text-[#0f172a] dark:text-white leading-[1.4] shrink-0 text-right">
                                                -{fmt(calcAmount)}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Promo Belum Bisa Dipakai (1:1 Figma Node 3442:18880) */}
                    {unavailablePromos.length > 0 && (
                        <div className="flex flex-col gap-[10px] w-full">
                            <p className="font-semibold text-[14px] text-[#0f172a] dark:text-white leading-[1.4]">
                                Promo Belum Bisa Dipakai
                            </p>
                            <div className="flex flex-col gap-[8px] w-full">
                                {unavailablePromos.map((d) => (
                                    <div
                                        key={d.id}
                                        className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 rounded-[8px] p-[12px] flex gap-[14px] items-start w-full cursor-not-allowed text-left"
                                    >
                                        <CategoryIcon
                                            icon={<HugeiconsIcon icon={ShoppingBag02Icon} size={18} />}
                                            variant="gray"
                                            size="size-[32px]"
                                            rounded="rounded-md"
                                            className="shrink-0 mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                                            <p className="font-semibold text-[14px] text-[#64748b] dark:text-slate-400 leading-[1.2]">
                                                {d.name}
                                            </p>
                                            <p className="font-medium text-[12px] text-[#94a3b8] dark:text-slate-500 leading-[1.4]">
                                                {d.description || (d.type === 'game_reward' || d.type === 'buy_x_get_y' ? 'Syarat promo belum terpenuhi' : d.type === 'percentage' ? `Diskon ${d.value}%` : `Potongan Rp ${d.value}`)}
                                            </p>
                                            {d.min_purchase_amount > 0 && subtotal < d.min_purchase_amount && (
                                                <p className="font-semibold text-[11px] text-amber-600 dark:text-amber-400">
                                                    Minimal belanja: {fmt(d.min_purchase_amount)}
                                                </p>
                                            )}
                                        </div>
                                        <p className="font-semibold text-[14px] text-[#64748b] dark:text-slate-400 leading-[1.4] shrink-0 text-right">
                                            -Rp 0
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
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
    const [selectedCategory, setSelectedCategory] = useState("parfum");
    const [pendingReward, setSelectedReward] = useState(null);
    const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);

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
    const salesRef = useRef(null);

    const { flash } = usePage().props;
    useEffect(() => {
        if (error) showAlert("Terjadi Kesalahan", error, "error");
        if (flash?.success) showAlert("Berhasil", flash.success, "success");
        if (flash?.error) showAlert("Terjadi Kesalahan", flash.error, "error");
    }, [error, flash]);

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
            if (salesRef.current && !salesRef.current.contains(e.target)) setShowSalesDropdown(false);
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
    // Botol standalone ("Kemasan Satuan") ikut menentukan eligibility promo (syarat botol),
    // jadi perubahannya harus memicu ulang pengecekan.
    const pkgFingerprint = useMemo(() => cartPackagings.map(p => `${p.pkg.id}:${p.qty}`).join(','), [cartPackagings]);
    useEffect(() => {
        if (carts.length === 0) { setEligiblePromos([]); return; }
        const params = {};
        if (selectedCustomer?.id) params.customer_id = selectedCustomer.id;
        if (cartPackagings.length) {
            params.standalone_packagings = JSON.stringify(
                cartPackagings.map(p => ({ packaging_material_id: p.pkg.id, qty: p.qty }))
            );
        }
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
    }, [cartFingerprint, pkgFingerprint, selectedCustomer?.id]);

    // ── Fetch katalog varian POS ───────────────────────────────────────────────
    const fetchCatalogVariants = async () => {
        if (loadingCatalog || catalogVariants.length > 0) return;
        setLoadingCatalog(true);
        try {
            const res = await axios.get(route("transactions.get-variants-pos"));
            if (res.data.success) setCatalogVariants(res.data.data);
            else showAlert("Gagal", res.data.message ?? "Gagal memuat varian", "error");
        } catch { showAlert("Gagal", "Gagal memuat varian", "error"); } finally { setLoadingCatalog(false); }
    };

    // Fetch intensitas untuk varian yang dipilih
    const fetchIntensities = async (variantId) => {
        setLoadingIntensities(true); setAvailableIntensities([]);
        try {
            const res = await axios.get(route("transactions.get-intensities"), { params: { variant_id: variantId } });
            if (res.data.success) setAvailableIntensities(res.data.data);
            else showAlert("Gagal", res.data.message ?? "Gagal memuat konsentrasi", "error");
        } catch { showAlert("Gagal", "Gagal memuat konsentrasi", "error"); } finally { setLoadingIntensities(false); }
    };

    const fetchSizes = async (intensityId, variantId) => {
        setLoadingSizes(true); setAvailableSizes([]);
        try {
            const res = await axios.get(route("transactions.get-sizes"), { params: { intensity_id: intensityId, variant_id: variantId } });
            if (res.data.success) setAvailableSizes(res.data.data);
            else showAlert("Gagal", res.data.message ?? "Gagal memuat ukuran", "error");
        } catch { showAlert("Gagal", "Gagal memuat ukuran", "error"); } finally { setLoadingSizes(false); }
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
                showAlert("Gagal", res.data.message ?? "Gagal memuat varian", "error");
            }
        } catch (err) {
            const status = err?.response?.status;
            const body = err?.response?.data;
            const msg = status === 404
                ? "Route tidak ditemukan (404). Pastikan route sudah didaftarkan."
                : status === 403 ? "Akses ditolak (403)."
                    : status === 500 ? (body?.message ?? "Server error (500). Cek log Laravel.")
                        : (body?.message ?? `Gagal memuat varian (${status ?? "network error"})`);
            showAlert("Gagal", msg, "error");
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
            } catch { showAlert("Gagal", "Gagal memuat varian", "error"); }
            finally { setLoadingRewardVariants(false); }
        }
    };

    // Botol standalone ("Kemasan Satuan") harus ikut saat klaim reward, agar
    // verifikasi syarat botol di server sama dengan hasil pengecekan eligibility.
    const standalonePkgPayload = () =>
        cartPackagings.length
            ? JSON.stringify(cartPackagings.map(p => ({ packaging_material_id: p.pkg.id, qty: p.qty })))
            : undefined;

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
            standalone_packagings: standalonePkgPayload(),
        }, {
            preserveScroll: true,
            onSuccess: () => showAlert("Berhasil", `Reward "${label}" berhasil ditambahkan!`, "success"),
            onError: (err) => showAlert("Gagal", Object.values(err)[0] ?? 'Gagal menambahkan reward', "error"),
        });
    };

    const handleAddFreeItem = (variant, promo) => {
        if (!variant || !promo) return;
        const reward = chosenPoolRewardItem || promo?.rewards_details?.[0] || promo?.rewards?.[0];
        const label = `${promo.name} - ${variant.name}`;
        // Buy 1 Get 1 berlaku kelipatan: langsung tambahkan semua sisa hadiah sekaligus
        // (beli 3 P50 → 3 P10 + botol). Spin wheel tetap 1 per klaim.
        const qty = promo.type === 'buy_x_get_y' ? Math.max(1, promo.remaining ?? 1) : 1;
        router.post(route('transactions.add-reward-to-cart'), {
            discount_type_id: promo.id,
            variant_id: variant.id,
            intensity_id: reward?.intensity_id ?? null,
            size_id: reward?.size_id ?? null,
            packaging_material_id: reward?.packaging_material_id ?? null,
            reward_label: label,
            qty,
            standalone_packagings: standalonePkgPayload(),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                showAlert("Berhasil", qty > 1
                    ? `${qty} item reward "${variant.name}" ditambahkan (GRATIS)!`
                    : `Item reward "${variant.name}" ditambahkan ke keranjang (GRATIS)!`, "success");
                setChosenPoolRewardItem(null);
            },
            onError: (err) => showAlert("Gagal", Object.values(err)[0] ?? 'Gagal menambahkan reward', "error"),
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
        if (!selectedIntensity || !selectedVariant) { showAlert("Perhatian", "Lengkapi pilihan terlebih dahulu", "warning"); return; }

        const payload = {
            intensity_id: selectedIntensity.id, variant_id: selectedVariant.id,
            size_id: size.id, qty: 1
        };

        // Parfum langsung masuk keranjang. Setelah sukses (kembali ke halaman katalog),
        // modal pilih botol otomatis terbuka — bisa ditutup (opsional).
        setSelectedPkgs([]);
        setShowSizeModal(false);
        submitPendingOrder({ type: "regular", payload, openBottlePicker: true });
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
            showAlert("Spin Wheel", "Silakan lakukan Spin Wheel! 🎡", "info");
            // setOpenSpinModal(true); 
            return;
        }

        // 2. Jika reward adalah produk (misal: "P30 EDT" atau "P10 EDT")
        if (name.includes("p30") || name.includes("p10") || name.includes("parfum") || name.includes("item")) {
            setSelectedCategory("parfum");
            setCatalogSearch("");
            setSelectedReward({ name: rewardName, is_free: true });
            showAlert("Pilih Varian Hadiah", `Silakan pilih varian Parfum untuk hadiah: ${rewardName}. Harga akan menjadi Rp 0.`, "info");
        } else {
            showAlert("Berhasil", `Reward "${rewardName}" terpilih!`, "success");
        }
    };

    const submitPendingOrder = (overrideOrder = null) => {
        if (!activeCashDrawer) {
            showAlert("Shift Belum Dibuka", "Silakan buka shift terlebih dahulu!", "warning");
            return;
        }
        const order = overrideOrder || pendingOrder;
        if (!order) return;

        const isCustom = order.type === "custom";
        const wasFree = pendingReward?.is_free || false;
        const finalPayload = {
            ...order.payload,
            packaging_ids: selectedPkgs,
            is_free: wasFree
        };

        const stateSetter = isCustom ? setAddingCustomToCart : setAddingToCart;
        const submitRoute = isCustom ? "transactions.add-custom-to-cart" : "transactions.add-to-cart";
        const successMsg = pendingReward?.is_free ? `Hadiah ${pendingReward.name} ditambahkan!` : (isCustom ? "Custom order ditambahkan ke keranjang!" : "Ditambahkan ke keranjang!");

        stateSetter(true);
        router.post(route(submitRoute), finalPayload, {
            preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "discounts"],
            onSuccess: () => {
                showAlert("Berhasil", successMsg, "success");
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
                // Parfum reguler → buka modal pilih botol (standalone). Reward gratis
                // sudah dapat botol otomatis dari server, jangan buka modal.
                setShowPackagingModal(order.openBottlePicker && !wasFree ? true : false);
            },
            onError: (errs) => {
                const msg = typeof errs === "object" ? Object.values(errs)[0] : (errs?.message || "Gagal menambahkan");
                showAlert("Gagal", msg, "error"); stateSetter(false);
            },
        });
    };

    // Modal botol bersifat opsional — parfum sudah lebih dulu masuk keranjang.
    const handleClosePackagingModal = () => setShowPackagingModal(false);

    const togglePkg = (pkgId) => setSelectedPkgs(prev => prev.includes(pkgId) ? prev.filter(id => id !== pkgId) : [...prev, pkgId]);

    // ── Cart actions ───────────────────────────────────────────────────────────
    const handleUpdateQty = (cartId, newQty) => {
        if (newQty < 1) return;
        setUpdatingId(cartId);
        router.patch(route("transactions.update-cart", cartId), { qty: newQty }, {
            preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "discounts"],
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
            preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "discounts"],
            onSuccess: () => { showAlert("Berhasil", "Item dihapus dari keranjang", "success"); setRemovingId(null); },
            onError: () => { showAlert("Gagal", "Gagal menghapus item", "error"); setRemovingId(null); },
        });
    };

    const handleHold = () => {
        if (!carts.length) { showAlert("Keranjang Kosong", "Tidak ada item dalam keranjang", "warning"); return; }
        setIsHolding(true);
        router.post(route("transactions.hold"), { label: "Hold " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }, {
            preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "heldCarts", "discounts"],
            onSuccess: () => { showAlert("Berhasil", "Transaksi ditahan", "success"); setIsHolding(false); setCartPackagings([]); },
            onFinish: () => setIsHolding(false),
        });
    };

    const handleResume = (holdId) => router.post(route("transactions.resume", holdId), {}, { preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "heldCarts", "discounts"] });
    const handleDeleteHeld = (holdId) => { if (!confirm("Hapus transaksi yang ditahan?")) return; router.delete(route("transactions.delete-held", holdId), { preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "heldCarts", "discounts"] }); };

    const handleAddPkg = (pkg) => {
        setCartPackagings(prev => {
            const idx = prev.findIndex(p => p.pkg.id === pkg.id);
            if (idx >= 0) return prev.map((p, i) => i === idx ? { ...p, qty: p.qty + 1 } : p);
            return [...prev, { pkg, qty: 1 }];
        });
        showAlert("Berhasil", `${pkg.name} ditambahkan`, "success");
        // Kembali ke halaman katalog (landing Parfume/Botol/Kemasan) setelah item masuk keranjang.
        setSelectedCategory(null);
        setMobileView("catalog");
    };

    const handleUpdatePkgQty = (pkgId, delta) =>
        setCartPackagings(prev => prev.map(p => p.pkg.id === pkgId ? { ...p, qty: Math.max(0, p.qty + delta) } : p).filter(p => p.qty > 0));

    const handleCheckout = () => { if (!carts.length && !cartPackagings.length) { showAlert("Keranjang Kosong", "Tidak ada item dalam keranjang", "warning"); return; } setShowPaymentModal(true); };

    const handleSubmit = () => {
        if (!selectedSalesPerson?.id) { showAlert("Sales Belum Dipilih", "Sales wajib dipilih terlebih dahulu!", "warning"); return; }
        if (isCash && cash < payable) { showAlert("Nominal Kurang", "Jumlah bayar kurang dari total transaksi!", "warning"); return; }
        setIsSubmitting(true);
        router.post(route("transactions.store"), {
            customer_id: selectedCustomer?.id ?? null,
            sales_person_id: selectedSalesPerson?.id ?? null,
            payment_method_id: selectedPaymentId,
            discount_type_id: selectedDiscount?.id !== "__manual__" ? (selectedDiscount?.id ?? null) : null,
            discount_amount: discountAmount, cash_amount: isCash ? cash : null,
            standalone_packagings: cartPackagings.map(p => ({ packaging_material_id: p.pkg.id, qty: p.qty })),
        }, { onError: (errs) => { setIsSubmitting(false); showAlert("Gagal", errs?.message || "Gagal menyimpan transaksi", "error"); } });
    };

    const handleStoreCustomer = (e) => {
        e.preventDefault();
        if (!custName) { showAlert("Form Inkomplit", "Nama pelanggan wajib diisi", "warning"); return; }
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
            showAlert("Berhasil", "Pelanggan baru berhasil ditambahkan", "success");
            
            const newCust = res.data.customer;
            setLocalCustomers(prev => [newCust, ...prev]);
            setSelectedCustomer(newCust);
        }).catch((err) => {
            setIsSubmitting(false);
            const errs = err.response?.data?.errors;
            showAlert("Gagal", errs?.phone?.[0] || errs?.name?.[0] || "Gagal menambah pelanggan", "error");
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
            <SizeModal show={showSizeModal} onClose={() => setShowSizeModal(false)} onBack={() => { setShowSizeModal(false); setTimeout(() => setShowIntensityModal(true), 80); }} variant={selectedVariant} intensity={selectedIntensity} sizes={availableSizes} loading={loadingSizes} onSelect={selectSize} />

            {/* Modal pilih botol/kemasan.
                - Pending mode (setelah pilih parfum): centang botol → "Lanjut" nempel ke parfum;
                  ditutup → parfum tetap masuk tanpa botol.
                - Non-pending (tombol "Tambah Kemasan Satuan"): tambah botol standalone. */}
            <PackagingModal
                show={showPackagingModal}
                onClose={handleClosePackagingModal}
                packagingMaterials={packagingMaterials}
                selectedPkgs={selectedPkgs}
                onToggle={togglePkg}
                onAddStandalone={handleAddPkg}
                isPendingMode={!!pendingOrder}
                onSubmitPending={() => submitPendingOrder()}
                isSubmitting={addingToCart}
            />
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
                    {/* ── LEFT: Catalog or Payment Form Pane ────────────────────────────────────── */}
                    <div className={`flex-1 flex flex-col overflow-hidden ${mobileView === "catalog" ? "flex" : "hidden md:flex"}`}>
                        {showPaymentModal ? (
                            /* ── PAYMENT VIEW IN LEFT PANE (1:1 Figma Node 3442:19156 + 3307:33585) ── */
                            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900 border-r border-[#e8e8e8] dark:border-slate-800">
                                {/* Header Page Pembayaran (1:1 Figma Node 3442:19156) */}
                                <div className="bg-white dark:bg-slate-900 border-[#e8e8e8] dark:border-slate-800 border-b border-solid flex items-center pl-[10px] pr-[20px] py-[12px] relative shrink-0 w-full">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        className="flex gap-[10px] items-center text-[#0f172a] dark:text-white hover:opacity-80 transition-opacity cursor-pointer"
                                    >
                                        <IconArrowLeft size={22} className="shrink-0 text-[#0f172a] dark:text-white" />
                                        <span className="font-semibold text-[#0f172a] dark:text-white text-[18px] leading-[1.4] whitespace-nowrap">
                                            Pembayaran
                                        </span>
                                    </button>
                                </div>

                                {/* Content Pane: Sales, Metode Pembayaran, Nominal (1:1 Figma Node 3307:33585) */}
                                <div className="flex-1 overflow-y-auto flex flex-col bg-white dark:bg-slate-900 p-0 gap-0">
                                    {/* Card 1: Sales */}
                                    <div className="bg-white dark:bg-slate-900 border-b border-[#e8e8e8] dark:border-slate-800 flex flex-col w-full">
                                        <div className="bg-[#fbfbfb] dark:bg-slate-800/80 px-[16px] py-[12px] border-b border-[#e8e8e8] dark:border-slate-800 flex items-center">
                                            <p className="font-semibold text-[14px] text-[#0f172a] dark:text-white leading-[1.4]">
                                                Sales
                                            </p>
                                        </div>
                                        <div ref={salesRef} className="p-[14px] flex flex-col relative">
                                            <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex gap-[8px] h-[37px] items-center px-[8px] py-[8px] rounded-[8px] w-full relative">
                                                <IconSearch size={16} className="text-[#64748b] dark:text-slate-400 shrink-0" />
                                                <input
                                                    type="text"
                                                    placeholder="Cari nama sales"
                                                    value={selectedSalesPerson ? selectedSalesPerson.name : salesSearch}
                                                    onFocus={() => setShowSalesDropdown(true)}
                                                    onClick={() => {
                                                        if (selectedSalesPerson) {
                                                            setSelectedSalesPerson(null);
                                                            setSalesSearch("");
                                                        }
                                                        setShowSalesDropdown(true);
                                                    }}
                                                    onChange={(e) => {
                                                        setSalesSearch(e.target.value);
                                                        setShowSalesDropdown(true);
                                                        if (selectedSalesPerson) setSelectedSalesPerson(null);
                                                    }}
                                                    className="w-full bg-transparent border-0 text-[12px] text-[#0f172a] dark:text-white placeholder-[#64748b] dark:placeholder-slate-400 focus:outline-none focus:ring-0 p-0 leading-[1.4]"
                                                />
                                                {selectedSalesPerson ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedSalesPerson(null); setSalesSearch(""); setShowSalesDropdown(true); }}
                                                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                                    >
                                                        <IconX size={14} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowSalesDropdown(!showSalesDropdown)}
                                                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                                    >
                                                        <IconChevronDown size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Dropdown list sales */}
                                            {showSalesDropdown && (
                                                <div className="absolute top-full left-[14px] right-[14px] mt-1 bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-700 rounded-[8px] shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                                    {(salesPeople || []).filter(s => s.name.toLowerCase().includes(salesSearch.toLowerCase())).map(s => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSalesPerson(s);
                                                                setShowSalesDropdown(false);
                                                                setSalesSearch("");
                                                            }}
                                                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-[#e8e8e8] dark:border-slate-800 last:border-0 cursor-pointer flex items-center justify-between"
                                                        >
                                                            <div>
                                                                <p className="font-semibold text-xs text-[#0f172a] dark:text-white">{s.name}</p>
                                                                {s.code && <p className="text-[10px] text-[#64748b] dark:text-slate-400">{s.code}</p>}
                                                            </div>
                                                            {selectedSalesPerson?.id === s.id && (
                                                                <IconCheck size={14} className="text-[#54b8c3]" />
                                                            )}
                                                        </button>
                                                    ))}
                                                    {(salesPeople || []).filter(s => s.name.toLowerCase().includes(salesSearch.toLowerCase())).length === 0 && (
                                                        <p className="p-3 text-center text-xs text-slate-400">
                                                            {salesPeople?.length === 0 ? "Belum ada data sales" : "Sales tidak ditemukan"}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card 2: Metode Pembayaran */}
                                    <div className="bg-white dark:bg-slate-900 border-b border-[#e8e8e8] dark:border-slate-800 flex flex-col w-full">
                                        <div className="bg-[#fbfbfb] dark:bg-slate-800/80 px-[16px] py-[12px] border-b border-[#e8e8e8] dark:border-slate-800 flex items-center">
                                            <p className="font-semibold text-[14px] text-[#0f172a] dark:text-white leading-[1.4]">
                                                Metode Pembayaran
                                            </p>
                                        </div>
                                        <div className="p-[14px] flex gap-[10px] items-center w-full">
                                            {paymentMethods.map((method) => {
                                                const isActive = selectedPaymentId === method.id;
                                                return (
                                                    <button
                                                        key={method.id}
                                                        type="button"
                                                        onClick={() => setSelectedPaymentId(method.id)}
                                                        className={`border border-solid flex flex-[1_0_0] flex-col gap-[8px] items-center justify-center min-w-0 p-[12px] relative rounded-[8px] cursor-pointer transition-all ${
                                                            isActive
                                                                ? "border-[#54b8c3] bg-[#f0fdfa] dark:bg-teal-950/30 text-[#0f172a] dark:text-white shadow-sm ring-1 ring-[#54b8c3]"
                                                                : "border-[#e8e8e8] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#64748b] dark:text-slate-400 hover:border-slate-300"
                                                        }`}
                                                    >
                                                        <div className="size-[24px] flex items-center justify-center">
                                                            {method.name.toLowerCase().includes("edc") || method.name.toLowerCase().includes("card") || method.name.toLowerCase().includes("debit") || method.name.toLowerCase().includes("kredit") || method.code?.toLowerCase().includes("edc") ? (
                                                                <HugeiconsIcon icon={CreditCardIcon} size={24} className={isActive ? "text-[#0f172a] dark:text-white" : "text-[#64748b] dark:text-slate-400"} />
                                                            ) : method.name.toLowerCase().includes("qris") || method.code?.toLowerCase().includes("qris") ? (
                                                                <HugeiconsIcon icon={QrCodeIcon} size={24} className={isActive ? "text-[#0f172a] dark:text-white" : "text-[#64748b] dark:text-slate-400"} />
                                                            ) : (
                                                                <HugeiconsIcon icon={Money03Icon} size={24} className={isActive ? "text-[#0f172a] dark:text-white" : "text-[#64748b] dark:text-slate-400"} />
                                                            )}
                                                        </div>
                                                        <p className={`font-semibold text-[14px] leading-[20px] whitespace-nowrap ${isActive ? "text-[#0f172a] dark:text-white" : "text-[#64748b] dark:text-slate-400"}`}>
                                                            {method.name}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Card 3: Nominal (1:1 Figma Node 3410:59742) */}
                                    <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col overflow-hidden">
                                        <div className="bg-[#fbfbfb] dark:bg-slate-800/80 px-[16px] py-[12px] border-b border-[#e8e8e8] dark:border-slate-800 flex items-center">
                                            <p className="font-semibold text-[14px] text-[#0f172a] dark:text-white leading-[1.4]">
                                                Nominal
                                            </p>
                                        </div>
                                        <div className="p-[14px] flex flex-col gap-[12px] w-full">
                                            {/* Input Group (1:1 Figma Node 3410:59747) */}
                                            <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-700 flex h-[52px] items-center overflow-hidden rounded-[8px] w-full">
                                                {/* Prefix */}
                                                <div className="bg-[#fbfbfb] dark:bg-slate-800 border-r border-[#e8e8e8] dark:border-slate-700 flex h-full items-center justify-center px-[14px] shrink-0">
                                                    <p className="font-semibold text-[#64748b] dark:text-slate-400 text-[14px] leading-[20px]">
                                                        Rp
                                                    </p>
                                                </div>
                                                {/* Value */}
                                                <div className="flex-1 flex h-full items-center px-[14px] min-w-0">
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={cashInput ? Number(cashInput).toLocaleString("id-ID") : ""}
                                                        onChange={(e) => setCashInput(e.target.value.replace(/\D/g, ""))}
                                                        placeholder="0"
                                                        className="w-full bg-transparent border-0 font-semibold text-[24px] leading-[1.4] text-[#0f172a] dark:text-white placeholder-[#94a3b8] focus:outline-none focus:ring-0 p-0"
                                                    />
                                                </div>
                                            </div>

                                            {/* Nominal Cepat (1:1 Figma Node 3410:59752) */}
                                            {isCash && (
                                                <div className="flex flex-col gap-[8px] w-full">
                                                    <p className="font-semibold text-[12px] text-[#0f172a] dark:text-white leading-[16px]">
                                                        Nominal Cepat
                                                    </p>
                                                    <div className="flex gap-[8px] items-center w-full">
                                                        {(() => {
                                                            const baseAmts = [
                                                                payable,
                                                                Math.ceil(payable / 10000) * 10000 === payable ? payable + 10000 : Math.ceil(payable / 10000) * 10000,
                                                                Math.ceil(payable / 50000) * 50000 === payable ? payable + 50000 : Math.ceil(payable / 50000) * 50000,
                                                                Math.ceil(payable / 100000) * 100000 === payable ? payable + 100000 : Math.ceil(payable / 100000) * 100000,
                                                                100000,
                                                            ];
                                                            const quickAmts = Array.from(new Set(baseAmts)).filter(a => a >= payable && a > 0).slice(0, 3);

                                                            return quickAmts.map((amt) => {
                                                                const isSelected = Number(cashInput) === amt;
                                                                return (
                                                                    <button
                                                                        key={amt}
                                                                        type="button"
                                                                        onClick={() => setCashInput(String(amt))}
                                                                        className={`flex-1 py-[8px] rounded-[8px] flex items-center justify-center transition-all cursor-pointer text-[12px] whitespace-nowrap ${
                                                                            isSelected
                                                                                ? "border-[#54b8c3] border-[1.5px] bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white font-semibold shadow-sm"
                                                                                : "bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 text-[#64748b] dark:text-slate-400 font-semibold hover:border-slate-300 dark:hover:border-slate-700"
                                                                        }`}
                                                                    >
                                                                        Rp {amt.toLocaleString("id-ID")}
                                                                    </button>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Kembalian if cash */}
                                            {isCash && cash >= payable && payable > 0 && (
                                                <div className="flex justify-between items-center px-[14px] py-[10px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-slate-700 rounded-[8px] mt-1">
                                                    <span className="text-xs font-semibold text-[#0f172a] dark:text-white">Kembalian</span>
                                                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmt(kembalian)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ── CATALOG VIEW IN LEFT PANE ── */
                            <>
                                {/* ── Persistent Category Header Tabs ── */}
                                <div className="p-3 md:p-4 pb-2 border-b border-[#e8e8e8] dark:border-slate-800 bg-[#fbfbfb] dark:bg-slate-900/50 shrink-0">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {/* Card Parfum Tab */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('parfum')}
                                            className={`p-2.5 rounded-lg border-[1.5px] inline-flex items-center gap-3 text-left transition-all group cursor-pointer w-full ${
                                                (selectedCategory === 'parfum' || !selectedCategory)
                                                    ? "bg-white dark:bg-slate-900 border-[#54b8c3] dark:border-teal-500 "
                                                    : "bg-white/60 dark:bg-slate-900/40 border-[#e8e8e8] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300"
                                            }`}
                                        >
                                            <CategoryIcon icon={<IconFlask size={20} />} variant="teal" size="size-9" />
                                            <div className="flex-1 flex flex-col justify-start items-start gap-0.5 overflow-hidden min-w-0">
                                                <div className="self-stretch inline-flex justify-between items-center overflow-hidden">
                                                    <div className="justify-start text-slate-900 dark:text-white text-sm font-semibold leading-5 truncate">
                                                        Parfum
                                                    </div>
                                                </div>
                                                <div className="justify-start text-slate-500 dark:text-slate-400 text-xs font-normal leading-4 truncate w-full">
                                                    Varian, konsentrasi, ukuran
                                                </div>
                                            </div>
                                        </button>

                                        {/* Card Botol Tab */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('packaging')}
                                            className={`p-2.5 rounded-lg border inline-flex items-center gap-3 text-left transition-all group cursor-pointer w-full ${
                                                selectedCategory === 'packaging'
                                                    ? "bg-white dark:bg-slate-900 border-[#54b8c3] dark:border-teal-500 shadow-sm ring-1 ring-[#54b8c3]/30"
                                                    : "bg-white/60 dark:bg-slate-900/40 border-[#e8e8e8] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300"
                                            }`}
                                        >
                                            <CategoryIcon icon={<IconBox size={20} />} variant="teal" size="size-9" />
                                            <div className="flex-1 flex flex-col justify-start items-start gap-0.5 overflow-hidden min-w-0">
                                                <div className="self-stretch inline-flex justify-between items-center overflow-hidden">
                                                    <div className="justify-start text-slate-900 dark:text-white text-sm font-semibold leading-5 truncate">
                                                        Botol
                                                    </div>
                                                </div>
                                                <div className="justify-start text-slate-500 dark:text-slate-400 text-xs font-normal leading-4 truncate w-full">
                                                    Botol, tutup spray, aksesoris
                                                </div>
                                            </div>
                                        </button>

                                        {/* Card Kemasan Tab */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory('spunbond')}
                                            className={`p-2.5 rounded-lg border inline-flex items-center gap-3 text-left transition-all group cursor-pointer w-full ${
                                                selectedCategory === 'spunbond'
                                                    ? "bg-white dark:bg-slate-900 border-[#54b8c3] dark:border-teal-500 shadow-sm ring-1 ring-[#54b8c3]/30"
                                                    : "bg-white/60 dark:bg-slate-900/40 border-[#e8e8e8] dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 hover:border-slate-300"
                                            }`}
                                        >
                                            <CategoryIcon icon={<IconShoppingBag size={20} />} variant="teal" size="size-9" />
                                            <div className="flex-1 flex flex-col justify-start items-start gap-0.5 overflow-hidden min-w-0">
                                                <div className="self-stretch inline-flex justify-between items-center overflow-hidden">
                                                    <div className="justify-start text-slate-900 dark:text-white text-sm font-semibold leading-5 truncate">
                                                        Kemasan
                                                    </div>
                                                </div>
                                                <div className="justify-start text-slate-500 dark:text-slate-400 text-xs font-normal leading-4 truncate w-full">
                                                    Tas spunbond eksklusif
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* ── TAB PARFUM Content ── */}
                                {selectedCategory === "parfum" && (
                                    <div className="flex-1 overflow-y-auto p-4">
                                        {/* Search + filter gender */}
                                        <div className="flex gap-[8px] items-center mb-3">
                                            {/* Search */}
                                            <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-1 gap-[8px] h-[37px] items-center px-[12px] py-[4px] rounded-[8px] relative">
                                                <IconSearch size={14} className="text-[#64748b] dark:text-slate-400 shrink-0" />
                                                <input
                                                    type="text"
                                                    placeholder="Cari varian..."
                                                    value={catalogSearch}
                                                    onChange={(e) => setCatalogSearch(e.target.value)}
                                                    className="w-full bg-transparent border-0 text-[14px] text-slate-900 dark:text-white placeholder-[#64748b] dark:placeholder-slate-400 focus:outline-none focus:ring-0 p-0 leading-[20px]"
                                                />
                                            </div>

                                            {/* Filters */}
                                            <div className="bg-[#fbfbfb] dark:bg-slate-800/80 border border-[#e8e8e8] dark:border-slate-700 flex gap-[2px] items-center p-[4px] rounded-[8px] shrink-0">
                                                {[
                                                    { key: "all", label: "Semua" },
                                                    { key: "male", label: "Pria" },
                                                    { key: "female", label: "Wanita" },
                                                ].map((g) => {
                                                    const isActive = catalogGender === g.key;
                                                    return (
                                                        <button
                                                            key={g.key}
                                                            type="button"
                                                            onClick={() => setCatalogGender(g.key)}
                                                            className={`px-[12px] py-[6px] text-[12px] leading-[1.4] transition-all ${
                                                                isActive
                                                                    ? "bg-white dark:bg-slate-900 border border-[#e5e5e5] dark:border-slate-700 rounded-[6px] shadow-[0px_1px_3px_0px_rgba(15,23,41,0.08)] font-semibold text-[#0f172a] dark:text-white"
                                                                    : "rounded-[7px] font-medium text-[#64748b] dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                                            }`}
                                                        >
                                                            {g.label}
                                                        </button>
                                                    );
                                                })}
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
                                                    {filtered.map((variant) => {
                                                        const isMale = variant.gender === "male";
                                                        const isFemale = variant.gender === "female";
                                                        const chipClass = isMale
                                                            ? "bg-[#dbe6fb] text-[#1e40af] dark:bg-blue-900/40 dark:text-blue-300"
                                                            : isFemale
                                                                ? "bg-[#f9d8e7] text-[#9d174d] dark:bg-pink-900/40 dark:text-pink-300"
                                                                : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300";

                                                        return (
                                                            <button
                                                                key={variant.id}
                                                                type="button"
                                                                onClick={() => selectCatalogVariant(variant)}
                                                                className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex gap-[10px] items-center px-[12px] py-[10px] rounded-[6px] relative text-left hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group cursor-pointer w-full"
                                                            >
                                                                {/* Info */}
                                                                <div className="flex flex-col gap-[2px] items-start justify-center flex-1 min-w-0">
                                                                    <div className="flex gap-[6px] items-center w-full">
                                                                        <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[20px] truncate flex-1 min-w-0">
                                                                            {variant.name}
                                                                        </p>
                                                                        {variant.gender && (
                                                                            <span className={`px-[6px] py-[2px] rounded-full text-[12px] font-medium leading-[1.2] shrink-0 ${chipClass}`}>
                                                                                {GENDER_LABEL[variant.gender] ?? variant.gender}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {variant.code && (
                                                                        <p className="font-normal text-[#64748b] dark:text-slate-400 text-[12px] leading-[16px] truncate w-full">
                                                                            {variant.code}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {/* Add Icon Button */}
                                                                <div className="bg-[#f7f7f7] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex items-center justify-center rounded-[6px] shrink-0 size-[28px] text-[#64748b] dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                                                                    <IconPlus size={14} />
                                                                </div>
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Card Custom Order */}
                                                    {SHOW_KOMPOSISI_BEBAS && (
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
                                                    )}
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
                            </>
                        )}
                    </div>

                    {/* ── RIGHT: Cart ───────────────────────────────────────── */}
                    <div className={`w-full md:w-[340px] lg:w-[400px] xl:w-[460px] flex-shrink-0 flex flex-col overflow-hidden min-h-0 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 ${mobileView === "cart" ? "flex" : "hidden md:flex"}`}>
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

                        {/* ── 1. Pelanggan Section (Figma Node 3258:3553) ── */}
                        <div className="flex-shrink-0 border-b border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[10px] items-start px-[10px] py-[12.686px] relative" ref={customerRef}>
                            <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[1.4]">
                                Pelanggan
                            </p>
                            <div className="flex gap-[8px] items-center w-full">
                                <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-1 gap-[8px] items-center p-[8px] rounded-[8px] relative">
                                    <IconSearch size={14} className="text-[#64748b] dark:text-slate-400 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Cari / Pilih pelanggan (No. Telepon)"
                                        value={selectedCustomer ? (selectedCustomer.phone || selectedCustomer.name) : customerSearch}
                                        onClick={() => { if (selectedCustomer) { setSelectedCustomer(null); setCustomerSearch(""); } setShowCustomerDropdown(true); }}
                                        onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); if (selectedCustomer) setSelectedCustomer(null); }}
                                        className="w-full bg-transparent border-0 text-[10px] text-slate-900 dark:text-white placeholder-[#64748b] dark:placeholder-slate-400 focus:outline-none focus:ring-0 p-0 leading-[1.4]"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAddCustomer(true)}
                                    className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex items-center justify-center p-[8px] rounded-[8px] shrink-0 text-[#64748b] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Tambah Pelanggan Baru"
                                >
                                    <IconUserPlus size={14} />
                                </button>
                            </div>
                            {selectedCustomer && (
                                <div className="mt-[6px] flex items-center gap-[6px] flex-wrap w-full">
                                    <div className="size-[12px] bg-[#12a55c] rounded-full flex items-center justify-center text-white shrink-0">
                                        <IconCheck size={8} strokeWidth={3} />
                                    </div>
                                    <div className="flex items-center gap-[10px] shrink-0 flex-wrap">
                                        <p className="font-medium text-[#0f172a] dark:text-white text-[10px] leading-[1.4] whitespace-nowrap">
                                            {selectedCustomer.phone || "-"}
                                        </p>
                                        <div className="w-px h-[10px] bg-[#e8e8e8] dark:bg-slate-700 shrink-0" />
                                        <p className="font-medium text-[#0f172a] dark:text-white text-[10px] leading-[1.4] whitespace-nowrap">
                                            {selectedCustomer.name}
                                        </p>
                                        {selectedCustomer.id && (
                                            <>
                                                <div className="w-px h-[10px] bg-[#e8e8e8] dark:bg-slate-700 shrink-0" />
                                                <p className="font-medium text-[#0f172a] dark:text-white text-[10px] leading-[1.4] whitespace-nowrap">
                                                    {Number(selectedCustomer.points ?? 0).toLocaleString("id-ID")} Poin
                                                </p>
                                            </>
                                        )}
                                        {Number(selectedCustomer.points ?? 0) >= loyalty_reward_threshold && (
                                            <span className="ml-auto text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                🏆 Reward tersedia
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                            {showCustomerDropdown && !selectedCustomer && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 rounded-[8px] p-[10px] shadow-[0px_20px_12px_0px_rgba(0,0,0,0.06),0px_9px_9px_0px_rgba(0,0,0,0.08)] z-30 max-h-60 overflow-y-auto flex flex-col gap-[10px] items-start w-full">
                                    {/* Pelanggan Umum Item */}
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedCustomer({ id: null, name: "Pelanggan Umum" }); setShowCustomerDropdown(false); setCustomerSearch(""); }}
                                        className="flex flex-col gap-[2px] items-start w-full text-left p-[6px] rounded-[4px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                                    >
                                        <p className="font-semibold text-[#0f172a] dark:text-white text-[12px] leading-[1.4]">
                                            -
                                        </p>
                                        <p className="font-medium text-[#64748b] dark:text-slate-400 text-[10px] leading-[1.4]">
                                            Pelanggan Umum
                                        </p>
                                    </button>

                                    <div className="h-[0.8px] bg-[#e8e8e8] dark:bg-slate-800 w-full shrink-0" />

                                    {/* Filtered Registered Customers */}
                                    {filteredCustomers.map((c, idx) => (
                                        <React.Fragment key={c.id}>
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(""); }}
                                                className="flex flex-col gap-[2px] items-start w-full text-left p-[6px] rounded-[4px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                                            >
                                                <p className="font-semibold text-[#0f172a] dark:text-white text-[12px] leading-[1.4]">
                                                    {c.phone || "-"}
                                                </p>
                                                <p className="font-medium text-[#64748b] dark:text-slate-400 text-[10px] leading-[1.4]">
                                                    {c.name}
                                                </p>
                                            </button>
                                            {idx < filteredCustomers.length - 1 && (
                                                <div className="h-[0.8px] bg-[#e8e8e8] dark:bg-slate-800 w-full shrink-0" />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── 2. Keranjang Header (Figma Node 3258:3567) ── */}
                        <div className="bg-[#fbfbfb] dark:bg-slate-900/50 border-b border-[#e8e8e8] dark:border-slate-800 flex items-center justify-between px-[10px] py-[12.686px] relative shrink-0">
                            <div className="flex gap-[6.343px] items-center shrink-0">
                                <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[1.4]">
                                    Keranjang
                                </p>
                                <div className="bg-[#36adba] flex items-center justify-center px-[6px] py-[2px] rounded-full shrink-0 min-w-[18px]">
                                    <span className="font-semibold text-[10px] text-white leading-[1.4]">
                                        {totalCartCount}
                                    </span>
                                </div>
                            </div>
                            {carts.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleHold}
                                    disabled={isHolding}
                                    className="bg-white dark:bg-slate-800 border border-[#e5e5e5] dark:border-slate-700 flex items-center justify-center px-[8px] py-[4px] rounded-[4px] shrink-0 text-[10px] font-medium text-[#0f172a] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    Tahan Transaksi
                                </button>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-[10px] space-y-[10px]">
                            {carts.length === 0 && cartPackagings.length === 0 ? (
                                <div className="py-[40px] flex flex-col items-center justify-center text-center w-full">
                                    <div className="bg-[#f7f7f7] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 size-[56px] rounded-[12px] flex items-center justify-center text-[#0f172a] dark:text-white shrink-0 mb-[12px]">
                                        <HugeiconsIcon
                                            icon={ShoppingCart01Icon}
                                            size={22}
                                            color="currentColor"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                    <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[1.4] text-center">
                                        Keranjang kosong
                                    </p>
                                    <p className="font-normal text-[#94a3b8] dark:text-slate-400 text-[12px] leading-[1.4] text-center mt-[4px]">
                                        Pilih parfum dari katalog
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-[8px] w-full">
                                    {carts.map(item => {
                                        const isPointReward = item.points_amount !== null && item.points_amount !== undefined;
                                        const intensityName = item.intensity?.code ?? item.intensity_code ?? "EDT";
                                        const volumeText = item.size?.volume_ml ? `${item.size.volume_ml}ml` : item.volume_ml ? `${item.volume_ml}ml` : null;

                                        return (
                                            <div key={item.id} className={`flex flex-col gap-[8px] bg-white dark:bg-slate-900 border-b border-[#e8e8e8] dark:border-slate-800 pb-[8px] last:border-0 transition-opacity ${removingId === item.id ? "opacity-40" : ""}`}>
                                                <div className="flex items-start justify-between gap-[10px] p-[2px] w-full">
                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0 flex flex-col gap-[4.75px]">
                                                        <div className="flex items-center gap-[6px] flex-wrap">
                                                            <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[1.4] truncate">
                                                                {isPointReward ? (item.notes ?? `Reward: +${item.points_amount} Poin`) : (item.variant?.name ?? "Parfum Custom")}
                                                            </p>
                                                            {item.is_custom_order && (
                                                                <span className="px-[6px] py-[2px] bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-semibold rounded-full shrink-0">
                                                                    CUSTOM
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Sub-info: Variant Code */}
                                                        {item.variant?.code && (
                                                            <p className="text-[10px] text-[#64748b] dark:text-slate-400 font-mono leading-[1.2] truncate">
                                                                {item.variant.code}
                                                            </p>
                                                        )}

                                                        {/* Sub-info: Custom Order Details */}
                                                        {item.is_custom_order && (
                                                            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-[1.2]">
                                                                {item.custom_oil_qty}ml Bibit Oil · {item.custom_alcohol_qty ?? 0}ml Alkohol
                                                            </p>
                                                        )}

                                                        {/* Sub-info: Intensity, Volume, Reward Badge */}
                                                        <div className="flex items-center gap-[4px] flex-wrap">
                                                            {!isPointReward && (
                                                                <div className="bg-[#f7f7f7] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 px-[6px] py-[2px] rounded-full shrink-0">
                                                                    <span className="text-[10px] font-medium text-[#64748b] dark:text-slate-300 leading-[1.4]">
                                                                        {intensityName}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {volumeText && (
                                                                <div className="bg-[#f7f7f7] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 px-[6px] py-[2px] rounded-full shrink-0">
                                                                    <span className="text-[10px] font-medium text-[#64748b] dark:text-slate-300 leading-[1.4]">
                                                                        {volumeText}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {isPointReward && (
                                                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                                    🎁 REWARD POIN (+{item.points_amount} Poin)
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Sub-info: Attached Packagings */}
                                                        {(item.packagings ?? []).length > 0 && (
                                                            <div className="flex items-center gap-1 text-[10px] text-[#64748b] dark:text-slate-400 mt-[1px]">
                                                                <IconPackage size={12} className="shrink-0 text-[#54b8c3]" />
                                                                <span className="truncate">
                                                                    + {item.packagings.map(p => p.packaging_material?.name ?? p.name).filter(Boolean).join(", ")}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Sub-info: Notes */}
                                                        {item.notes && item.variant?.name && (
                                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate">
                                                                Catatan: {item.notes}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Price & Stepper */}
                                                    <div className="flex flex-col gap-[6.34px] items-end shrink-0">
                                                        <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[1.4] text-right">
                                                            {Number(item.unit_price) === 0 || item.is_free || isPointReward ? "GRATIS" : fmt(getCartItemTotal(item))}
                                                        </p>

                                                        <div className="flex items-center gap-[4px]">
                                                            <div className="border border-[#e8e8e8] dark:border-slate-700 rounded-[4.75px] flex items-center overflow-hidden h-[22px] bg-white dark:bg-slate-900">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateQty(item.id, item.qty - 1)}
                                                                    disabled={item.qty <= 1 || updatingId === item.id}
                                                                    className="size-[22px] bg-[#f7f9fc] dark:bg-slate-800 flex items-center justify-center text-[#64748b] dark:text-slate-300 text-[11px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className="w-[28.5px] h-[22px] flex items-center justify-center text-[12px] font-semibold text-[#0f172a] dark:text-white">
                                                                    {item.qty}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                                                                    disabled={updatingId === item.id}
                                                                    className="size-[22px] bg-[#f7f9fc] dark:bg-slate-800 flex items-center justify-center text-[#64748b] dark:text-slate-300 text-[11px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemove(item.id)}
                                                                disabled={removingId === item.id}
                                                                className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors shrink-0 cursor-pointer"
                                                            >
                                                                <IconTrash size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Divider Kemasan */}
                                    {cartPackagings.length > 0 && (
                                        <div className="flex gap-[10px] items-center pt-[12px] pb-[8px] w-full">
                                            <div className="bg-[#e8e8e8] dark:bg-slate-800 flex-1 h-px" />
                                            <p className="font-medium text-[12px] text-[#64748b] dark:text-slate-400 leading-[1.2] whitespace-nowrap">
                                                Kemasan
                                            </p>
                                            <div className="bg-[#e8e8e8] dark:bg-slate-800 flex-1 h-px" />
                                        </div>
                                    )}

                                    {/* Kemasan Items */}
                                    {cartPackagings.map(({ pkg, qty }) => (
                                        <div key={pkg.id} className="flex flex-col gap-[8px] bg-white dark:bg-slate-900 border-b border-[#e8e8e8] dark:border-slate-800 pb-[8px] last:border-0">
                                            <div className="flex items-start justify-between gap-[10px] p-[2px] w-full">
                                                <div className="flex-1 min-w-0 flex flex-col gap-[4.75px]">
                                                    <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[1.4] truncate">
                                                        {pkg.name ?? "Kemasan"}
                                                    </p>
                                                    <span className="text-[10px] text-[#64748b] dark:text-slate-400 font-medium">
                                                        {pkg.volume_ml ? `${pkg.volume_ml}ml` : "Kemasan"}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-[6.34px] items-end shrink-0">
                                                    <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-[1.4] text-right">
                                                        {pkg.is_free ? "GRATIS" : fmt((Number(pkg.selling_price || pkg.price || 0)) * qty)}
                                                    </p>
                                                    <div className="flex items-center gap-[4px]">
                                                        <div className="border border-[#e8e8e8] dark:border-slate-700 rounded-[4.75px] flex items-center overflow-hidden h-[22px] bg-white dark:bg-slate-900">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdatePkgQty(pkg.id, -1)}
                                                                className="size-[22px] bg-[#f7f9fc] dark:bg-slate-800 flex items-center justify-center text-[#64748b] dark:text-slate-300 text-[11px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                            >
                                                                −
                                                            </button>
                                                            <span className="w-[28.5px] h-[22px] flex items-center justify-center text-[12px] font-semibold text-[#0f172a] dark:text-white">
                                                                {qty}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdatePkgQty(pkg.id, 1)}
                                                                className="size-[22px] bg-[#f7f9fc] dark:bg-slate-800 flex items-center justify-center text-[#64748b] dark:text-slate-300 text-[11px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdatePkgQty(pkg.id, -qty)}
                                                            className="p-1 text-slate-300 hover:text-rose-500 rounded transition-colors shrink-0 cursor-pointer"
                                                        >
                                                            <IconTrash size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Card Tambah Kemasan Satuan (Dashed) */}
                                    {packagingMaterials.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPackagingModal(true)}
                                            className="bg-[#fbfbfb] dark:bg-slate-800/40 border border-dashed border-[#d4d4d4] dark:border-slate-700 rounded-[6px] p-[10px] flex items-center justify-between hover:border-[#54b8c3] transition-all text-left cursor-pointer w-full mt-[8px] group"
                                        >
                                            <div className="flex items-center gap-[6.34px]">
                                                <div className="bg-[#fdf3e1] dark:bg-amber-950/40 size-[22.2px] rounded-[4.75px] flex items-center justify-center shrink-0">
                                                    <div className="size-[9.5px] rounded-[1.5px] border-[1.2px] border-[#cc8409]" />
                                                </div>
                                                <div className="flex flex-col gap-[2px] text-[12px] text-[#64748b] dark:text-slate-400">
                                                    <p className="font-semibold text-[#0f172a] dark:text-white leading-[1.4]">
                                                        Tambah Kemasan Satuan
                                                    </p>
                                                    <p className="font-normal leading-[1.4]">
                                                        {packagingMaterials.length} jenis tersedia
                                                    </p>
                                                </div>
                                            </div>
                                            <IconPlus size={16} className="text-slate-400 group-hover:text-[#36adba] transition-colors" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Cart Footer & Total Component (Figma Node 3298:33425) ── */}
                        <div className="bg-white dark:bg-slate-900 border-t border-[#e8e8e8] dark:border-slate-800 rounded-t-[12px] px-[14px] pt-[8px] pb-[12px] flex flex-col gap-[10px] shrink-0 transition-all duration-300 ease-in-out">
                            {/* Handle Pill — Clickable to collapse / expand */}
                            <button
                                type="button"
                                onClick={() => setIsFooterCollapsed(!isFooterCollapsed)}
                                className="w-full flex justify-center py-[4px] cursor-pointer group hover:opacity-90 transition-opacity focus:outline-none shrink-0"
                                title={isFooterCollapsed ? "Buka rincian & diskon" : "Tutup rincian (tampilkan total & bayar saja)"}
                            >
                                <div className="w-[56px] h-[3.5px] bg-[#d4d4d4] dark:bg-slate-700 group-hover:bg-[#54b8c3] rounded-full transition-all duration-300 shrink-0 group-hover:scale-x-110" />
                            </button>

                            {/* Collapsible Content Area (Discount & Subtotal) */}
                            <div
                                className={`grid transition-all duration-300 ease-in-out ${
                                    isFooterCollapsed ? "grid-rows-[0fr] opacity-0 pointer-events-none" : "grid-rows-[1fr] opacity-100"
                                }`}
                            >
                                <div className="overflow-hidden flex flex-col gap-[10px] w-full">
                                    {/* Discount Component */}
                                    {selectedDiscount ? (
                                        <div className="bg-[#f0fdf4] dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-[6px] p-[10px] flex items-center justify-between text-[12px]">
                                            <div className="flex items-center gap-[6px] text-emerald-700 dark:text-emerald-300 font-semibold">
                                                <IconTag size={14} />
                                                <span>Diskon: {selectedDiscount.name} (-{fmt(discountAmount)})</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDiscount(null)}
                                                className="text-[12px] text-rose-500 hover:underline font-semibold cursor-pointer"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowDiscountModal(true)}
                                            className="bg-[#fbfbfb] dark:bg-slate-800/40 border border-dashed border-[#d4d4d4] dark:border-slate-700 rounded-[6px] p-[10px] flex items-center justify-center gap-[8px] hover:border-[#54b8c3] transition-all text-center cursor-pointer w-full text-[12px] font-semibold text-[#64748b] dark:text-slate-300 group"
                                        >
                                            <IconPlus size={14} className="text-[#64748b] dark:text-slate-400 group-hover:text-[#36adba]" />
                                            <span>Tambah Diskon / Voucher</span>
                                        </button>
                                    )}

                                    {/* Subtotal Breakdown */}
                                    <div className="flex flex-col gap-[4px] w-full">
                                        <div className="flex items-center justify-between text-[14px] text-[#0f172a] dark:text-white font-normal leading-[1.4] w-full">
                                            <span>Subtotal</span>
                                            <span>{fmt(subtotal + pkgCartTotal)}</span>
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex items-center justify-between text-[14px] text-emerald-600 dark:text-emerald-400 font-normal leading-[1.4] w-full">
                                                <span>Diskon</span>
                                                <span>-{fmt(discountAmount)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Hairline Divider */}
                                    <div className="h-[0.8px] bg-[#e8e8e8] dark:bg-slate-800 w-full mb-[2px]" />
                                </div>
                            </div>

                            {/* Total Row & Button (Selalu Tampil) */}
                            <div className="flex flex-col gap-[10px] w-full">
                                <div className="flex items-center justify-between text-[#0f172a] dark:text-white text-[16px] leading-[1.4] w-full">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-bold">{fmt(payable)}</span>
                                </div>

                                {/* Button / Bayar Component (Figma Node 3298:33440) */}
                                {showPaymentModal ? (
                                    <ButtonBayar
                                        onClick={handleSubmit}
                                        disabled={(isCash && cash < payable) || isSubmitting || !selectedPaymentId}
                                        loading={isSubmitting}
                                        payable={payable}
                                        fmt={fmt}
                                        label="Selesaikan"
                                    />
                                ) : (
                                    <ButtonBayar
                                        onClick={handleCheckout}
                                        disabled={!totalCartCount}
                                        payable={payable}
                                        fmt={fmt}
                                        label="Bayar"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
