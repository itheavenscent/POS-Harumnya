import React from "react";
import { useForm } from "@inertiajs/react";
import Modal from "@/Components/Dashboard/Modal";
import Input from "@/Components/Dashboard/Input";
export default function OpenShiftModal({ isOpen, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        starting_cash: 0,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("cash-drawers.open"), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={isOpen} onClose={onClose} title="Buka Shift Kasir" maxWidth="md">
            <form onSubmit={handleSubmit}>
                <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                    Masukkan jumlah uang tunai (modal awal) yang ada di laci kasir saat ini.
                </div>
                
                <Input
                    label="Modal Awal Laci (Rp)"
                    type="number"
                    min="0"
                    value={data.starting_cash}
                    onChange={(e) => setData("starting_cash", e.target.value)}
                    errors={errors.starting_cash}
                    required
                />

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Batal
                    </button>
                    <button type="submit" disabled={processing}
                        className="px-4 py-2.5 rounded-xl font-black text-sm text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {processing ? "Memproses..." : "Buka Shift"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
