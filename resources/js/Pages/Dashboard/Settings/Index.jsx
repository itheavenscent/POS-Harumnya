import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { IconSettings, IconCoin, IconInfoCircle, IconDeviceFloppy } from '@tabler/icons-react';
import toast from 'react-hot-toast';

export default function Index({ settings, loyalty_point_rate }) {
    const { auth } = usePage().props;
    
    const { data, setData, put, processing, errors } = useForm({
        loyalty_point_rate: loyalty_point_rate || 10000,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('settings.app.update'), {
            onSuccess: () => toast.success('Pengaturan berhasil diperbarui!'),
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
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <IconCoin className="text-amber-500" size={20} />
                                Program Loyalty & Poin
                            </h2>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Nilai Kelipatan Poin (IDR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={data.loyalty_point_rate}
                                        onChange={e => setData('loyalty_point_rate', e.target.value)}
                                        className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:bg-slate-950 dark:text-white ${
                                            errors.loyalty_point_rate ? 'border-red-500 bg-red-50' : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                        placeholder="Contoh: 10000"
                                    />
                                </div>
                                {errors.loyalty_point_rate && (
                                    <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.loyalty_point_rate}</p>
                                )}
                                <p className="mt-3 text-xs text-slate-500 leading-relaxed flex items-start gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                    <IconInfoCircle size={14} className="mt-0.5 flex-shrink-0" />
                                    Pelanggan akan mendapatkan 1 poin setiap belanja kelipatan nominal di atas. 
                                    Contoh: Jika diatur {formatCurrency(data.loyalty_point_rate)}, maka belanja {formatCurrency(data.loyalty_point_rate * 2.5)} akan mendapatkan 2 poin.
                                </p>
                            </div>

                            {/* Preview Section */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Simulasi Perhitungan</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold mb-1">Transaksi Rp 50.000</p>
                                        <p className="text-xl font-black text-indigo-900 dark:text-indigo-100">
                                            {data.loyalty_point_rate > 0 ? Math.floor(50000 / data.loyalty_point_rate) : 0} <span className="text-sm font-bold opacity-60">Poin</span>
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">Transaksi Rp 100.000</p>
                                        <p className="text-xl font-black text-emerald-900 dark:text-emerald-100">
                                            {data.loyalty_point_rate > 0 ? Math.floor(100000 / data.loyalty_point_rate) : 0} <span className="text-sm font-bold opacity-60">Poin</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 active:scale-95"
                        >
                            <IconDeviceFloppy size={20} />
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
