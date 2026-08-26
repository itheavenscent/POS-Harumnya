import React, { useState, useEffect } from "react";
import { displayDecimal, parseDecimal } from "@/Utils/currency";

/**
 * Input nominal dengan dukungan 2 angka desimal (format Indonesia: 4.500,59).
 * `value`/`onChange` bekerja dengan string angka murni ("4500.59"), siap dikirim ke backend.
 */
export default function MoneyInput({ value, onChange, placeholder = "0", className = "", disabled = false }) {
    const [display, setDisplay] = useState(displayDecimal(value));

    useEffect(() => {
        setDisplay(displayDecimal(value));
    }, [value]);

    const handleChange = (e) => {
        const raw = e.target.value.replace(/[^\d.,]/g, "");
        setDisplay(raw);
    };

    const handleBlur = () => {
        const parsed = parseDecimal(display);
        const num = parseFloat(parsed);
        setDisplay(num === 0 ? "" : num.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
        onChange(parsed);
    };

    return (
        <input
            type="text"
            inputMode="decimal"
            value={display}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`rounded-xl border-slate-200 dark:bg-slate-900 text-sm ${className}`}
        />
    );
}
