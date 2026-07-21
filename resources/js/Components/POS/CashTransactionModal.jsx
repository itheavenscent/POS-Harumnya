import React, { useState, useRef } from "react";
import { useForm } from "@inertiajs/react";
import { IconX, IconArrowsExchange, IconArrowUpRight, IconArrowDownLeft, IconCheck, IconCamera, IconTrash } from "@tabler/icons-react";
import toast from "react-hot-toast";

export default function CashTransactionModal({ isOpen, onClose }) {
    const { data, setData, post, processing, reset, errors } = useForm({
        type: "cash_in",
        amount: "",
        description: "",
        photo: null,
    });
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const [compressing, setCompressing] = useState(false);

    // Kompres gambar via canvas: resize max 1280px, kualitas JPEG 0.7.
    // Cegah error 413 (Request Entity Too Large) akibat foto kamera HP yang besar.
    const compressImage = (file) =>
        new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const maxDim = 1280;
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim; }
                    else { width = Math.round(width * maxDim / height); height = maxDim; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) return reject(new Error("compress failed"));
                        resolve(new File([blob], "cash-proof.jpg", { type: "image/jpeg" }));
                    },
                    "image/jpeg",
                    0.7
                );
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("load failed")); };
            img.src = url;
        });

    const handlePhotoSelect = async (file) => {
        if (!file) return;
        if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
            toast.error("Hanya foto JPG/PNG/WebP yang diterima");
            return;
        }
        setCompressing(true);
        try {
            const compressed = await compressImage(file);
            setData("photo", compressed);
            setPhotoPreview(URL.createObjectURL(compressed));
        } catch {
            // Fallback ke file asli jika kompresi gagal
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran foto maksimal 5MB");
            } else {
                setData("photo", file);
                setPhotoPreview(URL.createObjectURL(file));
            }
        } finally {
            setCompressing(false);
        }
    };

    const removePhoto = () => {
        setData("photo", null);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("cash-drawers.store-transaction"), {
            forceFormData: true,
            onSuccess: () => {
                toast.success("Transaksi kas berhasil dicatat");
                reset();
                removePhoto();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <IconArrowsExchange size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Kas Masuk / Kas Keluar</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Catat pemasukan/pengeluaran kas shift</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <IconX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setData("type", "cash_in")}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                                data.type === "cash_in"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                    : "border-slate-100 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                            }`}
                        >
                            <IconArrowDownLeft size={18} />
                            <span className="font-bold text-sm">Kas Masuk</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setData("type", "cash_out")}
                            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                                data.type === "cash_out"
                                    ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                                    : "border-slate-100 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                            }`}
                        >
                            <IconArrowUpRight size={18} />
                            <span className="font-bold text-sm">Kas Keluar</span>
                        </button>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Jumlah (Rp)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                            <input
                                type="number"
                                value={data.amount}
                                onChange={(e) => setData("amount", e.target.value)}
                                className={`w-full h-12 pl-12 pr-4 rounded-xl border-2 dark:bg-slate-950 dark:text-white text-lg font-black focus:outline-none transition-all ${
                                    errors.amount
                                        ? "border-red-500 ring-red-500/20"
                                        : "border-slate-100 dark:border-slate-800 focus:border-cyan-500"
                                }`}
                                placeholder="0"
                                required
                            />
                        </div>
                        {errors.amount && <p className="mt-1 text-xs text-red-500 font-medium">{errors.amount}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Keterangan / Alasan
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border-2 dark:bg-slate-950 dark:text-white text-sm font-medium focus:outline-none transition-all resize-none ${
                                errors.description
                                    ? "border-red-500 ring-red-500/20"
                                    : "border-slate-100 dark:border-slate-800 focus:border-cyan-500"
                            }`}
                            placeholder="Contoh: Beli bensin, Tambah modal kembalian..."
                            rows={3}
                            required
                        />
                        {errors.description && <p className="mt-1 text-xs text-red-500 font-medium">{errors.description}</p>}
                    </div>

                    {/* Photo */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Foto Bukti (Opsional)
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handlePhotoSelect(e.target.files[0])}
                        />
                        {photoPreview ? (
                            <div className="relative rounded-xl overflow-hidden border-2 border-slate-100 dark:border-slate-800">
                                <img src={photoPreview} alt="Bukti transaksi" className="w-full h-40 object-cover" />
                                <button
                                    type="button"
                                    onClick={removePhoto}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg"
                                >
                                    <IconTrash size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={compressing}
                                className="w-full h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-all flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-cyan-600 disabled:opacity-50"
                            >
                                {compressing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                                        <span className="text-xs font-bold">Memproses foto...</span>
                                    </>
                                ) : (
                                    <>
                                        <IconCamera size={24} />
                                        <span className="text-xs font-bold">Ambil Foto / Pilih dari Galeri</span>
                                    </>
                                )}
                            </button>
                        )}
                        {errors.photo && <p className="mt-1 text-xs text-red-500 font-medium">{errors.photo}</p>}
                    </div>

                    {/* Footer */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full h-12 rounded-xl bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-700 text-white font-black text-sm transition-all shadow-lg shadow-slate-900/20 dark:shadow-cyan-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {processing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <IconCheck size={18} />
                                    Simpan Transaksi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
