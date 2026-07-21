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
                // Mute the vivid colors for a simpler look, but keep them bold
                success: {
                    50: "#f3fbd8",
                    100: "#e4f6a5",
                    200: "#d3ed70",
                    300: "#c0de3d",
                    400: "#a9c916",
                    500: "#85a305",
                    600: "#657d00",
                    700: "#4d5f00",
                    800: "#394700",
                    900: "#283200",
                    950: "#141a00",
                },
                warning: {
                    50: "#fff8e1",
                    100: "#ffecb3",
                    200: "#ffe082",
                    300: "#ffd54f",
                    400: "#ffca28",
                    500: "#ffc107",
                    600: "#ffb300",
                    700: "#ffa000",
                    800: "#ff8f00",
                    900: "#ff6f00",
                    950: "#e65100",
                },
                danger: {
                    50: "#ffe3e3",
                    100: "#ffc9c9",
                    200: "#ffa8a8",
                    300: "#ff8787",
                    400: "#ff6b6b",
                    500: "#fa5252",
                    600: "#f03e3e",
                    700: "#e03131",
                    800: "#c92a2a",
                    900: "#b02a2a",
                    950: "#8b1a1a",
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
            // Force square corners across the app (except full/circles)
            borderRadius: {
                none: "0px",
                sm: "0px",
                DEFAULT: "0px",
                md: "0px",
                lg: "0px",
                xl: "0px",
                "2xl": "0px",
                "3xl": "0px",
                "4xl": "0px",
                full: "9999px",
            },
            boxShadow: {
                // Neo-brutalist stark shadows instead of blurry glow
                glow: "4px 4px 0px rgba(0,0,0,1)",
                "glow-lg": "6px 6px 0px rgba(0,0,0,1)",
                "glow-accent": "4px 4px 0px rgba(0,0,0,1)",
                "inner-lg": "inset 0 4px 6px -1px rgb(0 0 0 / 0.15)",
                sidebar: "4px 0 0px rgba(0,0,0,1)",
                sm: "2px 2px 0px rgba(0,0,0,1)",
                DEFAULT: "4px 4px 0px rgba(0,0,0,1)",
                md: "4px 4px 0px rgba(0,0,0,1)",
                lg: "6px 6px 0px rgba(0,0,0,1)",
                xl: "8px 8px 0px rgba(0,0,0,1)",
                "2xl": "12px 12px 0px rgba(0,0,0,1)",
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