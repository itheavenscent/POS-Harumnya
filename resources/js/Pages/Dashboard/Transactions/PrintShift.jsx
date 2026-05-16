import React, { useEffect, useState, useRef, useCallback } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    IconArrowLeft, IconPrinter, IconBluetooth, IconBluetoothOff,
    IconBluetoothConnected, IconLoader2, IconAlertCircle, IconCheck
} from "@tabler/icons-react";

// ═════════════════════════════════════════════════════════════════════════════
// ESC/POS Builder
// ═════════════════════════════════════════════════════════════════════════════
class EscPos {
    constructor() { this.buf = []; }
    raw(bytes) { this.buf.push(...bytes); return this; }
    lf(n = 1) { for (let i = 0; i < n; i++) this.buf.push(0x0A); return this; }
    text(str) {
        for (const ch of String(str)) {
            const code = ch.charCodeAt(0);
            this.buf.push(code < 0x80 ? code : 0x3F);
        }
        return this;
    }
    init() { return this.raw([0x1B, 0x40]); }
    cut() { return this.raw([0x1D, 0x56, 0x41, 0x10]); }
    bold(on) { return this.raw([0x1B, 0x45, on ? 1 : 0]); }
    align(a) { return this.raw([0x1B, 0x61, a]); }
    size(w, h) { return this.raw([0x1D, 0x21, (((w - 1) & 7) << 4) | ((h - 1) & 7)]); }
    lineSpacing(n) { return this.raw([0x1B, 0x33, n]); }
    defaultSpacing() { return this.raw([0x1B, 0x32]); }
    divider(w = 32) { return this.text("=".repeat(w)); }
    thinLine(w = 32) { return this.text("-".repeat(w)); }
    center(str, w = 32) {
        const s = String(str);
        const p = Math.max(0, Math.floor((w - s.length) / 2));
        return this.text(" ".repeat(p) + s);
    }
    row2(left, right, w = 32) {
        const l = String(left);
        const r = String(right);
        const gap = Math.max(1, w - l.length - r.length);
        return this.text(l + " ".repeat(gap) + r);
    }
    toBuffer() { return new Uint8Array(this.buf).buffer; }
}

// ═════════════════════════════════════════════════════════════════════════════
// Constants
// ═════════════════════════════════════════════════════════════════════════════
const BT_SERVICES = [
    "000018f0-0000-1000-8000-00805f9b34fb",
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    "0000ff00-0000-1000-8000-00805f9b34fb",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
    "0000fff0-0000-1000-8000-00805f9b34fb",
    "00001101-0000-1000-8000-00805f9b34fb",
    "0000fef5-0000-1000-8000-00805f9b34fb",
    "0000fee7-0000-1000-8000-00805f9b34fb",
];

// ═════════════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════════════
const fmt = (number) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR",
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(number);

const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    return (
        d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) +
        " " +
        d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
};

// ═════════════════════════════════════════════════════════════════════════════
// Bluetooth helpers
// ═════════════════════════════════════════════════════════════════════════════
async function findWritableChar(server) {
    await new Promise(r => setTimeout(r, 400));
    try {
        const services = await server.getPrimaryServices();
        for (const svc of services) {
            try {
                await new Promise(r => setTimeout(r, 80));
                const chars = await svc.getCharacteristics();
                const char = chars.find(c => c.properties.writeWithoutResponse || c.properties.write);
                if (char) return char;
            } catch (_) { }
        }
    } catch (_) { }
    for (const uuid of BT_SERVICES) {
        try {
            const svc = await server.getPrimaryService(uuid);
            await new Promise(r => setTimeout(r, 100));
            const chars = await svc.getCharacteristics();
            const char = chars.find(c => c.properties.writeWithoutResponse || c.properties.write);
            if (char) return char;
        } catch (_) { }
    }
    return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// useBluetooth — FIXED: TDZ (Cannot access 'p' before initialization)
//
// Root cause: useEffect had connectGatt + handleDisconnect in its dep array,
// but both were declared with useCallback *after* useEffect — bundler sees
// the let/const bindings in TDZ when the module first evaluates.
//
// Fix: define connectGatt first → sync to a stable ref (connectGattRef) →
// handleDisconnect uses the ref instead of the value → useEffect placed last,
// only depends on [supported, handleDisconnect].
// ═════════════════════════════════════════════════════════════════════════════
function useBluetooth() {
    const supported = typeof navigator !== "undefined" && !!navigator.bluetooth;

    const [device, setDevice] = useState(null);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);
    const [devName, setDevName] = useState(() => {
        try { return localStorage.getItem("bt_printer_name") || null; } catch (_) { return null; }
    });

    const charRef = useRef(null);
    const deviceRef = useRef(null);
    // Stable ref — lets handleDisconnect call connectGatt without a circular dep
    const connectGattRef = useRef(null);

    // ── 1. connectGatt — DEFINED FIRST ───────────────────────────────────────
    const connectGatt = useCallback(async (dev) => {
        if (dev.gatt.connected && charRef.current) return true;
        const server = await dev.gatt.connect();
        await new Promise(r => setTimeout(r, 500));
        const char = await findWritableChar(server);
        if (!char) {
            throw new Error(
                "Printer tidak merespon. Matikan & nyalakan printer, lalu coba lagi."
            );
        }
        charRef.current = char;
        return true;
    }, []); // no deps — only touches refs and the `dev` argument

    // Keep ref in sync on every render
    connectGattRef.current = connectGatt;

    // ── 2. handleDisconnect — DEFINED AFTER connectGatt ──────────────────────
    const handleDisconnect = useCallback(async (dev) => {
        charRef.current = null;
        if (deviceRef.current && deviceRef.current.id === dev.id) {
            setStatus("reconnecting");
            let retries = 5;
            while (retries-- > 0) {
                await new Promise(r => setTimeout(r, 1500));
                try {
                    if (!deviceRef.current?.gatt?.connected) {
                        await connectGattRef.current(dev); // ← ref, no circular dep
                    }
                    setStatus("connected");
                    return;
                } catch (_) { }
            }
        }
        setStatus("idle");
    }, []); // no deps — uses only refs

    // ── 3. useEffect — DEFINED AFTER both callbacks ───────────────────────────
    useEffect(() => {
        if (supported && navigator.bluetooth.getDevices) {
            navigator.bluetooth.getDevices().then(devices => {
                if (devices.length === 0) return;

                const lastId = localStorage.getItem("bt_printer_id");
                const dev = devices.find(d => d.id === lastId) || devices[0];

                deviceRef.current = dev;
                setDevice(dev);
                setDevName(dev.name || "Printer BT");

                dev.addEventListener("gattserverdisconnected", () => handleDisconnect(dev));

                if (lastId && dev) {
                    setStatus("connecting");
                    connectGattRef.current(dev) // ← ref, not dep
                        .then(() => setStatus("connected"))
                        .catch(err => {
                            console.error("Auto-connect failed:", err);
                            setStatus("idle");
                        });
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supported, handleDisconnect]);
    // connectGatt intentionally omitted — accessed via stable connectGattRef

    // ── connect ───────────────────────────────────────────────────────────────
    const connect = useCallback(async () => {
        if (!supported) {
            setError("Butuh Chrome di Android/Desktop + HTTPS untuk Web Bluetooth.");
            setStatus("error");
            return;
        }
        setStatus("connecting");
        setError(null);
        try {
            const dev = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: BT_SERVICES,
            });
            dev.addEventListener("gattserverdisconnected", () => handleDisconnect(dev));
            await connectGattRef.current(dev);
            deviceRef.current = dev;
            setDevice(dev);
            setDevName(dev.name || "Printer BT");
            try {
                localStorage.setItem("bt_printer_name", dev.name || "Printer BT");
                localStorage.setItem("bt_printer_id", dev.id);
            } catch (_) { }
            setStatus("connected");
        } catch (err) {
            if (err.name === "NotFoundError") setStatus("idle");
            else { setError(err.message); setStatus("error"); }
        }
    }, [supported, handleDisconnect]);

    // ── reconnect ─────────────────────────────────────────────────────────────
    const reconnect = useCallback(async () => {
        if (!deviceRef.current) { connect(); return; }
        setStatus("connecting");
        setError(null);
        try {
            await connectGattRef.current(deviceRef.current);
            setStatus("connected");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    }, [connect]);

    // ── disconnect ────────────────────────────────────────────────────────────
    const disconnect = useCallback(() => {
        charRef.current = null;
        deviceRef.current = null;
        device?.gatt?.disconnect();
        setDevice(null);
        setStatus("idle");
    }, [device]);

    // ── printBuffer ───────────────────────────────────────────────────────────
    const printBuffer = useCallback(async (buffer) => {
        if (!charRef.current || !deviceRef.current?.gatt?.connected) {
            if (deviceRef.current) await connectGattRef.current(deviceRef.current);
            else throw new Error("Printer belum terhubung. Tap 'Hubungkan' dulu.");
        }
        const data = new Uint8Array(buffer);
        const CHUNK = 512;
        for (let i = 0; i < data.length; i += CHUNK) {
            const chunk = data.slice(i, i + CHUNK);
            try {
                if (charRef.current.properties.writeWithoutResponse)
                    await charRef.current.writeValueWithoutResponse(chunk);
                else
                    await charRef.current.writeValue(chunk);
            } catch (_) {
                await connectGattRef.current(deviceRef.current);
                if (charRef.current.properties.writeWithoutResponse)
                    await charRef.current.writeValueWithoutResponse(chunk);
                else
                    await charRef.current.writeValue(chunk);
            }
            await new Promise(r => setTimeout(r, 40));
        }
    }, []); // no deps — uses only refs

    return { supported, device, devName, status, error, connect, reconnect, disconnect, printBuffer };
}

// ═════════════════════════════════════════════════════════════════════════════
// ESC/POS receipt builder
// ═════════════════════════════════════════════════════════════════════════════
function buildShiftReceipt(drawer, summary) {
    const W = 32;
    const ep = new EscPos();

    ep.init().lineSpacing(2).lf(2);

    // ══ BRAND ══
    ep.bold(true).center("- HARUMNYA -", W).lf().bold(false);
    ep.bold(true).center(drawer.store?.name ?? "POS", W).lf().bold(false);

    if (drawer.store?.address) {
        const addr = String(drawer.store.address);
        for (let i = 0; i < addr.length; i += W) {
            ep.center(addr.slice(i, i + W).trim(), W).lf();
        }
    }

    ep.divider(W).lf();
    ep.center("LAPORAN REKAP SHIFT", W).lf();
    ep.divider(W).lf();

    // ══ INFO ══
    ep.row2("Kasir", drawer.cashier?.name ?? "-", W).lf();
    ep.row2("Buka", new Date(drawer.opened_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }), W).lf();
    ep.row2("Tutup", drawer.closed_at
        ? new Date(drawer.closed_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
        : "-", W).lf();
    ep.thinLine(W).lf();

    // ══ SUMMARY ══
    ep.row2("Modal Awal", "Rp " + Number(drawer.starting_cash).toLocaleString("id-ID"), W).lf();
    ep.row2("Total Tunai", "Rp " + Number(drawer.total_cash_sales).toLocaleString("id-ID"), W).lf();
    ep.row2("Total Non-Tunai", "Rp " + Number(drawer.total_non_cash_sales).toLocaleString("id-ID"), W).lf();
    ep.thinLine(W).lf();

    // ══ ITEMS ══
    ep.bold(true).text("RINGKASAN ITEM").lf().bold(false);
    summary.items?.forEach((item) => {
        const name = String(item.product_name ?? "Item");
        ep.text(name.slice(0, W)).lf();
        ep.row2(`  ${item.total_qty}x`, "Rp " + Number(item.total_amount).toLocaleString("id-ID"), W).lf();
    });
    ep.thinLine(W).lf();
    
    // ══ CASH IN/OUT ══
    if (summary.cash_transactions?.length > 0) {
        ep.bold(true).text("CASH IN / OUT").lf().bold(false);
        summary.cash_transactions.forEach((tx) => {
            const desc = `${tx.type === 'cash_in' ? '[IN]' : '[OUT]'} ${tx.description}`;
            ep.text(desc.slice(0, W)).lf();
            ep.row2(" ", (tx.type === 'cash_in' ? "" : "-") + "Rp " + Number(tx.amount).toLocaleString("id-ID"), W).lf();
        });
        ep.thinLine(W).lf();
    }

    // ══ PAYMENTS ══
    ep.bold(true).text("METODE PEMBAYARAN").lf().bold(false);
    summary.payments?.forEach((p) => {
        ep.row2(`${p.name} (${p.count}x)`, "Rp " + Number(p.total).toLocaleString("id-ID"), W).lf();
    });
    ep.thinLine(W).lf();

    // ══ TOTALS ══
    ep.row2("Total Penjualan", "Rp " + Number(summary.gross_sales).toLocaleString("id-ID"), W).lf();
    ep.row2("Total Cash In", "Rp " + Number(summary.total_cash_in).toLocaleString("id-ID"), W).lf();
    ep.row2("Total Cash Out", "Rp " + Number(summary.total_cash_out).toLocaleString("id-ID"), W).lf();

    ep.divider(W).lf().lf()
        .center("Terima kasih!", W).lf()
        .center("-- Harumnya --", W).lf()
        .lf(6).defaultSpacing().cut();

    return ep.toBuffer();
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════════════════════════════════
export default function PrintShift({ drawer, summary }) {
    const [printing, setPrinting] = useState(false);
    const [printMsg, setPrintMsg] = useState(null);
    const bt = useBluetooth();

    useEffect(() => {
        const timer = setTimeout(() => { window.print(); }, 800);
        return () => clearTimeout(timer);
    }, []);

    const handleBtPrint = async () => {
        setPrinting(true);
        setPrintMsg(null);
        try {
            if (bt.status !== "connected") {
                setPrintMsg({ ok: true, text: "Menghubungkan ke printer..." });
                if (bt.devName) await bt.reconnect();
                else await bt.connect();
                await new Promise(r => setTimeout(r, 1000));
            }
            const buf = buildShiftReceipt(drawer, summary);
            await bt.printBuffer(buf);
            setPrintMsg({ ok: true, text: "Berhasil dikirim ke printer!" });
        } catch (err) {
            setPrintMsg({ ok: false, text: err.message });
        } finally {
            setPrinting(false);
        }
    };

    const BT_UI = {
        idle: { icon: <IconBluetooth size={15} />, label: bt.devName ? `Hubungkan Ulang (${bt.devName})` : "Hubungkan Printer BT", cls: "bg-blue-500 hover:bg-blue-600 text-white" },
        connecting: { icon: <IconLoader2 size={15} className="animate-spin" />, label: "Menghubungkan...", cls: "bg-blue-400 text-white cursor-wait" },
        reconnecting: { icon: <IconLoader2 size={15} className="animate-spin" />, label: "Menyambung ulang...", cls: "bg-amber-400 text-white cursor-wait" },
        connected: { icon: <IconBluetoothConnected size={15} />, label: bt.device?.name ?? bt.devName ?? "Terhubung", cls: "bg-emerald-500 hover:bg-emerald-600 text-white" },
        error: { icon: <IconBluetoothOff size={15} />, label: "Gagal — Coba Lagi", cls: "bg-red-500 hover:bg-red-600 text-white" },
    }[bt.status] ?? { icon: <IconBluetooth size={15} />, label: "Hubungkan", cls: "bg-blue-500 hover:bg-blue-600 text-white" };

    const btOnClick = bt.status === "connected" ? bt.disconnect
        : bt.status === "idle" && bt.devName ? bt.reconnect
            : bt.connect;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
            <Head title="Cetak Rekap Shift" />

            <style>{`
                @media print {
                    body * { visibility:hidden !important; }
                    #print-area, #print-area * { visibility:visible !important; }
                    #print-area { position:fixed; inset:0; display:flex; justify-content:center; }
                    .no-print { display:none !important; }
                }
            `}</style>

            {/* ── Sticky Top Bar ── */}
            <div className="no-print sticky top-0 z-10 bg-white/80 backdrop-blur-md dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-2xl mx-auto px-4 py-3 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Link href={route("cash-drawers.index")}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <IconArrowLeft size={15} /> Kembali
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => window.print()} title="Cetak via browser"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700">
                                <IconPrinter size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {bt.status !== "connected" && bt.supported && (
                            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                <span className="text-base leading-none mt-0.5">📋</span>
                                <div className="space-y-0.5">
                                    <p className="font-semibold">Sebelum connect, pastikan sudah pairing dulu:</p>
                                    <p>1. Buka <strong>Pengaturan → Bluetooth</strong> di tablet/HP</p>
                                    <p>2. Cari nama printer → Tap <strong>Pasangkan</strong></p>
                                    <p>3. Masukkan PIN: <strong>0000</strong> atau <strong>1234</strong></p>
                                    <p>4. Kembali ke sini → tap <strong>Hubungkan Printer BT</strong></p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={btOnClick}
                                disabled={bt.status === "connecting" || bt.status === "reconnecting"}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${BT_UI.cls}`}>
                                {BT_UI.icon} {BT_UI.label}
                            </button>
                            {bt.status === "connected" && (
                                <button onClick={handleBtPrint} disabled={printing}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white disabled:opacity-60">
                                    {printing
                                        ? <><IconLoader2 size={14} className="animate-spin" /> Mengirim...</>
                                        : <><IconPrinter size={14} /> Cetak Bluetooth</>}
                                </button>
                            )}
                            {bt.error && (
                                <div className="flex flex-col gap-1 w-full">
                                    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                                        <IconAlertCircle size={13} /> {bt.error}
                                    </span>
                                </div>
                            )}
                            {printMsg && (
                                <span className={`text-xs px-3 py-1.5 rounded-lg ${printMsg.ok ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
                                    {printMsg.ok ? "✓" : "✗"} {printMsg.text}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Receipt Preview ── */}
            <div className="flex justify-center py-8 print:py-0 bg-slate-50 dark:bg-slate-900/50">
                <div id="print-area" className="w-[80mm] bg-white dark:bg-slate-900 p-6 print:pt-10 print:pb-10 text-[11px] font-sans text-slate-800 dark:text-slate-200 mx-auto shadow-xl border border-slate-100 dark:border-slate-800 rounded-2xl print:shadow-none print:border-none print:rounded-none">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-xl">🏪</span>
                        </div>
                        <h1 className="font-black text-sm mb-1 uppercase tracking-wider text-slate-900 dark:text-white">
                            {drawer.store?.name || "TOKO HARUMNYA"}
                        </h1>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{drawer.store?.address}</p>
                        <div className="mt-3 inline-block bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            Laporan Rekap Shift
                        </div>
                    </div>

                    <div className="mb-4 space-y-1 text-slate-600 dark:text-slate-400">
                        <div className="flex justify-between"><span>Kasir:</span> <span className="font-semibold text-slate-800 dark:text-white">{drawer.cashier?.name}</span></div>
                        <div className="flex justify-between"><span>Buka:</span>  <span>{formatDate(drawer.opened_at)}</span></div>
                        <div className="flex justify-between"><span>Tutup:</span> <span>{formatDate(drawer.closed_at)}</span></div>
                    </div>

                    <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-700 py-3 mb-4 space-y-1.5">
                        <div className="flex justify-between"><span>Modal Awal:</span>      <span className="font-semibold">{fmt(drawer.starting_cash)}</span></div>
                        <div className="flex justify-between"><span>Total Tunai:</span>     <span className="font-semibold text-emerald-600">{fmt(drawer.total_cash_sales)}</span></div>
                        <div className="flex justify-between"><span>Total Non-Tunai:</span> <span className="font-semibold text-blue-600">{fmt(drawer.total_non_cash_sales)}</span></div>
                    </div>

                    {/* Items Summary */}
                    <div className="mb-4">
                        <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Ringkasan Item</p>
                        <div className="space-y-2">
                            {summary.items?.map((item, i) => (
                                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{item.product_name}</span>
                                        <span className="text-slate-500 font-medium text-[10px]">×{item.total_qty}</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                                        <span className="truncate max-w-[120px]">{item.variant_name}</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{fmt(item.total_amount)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cash Transactions */}
                    {summary.cash_transactions?.length > 0 && (
                        <div className="mb-4">
                            <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Cash In / Out</p>
                            <div className="space-y-1">
                                {summary.cash_transactions.map((tr, i) => (
                                    <div key={i} className="flex justify-between text-[10px] bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            <span className={`font-bold ${tr.type === "cash_in" ? "text-emerald-600" : "text-red-500"}`}>
                                                {tr.type === "cash_in" ? "[IN]" : "[OUT]"}
                                            </span>{" "}
                                            {tr.description}
                                        </span>
                                        <span className={`font-semibold ${tr.type === "cash_in" ? "text-emerald-600" : "text-red-500"}`}>
                                            {tr.type === "cash_in" ? "" : "-"}{fmt(tr.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payments Breakdown */}
                    <div className="mb-4">
                        <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mb-2">Metode Pembayaran</p>
                        <div className="space-y-1">
                            {summary.payments?.map((pm, i) => (
                                <div key={i} className="flex justify-between text-[10px] p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {pm.name} <span className="text-slate-400">({pm.count}x)</span>
                                    </span>
                                    <span className="font-semibold text-slate-800 dark:text-white">{fmt(pm.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 pt-3 mb-4 space-y-1.5">
                        <div className="flex justify-between text-slate-800 dark:text-white font-bold"><span>Total Penjualan:</span> <span>{fmt(summary.gross_sales)}</span></div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Total Cash In:</span>     <span className="text-emerald-600">+{fmt(summary.total_cash_in)}</span></div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>Total Cash Out:</span>    <span className="text-red-500">-{fmt(summary.total_cash_out)}</span></div>
                    </div>

                    {drawer.notes && (
                        <div className="mb-4 text-[9px] italic bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-2 rounded-lg">
                            <p><strong>Catatan:</strong> {drawer.notes}</p>
                        </div>
                    )}

                    <div className="text-center mt-6 text-[9px] text-slate-400">
                        <p>Dicetak: {formatDate(new Date())}</p>
                        <p className="mt-1 font-bold tracking-wider text-slate-500">*** HARUMNYA POS ***</p>
                    </div>
                </div>
            </div>

            {/* Floating Bluetooth Buttons */}
            <div className="no-print fixed bottom-20 right-4 flex flex-col gap-2 z-20">
                <button onClick={btOnClick}
                    disabled={bt.status === "connecting" || bt.status === "reconnecting"}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${BT_UI.cls} shadow-lg`}>
                    {BT_UI.icon} {BT_UI.label}
                </button>
                {bt.status === "connected" && (
                    <button onClick={handleBtPrint} disabled={printing}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white disabled:opacity-60 shadow-lg">
                        {printing
                            ? <><IconLoader2 size={14} className="animate-spin" /> Mengirim...</>
                            : <><IconPrinter size={14} /> Cetak Bluetooth</>}
                    </button>
                )}
                {printMsg && (
                    <span className={`text-xs px-3 py-1.5 rounded-lg ${printMsg.ok ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"} shadow-sm`}>
                        {printMsg.ok ? "✓" : "✗"} {printMsg.text}
                    </span>
                )}
            </div>
        </div>
    );
}
