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
    male:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    female: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    unisex: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};
const INTENSITY_COLORS = [
    { bg: "bg-violet-600", bar: "bg-violet-500", light: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", text: "text-violet-700 dark:text-violet-300" },
    { bg: "bg-blue-600",   bar: "bg-blue-500",   light: "bg-blue-50 dark:bg-blue-950/30",     border: "border-blue-200 dark:border-blue-800",     text: "text-blue-700 dark:text-blue-300"   },
    { bg: "bg-teal-600",   bar: "bg-teal-500",   light: "bg-teal-50 dark:bg-teal-950/30",     border: "border-teal-200 dark:border-teal-800",     text: "text-teal-700 dark:text-teal-300"   },
    { bg: "bg-rose-600",   bar: "bg-rose-500",   light: "bg-rose-50 dark:bg-rose-950/30",     border: "border-rose-200 dark:border-rose-800",     text: "text-rose-700 dark:text-rose-300"   },
    { bg: "bg-amber-600",  bar: "bg-amber-500",  light: "bg-amber-50 dark:bg-amber-950/30",   border: "border-amber-200 dark:border-amber-800",   text: "text-amber-700 dark:text-amber-300" },
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
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}/>
            <div className={`relative w-full ${maxW} bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col`} style={{ maxHeight: "92vh" }}>
                <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"/>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Custom Order Modal ───────────────────────────────────────────────────────
function CustomOrderModal({ show, onClose, variants = [], loading = false, onConfirm, initialVariant = null }) {
    const [step,            setStep]            = useState(initialVariant ? 2 : 1);
    const [selectedVariant, setSelectedVariant] = useState(initialVariant);
    const [oilQty,          setOilQty]          = useState("");
    const [alcoholQty,      setAlcoholQty]      = useState("");
    const [customPrice,     setCustomPrice]      = useState("");
    const [priceOverride,   setPriceOverride]    = useState(false);
    const [priceData,       setPriceData]        = useState(null);
    const [loadingPrice,    setLoadingPrice]     = useState(false);
    const [priceError,      setPriceError]       = useState(null);
    const [errors,          setErrors]           = useState({});
    const [search,          setSearch]           = useState("");
    const [filterGender,    setFilterGender]     = useState("all");
    const [qty,             setQty]              = useState(1);
    const [notes,           setNotes]            = useState("");
    const [selectedPkgs,    setSelectedPkgs]     = useState([]);

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
                        variant_id:  selectedVariant.id,
                        oil_qty:     oil,
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
        const oil  = Number(oilQty) || 0;
        const alc  = Number(alcoholQty) || 0;
        if (oil < 1) errs.oil = "Oil qty wajib diisi";
        if (alc < 0) errs.alcohol = "Alkohol tidak boleh negatif";
        if (oil > 0 && alc > oil) errs.alcohol = `Alkohol (${alc}ml) tidak boleh melebihi oil (${oil}ml). Rasio min 1:1.`;
        if (priceData?.min_oil_ml && oil > 0 && oil < priceData.min_oil_ml)
            errs.oil = `Minimum oil ${priceData.min_oil_ml}ml`;
        if (priceData?.max_oil_ml && oil > priceData.max_oil_ml)
            errs.oil = `Maximum oil ${priceData.max_oil_ml}ml`;
        return errs;
    }, [oilQty, alcoholQty, priceData]);

    const totalVolume        = (Number(oilQty) || 0) + (Number(alcoholQty) || 0);
    const finalPrice         = Number(customPrice) || 0;
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
            variant_id:        selectedVariant.id,
            oil_qty:           Number(oilQty),
            alcohol_qty:       Number(alcoholQty) || 0,
            custom_unit_price: finalPrice,
            qty,
            notes,
            packaging_ids:     selectedPkgs,
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
                        <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <IconAdjustments size={16} className="text-amber-600"/>
                        </span>
                        Komposisi Bebas
                    </h3>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 flex items-center justify-center transition-colors">
                    <IconX size={16}/>
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
                            className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                                step === s.n ? "text-amber-600 dark:text-amber-400" :
                                step > s.n   ? "text-emerald-600 cursor-pointer hover:opacity-80" :
                                               "text-slate-400 cursor-not-allowed"
                            }`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                step === s.n ? "bg-amber-500 text-white" :
                                step > s.n   ? "bg-emerald-500 text-white" :
                                               "bg-slate-200 dark:bg-slate-700 text-slate-400"
                            }`}>
                                {step > s.n ? <IconCheck size={11}/> : s.n}
                            </span>
                            {s.label}
                        </button>
                        {s.n < 2 && <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/>}
                    </React.Fragment>
                ))}
            </div>

            {/* ── STEP 1: Pilih Varian ── */}
            {step === 1 && (
                <>
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 space-y-2">
                        <div className="relative">
                            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input type="text" placeholder="Cari varian..." value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"/>
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
                                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"/>
                                <span className="text-sm">Memuat varian...</span>
                            </div>
                        ) : filteredVariants.length === 0 ? (
                            <div className="py-12 text-center">
                                <IconAlertTriangle size={32} className="mx-auto mb-2 text-amber-400"/>
                                <p className="text-sm text-slate-500">
                                    {search || filterGender !== "all" ? "Tidak ada varian sesuai filter" : "Tidak ada varian tersedia"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {filteredVariants.map((variant, idx) => (
                                    <button key={variant.id}
                                        onClick={() => { setSelectedVariant(variant); setStep(2); }}
                                        className="group flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 bg-white dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all text-left">
                                        <div className={`w-10 h-10 rounded-xl ${INTENSITY_COLORS[idx % INTENSITY_COLORS.length].bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                            <IconDroplet size={17} className="text-white"/>
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
                                        <IconChevronRight size={14} className="text-slate-300 group-hover:text-amber-500 flex-shrink-0 transition-colors"/>
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
                        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <IconDroplet size={16} className="text-white"/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-amber-800 dark:text-amber-200 text-sm truncate">{selectedVariant.name}</p>
                                {priceData?.price_per_ml_oil ? (
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                        {fmt(priceData.price_per_ml_oil)}/ml · {priceData.oil_ingredient_name ?? "ingredient oil"}
                                    </p>
                                ) : loadingPrice ? null : (
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        Isi jumlah oil untuk kalkulasi harga otomatis
                                    </p>
                                )}
                            </div>
                            {loadingPrice && <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0"/>}
                        </div>

                        {/* Error kalkulasi harga dari backend */}
                        {priceError && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
                                <IconAlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5"/>
                                <p className="text-xs text-red-700 dark:text-red-400">{priceError}</p>
                            </div>
                        )}

                        {/* Aturan rasio */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                            <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <IconAlertTriangle size={12} className="text-amber-500"/> Aturan Komposisi
                            </p>
                            <p>• Alkohol <span className="font-semibold text-emerald-600 dark:text-emerald-400">GRATIS</span> ke customer (HPP tetap dihitung)</p>
                            <p>• Rasio minimum oil:alkohol = <span className="font-bold">1:1</span></p>
                            <p>• Contoh valid: 27ml oil + 3ml alkohol ✓</p>
                            <p>• Contoh tidak valid: 10ml oil + 15ml alkohol ✗</p>
                        </div>

                        {/* Input komposisi */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"/>
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
                                    className={`w-full h-11 px-3 rounded-xl border text-center text-lg font-black focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white ${
                                        compositionErrors.oil
                                            ? "border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-400/30"
                                            : "border-slate-200 dark:border-slate-700 bg-slate-50 focus:ring-amber-500/30 focus:border-amber-500"
                                    }`}
                                />
                                {compositionErrors.oil && <p className="text-xs text-red-500 mt-1">{compositionErrors.oil}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-blue-400 inline-block"/>
                                    Alkohol (ml)
                                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-black rounded ml-auto">GRATIS</span>
                                </label>
                                <input
                                    type="number" min="0" inputMode="numeric"
                                    value={alcoholQty}
                                    onChange={e => {
                                        setAlcoholQty(e.target.value);
                                        setPriceError(null);
                                    }}
                                    placeholder="cth: 3"
                                    className={`w-full h-11 px-3 rounded-xl border text-center text-lg font-black focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white ${
                                        compositionErrors.alcohol
                                            ? "border-red-400 bg-red-50 dark:bg-red-950/20 focus:ring-red-400/30"
                                            : "border-slate-200 dark:border-slate-700 bg-slate-50 focus:ring-blue-500/30 focus:border-blue-400"
                                    }`}
                                />
                                {compositionErrors.alcohol && <p className="text-xs text-red-500 mt-1">{compositionErrors.alcohol}</p>}
                            </div>
                        </div>

                        {/* Total volume */}
                        {totalVolume > 0 && (
                            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <div className="flex-1 text-xs text-slate-500">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{totalVolume}ml</span> total · {Number(oilQty)||0}ml oil + {Number(alcoholQty)||0}ml alkohol
                                </div>
                                {isCompositionValid && (
                                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                                        <IconCheck size={13}/> Rasio valid
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
                                        <span className="ml-1.5 text-[10px] font-normal text-amber-600">
                                            · otomatis dari harga jual oil
                                        </span>
                                    )}
                                </label>
                                {priceData?.calculated_price > 0 && priceOverride && (
                                    <button onClick={() => { setPriceOverride(false); setCustomPrice(String(priceData.calculated_price)); }}
                                        className="text-[10px] text-amber-600 font-bold hover:underline">
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
                                    className={`w-full h-12 pl-10 pr-16 rounded-xl border text-xl font-black focus:outline-none focus:ring-2 dark:bg-slate-900 dark:text-white ${
                                        errors.price
                                            ? "border-red-400 bg-red-50 focus:ring-red-400/30"
                                            : !priceOverride && customPrice
                                                ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/10 focus:ring-amber-500/30 focus:border-amber-500"
                                                : "border-slate-200 dark:border-slate-700 bg-slate-50 focus:ring-amber-500/30 focus:border-amber-500"
                                    }`}
                                />
                                {customPrice && (
                                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        priceOverride
                                            ? "bg-slate-100 dark:bg-slate-700 text-slate-500"
                                            : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                                    }`}>
                                        {priceOverride ? "manual" : "auto"}
                                    </span>
                                )}
                            </div>
                            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                            {!priceData && !priceError && Number(oilQty) > 0 && !loadingPrice && !customPrice && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                    <IconAlertTriangle size={11}/> Menghitung harga...
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
                                    <IconMinus size={14}/>
                                </button>
                                <span className="text-xl font-black text-slate-800 dark:text-white w-8 text-center">{qty}</span>
                                <button onClick={() => setQty(q => Math.min(99, q + 1))}
                                    className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                    <IconPlus size={14}/>
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
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"/>
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
                            className={`flex-1 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                                isCompositionValid && finalPrice > 0
                                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25"
                                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                            }`}>
                            <IconShoppingCart size={15}/>
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
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                    <IconX size={16}/>
                </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
                {loading ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
                        <span className="text-sm">Memuat konsentrasi...</span>
                    </div>
                ) : intensities.length === 0 ? (
                    <div className="py-12 text-center">
                        <IconAlertTriangle size={32} className="mx-auto mb-2 text-amber-400"/>
                        <p className="text-sm text-slate-500">Tidak ada konsentrasi tersedia untuk varian ini</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                        {intensities.map((intensity, i) => {
                            const c      = INTENSITY_COLORS[i % INTENSITY_COLORS.length];
                            const oilPct = parseFloat(intensity.oil_ratio) || 0;
                            return (
                                <button key={intensity.id} onClick={() => { onSelect(intensity); onClose(); }}
                                    className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${c.border} ${c.light} hover:shadow-md`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                            <IconFlask size={18} className="text-white"/>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 dark:text-white text-sm">{intensity.name}</p>
                                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${c.light} ${c.text}`}>{intensity.code}</span>
                                        </div>
                                        <IconChevronRight size={14} className={`${c.text} flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity`}/>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] text-slate-500">
                                            <span>Kadar minyak</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{intensity.oil_ratio}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/60 dark:bg-slate-700/60 rounded-full overflow-hidden">
                                            <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${Math.min(oilPct, 100)}%` }}/>
                                        </div>
                                        <div className="text-[11px] text-slate-400">Alkohol {intensity.alcohol_ratio}%</div>
                                    </div>
                                </button>
                            );
                        })}

                        {/* Opsi Custom Order (Komposisi Bebas) */}
                        <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => { onSelectCustom(variant); onClose(); }}
                                className="group w-full relative p-3 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-400 hover:bg-amber-50 text-left transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm flex-shrink-0">
                                        <IconAdjustments size={18} className="text-white"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-amber-800 dark:text-amber-200 text-sm">Komposisi Bebas</p>
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">Tentukan rasio ml minyak & alkohol sendiri</span>
                                    </div>
                                    <IconChevronRight size={14} className="text-amber-500 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"/>
                                </div>
                            </button>
                        </div>
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
                        <span className="text-primary-600 dark:text-primary-400">{intensity?.code}</span> · {variant?.name}
                    </h3>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                    <IconX size={16}/>
                </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
                {loading ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
                        <span className="text-sm">Mengecek stok...</span>
                    </div>
                ) : sizes.length === 0 ? (
                    <div className="py-12 text-center">
                        <IconAlertTriangle size={32} className="mx-auto mb-2 text-amber-400"/>
                        <p className="text-sm text-slate-500">Tidak ada ukuran tersedia</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2.5">
                        {sizes.map((size) => (
                            <button key={size.id} onClick={() => { onSelect(size); onClose(); }}
                                className="group flex flex-col items-center p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 bg-white dark:bg-slate-800/50 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-2 shadow-sm">
                                    <IconBottle size={18} className="text-white"/>
                                </div>
                                <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{size.volume_ml}</p>
                                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">ml</p>
                                {size.price != null && (
                                    <p className="text-[11px] font-bold text-primary-600 dark:text-primary-400 mt-1.5 text-center">{fmt(size.price)}</p>
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
    const PKG_BG_LIST = ["bg-orange-500","bg-violet-500","bg-rose-500","bg-teal-500","bg-sky-500","bg-amber-500","bg-indigo-500"];
    return (
        <Modal show={show} onClose={onClose} maxW="max-w-xl">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Kemasan Parfum</h3>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"><IconX size={16}/></button>
            </div>
            {!isPendingMode && (
                <div className="flex border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <button onClick={() => setActiveTab("addon")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${activeTab === "addon" ? "text-primary-600 border-b-2 border-primary-500" : "text-slate-400 hover:text-slate-600"}`}><IconPackage size={13}/> Kemasan Parfum Ini</button>
                    <button onClick={() => setActiveTab("standalone")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${activeTab === "standalone" ? "text-orange-600 border-b-2 border-orange-500" : "text-slate-400 hover:text-slate-600"}`}><IconBox size={13}/> Kemasan Satuan</button>
                </div>
            )}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input type="text" placeholder="Cari kemasan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"/>
                </div>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
                {filtered.map((pkg, idx) => {
                    const bg   = PKG_BG_LIST[idx % PKG_BG_LIST.length];
                    const isOn = selectedPkgs.includes(pkg.id);
                    if (isPendingMode || activeTab === "addon") return (
                        <button key={pkg.id} onClick={() => onToggle(pkg.id)} className={`group flex items-center gap-3 p-3.5 mb-2 rounded-xl border-2 text-left transition-all w-full ${isOn ? "border-primary-400 bg-primary-50 dark:bg-primary-950/20" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50"}`}>
                            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><IconBox size={18} className="text-white"/></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{pkg.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {pkg.is_free ? <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 rounded font-black">GRATIS</span> : <span className="text-[10px] font-bold text-orange-600">+{fmt(pkg.selling_price)}</span>}
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isOn ? "bg-primary-500" : "bg-slate-100 dark:bg-slate-700"}`}>{isOn ? <IconCheck size={13} className="text-white"/> : <IconPlus size={13} className="text-slate-400"/>}</div>
                        </button>
                    );
                    return (
                        <button key={pkg.id} onClick={() => { onAddStandalone(pkg); onClose(); }} className="group flex items-center gap-3 p-3.5 mb-2 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-orange-300 text-left transition-all w-full">
                            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}><IconBox size={18} className="text-white"/></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{pkg.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {pkg.is_free ? <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-black">GRATIS</span> : <span className="text-[10px] font-bold text-orange-600">{fmt(pkg.selling_price)}</span>}
                                </div>
                            </div>
                            <IconPlus size={13} className="text-slate-400 group-hover:text-orange-600 flex-shrink-0"/>
                        </button>
                    );
                })}
            </div>
            
            {isPendingMode && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50">
                    <button onClick={onSubmitPending} disabled={isSubmitting} className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50">
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <IconCheck size={18}/>
                                Lanjut & Tambah ke Keranjang
                            </>
                        )}
                    </button>
                </div>
            )}
        </Modal>
    );
}

// ─── Choose Reward Modal ──────────────────────────────────────────────────────
function ChooseRewardModal({ show, onClose, promo, onApply }) {
    const rewards = promo?.rewards || [
        "P50 Selected Varian",
        "Atomizer",
        "Cashback",
        "Luxury Fragrance Travel Size",
        "Room Spray 100ml",
        "Pengharum Mobil"
    ];
    const [selected, setSelected] = useState(rewards[0]);

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Choose Reward</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { onApply(selected); onClose(); }} 
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                    >
                        Apply
                    </button>
                    <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                        <IconX size={16}/>
                    </button>
                </div>
            </div>
            <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🎁</span>
                    <div>
                        <p className="font-bold text-slate-800 dark:text-white text-sm">Choose One of The Following Rewards</p>
                        <p className="text-xs text-slate-500">There are {rewards.length} rewards for the selected promotion. Choose the desired reward and click button "Apply".</p>
                    </div>
                </div>
                
                <div className="space-y-2">
                    {rewards.map((reward, i) => (
                        <button
                            key={i}
                            onClick={() => setSelected(reward)}
                            className={`w-full p-3.5 rounded-xl border-2 text-center font-semibold transition-all ${
                                selected === reward
                                    ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                                    : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-800 text-slate-700 dark:text-slate-300"
                            }`}
                        >
                            {reward}
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
}

// ─── Discount Modal ───────────────────────────────────────────────────────────
function DiscountModal({ show, onClose, discounts = [], subtotal = 0, onSelect }) {
    const [search, setSearch] = useState("");
    const [manualAmount, setManualAmount] = useState("");

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
                    <IconTag size={20} className="text-emerald-500"/> Pilih Diskon
                </h3>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"><IconX size={16}/></button>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input type="text" placeholder="Cari diskon atau voucher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                </div>
            </div>
            <div className="overflow-y-auto p-4 flex-1 space-y-2">
                {/* Manual Nominal Diskon */}
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 mb-4">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-2">Input Diskon Manual (Rp)</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                            <input type="text" inputMode="numeric" value={toRupiahDisplay(manualAmount)} onChange={e => setManualAmount(parseRupiah(e.target.value).replace(/\D/g, ""))} placeholder="0" className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                        </div>
                        <button 
                            onClick={() => {
                                const amt = Number(manualAmount) || 0;
                                if (amt > 0) {
                                    onSelect({ id: "__manual__", name: "Diskon Manual", amount: amt });
                                    onClose();
                                }
                            }}
                            disabled={!manualAmount || Number(manualAmount) <= 0}
                            className="px-4 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl disabled:opacity-50 text-sm"
                        >Terapkan</button>
                    </div>
                </div>

                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Diskon & Promo Tersedia</p>
                {filtered.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">Tidak ada diskon</div>
                ) : (
                    filtered.map(d => {
                        let calcAmount = 0;
                        if (d.type === 'percentage') {
                            calcAmount = subtotal * (d.value / 100);
                            if (d.max_discount_amount > 0 && calcAmount > d.max_discount_amount) {
                                calcAmount = d.max_discount_amount;
                            }
                        } else if (d.code === 'POIN-MEMBER') {
                            // Cari item P30 EDT di cart untuk dijadikan diskon 100%
                            const rewardItem = carts.find(item => 
                                item.size?.volume_ml === 30 && 
                                item.intensity?.code === 'EDT'
                            );
                            if (rewardItem) {
                                calcAmount = Number(rewardItem.unit_price) * Number(rewardItem.qty);
                            } else {
                                calcAmount = 0;
                            }
                        } else {
                            calcAmount = d.value;
                        }

                        const eligible = !d.min_purchase_amount || subtotal >= d.min_purchase_amount;

                        return (
                            <button key={d.id} disabled={!eligible} onClick={() => {
                                onSelect({ ...d, amount: calcAmount });
                                onClose();
                            }} className={`group flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all w-full ${eligible ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-400" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 opacity-60 cursor-not-allowed"}`}>
                                <div className={`w-10 h-10 rounded-xl ${eligible ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40" : "bg-slate-200 text-slate-400 dark:bg-slate-700"} flex items-center justify-center flex-shrink-0`}><IconTag size={18}/></div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{d.name}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{d.description || (d.type === 'percentage' ? `Diskon ${d.value}%` : `Potongan Rp ${d.value}`)}</p>
                                    {!eligible && <p className="text-[10px] text-red-500 mt-1 font-bold">Minimal belanja: {fmt(d.min_purchase_amount)}</p>}
                                    {eligible && d.code === 'POIN-MEMBER' && calcAmount === 0 && (
                                        <p className="text-[10px] text-orange-600 mt-1 font-bold italic">Tambahkan 1 Parfum P30 EDT ke keranjang untuk menukar poin</p>
                                    )}
                                </div>
                                {eligible && <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-black text-emerald-600">-{fmt(calcAmount)}</p>
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
    const [selectedCustomer,     setSelectedCustomer]     = useState(null);
    const [customerSearch,       setCustomerSearch]       = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showAddCustomer,      setShowAddCustomer]      = useState(false);
    const [selectedSalesPerson,  setSelectedSalesPerson]  = useState(null);
    const [salesSearch,          setSalesSearch]          = useState("");
    const [showSalesDropdown,    setShowSalesDropdown]    = useState(false);

    // ── State: payment ─────────────────────────────────────────────────────────
    const [selectedDiscount,  setSelectedDiscount]  = useState(null);
    const [cashInput,         setCashInput]         = useState("");
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [isSubmitting,      setIsSubmitting]      = useState(false);
    const [showPaymentModal,  setShowPaymentModal]  = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [localAutoPromo, setLocalAutoPromo] = useState(autoPromo);
    
    useEffect(() => {
        setLocalAutoPromo(autoPromo);
    }, [autoPromo]);

    // ── State: cart ────────────────────────────────────────────────────────────
    const [custName,  setCustName]  = useState("");
    const [custPhone, setCustPhone] = useState("");
    const [removingId,     setRemovingId]     = useState(null);
    const [updatingId,     setUpdatingId]     = useState(null);
    const [isHolding,      setIsHolding]      = useState(false);
    const [cartPackagings, setCartPackagings] = useState([]);

    // ── State: regular order builder ───────────────────────────────────────────
    const [selectedIntensity,   setSelectedIntensity]   = useState(null);
    const [selectedVariant,     setSelectedVariant]     = useState(null);
    const [selectedPkgs,        setSelectedPkgs]        = useState([]);
    // Katalog varian POS
    const [catalogVariants,     setCatalogVariants]     = useState([]);
    const [loadingCatalog,      setLoadingCatalog]      = useState(false);
    const [catalogSearch,       setCatalogSearch]       = useState("");
    const [catalogGender,       setCatalogGender]       = useState("all");
    // Intensitas untuk varian terpilih
    const [availableIntensities, setAvailableIntensities] = useState([]);
    const [loadingIntensities,   setLoadingIntensities]   = useState(false);
    const [showIntensityModal,   setShowIntensityModal]   = useState(false);
    // Ukuran
    const [availableSizes,      setAvailableSizes]      = useState([]);
    const [loadingSizes,        setLoadingSizes]        = useState(false);
    const [showSizeModal,       setShowSizeModal]       = useState(false);
    // Kemasan
    const [showPackagingModal,  setShowPackagingModal]  = useState(false);
    const [addingToCart,        setAddingToCart]        = useState(false);
    const [pendingOrder,        setPendingOrder]        = useState(null);

    // ── State: custom order ────────────────────────────────────────────────────
    const [showCustomModal,       setShowCustomModal]       = useState(false);
    const [customVariants,        setCustomVariants]        = useState([]);
    const [loadingCustomVariants, setLoadingCustomVariants] = useState(false);
    const [addingCustomToCart,    setAddingCustomToCart]    = useState(false);
    const [customTabVariant,      setCustomTabVariant]      = useState(null);

    // ── State: misc ────────────────────────────────────────────────────────────
    const [mobileView, setMobileView] = useState("catalog");
    const [leftTab,    setLeftTab]    = useState("parfum");
    const [selectedCategory, setSelectedCategory] = useState(null); // null, 'parfum', 'packaging', 'paperbag'

    // ── State: auto promo ──────────────────────────────────────────────────────
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [lastTriggeredPromoId, setLastTriggeredPromoId] = useState(null);
    const [dismissedPromos, setDismissedPromos] = useState([]);

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

    // Auto-popup jika poin customer >= 30
    useEffect(() => {
        if (selectedCustomer && selectedCustomer.points >= 30 && !dismissedPromos.includes('POIN-MEMBER')) {
            const poinPromo = (discounts || []).find(d => d.code === 'POIN-MEMBER');
            if (poinPromo && !selectedDiscount) {
                setLocalAutoPromo({
                    ...poinPromo,
                    name: "Redeem 30 Poin Member 🎁",
                    description: "Pelanggan memiliki 30 poin! Tambahkan 1 Parfum P30 EDT ke keranjang untuk mendapatkan gratis."
                });
            }
        }
    }, [selectedCustomer, discounts, selectedDiscount, dismissedPromos]);
    useEffect(() => {
        const handler = (e) => {
            if (customerRef.current && !customerRef.current.contains(e.target)) setShowCustomerDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Derived ────────────────────────────────────────────────────────────────
    const discountAmount = useMemo(() => selectedDiscount?.amount ?? 0, [selectedDiscount]);
    const subtotal       = useMemo(() => carts_total ?? 0, [carts_total]);
    const pkgCartTotal   = useMemo(() => cartPackagings.reduce((s, p) => s + (p.pkg.is_free ? 0 : Number(p.pkg.selling_price || 0)) * p.qty, 0), [cartPackagings]);
    const payable        = useMemo(() => Math.max(subtotal + pkgCartTotal - discountAmount, 0), [subtotal, pkgCartTotal, discountAmount]);
    const cartCount      = useMemo(() => carts.reduce((t, i) => t + Number(i.qty), 0), [carts]);
    const pkgCartCount   = useMemo(() => cartPackagings.reduce((s, p) => s + p.qty, 0), [cartPackagings]);
    const totalCartCount = cartCount + pkgCartCount;
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentId);
    const isCash         = !selectedMethod || selectedMethod.type === "cash" || selectedMethod.can_give_change;
    const cash           = useMemo(() => (isCash ? Math.max(0, Number(cashInput) || 0) : payable), [cashInput, isCash, payable]);
    const kembalian      = Math.max(0, cash - payable);

    useEffect(() => { if (!isCash) setCashInput(String(payable)); }, [isCash, payable]);

    // (Obsolete frontend auto-promo calculation removed in favor of backend-driven engine)


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
            const body   = err?.response?.data;
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
        toast.success(`Reward "${rewardName}" selected!`);
        // TODO: Implementasi simpan ke cart/backend
    };

    const submitPendingOrder = (overrideOrder = null) => {
        if (!activeCashDrawer) {
            toast.error("Silakan buka shift terlebih dahulu!");
            return;
        }
        const order = overrideOrder || pendingOrder;
        if (!order) return;
        
        const isCustom = order.type === "custom";
        const finalPayload = { ...order.payload, packaging_ids: selectedPkgs };
        
        const stateSetter = isCustom ? setAddingCustomToCart : setAddingToCart;
        const submitRoute = isCustom ? "transactions.add-custom-to-cart" : "transactions.add-to-cart";
        const successMsg  = isCustom ? "Custom order ditambahkan ke keranjang!" : "Ditambahkan ke keranjang!";
        
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
                stateSetter(false); setMobileView("cart");
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

    const handleResume     = (holdId) => router.post(route("transactions.resume", holdId), {}, { preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "heldCarts"] });
    const handleDeleteHeld = (holdId) => { if (!confirm("Hapus transaksi yang ditahan?")) return; router.delete(route("transactions.delete-held", holdId), { preserveScroll: true, preserveState: true, only: ["carts", "carts_total", "heldCarts"] }); };

    const handleAddPkg = (pkg) => {
        setCartPackagings(prev => {
            const idx = prev.findIndex(p => p.pkg.id === pkg.id);
            if (idx >= 0) return prev.map((p, i) => i === idx ? { ...p, qty: p.qty + 1 } : p);
            return [...prev, { pkg, qty: 1 }];
        });
        toast.success(`${pkg.name} ditambahkan`);
    };

    const handleUpdatePkgQty = (pkgId, delta) =>
        setCartPackagings(prev => prev.map(p => p.pkg.id === pkgId ? { ...p, qty: Math.max(0, p.qty + delta) } : p).filter(p => p.qty > 0));

    const handleCheckout = () => { if (!carts.length) { toast.error("Keranjang kosong"); return; } setShowPaymentModal(true); };

    const handleSubmit = () => {
        if (!selectedCustomer?.id) { toast.error("Pelanggan wajib dipilih!"); return; }
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
        router.post(route("customers.store-ajax"), {
            name: custName,
            phone: custPhone,
        }, {
            onSuccess: () => {
                setIsSubmitting(false);
                setShowAddCustomer(false);
                setCustName("");
                setCustPhone("");
                toast.success("Pelanggan berhasil ditambahkan");
            },
            onError: (errs) => {
                setIsSubmitting(false);
                toast.error(errs?.phone || errs?.name || "Gagal menambah pelanggan");
            }
        });
    };

    const getCartItemTotal = (item) => {
        const pkgTotal = (item.packagings ?? []).reduce((s, p) => s + Number(p.unit_price || 0) * Number(p.qty || 1), 0);
        return (Number(item.unit_price || 0) + pkgTotal / (item.qty || 1)) * Number(item.qty || 1);
    };

    const filteredCustomers = useMemo(() => {
        const list = customerSearch ? customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone ?? "").includes(customerSearch)) : customers;
        return list.slice(0, 8);
    }, [customers, customerSearch]);

    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <>
            <Head title="Transaksi POS"/>

            {/* Modals — alur baru: Varian → Intensitas → Ukuran → Kemasan */}
            <IntensityModal show={showIntensityModal} onClose={() => setShowIntensityModal(false)} variant={selectedVariant} intensities={availableIntensities} loading={loadingIntensities} onSelect={selectIntensity} onSelectCustom={openCustomModalWithVariant}/>
            <SizeModal show={showSizeModal} onClose={() => setShowSizeModal(false)} variant={selectedVariant} intensity={selectedIntensity} sizes={availableSizes} loading={loadingSizes} onSelect={selectSize}/>
            <CustomOrderModal
                show={showCustomModal}
                onClose={() => { setShowCustomModal(false); setCustomTabVariant(null); }}
                variants={customVariants}
                loading={loadingCustomVariants}
                onConfirm={handleCustomConfirm}
                initialVariant={customTabVariant}
            />

            <ChooseRewardModal
                show={showPromoModal}
                onClose={() => setShowPromoModal(false)}
                promo={autoPromo}
                onApply={handleApplyReward}
            />

            <DiscountModal 
                show={showDiscountModal} 
                onClose={() => setShowDiscountModal(false)} 
                discounts={discounts} 
                subtotal={subtotal + pkgCartTotal} 
                onSelect={setSelectedDiscount} 
            />


            {/* Loading overlay */}
            {(addingToCart || addingCustomToCart) && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl">
                        <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"/>
                        <p className="text-sm font-bold text-slate-700 dark:text-white">
                            {addingCustomToCart ? "Menambahkan custom order..." : "Menambahkan ke keranjang..."}
                        </p>
                    </div>
                </div>
            )}

            <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Mobile tab bar */}
                <div className="lg:hidden flex-shrink-0 flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => setMobileView("catalog")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${mobileView === "catalog" ? "text-primary-600 border-b-2 border-primary-500" : "text-slate-400"}`}>
                        <IconFlask size={14}/> Katalog
                    </button>
                    <button onClick={() => setMobileView("cart")} className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors relative ${mobileView === "cart" ? "text-primary-600 border-b-2 border-primary-500" : "text-slate-400"}`}>
                        <IconShoppingCart size={14}/> Keranjang
                        {totalCartCount > 0 && <span className="absolute top-2 right-[20%] w-4 h-4 bg-primary-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{totalCartCount > 9 ? "9+" : totalCartCount}</span>}
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* ── LEFT: Catalog ────────────────────────────────────── */}
                    <div className={`flex-1 flex flex-col overflow-hidden ${mobileView === "catalog" ? "flex" : "hidden lg:flex"}`}>
                        {/* ── Header & Back Button ── */}
                        {selectedCategory && (
                            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setSelectedCategory(null)}
                                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                    >
                                        <IconArrowLeft size={18}/>
                                    </button>
                                    <h1 className="font-black text-slate-800 dark:text-white text-base capitalize">
                                        {selectedCategory === 'packaging' ? 'Kemasan' : selectedCategory}
                                    </h1>
                                </div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                    Pilih Item
                                </div>
                            </div>
                        )}

                        {/* ── Category Selection View ── */}
                        {!selectedCategory && (
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {/* Card Parfum */}
                                    <button 
                                        onClick={() => setSelectedCategory('parfum')}
                                        className="group relative p-8 rounded-[32px] border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-500 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 text-left overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary-500/10 transition-colors" />
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 mb-6 group-hover:scale-110 transition-transform">
                                            <IconFlask size={32} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Pilih Parfum</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Pilih varian, konsentrasi, dan ukuran parfum favorit.</p>
                                        <div className="mt-6 flex items-center gap-1.5 text-primary-600 font-bold text-sm">
                                            Buka Katalog <IconChevronRight size={16} />
                                        </div>
                                    </button>

                                    {/* Card Kemasan */}
                                    <button 
                                        onClick={() => setSelectedCategory('packaging')}
                                        className="group relative p-8 rounded-[32px] border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 text-left overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/10 transition-colors" />
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6 group-hover:scale-110 transition-transform">
                                            <IconBox size={32} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Kemasan</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Botol, tutup spray, dan aksesoris kemasan lainnya.</p>
                                        <div className="mt-6 flex items-center gap-1.5 text-orange-600 font-bold text-sm">
                                            Buka Katalog <IconChevronRight size={16} />
                                        </div>
                                    </button>

                                    {/* Card Paperbag */}
                                    <button 
                                        onClick={() => setSelectedCategory('paperbag')}
                                        className="group relative p-8 rounded-[32px] border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 text-left overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                                            <IconShoppingBag size={32} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Paperbag</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Pilihan tas kertas eksklusif untuk kemasan akhir.</p>
                                        <div className="mt-6 flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                                            Buka Katalog <IconChevronRight size={16} />
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
                                        <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                                        <input type="text" placeholder="Cari varian..." value={catalogSearch}
                                            onChange={e => setCatalogSearch(e.target.value)}
                                            className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"/>
                                    </div>
                                    <div className="flex gap-1">
                                        {["all","male","female"].map(g => (
                                            <button key={g} onClick={() => setCatalogGender(g)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                                    catalogGender === g ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                                                }`}>
                                                {g === "all" ? "Semua" : g === "male" ? "Pria" : "Wanita"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {loadingCatalog ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
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
                                            <IconAlertTriangle size={28} className="text-amber-400 mb-2"/>
                                            <p className="font-semibold text-slate-500 text-sm">Tidak ada varian ditemukan</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {filtered.map((variant, idx) => {
                                                const genderColor = variant.gender === "male"
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                                    : variant.gender === "female"
                                                    ? "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300"
                                                    : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300";
                                                const accentBg = INTENSITY_COLORS[idx % INTENSITY_COLORS.length].bg;
                                                return (
                                                    <button key={variant.id} onClick={() => selectCatalogVariant(variant)}
                                                        className="group flex flex-col rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md transition-all duration-200 overflow-hidden text-left">
                                                        {/* Gambar varian */}
                                                        <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                                            {variant.image_url ? (
                                                                <img src={variant.image_url} alt={variant.name}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                                                            ) : (
                                                                <div className={`w-14 h-14 rounded-2xl ${accentBg} flex items-center justify-center`}>
                                                                    <IconDroplet size={26} className="text-white"/>
                                                                </div>
                                                            )}
                                                            {variant.gender && (
                                                                <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-black ${genderColor}`}>
                                                                    {GENDER_LABEL[variant.gender] ?? variant.gender}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Info */}
                                                        <div className="p-2.5">
                                                            <p className="font-black text-slate-800 dark:text-white text-xs leading-tight line-clamp-2">{variant.name}</p>
                                                            {variant.code && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{variant.code}</p>}
                                                            <div className="mt-1.5 flex items-center justify-between">
                                                                <span className="text-[10px] text-primary-600 dark:text-primary-400 font-bold">Pilih →</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}

                                            {/* Card Custom Order */}
                                            <button onClick={openCustomModal}
                                                className="group flex flex-col rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all duration-200 overflow-hidden text-left">
                                                <div className="w-full aspect-square bg-amber-100/50 dark:bg-amber-900/20 flex items-center justify-center">
                                                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-sm">
                                                        <IconAdjustments size={26} className="text-white"/>
                                                    </div>
                                                </div>
                                                <div className="p-2.5">
                                                    <p className="font-black text-amber-800 dark:text-amber-200 text-xs leading-tight">Komposisi Bebas</p>
                                                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black mt-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">CUSTOM</span>
                                                    <div className="mt-1.5">
                                                        <span className="text-[10px] text-amber-500 font-bold group-hover:text-amber-600">Buat →</span>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* ── TAB KEMASAN / PAPERBAG Content ── */}
                        {(selectedCategory === "packaging" || selectedCategory === "paperbag") && (
                            <div className="flex-1 overflow-y-auto p-4">
                                {(() => {
                                    const items = packagingMaterials.filter(pkg => {
                                        const isPaperbag = pkg.name.toLowerCase().includes('paper bag') || pkg.name.toLowerCase().includes('paperbag');
                                        return selectedCategory === 'paperbag' ? isPaperbag : !isPaperbag;
                                    });

                                    return items.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16">
                                            <IconBox size={28} className="text-slate-300 dark:text-slate-600 mb-3"/>
                                            <p className="font-semibold text-slate-500">Belum ada item di kategori ini</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-[11px] text-slate-400 mb-3 uppercase tracking-wider font-bold">
                                                Klik item untuk menambahkan langsung ke keranjang
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                                {items.map((pkg, i) => {
                                                    const bg     = ["bg-orange-500","bg-violet-500","bg-rose-500","bg-teal-500","bg-sky-500","bg-amber-500","bg-indigo-500"][i % 7];
                                                    const inCart = cartPackagings.find(p => p.pkg.id === pkg.id);
                                                    return (
                                                        <button key={pkg.id} onClick={() => handleAddPkg(pkg)}
                                                            className={`group relative p-4 rounded-2xl border-2 text-left transition-all ${inCart ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300"}`}>
                                                            <div className="flex items-start gap-3 mb-3">
                                                                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shadow-sm flex-shrink-0`}><IconBox size={20} className="text-white"/></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-black text-slate-800 dark:text-white text-sm leading-tight">{pkg.name}</p>
                                                                    {pkg.code && <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{pkg.code}</span>}
                                                                </div>
                                                                {inCart && <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-black text-white">{inCart.qty}</span></div>}
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                {pkg.is_free ? <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 text-xs font-black rounded-lg">GRATIS</span> : <span className="text-sm font-black text-orange-600">{fmt(pkg.selling_price)}</span>}
                                                                <span className="text-[11px] text-slate-400 font-semibold">+ Tambah →</span>
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
                    <div className={`w-full lg:w-[400px] xl:w-[460px] flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 ${mobileView === "cart" ? "flex" : "hidden lg:flex"}`}>
                        {/* Customer & Sales */}
                        <div className="flex-shrink-0 border-b border-slate-100 dark:border-slate-800 px-3 py-2.5 space-y-2.5">
                            {/* Sales Person Selector */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><IconUser size={10}/> Sales Person</p>
                                <div className="relative">
                                    <div className="flex-1 relative">
                                        <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"/>
                                        <input
                                            type="text" placeholder="Pilih Sales..."
                                            value={selectedSalesPerson ? selectedSalesPerson.name : salesSearch}
                                            onClick={() => { if (selectedSalesPerson) { setSelectedSalesPerson(null); setSalesSearch(""); } setShowSalesDropdown(true); }}
                                            onChange={e => { setSalesSearch(e.target.value); setShowSalesDropdown(true); if (selectedSalesPerson) setSelectedSalesPerson(null); }}
                                            className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                        />
                                    </div>
                                    {showSalesDropdown && !selectedSalesPerson && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden max-h-40 overflow-y-auto">
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

                            {/* Customer Selector */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1"><IconUser size={10}/> Pelanggan</p>
                                <div className="relative" ref={customerRef}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 relative">
                                            <IconSearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"/>
                                            <input
                                                type="text" placeholder="Cari nama / no. HP..."
                                                value={selectedCustomer ? selectedCustomer.name : customerSearch}
                                                onClick={() => { if (selectedCustomer) { setSelectedCustomer(null); setCustomerSearch(""); } setShowCustomerDropdown(true); }}
                                                onChange={e => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); if (selectedCustomer) setSelectedCustomer(null); }}
                                                className="w-full h-8 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"
                                            />
                                        </div>
                                        <button onClick={() => setShowAddCustomer(true)} className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 flex items-center justify-center hover:bg-primary-100 flex-shrink-0" title="Tambah Pelanggan Baru">
                                            <IconUserPlus size={14}/>
                                        </button>
                                    </div>
                                    {selectedCustomer && (
                                        <div className="mt-1 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><IconCheck size={10}/> {selectedCustomer.name}</p>
                                                {Number(selectedCustomer.points ?? 0) > 0 && <span className="ml-auto text-[10px] text-amber-500 font-bold">{Number(selectedCustomer.points).toLocaleString("id-ID")} poin</span>}
                                            </div>
                                            
                                            {/* Loyalty Reward Progress/Notification */}
                                            {Number(selectedCustomer.points ?? 0) >= loyalty_reward_threshold ? (
                                                <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 flex items-center gap-2 animate-pulse shadow-sm">
                                                    <span className="text-base flex-shrink-0">🏆</span>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 leading-tight">Reward Tersedia!</p>
                                                        <p className="text-[9px] text-emerald-600 dark:text-emerald-500">{loyalty_reward_description || "Reward diskon tersedia"}</p>
                                                    </div>
                                                </div>
                                            ) : Number(selectedCustomer.points ?? 0) > 0 && (
                                                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-[9px] font-bold text-slate-500">Progress Reward</p>
                                                        <p className="text-[9px] font-bold text-slate-500">{selectedCustomer.points} / {loyalty_reward_threshold}</p>
                                                    </div>
                                                    <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-amber-500 rounded-full transition-all" 
                                                            style={{ width: `${Math.min((selectedCustomer.points / loyalty_reward_threshold) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {showCustomerDropdown && !selectedCustomer && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden max-h-48 overflow-y-auto">
                                            <button onClick={() => { setSelectedCustomer({ id: null, name: "Pelanggan Umum" }); setShowCustomerDropdown(false); setCustomerSearch(""); }} className="w-full text-left px-3 py-2.5 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800">👤 Pelanggan Umum (Walk-in)</button>
                                            {filteredCustomers.map(c => (
                                                <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(""); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                    <p className="font-semibold text-xs text-slate-800 dark:text-white">{c.name}</p>
                                                    <p className="text-[10px] text-slate-400">{c.phone ?? c.code}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Held carts */}
                        {heldCarts.length > 0 && (
                            <div className="flex-shrink-0 border-b border-slate-100 dark:border-slate-800 px-3 py-2 bg-amber-50 dark:bg-amber-950/20">
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1"><IconClock size={10}/> Ditahan ({heldCarts.length})</p>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {heldCarts.map(h => (
                                        <div key={h.hold_id} className="flex-shrink-0 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 flex items-center gap-2">
                                            <div><p className="text-xs font-bold text-slate-800 dark:text-white">{h.label}</p><p className="text-xs text-slate-400">{fmt(h.total)}</p></div>
                                            <button onClick={() => handleResume(h.hold_id)} className="text-xs text-primary-600 font-bold hover:underline">Lanjut</button>
                                            <button onClick={() => handleDeleteHeld(h.hold_id)} className="text-red-400 hover:text-red-600"><IconX size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cart header */}
                        <div className="flex-shrink-0 px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <IconShoppingCart size={11}/> Keranjang
                                {totalCartCount > 0 && <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full text-[10px] font-black">{totalCartCount}</span>}
                            </p>
                            {carts.length > 0 && (
                                <button onClick={handleHold} disabled={isHolding} className="text-[11px] text-amber-600 font-bold flex items-center gap-1 px-2 py-1 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors">
                                    <IconClock size={11}/> Tahan
                                </button>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
                            {carts.length === 0 && cartPackagings.length === 0 ? (
                                <div className="py-10 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3"><IconShoppingCart size={22} className="text-slate-300 dark:text-slate-600"/></div>
                                    <p className="text-sm font-semibold text-slate-400">Keranjang kosong</p>
                                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Pilih parfum dari katalog</p>
                                </div>
                            ) : (
                                <>
                                    {carts.map(item => (
                                        <div key={item.id} className={`rounded-xl p-3 transition-opacity ${removingId === item.id ? "opacity-40" : ""} ${item.is_custom_order ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50" : "bg-slate-50 dark:bg-slate-800/60"}`}>
                                            <div className="flex items-start gap-2.5">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${item.is_custom_order ? "bg-amber-500" : "bg-gradient-to-br from-primary-500 to-primary-700"}`}>
                                                    {item.is_custom_order ? <IconAdjustments size={15} className="text-white"/> : <IconBottle size={15} className="text-white"/>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">{item.variant?.name ?? "Parfum Custom"}</p>
                                                        {item.is_custom_order && <span className="px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-[9px] font-black rounded flex-shrink-0">CUSTOM</span>}
                                                    </div>
                                                    {item.is_custom_order ? (
                                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                                            {item.custom_oil_qty}ml oil · {item.custom_alcohol_qty ?? 0}ml alkohol
                                                            <span className="ml-1.5 px-1 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[9px] font-black rounded">alkohol gratis</span>
                                                        </p>
                                                    ) : (
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            <span className="font-semibold text-primary-500">{item.intensity?.code}</span> · {item.size?.volume_ml}ml
                                                        </p>
                                                    )}
                                                    {(item.packagings ?? []).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.packagings.map((p, pi) => (
                                                                <span key={pi} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${p.packaging_material?.is_free ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700" : "bg-orange-100 dark:bg-orange-900/40 text-orange-700"}`}>
                                                                    {p.packaging_material?.name ?? "Kemasan"}{p.packaging_material?.is_free && " 🎁"}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mt-1.5">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => handleUpdateQty(item.id, item.qty - 1)} disabled={item.qty <= 1 || updatingId === item.id} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"><IconMinus size={10}/></button>
                                                            <span className="w-7 text-center text-sm font-bold text-slate-800 dark:text-white">{item.qty}</span>
                                                            <button onClick={() => handleUpdateQty(item.id, item.qty + 1)} disabled={updatingId === item.id} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"><IconPlus size={10}/></button>
                                                        </div>
                                                        <p className={`text-sm font-black ${item.is_custom_order ? "text-amber-600 dark:text-amber-400" : "text-primary-600 dark:text-primary-400"}`}>{fmt(getCartItemTotal(item))}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemove(item.id)} disabled={removingId === item.id} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0"><IconTrash size={13}/></button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Kemasan standalone */}
                                    {cartPackagings.length > 0 && (
                                        <>
                                            {carts.length > 0 && <div className="flex items-center gap-2 py-0.5"><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><IconPackage size={9}/> Kemasan</span><div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/></div>}
                                            {cartPackagings.map(({ pkg, qty }, i) => (
                                                <div key={pkg.id} className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-xl p-3 flex items-center gap-2.5">
                                                    <div className={`w-9 h-9 rounded-xl ${PKG_BG[i % PKG_BG.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}><IconBox size={15} className="text-white"/></div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{pkg.name}</p>
                                                            {pkg.is_free && <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 text-[9px] font-black rounded flex-shrink-0">GRATIS</span>}
                                                        </div>
                                                        <div className="flex items-center justify-between mt-1.5">
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => handleUpdatePkgQty(pkg.id, -1)} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"><IconMinus size={10}/></button>
                                                                <span className="w-7 text-center text-sm font-bold text-slate-800 dark:text-white">{qty}</span>
                                                                <button onClick={() => handleUpdatePkgQty(pkg.id, 1)} className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"><IconPlus size={10}/></button>
                                                            </div>
                                                            <p className={`text-sm font-black ${pkg.is_free ? "text-emerald-600" : "text-orange-600"}`}>{pkg.is_free ? "GRATIS" : fmt((pkg.is_free ? 0 : Number(pkg.selling_price || 0)) * qty)}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleUpdatePkgQty(pkg.id, -qty)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0"><IconTrash size={13}/></button>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {packagingMaterials.length > 0 && (
                                        <button onClick={() => setShowPackagingModal(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-orange-200 dark:border-orange-800 hover:border-orange-400 hover:bg-orange-50/50 transition-all text-left">
                                            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0"><IconPackage size={15} className="text-orange-600"/></div>
                                            <div className="flex-1 min-w-0"><p className="text-xs font-bold text-orange-700 dark:text-orange-400">Tambah Kemasan Satuan</p><p className="text-[10px] text-slate-400 mt-0.5">{packagingMaterials.length} jenis tersedia</p></div>
                                            <IconChevronRight size={13} className="text-orange-300 flex-shrink-0"/>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Summary + checkout */}
                        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2.5">
                            <button onClick={() => setShowDiscountModal(true)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all ${selectedDiscount ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:bg-primary-50/50"}`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedDiscount ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-slate-100 dark:bg-slate-800"}`}><IconTag size={13} className={selectedDiscount ? "text-emerald-600" : "text-slate-400"}/></div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className={`text-xs font-bold truncate ${selectedDiscount ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>{selectedDiscount ? selectedDiscount.name : "Tambah Diskon / Voucher"}</p>
                                    {selectedDiscount && <p className="text-[10px] text-emerald-600 font-semibold">-{fmt(selectedDiscount.amount)}</p>}
                                </div>
                                {selectedDiscount ? <button onClick={e => { e.stopPropagation(); setSelectedDiscount(null); }} className="p-0.5 text-slate-400 hover:text-red-500 flex-shrink-0"><IconX size={13}/></button> : <IconChevronRight size={13} className="text-slate-300 flex-shrink-0"/>}
                            </button>

                            <div className="space-y-1">
                                {subtotal > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Parfum</span><span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(subtotal)}</span></div>}
                                {pkgCartTotal > 0 && <div className="flex justify-between text-xs"><span className="text-slate-500">Kemasan</span><span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(pkgCartTotal)}</span></div>}
                                {discountAmount > 0 && <div className="flex justify-between text-xs"><span className="text-emerald-600 dark:text-emerald-400">Diskon</span><span className="text-emerald-600 font-bold">-{fmt(discountAmount)}</span></div>}
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span className="font-black text-slate-800 dark:text-white text-sm">Total</span>
                                    <span className="text-2xl font-black text-primary-600 dark:text-primary-400">{fmt(payable)}</span>
                                </div>
                            </div>

                            <button onClick={handleCheckout} disabled={!carts.length}
                                className={`w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${carts.length ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}>
                                <IconReceipt size={16}/>
                                {carts.length ? `Bayar ${fmt(payable)}` : "Keranjang Kosong"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Payment Modal ──────────────────────────────────────────────── */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}/>
                    <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden flex flex-col" style={{ maxHeight: "92vh" }}>
                        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"/></div>
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center"><IconReceipt size={16} className="text-primary-600"/></span>
                                Pembayaran
                            </h3>
                            <button onClick={() => setShowPaymentModal(false)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"><IconX size={16}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2">
                                {selectedCustomer && <div className="pb-2 border-b border-slate-200 dark:border-slate-700"><span className="text-xs text-slate-600 dark:text-slate-400">👤 {selectedCustomer.name}</span></div>}
                                {subtotal > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Parfum</span><span className="font-semibold">{fmt(subtotal)}</span></div>}
                                {pkgCartTotal > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Kemasan</span><span className="font-semibold">{fmt(pkgCartTotal)}</span></div>}
                                {discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-600">{selectedDiscount?.name}</span><span className="text-emerald-600 font-bold">-{fmt(discountAmount)}</span></div>}
                                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-2">
                                    <span className="font-black text-slate-800 dark:text-white">Total Bayar</span>
                                    <span className="text-2xl font-black text-primary-600 dark:text-primary-400">{fmt(payable)}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Metode Pembayaran</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {paymentMethods.map(method => (
                                        <button key={method.id} onClick={() => setSelectedPaymentId(method.id)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedPaymentId === method.id ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30" : "border-slate-200 dark:border-slate-700"}`}>
                                            <p className={`font-bold text-sm ${selectedPaymentId === method.id ? "text-primary-700 dark:text-primary-300" : "text-slate-700 dark:text-slate-300"}`}>{method.name}</p>
                                            <p className="text-xs text-slate-400 capitalize">{method.type}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {isCash && (
                                <div className="space-y-3">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Nominal Cepat</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[payable, Math.ceil(payable / 10000) * 10000, Math.ceil(payable / 50000) * 50000, Math.ceil(payable / 100000) * 100000]
                                            .filter((v, i, a) => a.indexOf(v) === i && v >= payable).slice(0, 4)
                                            .map(amt => (
                                                <button key={amt} onClick={() => setCashInput(String(amt))}
                                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${Number(cashInput) === amt ? "bg-primary-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                                                    {fmt(amt)}
                                                </button>
                                            ))}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Jumlah Diterima</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                            <input type="text" inputMode="numeric" value={cashInput} onChange={e => setCashInput(e.target.value.replace(/\D/g, ""))} placeholder="0"
                                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xl font-black focus:outline-none focus:ring-2 focus:ring-primary-500/30"/>
                                        </div>
                                    </div>
                                    {cash >= payable && payable > 0 && (
                                        <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Kembalian</span>
                                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{fmt(kembalian)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 flex-shrink-0">
                            <button onClick={() => setShowPaymentModal(false)} className="px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Batal</button>
                            <button onClick={handleSubmit} disabled={(isCash && cash < payable) || isSubmitting || !selectedPaymentId}
                                className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${(!isCash || cash >= payable) && !isSubmitting && selectedPaymentId ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}>
                                {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Memproses...</> : <><IconReceipt size={15}/> Selesaikan Transaksi</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Auto Promo Modal ───────────────────────────────────────────── */}
            <Modal show={localAutoPromo !== null} onClose={() => {
                if (localAutoPromo) setDismissedPromos(prev => [...prev, localAutoPromo.id]);
                setLocalAutoPromo(null);
            }} maxW="max-w-md">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-4 shadow-sm border-4 border-white dark:border-slate-900">
                        <span className="text-3xl">🎁</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 leading-tight">Selamat! Promo Tersedia 🎉</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">
                        Pelanggan telah memenuhi syarat untuk mendapatkan <span className="font-bold text-emerald-600 dark:text-emerald-400">{localAutoPromo?.name}</span>.
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
                            }}
                            className="flex-1 py-3 rounded-xl font-black text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition flex justify-center items-center gap-2">
                            Terapkan Promo
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Add Customer Modal ─────────────────────────────────────────── */}
            <Modal show={showAddCustomer} onClose={() => setShowAddCustomer(false)} maxW="max-w-md">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <IconUserPlus size={18} className="text-primary-500"/>
                        Tambah Pelanggan Baru
                    </h3>
                    <button onClick={() => setShowAddCustomer(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"><IconX size={16}/></button>
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

Index.layout = page => <POSLayout children={page}/>;
