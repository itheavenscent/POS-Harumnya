import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php",
        "./storage/framework/views/*.php",
        "./resources/views/**/*.blade.php",
        "./resources/js/**/*.jsx",
    ],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    "Inter",
                    "Plus Jakarta Sans",
                    ...defaultTheme.fontFamily.sans,
                ],
                mono: [
                    "JetBrains Mono",
                    "Fira Code",
                    ...defaultTheme.fontFamily.mono,
                ],
            },
            colors: {
                // Primary - Pure Monochrome (Black & White stark contrast)
                primary: {
                    50: "#f8f9fa",
                    100: "#f1f3f5",
                    200: "#e9ecef",
                    300: "#dee2e6",
                    400: "#ced4da",
                    500: "#adb5bd",
                    600: "#868e96",
                    700: "#495057",
                    800: "#343a40",
                    900: "#212529",
                    950: "#000000",
                },
                accent: {
                    50: "#f8f9fa",
                    100: "#f1f3f5",
                    200: "#e9ecef",
                    300: "#dee2e6",
                    400: "#ced4da",
                    500: "#adb5bd",
                    600: "#868e96",
                    700: "#495057",
                    800: "#343a40",
                    900: "#212529",
                    950: "#000000",
                },
                sidebar: {
                    bg: "#000000",
                    surface: "#111111",
                    hover: "#222222",
                    active: "#333333",
                    border: "#333333",
                    muted: "#888888",
                    text: "#eeeeee",
                    heading: "#ffffff",
                },
                // Warna status dikalemkan (desaturated) — lembut, tidak garish
                success: {
                    50: "#f0fdf4",
                    100: "#dcfce7",
                    200: "#bbf7d0",
                    300: "#86efac",
                    400: "#4ade80",
                    500: "#22c55e",
                    600: "#16a34a",
                    700: "#15803d",
                    800: "#166534",
                    900: "#14532d",
                    950: "#052e16",
                },
                warning: {
                    50: "#fffbeb",
                    100: "#fef3c7",
                    200: "#fde68a",
                    300: "#fcd34d",
                    400: "#fbbf24",
                    500: "#f59e0b",
                    600: "#d97706",
                    700: "#b45309",
                    800: "#92400e",
                    900: "#78350f",
                    950: "#451a03",
                },
                danger: {
                    50: "#fff1f2",
                    100: "#ffe4e6",
                    200: "#fecdd3",
                    300: "#fda4af",
                    400: "#fb7185",
                    500: "#f43f5e",
                    600: "#e11d48",
                    700: "#be123c",
                    800: "#9f1239",
                    900: "#881337",
                    950: "#4c0519",
                },
            },
            spacing: {
                18: "4.5rem",
                88: "22rem",
                100: "25rem",
                112: "28rem",
                128: "32rem",
            },
            minHeight: {
                touch: "2.75rem",
                "touch-lg": "3rem",
            },
            minWidth: {
                touch: "2.75rem",
                "touch-lg": "3rem",
            },
            // Sudut lembut membulat — smooth, tidak kaku
            borderRadius: {
                none: "0px",
                sm: "0.375rem",
                DEFAULT: "0.5rem",
                md: "0.625rem",
                lg: "0.75rem",
                xl: "1rem",
                "2xl": "1.25rem",
                "3xl": "1.5rem",
                "4xl": "2rem",
                full: "9999px",
            },
            boxShadow: {
                // Shadow sangat halus (soft blur) — bukan offset keras. Elemen mengambang tetap terbaca.
                glow: "0 1px 3px rgba(15,23,42,0.06)",
                "glow-lg": "0 8px 24px rgba(15,23,42,0.08)",
                "glow-accent": "0 1px 3px rgba(15,23,42,0.06)",
                "inner-lg": "inset 0 1px 2px rgba(15,23,42,0.04)",
                sidebar: "none",
                sm: "0 1px 2px rgba(15,23,42,0.04)",
                DEFAULT: "0 1px 3px rgba(15,23,42,0.05)",
                md: "0 2px 8px rgba(15,23,42,0.06)",
                lg: "0 6px 16px rgba(15,23,42,0.07)",
                xl: "0 10px 28px rgba(15,23,42,0.08)",
                "2xl": "0 16px 40px rgba(15,23,42,0.10)",
            },
            animation: {
                "slide-in": "slideIn 0.2s ease-out",
                "slide-up": "slideUp 0.2s ease-out",
                "fade-in": "fadeIn 0.15s ease-out",
                "pulse-subtle":
                    "pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "bounce-subtle":
                    "bounceSubtle 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "cart-add": "cartAdd 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            },
            keyframes: {
                slideIn: {
                    "0%": { transform: "translateX(100%)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                pulseSubtle: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
                bounceSubtle: {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.05)" },
                    "100%": { transform: "scale(1)" },
                },
                cartAdd: {
                    "0%": { transform: "scale(0.8)", opacity: "0" },
                    "50%": { transform: "scale(1.1)" },
                    "100%": { transform: "scale(1)", opacity: "1" },
                },
            },
            backdropBlur: {
                xs: "2px",
            },
            transitionDuration: {
                250: "250ms",
            },
        },
    },
    plugins: [forms],
};