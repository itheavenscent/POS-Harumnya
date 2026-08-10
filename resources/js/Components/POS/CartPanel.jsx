import React from "react";
import {
    IconTrash,
    IconMinus,
    IconPlus,
    IconShoppingCart,
    IconAward,
} from "@tabler/icons-react";
import { getProductImageUrl } from "@/Utils/imageUrl";

const formatPrice = (value = 0) =>
    value.toLocaleString("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    });

// Single Cart Item
function CartItem({ item, onUpdateQty, onRemove, isRemoving }) {
    // Note: item.price from backend is already the total (sell_price * qty)
    const unitPrice = item.product?.sell_price || item.price / item.qty || 0;
    const subtotal = item.price; // Already calculated total from backend

    return (
        <div
            className={`
            group flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50
            border border-transparent hover:border-slate-200 dark:hover:border-slate-700
            transition-all duration-200 animate-slide-up
            ${isRemoving ? "opacity-50 scale-95" : ""}
        `}
        >
            {/* Product Image */}
            <div className="w-14 h-14 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                {item.product?.image ? (
                    <img
                        src={getProductImageUrl(item.product.image)}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <IconShoppingCart
                            size={20}
                            className="text-slate-400"
                        />
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {item.product?.title || "Produk"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatPrice(unitPrice)} × {item.qty}
                </p>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                    {formatPrice(subtotal)}
                </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex flex-col items-end justify-between">
                {/* Remove Button */}
                <button
                    onClick={() => onRemove(item.id)}
                    disabled={isRemoving}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                    <IconTrash size={16} />
                </button>

                {/* Qty Stepper */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() =>
                            onUpdateQty(item.id, Math.max(1, item.qty - 1))
                        }
                        disabled={item.qty <= 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <IconMinus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        {item.qty}
                    </span>
                    <button
                        onClick={() => onUpdateQty(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                    >
                        <IconPlus size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Empty Cart State
function EmptyCart() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <IconShoppingCart
                    size={32}
                    className="text-slate-400 dark:text-slate-600"
                />
            </div>
            <h3 className="text-base font-medium text-slate-600 dark:text-slate-400">
                Keranjang Kosong
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Klik produk untuk menambahkan
            </p>
        </div>
    );
}

// Main CartPanel Component
export default function CartPanel({
    items = [],
    onUpdateQty,
    onRemove,
    removingItemId,
    selectedCustomer = null,
    className = "",
}) {
    const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
    // Note: item.price from backend is already sell_price * qty
    const subtotal = items.reduce((sum, item) => sum + (item.price || 0), 0);

    // Program Loyalitas Poin: Setiap transaksi Rp 10.000 = 1 Poin
    const estimatedPoints = Math.floor(subtotal / 10000);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <IconShoppingCart
                        size={20}
                        className="text-slate-600 dark:text-slate-400"
                    />
                    <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                        Keranjang
                    </h2>
                </div>
                {totalItems > 0 && (
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 rounded-full">
                        {totalItems} item
                    </span>
                )}
            </div>

            {/* Cart Items */}
            {items.length > 0 ? (
                <div
                    className="flex-1 overflow-y-auto p-3 space-y-3"
                    style={{ maxHeight: "360px", minHeight: "150px" }}
                >
                    {items.map((item) => (
                        <CartItem
                            key={item.id}
                            item={item}
                            onUpdateQty={onUpdateQty}
                            onRemove={onRemove}
                            isRemoving={removingItemId === item.id}
                        />
                    ))}

                    {/* ── 1. SpinWheel Promo Banner ── */}
                    <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/5 border border-purple-200 dark:border-purple-800/60 rounded-xl p-3 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base">🎰</span>
                                <span className="font-bold text-xs text-purple-900 dark:text-purple-200">
                                    Gratis 1x SpinWheel
                                </span>
                            </div>
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-purple-200 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 rounded-full uppercase">
                                PROMO
                            </span>
                        </div>
                        <p className="text-[11px] text-purple-800 dark:text-purple-300 leading-snug">
                            Setiap pembelian parfum sesuai ketentuan gratis 1 kali SpinWheel dengan hadiah:
                        </p>
                        <div className="grid grid-cols-1 gap-1 text-[10px] text-purple-700 dark:text-purple-300 font-medium pl-1">
                            <div className="flex items-center gap-1">
                                <span className="text-purple-500">✦</span> P30 EDT (pilih varian) + Botol P30
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-purple-500">✦</span> P10 EDT (pilih varian) + Botol P10 Spray
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-purple-500">✦</span> Poin Member +1
                            </div>
                        </div>
                    </div>

                    {/* ── 2. Promo Opening Buy 1 P50 + Botol Banner ── */}
                    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 dark:border-amber-800/60 rounded-xl p-3 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-base">🎉</span>
                                <span className="font-bold text-xs text-amber-900 dark:text-amber-200">
                                    Promo Opening: Buy 1 P50 + Botol
                                </span>
                            </div>
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 rounded-full uppercase">
                                BUY 1 GET 1
                            </span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                            Buy 1 P50 + botol (All Kategori) → <strong>Free 1 P10 EDT (1:2) + Botol P10 Spray</strong>
                        </p>
                    </div>

                    {/* ── 3. Program Loyalitas Poin Banner ── */}
                    <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-300 dark:border-emerald-800/60 rounded-xl p-3 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <IconAward size={16} className="text-emerald-600 dark:text-emerald-400" />
                                <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                                    Program Loyalitas Poin
                                </span>
                            </div>
                            <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-200 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 rounded-full uppercase">
                                LOYALTY
                            </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                            <p>
                                💰 Setiap transaksi <strong>Rp 10.000 = 1 Poin</strong>
                            </p>
                            <p>
                                🏆 Kumpulkan <strong>30 Poin</strong>, tukarkan dengan <strong>1 Parfum P30 EDT + Botol P30 Gratis</strong> (Pilih Varian).
                            </p>
                        </div>
                        <div className="mt-1 pt-1.5 border-t border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-[11px]">
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                                Estimasi Poin Transaksi Ini:
                            </span>
                            <span className="font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                                +{estimatedPoints} Poin
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <EmptyCart />
            )}

            {/* Subtotal */}
            {items.length > 0 && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Subtotal
                        </span>
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {formatPrice(subtotal)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export sub-components
CartPanel.Item = CartItem;
CartPanel.Empty = EmptyCart;
