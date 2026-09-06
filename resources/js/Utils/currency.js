// ─── Money helpers — format Indonesia (titik ribuan, koma desimal) ─────────────
// Nominal SELALU 2 desimal: 4000 -> "4.000,00" · 4500.59 -> "4.500,59" · 40000.3 -> "40.000,30"

export const formatRupiah = (value, { withSymbol = true } = {}) => {
    const num = parseFloat(value) || 0;
    const formatted = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
    return withSymbol ? `Rp ${formatted}` : formatted;
};

// Kuantitas stok — bilangan bulat, tanpa desimal (pcs/ml/gr).
export const formatQty = (value) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
        parseInt(value ?? 0, 10) || 0
    );

// String tampilan (tanpa "Rp"), dipakai di dalam <input> — kosong kalau 0/kosong.
// Saat ada nilai, tampilkan 2 desimal penuh (mis. "40.000,00").
export const displayDecimal = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return "";
    return num.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Parse input Indonesia ("4.500,59") -> string angka murni "4500.59" (2 desimal, siap dikirim ke backend).
export const parseDecimal = (str) => {
    const cleaned = String(str).replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? "0" : num.toFixed(2);
};
