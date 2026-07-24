import React, { useState } from "react";
import {
    IconX, IconPrinter, IconBluetooth, IconBluetoothConnected,
    IconBluetoothX, IconCheck, IconLoader2, IconPlugConnected,
    IconPlugConnectedX, IconTestPipe, IconAlertTriangle,
} from "@tabler/icons-react";
import { useBluetoothContext } from "@/Context/BluetoothContext";
import toast from "react-hot-toast";

// ── Builder ESC/POS untuk test print ──────────────────────────────────────────
function buildTestReceipt() {
    const enc = new TextEncoder();
    const bytes = [];
    const push = (arr) => arr.forEach((b) => bytes.push(b));
    const text = (s) => enc.encode(s).forEach((b) => bytes.push(b));

    push([0x1b, 0x40]);             // init
    push([0x1b, 0x61, 0x01]);       // center
    push([0x1b, 0x21, 0x30]);       // double size
    text("HARUMNYA\n");
    push([0x1b, 0x21, 0x00]);       // normal
    text("Test Print Printer\n");
    text("--------------------------------\n");
    push([0x1b, 0x61, 0x00]);       // left
    text("Printer berhasil terhubung.\n");
    text("Struk siap dicetak.\n");
    push([0x1b, 0x61, 0x01]);       // center
    text("\n" + new Date().toLocaleString("id-ID") + "\n");
    push([0x0a, 0x0a, 0x0a]);       // feed
    push([0x1d, 0x56, 0x42, 0x00]); // partial cut

    return new Uint8Array(bytes);
}

export default function PrinterConnectModal({ isOpen, onClose }) {
    const bt = useBluetoothContext();
    const [testing, setTesting] = useState(false);

    if (!isOpen) return null;

    const status = bt?.status ?? "idle";
    const isConnected = status === "connected";
    const isBusy = status === "connecting" || status === "reconnecting";

    const statusMeta = {
        connected:    { label: "Terhubung",        color: "emerald", icon: <IconBluetoothConnected size={22} /> },
        connecting:   { label: "Menghubungkan...",  color: "amber",   icon: <IconLoader2 size={22} className="animate-spin" /> },
        reconnecting: { label: "Menyambung ulang...",color: "amber",   icon: <IconLoader2 size={22} className="animate-spin" /> },
        error:        { label: "Gagal terhubung",   color: "rose",    icon: <IconBluetoothX size={22} /> },
        idle:         { label: "Belum terhubung",   color: "slate",   icon: <IconBluetooth size={22} /> },
    }[status] ?? { label: "Belum terhubung", color: "slate", icon: <IconBluetooth size={22} /> };

    const colorCls = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        amber:   "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        rose:    "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800",
        slate:   "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    }[statusMeta.color];

    const handleConnect = async () => {
        try {
            await bt.connect();          // memicu device picker browser
        } catch (e) {
            toast.error("Gagal menghubungkan printer");
        }
    };

    const handleTestPrint = async () => {
        setTesting(true);
        try {
            await bt.printBuffer(buildTestReceipt());
            toast.success("Test print terkirim");
        } catch (e) {
            toast.error("Gagal test print. Pastikan printer menyala & terhubung.");
        } finally {
            setTesting(false);
        }
    };

    const handleDisconnect = () => {
        bt.disconnect();
        toast("Printer diputuskan", { icon: "🔌" });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                            <IconPrinter size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Printer Thermal</h3>
                            <p className="text-[10px] text-slate-400 font-medium">Hubungkan printer Bluetooth untuk cetak struk</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                        <IconX size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Tidak support (mis. iOS) */}
                    {!bt?.supported && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                            <IconAlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-800 dark:text-amber-300">
                                <p className="font-bold mb-0.5">Bluetooth tidak didukung</p>
                                <p className="text-xs">Perangkat/browser ini tidak mendukung Web Bluetooth (mis. iPhone/iPad Safari). Gunakan Android atau laptop dengan Chrome/Edge.</p>
                            </div>
                        </div>
                    )}

                    {/* Status card */}
                    <div className={`flex items-center gap-4 p-4 rounded-xl border ${colorCls}`}>
                        <div className="flex-shrink-0">{statusMeta.icon}</div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-sm">{statusMeta.label}</p>
                            {bt?.devName
                                ? <p className="text-xs opacity-80 truncate">{bt.devName}</p>
                                : <p className="text-xs opacity-70">Belum ada printer dipilih</p>}
                        </div>
                        {isConnected && <IconCheck size={20} className="flex-shrink-0" />}
                    </div>

                    {bt?.error && (
                        <p className="text-xs text-rose-500 font-medium">{bt.error}</p>
                    )}

                    {/* Actions */}
                    <div className="space-y-2.5">
                        {!isConnected ? (
                            <button
                                onClick={handleConnect}
                                disabled={!bt?.supported || isBusy}
                                className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-900/20"
                            >
                                {isBusy
                                    ? <><IconLoader2 size={18} className="animate-spin" /> Menghubungkan...</>
                                    : <><IconPlugConnected size={18} /> Hubungkan Printer</>}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleTestPrint}
                                    disabled={testing}
                                    className="w-full h-12 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                                >
                                    {testing
                                        ? <><IconLoader2 size={18} className="animate-spin" /> Mengirim...</>
                                        : <><IconTestPipe size={18} /> Test Print</>}
                                </button>
                                <button
                                    onClick={handleDisconnect}
                                    className="w-full h-11 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-all"
                                >
                                    <IconPlugConnectedX size={18} /> Putuskan Printer
                                </button>
                            </>
                        )}
                    </div>

                    {/* Petunjuk */}
                    <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
                        <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">Cara menghubungkan:</p>
                        <ol className="space-y-0.5 list-decimal list-inside">
                            <li>Nyalakan printer thermal Bluetooth</li>
                            <li>Klik "Hubungkan Printer", pilih perangkat dari daftar</li>
                            <li>Setelah terhubung, klik "Test Print" untuk cek</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
