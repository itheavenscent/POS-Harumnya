// ─── Money helpers — format Indonesia (titik ribuan, koma desimal) ─────────────
// Contoh: 4500.59 -> "4.500,59" · 1340050 -> "1.340.050" (desimal disembunyikan kalau 0)

export const formatRupiah = (value, { withSymbol = true } = {}) => {
    const num = parseFloat(value) || 0;
    const formatted = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num);
    return withSymbol ? `Rp ${formatted}` : formatted;
};

// String tampilan (tanpa "Rp"), dipakai di dalam <input> — kosong kalau 0/kosong.
export const displayDecimal = (val) => {
    if (val === "" || val === null || val === undefined) return "";
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) return "";
    return num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Parse input Indonesia ("4.500,59") -> string angka murni "4500.59" (2 desimal, siap dikirim ke backend).
export const parseDecimal = (str) => {
    const cleaned = String(str).replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? "0" : num.toFixed(2);
};
