import { usePage } from "@inertiajs/react";
import {
    IconAdjustments,
    IconBooks,
    IconBoxPadding,
    IconBuildingSkyscraper,
    IconBuildingStore,
    IconBuildingWarehouse,
    IconCash,
    IconCategory,
    IconChartArrowsVertical,
    IconChartInfographic,
    IconCirclePlus,
    IconClockHour6,
    IconCreditCard,
    IconFlask,
    IconHistory,
    IconLayout2,
    IconPackage,
    IconPackages,
    IconPerfume,
    IconReportMoney,
    IconReportAnalytics,
    IconRuler2,
    IconShoppingBag,
    IconShoppingCart,
    IconSettings,
    IconTable,
    IconTag,
    IconTicket,
    IconTransfer,
    IconUserBolt,
    IconUserShield,
    IconUserSquare,
    IconUsers,
    IconUsersPlus,
    IconGift,
} from "@tabler/icons-react";
import hasAnyPermission from "./Permission";
import React from "react";

export default function Menu() {
    const { url = "", props: { auth } } = usePage();
    const isCashier = auth.roles.includes('cashier') && !auth.super;

    const menuNavigation = [

        // ─── Overview ─────────────────────────────────────────────────────────
        {
            title: "Overview",
            details: [
                {
                    title: "Dashboard",
                    href: route("dashboard"),
                    active: url === "/dashboard",
                    icon: <IconLayout2 size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["dashboard-access"]),
                },
            ],
        },

        // ─── Master Data ──────────────────────────────────────────────────────
        {
            title: "Master Data",
            details: [
                {
                    title: "Varian",
                    href: route("variants.index"),
                    active: url.startsWith("/dashboard/variants"),
                    icon: <IconCategory size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["variants-access"]),
                },
                {
                    title: "Intensitas",
                    href: route("intensities.index"),
                    active: url.startsWith("/dashboard/intensities"),
                    icon: <IconChartInfographic size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["intensities-access"]),
                },
                {
                    title: "Size",
                    href: route("sizes.index"),
                    active: url.startsWith("/dashboard/sizes"),
                    icon: <IconRuler2 size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["sizes-access"]),
                },
                {
                    title: "Harga Intensitas",
                    href: route("intensity-size-prices.index"),
                    active: url.startsWith("/dashboard/intensity-size-prices"),
                    icon: <IconCash size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["products-edit"]),
                },
                {
                    title: "Supplier",
                    href: route("suppliers.index"),
                    active: url.startsWith("/dashboard/suppliers"),
                    icon: <IconBuildingSkyscraper size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["suppliers-access"]),
                },
            ],
        },

        // ─── Bahan Baku & Produk ──────────────────────────────────────────────
        {
            title: "Bahan Baku & Produk",
            details: [
                {
                    title: "Bahan Baku",
                    href: route("ingredients.index"),
                    active: url.startsWith("/dashboard/ingredients"),
                    icon: <IconFlask size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["ingredients-access"]),
                },
                {
                    title: "Kemasan",
                    href: route("packaging.index"),
                    active: url.startsWith("/dashboard/packaging"),
                    icon: <IconPackage size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["packaging-access"]),
                },
                {
                    title: "Formula & Resep",
                    href: route("recipes.index"),
                    active: url.startsWith("/dashboard/recipes"),
                    icon: <IconBooks size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["recipes-access"]),
                },
                {
                    title: "Produk & Harga",
                    href: route("products.index"),
                    active: url.startsWith("/dashboard/products"),
                    icon: <IconPerfume size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["products-access"]),
                },
            ],
        },

        // ─── Lokasi & Tempat ──────────────────────────────────────────────────
        {
            title: "Lokasi & Tempat",
            details: [
                {
                    title: "Gudang",
                    href: route("warehouses.index"),
                    active: url.startsWith("/dashboard/warehouses"),
                    icon: <IconBuildingWarehouse size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["warehouses-access"]),
                },
                {
                    title: "Toko / Cabang",
                    href: route("stores.index"),
                    active:
                        url.startsWith("/dashboard/stores") &&
                        !url.startsWith("/dashboard/store-categories"),
                    icon: <IconBuildingStore size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["stores-access"]),
                },
                {
                    title: "Kategori Toko",
                    href: route("store-categories.index"),
                    active: url.startsWith("/dashboard/store-categories"),
                    icon: <IconTag size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["store-categories-access"]),
                },
            ],
        },

        // ─── Manajemen Stok ───────────────────────────────────────────────────
        {
            title: "Manajemen Stok",
            details: [
                {
                    title: "Stok Gudang",
                    href: route("warehouse-stocks.index"),
                    active: url.startsWith("/dashboard/warehouse-stocks"),
                    icon: <IconPackages size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["stock-warehouse-access"]),
                },
                {
                    title: "Stok Toko",
                    href: route("store-stocks.index"),
                    active: url.startsWith("/dashboard/store-stocks"),
                    icon: <IconBoxPadding size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["stock-store-access"]),
                },
                {
                    title: "Produksi / Repack",
                    href: route("repacks.index"),
                    active: url.startsWith("/dashboard/repacks"),
                    icon: <IconFlask size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["repacks-access"]),
                },
                {
                    title: "Transfer Stok",
                    href: route("stock-transfers.index"),
                    active: url.startsWith("/dashboard/stock-transfers"),
                    icon: <IconTransfer size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["stock-transfer"]),
                },
                {
                    title: "Penyesuaian Stok",
                    href: route("stock-adjustments.index"),
                    active: url.startsWith("/dashboard/stock-adjustments"),
                    icon: <IconAdjustments size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["stock-adjustment"]),
                },
                {
                    title: "Log Pergerakan Stok",
                    href: route("stock-movements.index"),
                    active: url.startsWith("/dashboard/stock-movements"),
                    icon: <IconHistory size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["stock-access"]),
                },
            ],
        },

        // ─── Pembelian ────────────────────────────────────────────────────────
        {
            title: "Pembelian",
            details: [
                {
                    title: "Purchase Order",
                    href: route("purchases.index"),
                    active: url.startsWith("/dashboard/purchases"),
                    icon: <IconShoppingBag size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["purchases-access"]),
                },
            ],
        },

        // ─── Penjualan ────────────────────────────────────────────────────────
        {
            title: "Penjualan",
            details: [
                {
                    title: "Pelanggan",
                    href: route("customers.index"),
                    active: url.startsWith("/dashboard/customers"),
                    icon: <IconUsersPlus size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["customers-access"]),
                },
                {
                    title: "Sales",
                    href: route("sales-people.index"),
                    active: url.startsWith("/dashboard/sales-people"),
                    icon: <IconUserBolt size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["sales-people-access"]),
                },
                {
                    title: "Promo & Diskon",
                    href: route("discounts.index"),
                    active: url.startsWith("/dashboard/discounts"),
                    icon: <IconTicket size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["discounts-access"]),
                },
                {
                    title: "Hadiah / Reward",
                    href: route("reward-items.index"),
                    active: url.startsWith("/dashboard/reward-items"),
                    icon: <IconGift size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["discounts-access"]),
                },
            ],
        },

        // ─── Transaksi ────────────────────────────────────────────────────────
        {
            title: "Transaksi",
            details: [
                {
                    title: "Transaksi",
                    href: route("transactions.index"),
                    active:
                        url.startsWith("/dashboard/transactions") &&
                        !url.startsWith("/dashboard/transactions/history"),
                    icon: <IconShoppingCart size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["transactions-access"]),
                },
                {
                    title: "Riwayat Transaksi",
                    href: route("transactions.history"),
                    active: url === "/dashboard/transactions/history",
                    icon: <IconClockHour6 size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["transactions-access"]),
                },
                {
                    title: "Histori Shift",
                    href: route("cash-drawers.index"),
                    active: url.startsWith("/dashboard/cash-drawers"),
                    icon: <IconCash size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["transactions-access"]),
                },
            ],
        },

        // ─── Laporan ──────────────────────────────────────────────────────────
        {
            title: "Laporan",
            details: [
                {
                    title: "Laporan Penjualan",
                    href: route("laporan.penjualan"),
                    active: url.startsWith("/dashboard/laporan/penjualan"),
                    icon: <IconChartArrowsVertical size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["reports-access"]),
                },
                {
                    title: "Laporan Keuangan",
                    href: route("laporan.keuangan"),
                    active: url.startsWith("/dashboard/laporan/keuangan"),
                    icon: <IconReportMoney size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["profits-access"]),
                },
            ],
        },

        // ─── Manajemen Pengguna ───────────────────────────────────────────────
        {
            title: "Manajemen Pengguna",
            details: [
                {
                    title: "Hak Akses",
                    href: route("permissions.index"),
                    active: url === "/dashboard/permissions",
                    icon: <IconUserShield size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["permissions-access"]),
                },
                {
                    title: "Akses Group",
                    href: route("roles.index"),
                    active: url === "/dashboard/roles",
                    icon: <IconUsers size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["roles-access"]),
                },
                {
                    title: "Pengguna",
                    icon: <IconUserSquare size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["users-access", "users-create"]),
                    subdetails: [
                        {
                            title: "Data Pengguna",
                            href: route("users.index"),
                            icon: <IconTable size={20} strokeWidth={1.5} />,
                            active: url === "/dashboard/users",
                            permissions: hasAnyPermission(["users-access"]),
                        },
                        {
                            title: "Tambah Data Pengguna",
                            href: route("users.create"),
                            icon: <IconCirclePlus size={20} strokeWidth={1.5} />,
                            active: url === "/dashboard/users/create",
                            permissions: hasAnyPermission(["users-create"]),
                        },
                    ],
                },
            ],
        },

        // ─── Pengaturan ───────────────────────────────────────────────────────
        {
            title: "Pengaturan",
            details: [
                {
                    title: "Metode Pembayaran",
                    href: route("payment-methods.index"),
                    active: url.startsWith("/dashboard/payment-methods"),
                    icon: <IconCreditCard size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["payment-methods-access"]),
                },
                {
                    title: "Pengaturan Umum",
                    href: route("settings.app.index"),
                    active: url.startsWith("/dashboard/settings/app"),
                    icon: <IconSettings size={20} strokeWidth={1.5} />,
                    permissions: hasAnyPermission(["payment-settings-access"]),
                },
            ],
        },
    ];

    if (isCashier) {
        return menuNavigation.map(category => ({
            ...category,
            details: category.details.filter(item => {
                const allowedTitles = [
                    "Dashboard",
                    "Transaksi",
                    "Riwayat Transaksi",
                    "Histori Shift",
                    "Stok Toko",
                    "Kemasan",
                    "Produk & Harga",
                    "Pelanggan" // Usually cashier needs this for POS
                ];
                return allowedTitles.includes(item.title);
            })
        })).filter(category => category.details.length > 0);
    }

    return menuNavigation;
}
