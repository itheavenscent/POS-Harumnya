import { Link, Head } from '@inertiajs/react';

export default function Error({ status }) {
    const title = {
        503: 'Service Unavailable',
        500: 'Server Error',
        404: 'Page Not Found',
        403: 'Forbidden Access',
    }[status] || 'Error';

    const description = {
        503: 'Maaf, layanan sedang dalam perbaikan (maintenance). Silakan coba lagi nanti.',
        500: 'Waduh, terjadi kesalahan pada server kami. Tim kami sedang menanganinya.',
        404: 'Halaman yang Anda cari tidak ditemukan, mungkin telah dihapus atau URL tidak valid.',
        403: 'Maaf, Anda dilarang mengakses halaman ini. Silakan hubungi administrator.',
    }[status] || 'Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.';

    const illustration = {
        503: '🛠️',
        500: '⚠️',
        404: '🎯',
        403: '🚫',
    }[status] || '🛑';

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <Head title={title} />
            
            <div className="max-w-xl w-full text-center relative">
                {/* Decorative blob shapes background */}
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 dark:opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>

                <div className="relative bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl p-10 sm:p-14 rounded-[2rem] shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/5 border border-slate-100 dark:border-slate-700/50">
                    
                    <div className="mx-auto flex items-center justify-center h-28 w-28 rounded-full bg-indigo-50 dark:bg-slate-700/50 mb-8 relative shadow-inner">
                        <div className="absolute inset-0 rounded-full animate-ping opacity-25 bg-indigo-400"></div>
                        <span className="text-6xl drop-shadow-md relative z-10">{illustration}</span>
                    </div>
                    
                    <div>
                        <h1 className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 tracking-tight drop-shadow-sm">
                            {status}
                        </h1>
                        <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
                            {title}
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                            {description}
                        </p>
                    </div>
                    
                    <div className="mt-10 pt-8 border-t border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Kembali ke Beranda
                        </Link>
                        
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center px-8 py-3.5 border border-slate-300 dark:border-slate-600 text-base font-medium rounded-2xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Halaman Sebelumnya
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
