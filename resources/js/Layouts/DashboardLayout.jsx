import React from "react";
import Sidebar from "@/Components/Dashboard/Sidebar";
import { Toaster } from "react-hot-toast";
import { useTheme } from "@/Context/ThemeSwitcherContext";

export default function AppLayout({ children }) {
    const { darkMode, themeSwitcher } = useTheme();

    return (
        /*
         * KUNCI FIX: h-screen + overflow-hidden di wrapper utama
         * Ini "mengunci" tinggi halaman ke viewport — sidebar tidak bisa
         * ikut scroll karena tidak ada scroll di level ini.
         */
        <div
            className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-200"
        >
            {/* Sidebar — sekarang self-contained, mengelola state-nya sendiri */}
            <Sidebar themeSwitcher={themeSwitcher} darkMode={darkMode} />

            {/* Konten utama */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {/*
                 * Area konten yang SCROLL — overflow-y-auto di sini
                 * Hanya konten yang bergerak, sidebar tetap diam.
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
