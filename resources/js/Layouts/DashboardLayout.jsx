import React, { useEffect, useState } from "react";
import Sidebar from "@/Components/Dashboard/Sidebar";
import Navbar from "@/Components/Dashboard/Navbar";
import { Toaster } from "react-hot-toast";
import { useTheme } from "@/Context/ThemeSwitcherContext";

export default function AppLayout({ children }) {
    const { darkMode, themeSwitcher } = useTheme();

    const [sidebarOpen, setSidebarOpen] = useState(
        localStorage.getItem("sidebarOpen") === "true"
    );

    useEffect(() => {
        localStorage.setItem("sidebarOpen", sidebarOpen);
    }, [sidebarOpen]);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        /*
         * KUNCI FIX: h-screen + overflow-hidden di wrapper utama
         * Ini "mengunci" tinggi halaman ke viewport — sidebar tidak bisa
         * ikut scroll karena tidak ada scroll di level ini.
         */
        <div
            className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-200"
        >
            {/* Sidebar Desktop — cukup h-full, tidak perlu sticky lagi */}
            <div
                className="hidden md:block flex-shrink-0 h-full"
                style={{
                    width: sidebarOpen ? "260px" : "80px",
                    transition: "width 0.3s ease",
                }}
            >
                <Sidebar sidebarOpen={sidebarOpen} onClose={() => {}} />
            </div>

            {/* Mobile sidebar drawer */}
            <div className="md:hidden">
                <Sidebar sidebarOpen={false} onClose={() => {}} />
            </div>

            {/* Konten utama */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/* Navbar — tidak perlu sticky karena sudah di atas dan tidak scroll */}
                <div className="flex-shrink-0 z-20">
                    <Navbar
                        toggleSidebar={toggleSidebar}
                        themeSwitcher={themeSwitcher}
                        darkMode={darkMode}
                    />
                </div>

                {/*
                 * Area konten yang SCROLL — overflow-y-auto di sini
                 * Hanya konten yang bergerak, sidebar dan navbar tetap diam.
                 * Tambahkan scroll-region="" jika butuh Inertia scroll tracking.
                 */}
                <main className="flex-1 overflow-y-auto" scroll-region="">
                    <div className="w-full py-6 px-4 md:px-6 lg:px-8 pb-20 md:pb-6">
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                className: "text-sm",
                                duration: 3000,
                                style: {
                                    background: darkMode ? "#1e293b" : "#fff",
                                    color: darkMode ? "#f1f5f9" : "#1e293b",
                                    border: `1px solid ${darkMode ? "#334155" : "#e2e8f0"}`,
                                    borderRadius: "12px",
                                },
                            }}
                        />
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
