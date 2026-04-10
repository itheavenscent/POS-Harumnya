import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Dashboard/Modal";
import Input from "@/Components/Dashboard/Input";
export default function CloseShiftModal({ isOpen, onClose, activeCashDrawer }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        actual_ending_cash: 0,
        notes: "",
    });

    useEffect(() => {
        if (isOpen && activeCashDrawer) {
            // Kita bisa menebak expected cash jika backend tidak secara reaktif update.
            // Tapi biarkan kasir hitung sendiri saja atau default ke 0.
            setData("actual_ending_cash", 0);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("cash-drawers.close", activeCashDrawer.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!activeCashDrawer) return null;

    return (
        <Modal show={isOpen} onClose={onClose} title="Tutup Shift Kasir" maxWidth="md">
            <form onSubmit={handleSubmit}>
                <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Ringkasan Shift Saat Ini
                    </h4>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Waktu Buka:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {new Date(activeCashDrawer.opened_at).toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Modal Awal:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                            Rp {parseFloat(activeCashDrawer.starting_cash).toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>
                
                <div className="mb-4 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800/50">
                    Silakan hitung total uang tunai yang ada di laci saat ini dan masukkan nominalnya di bawah ini.
                </div>
                
                <Input
                    label="Total Uang Tunai di Laci (Rp)"
                    type="number"
                    min="0"
                    value={data.actual_ending_cash}
                    onChange={(e) => setData("actual_ending_cash", e.target.value)}
                    errors={errors.actual_ending_cash}
                    required
                />

                <Input
                    label="Catatan (Opsional)"
                    type="text"
                    value={data.notes}
                    onChange={(e) => setData("notes", e.target.value)}
                    errors={errors.notes}
                    placeholder="Contoh: Ada selisih karena..."
                />

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Batal
                    </button>
                    <button type="submit" disabled={processing}
                        className="px-4 py-2.5 rounded-xl font-black text-sm text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {processing ? "Memproses..." : "Tutup Shift & Cetak Recap"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
