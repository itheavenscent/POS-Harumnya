import { IconAlertTriangle, IconTrash, IconInfoCircle } from "@tabler/icons-react";

const VARIANTS = {
    danger: {
        icon: IconTrash,
        iconWrap: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
        confirmBtn: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500",
    },
    warning: {
        icon: IconAlertTriangle,
        iconWrap: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        confirmBtn: "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400",
    },
    info: {
        icon: IconInfoCircle,
        iconWrap: "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
        confirmBtn: "bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500",
    },
};

/**
 * Dialog konfirmasi yang menggantikan window.confirm() bawaan browser.
 * Contoh: <ConfirmDialog open={...} title="Hapus pelanggan?" description={`"${name}" akan dihapus permanen.`} onConfirm={...} onClose={...} />
 */
export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = "Konfirmasi",
    description,
    confirmLabel = "Ya, Lanjutkan",
    cancelLabel = "Batal",
    variant = "danger",
    loading = false,
}) {
    if (!open) return null;

    const cfg = VARIANTS[variant] ?? VARIANTS.danger;
    const Icon = cfg.icon;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
            onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onClose?.(); }}
        >
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${cfg.iconWrap}`}>
                    <Icon size={24} strokeWidth={1.75} />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                {description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {description}
                    </p>
                )}

                <div className="flex gap-3 justify-end mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${cfg.confirmBtn}`}
                    >
                        {loading ? "Memproses..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
