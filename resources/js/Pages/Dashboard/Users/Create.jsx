import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import {
    IconArrowLeft,
    IconDeviceFloppy,
    IconBuildingStore,
    IconPackage,
    IconUserPlus,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

export default function Create({ stores, warehouses, roles, permissions }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        roles: [],
        permissions: [],
        default_store_id: "",
        default_warehouse_id: "",
    });

    const handleRoleChange = (roleName) => {
        setData("roles", data.roles.includes(roleName)
            ? data.roles.filter((r) => r !== roleName)
            : [...data.roles, roleName]
        );
    };

    const handlePermissionChange = (permName) => {
        setData("permissions", data.permissions.includes(permName)
            ? data.permissions.filter((p) => p !== permName)
            : [...data.permissions, permName]
        );
    };

    const handleToggleCategory = (categoryPerms, isAllSelected) => {
        const permNames = categoryPerms.map(p => p.name);
        if (isAllSelected) {
            // Deselect all in category
            setData("permissions", data.permissions.filter(p => !permNames.includes(p)));
        } else {
            // Select all in category
            const newPerms = [...new Set([...data.permissions, ...permNames])];
            setData("permissions", newPerms);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("users.store"), {
            onSuccess: () => toast.success("Pengguna berhasil didaftarkan"),
            onError: () => toast.error("Terdapat kesalahan pada form."),
        });
    };

    return (
        <>
            <Head title="Tambah User" />
            <div className="max-w-5xl mx-auto py-4">
                <Link
                    href={route("users.index")}
                    className="flex items-center gap-1 text-slate-500 hover:text-primary-600 mb-6 transition-colors text-sm font-medium"
                >
                    <IconArrowLeft size={18} /> Kembali ke List
                </Link>

                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-primary-600 rounded-2xl text-white shadow-lg">
                        <IconUserPlus size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">User Baru</h1>
                        <p className="text-sm text-slate-500">Buat akun untuk staff atau administrator.</p>
                    </div>
                </div>

                <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Login Info */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold mb-6 border-b pb-4 dark:border-slate-800">
                                Informasi Login
                            </h2>
                            <div className="grid grid-cols-1 gap-6">
                                <Input
                                    label="Nama Lengkap"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    errors={errors.name}
                                    required
                                    autoComplete="off"
                                />
                                <Input
                                    type="email"
                                    label="Alamat Email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    errors={errors.email}
                                    required
                                    autoComplete="off"
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        type="password"
                                        label="Password"
                                        value={data.password}
                                        onChange={(e) => setData("password", e.target.value)}
                                        errors={errors.password}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <Input
                                        type="password"
                                        label="Konfirmasi Password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData("password_confirmation", e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Roles */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-primary-500">
                            <h2 className="text-lg font-bold mb-2">Role Pengguna</h2>
                            <p className="text-xs text-slate-400 mb-6 font-medium uppercase tracking-tighter">
                                Pilih role dasar untuk user ini:
                            </p>

                            {roles.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Belum ada role tersedia.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {roles.map((role) => (
                                        <label
                                            key={role.id}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                                                data.roles.includes(role.name)
                                                    ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10"
                                                    : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded-lg border-slate-300 text-primary-600 focus:ring-primary-500"
                                                checked={data.roles.includes(role.name)}
                                                onChange={() => handleRoleChange(role.name)}
                                            />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                                                {role.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {errors.roles && (
                                <p className="text-red-500 text-xs mt-3 font-medium">{errors.roles}</p>
                            )}
                        </div>

                        {/* Direct Permissions */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-lg font-bold mb-2">Permission Kustom (Direct)</h2>
                            <p className="text-xs text-slate-400 mb-8 font-medium uppercase tracking-tighter">
                                Tambahkan atau hapus izin spesifik untuk user ini secara satuan:
                            </p>

                            <div className="space-y-10">
                                {Object.entries(permissions).map(([category, perms]) => {
                                    const isAllSelected = perms.every(p => data.permissions.includes(p.name));
                                    
                                    return (
                                        <div key={category} className="space-y-4">
                                            <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                                                    {category}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCategory(perms, isAllSelected)}
                                                    className="text-[10px] uppercase tracking-widest font-bold text-primary-600 hover:text-primary-700"
                                                >
                                                    {isAllSelected ? "Deselect All" : "Select All"}
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-3">
                                                {perms.map((perm) => (
                                                    <label
                                                        key={perm.id}
                                                        className="flex items-center gap-2.5 group cursor-pointer"
                                                    >
                                                        <div className="relative flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="w-4.5 h-4.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all"
                                                                checked={data.permissions.includes(perm.name)}
                                                                onChange={() => handlePermissionChange(perm.name)}
                                                            />
                                                        </div>
                                                        <span className={`text-[11px] font-medium transition-colors ${
                                                            data.permissions.includes(perm.name)
                                                                ? "text-slate-900 dark:text-white"
                                                                : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                                                        }`}>
                                                            {perm.name.replace(/-/g, ' ')}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {errors.permissions && (
                                <p className="text-red-500 text-xs mt-3 font-medium">{errors.permissions}</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Location */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="font-bold mb-6 text-slate-800 dark:text-white uppercase text-xs tracking-widest">
                                Penempatan
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold flex items-center gap-2 mb-3 dark:text-slate-300">
                                        <IconBuildingStore size={18} className="text-primary-500" />
                                        Toko Default
                                    </label>
                                    <select
                                        className="w-full rounded-xl border-slate-200 dark:bg-slate-950 dark:border-slate-700 dark:text-white focus:ring-primary-500"
                                        value={data.default_store_id}
                                        onChange={(e) => setData("default_store_id", e.target.value)}
                                    >
                                        <option value="">Akses Pusat (All Stores)</option>
                                        {stores.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    {errors.default_store_id && (
                                        <p className="text-red-500 text-xs mt-1">{errors.default_store_id}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-bold flex items-center gap-2 mb-3 dark:text-slate-300">
                                        <IconPackage size={18} className="text-primary-500" />
                                        Gudang Default
                                    </label>
                                    <select
                                        className="w-full rounded-xl border-slate-200 dark:bg-slate-950 dark:border-slate-700 dark:text-white focus:ring-primary-500"
                                        value={data.default_warehouse_id}
                                        onChange={(e) => setData("default_warehouse_id", e.target.value)}
                                    >
                                        <option value="">Akses Pusat (All Warehouses)</option>
                                        {warehouses.map((w) => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                    {errors.default_warehouse_id && (
                                        <p className="text-red-500 text-xs mt-1">{errors.default_warehouse_id}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IconDeviceFloppy size={20} />
                            {processing ? "Menyimpan..." : "Simpan Akun"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
