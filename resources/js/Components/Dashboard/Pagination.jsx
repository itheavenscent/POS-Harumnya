import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) return null;

    const baseButtonStyle = `
        inline-flex items-center justify-center
        min-w-[36px] h-9 px-3.5
        text-xs font-semibold
        rounded-[8px]
        transition-all duration-200
        select-none cursor-pointer
    `;

    const navigationButtonStyle = `
        ${baseButtonStyle}
        bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white
        border border-[#e8e8e8] dark:border-slate-700
        hover:bg-slate-50 dark:hover:bg-slate-750
        disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const pageButtonStyle = (isActive) => `
        ${baseButtonStyle}
        ${isActive
            ? 'bg-gradient-to-b from-[#54b8c3] to-[#39a1ac] text-white border-0 shadow-[0px_4px_6px_-1px_rgba(57,161,172,0.15)] font-bold'
            : 'bg-white dark:bg-slate-900 text-[#0f172a] dark:text-white border border-[#e8e8e8] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
        }
    `;

    return (
        <nav className="mt-6 lg:mt-8" aria-label="Pagination Navigation">
            <ul className="flex flex-wrap items-center justify-end gap-1.5">
                {links.map((link, index) => {
                    if (!link.url) return null;

                    // Previous Button
                    if (link.label.includes('Previous')) {
                        return (
                            <li key={`prev-${index}`}>
                                <Link
                                    href={link.url}
                                    preserveScroll={true}
                                    className={navigationButtonStyle}
                                    aria-label="Previous page"
                                >
                                    <span className="flex items-center gap-1">&lt; Back</span>
                                </Link>
                            </li>
                        );
                    }

                    // Next Button
                    if (link.label.includes('Next')) {
                        return (
                            <li key={`next-${index}`}>
                                <Link
                                    href={link.url}
                                    preserveScroll={true}
                                    className={navigationButtonStyle}
                                    aria-label="Next page"
                                >
                                    <span className="flex items-center gap-1">Next &gt;</span>
                                </Link>
                            </li>
                        );
                    }

                    // Page Number Button
                    return (
                        <li key={`page-${index}`}>
                            <Link
                                href={link.url}
                                preserveScroll={true}
                                className={pageButtonStyle(link.active)}
                                aria-label={`Page ${link.label}`}
                                aria-current={link.active ? 'page' : undefined}
                            >
                                {link.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
