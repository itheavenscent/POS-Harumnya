import React from "react";
import { Link, usePage } from "@inertiajs/react";

export default function LinkItem({ href, icon, access, title, sidebarOpen, exact = false, ...props }) {
    const { url = "" } = usePage();
    const { auth } = usePage().props;

    const normHref = (() => {
        try {
            const u = new URL(href);
            return u.pathname + (u.search || "");
        } catch {
            return href;
        }
    })();

    const segments = normHref.replace(/^\//, "").split("/").filter(Boolean);
    const forceExact = exact || segments.length <= 1;

    const isActive = forceExact
        ? url === normHref
        : url === normHref ||
          (url && url.startsWith(normHref + "/")) ||
          (url && url.startsWith(normHref + "?"));

    const canAccess = auth.super === true || access === true;
    if (!canAccess) return null;

    /* ── EXPANDED ── */
    if (sidebarOpen) {
        return (
            <Link
                href={href}
                preserveScroll={true}
                data-active={String(isActive)}
                className={`sb-link-exp flex items-center gap-[10px] mx-3 my-[2px] px-[10px] py-[8px] rounded-[8px] no-underline text-[14px] transition-all duration-200 cursor-pointer ${
                    isActive
                        ? 'bg-white dark:bg-slate-800 border border-[#f7f7f7] dark:border-slate-750 font-semibold text-slate-900 dark:text-white shadow-[0px_1px_3px_rgba(15,23,42,0.08),inset_0px_2px_2px_rgba(221,221,221,0.15),0px_0px_0px_1px_rgba(132,132,132,0.15)] shadow-sm'
                        : 'border border-transparent font-medium text-[#4d5360] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                }`}
                {...props}
            >
                <div className="sb-icon flex items-center justify-center shrink-0 text-slate-450 dark:text-slate-400">
                    {React.cloneElement(icon, { size: 18, strokeWidth: 1.7 })}
                </div>

                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {title}
                </span>
            </Link>
        );
    }

    /* ── COLLAPSED ── */
    return (
        <Link
            href={href}
            title={title}
            preserveScroll={true}
            data-active={String(isActive)}
            className={`sb-link-col flex items-center justify-center mx-3 my-[3px] p-[9px] rounded-[8px] transition-all duration-200 ${
                isActive
                    ? 'bg-white dark:bg-slate-800 border border-[#f7f7f7] dark:border-slate-750 text-slate-900 dark:text-white shadow-[0px_1px_3px_rgba(15,23,42,0.08),inset_0px_2px_2px_rgba(221,221,221,0.15),0px_0px_0px_1px_rgba(132,132,132,0.15)]'
                    : 'text-slate-450 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
            }`}
            {...props}
        >
            <div className="sb-icon flex items-center justify-center shrink-0">
                {React.cloneElement(icon, { size: 18, strokeWidth: 1.7 })}
            </div>
        </Link>
    );
}
