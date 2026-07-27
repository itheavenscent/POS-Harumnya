import React from "react";
import { useForm, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import {
    IconArrowLeft,
    IconDeviceFloppy,
    IconUserShield,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

/**
 * Shared create/edit form for Akses Group (role).
 * `role` present => edit mode. Permissions are keyed & submitted by name.
 */
export default function RoleForm({
    role = null,
    initialPermissions = [],
    permissions = {},
    title,
    subtitle,
}) {
    const isEdit = Boolean(role);

    const { data, setData, post, put, processing, errors } = useForm({
        name: role?.name ?? "",
        selectedPermission: initialPermissions,
    });

    const togglePermission = (permName) => {
        setData(
            "selectedPermission",
            data.selectedPermission.includes(permName)
                ? data.selectedPermission.filter((p) => p !== permName)
                : [...data.selectedPermission, permName]
        );
    };

    const toggleCategory = (categoryPerms, isAllSelected) => {
        const permNames = categoryPerms.map((p) => p.name);
        if (isAllSelected) {
            setData(
                "selectedPermission",
                data.selectedPermission.filter((p) => !permNames.includes(p))
            );
        } else {
            setData("selectedPermission", [
                ...new Set([...data.selectedPermission, ...permNames]),
            ]);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        const opts = {
            onSuccess: () =>
                toast.success(
                    isEdit ? "Akses group diperbarui" : "Akses group dibuat"
                ),
            onError: () => toast.error("Terdapat kesalahan pada form."),
        };
        if (isEdit) {
            put(route("roles.update", role.id), opts);
        } else {
            post(route("roles.store"), opts);
        }
    };

    const totalSelected = data.selectedPermission.length;

    return (
        <div className="max-w-5xl mx-auto py-4">
            <Link
                href={route("roles.index")}
                className="flex items-center gap-1 text-slate-500 hover:text-primary-600 mb-6 transition-colors text-sm font-medium"
            >
                <IconArrowLeft size={18} /> Kembali ke List
            </Link>

            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary-600 rounded-2xl text-white shadow-lg">
                    <IconUserShield size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold dark:text-white">
                        {title}
                    </h1>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>

            <form
                onSubmit={submit}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 className="text-lg font-bold mb-6 border-b pb-4 dark:border-slate-800">
                            Informasi Group
                        </h2>
                        <Input
                            label="Nama group"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            errors={errors.name}
                            placeholder="Masukan nama group"
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 className="text-lg font-bold mb-2">Hak Akses</h2>
                        <p className="text-xs text-slate-400 mb-8 font-medium uppercase tracking-tighter">
                            Pilih hak akses untuk group ini:
                        </p>

                        <div className="space-y-10">
                            {Object.entries(permissions).map(
                                ([category, perms]) => {
                                    const isAllSelected = perms.every((p) =>
                                        data.selectedPermission.includes(p.name)
                                    );

                                    return (
                                        <div key={category} className="space-y-4">
                                            <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                                                    {category}
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleCategory(
                                                            perms,
                                                            isAllSelected
                                                        )
                                                    }
                                                    className="text-[10px] uppercase tracking-widest font-bold text-primary-600 hover:text-primary-700"
                                                >
                                                    {isAllSelected
                                                        ? "Deselect All"
                                                        : "Select All"}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-3">
                                                {perms.map((perm) => (
                                                    <label
                                                        key={perm.id}
                                                        className="flex items-center gap-2.5 group cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="w-4.5 h-4.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all"
                                                            checked={data.selectedPermission.includes(
                                                                perm.name
                                                            )}
                                                            onChange={() =>
                                                                togglePermission(
                                                                    perm.name
                                                                )
                                                            }
                                                        />
                                                        <span
                                                            className={`text-[11px] font-medium transition-colors ${
                                                                data.selectedPermission.includes(
                                                                    perm.name
                                                                )
                                                                    ? "text-slate-900 dark:text-white"
                                                                    : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                                                            }`}
                                                        >
                                                            {perm.name.replace(
                                                                /-/g,
                                                                " "
                                                            )}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>

                        {errors.selectedPermission && (
                            <p className="text-red-500 text-xs mt-4 font-medium">
                                {errors.selectedPermission}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-4">
                        <h3 className="font-bold mb-6 text-slate-800 dark:text-white uppercase text-xs tracking-widest">
                            Ringkasan
                        </h3>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-3xl font-black text-primary-600">
                                {totalSelected}
                            </span>
                            <span className="text-sm text-slate-500">
                                hak akses dipilih
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <IconDeviceFloppy size={20} />
                            {processing
                                ? "Menyimpan..."
                                : isEdit
                                ? "Simpan Perubahan"
                                : "Simpan Group"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
