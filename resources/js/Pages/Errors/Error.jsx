import { Link, Head, usePage } from '@inertiajs/react';
import React from 'react';

export default function Error({ status }) {
    // usePage() may fail if called outside Inertia context, so we wrap safely
    let roles = [];
    try {
        const { auth } = usePage().props;
        roles = auth?.roles ?? [];
    } catch (_) {}

    const title = {
        503: 'Maintenance Mode',
        500: 'Internal Server Error',
        404: 'Page Not Found',
        403: 'Access Forbidden',
    }[status] || 'Unexpected Error';

    const description = {
        503: 'Sistem kami sedang dalam pemeliharaan rutin. Kami akan segera kembali.',
        500: 'Terjadi gangguan teknis pada server kami. Mohon maaf atas ketidaknyamanan ini.',
        404: 'Halaman yang Anda tuju tidak dapat ditemukan.',
        403: 'Anda tidak memiliki otorisasi untuk mengakses area ini.',
    }[status] || 'Terjadi kesalahan sistem yang tidak diketahui.';

    const gradient = {
        503: 'from-amber-500 via-orange-600 to-yellow-500',
        500: 'from-rose-500 via-red-600 to-pink-500',
        404: 'from-indigo-500 via-blue-600 to-cyan-500',
        403: 'from-slate-700 via-slate-800 to-slate-900',
    }[status] || 'from-indigo-500 via-purple-600 to-pink-500';

    const isCashierOnly = roles.includes('cashier') && !roles.includes('super-admin');

    // Use safe href fallbacks if route() helper not available
    const getReturnHref = () => {
        try {
            return isCashierOnly ? route('transactions.index') : route('dashboard');
        } catch (_) {
            return '/dashboard/transactions';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
            <Head title={`${status} - ${title}`} />

            {/* Background blur */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br ${gradient} opacity-[0.07] blur-[100px] rounded-full`}></div>
                <div className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tr ${gradient} opacity-[0.07] blur-[100px] rounded-full`}></div>
            </div>

            <div className="max-w-xl w-full px-6 py-16 relative z-10 text-center">
                {/* Status Code */}
                <div className="relative inline-block mb-8">
                    <h1 className={`text-[10rem] sm:text-[13rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${gradient} select-none`}>
                        {status}
                    </h1>
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                    {title}
                </h2>
                <p className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
                    {description}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href={getReturnHref()}
                        className="group flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {isCashierOnly ? 'Kembali ke POS' : 'Kembali ke Dashboard'}
                    </a>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Muat Ulang
                    </button>
                </div>

                {/* Footer */}
                <p className="mt-16 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                    Harumnya POS &middot; Error {status}
                </p>
            </div>
        </div>
    );
}
