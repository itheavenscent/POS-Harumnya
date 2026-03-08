import React, { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import { useTheme } from "@/Context/ThemeSwitcherContext";
import {
    IconHome,
    IconHistory,
    IconLogout,
    IconMenu2,
    IconX,
    IconUser,
    IconMaximize,
    IconMinimize,
} from "@tabler/icons-react";

export default function POSLayout({ children }) {
    const { auth } = usePage().props;
    const { darkMode } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

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
                {/* Left: Logo & Time */}
                <div className="flex items-center gap-4 lg:gap-6">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        {showMobileMenu
                            ? <IconX size={20} className="text-slate-600 dark:text-slate-400" />
                            : <IconMenu2 size={20} className="text-slate-600 dark:text-slate-400" />
                        }
                    </button>

                    {/* Logo */}
                    <Link href={route("dashboard")} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">K</span>
                        </div>
                        <span className="hidden sm:block text-base font-bold text-slate-800 dark:text-white">
                            KASIR
                        </span>
                    </Link>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-7 bg-slate-200 dark:bg-slate-700" />

                    {/* Time & Date */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="text-xl font-semibold text-slate-800 dark:text-white tabular-nums">
                            {formatTime(currentTime)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(currentTime)}
                        </div>
                    </div>
                </div>

                {/* Right: Actions & User */}
                <div className="flex items-center gap-2 lg:gap-3">
                    {/* Quick Nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        <Link
                            href={route("dashboard")}
                            preserveScroll
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                        >
                            <IconHome size={16} />
                            <span>Dashboard</span>
                        </Link>
                        <Link
                            href={route("transactions.history")}
                            preserveScroll
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                        >
                            <IconHistory size={16} />
                            <span>Riwayat</span>
                        </Link>
                    </nav>

                    <div className="hidden lg:block w-px h-7 bg-slate-200 dark:bg-slate-700" />

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
                                {auth.user.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Kasir</p>
                        </div>
                        <img
                            src={auth.user.avatar || `https://ui-avatars.com/api/?name=${auth.user.name}&background=6366f1&color=fff`}
                            alt={auth.user.name}
                            className="w-8 h-8 rounded-full ring-2 ring-slate-200 dark:ring-slate-700 flex-shrink-0"
                        />
                    </div>

                    {/* Logout */}
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors items-center justify-center"
                        title="Logout"
                    >
                        <IconLogout size={18} />
                    </Link>
                </div>
            </header>

            {/* ── Mobile Menu Overlay ── */}
            {showMobileMenu && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50"
                    style={{ top: 56 }}
                    onClick={() => setShowMobileMenu(false)}
                >
                    <div
                        className="absolute top-0 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <nav className="p-3 space-y-1">
                            <Link
                                href={route("dashboard")}
                                preserveScroll
                                onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                <IconHome size={18} />
                                <span className="font-medium text-sm">Dashboard</span>
                            </Link>
                            <Link
                                href={route("transactions.history")}
                                preserveScroll
                                onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                <IconHistory size={18} />
                                <span className="font-medium text-sm">Riwayat Transaksi</span>
                            </Link>
                            <Link
                                href={route("profile.edit")}
                                preserveScroll
                                onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                <IconUser size={18} />
                                <span className="font-medium text-sm">Profil</span>
                            </Link>
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

            {/* ── Main Content ── */}
            <main className="flex-1 min-h-0 overflow-hidden relative">
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
                {children}
            </main>
        </div>
    );
}
