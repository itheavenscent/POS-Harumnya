import React, { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import {
    IconCirclePlus, IconUser, IconDownload,
    IconSearch, IconTrash, IconUsers, IconRepeat,
    IconChartPie, IconClockHour4,
} from "@tabler/icons-react";
import Pagination from "@/Components/Dashboard/Pagination";
import ConfirmDialog from "@/Components/Dashboard/ConfirmDialog";


const SEGMENTS = [
    { key: "",       label: "Semua" },
    { key: "vip",    label: "VIP" },
    { key: "new",    label: "Baru" },
    { key: "loyal",  label: "Loyal" },
];

function StatCard({ icon: Icon, label, value, sub, accent }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + "1a", color: accent }}>
                <Icon size={20} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight tabular-nums truncate">{value}</p>
                {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
            </div>
        </div>
    );
}

export default function Index({ customers, filters, stats = {} }) {
    const [search, setSearch] = useState(filters.search || "");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const nf = (v) => (v ?? 0).toLocaleString("id-ID");

    useEffect(() => {
        if ((search || "") !== (filters.search || "")) {
            const timer = setTimeout(() => {
                const newFilters = { ...filters, search };
                delete newFilters.page;
                router.get(route("customers.index"), newFilters, {
                    preserveState: true,
                    replace: true,
                });
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [search]);

    const handleFilter = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        delete newFilters.page;
        router.get(route("customers.index"), newFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const confirmDeleteCustomer = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route("customers.destroy", deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <>
            <Head title="Pelanggan" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">Database Pelanggan</h1>
                    <p className="text-sm text-slate-500 mt-1">Total {customers.total.toLocaleString()} pelanggan terdaftar</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <a
                        href={route("customers.export")}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
                    >
                        <IconDownload size={18} /> Export
                    </a>
                    <Link
                        href={route("customers.create")}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 transition-all"
                    >
                        <IconCirclePlus size={18} /> Tambah
                    </Link>
                </div>
            </div>

            {/* Dashboard ringkasan member */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <StatCard
                    icon={IconUsers}
                    label="Total Member"
                    value={nf(stats.total_members)}
                    sub={`${nf(stats.active_members)} aktif`}
                    accent="#7c3aed"
                />
                <StatCard
                    icon={IconRepeat}
                    label="Repeat Order"
                    value={nf(stats.repeat_orders)}
                    sub={`dari ${nf(stats.buyers)} pelanggan pernah order`}
                    accent="#16a34a"
                />
                <StatCard
                    icon={IconChartPie}
                    label="Retensi"
                    value={`${stats.retention_pct ?? 0}%`}
                    sub="pelanggan yang beli ulang"
                    accent="#2563eb"
                />
                <StatCard
                    icon={IconClockHour4}
                    label="Rata-rata Kembali"
                    value={`${stats.avg_return_days ?? 0} hari`}
                    sub="jarak antar kunjungan"
                    accent="#d97706"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                {/* Search */}
                <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama, telepon, atau kode..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-primary-500 focus:outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Segment tabs */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    {SEGMENTS.map((s) => (
                        <button
                            key={s.key}
                            onClick={() => handleFilter("segment", s.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                (filters.segment || "") === s.key
                                    ? "bg-white dark:bg-slate-700 shadow-sm text-slate-700"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Pelanggan</th>
                                <th className="p-4 text-center">Poin Aktif</th>
                                <th className="p-4 text-center">Transaksi</th>
                                <th className="p-4">Total Belanja</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {customers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-slate-400">
                                        <IconUser size={40} strokeWidth={1} className="mx-auto mb-3 opacity-40" />
                                        <p className="font-semibold">Tidak ada pelanggan ditemukan</p>
                                        <p className="text-xs mt-1">Coba ubah filter atau tambah pelanggan baru</p>
                                    </td>
                                </tr>
                            ) : (
                                customers.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 text-sm flex-shrink-0">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold dark:text-white">{c.name}</p>
                                                    <p className="text-[11px] text-slate-400">
                                                        {c.code} • {c.phone || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-bold dark:text-slate-300">
                                            {(c.points ?? 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                                            {(c.total_transactions ?? 0).toLocaleString()}
                                        </td>
                                        <td className="p-4 font-bold text-slate-700">
                                            Rp {Math.floor(parseFloat(c.lifetime_spending ?? 0)).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link
                                                    href={route("customers.show", c.id)}
                                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                                                    title="Lihat Detail"
                                                >
                                                    <IconUser size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                    title="Hapus"
                                                >
                                                    <IconTrash size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-6">
                <Pagination links={customers.links} />
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDeleteCustomer}
                loading={deleting}
                variant="danger"
                title="Hapus Pelanggan?"
                description={
                    <>Pelanggan <strong className="text-slate-700 dark:text-slate-200">{deleteTarget?.name}</strong> akan dihapus permanen beserta seluruh riwayat poinnya. Tindakan ini tidak dapat dibatalkan.</>
                }
                confirmLabel="Ya, Hapus"
            />
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
