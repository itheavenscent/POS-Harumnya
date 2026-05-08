import React from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    IconBuildingStore,
    IconHistory,
    IconCash,
    IconCashBanknote,
    IconReceipt,
    IconArrowsExchange,
    IconLogout,
    IconCircleCheck,
    IconAlertCircle,
    IconChevronLeft,
    IconChevronRight,
    IconBox,
} from "@tabler/icons-react";

export default function POSSidebar({ onCashAction, onOpenShift, onCloseShift, activeCashDrawer, isOpen, onToggle }) {
    const { component, props } = usePage();
    const { auth } = props;

    const menuItems = [
        {
            title: "Kasir / POS",
            icon: <IconBuildingStore size={20} />,
            href: route("transactions.index"),
            active: component === "Dashboard/Transactions/Index",
        },
        {
            title: "Stok Toko",
            icon: <IconBox size={20} />,
            href: route("pos.stock"),
            active: component === "Dashboard/POS/Stock",
        },
        {
            title: "Riwayat Transaksi",
            icon: <IconReceipt size={20} />,
            href: route("pos.transactions"),
            active: component === "Dashboard/POS/Transactions",
        },
        {
            title: "Shift Saat Ini",
            icon: <IconCash size={20} />,
            href: route("cash-drawers.current"),
            active: component === "Dashboard/Shifts/Current",
        },
        {
            title: "Histori Shift",
            icon: <IconHistory size={20} />,
            href: route("cash-drawers.index"),
            active: component === "Dashboard/Shifts/Index",
        },
    ];

    return (
        <aside
            className={`relative flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex transition-all duration-300 ease-in-out ${isOpen ? "w-60" : "w-14"}`}
        >
            {/* Toggle button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title={isOpen ? "Tutup sidebar" : "Buka sidebar"}
            >
                {isOpen
                    ? <IconChevronLeft size={12} className="text-slate-500" />
                    : <IconChevronRight size={12} className="text-slate-500" />
                }
            </button>

            {/* Shift Status */}
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "px-3 pt-3 pb-1" : "px-1.5 pt-3 pb-1"}`}>
                {isOpen ? (
                    activeCashDrawer ? (
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <IconCircleCheck size={14} className="text-emerald-500 flex-shrink-0" />
                                <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">Shift Aktif</span>
                            </div>
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mb-2">
                                Modal: Rp {Number(activeCashDrawer.starting_cash ?? 0).toLocaleString("id-ID")}
                            </p>
                            <button
                                onClick={onCloseShift}
                                className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition-all"
                            >
                                Tutup Shift
                            </button>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <IconAlertCircle size={14} className="text-rose-500 flex-shrink-0" />
                                <span className="text-[11px] font-black text-rose-700 dark:text-rose-400">Shift Belum Buka</span>
                            </div>
                            <p className="text-[10px] text-rose-500 mb-2">Buka shift untuk transaksi</p>
                            <button
                                onClick={onOpenShift}
                                className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black transition-all"
                            >
                                Buka Shift
                            </button>
                        </div>
                    )
                ) : (
                    /* Collapsed: icon-only shift indicator */
                    <button
                        onClick={activeCashDrawer ? onCloseShift : onOpenShift}
                        className={`w-full flex items-center justify-center p-2 rounded-xl border transition-all ${
                            activeCashDrawer
                                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                                : "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 animate-pulse"
                        }`}
                        title={activeCashDrawer ? "Shift Aktif — Klik untuk tutup" : "Buka Shift"}
                    >
                        {activeCashDrawer
                            ? <IconCircleCheck size={18} className="text-emerald-500" />
                            : <IconAlertCircle size={18} className="text-rose-500" />
                        }
                    </button>
                )}
            </div>

            {/* Navigation */}
            <div className={`flex-1 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden ${isOpen ? "px-3" : "px-1.5"}`}>
                {isOpen && (
                    <p className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Menu</p>
                )}
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        title={!isOpen ? item.title : undefined}
                        className={`flex items-center gap-3 rounded-xl text-sm font-medium transition-all ${
                            isOpen ? "px-3 py-2.5" : "p-2.5 justify-center"
                        } ${
                            item.active
                                ? "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 shadow-sm font-bold"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                        }`}
                    >
                        <span className={`flex-shrink-0 ${item.active ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"}`}>
                            {item.icon}
                        </span>
                        {isOpen && item.title}
                    </Link>
                ))}

                <div className={`pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 ${isOpen ? "" : ""}`}>
                    {isOpen && (
                        <p className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Aksi</p>
                    )}
                    <button
                        onClick={onCashAction}
                        title={!isOpen ? "Cash In / Cash Out" : undefined}
                        className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 transition-all ${
                            isOpen ? "px-3 py-2.5" : "p-2.5 justify-center"
                        }`}
                    >
                        <span className="text-emerald-500 flex-shrink-0">
                            <IconArrowsExchange size={20} />
                        </span>
                        {isOpen && "Cash In / Cash Out"}
                    </button>
                </div>
            </div>

            {/* User Footer */}
            <div className={`border-t border-slate-100 dark:border-slate-800 ${isOpen ? "p-3" : "p-1.5"}`}>
                {isOpen ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <img
                            src={auth?.user?.avatar || `https://ui-avatars.com/api/?name=${auth?.user?.name}&background=0891b2&color=fff`}
                            alt={auth?.user?.name}
                            className="w-7 h-7 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{auth?.user?.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Kasir</p>
                        </div>
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors flex-shrink-0"
                            title="Keluar"
                        >
                            <IconLogout size={14} />
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <img
                            src={auth?.user?.avatar || `https://ui-avatars.com/api/?name=${auth?.user?.name}&background=0891b2&color=fff`}
                            alt={auth?.user?.name}
                            className="w-8 h-8 rounded-full"
                            title={auth?.user?.name}
                        />
                        <Link
                            href={route("logout")}
                            method="post"
                            as="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                            title="Keluar"
                        >
                            <IconLogout size={14} />
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
}
