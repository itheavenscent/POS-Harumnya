import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { IconSettings, IconCoin, IconInfoCircle, IconDeviceFloppy, IconGift, IconTrophy } from '@tabler/icons-react';
import toast from 'react-hot-toast';

export default function Index({ settings, loyalty_point_rate, loyalty_reward_threshold, loyalty_reward_description }) {
    const { auth } = usePage().props;
    
    const { data, setData, put, processing, errors } = useForm({
        loyalty_point_rate: loyalty_point_rate || 10000,
        loyalty_reward_threshold: loyalty_reward_threshold || 30,
        loyalty_reward_description: loyalty_reward_description || 'Free parfum P30 EDT + Botol',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('settings.app.update'), {
            onSuccess: () => toast.success('Pengaturan loyalty berhasil diperbarui!'),
        });
    };

    const formatCurrency = (value) => 
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    return (
        <>
            <Head title="Pengaturan Aplikasi" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                    <IconSettings size={28} className="text-slate-500" />
                    Pengaturan Umum
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Kelola konfigurasi dasar aplikasi POS Harumnya
                </p>
            </div>

            <div className="max-w-3xl">
                <form onSubmit={submit} className="space-y-6">
                    {/* Loyalty Settings Group */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <IconCoin className="text-amber-500" size={20} />
                                Program Loyalty & Poin Member
                            </h2>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Point Earning Rate */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                        <IconCoin size={16} className="text-slate-400" />
                                        Nilai Per 1 Poin (IDR)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={data.loyalty_point_rate}
                                            onChange={e => setData('loyalty_point_rate', e.target.value)}
                                            className={`w-full h-12 pl-12 pr-4 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:bg-slate-950 dark:text-white ${
                                                errors.loyalty_point_rate ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                        />
                                    </div>
                                    {errors.loyalty_point_rate && <p className="mt-1 text-xs text-red-500 font-medium">{errors.loyalty_point_rate}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                        <IconTrophy size={16} className="text-slate-400" />
                                        Ambang Batas Reward
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            value={data.loyalty_reward_threshold}
                                            onChange={e => setData('loyalty_reward_threshold', e.target.value)}
                                            className={`w-full h-12 px-4 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:bg-slate-950 dark:text-white ${
                                                errors.loyalty_reward_threshold ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs uppercase tracking-wider">Poin</span>
                                    </div>
                                    {errors.loyalty_reward_threshold && <p className="mt-1 text-xs text-red-500 font-medium">{errors.loyalty_reward_threshold}</p>}
                                </div>
                            </div>

                            {/* Reward Description */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                    <IconGift size={16} className="text-slate-400" />
                                    Deskripsi Hadiah / Reward
                                </label>
                                <textarea
                                    value={data.loyalty_reward_description}
                                    onChange={e => setData('loyalty_reward_description', e.target.value)}
                                    rows={2}
                                    className={`w-full px-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:bg-slate-950 dark:text-white resize-none ${
                                        errors.loyalty_reward_description ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                    placeholder="Contoh: Free parfum P30 EDT + Botol"
                                />
                                {errors.loyalty_reward_description && <p className="mt-1 text-xs text-red-500 font-medium">{errors.loyalty_reward_description}</p>}
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <IconInfoCircle size={14} />
                                    Simulasi & Penjelasan
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Saat ini diatur: Setiap transaksi <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(data.loyalty_point_rate)}</span> akan mendapatkan <span className="font-bold text-slate-800 dark:text-slate-200">1 Poin</span>.
                                        Setelah mengumpulkan <span className="font-bold text-slate-800 dark:text-slate-200">{data.loyalty_reward_threshold} Poin</span>, member berhak mendapatkan <span className="font-bold text-emerald-600 dark:text-emerald-400">{data.loyalty_reward_description}</span>.
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Transaksi Rp 50.000</p>
                                            <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                                                {data.loyalty_point_rate > 0 ? Math.floor(50000 / data.loyalty_point_rate) : 0} <span className="text-sm font-bold opacity-40">Poin</span>
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Belanja Dibutuhkan</p>
                                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(data.loyalty_point_rate * data.loyalty_reward_threshold)}
                                            </p>
                                            <p className="text-[9px] text-slate-400 mt-1">Untuk mendapatkan Reward</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-500/30 transition-all disabled:opacity-50 active:scale-95"
                        >
                            <IconDeviceFloppy size={20} />
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
