import React, { useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import { IconArrowLeft, IconPrinter } from "@tabler/icons-react";

export default function PrintShift({ drawer, summary }) {
    useEffect(() => {
        const timer = setTimeout(() => { window.print(); }, 800);
        return () => clearTimeout(timer);
    }, []);

    const fmt = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const d = new Date(dateString);
        return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) + " " + 
               d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center py-8 print:py-0 print:bg-white">
            <Head title="Cetak Rekap Shift" />

            <div className="w-[80mm] bg-white p-4 text-[10px] font-mono text-black mx-auto">
                <div className="text-center mb-4">
                    <h1 className="font-bold text-sm mb-1 uppercase">{drawer.store?.name}</h1>
                    <p className="text-[9px]">{drawer.store?.address}</p>
                    <div className="mt-2 border-y border-dashed border-black py-1 font-bold">
                        LAPORAN REKAP SHIFT
                    </div>
                </div>

                <div className="mb-4 space-y-1">
                    <div className="flex justify-between"><span>Kasir:</span> <span>{drawer.cashier?.name}</span></div>
                    <div className="flex justify-between"><span>Buka:</span> <span>{formatDate(drawer.opened_at)}</span></div>
                    <div className="flex justify-between"><span>Tutup:</span> <span>{formatDate(drawer.closed_at)}</span></div>
                </div>

                <div className="border-b border-dashed border-black pb-2 mb-2">
                    <div className="flex justify-between"><span>Modal Awal:</span> <span>{fmt(drawer.starting_cash)}</span></div>
                    <div className="flex justify-between"><span>Total Tunai:</span> <span>{fmt(drawer.total_cash_sales)}</span></div>
                    <div className="flex justify-between"><span>Total Non-Tunai:</span> <span>{fmt(drawer.total_non_cash_sales)}</span></div>
                </div>

                {/* Items Summary */}
                <div className="mb-4">
                    <p className="font-bold border-b border-black mb-1">RINGKASAN ITEM</p>
                    {summary.items?.map((item, i) => (
                        <div key={i} className="mb-1">
                            <div className="flex justify-between">
                                <span className="flex-1 truncate">{item.product_name}</span>
                                <span className="ml-2">{item.total_qty}x</span>
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-600 italic">
                                <span>{item.variant_name}</span>
                                <span>{fmt(item.total_amount)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cash Transactions */}
                {summary.cash_transactions?.length > 0 && (
                    <div className="mb-4">
                        <p className="font-bold border-b border-black mb-1">CASH IN / OUT</p>
                        {summary.cash_transactions.map((tr, i) => (
                            <div key={i} className="flex justify-between text-[9px]">
                                <span>{tr.type === 'cash_in' ? '[IN]' : '[OUT]'} {tr.description}</span>
                                <span>{tr.type === 'cash_in' ? '' : '-'}{fmt(tr.amount)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Payments Breakdown */}
                <div className="mb-4">
                    <p className="font-bold border-b border-black mb-1">METODE PEMBAYARAN</p>
                    {summary.payments?.map((p, i) => (
                        <div key={i} className="flex justify-between">
                            <span>{p.name} ({p.count}x)</span>
                            <span>{fmt(p.total)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-t border-black pt-2 mb-4 space-y-1 font-bold">
                    <div className="flex justify-between"><span>Ekspektasi:</span> <span>{fmt(drawer.expected_ending_cash)}</span></div>
                    <div className="flex justify-between"><span>Aktual:</span> <span>{fmt(drawer.actual_ending_cash)}</span></div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-black">
                        <span>SELISIH:</span> <span>{fmt(drawer.difference)}</span>
                    </div>
                </div>

                {drawer.notes && (
                    <div className="mb-4 text-[9px] italic border-t border-dashed border-black pt-2">
                        <p>Catatan: {drawer.notes}</p>
                    </div>
                )}

                <div className="text-center mt-6 text-[9px]">
                    <p>Dicetak: {formatDate(new Date())}</p>
                    <p className="mt-2 font-bold">*** HARUMNYA POS ***</p>
                </div>
            </div>

            <div className="fixed bottom-6 right-6 flex gap-3 print:hidden">
                <Link href={route("cash-drawers.index")} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl shadow-lg">
                    <IconArrowLeft size={18} /> Kembali
                </Link>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl shadow-lg">
                    <IconPrinter size={18} /> Cetak
                </button>
            </div>
        </div>
    );
}
