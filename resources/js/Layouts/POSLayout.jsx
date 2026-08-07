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
    IconTransfer,
    IconBox,
    IconPrinter,
} from "@tabler/icons-react";

import OpenShiftModal from "@/Components/Dashboard/OpenShiftModal";
import CloseShiftModal from "@/Components/Dashboard/CloseShiftModal";
import POSSidebar from "@/Components/POS/POSSidebar";
import CashTransactionModal from "@/Components/POS/CashTransactionModal";
import PrinterConnectModal from "@/Components/POS/PrinterConnectModal";
import { useBluetoothContext } from "@/Context/BluetoothContext";

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
    const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
    const bt = useBluetoothContext();
    const printerConnected = bt?.status === "connected";
    const printerBusy = bt?.status === "connecting" || bt?.status === "reconnecting";
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
                className="flex-shrink-0 flex items-center justify-between px-5 py-[10px] bg-white dark:bg-slate-900 border-b border-[#e8e8e8] dark:border-slate-800 relative w-full h-[56px] transition-colors"
            >
                {/* Left: Toolbar Container */}
                <div className="flex items-center gap-[24px]">
                    {/* Sidebar / Mobile Menu Toggle */}
                    <button
                        onClick={() => toggleSidebar()}
                        className="p-1 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                        title="Toggle Sidebar"
                    >
                        <IconMenu2 size={20} className="text-slate-800 dark:text-slate-200" />
                    </button>

                    {/* Brand & Clock */}
                    <div className="flex items-center gap-[16px]">
                        {/* Logo & Wordmark */}
                        <div className="flex gap-[8px] items-center">
                            <div className="bg-white dark:bg-slate-900 border-2 border-[rgba(86,184,195,0.3)] flex flex-col items-center justify-center p-[2px] rounded-[11px] shadow-[0px_4px_14px_0px_rgba(86,184,195,0.2)] shrink-0 size-[32px]">
                                <img src="/Logo.png" alt="Harumnya Logo" className="size-[24px] object-cover" />
                            </div>
                            <div className="flex flex-col items-start leading-[1.4]">
                                <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-tight">
                                    Harumnya POS
                                </p>
                                <p className="font-normal text-[12px] text-slate-500 dark:text-slate-400 leading-tight">
                                    {props.storeName || auth?.user?.store?.name || "Toko Krian"}
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block bg-[#e8e8e8] dark:bg-slate-800 h-[28px] w-px shrink-0" />

                        {/* Clock */}
                        <div className="hidden sm:flex flex-col items-start leading-[1.4]">
                            <p className="font-semibold text-[#0f172a] dark:text-white text-[14px] leading-tight tabular-nums">
                                {formatTime(currentTime)}
                            </p>
                            <p className="font-normal text-[12px] text-slate-500 dark:text-slate-400 leading-tight">
                                {formatDate(currentTime)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Actions & Cashier */}
                <div className="flex gap-[12px] items-center">
                    {/* Toolbar Buttons */}
                    <div className="flex gap-[4px] items-center">
                        {/* Shift Status Pill */}
                        {activeCashDrawer ? (
                            <button
                                onClick={() => setIsCloseShiftModalOpen(true)}
                                className="bg-[#e6f5ed] border border-[rgba(15,137,77,0.18)] flex gap-[6px] h-[34px] items-center px-[10px] rounded-[8px] hover:bg-[#d8f0e3] transition-colors"
                            >
                                <span className="size-[6px] bg-[#0f894d] rounded-full shrink-0" />
                                <span className="font-medium leading-[16px] text-[#0f894d] text-[12px] whitespace-nowrap">
                                    Shift Aktif
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsOpenShiftModalOpen(true)}
                                className="bg-rose-50 border border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 flex gap-[6px] h-[34px] items-center px-[10px] rounded-[8px] hover:bg-rose-100 transition-colors animate-pulse"
                            >
                                <span className="size-[6px] bg-rose-500 rounded-full shrink-0" />
                                <span className="font-medium leading-[16px] text-rose-600 dark:text-rose-400 text-[12px] whitespace-nowrap">
                                    Buka Shift
                                </span>
                            </button>
                        )}

                        {/* Kas Masuk/Keluar Button */}
                        {activeCashDrawer && (
                            <button
                                onClick={() => setIsCashModalOpen(true)}
                                className="bg-white dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex h-[34px] items-center justify-center px-[12px] rounded-[8px] text-[#64748b] dark:text-slate-300 text-[12px] font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Kas Masuk/Keluar
                            </button>
                        )}

                        {/* Printer Button */}
                        <button
                            onClick={() => setIsPrinterModalOpen(true)}
                            className="bg-white dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex h-[34px] items-center justify-center px-[12px] gap-1.5 rounded-[8px] text-[#64748b] dark:text-slate-300 text-[12px] font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Printer
                            <span className={`w-1.5 h-1.5 rounded-full ${printerConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        </button>
                    </div>

                    {/* Header Actions Slot */}
                    {headerActions && (
                        <div className="flex items-center gap-2">
                            {headerActions}
                        </div>
                    )}

                    {/* Fullscreen Toggle Icon Button */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-[8px] rounded-[12px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center text-slate-500 dark:text-slate-400"
                        title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
                    </button>

                    {/* Divider */}
                    <div className="bg-[#e8e8e8] dark:bg-slate-800 h-[28px] w-px shrink-0" />

                    {/* Cashier Profile */}
                    <div className="flex gap-[8px] items-center">
                        <div className="bg-[#f7f9fc] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex items-center justify-center rounded-full size-[32px] shrink-0 text-[#64748b] dark:text-slate-300 font-semibold text-[12px]">
                            {auth?.user?.name
                                ? auth.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                : 'KJ'}
                        </div>
                        <div className="hidden sm:flex flex-col items-start leading-[16px] text-[12px]">
                            <p className="font-semibold text-[#0f172a] dark:text-white">
                                {auth?.user?.name || "Kasir"}
                            </p>
                            <p className="font-normal text-[#94a3b8]">
                                Kasir
                            </p>
                        </div>
                    </div>
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
                                href={route("pos.stock")}
                                onClick={() => setShowMobileMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${component === "Dashboard/POS/Stock" ? "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                            >
                                <IconBox size={18} />
                                <span className="font-medium text-sm">Stok Toko</span>
                            </Link>
                            <Link
                                href={route("pos.fulfillment.index")}
                                onClick={() => setShowMobileMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${component.startsWith("Dashboard/POS/Fulfillment") ? "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                            >
                                <IconTransfer size={18} />
                                <span className="font-medium text-sm">Fulfillment</span>
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
                                <span className="font-medium text-sm text-left">Kas Masuk / Kas Keluar</span>
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

            <PrinterConnectModal
                isOpen={isPrinterModalOpen}
                onClose={() => setIsPrinterModalOpen(false)}
            />
        </div>
    );
}
