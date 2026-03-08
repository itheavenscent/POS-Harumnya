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
        <div className="flex bg-slate-100 dark:bg-slate-950 transition-colors duration-200"
            style={{ minHeight: "100dvh" }}
        >
            {/* Sidebar Desktop: sticky agar tidak ikut scroll window */}
            <div
                className="hidden md:block flex-shrink-0 sticky top-0 self-start"
                style={{ height: "100dvh", width: sidebarOpen ? "260px" : "80px", transition: "width 0.3s ease" }}
            >
                <Sidebar sidebarOpen={sidebarOpen} onClose={() => {}} />
            </div>

            {/* Mobile sidebar drawer */}
            <div className="md:hidden">
                <Sidebar sidebarOpen={false} onClose={() => {}} />
            </div>

            {/* Konten utama */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Navbar sticky */}
                <div className="sticky top-0 z-20 flex-shrink-0">
                    <Navbar
                        toggleSidebar={toggleSidebar}
                        themeSwitcher={themeSwitcher}
                        darkMode={darkMode}
                    />
                </div>

                {/*
                 * KUNCI FIX:
                 * - TIDAK pakai overflow-y-auto di sini
                 * - Scroll terjadi di window (body), bukan di element ini
                 * - Inertia hanya bisa track scroll di window
                 * - Kalau butuh scroll tracking di custom element,
                 *   tambahkan atribut scroll-region="" sesuai Inertia docs
                 */}
                <main className="flex-1">
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
