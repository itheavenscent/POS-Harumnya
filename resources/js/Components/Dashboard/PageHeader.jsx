import React from "react";
import { useTheme } from "@/Context/ThemeSwitcherContext";
import { IconSun, IconMoon } from "@tabler/icons-react";

export default function PageHeader({ title, description, actions }) {
    const { darkMode, themeSwitcher } = useTheme();

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-[#e8e8e8] dark:border-slate-800 flex items-center justify-between -mx-4 md:-mx-6 lg:-mx-8 -mt-6 mb-6 px-4 md:px-6 lg:px-8 py-[14px] relative">
            <div className="min-w-0">
                <h1 className="font-semibold text-[22px] text-[#0f172a] dark:text-white leading-tight">
                    {title}
                </h1>
                {description && (
                    <p className="font-medium text-[#666] dark:text-slate-400 text-[14px] mt-0.5">
                        {description}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
                {themeSwitcher && (
                    <button
                        onClick={themeSwitcher}
                        title={darkMode ? "Mode Terang" : "Mode Gelap"}
                        className="bg-white dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-center rounded-[9px] shrink-0 size-[34px] cursor-pointer transition-colors"
                    >
                        {darkMode ? (
                            <IconSun size={16} className="text-amber-500" />
                        ) : (
                            <IconMoon size={16} className="text-slate-600 dark:text-slate-400" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
