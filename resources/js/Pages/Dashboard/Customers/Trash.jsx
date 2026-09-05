import React, { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import { IconArrowLeft, IconSearch, IconTrash, IconRestore, IconUserOff } from "@tabler/icons-react";
import Pagination from "@/Components/Dashboard/Pagination";
import ConfirmDialog from "@/Components/Dashboard/ConfirmDialog";

export default function Trash({ customers, filters }) {
    const [search, setSearch] = useState(filters.search || "");
    const [restoreTarget, setRestoreTarget] = useState(null);
    const [restoring, setRestoring] = useState(false);

    useEffect(() => {
        if ((search || "") !== (filters.search || "")) {
            const timer = setTimeout(() => {
                const newFilters = { ...filters, search };
                delete newFilters.page;
                router.get(route("customers.trash"), newFilters, {
                    preserveState: true,
                    replace: true,
                });
            }, 400);
            return () => clearTimeout(timer);
        }
    }, [search]);

    const confirmRestore = () => {
        if (!restoreTarget) return;
        setRestoring(true);
        router.put(route("customers.restore", restoreTarget.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setRestoring(false);
                setRestoreTarget(null);
            },
        });
    };

    return (
        <>
            <Head title="Sampah Pelanggan" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href={route("customers.index")}
                            className="p-1.5 -ml-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Kembali ke Pelanggan"
                        >
                            <IconArrowLeft size={18} />
                        </Link>
                        <h1 className="text-2xl font-bold dark:text-white">Sampah Pelanggan</h1>
                    </div>
                    <p className="text-sm text-slate-500 ml-8">
                        {customers.total.toLocaleString()} pelanggan yang sudah dihapus — bisa dipulihkan kapan saja
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari nama, telepon, atau kode..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-primary-500 focus:outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Pelanggan</th>
                                <th className="p-4">Dihapus Pada</th>
                                <th className="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {customers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-16 text-center text-slate-400">
                                        <IconUserOff size={40} strokeWidth={1} className="mx-auto mb-3 opacity-40" />
                                        <p className="font-semibold">Sampah kosong</p>
                                        <p className="text-xs mt-1">Belum ada pelanggan yang dihapus</p>
                                    </td>
                                </tr>
                            ) : (
                                customers.data.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-sm flex-shrink-0">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-600 dark:text-slate-300">{c.name}</p>
                                                    <p className="text-[11px] text-slate-400">
                                                        {c.code} • {c.phone || "—"}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400">
                                            {c.deleted_at
                                                ? new Date(c.deleted_at).toLocaleDateString("id-ID", {
                                                    day: "numeric", month: "short", year: "numeric",
                                                })
                                                : "—"}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setRestoreTarget({ id: c.id, name: c.name })}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg transition-colors"
                                                title="Pulihkan"
                                            >
                                                <IconRestore size={15} /> Pulihkan
                                            </button>
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
                open={!!restoreTarget}
                onClose={() => setRestoreTarget(null)}
                onConfirm={confirmRestore}
                loading={restoring}
                variant="info"
                title="Pulihkan Pelanggan?"
                description={
                    <>Pelanggan <strong className="text-slate-700 dark:text-slate-200">{restoreTarget?.name}</strong> akan dikembalikan ke daftar pelanggan aktif.</>
                }
                confirmLabel="Ya, Pulihkan"
            />
        </>
    );
}

Trash.layout = (page) => <DashboardLayout children={page} />;
