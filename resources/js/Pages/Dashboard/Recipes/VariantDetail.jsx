import React, { useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    IconArrowLeft, IconEye, IconEdit, IconTrash, IconFlask,
    IconAlertTriangle, IconCircleCheck, IconLock, IconSparkles,
    IconAdjustments, IconPlus, IconCirclePlus,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ color = "slate", children, size = "md" }) => {
    const colors = {
        teal: "bg-slate-100 text-slate-700 ring-teal-200",
        green: "bg-slate-100 text-slate-700 ring-emerald-200",
        amber: "bg-slate-100 text-slate-700 ring-amber-200",
        slate: "bg-slate-100 text-slate-600 ring-slate-200",
        red: "bg-slate-100 text-slate-700 ring-red-200",
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
    const map = { male: "Pria", female: "Wanita", unisex: "Unisex" };
    const iconMap = {
        male: <span className="text-blue-500 font-bold">♂</span>,
        female: <span className="text-pink-500 font-bold">♀</span>,
        unisex: <span className="text-purple-500 font-bold">⚥</span>
    };
    if (!gender) return null;
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border text-slate-700 bg-white border-slate-200 dark:text-slate-350 dark:bg-slate-900 dark:border-slate-800">
            {iconMap[gender]}
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
                    <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <IconAlertTriangle size={22} className="text-slate-700" />
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
    const [addingSizeId, setAddingSizeId] = useState(null);
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

    const handleAddSizeToPos = (sizeId) => {
        setAddingSizeId(sizeId);
        router.post(
            route("recipes.generate-size", [variantId, intensity.intensity_id, sizeId]),
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props?.flash ?? {};
                    if (flash.success) toast.success(flash.success);
                    else if (flash.warning) toast(flash.warning, { icon: "⚠️" });
                },
                onError: () => toast.error("Gagal menambahkan ukuran ke POS"),
                onFinish: () => setAddingSizeId(null),
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
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-teal-900/30 rounded-lg transition"
                            title="Detail"
                        >
                            <IconEye size={14} />
                        </Link>
                        <Link
                            href={route("recipes.edit", [variantId, intensity.intensity_id])}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-amber-900/30 rounded-lg transition"
                            title="Edit"
                        >
                            <IconEdit size={14} />
                        </Link>
                        <button
                            onClick={() => onDelete(intensity, variantId)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-red-900/30 rounded-lg transition"
                            title="Hapus"
                        >
                            <IconTrash size={14} />
                        </button>

                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                        {isGenerated ? (
                            <Link
                                href={route("recipes.show", [variantId, intensity.intensity_id])}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
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
                        {intensity.recipes.map((recipe, idx) => {
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
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5 flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
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
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-100 border border-slate-300">
                            <IconAlertTriangle size={12} className="text-slate-700 flex-shrink-0" />
                            <span className="text-[11px] text-slate-700">IntensitySizeQuantity belum dikonfigurasi</span>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {intensity.size_scaling.map((s, si) => {
                                const isSizeGenerated = intensity.generated_sizes?.includes(s.size_id);
                                const isAdding = addingSizeId === s.size_id;
                                return (
                                    <div
                                        key={si}
                                        className="flex items-center gap-3 text-xs bg-white dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-800"
                                    >
                                        {/* Volume label */}
                                        <span className="font-bold text-slate-700 tabular-nums w-12 flex-shrink-0">
                                            {s.volume_ml}ml
                                        </span>

                                        {/* Tags */}
                                        <div className="flex gap-1 flex-wrap flex-1">
                                            {s.oil_quantity > 0 && (
                                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-teal-100 whitespace-nowrap">
                                                    Oil {s.oil_quantity}
                                                </span>
                                            )}
                                            {s.alcohol_quantity > 0 && (
                                                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                                                    Alc {s.alcohol_quantity}
                                                </span>
                                            )}
                                            {s.other_quantity > 0 && (
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                                    Other {s.other_quantity}
                                                </span>
                                            )}
                                        </div>

                                        {/* Add to POS / status */}
                                        {!isSizeGenerated && (
                                            <button
                                                onClick={() => handleAddSizeToPos(s.size_id)}
                                                disabled={isAdding}
                                                title="Tambahkan ukuran ini ke POS"
                                                className="flex items-center gap-1 px-2 py-1 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900 rounded-md text-[10px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition flex-shrink-0 disabled:opacity-50"
                                            >
                                                {isAdding
                                                    ? <div className="w-2.5 h-2.5 border border-teal-600 border-t-transparent rounded-full animate-spin" />
                                                    : <IconCirclePlus size={12} />
                                                }
                                                Tambah ke POS
                                            </button>
                                        )}

                                        {/* Total + check */}
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                                            <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                                                {s.total_volume}
                                            </span>
                                            <span className="text-slate-400">ml</span>
                                            {isSizeGenerated && (
                                                <IconCircleCheck size={11} className="text-slate-700 ml-0.5" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function VariantDetail({ variant, intensities, total_ingredients }) {
    const [deleteModal, setDeleteModal] = useState({ show: false, item: null, loading: false });

    const generatedCount = intensities.filter(i => i.is_generated).length;

    const confirmDelete = (intensity) =>
        setDeleteModal({ show: true, item: intensity, loading: false });
    const closeDelete = () =>
        setDeleteModal({ show: false, item: null, loading: false });

    const handleDelete = () => {
        const { item } = deleteModal;
        setDeleteModal(prev => ({ ...prev, loading: true }));
        router.delete(route("recipes.destroy", [variant.id, item.intensity_id]), {
            onSuccess: () => { closeDelete(); toast.success("Formula berhasil dihapus"); },
            onError: () => { closeDelete(); toast.error("Gagal menghapus formula"); },
        });
    };

    return (
        <>
            <Head title={`Formula — ${variant.name}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-4">
                    <Link href={route("recipes.index")}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-teal-600 text-sm font-medium transition">
                        <IconArrowLeft size={16} /> Kembali
                    </Link>
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{variant.name}</h1>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{variant.code}</span>
                            <GenderIcon gender={variant.gender} />
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                            {intensities.length} intensitas · {total_ingredients} bahan · {generatedCount}/{intensities.length} generated
                        </p>
                    </div>
                </div>
                <Link href={route("recipes.create")}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition shadow-sm flex-shrink-0">
                    <IconPlus size={15} /> Tambah Formula
                </Link>
            </div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <IconAdjustments size={11} /> Semua Intensitas & Resep
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {intensities.map((intensity) => (
                    <IntensityDetailRow
                        key={`${intensity.variant_id}-${intensity.intensity_id}`}
                        intensity={intensity}
                        variantId={variant.id}
                        onDelete={confirmDelete}
                    />
                ))}
            </div>

            {/* Delete Modal */}
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

VariantDetail.layout = (page) => <DashboardLayout children={page} />;
