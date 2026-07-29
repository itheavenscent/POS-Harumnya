import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, useForm, router } from '@inertiajs/react';
import {
    IconLock, IconShieldLock, IconMail, IconKey, IconSend,
    IconDeviceFloppy, IconEye, IconEyeOff, IconInfoCircle, IconRefresh,
} from '@tabler/icons-react';
import toast from 'react-hot-toast';

export default function Password({ email, ttlSeconds = 60 }) {
    const { data, setData, put, processing, errors, reset, setError, clearErrors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
        otp_code: '',
    });

    const [otpSent, setOtpSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [showPw, setShowPw] = useState({ current: false, next: false });
    const timerRef = useRef(null);

    // Hitung mundur cooldown kirim ulang OTP.
    useEffect(() => {
        if (countdown <= 0) return;
        timerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [countdown]);

    const sendOtp = () => {
        clearErrors('current_password', 'otp_code');
        if (!data.current_password) {
            setError('current_password', 'Password saat ini wajib diisi.');
            return;
        }
        setSending(true);
        router.post(route('password.otp'), { current_password: data.current_password }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setOtpSent(true);
                setCountdown(ttlSeconds);
                toast.success('Kode OTP dikirim ke email Anda.');
            },
            onError: (errs) => {
                if (errs.current_password) setError('current_password', errs.current_password);
                if (errs.otp_code) setError('otp_code', errs.otp_code);
                toast.error(errs.current_password || errs.otp_code || 'Gagal mengirim OTP.');
            },
            onFinish: () => setSending(false),
        });
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOtpSent(false);
                setCountdown(0);
                toast.success('Password berhasil diganti.');
            },
            onError: () => toast.error('Gagal mengganti password. Periksa kembali data Anda.'),
        });
    };

    const inputCls = (err) =>
        `w-full h-12 px-4 rounded-xl border transition-all focus:ring-2 focus:ring-primary-500 outline-none dark:bg-slate-950 dark:text-white ${
            err ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-700'
        }`;

    return (
        <>
            <Head title="Ganti Password" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                    <IconShieldLock size={28} className="text-primary-500" />
                    Ganti Password
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Demi keamanan, penggantian password memerlukan verifikasi kode OTP yang dikirim ke email Anda.
                </p>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <IconLock className="text-slate-700 dark:text-slate-300" size={20} />
                                Kredensial Baru
                            </h2>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Current password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                    <IconKey size={16} className="text-slate-400" />
                                    Password Saat Ini
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPw.current ? 'text' : 'password'}
                                        value={data.current_password}
                                        onChange={(e) => setData('current_password', e.target.value)}
                                        autoComplete="current-password"
                                        className={inputCls(errors.current_password)}
                                    />
                                    <button type="button" onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPw.current ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                    </button>
                                </div>
                                {errors.current_password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.current_password}</p>}
                            </div>

                            {/* New password */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Password Baru
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPw.next ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            autoComplete="new-password"
                                            className={inputCls(errors.password)}
                                        />
                                        <button type="button" onClick={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            {showPw.next ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Konfirmasi Password Baru
                                    </label>
                                    <input
                                        type={showPw.next ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        autoComplete="new-password"
                                        className={inputCls(errors.password_confirmation)}
                                    />
                                    {errors.password_confirmation && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password_confirmation}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* OTP section */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <IconMail className="text-slate-700 dark:text-slate-300" size={20} />
                                Verifikasi OTP
                            </h2>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                                <IconInfoCircle size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Klik <span className="font-bold text-slate-700 dark:text-slate-300">Kirim Kode OTP</span> untuk menerima
                                    kode 6 digit di email <span className="font-bold text-slate-700 dark:text-slate-300">{email}</span>.
                                    Kode berlaku {ttlSeconds} detik.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Kode OTP
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="______"
                                        value={data.otp_code}
                                        onChange={(e) => setData('otp_code', e.target.value.replace(/\D/g, ''))}
                                        disabled={!otpSent}
                                        className={`${inputCls(errors.otp_code)} tracking-[0.5em] font-mono text-lg text-center disabled:opacity-50 disabled:cursor-not-allowed`}
                                    />
                                    {errors.otp_code && <p className="mt-1 text-xs text-red-600 font-medium">{errors.otp_code}</p>}
                                </div>

                                <button
                                    type="button"
                                    onClick={sendOtp}
                                    disabled={sending || countdown > 0}
                                    className="h-12 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {countdown > 0
                                        ? <><IconRefresh size={16} /> Kirim ulang ({countdown}s)</>
                                        : <><IconSend size={16} /> {otpSent ? 'Kirim Ulang OTP' : 'Kirim Kode OTP'}</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={processing || !otpSent || !data.otp_code}
                            className="flex items-center gap-2 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            <IconDeviceFloppy size={20} />
                            {processing ? 'Memproses...' : 'Ganti Password'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Password.layout = (page) => <DashboardLayout children={page} />;
