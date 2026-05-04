import { Link, Head, usePage } from '@inertiajs/react';
import React from 'react';

export default function Error({ status }) {
    const { auth } = usePage().props;
    
    const title = {
        503: 'Maintenance Mode',
        500: 'Internal Server Error',
        404: 'Page Not Found',
        403: 'Access Forbidden',
    }[status] || 'Unexpected Error';

    const description = {
        503: 'Sistem kami sedang dalam pemeliharaan rutin. Kami akan segera kembali untuk melayani Anda.',
        500: 'Oops! Terjadi gangguan teknis pada server kami. Mohon maaf atas ketidaknyamanan ini.',
        404: 'Halaman yang Anda tuju tidak dapat ditemukan. Mungkin telah dipindahkan atau tidak pernah ada.',
        403: 'Anda tidak memiliki otorisasi untuk mengakses area ini. Silakan hubungi admin jika ini kesalahan.',
    }[status] || 'Terjadi kesalahan sistem yang tidak diketahui. Silakan hubungi tim dukungan kami.';

    const gradient = {
        503: 'from-amber-500 via-orange-600 to-yellow-500',
        500: 'from-rose-500 via-red-600 to-pink-500',
        404: 'from-indigo-500 via-blue-600 to-cyan-500',
        403: 'from-slate-700 via-slate-800 to-slate-900',
    }[status] || 'from-indigo-500 via-purple-600 to-pink-500';

    // Determine return route based on user roles
    const isCashierOnly = auth?.roles?.includes('cashier') && !auth?.roles?.includes('super-admin');
    const returnRoute = isCashierOnly ? route('transactions.index') : route('dashboard');
    const returnLabel = isCashierOnly ? 'Kembali ke POS' : 'Kembali ke Dashboard';

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] dark:bg-[#070b14] overflow-hidden relative selection:bg-indigo-100 dark:selection:bg-indigo-900/30 transition-colors duration-500">
            <Head title={`${status} - ${title}`} />
            
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br ${gradient} opacity-[0.08] dark:opacity-[0.12] blur-[120px] rounded-full animate-pulse-slow`}></div>
                <div className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tr ${gradient} opacity-[0.08] dark:opacity-[0.12] blur-[120px] rounded-full animate-pulse-slow delay-700`}></div>
                
                {/* Modern Grid Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-grid-slate-900/[0.03] dark:bg-grid-white/[0.02] bg-[center_top_-1px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
            </div>

            <div className="max-w-2xl w-full px-6 py-12 relative z-10">
                <div className="text-center">
                    {/* Status Code with Premium Effect */}
                    <div className="relative inline-block mb-12">
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} blur-3xl opacity-20 dark:opacity-30 rounded-full scale-150 animate-pulse`}></div>
                        <h1 className={`text-[10rem] sm:text-[14rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${gradient} drop-shadow-2xl relative select-none`}>
                            {status}
                        </h1>
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 rounded-full bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent"></div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-6 animate-fade-in-up">
                        <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {title}
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed font-medium">
                            {description}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up delay-300">
                        <Link
                            href={returnRoute}
                            className={`group relative flex items-center justify-center px-8 py-4 w-full sm:w-auto overflow-hidden rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl shadow-slate-900/10 dark:shadow-white/5`}
                        >
                            <span className="relative z-10 flex items-center">
                                <svg className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                {returnLabel}
                            </span>
                        </Link>
                        
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center justify-center px-8 py-4 w-full sm:w-auto rounded-2xl bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Muat Ulang
                        </button>
                    </div>
                </div>

                {/* Footer Branding */}
                <div className="mt-24 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm opacity-60">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500">
                            Harumnya POS &middot; System Error Handler
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.15; transform: scale(1.1); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 10s ease-in-out infinite;
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
                }
                .delay-300 { animation-delay: 0.3s; }
                .delay-700 { animation-delay: 0.7s; }
                
                .bg-grid-slate-900\/\\[0\.03\\] {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(15 23 42 / 0.03)'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
                }
                .dark .bg-grid-white\/\\[0\.02\\] {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.02)'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E");
                }
            `}</style>
        </div>
    );
}
