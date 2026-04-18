import React, { useState } from "react";
import { usePage } from "@inertiajs/react";
import { IconX, IconChevronDown, IconChevronRight, IconMenu2 } from "@tabler/icons-react";
import LinkItem from "@/Components/Dashboard/LinkItem";
import LinkItemDropdown from "@/Components/Dashboard/LinkItemDropdown";
import Menu from "@/Utils/Menu";

/*
 * Light mode : warna teal dari Login.jsx
 * Dark mode  : warna navy-slate dari screenshot konten
 *   bg utama   : #0f172a  (slate-950)
 *   bg card    : #1e293b  (slate-800)
 *   border     : #334155  (slate-700)
 *   teks       : #f1f5f9  (slate-100)
 *   teks muted : #94a3b8  (slate-400)
 *   aksen      : #56B8C3  (teal — tetap sama agar konsisten)
 */

export default function Sidebar({ sidebarOpen, onClose }) {
    const { auth } = usePage().props;
    const menuNavigation = Menu();
    const [openSections, setOpenSections] = useState({});
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleSection = (index) =>
        setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));

    const closeMobile = () => {
        setMobileOpen(false);
        if (onClose) onClose();
    };

    const renderContent = (isMobile = false) => {
        const expanded = isMobile || sidebarOpen;

        return (
            <div className="
                flex flex-col h-full w-full relative overflow-hidden
                bg-white            dark:bg-slate-950
                border-r
                border-[#D5EFF1]    dark:border-slate-800
                transition-colors duration-300
            ">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
                    .sb-wrap { font-family: 'Plus Jakarta Sans', sans-serif; }

                    /* Scrollbar */
                    .sb-scroll::-webkit-scrollbar { width: 3px; }
                    .sb-scroll::-webkit-scrollbar-track { background: transparent; }
                    .sb-scroll::-webkit-scrollbar-thumb { background: #B8E8ED; border-radius: 10px; }
                    .dark .sb-scroll::-webkit-scrollbar-thumb { background: #334155; }

                    /* Section label hover */
                    .sb-sec-btn:hover .sb-sec-lbl { color: #3A9DAA !important; }
                    .dark .sb-sec-btn:hover .sb-sec-lbl { color: #56B8C3 !important; }
                    .sb-sec-btn:hover .sb-sec-chev { color: #56B8C3 !important; }
                    .dark .sb-sec-btn:hover .sb-sec-chev { color: #56B8C3 !important; }

                    /* ── Active link expanded ── */
                    a[data-active="true"].sb-link-exp {
                        color: #1A6B77 !important;
                        background: #E4F6F8 !important;
                        border-left-color: #56B8C3 !important;
                        font-weight: 700 !important;
                    }
                    .dark a[data-active="true"].sb-link-exp {
                        color: #f1f5f9 !important;
                        background: rgba(86,184,195,0.12) !important;
                        border-left-color: #56B8C3 !important;
                        font-weight: 700 !important;
                    }
                    a[data-active="true"].sb-link-exp .sb-icon {
                        background: linear-gradient(135deg, #56B8C3 0%, #3A9DAA 100%) !important;
                        box-shadow: 0 3px 10px rgba(86,184,195,0.4) !important;
                        color: #fff !important;
                    }
                    .dark a[data-active="true"].sb-link-exp .sb-icon {
                        background: linear-gradient(135deg, #56B8C3 0%, #3A9DAA 100%) !important;
                        box-shadow: 0 3px 10px rgba(86,184,195,0.3) !important;
                        color: #fff !important;
                    }

                    /* ── Inactive link expanded ── */
                    a[data-active="false"].sb-link-exp {
                        color: #5A8A90 !important;
                        background: transparent !important;
                        border-left-color: transparent !important;
                    }
                    .dark a[data-active="false"].sb-link-exp {
                        color: #94a3b8 !important;
                        background: transparent !important;
                        border-left-color: transparent !important;
                    }
                    a[data-active="false"].sb-link-exp .sb-icon { background: transparent !important; color: #56B8C3 !important; box-shadow: none !important; }
                    .dark a[data-active="false"].sb-link-exp .sb-icon { background: transparent !important; color: #475569 !important; box-shadow: none !important; }
                    a[data-active="false"].sb-link-exp:hover { background: #F0FAFB !important; color: #3A9DAA !important; }
                    .dark a[data-active="false"].sb-link-exp:hover { background: #1e293b !important; color: #f1f5f9 !important; }

                    /* ── Active link collapsed ── */
                    a[data-active="true"].sb-link-col {
                        background: linear-gradient(135deg, #56B8C3 0%, #3A9DAA 100%) !important;
                        color: #fff !important;
                        box-shadow: 0 3px 12px rgba(86,184,195,0.45) !important;
                    }
                    .dark a[data-active="true"].sb-link-col {
                        background: linear-gradient(135deg, #56B8C3 0%, #3A9DAA 100%) !important;
                        color: #fff !important;
                        box-shadow: 0 3px 12px rgba(86,184,195,0.3) !important;
                    }

                    /* ── Inactive link collapsed ── */
                    a[data-active="false"].sb-link-col {
                        background: transparent !important; color: #A0C4C8 !important; box-shadow: none !important;
                    }
                    .dark a[data-active="false"].sb-link-col { background: transparent !important; color: #475569 !important; box-shadow: none !important; }
                    a[data-active="false"].sb-link-col:hover { background: #F0FAFB !important; color: #3A9DAA !important; }
                    .dark a[data-active="false"].sb-link-col:hover { background: #1e293b !important; color: #94a3b8 !important; }

                    @keyframes sbPulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50%      { transform: scale(0.7); opacity: 0.4; }
                    }
                `}</style>

                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-[3px] z-10
                    bg-gradient-to-r from-[#0D3339] via-[#56B8C3] to-[#82CDD6]
                    dark:bg-gradient-to-r dark:from-slate-900 dark:via-[#56B8C3] dark:to-slate-900" />

                <div className="sb-wrap relative z-10 flex flex-col h-full pt-[3px]">

                    {/* ── Logo ── */}
                    <div className="
                        flex-shrink-0 flex items-center justify-between
                        px-3.5 h-16
                        bg-white            dark:bg-slate-900
                        border-b
                        border-[#E0F0F2]    dark:border-slate-800
                        transition-colors duration-300
                    ">
                        <a href="/" className="flex items-center gap-3 no-underline">
                            <div className="w-[38px] h-[38px] rounded-[11px] overflow-hidden flex-shrink-0
                                border-2 border-[rgba(86,184,195,0.3)] dark:border-slate-700"
                                style={{ boxShadow: "0 4px 14px rgba(86,184,195,0.2)" }}>
                                <img src="/Logo.png" alt="Harumnya"
                                    className="w-full h-full object-cover block" />
                            </div>
                            {expanded && (
                                <div>
                                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 21, fontWeight: 700, letterSpacing: -0.3, lineHeight: 1 }}
                                        className="text-[#0D2B30] dark:text-slate-100 transition-colors duration-300">
                                        Harumnya
                                    </div>
                                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}
                                        className="text-[#56B8C3] dark:text-[#56B8C3] mt-[3px]">
                                        Parfum · POS
                                    </div>
                                </div>
                            )}
                        </a>
                        {isMobile && (
                            <button onClick={closeMobile}
                                className="p-1.5 rounded-lg border-none cursor-pointer flex items-center
                                    bg-transparent
                                    text-[#A0C4C8]          dark:text-slate-500
                                    hover:bg-[#F0FAFB]      hover:text-[#3A9DAA]
                                    dark:hover:bg-slate-800 dark:hover:text-slate-300
                                    transition-colors duration-200">
                                <IconX size={18} />
                            </button>
                        )}
                    </div>

                    {/* ── User Card ── */}
                    <div className="
                        flex-shrink-0 m-2.5 mb-1.5 p-3 rounded-[13px]
                        border transition-all duration-300
                        bg-[#F0FAFB]            dark:bg-slate-800/60
                        border-[rgba(86,184,195,0.2)] dark:border-slate-700
                    ">
                        {expanded ? (
                            <div className="flex items-center gap-3">
                                <img
                                    src={auth.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user.name)}&background=56B8C3&color=fff`}
                                    className="w-10 h-10 rounded-full flex-shrink-0
                                        border-2 border-[rgba(86,184,195,0.4)] dark:border-slate-600"
                                    alt={auth.user.name}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold truncate transition-colors duration-300
                                        text-[#0D2B30] dark:text-slate-100">
                                        {auth.user.name}
                                    </p>
                                    <p className="text-[11px] mt-0.5 truncate transition-colors duration-300
                                        text-[#5A8A90] dark:text-slate-400">
                                        {auth.user.email}
                                    </p>
                                    <span className="inline-flex items-center mt-1.5 px-2.5 py-[3px] rounded-full
                                        text-[9px] font-extrabold uppercase tracking-[1px]
                                        bg-[#E4F6F8]    text-[#3A9DAA]
                                        dark:bg-[rgba(86,184,195,0.15)] dark:text-[#56B8C3]
                                        border border-[rgba(86,184,195,0.25)] dark:border-[rgba(86,184,195,0.2)]">
                                        {auth.roles[0] || 'User'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <img
                                    src={auth.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.user.name)}&background=56B8C3&color=fff`}
                                    className="w-9 h-9 rounded-full
                                        border-2 border-[rgba(86,184,195,0.4)] dark:border-slate-600"
                                    alt={auth.user.name}
                                />
                            </div>
                        )}
                    </div>

                    {/* ── Nav ── */}
                    <nav className="sb-scroll flex-1 min-h-0 overflow-y-auto py-2">
                        {menuNavigation.map((section, index) => {
                            const hasPermission = section.details.some(d => d.permissions === true);
                            if (!hasPermission) return null;
                            const isOpen = openSections[index] !== false;

                            return (
                                <div key={index} className="mb-0.5">
                                    {expanded && (
                                        <>
                                            <button
                                                className="sb-sec-btn w-full px-4 pt-2.5 pb-1
                                                    flex items-center justify-between
                                                    bg-transparent border-none cursor-pointer"
                                                onClick={() => toggleSection(index)}
                                            >
                                                <span className="sb-sec-lbl
                                                    text-[9px] font-bold uppercase tracking-[1.7px]
                                                    text-[#A8CACF] dark:text-slate-600
                                                    transition-colors duration-200">
                                                    {section.title}
                                                </span>
                                                <span className="sb-sec-chev transition-colors duration-200
                                                    text-[#D5EFF1] dark:text-slate-700">
                                                    {isOpen
                                                        ? <IconChevronDown size={13} />
                                                        : <IconChevronRight size={13} />}
                                                </span>
                                            </button>
                                            <div className="mx-4 mt-0.5 mb-1 h-px
                                                bg-gradient-to-r
                                                from-[#E0F0F2]      to-transparent
                                                dark:from-slate-800 dark:to-transparent" />
                                        </>
                                    )}

                                    <div className={!isOpen && expanded ? "hidden" : "block"}>
                                        {section.details.map((detail, idx) => {
                                            if (!detail.permissions) return null;
                                            if (detail.hasOwnProperty("subdetails")) {
                                                return (
                                                    <LinkItemDropdown
                                                        key={idx}
                                                        title={detail.title}
                                                        icon={detail.icon}
                                                        data={detail.subdetails}
                                                        access={detail.permissions}
                                                        sidebarOpen={expanded}
                                                    />
                                                );
                                            }
                                            return (
                                                <LinkItem
                                                    key={idx}
                                                    title={detail.title}
                                                    icon={detail.icon}
                                                    href={detail.href}
                                                    access={detail.permissions}
                                                    sidebarOpen={expanded}
                                                    onClick={isMobile ? closeMobile : undefined}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>

                    {/* ── Footer ── */}
                    {expanded && (
                        <div className="
                            flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3
                            border-t transition-colors duration-300
                            border-[#E8F5F6]    dark:border-slate-800
                            bg-[#F0FAFB]        dark:bg-slate-900
                        ">
                            <div className="w-[5px] h-[5px] rounded-full bg-[#56B8C3]"
                                style={{
                                    boxShadow: "0 0 6px rgba(86,184,195,0.5)",
                                    animation: "sbPulse 2.5s ease-in-out infinite",
                                }} />
                            <span className="text-[10px] font-semibold uppercase tracking-[1.2px] transition-colors duration-300
                                text-[#A8CACF] dark:text-slate-600">
                                Harumnya v2.0
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* ── Desktop ── */}
            <div
                className="hidden md:flex flex-col h-screen sticky top-0 overflow-hidden
                    transition-all duration-300 ease-in-out"
                style={{ width: sidebarOpen ? "260px" : "80px" }}
            >
                {renderContent(false)}
            </div>

            {/* ── Mobile Hamburger ── */}
            <button
                className="md:hidden fixed top-3.5 left-4 z-30 p-2 rounded-xl
                    bg-white            dark:bg-slate-900
                    border
                    border-[#D5EFF1]    dark:border-slate-700
                    text-[#3A9DAA]      dark:text-slate-400
                    shadow-sm
                    transition-colors duration-300"
                onClick={() => setMobileOpen(true)}
                aria-label="Buka menu"
            >
                <IconMenu2 size={20} />
            </button>

            {/* ── Backdrop ── */}
            <div
                className={`md:hidden fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300
                    bg-slate-950/60
                    ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={closeMobile}
            />

            {/* ── Mobile Drawer ── */}
            <div
                className={`md:hidden fixed inset-y-0 left-0 z-50 flex flex-col shadow-2xl
                    transform transition-transform duration-300 ease-in-out
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
                style={{ height: "100dvh", width: "280px" }}
            >
                {renderContent(true)}
            </div>
        </>
    );
}
