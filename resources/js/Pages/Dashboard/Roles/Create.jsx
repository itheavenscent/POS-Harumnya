import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";
import RoleForm from "./Partials/RoleForm";

export default function Create({ permissions }) {
    return (
        <>
            <Head title="Tambah Akses Group" />
            <RoleForm
                permissions={permissions}
                title="Group Baru"
                subtitle="Buat group akses dan tentukan hak aksesnya."
            />
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
