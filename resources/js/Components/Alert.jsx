import React from "react";
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import toast from "react-hot-toast";

/**
 * Alert - 1:1 Figma Redesigned Pop Up Alert / Toast Component
 * Figma Node ID: 3291:31208
 */
export default function Alert({
    title = "Berhasil menambahkan produk",
    message = "Anda dapat melihat aset yang ditambahkan di halaman daftar aset",
    type = "success",
    onClose,
    className = "",
    visible = true,
}) {
    const renderIcon = () => {
        switch (type) {
            case "error":
                return (
                    <div className="size-[18px] rounded-full bg-[#ef4444] flex items-center justify-center shrink-0 mt-0.5">
                        <IconX size={12} strokeWidth={3} className="text-white" />
                    </div>
                );
            case "warning":
                return (
                    <div className="size-[18px] rounded-full bg-[#f59e0b] flex items-center justify-center shrink-0 mt-0.5">
                        <IconAlertTriangle size={12} strokeWidth={3} className="text-white" />
                    </div>
                );
            case "info":
                return (
                    <div className="size-[18px] rounded-full bg-[#3b82f6] flex items-center justify-center shrink-0 mt-0.5">
                        <IconInfoCircle size={12} strokeWidth={3} className="text-white" />
                    </div>
                );
            case "success":
            default:
                return (
                    <div className="size-[18px] rounded-full bg-[#00a656] flex items-center justify-center shrink-0 mt-0.5">
                        <IconCheck size={12} strokeWidth={3} className="text-white" />
                    </div>
                );
        }
    };

    return (
        <div
            data-node-id="3291:31208"
            data-name="Alert"
            className={`bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 p-[12px] rounded-[6px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] flex gap-[10px] items-start max-w-md w-full transition-all duration-200 ${
                visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
            } ${className}`}
        >
            {renderIcon()}
            <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                {title && (
                    <p className="font-semibold text-[14px] text-black dark:text-white leading-[1.2]">
                        {title}
                    </p>
                )}
                {message && (
                    <p className="font-normal text-[12px] text-[#666666] dark:text-slate-400 leading-[1.4]">
                        {message}
                    </p>
                )}
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="size-[18px] text-[#999999] hover:text-black dark:hover:text-white shrink-0 flex items-center justify-center transition-colors cursor-pointer mt-0.5"
                    aria-label="Tutup alert"
                >
                    <IconX size={16} />
                </button>
            )}
        </div>
    );
}

/**
 * Helper function to trigger custom toast alert anywhere
 */
export const showAlert = (title, message = "", type = "success", duration = 3000) => {
    return toast.custom(
        (t) => (
            <Alert
                title={title}
                message={message}
                type={type}
                visible={t.visible}
                onClose={() => toast.dismiss(t.id)}
            />
        ),
        { duration }
    );
};
