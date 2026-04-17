import React, { useState, useMemo } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    IconPlus, IconEye, IconEdit, IconTrash, IconFlask,
    IconChevronDown, IconChevronUp, IconAlertTriangle, IconCircleCheck,
    IconFileImport, IconDownload, IconSparkles, IconSearch,
    IconX, IconDroplet, IconLock, IconPackage, IconRefresh,
    IconChevronRight, IconUsers, IconAdjustments,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ color = "slate", children, size = "md" }) => {
    const colors = {
        teal: "bg-teal-50 text-teal-700 ring-teal-200",
        green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
        amber: "bg-amber-50 text-amber-700 ring-amber-200",
        slate: "bg-slate-100 text-slate-600 ring-slate-200",
        blue: "bg-blue-50 text-blue-700 ring-blue-200",
        red: "bg-red-50 text-red-600 ring-red-200",
    };
    const sizes = {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2 py-0.5 text-[11px]",
    };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${colors[color] ?? colors.slate} ${sizes[size] ?? sizes.md}`}>
            {children}
        </span>
    );
};

const TypeDot = ({ type }) => {
    const cls =
        type === "oil" ? "bg-teal-400" :
            type === "alcohol" ? "bg-blue-400" :
                "bg-slate-300";
    return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cls}`} />;
};

const GenderIcon = ({ gender }) => {
    const map = { male: "♂", female: "♀", unisex: "⚥" };
    const cls = {
        male: "text-blue-500 bg-blue-50 border-blue-100",
        female: "text-pink-500 bg-pink-50 border-pink-100",
        unisex: "text-purple-500 bg-purple-50 border-purple-100",
    };
    if (!gender) return null;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${cls[gender] ?? "text-slate-400 bg-slate-50 border-slate-100"}`}>
            {map[gender] ?? gender}
        </span>
    );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ show, title, message, onConfirm, onClose, loading }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <IconAlertTriangle size={22} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">{message}</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-5 py-2.5 text-sm font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                        {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Intensity Detail Row ─────────────────────────────────────────────────────
function IntensityDetailRow({ intensity, variantId, onDelete }) {
    const [generating, setGenerating] = useState(false);
    const hasScaling = intensity.size_scaling && intensity.size_scaling.length > 0;
    const isGenerated = intensity.is_generated === true;

    const handleGenerate = () => {
        if (!hasScaling) { toast.error("Kalibrasi IntensitySizeQuantity belum diset"); return; }
        if (isGenerated) { toast("Products sudah di-generate. Gunakan Regenerate di halaman Detail.", { icon: "🔒" }); return; }
        setGenerating(true);
        router.post(
            route("recipes.generate-products", [variantId, intensity.intensity_id]),
            { regenerate: false },
            {
                onSuccess: (page) => {
                    const flash = page.props?.flash ?? {};
                    if (flash.success) toast.success(flash.success);
                    else if (flash.warning) toast(flash.warning, { icon: "⚠️" });
                    else toast.success("Products berhasil di-generate!");
                },
                onError: () => toast.error("Gagal generate products"),
                onFinish: () => setGenerating(false),
            }
        );
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">

            {/* ── Header ── */}
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2">

                {/* Row 1: badge + name + actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <Badge color="teal">{intensity.intensity.code}</Badge>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {intensity.intensity.name}
                        </span>
                    </div>
                    {/* Action icons + generate button */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                            href={route("recipes.show", [variantId, intensity.intensity_id])}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition"
                            title="Detail"
                        >
                            <IconEye size={14} />
                        </Link>
                        <Link
                            href={route("recipes.edit", [variantId, intensity.intensity_id])}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition"
                            title="Edit"
                        >
                            <IconEdit size={14} />
                        </Link>
                        <button
                            onClick={() => onDelete(intensity, variantId)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Hapus"
                        >
                            <IconTrash size={14} />
                        </button>

                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                        {isGenerated ? (
                            <Link
                                href={route("recipes.show", [variantId, intensity.intensity_id])}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-lg text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
                            >
                                <IconLock size={11} /> Generated
                            </Link>
                        ) : (
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !hasScaling}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-bold hover:bg-teal-700 transition shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {generating
                                    ? <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Generating</>
                                    : <><IconSparkles size={11} /> Generate</>
                                }
                            </button>
                        )}
                    </div>
                </div>

                {/* Row 2: meta badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400">
                        {intensity.ingredient_count} bahan · {parseFloat(intensity.total_volume).toFixed(0)}ml
                    </span>
                    {isGenerated && (
                        <Badge color="green" size="sm"><IconCircleCheck size={9} /> Generated</Badge>
                    )}
                    {!hasScaling && (
                        <Badge color="amber" size="sm"><IconAlertTriangle size={9} /> Belum kalibrasi</Badge>
                    )}
                </div>
            </div>

            {/* ── Body: ingredients + scaling stacked vertically ── */}
            <div className="p-4 flex flex-col gap-5">

                {/* Ingredients */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Komposisi Bahan (Base 30ml)
                    </p>
                    <div className="space-y-1.5">
                        {intensity.recipes.slice(0, 6).map((recipe, idx) => {
                            const type = recipe.ingredient?.category?.ingredient_type;
                            return (
                                <div key={recipe.id ?? idx} className="flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                        <TypeDot type={type} />
                                        <span className="text-slate-600 dark:text-slate-400 truncate">
                                            {recipe.ingredient?.name ?? "—"}
                                        </span>
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 flex-shrink-0 tabular-nums">
                                        {parseFloat(recipe.base_quantity).toFixed(2)}
                                        <span className="text-slate-400 font-normal ml-0.5">{recipe.unit}</span>
                                    </span>
                                </div>
                            );
                        })}
                        {intensity.recipes.length > 6 && (
                            <p className="text-[10px] text-slate-400 text-center pt-1">
                                +{intensity.recipes.length - 6} bahan lainnya
                            </p>
                        )}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400">
                            <span>Total:</span>
                            <span>{parseFloat(intensity.total_volume).toFixed(2)} ml</span>
                        </div>
                    </div>
                </div>

                {/* Size Scaling */}
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Scaling per Ukuran
                    </p>
                    {!hasScaling ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                            <IconAlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                            <span className="text-[11px] text-amber-700">IntensitySizeQuantity belum dikonfigurasi</span>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {intensity.size_scaling.map((s, si) => (
                                <div
                                    key={si}
                                    className="flex items-center gap-3 text-xs bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800"
                                >
                                    {/* Volume label */}
                                    <span className="font-bold text-teal-600 tabular-nums w-12 flex-shrink-0">
                                        {s.volume_ml}ml
                                    </span>

                                    {/* Tags */}
                                    <div className="flex gap-1 flex-wrap flex-1">
                                        {s.oil_quantity > 0 && (
                                            <span className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded border border-teal-100 whitespace-nowrap">
                                                Oil {s.oil_quantity}
                                            </span>
                                        )}
                                        {s.alcohol_quantity > 0 && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                                                Alc {s.alcohol_quantity}
                                            </span>
                                        )}
                                        {s.other_quantity > 0 && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                                Other {s.other_quantity}
                                            </span>
                                        )}
                                    </div>

                                    {/* Total + check */}
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                            {s.total_volume}
                                        </span>
                                        <span className="text-slate-400">ml</span>
                                        {intensity.generated_sizes?.includes(s.size_id) && (
                                            <IconCircleCheck size={11} className="text-emerald-500 ml-0.5" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Variant Card ─────────────────────────────────────────────────────────────
function VariantCard({ variantGroup, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const { variant, intensities, intensity_count, total_ingredients, is_any_generated, is_all_generated } = variantGroup;

    const accentColor =
        is_all_generated ? "from-emerald-400 to-emerald-500" :
            is_any_generated ? "from-teal-400 to-teal-500" :
                "from-amber-300 to-orange-400";

    const statusBadge =
        is_all_generated ? (
            <Badge color="green"><IconCircleCheck size={9} /> Semua Generated</Badge>
        ) : is_any_generated ? (
            <Badge color="teal"><IconSparkles size={9} /> Sebagian Generated</Badge>
        ) : (
            <Badge color="amber"><IconAlertTriangle size={9} /> Belum Generated</Badge>
        );

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-300 hover:shadow-md shadow-sm transition-all duration-200 overflow-hidden">
            {/* Top accent */}
            <div className={`h-1 w-full bg-gradient-to-r ${accentColor}`} />

            {/* Card header */}
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                {variant.name}
                            </h3>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {variant.code}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <GenderIcon gender={variant.gender} />
                            {statusBadge}
                        </div>
                    </div>
                    <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 rounded-xl flex-shrink-0">
                        <IconFlask size={20} className="text-teal-600 dark:text-teal-400" />
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                        { label: "Intensitas", value: intensity_count, icon: <IconAdjustments size={12} className="text-teal-500" />, color: "text-teal-600" },
                        { label: "Total Bahan", value: total_ingredients, icon: <IconDroplet size={12} className="text-blue-500" />, color: "text-blue-600" },
                        { label: "Generated", value: `${intensities.filter(i => i.is_generated).length}/${intensity_count}`, icon: <IconPackage size={12} className="text-emerald-500" />, color: "text-emerald-600" },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1 mb-0.5">{icon}</div>
                            <div className={`font-bold tabular-nums text-sm ${color}`}>{value}</div>
                            <div className="text-[10px] text-slate-400">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Intensity pills (collapsed) */}
                {!expanded && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {intensities.map((it, i) => (
                            <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border ${it.is_generated
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                    }`}
                            >
                                {it.is_generated && <IconCircleCheck size={9} />}
                                {it.intensity.code}
                            </span>
                        ))}
                    </div>
                )}

                {/* Expand / collapse */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${expanded
                        ? "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-500/20"
                        : "bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-950/40 border border-teal-200 dark:border-teal-900"
                        }`}
                >
                    {expanded
                        ? <><IconChevronUp size={14} /> Sembunyikan Detail</>
                        : <><IconChevronDown size={14} /> Lihat {intensity_count} Intensitas &amp; Resep</>
                    }
                </button>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-5 pb-5">
                    <div className="pt-4 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <IconAdjustments size={11} /> Detail per Intensitas
                        </p>
                        {intensities.map((intensity) => (
                            <IntensityDetailRow
                                key={`${intensity.variant_id}-${intensity.intensity_id}`}
                                intensity={intensity}
                                variantId={variant.id}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ variantGroups }) {
    const stats = useMemo(() => {
        const totalVariants = variantGroups.length;
        const totalFormulas = variantGroups.reduce((s, g) => s + g.intensity_count, 0);
        const totalGenerated = variantGroups.reduce((s, g) => s + g.intensities.filter(i => i.is_generated).length, 0);
        const totalIngredients = variantGroups.reduce((s, g) => s + g.total_ingredients, 0);
        return { totalVariants, totalFormulas, totalGenerated, totalIngredients };
    }, [variantGroups]);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
                { label: "Total Variant", value: stats.totalVariants, icon: IconFlask, color: "text-teal-600", bg: "bg-teal-50" },
                { label: "Total Formula", value: stats.totalFormulas, icon: IconAdjustments, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Sudah Generated", value: stats.totalGenerated, icon: IconSparkles, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Total Bahan", value: stats.totalIngredients, icon: IconDroplet, color: "text-slate-600", bg: "bg-slate-100" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={18} className={color} />
                    </div>
                    <div>
                        <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
                        <div className="text-[11px] text-slate-500">{label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Main Index ───────────────────────────────────────────────────────────────
export default function Index({ variantRecipes }) {
    const [search, setSearch] = useState("");
    const [filterStatus, setFilter] = useState("all");
    const [deleteModal, setDeleteModal] = useState({ show: false, item: null, variantId: null, loading: false });

    const filtered = useMemo(() => variantRecipes.filter(group => {
        const matchSearch =
            !search ||
            group.variant.name.toLowerCase().includes(search.toLowerCase()) ||
            group.variant.code.toLowerCase().includes(search.toLowerCase()) ||
            group.intensities.some(i =>
                i.intensity.name.toLowerCase().includes(search.toLowerCase()) ||
                i.intensity.code.toLowerCase().includes(search.toLowerCase())
            );
        const matchFilter =
            filterStatus === "all" ||
            (filterStatus === "generated" && group.is_any_generated && !group.is_all_generated) ||
            (filterStatus === "all_generated" && group.is_all_generated) ||
            (filterStatus === "pending" && !group.is_any_generated);
        return matchSearch && matchFilter;
    }), [variantRecipes, search, filterStatus]);

    const confirmDelete = (intensity, variantId) =>
        setDeleteModal({ show: true, item: intensity, variantId, loading: false });
    const closeDelete = () =>
        setDeleteModal({ show: false, item: null, variantId: null, loading: false });

    const handleDelete = () => {
        const { item, variantId } = deleteModal;
        setDeleteModal(prev => ({ ...prev, loading: true }));
        router.delete(route("recipes.destroy", [variantId, item.intensity_id]), {
            onSuccess: () => { closeDelete(); toast.success("Formula berhasil dihapus"); },
            onError: () => { closeDelete(); toast.error("Gagal menghapus formula"); },
        });
    };

    return (
        <>
            <Head title="Formula Variant" />

            {/* ── Page Header ── */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="p-2 bg-teal-600 rounded-lg text-white shadow-lg shadow-teal-500/30">
                            <IconFlask size={20} />
                        </div>
                        Formula Variant
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 ml-11">
                        Base recipe 30ml — tersusun per variant &amp; intensitas
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <a
                        href={route("recipes.import.template")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
                    >
                        <IconDownload size={15} /> Template
                    </a>
                    <Link
                        href={route("recipes.import.index")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
                    >
                        <IconFileImport size={15} /> Import
                    </Link>
                    <Link
                        href={route("recipes.create")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition"
                    >
                        <IconPlus size={15} /> Buat Formula
                    </Link>
                </div>
            </div>

            {/* ── Stats ── */}
            {variantRecipes.length > 0 && <StatsBar variantGroups={variantRecipes} />}

            {/* ── Search & Filter ── */}
            {variantRecipes.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <div className="relative flex-1">
                        <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari variant, kode, intensitas…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 transition"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <IconX size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {[
                            { key: "all", label: "Semua" },
                            { key: "all_generated", label: "✓ Semua Generated" },
                            { key: "generated", label: "~ Sebagian" },
                            { key: "pending", label: "⚠ Belum" },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${filterStatus === key
                                    ? "bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-500/20"
                                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {(search || filterStatus !== "all") && (
                <p className="text-xs text-slate-500 mb-3">
                    Menampilkan <strong>{filtered.length}</strong> dari {variantRecipes.length} variant
                </p>
            )}

            {/* ── Cards Grid ── */}
            {/*
                Max 3 columns (xl:grid-cols-3) — card dengan expanded detail butuh lebar cukup.
                4 kolom membuat IntensityDetailRow terlalu sempit.
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {variantRecipes.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-slate-900 p-16 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <IconFlask size={32} className="text-teal-400" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1">Belum ada formula variant</p>
                        <p className="text-sm text-slate-400 mb-5">Mulai buat formula pertama Anda</p>
                        <Link
                            href={route("recipes.create")}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-500/30"
                        >
                            <IconPlus size={18} /> Buat Formula Baru
                        </Link>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-slate-900 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                        <IconSearch size={32} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-semibold">Tidak ada hasil yang sesuai</p>
                        <button
                            onClick={() => { setSearch(""); setFilter("all"); }}
                            className="mt-3 text-sm text-teal-600 hover:underline"
                        >
                            Reset filter
                        </button>
                    </div>
                ) : filtered.map((group) => (
                    <VariantCard
                        key={group.variant_id}
                        variantGroup={group}
                        onDelete={confirmDelete}
                    />
                ))}
            </div>

            {/* ── Delete Modal ── */}
            <DeleteModal
                show={deleteModal.show}
                loading={deleteModal.loading}
                title={`Hapus Formula "${deleteModal.item?.intensity?.name}"?`}
                message="Formula yang dihapus tidak dapat dikembalikan. Product yang sudah di-generate tidak akan terpengaruh."
                onConfirm={handleDelete}
                onClose={closeDelete}
            />
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;