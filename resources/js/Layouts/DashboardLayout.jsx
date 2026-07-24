import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import Sidebar from "@/Components/Dashboard/Sidebar";
import { Toaster } from "react-hot-toast";
import { useTheme } from "@/Context/ThemeSwitcherContext";
import { IconArrowsExchange } from "@tabler/icons-react";
import CashTransactionModal from "@/Components/POS/CashTransactionModal";

export default function AppLayout({ children }) {
    const { darkMode, themeSwitcher } = useTheme();
    const { props } = usePage();
    const { activeCashDrawer } = props;
    const [isCashModalOpen, setIsCashModalOpen] = useState(false);

    return (
        <div
            className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-200"
        >
            <Sidebar themeSwitcher={themeSwitcher} darkMode={darkMode} />

            <div className="flex-1 flex flex-col min-w-0 h-full">
                {activeCashDrawer && (
                    <div className="flex-shrink-0 flex items-center justify-end gap-2 px-4 md:px-6 lg:px-8 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setIsCashModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                        >
                            <IconArrowsExchange size={15} />
                            Kas Masuk / Kas Keluar
                        </button>
                    </div>
                )}

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

            {isCashModalOpen && (
                <CashTransactionModal
                    isOpen={isCashModalOpen}
                    onClose={() => setIsCashModalOpen(false)}
                />
            )}
        </div>
    );
}
