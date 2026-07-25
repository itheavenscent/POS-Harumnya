import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

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

// Simpan service+characteristic yang berhasil agar reconnect langsung nembak
// tanpa scan ulang seluruh service (jauh lebih cepat).
function cacheChar(svc, char) {
    try {
        localStorage.setItem("bt_printer_svc", svc.uuid);
        localStorage.setItem("bt_printer_char", char.uuid);
    } catch (_) { }
}

async function findWritableChar(server) {
    // 1. Fast-path: pakai service+char yang sudah pernah berhasil (paling cepat).
    try {
        const cs = localStorage.getItem("bt_printer_svc");
        const cc = localStorage.getItem("bt_printer_char");
        if (cs && cc) {
            const svc = await server.getPrimaryService(cs);
            const chars = await svc.getCharacteristics();
            const hit = chars.find(c => c.uuid === cc)
                ?? chars.find(c => c.properties.writeWithoutResponse || c.properties.write);
            if (hit) { cacheChar(svc, hit); return hit; }
        }
    } catch (_) { }

    // 2. Parallel: coba semua UUID printer thermal secara paralel (JAUH lebih cepat
    //    dari sequential for-loop, karena service yang tidak ada langsung reject
    //    tanpa menunggu timeout satu per satu).
    try {
        const results = await Promise.allSettled(
            BT_SERVICES.map(async (uuid) => {
                const svc = await server.getPrimaryService(uuid);
                const chars = await svc.getCharacteristics();
                const char = chars.find(c => c.properties.writeWithoutResponse || c.properties.write);
                if (!char) throw new Error("no writable char");
                return { svc, char };
            })
        );
        const fulfilled = results.find(r => r.status === "fulfilled");
        if (fulfilled) {
            cacheChar(fulfilled.value.svc, fulfilled.value.char);
            return fulfilled.value.char;
        }
    } catch (_) { }

    // 3. Fallback: enumerasi semua service (untuk printer non-standar).
    try {
        const services = await server.getPrimaryServices();
        for (const svc of services) {
            try {
                const chars = await svc.getCharacteristics();
                const char = chars.find(c => c.properties.writeWithoutResponse || c.properties.write);
                if (char) { cacheChar(svc, char); return char; }
            } catch (_) { }
        }
    } catch (_) { }
    return null;
}

const BluetoothContext = createContext(null);

export function BluetoothProvider({ children }) {
    const supported = typeof navigator !== "undefined" && !!navigator.bluetooth;

    const [device, setDevice] = useState(null);
    const [status, setStatus] = useState("idle"); // idle, connecting, connected, reconnecting, error
    const [error, setError] = useState(null);
    const [foundUuids, setFoundUuids] = useState([]);
    const [devName, setDevName] = useState(() => {
        try { return localStorage.getItem("bt_printer_name") || null; } catch (_) { return null; }
    });

    const charRef = useRef(null);
    const deviceRef = useRef(null);
    const connectGattRef = useRef(null);

    const connectGatt = useCallback(async (dev) => {
        if (dev.gatt.connected && charRef.current) return true;
        const server = await dev.gatt.connect();
        // Settle singkat setelah GATT connect — dipangkas menjadi 80ms
        // (cukup untuk printer BLE murah, sisanya ditangani retry).
        await new Promise(r => setTimeout(r, 80));
        const char = await findWritableChar(server);
        if (!char) {
            let hint = "";
            try {
                const svcs = await server.getPrimaryServices();
                hint = " | Services: " + svcs.map(s => s.uuid.slice(4, 8)).join(", ");
            } catch (_) { }
            throw new Error(
                "Printer tidak merespon" + hint +
                ". Matikan & nyalakan printer, lalu coba lagi."
            );
        }
        charRef.current = char;
        return true;
    }, []);

    connectGattRef.current = connectGatt;

    const handleDisconnect = useCallback(async (dev) => {
        charRef.current = null;
        if (deviceRef.current && deviceRef.current.id === dev.id) {
            setStatus("reconnecting");
            let retries = 5;
            while (retries-- > 0) {
                await new Promise(r => setTimeout(r, 1500));
                try {
                    if (!deviceRef.current?.gatt?.connected) {
                        await connectGattRef.current(dev);
                    }
                    setStatus("connected");
                    return;
                } catch (_) { }
            }
        }
        setStatus("idle");
    }, []);

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
                    connectGattRef.current(dev)
                        .then(() => setStatus("connected"))
                        .catch(err => {
                            console.error("Auto-connect failed:", err);
                            setStatus("idle");
                        });
                }
            });
        }
    }, [supported, handleDisconnect]);

    // ── requestDevice helper ─────────────────────────────────────────────────
    // Strategi:
    //   • scanAll=false (default): pakai filters agar HANYA printer yang muncul
    //     → dialog jauh lebih cepat, tidak scan HP/earphone/TV sekitar
    //   • scanAll=true: fallback klasik acceptAllDevices jika printer tidak
    //     ketemu via filter (printer murah kadang tidak advertise service UUID)
    const requestPrinterDevice = useCallback(async (scanAll = false) => {
        if (scanAll) {
            return navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: BT_SERVICES,
            });
        }
        // Filtered mode: hanya tampilkan device yang advertise service printer
        return navigator.bluetooth.requestDevice({
            filters: BT_SERVICES.map(uuid => ({ services: [uuid] })),
            optionalServices: BT_SERVICES,
        });
    }, []);

    const connect = useCallback(async (scanAll = false) => {
        if (!supported) {
            setError("Butuh Chrome di Android/Desktop + HTTPS untuk Web Bluetooth.");
            setStatus("error");
            return;
        }
        setStatus("connecting");
        setError(null);
        try {
            const dev = await requestPrinterDevice(scanAll);
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
    }, [supported, handleDisconnect, requestPrinterDevice]);

    // connectAll: shortcut untuk scan semua device (fallback)
    const connectAll = useCallback(() => connect(true), [connect]);

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

    const disconnect = useCallback(() => {
        charRef.current = null;
        deviceRef.current = null;
        device?.gatt?.disconnect();
        setDevice(null);
        setStatus("idle");
    }, [device]);

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
    }, []);

    const scanUuids = useCallback(async () => {
        if (!supported) return;
        setError(null);
        try {
            const dev = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: BT_SERVICES,
            });
            const server = await dev.gatt.connect();
            await new Promise(r => setTimeout(r, 500));
            const svcs = await server.getPrimaryServices();
            const result = [];
            for (const svc of svcs) {
                try {
                    const chars = await svc.getCharacteristics();
                    const writableChar = chars.find(c => c.properties.writeWithoutResponse || c.properties.write);
                    const flag = writableChar ? " ✓ WRITABLE" : "";
                    result.push(svc.uuid + flag);
                    if (writableChar && !charRef.current) {
                        dev.addEventListener("gattserverdisconnected", () => handleDisconnect(dev));
                        charRef.current = writableChar;
                        deviceRef.current = dev;
                        setDevice(dev);
                        setDevName(dev.name || "Printer BT");
                        setStatus("connected");
                        try { localStorage.setItem("bt_printer_name", dev.name || "Printer BT"); } catch (_) { }
                    }
                } catch (_) {
                    result.push(svc.uuid + " (char error)");
                }
            }
            setFoundUuids(result);
            if (result.length === 0)
                setError("Tidak ada service ditemukan. Printer mungkin belum di-pair.");
        } catch (err) {
            if (err.name !== "NotFoundError") setError(err.message);
        }
    }, [supported, handleDisconnect]);

    const value = {
        supported, device, devName, status, error,
        connect, connectAll, reconnect, disconnect, printBuffer, scanUuids, foundUuids,
    };

    return (
        <BluetoothContext.Provider value={value}>
            {children}
        </BluetoothContext.Provider>
    );
}

export function useBluetoothContext() {
    return useContext(BluetoothContext);
}
