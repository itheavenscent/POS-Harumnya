import React, { useState, useCallback } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link, router } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import {
    IconArrowLeft, IconDeviceFloppy, IconTruckDelivery, IconBarcode,
    IconPhone, IconUser, IconMail, IconCreditCard,
    IconMapPin, IconAlertCircle, IconInfoCircle, IconRefresh,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

// Konstanta lokal — sinkron dengan Supplier::PAYMENT_TERMS di backend
// Nilai sebenarnya dikirim dari server melalui prop `paymentTerms`

export default function Create({ paymentTerms = [], suggestedCode = "" }) {
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code:           suggestedCode,
        name:           "",
        contact_person: "",
        phone:          "",
        email:          "",
        address:        "",
        payment_term:   "cash",
        credit_limit:   0,
        is_active:      true,
    });

    // ── Submit ────────────────────────────────────────────────────────────

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("suppliers.store"), {
            onSuccess: () => {
                toast.success("Supplier berhasil ditambahkan! 🚚");
                reset();
            },
            onError: (errs) => {
                const messages = Object.values(errs).flat();
                toast.error(messages[0] || "Periksa kembali form Anda");
            },
            preserveScroll: true,
        });
    };

    // ── Generate code via server (dijamin unik) ───────────────────────────

    const handleGenerateCode = useCallback(() => {
        setIsGeneratingCode(true);
        router.get(
            route("suppliers.generate-code"),
            {},
            {
                only: [],           // tidak reload props halaman
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    // Endpoint generateCode() mengembalikan JSON melalui route terpisah
                    // Karena Inertia tidak bisa handle JSON response langsung,
                    // gunakan fetch() biasa di sini.
                },
                onFinish: () => setIsGeneratingCode(false),
            }
        );

        // Panggil endpoint JSON langsung
        fetch(route("suppliers.generate-code"), {
            headers: { Accept: "application/json", "X-Inertia": "true" },
        })
            .then((r) => r.json())
            .then(({ code }) => {
                setData("code", code);
                toast.success("Kode berhasil di-generate!");
            })
            .catch(() => toast.error("Gagal generate kode, coba lagi."))
            .finally(() => setIsGeneratingCode(false));
    }, [setData]);

    // ── Payment term change ───────────────────────────────────────────────

    const handlePaymentTermChange = (term) => {
        setData((prev) => ({
            ...prev,
            payment_term: term,
            credit_limit: term === "cash" ? 0 : prev.credit_limit,
        }));
    };

    // ── Helpers ───────────────────────────────────────────────────────────

    const isCash        = data.payment_term === "cash";
    const showCreditInfo = !isCash && Number(data.credit_limit) > 0;

    return (
        <>
            <Head title="Tambah Supplier" />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Breadcrumb */}
                <Link
                    href={route("suppliers.index")}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 mb-4 transition-colors"
                >
                    <IconArrowLeft size={18} strokeWidth={2} />
                    Kembali ke Daftar
                </Link>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg text-teal-600">
                        <IconTruckDelivery size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">Tambah Supplier Baru</h1>
                        <p className="text-sm text-slate-500">Registrasi vendor atau pemasok barang</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Main ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Informasi Utama */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <SectionHeader icon={<IconInfoCircle size={20} />} title="Informasi Utama" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                {/* Kode */}
                                <div>
                                    <Input
                                        label="Kode Supplier"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData("code", e.target.value.toUpperCase().replace(/\s/g, ""))
                                        }
                                        errors={errors.code}
                                        placeholder="SUP-001"
                                        required
                                        icon={<IconBarcode size={18} />}
                                        maxLength={50}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateCode}
                                        disabled={isGeneratingCode}
                                        className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
                                    >
                                        {isGeneratingCode ? (
                                            <>
                                                <div className="animate-spin h-3 w-3 border-2 border-teal-600 border-t-transparent rounded-full" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <IconRefresh size={13} />
                                                Generate Kode Otomatis
                                            </>
                                        )}
                                    </button>
                                </div>

                                <Input
                                    label="Nama Perusahaan"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    errors={errors.name}
                                    placeholder="Contoh: PT. Maju Jaya"
                                    required
                                    icon={<IconTruckDelivery size={18} />}
                                    maxLength={255}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                <Input
                                    label="Contact Person"
                                    value={data.contact_person}
                                    onChange={(e) => setData("contact_person", e.target.value)}
                                    errors={errors.contact_person}
                                    placeholder="Nama Sales / Manager"
                                    icon={<IconUser size={18} />}
                                    maxLength={255}
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    errors={errors.email}
                                    placeholder="supplier@email.com"
                                    icon={<IconMail size={18} />}
                                    maxLength={255}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                <Input
                                    label="Nomor Telepon"
                                    value={data.phone}
                                    onChange={(e) => setData("phone", e.target.value)}
                                    errors={errors.phone}
                                    placeholder="0812..."
                                    icon={<IconPhone size={18} />}
                                    maxLength={50}
                                />
                            </div>

                            {/* Alamat */}
                            <AddressField
                                value={data.address}
                                onChange={(v) => setData("address", v)}
                                error={errors.address}
                            />
                        </div>

                        {/* Syarat Pembayaran */}
                        <PaymentSection
                            paymentTerms={paymentTerms}
                            paymentTerm={data.payment_term}
                            creditLimit={data.credit_limit}
                            onTermChange={handlePaymentTermChange}
                            onLimitChange={(v) => setData("credit_limit", v)}
                            termError={errors.payment_term}
                            limitError={errors.credit_limit}
                            showCreditInfo={showCreditInfo}
                        />

                        {/* Aksi */}
                        <FormActions
                            processing={processing}
                            cancelHref={route("suppliers.index")}
                            submitLabel="Simpan Supplier"
                        />
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-1 space-y-6">
                        <StatusCard
                            isActive={data.is_active}
                            onChange={(v) => setData("is_active", v)}
                        />

                        <GuideCard
                            title="Panduan Pengisian"
                            items={[
                                { label: "Kode", desc: "Harus unik, format SUP-XXXXXX" },
                                { label: "Email", desc: "Pastikan valid untuk komunikasi" },
                                { label: "Kredit", desc: "Limit hanya berlaku jika bukan tunai" },
                            ]}
                        />

                        <RequiredNote />
                    </div>
                </form>
            </div>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;

// ─── Sub-komponen ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
    return (
        <div className="flex items-center gap-2 mb-5 pb-3 border-b dark:border-slate-800">
            <span className="text-teal-500">{icon}</span>
            <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
        </div>
    );
}

function AddressField({ value, onChange, error }) {
    return (
        <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <IconMapPin size={16} />
                Alamat Kantor
            </label>
            <textarea
                rows={3}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                maxLength={1000}
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-950 dark:text-white
                    focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none
                    ${error ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-700"}`}
                placeholder="Alamat lengkap supplier termasuk kota dan kode pos..."
            />
            {error && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <IconAlertCircle size={12} />
                    {error}
                </p>
            )}
        </div>
    );
}

function PaymentSection({
    paymentTerms, paymentTerm, creditLimit,
    onTermChange, onLimitChange,
    termError, limitError, showCreditInfo,
}) {
    const isCash = paymentTerm === "cash";

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <SectionHeader icon={<IconCreditCard size={20} />} title="Syarat Pembayaran" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pilih termin */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Termin Pembayaran <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={paymentTerm}
                        onChange={(e) => onTermChange(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-950 dark:text-white
                            focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all
                            ${termError ? "border-red-500" : "border-slate-300 dark:border-slate-700"}`}
                    >
                        {paymentTerms.map((t) => (
                            <option key={t.value} value={t.value}>
                                {t.label}
                            </option>
                        ))}
                    </select>
                    {termError && (
                        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                            <IconAlertCircle size={12} /> {termError}
                        </p>
                    )}
                </div>

                {/* Credit limit */}
                <Input
                    label="Batas Kredit (Limit)"
                    type="number"
                    min={0}
                    value={creditLimit}
                    onChange={(e) => onLimitChange(e.target.value)}
                    errors={limitError}
                    placeholder="0"
                    icon={<IconCreditCard size={18} />}
                    disabled={isCash}
                    helper={
                        isCash
                            ? "Tidak tersedia untuk pembayaran tunai"
                            : "Maksimal hutang yang diperbolehkan (Rp)"
                    }
                />
            </div>

            {showCreditInfo && (
                <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg">
                    <p className="text-xs text-teal-700 dark:text-teal-300">
                        💡 <strong>Info:</strong> Limit kredit yang akan diberikan:{" "}
                        <strong>Rp {Number(creditLimit).toLocaleString("id-ID")}</strong>
                    </p>
                </div>
            )}
        </div>
    );
}

function FormActions({ processing, cancelHref, submitLabel }) {
    return (
        <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Link
                href={cancelHref}
                className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700
                    dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700
                    transition-colors text-center"
            >
                Batal
            </Link>
            <button
                type="submit"
                disabled={processing}
                className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-semibold
                    hover:bg-teal-700 transition-all flex items-center justify-center gap-2
                    shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {processing ? (
                    <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        Menyimpan...
                    </>
                ) : (
                    <>
                        <IconDeviceFloppy size={20} />
                        {submitLabel}
                    </>
                )}
            </button>
        </div>
    );
}

function StatusCard({ isActive, onChange }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm sticky top-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Status
            </h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                    <span className="block text-sm font-bold dark:text-slate-200">Status Aktif</span>
                    <span className="text-xs text-slate-500">
                        {isActive ? "Dapat bertransaksi" : "Tidak aktif"}
                    </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => onChange(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-teal-100
                        dark:peer-focus:ring-teal-900 peer-checked:bg-teal-500
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                        after:bg-white after:border after:border-slate-300 after:rounded-full
                        after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full
                        peer-checked:after:border-white" />
                </label>
            </div>
        </div>
    );
}

function GuideCard({ title, items }) {
    return (
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20
            border border-teal-100 dark:border-teal-800 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-teal-900 dark:text-teal-200 mb-3 flex items-center gap-2">
                <IconInfoCircle size={18} />
                {title}
            </h4>
            <ul className="text-xs text-teal-700 dark:text-teal-300 space-y-2">
                {items.map((item) => (
                    <li key={item.label} className="flex items-start gap-2">
                        <span className="text-teal-500 mt-0.5">•</span>
                        <span>
                            <strong>{item.label}:</strong> {item.desc}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function RequiredNote() {
    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5">
            <h4 className="text-sm font-bold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
                <IconAlertCircle size={18} />
                Field Wajib
            </h4>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Field yang ditandai <span className="text-red-500 font-bold">*</span> wajib diisi sebelum menyimpan.
            </p>
        </div>
    );
}
