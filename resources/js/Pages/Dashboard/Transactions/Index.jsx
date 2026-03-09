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
    IconBuildingStore,
} from "@tabler/icons-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v = 0) =>
    Number(v || 0).toLocaleString("id-ID", {
        style: "currency", currency: "IDR", minimumFractionDigits: 0,
    });

const GENDER_LABEL = { male: "Pria", female: "Wanita", unisex: "Unisex" };
const GENDER_COLOR = {
    male:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    female: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    unisex: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};
const TIER_COLOR = {
    bronze: "text-amber-700", silver: "text-slate-500",
    gold: "text-yellow-500", platinum: "text-violet-500",
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

// ─── Step Badge ───────────────────────────────────────────────────────────────
function StepBadge({ num, label, done, active }) {
    return (
        <div className={`flex items-center gap-1.5 ${active ? "opacity-100" : done ? "opacity-70" : "opacity-30"}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors ${
                done ? "bg-emerald-500 text-white" : active ? "bg-primary-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
            }`}>
                {done ? <IconCheck size={10}/> : num}
            </div>
            <span className={`text-[11px] font-semibold whitespace-nowrap ${active ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>{label}</span>
        </div>
    );
}

// ─── Variant Modal ────────────────────────────────────────────────────────────
function VariantModal({ show, onClose, intensity, variants, loading, onSelect, searchTerm, setSearchTerm, filterGender, setFilterGender }) {
    const filtered = useMemo(() => {
        let f = variants;
        if (filterGender !== "all") f = f.filter(v => v.gender === filterGender);
        if (searchTerm) f = f.filter(v =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.code ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        );
        return f;
    }, [variants, filterGender, searchTerm]);

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-xl">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-xs text-slate-400 mb-0.5">Langkah 2 · Pilih Varian</p>
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-black">{intensity?.code}</span>
                        {intensity?.name}
                    </h3>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 flex items-center justify-center transition-colors">
                    <IconX size={16}/>
                </button>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 space-y-2">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input type="text" placeholder="Cari nama / kode varian..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"/>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {[{ value: "all", label: "Semua" }, { value: "male", label: "Pria" }, { value: "female", label: "Wanita" }, { value: "unisex", label: "Unisex" }].map(g => (
                        <button key={g.value} onClick={() => setFilterGender(g.value)}
                            className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${filterGender === g.value ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"}`}>
                            {g.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
                {loading ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
                        <span className="text-sm">Memuat varian...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-12 text-center">
                        <IconAlertTriangle size={32} className="mx-auto mb-2 text-amber-400"/>
                        <p className="text-sm text-slate-500">Tidak ada varian ditemukan</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filtered.map((variant, idx) => (
                            <button key={variant.id} onClick={() => { onSelect(variant); onClose(); }}
                                className="group flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 bg-white dark:bg-slate-800/50 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all text-left">
                                <div className={`w-10 h-10 rounded-xl ${INTENSITY_COLORS[idx % INTENSITY_COLORS.length].bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                    <IconDroplet size={17} className="text-white"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight truncate">{variant.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        {variant.code && <span className="text-[10px] text-slate-400 font-mono">{variant.code}</span>}
                                        {variant.gender && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${GENDER_COLOR[variant.gender] ?? "bg-slate-100 text-slate-500"}`}>
                                                {GENDER_LABEL[variant.gender] ?? variant.gender}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <IconChevronRight size={14} className="text-slate-300 group-hover:text-primary-500 flex-shrink-0 transition-colors"/>
                            </button>
                        ))}
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
                    <p className="text-xs text-slate-400 mb-0.5">Langkah 3 · Pilih Ukuran</p>
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
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-2 shadow-sm group-hover:shadow-primary-500/30 transition-shadow">
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
function PackagingModal({ show, onClose, packagingMaterials = [], selectedPkgs = [], onToggle, onAddStandalone }) {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("addon"); // addon | standalone

    const filtered = useMemo(() => {
        if (!search) return packagingMaterials;
        return packagingMaterials.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.code ?? "").toLowerCase().includes(search.toLowerCase())
        );
    }, [packagingMaterials, search]);

    const PKG_BG_LIST = ["bg-orange-500", "bg-violet-500", "bg-rose-500", "bg-teal-500", "bg-sky-500", "bg-amber-500", "bg-indigo-500"];

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-xl">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-xs text-slate-400 mb-0.5">Pilih Kemasan</p>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Kemasan Parfum</h3>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 flex items-center justify-center transition-colors">
                    <IconX size={16}/>
                </button>
            </div>

            {/* Tabs: Tambahan (per parfum) vs Satuan (standalone) */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button onClick={() => setActiveTab("addon")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${activeTab === "addon" ? "text-primary-600 border-b-2 border-primary-500" : "text-slate-400 hover:text-slate-600"}`}>
                    <IconPackage size={13}/> Kemasan Parfum Ini
                    {selectedPkgs.length > 0 && activeTab !== "addon" && (
                        <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-[10px] font-black">{selectedPkgs.length}</span>
                    )}
                </button>
                <button onClick={() => setActiveTab("standalone")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${activeTab === "standalone" ? "text-orange-600 border-b-2 border-orange-500" : "text-slate-400 hover:text-slate-600"}`}>
                    <IconBox size={13}/> Kemasan Satuan
                </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="relative">
                    <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input type="text" placeholder="Cari kemasan..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"/>
                </div>
            </div>

            <div className="overflow-y-auto p-4 flex-1">
                {filtered.length === 0 ? (
                    <div className="py-12 text-center">
                        <IconBox size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600"/>
                        <p className="text-sm text-slate-500">Kemasan tidak ditemukan</p>
                    </div>
                ) : activeTab === "addon" ? (
                    /* ── Addon mode: toggle per parfum ── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filtered.map((pkg, idx) => {
                            const isOn = selectedPkgs.includes(pkg.id);
                            const bg = PKG_BG_LIST[idx % PKG_BG_LIST.length];
                            return (
                                <button key={pkg.id} onClick={() => onToggle(pkg.id)}
                                    className={`group flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                                        isOn
                                            ? "border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-950/20"
                                            : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-primary-300 dark:hover:border-primary-700"
                                    }`}>
                                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                        <IconBox size={18} className="text-white"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight truncate">{pkg.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            {pkg.code && <span className="text-[10px] text-slate-400 font-mono">{pkg.code}</span>}
                                            {pkg.is_free
                                                ? <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded font-black">GRATIS</span>
                                                : <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">+{fmt(pkg.selling_price)}</span>
                                            }
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                        isOn ? "bg-primary-500 shadow-md shadow-primary-500/30" : "bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600"
                                    }`}>
                                        {isOn
                                            ? <IconCheck size={13} className="text-white"/>
                                            : <IconPlus size={13} className="text-slate-400"/>
                                        }
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    /* ── Standalone mode: add to cart directly ── */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filtered.map((pkg, idx) => {
                            const bg = PKG_BG_LIST[idx % PKG_BG_LIST.length];
                            return (
                                <button key={pkg.id} onClick={() => { onAddStandalone(pkg); onClose(); }}
                                    className="group flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 text-left transition-all">
                                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                        <IconBox size={18} className="text-white"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight truncate">{pkg.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                            {pkg.code && <span className="text-[10px] text-slate-400 font-mono">{pkg.code}</span>}
                                            {pkg.is_free
                                                ? <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded font-black">GRATIS</span>
                                                : <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{fmt(pkg.selling_price)}</span>
                                            }
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 flex items-center justify-center flex-shrink-0 transition-colors">
                                        <IconPlus size={13} className="text-slate-400 group-hover:text-orange-600"/>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer summary for addon tab */}
            {activeTab === "addon" && selectedPkgs.length > 0 && (
                <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        {packagingMaterials.filter(p => selectedPkgs.includes(p.id)).map((p, i) => (
                            <span key={p.id} className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 rounded-lg text-xs font-semibold text-primary-700 dark:text-primary-300">
                                <IconBox size={10}/>
                                {p.name}
                                {p.is_free ? <span className="text-emerald-600 font-black ml-1">GRATIS</span> : <span className="text-primary-500 ml-1">+{fmt(p.selling_price)}</span>}
                            </span>
                        ))}
                    </div>
                    <button onClick={onClose}
                        className="flex-shrink-0 h-9 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm flex items-center gap-1.5 transition-colors shadow-sm shadow-primary-600/25">
                        <IconCheck size={14}/> Selesai
                    </button>
                </div>
            )}
        </Modal>
    );
}

// ─── Add Customer Modal ───────────────────────────────────────────────────────
function AddCustomerModal({ show, onClose, onSaved }) {
    const [form, setForm] = useState({ name: "", phone: "", email: "", gender: "", birth_date: "" });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })); };

    const handleSave = async () => {
        const errs = {};
        if (!form.name.trim()) errs.name = "Nama wajib diisi";
        if (!form.phone.trim()) errs.phone = "No. HP wajib diisi";
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        try {
            const res = await axios.post(route("customers.store"), form);
            if (res.data.success) { toast.success("Pelanggan berhasil ditambahkan"); onSaved(res.data.data); onClose(); setForm({ name: "", phone: "", email: "", gender: "", birth_date: "" }); }
            else toast.error(res.data.message ?? "Gagal menyimpan");
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) setErrors(data.errors);
            else toast.error(data?.message ?? "Gagal menyimpan pelanggan");
        } finally { setSaving(false); }
    };

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center"><IconUserPlus size={16} className="text-primary-600"/></span>
                    Tambah Pelanggan Baru
                </h3>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"><IconX size={16}/></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-3 flex-1">
                {[
                    { key: "name", label: "Nama Lengkap *", type: "text", placeholder: "Masukkan nama lengkap" },
                    { key: "phone", label: "No. HP *", type: "tel", placeholder: "08xx-xxxx-xxxx" },
                    { key: "email", label: "Email", type: "email", placeholder: "email@contoh.com" },
                ].map(f => (
                    <div key={f.key}>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{f.label}</label>
                        <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                            className={`w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:bg-slate-900 dark:text-white ${errors[f.key] ? "border-red-400 bg-red-50" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"}`}/>
                        {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
                    </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Jenis Kelamin</label>
                        <select value={form.gender} onChange={e => set("gender", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                            <option value="">— Pilih —</option>
                            <option value="male">Pria</option><option value="female">Wanita</option><option value="other">Lainnya</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Tanggal Lahir</label>
                        <input type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"/>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2 flex-shrink-0">
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Batal</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                    {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Menyimpan...</> : <><IconCheck size={15}/> Simpan</>}
                </button>
            </div>
        </Modal>
    );
}

// ─── Discount Modal ───────────────────────────────────────────────────────────
function DiscountModal({ show, onClose, discounts = [], subtotal, selectedDiscount, onApply }) {
    const [search, setSearch] = useState("");
    const [manualType, setManualType] = useState("percentage");
    const [manualValue, setManualValue] = useState("");
    const [activeTab, setActiveTab] = useState("promo");

    const filtered = useMemo(() => {
        const eligible = discounts.filter(d => !d.min_purchase_amount || subtotal >= d.min_purchase_amount);
        if (!search) return eligible;
        return eligible.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || (d.code ?? "").toLowerCase().includes(search.toLowerCase()));
    }, [discounts, search, subtotal]);

    const calcDiscount = (d) => {
        if (d.type === "percentage" || d.discount_category === "percentage") {
            const amt = Math.round(subtotal * (d.value ?? 0) / 100);
            return d.max_discount_amount ? Math.min(amt, d.max_discount_amount) : amt;
        }
        return Math.min(Math.round(d.value ?? 0), subtotal);
    };

    const handleApplyManual = () => {
        const val = parseFloat(manualValue) || 0;
        if (!val) { toast.error("Masukkan nilai diskon"); return; }
        let amount = manualType === "percentage" ? Math.round(subtotal * val / 100) : Math.round(val);
        if (amount > subtotal) { toast.error("Diskon melebihi subtotal"); return; }
        onApply({ id: "__manual__", name: manualType === "percentage" ? `Diskon ${val}%` : `Potongan ${fmt(val)}`, amount });
        onClose();
    };

    return (
        <Modal show={show} onClose={onClose} maxW="max-w-md">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center"><IconTag size={16} className="text-emerald-600"/></span>
                    Diskon & Voucher
                </h3>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"><IconX size={16}/></button>
            </div>
            <div className="flex border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                {[{ key: "promo", label: "Promo / Voucher" }, { key: "manual", label: "Input Manual" }].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-2.5 text-sm font-bold transition-colors ${activeTab === tab.key ? "text-primary-600 border-b-2 border-primary-500" : "text-slate-400 hover:text-slate-600"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>
            {activeTab === "promo" ? (
                <div className="flex flex-col overflow-hidden flex-1">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                        <div className="relative">
                            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kode atau nama promo..."
                                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"/>
                        </div>
                    </div>
                    <div className="overflow-y-auto p-3 space-y-2 flex-1">
                        {selectedDiscount && (
                            <button onClick={() => { onApply(null); onClose(); }} className="w-full p-3 rounded-xl border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-left flex items-center gap-2 hover:bg-red-100 transition-colors">
                                <IconX size={14} className="text-red-500"/><p className="text-sm font-semibold text-red-600 dark:text-red-400">Hapus Diskon</p>
                            </button>
                        )}
                        {filtered.length === 0 ? (
                            <div className="py-8 text-center"><p className="text-sm text-slate-400">Tidak ada promo tersedia</p></div>
                        ) : filtered.map(d => {
                            const discAmt = calcDiscount(d);
                            const isSelected = selectedDiscount?.id === d.id;
                            return (
                                <button key={d.id} onClick={() => { onApply({ ...d, amount: discAmt }); onClose(); }}
                                    className={`w-full p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${isSelected ? "border-primary-400 bg-primary-50 dark:bg-primary-950/30" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-primary-300"}`}>
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${d.type === "percentage" ? "bg-violet-100 dark:bg-violet-900/40" : "bg-emerald-100 dark:bg-emerald-900/40"}`}>
                                        {d.type === "percentage" ? <IconPercentage size={16} className="text-violet-600"/> : <IconCurrencyDollar size={16} className="text-emerald-600"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{d.name}</p>
                                            {d.code && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded text-[10px] font-mono">{d.code}</span>}
                                        </div>
                                        {d.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{d.description}</p>}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-sm text-primary-600 dark:text-primary-400">-{fmt(discAmt)}</p>
                                        {isSelected && <IconCheck size={13} className="text-primary-500 ml-auto mt-0.5"/>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="p-4 space-y-4 flex-1">
                    <div className="flex gap-2">
                        {[{ key: "percentage", label: "Persentase (%)" }, { key: "fixed", label: "Nominal (Rp)" }].map(t => (
                            <button key={t.key} onClick={() => setManualType(t.key)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${manualType === t.key ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300" : "border-slate-200 dark:border-slate-700 text-slate-500"}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">{manualType === "percentage" ? "Persentase" : "Nominal Potongan"}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{manualType === "percentage" ? "%" : "Rp"}</span>
                            <input type="text" inputMode="numeric" value={manualValue} onChange={e => setManualValue(e.target.value.replace(/\D/g, ""))} placeholder="0"
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"/>
                        </div>
                        {manualValue > 0 && <p className="text-xs text-primary-600 mt-1.5 font-semibold">= Potongan {fmt(manualType === "percentage" ? subtotal * manualValue / 100 : parseFloat(manualValue))}</p>}
                    </div>
                    <button onClick={handleApplyManual} className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold flex items-center justify-center gap-2 transition-colors">
                        <IconCheck size={16}/> Terapkan Diskon
                    </button>
                </div>
            )}
        </Modal>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN INDEX
// ═══════════════════════════════════════════════════════════════════════════════
export default function Index({
    carts = [], carts_total = 0, heldCarts = [], intensities = [],
    customers = [], salesPeople = [], packagingMaterials = [],
    paymentMethods = [], discounts = [], storeId = null, storeName = null, error = null,
}) {
    // Customer / Sales
    const [selectedCustomer,     setSelectedCustomer]     = useState(null);
    const [customerSearch,       setCustomerSearch]       = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [showAddCustomer,      setShowAddCustomer]      = useState(false);
    const [selectedSalesPerson,  setSelectedSalesPerson]  = useState(null);
    const [salesSearch,          setSalesSearch]          = useState("");
    const [showSalesDropdown,    setShowSalesDropdown]    = useState(false);

    // Payment
    const [selectedDiscount,  setSelectedDiscount]  = useState(null);
    const [cashInput,         setCashInput]         = useState("");
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [isSubmitting,      setIsSubmitting]      = useState(false);
    const [showPaymentModal,  setShowPaymentModal]  = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);

    // Cart
    const [removingId,     setRemovingId]     = useState(null);
    const [updatingId,     setUpdatingId]     = useState(null);
    const [isHolding,      setIsHolding]      = useState(false);
    const [cartPackagings, setCartPackagings] = useState([]);

    // Builder
    const [selectedIntensity, setSelectedIntensity] = useState(null);
    const [selectedVariant,   setSelectedVariant]   = useState(null);
    const [selectedSize,      setSelectedSize]      = useState(null);
    const [selectedPkgs,      setSelectedPkgs]      = useState([]);
    const [builderQty,        setBuilderQty]        = useState(1);
    const [priceData,         setPriceData]         = useState(null);
    const [loadingPrice,      setLoadingPrice]      = useState(false);
    const [addingToCart,      setAddingToCart]      = useState(false);
    const [availableVariants, setAvailableVariants] = useState([]);
    const [availableSizes,    setAvailableSizes]    = useState([]);
    const [loadingVariants,   setLoadingVariants]   = useState(false);
    const [loadingSizes,      setLoadingSizes]      = useState(false);
    const [showVariantModal,   setShowVariantModal]   = useState(false);
    const [showSizeModal,      setShowSizeModal]      = useState(false);
    const [showPackagingModal, setShowPackagingModal] = useState(false);
    const [variantSearch,      setVariantSearch]      = useState("");
    const [filterGender,       setFilterGender]       = useState("all");

    // Mobile nav
    const [mobileView, setMobileView] = useState("catalog");
    const [leftTab,    setLeftTab]    = useState("parfum"); // parfum | packaging

    const customerRef = useRef(null);
    const salesRef    = useRef(null);

    // Init
    useEffect(() => { if (error) toast.error(error); }, [error]);
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
    useEffect(() => {
        if (selectedIntensity && selectedVariant && selectedSize) fetchPrice();
        else setPriceData(null);
    }, [selectedIntensity, selectedVariant, selectedSize, selectedPkgs]);

    // Derived
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
    const isReadyToAdd   = selectedIntensity && selectedVariant && selectedSize;

    useEffect(() => { if (!isCash) setCashInput(String(payable)); }, [isCash, payable]);

    // Fetch
    const fetchVariants = async (intensityId) => {
        setLoadingVariants(true); setAvailableVariants([]);
        try {
            const res = await axios.get(route("transactions.get-variants"), { params: { intensity_id: intensityId } });
            if (res.data.success) setAvailableVariants(res.data.data);
            else toast.error(res.data.message ?? "Gagal memuat varian");
        } catch { toast.error("Gagal memuat varian"); } finally { setLoadingVariants(false); }
    };

    const fetchSizes = async (intensityId, variantId) => {
        setLoadingSizes(true); setAvailableSizes([]);
        try {
            const res = await axios.get(route("transactions.get-sizes"), { params: { intensity_id: intensityId, variant_id: variantId } });
            if (res.data.success) setAvailableSizes(res.data.data);
            else toast.error(res.data.message ?? "Gagal memuat ukuran");
        } catch { toast.error("Gagal memuat ukuran"); } finally { setLoadingSizes(false); }
    };

    const fetchPrice = async () => {
        setLoadingPrice(true);
        try {
            const res = await axios.post(route("transactions.get-perfume-price"), {
                intensity_id: selectedIntensity.id, variant_id: selectedVariant.id,
                size_id: selectedSize.id, packaging_ids: selectedPkgs,
            });
            if (res.data.success) setPriceData(res.data.data);
            else { toast.error(res.data.message); setPriceData(null); }
        } catch (err) { toast.error(err.response?.data?.message || "Gagal mendapatkan harga"); setPriceData(null); }
        finally { setLoadingPrice(false); }
    };

    // Builder actions
    const selectIntensity = (intensity) => {
        setSelectedIntensity(intensity); setSelectedVariant(null); setSelectedSize(null);
        setSelectedPkgs([]); setPriceData(null); setAvailableVariants([]); setAvailableSizes([]);
        setVariantSearch(""); setFilterGender("all");
        setShowVariantModal(true); fetchVariants(intensity.id);
    };
    const selectVariant = (variant) => {
        setSelectedVariant(variant); setSelectedSize(null); setPriceData(null); setAvailableSizes([]);
        setTimeout(() => setShowSizeModal(true), 80); fetchSizes(selectedIntensity.id, variant.id);
    };
    const togglePkg = (pkgId) => setSelectedPkgs(prev => prev.includes(pkgId) ? prev.filter(id => id !== pkgId) : [...prev, pkgId]);
    const resetBuilder = () => {
        setSelectedIntensity(null); setSelectedVariant(null); setSelectedSize(null);
        setSelectedPkgs([]); setBuilderQty(1); setPriceData(null);
        setAvailableVariants([]); setAvailableSizes([]);
    };

    // Cart actions
    const handleAddToCart = () => {
        if (!selectedIntensity || !selectedVariant || !selectedSize) { toast.error("Lengkapi pilihan"); return; }
        setAddingToCart(true);
        router.post(route("transactions.add-to-cart"), {
            intensity_id: selectedIntensity.id, variant_id: selectedVariant.id,
            size_id: selectedSize.id, packaging_ids: selectedPkgs, qty: builderQty,
        }, {
            preserveScroll: true, preserveState: true, only: ["carts", "carts_total"],
            onSuccess: () => { toast.success("Ditambahkan ke keranjang"); resetBuilder(); setAddingToCart(false); setMobileView("cart"); },
            onError: (errs) => { toast.error(errs?.message || "Gagal menambahkan"); setAddingToCart(false); },
        });
    };

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
        router.post(route("transactions.hold"), {
            label: "Hold " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        }, {
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
    };

    const handleUpdatePkgQty = (pkgId, delta) =>
        setCartPackagings(prev => prev.map(p => p.pkg.id === pkgId ? { ...p, qty: Math.max(0, p.qty + delta) } : p).filter(p => p.qty > 0));

    const handleCheckout = () => { if (!carts.length) { toast.error("Keranjang kosong"); return; } setShowPaymentModal(true); };

    const handleSubmit = () => {
        if (isCash && cash < payable) { toast.error("Jumlah bayar kurang dari total"); return; }
        setIsSubmitting(true);
        router.post(route("transactions.store"), {
            customer_id: selectedCustomer?.id ?? null, sales_person_id: selectedSalesPerson?.id ?? null,
            payment_method_id: selectedPaymentId,
            discount_type_id: selectedDiscount?.id !== "__manual__" ? (selectedDiscount?.id ?? null) : null,
            discount_amount: discountAmount, cash_amount: isCash ? cash : null,
            standalone_packagings: cartPackagings.map(p => ({ packaging_material_id: p.pkg.id, qty: p.qty })),
        }, { onError: (errs) => { setIsSubmitting(false); toast.error(errs?.message || "Gagal menyimpan transaksi"); } });
    };

    const getCartItemTotal = (item) => {
        const pkgTotal = (item.packagings ?? []).reduce((s, p) => s + Number(p.unit_price || 0) * Number(p.qty || 1), 0);
        return (Number(item.unit_price || 0) + pkgTotal / (item.qty || 1)) * Number(item.qty || 1);
    };

    const filteredCustomers = useMemo(() => {
        const list = customerSearch ? customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone ?? "").includes(customerSearch)) : customers;
        return list.slice(0, 8);
    }, [customers, customerSearch]);

    const filteredSalesPeople = useMemo(() => {
        const list = salesSearch ? salesPeople.filter(s => s.name.toLowerCase().includes(salesSearch.toLowerCase()) || (s.code ?? "").toLowerCase().includes(salesSearch.toLowerCase())) : salesPeople;
        return list.slice(0, 8);
    }, [salesPeople, salesSearch]);

    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <>
            <Head title="Transaksi POS"/>

            <VariantModal show={showVariantModal} onClose={() => setShowVariantModal(false)} intensity={selectedIntensity} variants={availableVariants} loading={loadingVariants} onSelect={selectVariant} searchTerm={variantSearch} setSearchTerm={setVariantSearch} filterGender={filterGender} setFilterGender={setFilterGender}/>
            <SizeModal show={showSizeModal} onClose={() => setShowSizeModal(false)} variant={selectedVariant} intensity={selectedIntensity} sizes={availableSizes} loading={loadingSizes} onSelect={s => setSelectedSize(s)}/>
            <PackagingModal
                show={showPackagingModal} onClose={() => setShowPackagingModal(false)}
                packagingMaterials={packagingMaterials}
                selectedPkgs={selectedPkgs}
                onToggle={togglePkg}
                onAddStandalone={handleAddPkg}
            />
            <AddCustomerModal show={showAddCustomer} onClose={() => setShowAddCustomer(false)} onSaved={c => setSelectedCustomer(c)}/>
            <DiscountModal show={showDiscountModal} onClose={() => setShowDiscountModal(false)} discounts={discounts} subtotal={subtotal + pkgCartTotal} selectedDiscount={selectedDiscount} onApply={setSelectedDiscount}/>

            <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">

                {/* Mobile tab bar */}
                <div className="lg:hidden flex-shrink-0 flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <button onClick={() => setMobileView("catalog")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${mobileView === "catalog" ? "text-primary-600 border-b-2 border-primary-500" : "text-slate-400"}`}>
                        <IconFlask size={14}/> Katalog Parfum
                    </button>
                    <button onClick={() => setMobileView("cart")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors relative ${mobileView === "cart" ? "text-primary-600 border-b-2 border-primary-500" : "text-slate-400"}`}>
                        <IconShoppingCart size={14}/> Keranjang
                        {totalCartCount > 0 && (
                            <span className="absolute top-2 right-[20%] w-4 h-4 bg-primary-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                {totalCartCount > 9 ? "9+" : totalCartCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">

                    {/* ── LEFT: Catalog ─────────────────────────────────────── */}
                    <div className={`flex-1 flex flex-col overflow-hidden ${mobileView === "catalog" ? "flex" : "hidden lg:flex"}`}>

                        {/* Header */}
                        <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-4 pb-0">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h1 className="font-black text-slate-800 dark:text-white text-base">Katalog</h1>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Pilih parfum atau tambah kemasan satuan</p>
                                </div>
                                {storeName && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0">
                                        <IconBuildingStore size={12} className="text-slate-400"/>
                                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{storeName}</span>
                                    </div>
                                )}
                            </div>

                            {/* Left panel tabs */}
                            <div className="flex border-b border-slate-200 dark:border-slate-800 -mx-4 px-4">
                                <button onClick={() => setLeftTab("parfum")}
                                    className={`flex items-center gap-1.5 px-1 pb-3 mr-5 text-sm font-bold border-b-2 transition-colors ${leftTab === "parfum" ? "text-primary-600 border-primary-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
                                    <IconFlask size={14}/> Parfum
                                </button>
                                <button onClick={() => setLeftTab("packaging")}
                                    className={`flex items-center gap-1.5 px-1 pb-3 text-sm font-bold border-b-2 transition-colors ${leftTab === "packaging" ? "text-orange-600 border-orange-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
                                    <IconPackage size={14}/> Kemasan Satuan
                                    {pkgCartCount > 0 && (
                                        <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-[10px] font-black">{pkgCartCount}</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Step tracker — only shown for parfum tab */}
                        {leftTab === "parfum" && (
                            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
                                <div className="flex items-center gap-2 overflow-x-auto">
                                    <StepBadge num={1} label="Konsentrasi" done={!!selectedIntensity} active={!selectedIntensity}/>
                                    <div className="w-5 h-px bg-slate-200 dark:bg-slate-700 flex-shrink-0"/>
                                    <StepBadge num={2} label="Varian" done={!!selectedVariant} active={!!selectedIntensity && !selectedVariant}/>
                                    <div className="w-5 h-px bg-slate-200 dark:bg-slate-700 flex-shrink-0"/>
                                    <StepBadge num={3} label="Ukuran" done={!!selectedSize} active={!!selectedVariant && !selectedSize}/>
                                    <div className="w-5 h-px bg-slate-200 dark:bg-slate-700 flex-shrink-0"/>
                                    <StepBadge num={4} label="Tambah" done={false} active={isReadyToAdd}/>
                                </div>
                            </div>
                        )}

                        {/* ── PARFUM TAB: Intensity grid ── */}
                        {leftTab === "parfum" && (
                            <div className="flex-1 overflow-y-auto p-4">
                                {intensities.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-16">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                            <IconFlask size={28} className="text-slate-300 dark:text-slate-600"/>
                                        </div>
                                        <p className="font-semibold text-slate-500">Belum ada konsentrasi</p>
                                        <p className="text-xs text-slate-400 mt-1">Hubungi admin untuk menambahkan</p>
                                    </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {intensities.map((intensity, i) => {
                                        const c = INTENSITY_COLORS[i % INTENSITY_COLORS.length];
                                        const isSelected = selectedIntensity?.id === intensity.id;
                                        const oilPct = parseFloat(intensity.oil_ratio) || 0;
                                        return (
                                            <button key={intensity.id} onClick={() => selectIntensity(intensity)}
                                                className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                                                    isSelected ? `${c.border} ${c.light} shadow-md` : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                                                }`}>
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                                        <IconFlask size={20} className="text-white"/>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-slate-800 dark:text-white text-sm leading-tight">{intensity.name}</p>
                                                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black mt-1 ${c.light} ${c.text}`}>{intensity.code}</span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                                                            <IconCheck size={10} className="text-white"/>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-[11px] text-slate-500">
                                                        <span>Kadar minyak</span>
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">{intensity.oil_ratio}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${Math.min(oilPct, 100)}%` }}/>
                                                    </div>
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-slate-400">Alkohol {intensity.alcohol_ratio}%</span>
                                                        <span className={`${c.text} font-semibold`}>Pilih →</span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                                )}

                                {/* Confirmation bar */}
                        {leftTab === "parfum" && isReadyToAdd && (
                            <div className="flex-shrink-0 border-t-2 border-primary-100 dark:border-primary-900/40 bg-white dark:bg-slate-900 px-4 pt-3 pb-4 space-y-3">
                                {/* Breadcrumb */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button onClick={() => setShowVariantModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors">
                                        <IconFlask size={10}/> {selectedIntensity.code}
                                    </button>
                                    <span className="text-slate-300 dark:text-slate-600 text-xs">›</span>
                                    <button onClick={() => setShowVariantModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors max-w-[160px]">
                                        <IconDroplet size={10}/>
                                        <span className="truncate">{selectedVariant.name}</span>
                                    </button>
                                    <span className="text-slate-300 dark:text-slate-600 text-xs">›</span>
                                    <button onClick={() => setShowSizeModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition-colors">
                                        <IconBottle size={10}/> {selectedSize.volume_ml}ml
                                    </button>
                                    <button onClick={resetBuilder} className="ml-auto p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                                        <IconX size={13}/>
                                    </button>
                                </div>

                                {/* Packaging button */}
                                {packagingMaterials.length > 0 && (
                                    <button onClick={() => setShowPackagingModal(true)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                                            selectedPkgs.length > 0
                                                ? "border-primary-400 dark:border-primary-600 bg-primary-50 dark:bg-primary-950/20"
                                                : "border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-950/20"
                                        }`}>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedPkgs.length > 0 ? "bg-primary-100 dark:bg-primary-900/40" : "bg-slate-100 dark:bg-slate-800"}`}>
                                            <IconPackage size={15} className={selectedPkgs.length > 0 ? "text-primary-600" : "text-slate-400"}/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {selectedPkgs.length > 0 ? (
                                                <>
                                                    <p className="text-xs font-bold text-primary-700 dark:text-primary-300">
                                                        {selectedPkgs.length} kemasan dipilih
                                                    </p>
                                                    <div className="flex gap-1 mt-0.5 flex-wrap">
                                                        {packagingMaterials.filter(p => selectedPkgs.includes(p.id)).map(p => (
                                                            <span key={p.id} className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold">{p.name}{p.is_free ? " (Gratis)" : ""}</span>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-xs font-semibold text-slate-500">Tambah kemasan (opsional)</p>
                                            )}
                                        </div>
                                        {selectedPkgs.length > 0 ? (
                                            <button onClick={e => { e.stopPropagation(); setSelectedPkgs([]); }}
                                                className="p-0.5 text-slate-400 hover:text-red-500 flex-shrink-0 transition-colors">
                                                <IconX size={13}/>
                                            </button>
                                        ) : (
                                            <IconChevronRight size={13} className="text-slate-300 flex-shrink-0"/>
                                        )}
                                    </button>
                                )}

                                {/* Qty + price + add */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                        <button onClick={() => setBuilderQty(Math.max(1, builderQty - 1))} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shadow-sm">
                                            <IconMinus size={13}/>
                                        </button>
                                        <span className="w-9 text-center font-black text-slate-800 dark:text-white">{builderQty}</span>
                                        <button onClick={() => setBuilderQty(builderQty + 1)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors shadow-sm">
                                            <IconPlus size={13}/>
                                        </button>
                                    </div>
                                    <div className="flex-1 text-center">
                                        {loadingPrice ? (
                                            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"/>
                                        ) : priceData ? (
                                            <p className="font-black text-primary-600 dark:text-primary-400 text-lg leading-none">{fmt(priceData.total_price * builderQty)}</p>
                                        ) : <p className="text-xs text-slate-400">Harga tidak tersedia</p>}
                                    </div>
                                    <button onClick={handleAddToCart} disabled={!priceData || addingToCart}
                                        className={`h-11 px-5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all flex-shrink-0 ${priceData && !addingToCart ? "bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/25" : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"}`}>
                                        {addingToCart ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><IconShoppingCart size={15}/> Tambah</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── PACKAGING TAB ── */}
                        {leftTab === "packaging" && (
                            <div className="flex-1 overflow-y-auto p-4">
                                {packagingMaterials.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-16">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                            <IconBox size={28} className="text-slate-300 dark:text-slate-600"/>
                                        </div>
                                        <p className="font-semibold text-slate-500">Belum ada kemasan</p>
                                        <p className="text-xs text-slate-400 mt-1">Hubungi admin untuk menambahkan</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-[11px] text-slate-400 mb-3">Klik kemasan untuk menambahkan langsung ke keranjang</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                            {packagingMaterials.map((pkg, i) => {
                                                const bg = ["bg-orange-500","bg-violet-500","bg-rose-500","bg-teal-500","bg-sky-500","bg-amber-500","bg-indigo-500"][i % 7];
                                                const light = ["bg-orange-50 dark:bg-orange-950/20","bg-violet-50 dark:bg-violet-950/20","bg-rose-50 dark:bg-rose-950/20","bg-teal-50 dark:bg-teal-950/20","bg-sky-50 dark:bg-sky-950/20","bg-amber-50 dark:bg-amber-950/20","bg-indigo-50 dark:bg-indigo-950/20"][i % 7];
                                                const border = ["border-orange-200 dark:border-orange-800","border-violet-200 dark:border-violet-800","border-rose-200 dark:border-rose-800","border-teal-200 dark:border-teal-800","border-sky-200 dark:border-sky-800","border-amber-200 dark:border-amber-800","border-indigo-200 dark:border-indigo-800"][i % 7];
                                                const inCart = cartPackagings.find(p => p.pkg.id === pkg.id);
                                                return (
                                                    <button key={pkg.id} onClick={() => handleAddPkg(pkg)}
                                                        className={`group relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                                                            inCart ? `${border} ${light} shadow-md` : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
                                                        }`}>
                                                        <div className="flex items-start gap-3 mb-3">
                                                            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
                                                                <IconBox size={20} className="text-white"/>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-black text-slate-800 dark:text-white text-sm leading-tight">{pkg.name}</p>
                                                                {pkg.code && <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{pkg.code}</span>}
                                                            </div>
                                                            {inCart && (
                                                                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                                    <span className="text-[10px] font-black text-white">{inCart.qty}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            {pkg.is_free ? (
                                                                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-black rounded-lg">GRATIS</span>
                                                            ) : (
                                                                <span className="text-sm font-black text-orange-600 dark:text-orange-400">{fmt(pkg.selling_price)}</span>
                                                            )}
                                                            <span className="text-[11px] text-slate-400 group-hover:text-orange-500 transition-colors font-semibold">+ Tambah →</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Cart ────────────────────────────────────────── */}
                    <div className={`w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 ${mobileView === "cart" ? "flex" : "hidden lg:flex"}`}>

                        {/* Customer + Sales */}
                        <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 space-y-2">
                            {/* Customer */}
                            <div ref={customerRef} className="relative">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><IconUser size={10}/> Pelanggan</label>
                                    <button onClick={() => setShowAddCustomer(true)} className="text-[10px] text-primary-500 font-bold flex items-center gap-0.5 px-2 py-0.5 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-colors">
                                        <IconUserPlus size={11}/> Baru
                                    </button>
                                </div>
                                <div className="relative">
                                    <input type="text" placeholder="Cari nama / no. HP..."
                                        value={selectedCustomer ? selectedCustomer.name : customerSearch}
                                        onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setShowCustomerDropdown(true); }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        className="w-full h-9 px-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:text-white"/>
                                    {selectedCustomer
                                        ? <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors"><IconX size={13}/></button>
                                        : <IconChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>}
                                </div>
                                {selectedCustomer && (
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><IconCheck size={10}/> {selectedCustomer.name}</p>
                                        {selectedCustomer.tier && <span className={`text-[10px] font-bold capitalize ${TIER_COLOR[selectedCustomer.tier] ?? ""}`}>⭐ {selectedCustomer.tier}</span>}
                                        {selectedCustomer.points > 0 && <span className="ml-auto text-[10px] text-amber-500 font-bold">{Number(selectedCustomer.points).toLocaleString("id-ID")} poin</span>}
                                    </div>
                                )}
                                {showCustomerDropdown && !selectedCustomer && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden max-h-48 overflow-y-auto">
                                        <button onClick={() => { setSelectedCustomer({ id: null, name: "Pelanggan Umum" }); setShowCustomerDropdown(false); setCustomerSearch(""); }}
                                            className="w-full text-left px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
                                            👤 Pelanggan Umum (Walk-in)
                                        </button>
                                        {filteredCustomers.map(c => (
                                            <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerDropdown(false); setCustomerSearch(""); }}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                <p className="font-semibold text-sm text-slate-800 dark:text-white">{c.name}</p>
                                                <p className="text-xs text-slate-400">{c.phone ?? c.code}{c.tier && <span className={`ml-2 capitalize font-semibold ${TIER_COLOR[c.tier] ?? ""}`}>{c.tier}</span>}</p>
                                            </button>
                                        ))}
                                        {filteredCustomers.length === 0 && customerSearch && (
                                            <div className="px-3 py-3 text-center">
                                                <p className="text-sm text-slate-400">Tidak ditemukan</p>
                                                <button onClick={() => { setShowAddCustomer(true); setShowCustomerDropdown(false); }} className="mt-1 text-xs text-primary-500 font-bold flex items-center gap-1 mx-auto">
                                                    <IconUserPlus size={11}/> Tambah baru
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Sales person */}
                            {salesPeople.length > 0 && (
                                <div ref={salesRef} className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Sales Person</label>
                                    <div className="relative">
                                        <input type="text" placeholder="Pilih sales person..."
                                            value={selectedSalesPerson ? selectedSalesPerson.name : salesSearch}
                                            onChange={e => { setSalesSearch(e.target.value); setSelectedSalesPerson(null); setShowSalesDropdown(true); }}
                                            onFocus={() => setShowSalesDropdown(true)}
                                            className="w-full h-9 px-3 pr-7 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:text-white"/>
                                        {selectedSalesPerson ? <button onClick={() => { setSelectedSalesPerson(null); setSalesSearch(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><IconX size={13}/></button>
                                            : <IconChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>}
                                    </div>
                                    {selectedSalesPerson && (
                                        <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                                            <IconCheck size={10}/> {selectedSalesPerson.name} <span className="font-mono text-slate-400 ml-1">{selectedSalesPerson.code}</span>
                                        </p>
                                    )}
                                    {showSalesDropdown && !selectedSalesPerson && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden max-h-40 overflow-y-auto">
                                            {filteredSalesPeople.map(s => (
                                                <button key={s.id} onClick={() => { setSelectedSalesPerson(s); setShowSalesDropdown(false); setSalesSearch(""); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                                    <p className="font-semibold text-sm text-slate-800 dark:text-white">{s.name}</p>
                                                    <p className="text-xs text-slate-400">{s.code}</p>
                                                </button>
                                            ))}
                                            {filteredSalesPeople.length === 0 && <p className="px-3 py-3 text-sm text-slate-400 text-center">Tidak ditemukan</p>}
                                        </div>
                                    )}
                                </div>
                            )}
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

                        {/* Cart items — UNIFIED (parfum + kemasan) */}
                        <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
                            {carts.length === 0 && cartPackagings.length === 0 ? (
                                <div className="py-10 flex flex-col items-center text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                        <IconShoppingCart size={22} className="text-slate-300 dark:text-slate-600"/>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-400">Keranjang kosong</p>
                                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Pilih parfum dari katalog</p>
                                </div>
                            ) : (
                                <>
                                    {/* Parfum items */}
                                    {carts.map(item => (
                                        <div key={item.id} className={`bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 transition-opacity ${removingId === item.id ? "opacity-40" : ""}`}>
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    <IconBottle size={15} className="text-white"/>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate">{item.variant?.name ?? "Parfum Custom"}</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        <span className="font-semibold text-primary-500">{item.intensity?.code}</span> · {item.size?.volume_ml}ml
                                                    </p>
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
                                                            <button onClick={() => handleUpdateQty(item.id, item.qty - 1)} disabled={item.qty <= 1 || updatingId === item.id}
                                                                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm">
                                                                <IconMinus size={10}/>
                                                            </button>
                                                            <span className="w-7 text-center text-sm font-bold text-slate-800 dark:text-white">{item.qty}</span>
                                                            <button onClick={() => handleUpdateQty(item.id, item.qty + 1)} disabled={updatingId === item.id}
                                                                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm">
                                                                <IconPlus size={10}/>
                                                            </button>
                                                        </div>
                                                        <p className="text-sm font-black text-primary-600 dark:text-primary-400">{fmt(getCartItemTotal(item))}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemove(item.id)} disabled={removingId === item.id}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0">
                                                    <IconTrash size={13}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Kemasan standalone — same list */}
                                    {cartPackagings.length > 0 && (
                                        <>
                                            {carts.length > 0 && (
                                                <div className="flex items-center gap-2 py-0.5">
                                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><IconPackage size={9}/> Kemasan</span>
                                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"/>
                                                </div>
                                            )}
                                            {cartPackagings.map(({ pkg, qty }, i) => (
                                                <div key={pkg.id} className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-xl p-3 flex items-center gap-2.5">
                                                    <div className={`w-9 h-9 rounded-xl ${PKG_BG[i % PKG_BG.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                                        <IconBox size={15} className="text-white"/>
                                                    </div>
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
                                                            <p className={`text-sm font-black ${pkg.is_free ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`}>
                                                                {pkg.is_free ? "GRATIS" : fmt((pkg.is_free ? 0 : Number(pkg.selling_price || 0)) * qty)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleUpdatePkgQty(pkg.id, -qty)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0">
                                                        <IconTrash size={13}/>
                                                    </button>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {/* Quick-add packaging button */}
                                    {packagingMaterials.length > 0 && (
                                        <button onClick={() => setShowPackagingModal(true)}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-orange-200 dark:border-orange-800 hover:border-orange-400 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all text-left">
                                            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
                                                <IconPackage size={15} className="text-orange-600 dark:text-orange-400"/>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-orange-700 dark:text-orange-400">Tambah Kemasan Satuan</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{packagingMaterials.length} jenis tersedia</p>
                                            </div>
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
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedDiscount ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-slate-100 dark:bg-slate-800"}`}>
                                    <IconTag size={13} className={selectedDiscount ? "text-emerald-600" : "text-slate-400"}/>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className={`text-xs font-bold truncate ${selectedDiscount ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>
                                        {selectedDiscount ? selectedDiscount.name : "Tambah Diskon / Voucher"}
                                    </p>
                                    {selectedDiscount && <p className="text-[10px] text-emerald-600 font-semibold">-{fmt(selectedDiscount.amount)}</p>}
                                </div>
                                {selectedDiscount
                                    ? <button onClick={e => { e.stopPropagation(); setSelectedDiscount(null); }} className="p-0.5 text-slate-400 hover:text-red-500 flex-shrink-0"><IconX size={13}/></button>
                                    : <IconChevronRight size={13} className="text-slate-300 flex-shrink-0"/>}
                            </button>

                            <div className="space-y-1">
                                {subtotal > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Parfum</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(subtotal)}</span>
                                    </div>
                                )}
                                {pkgCartTotal > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Kemasan</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(pkgCartTotal)}</span>
                                    </div>
                                )}
                                {cartPackagings.some(p => p.pkg.is_free) && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-emerald-600 dark:text-emerald-400">🎁 Gratis ({cartPackagings.filter(p => p.pkg.is_free).reduce((s,p)=>s+p.qty,0)}x)</span>
                                        <span className="text-emerald-600 font-semibold">Rp 0</span>
                                    </div>
                                )}
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-emerald-600 dark:text-emerald-400">Diskon</span>
                                        <span className="text-emerald-600 font-bold">-{fmt(discountAmount)}</span>
                                    </div>
                                )}
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

            {/* PAYMENT MODAL */}
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
                                {(selectedCustomer || selectedSalesPerson) && (
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 flex-wrap gap-1">
                                        {selectedCustomer && <span className="text-xs text-slate-600 dark:text-slate-400">👤 {selectedCustomer.name}</span>}
                                        {selectedSalesPerson && <span className="text-xs text-slate-500 ml-auto">Sales: <strong>{selectedSalesPerson.name}</strong></span>}
                                    </div>
                                )}
                                {subtotal > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Parfum</span><span className="font-semibold">{fmt(subtotal)}</span></div>}
                                {pkgCartTotal > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Kemasan</span><span className="font-semibold">{fmt(pkgCartTotal)}</span></div>}
                                {cartPackagings.some(p => p.pkg.is_free) && <div className="flex justify-between text-xs"><span className="text-emerald-600">🎁 Kemasan gratis</span><span className="text-emerald-600 font-semibold">Rp 0</span></div>}
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
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${selectedPaymentId === method.id ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
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
                                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${Number(cashInput) === amt ? "bg-primary-500 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"}`}>
                                                    {fmt(amt)}
                                                </button>
                                            ))}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 block mb-1.5">Jumlah Diterima</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                            <input type="text" inputMode="numeric" value={cashInput} onChange={e => setCashInput(e.target.value.replace(/\D/g, ""))} placeholder="0"
                                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xl font-black focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"/>
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
        </>
    );
}

Index.layout = page => <POSLayout children={page}/>;
