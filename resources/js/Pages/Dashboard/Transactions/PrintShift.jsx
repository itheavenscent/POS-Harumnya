import React, { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { IconArrowLeft, IconPrinter } from "@tabler/icons-react";

export default function PrintShift({ drawer }) {
    useEffect(() => {
        // Automatically open print dialog after a short delay
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center py-8 print:py-0 print:bg-white">
            <Head title="Cetak Rekap Shift Kasir" />

            <div className="w-[80mm] bg-white p-4 text-xs font-mono text-slate-800 shadow-sm print:shadow-none mx-auto">
                <div className="text-center mb-4">
                    <h1 className="font-bold text-lg mb-1">{drawer.store?.name}</h1>
                    <p>{drawer.store?.address}</p>
                    <p className="mt-2 text-[10px] border-b border-dashed border-slate-400 pb-2">
                        REKAP SHIFT KASIR
                    </p>
                </div>

                <div className="mb-4 space-y-1">
                    <div className="flex justify-between">
                        <span>Kasir:</span>
                        <span>{drawer.cashier?.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Buka:</span>
                        <span>{formatDate(drawer.opened_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Tutup:</span>
                        <span>{formatDate(drawer.closed_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Durasi:</span>
                        <span>
                            {drawer.closed_at 
                                ? Math.round((new Date(drawer.closed_at) - new Date(drawer.opened_at)) / 3600000) 
                                : 0} Jam
                        </span>
                    </div>
                </div>

                <div className="border-t border-b border-dashed border-slate-400 py-2 mb-4 space-y-2">
                    <div className="flex justify-between">
                        <span>Modal Awal:</span>
                        <span>{formatRupiah(drawer.starting_cash)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Penjualan Tunai:</span>
                        <span>{formatRupiah(drawer.total_cash_sales)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Penjualan Non-Tunai:</span>
                        <span>{formatRupiah(drawer.total_non_cash_sales)}</span>
                    </div>
                </div>

                <div className="mb-4 space-y-2 font-bold">
                    <div className="flex justify-between">
                        <span>Ekspektasi Laci:</span>
                        <span>{formatRupiah(drawer.expected_ending_cash)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Aktual Laci:</span>
                        <span>{formatRupiah(drawer.actual_ending_cash)}</span>
                    </div>
                    <div className={`flex justify-between mt-2 pt-2 border-t border-slate-300 ${drawer.difference < 0 ? 'text-red-600 print:text-black' : ''}`}>
                        <span>Selisih:</span>
                        <span>{formatRupiah(drawer.difference)}</span>
                    </div>
                </div>

                {drawer.notes && (
                    <div className="mb-4 text-[10px] italic border-t border-dashed border-slate-400 pt-2">
                        <p>Catatan:</p>
                        <p>{drawer.notes}</p>
                    </div>
                )}

                <div className="text-center mt-8 text-[10px]">
                    <p>Dicetak pada {formatDate(new Date())}</p>
                    <p className="mt-4">*** TERIMA KASIH ***</p>
                </div>
            </div>

            {/* Print Controls (Hidden in print) */}
            <div className="fixed bottom-6 right-6 flex gap-3 print:hidden">
                <Link
                    href={route("dashboard.transactions.index")}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-700 transition"
                >
                    <IconArrowLeft size={18} />
                    Kembali
                </Link>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl shadow-lg hover:bg-primary-700 transition"
                >
                    <IconPrinter size={18} />
                    Cetak Ulang
                </button>
            </div>
        </div>
    );
}
