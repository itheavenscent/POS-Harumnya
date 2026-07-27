import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Button from "@/Components/Dashboard/Button";
import Search from "@/Components/Dashboard/Search";
import Pagination from "@/Components/Dashboard/Pagination";
import {
    IconDatabaseOff,
    IconCirclePlus,
    IconTrash,
    IconUserShield,
    IconPencilCog,
    IconShield,
} from "@tabler/icons-react";

// Role Card Component
function RoleCard({ role, onDelete }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white">
                        <IconUserShield size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 capitalize">
                            {role.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {role.permissions.length} hak akses
                        </p>
                    </div>
                </div>
            </div>

            {/* Permissions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                    {role.permissions.slice(0, 8).map((permission, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-accent-100 dark:bg-accent-900/50 text-accent-700 dark:text-accent-400"
                        >
                            <IconShield size={10} />
                            {permission.name}
                        </span>
                    ))}
                    {role.permissions.length > 8 && (
                        <span className="px-2 py-0.5 text-xs font-medium text-slate-500">
                            +{role.permissions.length - 8} lainnya
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-slate-100 dark:border-slate-800">
                <Link
                    href={route("roles.edit", role.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-slate-700 hover:bg-slate-100 dark:hover:bg-warning-950/50 text-sm font-medium transition-colors"
                >
                    <IconPencilCog size={16} />
                    <span>Edit</span>
                </Link>
                <div className="w-px bg-slate-100 dark:bg-slate-800" />
                <button
                    onClick={onDelete}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 text-slate-700 hover:bg-slate-100 dark:hover:bg-danger-950/50 text-sm font-medium transition-colors"
                >
                    <IconTrash size={16} />
                    <span>Hapus</span>
                </button>
            </div>
        </div>
    );
}

export default function Index() {
    const { roles } = usePage().props;

    const handleDelete = (roleId) => {
        if (confirm("Hapus role ini?")) {
            router.delete(route("roles.destroy", roleId));
        }
    };

    return (
        <>
            <Head title="Akses Group" />

            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <IconUserShield
                                size={28}
                                className="text-slate-700"
                            />
                            Akses Group
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {roles.total || roles.data?.length || 0} group
                            terdaftar
                        </p>
                    </div>
                    <Link href={route("roles.create")}>
                        <Button
                            type={"button"}
                            icon={<IconCirclePlus size={18} strokeWidth={1.5} />}
                            className={
                                "bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                            }
                            label={"Tambah Group"}
                        />
                    </Link>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4 w-full sm:w-80">
                <Search
                    url={route("roles.index")}
                    placeholder="Cari akses group..."
                />
            </div>

            {/* Content */}
            {roles.data.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {roles.data.map((role) => (
                        <RoleCard
                            key={role.id}
                            role={role}
                            onDelete={() => handleDelete(role.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <IconDatabaseOff
                            size={32}
                            className="text-slate-400"
                            strokeWidth={1.5}
                        />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">
                        Belum Ada Group
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Tambahkan group akses pertama.
                    </p>
                    <Link href={route("roles.create")}>
                        <Button
                            type={"button"}
                            icon={<IconCirclePlus size={18} />}
                            className={
                                "bg-primary-500 hover:bg-primary-600 text-white"
                            }
                            label={"Tambah Group"}
                        />
                    </Link>
                </div>
            )}

            {roles.last_page !== 1 && <Pagination links={roles.links} />}
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
