import React, { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import { useTheme } from "@/Context/ThemeSwitcherContext";
import {
    IconHistory,
    IconLogout,
    IconMenu2,
    IconX,
    IconUser,
    IconMinimize,
    IconCash,
    IconCashBanknote,
    IconMaximize,
    IconArrowsExchange,
    IconBuildingStore,
    IconReceipt,
} from "@tabler/icons-react";
import OpenShiftModal from "@/Components/Dashboard/OpenShiftModal";
import CloseShiftModal from "@/Components/Dashboard/CloseShiftModal";
import POSSidebar from "@/Components/POS/POSSidebar";
import CashTransactionModal from "@/Components/POS/CashTransactionModal";

export default function POSLayout({ children, headerActions }) {
    const { component, props } = usePage();
    const { auth, activeCashDrawer } = props;
    const { darkMode } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [isCashModalOpen, setIsCashModalOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        try { return localStorage.getItem("pos_sidebar_open") !== "false"; } catch { return true; }
    });

    const toggleSidebar = () => setSidebarOpen(prev => {
        const next = !prev;
        try { localStorage.setItem("pos_sidebar_open", String(next)); } catch {}
        return next;
    });

    // Auto-show open shift modal when no active shift on the transaction page
    useEffect(() => {
        if (activeCashDrawer === null && component === "Dashboard/Transactions/Index") {
            setIsOpenShiftModalOpen(true);
        }
    }, [activeCashDrawer, component]);

    useEffect(() => {
        const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleChange);
        return () => document.removeEventListener("fullscreenchange", handleChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) =>
        date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    const formatDate = (date) =>
        date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    return (
        <div
            className="flex flex-col bg-slate-50 dark:bg-slate-950"
            style={{ height: "100dvh", overflow: "hidden" }}
        >
            {/* ── Top Navigation Bar ── */}
            <header
                className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm"
                style={{ height: 56 }}
            >
                {/* Left: Brand & Time */}
                <div className="flex items-center gap-4 lg:gap-6">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        {showMobileMenu
                            ? <IconX size={20} className="text-slate-600 dark:text-slate-400" />
                            : <IconMenu2 size={20} className="text-slate-600 dark:text-slate-400" />
                        }
                    </button>

                    {/* Brand — no dashboard link, stays in POS */}
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">H</span>
                        </div>
                        <span className="hidden sm:block text-base font-bold text-slate-800 dark:text-white">
                            Harumnya POS
                        </span>
                        {props.storeName && (
                            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 rounded-full ml-1">
                                <IconBuildingStore size={12} className="text-cyan-600 dark:text-cyan-400"/>
                                <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">{props.storeName}</span>
                            </div>
                        )}
                    </div>

                    {/* Date/Time */}
                    <div className="hidden sm:flex flex-col items-start">
                        <div className="text-sm font-bold text-slate-800 dark:text-white tabular-nums leading-none">
                            {formatTime(currentTime)}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {formatDate(currentTime)}
                        </div>
                    </div>
                </div>

                {/* Right: Shift + Actions + User */}
                <div className="flex items-center gap-2 lg:gap-3">
                    {/* ── Shift Button ── always rendered, toggles open/close */}
                    <div className="flex items-center gap-2">
                        {activeCashDrawer ? (
                            <>
                                <button
                                    onClick={() => setIsCloseShiftModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all border border-emerald-200 dark:border-emerald-800"
                                >
                                    <IconCashBanknote size={15} />
                                    <span className="hidden sm:inline">Shift Aktif</span>
                                </button>
                                <button
                                    onClick={() => setIsCashModalOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                                    title="Cash In / Cash Out"
                                >
                                    <IconArrowsExchange size={15} />
                                    <span className="hidden lg:inline">Cash In/Out</span>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsOpenShiftModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all border border-rose-200 dark:border-rose-800 animate-pulse"
                            >
                                <IconCash size={15} />
                                <span>Buka Shift</span>
                            </button>
                        )}
                    </div>

                    <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />

                    {/* Header Actions (slot) */}
                    {headerActions && (
                        <div className="flex items-center gap-2">
                            {headerActions}
                            <div className="hidden lg:block w-px h-7 bg-slate-200 dark:bg-slate-700" />
                        </div>
                    )}

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                        title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen
                            ? <IconMinimize size={18} className="text-slate-500 dark:text-slate-400" />
                            : <IconMaximize size={18} className="text-slate-500 dark:text-slate-400" />
                        }
                    </button>

                    {/* User Info */}
                    <div className="flex items-center gap-2 pl-2 lg:pl-3 border-l border-slate-200 dark:border-slate-700">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-tight">
                                {auth?.user?.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Kasir</p>
                        </div>
                        <img
                            src={auth?.user?.avatar || `https://ui-avatars.com/api/?name=${auth?.user?.name}&background=6366f1&color=fff`}
                            alt={auth?.user?.name}
                            className="w-8 h-8 rounded-full ring-2 ring-slate-200 dark:ring-slate-700 flex-shrink-0"
                        />
                    </div>

                    {/* Logout */}
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors items-center justify-center"
                        title="Keluar"
                    >
                        <IconLogout size={18} />
                    </Link>
                </div>
            </header>

            {/* ── Mobile Menu Overlay ── */}
            {showMobileMenu && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/50"
                    style={{ top: 56 }}
                    onClick={() => setShowMobileMenu(false)}
                >
                    <div
                        className="absolute top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <nav className="p-3 space-y-1">
                            <Link
                                href={route("transactions.index")}
                                onClick={() => setShowMobileMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${component === "Dashboard/Transactions/Index" ? "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                            >
                                <IconBuildingStore size={18} />
                                <span className="font-medium text-sm">Kasir / POS</span>
                            </Link>
                            <Link
                                href={route("cash-drawers.current")}
                                onClick={() => setShowMobileMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${component === "Dashboard/Shifts/Current" ? "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                            >
                                <IconCash size={18} />
                                <span className="font-medium text-sm">Shift Saat Ini</span>
                            </Link>
                            <Link
                                href={route("cash-drawers.index")}
                                onClick={() => setShowMobileMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${component === "Dashboard/Shifts/Index" ? "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                            >
                                <IconHistory size={18} />
                                <span className="font-medium text-sm">Riwayat Shift</span>
                            </Link>
                            <Link
                                href={route("transactions.history")}
                                onClick={() => setShowMobileMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${component === "Dashboard/Transactions/History" ? "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                            >
                                <IconReceipt size={18} />
                                <span className="font-medium text-sm">Riwayat Transaksi</span>
                            </Link>
                            <button
                                onClick={() => { setShowMobileMenu(false); setIsCashModalOpen(true); }}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors w-full"
                            >
                                <IconArrowsExchange size={18} />
                                <span className="font-medium text-sm text-left">Cash In / Cash Out</span>
                            </button>
                            <hr className="border-slate-200 dark:border-slate-700" />
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors w-full"
                            >
                                <IconLogout size={18} />
                                <span className="font-medium text-sm">Keluar</span>
                            </Link>
                        </nav>
                    </div>
                </div>
            )}

            {/* ── Main Layout Wrapper ── */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* POS Sidebar — cashier nav */}
                <POSSidebar
                    onCashAction={() => setIsCashModalOpen(true)}
                    onOpenShift={() => setIsOpenShiftModalOpen(true)}
                    onCloseShift={() => setIsCloseShiftModalOpen(true)}
                    activeCashDrawer={activeCashDrawer}
                    isOpen={sidebarOpen}
                    onToggle={toggleSidebar}
                />

                {/* Main Content Area */}
                <main className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            className: "text-sm",
                            duration: 3000,
                            style: {
                                background: darkMode ? "#1e293b" : "#fff",
                                color: darkMode ? "#f1f5f9" : "#1e293b",
                                border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                            },
                        }}
                    />
                    <div className="flex-1 overflow-hidden relative">
                        {children}
                    </div>
                </main>
            </div>

            {/* ── Modals ── */}
            {isOpenShiftModalOpen && (
                <OpenShiftModal
                    isOpen={isOpenShiftModalOpen}
                    onClose={() => setIsOpenShiftModalOpen(false)}
                />
            )}

            {isCloseShiftModalOpen && activeCashDrawer && (
                <CloseShiftModal
                    isOpen={isCloseShiftModalOpen}
                    onClose={() => setIsCloseShiftModalOpen(false)}
                    activeCashDrawer={activeCashDrawer}
                />
            )}

            {isCashModalOpen && (
                <CashTransactionModal
                    isOpen={isCashModalOpen}
                    onClose={() => setIsCashModalOpen(false)}
                />
            )}
        </div>
    );
}
