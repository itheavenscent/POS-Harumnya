import React from "react";

/**
 * ButtonBayar - 1:1 Figma POS Total & Payment Action Button Component
 * Node ID: 3298:33440
 */
export default function ButtonBayar({
    onClick,
    disabled = false,
    payable = 0,
    fmt,
    label = "Bayar",
    loading = false,
    className = "",
    type = "button",
    variant = "teal",
    icon = null,
}) {
    const bgClass = variant === "gray"
        ? "bg-gradient-to-b from-[#8b8b8b] to-[#737373] hover:from-[#7c7c7c] hover:to-[#646464]"
        : "bg-gradient-to-b from-[#54b8c3] to-[#39a1ac] hover:from-[#46a9b4] hover:to-[#2c909b]";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`border-[0.793px] border-white/12 content-stretch flex gap-[6.343px] items-center justify-center overflow-clip py-[9.514px] px-[12px] relative rounded-[8px] w-full ${bgClass} active:scale-[0.99] transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group ${className}`}
            data-node-id="3298:33440"
            data-name="Button / Bayar"
        >
            {loading ? (
                <div className="flex items-center gap-2 z-10">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="font-semibold text-[14px] text-white">Memproses...</span>
                </div>
            ) : (
                <>
                    {icon && <span className="z-10 flex items-center justify-center text-white">{icon}</span>}
                    <span className="[word-break:break-word] font-semibold leading-[1.4] relative text-[14px] text-white whitespace-nowrap z-10">
                        {label}
                    </span>
                    {payable > 0 && (
                        <>
                            <div className="bg-white/50 h-[12.686px] relative shrink-0 w-[0.793px] z-10" />
                            <span className="[word-break:break-word] font-semibold leading-[1.4] relative text-[14px] text-white whitespace-nowrap z-10">
                                {fmt ? fmt(payable) : `Rp ${Number(payable || 0).toLocaleString("id-ID")}`}
                            </span>
                        </>
                    )}
                </>
            )}
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_1px_rgba(16,24,40,0.24),inset_0px_6.404px_6.404px_0px_rgba(255,255,255,0.1),inset_0px_-6.404px_6.404px_0px_rgba(0,0,0,0.1)]" />
        </button>
    );
}
