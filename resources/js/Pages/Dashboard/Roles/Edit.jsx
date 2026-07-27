import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";
import RoleForm from "./Partials/RoleForm";

export default function Edit({ role, selectedPermission, permissions }) {
    return (
        <>
            <Head title="Ubah Akses Group" />
            <RoleForm
                role={role}
                initialPermissions={selectedPermission}
                permissions={permissions}
                title="Ubah Group"
                subtitle="Perbarui nama group dan hak aksesnya."
            />
        </>
    );
}

Edit.layout = (page) => <DashboardLayout children={page} />;
