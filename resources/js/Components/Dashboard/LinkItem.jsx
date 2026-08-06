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
                        ? 'bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white shadow-[0px_0px_0px_1px_rgba(225,225,225,1.00)] outline outline-1 outline-offset-[-1px] outline-neutral-100 dark:shadow-[0px_0px_0px_1px_rgba(51,65,85,1.00)] dark:outline-slate-700'
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
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[0px_0px_0px_1px_rgba(225,225,225,1.00)] outline outline-1 outline-offset-[-1px] outline-neutral-100 dark:shadow-[0px_0px_0px_1px_rgba(51,65,85,1.00)] dark:outline-slate-700'
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
