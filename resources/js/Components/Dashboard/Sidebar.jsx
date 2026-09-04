import React, { useState, useMemo } from "react";
import { usePage, Link } from "@inertiajs/react";
import { IconX, IconChevronDown, IconChevronRight, IconMenu2, IconSun, IconMoon, IconLogout, IconSearch, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconShieldLock } from "@tabler/icons-react";
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

export default function Sidebar({ themeSwitcher, darkMode }) {
    const { auth } = usePage().props;
    const menuNavigation = Menu();
    const [openSections, setOpenSections] = useState(() => {
        try {
            const saved = localStorage.getItem("sidebarOpenSections");
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    });
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const filteredMenu = useMemo(() => {
        if (!searchQuery.trim()) return menuNavigation;
        const q = searchQuery.toLowerCase().trim();
        return menuNavigation.map((section) => {
            const sectionMatches = section.title?.toLowerCase().includes(q);
            const filteredDetails = section.details.filter((detail) => {
                if (sectionMatches) return true;
                const matchesTitle = detail.title?.toLowerCase().includes(q);
                const matchesKeywords = detail.keywords?.some(k => k.toLowerCase().includes(q));
                const matchesSub = detail.subdetails?.some(sub => sub.title?.toLowerCase().includes(q));
                return matchesTitle || matchesKeywords || matchesSub;
            });
            return { ...section, details: filteredDetails };
        }).filter(section => section.details.length > 0);
    }, [searchQuery, menuNavigation]);

    // State sidebarOpen sekarang dikelola di dalam Sidebar sendiri
    const [sidebarOpen, setSidebarOpen] = useState(
        localStorage.getItem("sidebarOpen") === "true"
    );

    const toggleSidebar = () => {
        setSidebarOpen((prev) => {
            const next = !prev;
            localStorage.setItem("sidebarOpen", next);
            return next;
        });
    };

    const toggleSection = (index) => {
        setOpenSections((prev) => {
            const next = { ...prev, [index]: !prev[index] };
            localStorage.setItem("sidebarOpenSections", JSON.stringify(next));
            return next;
        });
    };

    const navRef = React.useRef(null);

    // Scroll the active link into view after every render
    React.useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        // Wait one frame so the DOM has fully painted
        const raf = requestAnimationFrame(() => {
            const activeEl = nav.querySelector('[data-active="true"]');
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        });
        return () => cancelAnimationFrame(raf);
    });

    const closeMobile = () => {
        setMobileOpen(false);
    };

    const renderContent = (isMobile = false) => {
        const expanded = isMobile || sidebarOpen;

        return (
            <div className="
                flex flex-col h-full w-full relative overflow-hidden
                bg-[#fbfbfb]        dark:bg-slate-950
                border-r
                border-[#e8e8e8]    dark:border-slate-800
                transition-colors duration-300
            ">                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;850&display=swap');
                    .sb-wrap { font-family: 'Inter', sans-serif; }

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
                        color: #0f172a !important;
                        background: #ffffff !important;
                        font-weight: 600 !important;
                        box-shadow: 0px 0px 0px 1px rgba(225, 225, 225, 1.00) !important;
                        outline: 1px solid #f5f5f5 !important;
                        outline-offset: -1px !important;
                    }
                    .dark a[data-active="true"].sb-link-exp {
                        color: #ffffff !important;
                        background: #1e293b !important;
                        font-weight: 600 !important;
                        box-shadow: 0px 0px 0px 1px rgba(51, 65, 85, 1.00) !important;
                        outline: 1px solid #334155 !important;
                        outline-offset: -1px !important;
                    }
                    a[data-active="true"].sb-link-exp .sb-icon {
                        background: transparent !important;
                        box-shadow: none !important;
                        color: #0f172a !important;
                    }
                    .dark a[data-active="true"].sb-link-exp .sb-icon {
                        background: transparent !important;
                        box-shadow: none !important;
                        color: #ffffff !important;
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
                        color: #0f172a !important;
                        background: #ffffff !important;
                        box-shadow: 0px 0px 0px 1px rgba(225, 225, 225, 1.00) !important;
                        outline: 1px solid #f5f5f5 !important;
                        outline-offset: -1px !important;
                    }
                    .dark a[data-active="true"].sb-link-col {
                        color: #ffffff !important;
                        background: #1e293b !important;
                        box-shadow: 0px 0px 0px 1px rgba(51, 65, 85, 1.00) !important;
                        outline: 1px solid #334155 !important;
                        outline-offset: -1px !important;
                    }
                    a[data-active="true"].sb-link-col .sb-icon {
                        background: transparent !important;
                        box-shadow: none !important;
                        color: #0f172a !important;
                    }
                    .dark a[data-active="true"].sb-link-col .sb-icon {
                        background: transparent !important;
                        box-shadow: none !important;
                        color: #ffffff !important;
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

                <div className="sb-wrap relative z-10 flex flex-col h-full pt-[3px]">

                    {/* ── Logo + Toggle Button ── */}
                    <div className={`
                        flex-shrink-0 flex transition-colors duration-300
                        ${expanded ? 'flex-row items-center justify-between px-3.5 h-16' : 'flex-col gap-2.5 py-4 px-1 items-center justify-center'}
                    `}>
                        <a href="/" className="flex items-center no-underline min-w-0">
                            {expanded ? (
                                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 550, letterSpacing: "-0.198px" }}
                                    className="text-[#0f172a] dark:text-white m-0 select-none">
                                    Harumnya
                                </p>
                            ) : (
                                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 550, letterSpacing: "-0.198px" }}
                                    className="text-[#0f172a] dark:text-white m-0 select-none">
                                    H
                                </p>
                            )}
                        </a>

                        {/* Tombol close untuk mobile drawer */}
                        {isMobile ? (
                            <button onClick={closeMobile}
                                className="p-1.5 rounded-lg border-none cursor-pointer flex items-center
                                    bg-transparent
                                    text-[#A0C4C8]          dark:text-slate-500
                                    hover:bg-[#F0FAFB]      hover:text-[#3A9DAA]
                                    dark:hover:bg-slate-800 dark:hover:text-slate-300
                                    transition-colors duration-200">
                                <IconX size={18} />
                            </button>
                        ) : (
                            /* Tombol toggle expand/collapse sidebar (desktop) */
                            <button
                                onClick={toggleSidebar}
                                title={sidebarOpen ? "Ciutkan sidebar" : "Perluas sidebar"}
                                className="bg-white dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex items-center justify-center rounded-[9px] size-[32px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
                            >
                                {sidebarOpen ? (
                                    <IconLayoutSidebarLeftCollapse size={16} className="text-slate-500 dark:text-slate-300" />
                                ) : (
                                    <IconLayoutSidebarLeftExpand size={16} className="text-slate-500 dark:text-slate-300" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* ── Search Bar Feature ── */}
                    {expanded ? (
                        <div className="flex-shrink-0 relative mx-2.5 my-2">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                                <IconSearch size={15} />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari menu..."
                                className="w-full pl-8 pr-7 py-1.5 bg-[#FFFFF] dark:bg-slate-900 border border-[rgba(86,184,195,0.2)] dark:border-slate-800 rounded-lg text-[12px] font-medium text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#56B8C3] focus:border-[#56B8C3] transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 bg-transparent border-none cursor-pointer"
                                >
                                    <IconX size={13} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex-shrink-0 flex justify-center my-2">
                            <button
                                onClick={toggleSidebar}
                                className="flex items-center justify-center size-8 rounded-lg bg-[#F0FAFB] dark:bg-slate-900 border border-[rgba(86,184,195,0.2)] dark:border-slate-800 text-[#56B8C3] hover:text-[#3A9DAA] dark:text-slate-500 dark:hover:text-slate-350 transition-colors cursor-pointer"
                            >
                                <IconSearch size={15} />
                            </button>
                        </div>
                    )}

                    {/* Boundary line below search bar */}
                    <div className="border-b border-[#e8e8e8] dark:border-slate-850 w-full mt-3 mb-2" />


                    {/* ── Nav ── */}
                    <nav ref={navRef} className="sb-scroll flex-1 min-h-0 overflow-y-auto py-2">
                        {filteredMenu.map((section, index) => {
                            const hasPermission = section.details.some(d => d.permissions === true);
                            if (!hasPermission) return null;
                            const isOpen = searchQuery.trim() ? true : openSections[index] !== false;

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
                    <div className="flex-shrink-0 border-t border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-2 items-center pb-[14px] pt-[12px] px-[12px] relative bg-[#fbfbfb] dark:bg-slate-950">
                        {/* User Card */}
                        <div
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="bg-[#fbfbfb] dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#e8e8e8] dark:border-slate-800 flex gap-[10px] items-center p-2 relative rounded-[10px] shrink-0 w-full cursor-pointer transition-colors"
                            data-node-id="2550:127"
                        >
                            {/* Avatar */}
                            {auth.user.avatar ? (
                                <img
                                    src={auth.user.avatar}
                                    className="w-8 h-8 rounded-full flex-shrink-0 border border-[#afd8dc] object-cover"
                                    alt={auth.user.name}
                                />
                            ) : (
                                <div className="bg-[#defafd] dark:bg-slate-800 border border-[#afd8dc] dark:border-slate-700 flex items-center justify-center rounded-full flex-shrink-0 size-[32px]">
                                    <span className="font-bold text-[11px] bg-clip-text bg-gradient-to-b from-[#54b8c3] to-[#39a1ac] text-transparent leading-none">
                                        {auth.user.name ? auth.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'AP'}
                                    </span>
                                </div>
                            )}

                            {expanded && (
                                <>
                                    {/* Identity */}
                                    <div className="flex flex-1 flex-col gap-px items-start min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                        <p className="font-semibold text-[12.5px] text-[#0f172a] dark:text-white leading-[16px] truncate w-full text-left">
                                            {auth.user.name}
                                        </p>
                                        <p className="font-medium text-[10px] text-[#94a3b8] dark:text-slate-400 leading-[13px] truncate w-full text-left">
                                            {auth.roles[0] || 'User'}
                                        </p>
                                    </div>
                                    {/* Caret */}
                                    <div className="text-slate-400 dark:text-slate-500 shrink-0">
                                        <IconChevronDown size={14} className={userMenuOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Dropdown Menu Popover */}
                        {userMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                <div className={`absolute bottom-full mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 ${expanded ? 'left-3 w-[calc(100%-24px)]' : 'left-3 w-[160px]'}`}>
                                    {themeSwitcher && (
                                        <button
                                            onClick={() => {
                                                themeSwitcher();
                                                setUserMenuOpen(false);
                                            }}
                                            className="w-full text-left text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent"
                                        >
                                            {darkMode ? <IconSun size={15} className="text-amber-500" /> : <IconMoon size={15} />}
                                            <span>{darkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
                                        </button>
                                    )}
                                    <Link
                                        href={route('password.edit')}
                                        onClick={() => setUserMenuOpen(false)}
                                        className="w-full text-left text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent"
                                    >
                                        <IconShieldLock size={15} />
                                        <span>Ganti Password</span>
                                    </Link>
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="w-full text-left text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 dark:text-red-405 flex items-center gap-2 transition-colors cursor-pointer border-none bg-transparent"
                                    >
                                        <IconLogout size={15} />
                                        <span>Keluar</span>
                                    </Link>
                                </div>
                            </>
                        )}

                        {expanded && (
                            <p className="font-medium text-[10px] text-[#94a3b8] dark:text-slate-500 text-center w-full mt-1">
                                ©️ 2026 Harumnya. All Right Reserved.
                            </p>
                        )}
                    </div>
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
