import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import { useTheme } from '@/Context/ThemeSwitcherContext';
import {
    IconBox, IconFlask, IconMoneybag, IconUsers, IconBuildingStore,
    IconTrendingUp, IconShoppingCart, IconAlertTriangle, IconCash,
    IconDiscount2, IconStar, IconArrowUpRight, IconArrowDownRight,
    IconPackage, IconUserCheck, IconLock, IconLockOpen, IconChartBar,
    IconReceipt, IconPercentage, IconChartPie, IconFilter,
    IconCalendar, IconCurrencyDollar, IconRefresh, IconDownload,
    IconLayoutGrid, IconStack3, IconChevronDown, IconSun, IconMoon,
} from '@tabler/icons-react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    LineChart, Line,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

// ─── CUSTOM ACTIVE DOT FOR RECHARTS ──────────────────────────────────────────
const CustomActiveDot = (props) => {
    const { cx, cy } = props;
    if (cx === undefined || cy === undefined) return null;
    return (
        <foreignObject x={cx - 24} y={cy - 24} width={48} height={48} className="overflow-visible">
            <div className="w-full h-full flex items-center justify-center relative">
                {/* Outer Ripple Ring 2 */}
                <div className="absolute size-[38px] rounded-full border border-[#F2A196]/20 dark:border-[#F2A196]/10 pointer-events-none" />

                {/* Inner Ripple Ring 1 */}
                <div className="absolute size-[26px] rounded-full border border-[#F2A196]/40 dark:border-[#F2A196]/20 pointer-events-none" />

                {/* Center Dot with linear gradient border */}
                <div
                    className="size-4 rounded-full shadow-[0px_5px_25px_0px_rgba(0,0,0,0.10)] shadow-[0px_0px_0px_2px_rgba(255,255,255,1.00)] z-10"
                    style={{
                        border: '6px solid transparent',
                        background: 'linear-gradient(white, white) padding-box, linear-gradient(to bottom, #F2A196, #E85542) border-box',
                    }}
                />
            </div>
        </foreignObject>
    );
};

// ─── SELF-CONTAINED COMPONENTS (replaces @/Components/Dashboard/*) ───────────
function Card({ children, className = '', style }) {
    return (
        <div
            style={style}
            className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm ${className}`}
        >
            {children}
        </div>
    );
}

function Widget({ title, subtitle, icon, total }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[14px] items-start p-[16px] rounded-[16px] w-full shadow-sm">
            <div className="flex gap-[12px] items-center w-full">
                <div
                    className="size-9 p-2 relative bg-gradient-to-b from-teal-400 to-cyan-600 rounded-[8px] outline outline-[0.50px] outline-offset-[-0.50px] outline-teal-200/60 inline-flex justify-center items-center gap-2.5 overflow-hidden flex-shrink-0"
                    style={{
                        boxShadow:
                            '0px 0px 0px 0.5px rgba(44, 156, 168, 1.00), 0px 0px 0.224852px 0.224852px rgba(0,0,0,0.07), inset 0px 2px 3px 0px rgba(72, 208, 223, 0.50)',
                    }}
                >
                    <div className="w-20 h-9 left-[-22px] top-[33px] absolute bg-gradient-to-r from-teal-200 to-teal-200/0 rounded-full blur-[5px] pointer-events-none" />
                    <div className="size-5 relative z-10 overflow-hidden flex items-center justify-center text-white">
                        {icon}
                    </div>
                </div>
                <p className="font-medium text-[16px] text-slate-900 dark:text-slate-100 leading-tight truncate">
                    {subtitle}
                </p>
            </div>
            <div className="flex flex-col gap-[4px] items-start leading-[1.4] w-full">
                <p className="font-bold text-[26px] text-slate-900 dark:text-white leading-none">
                    {total?.toLocaleString('id-ID')}
                </p>
                <p className="font-medium text-[14px] text-slate-500 dark:text-slate-400 leading-tight truncate w-full">
                    {title}
                </p>
            </div>
        </div>
    );
}

// ─── COLORS ───────────────────────────────────────────────────────────────────
const COLORS = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#db2777', '#0891b2'];
const C = {
    primary: '#7c3aed',
    success: '#16a34a',
    danger:  '#dc2626',
    warning: '#d97706',
    info:    '#2563eb',
};

// ─── GENDER ───────────────────────────────────────────────────────────────────
const GENDER_COLOR = {
    male:    '#2563eb',
    female:  '#db2777',
    unisex:  '#7c3aed',
    unknown: '#94a3b8',
};

// ─── INTENSITY STYLES ──────────────────────────────────────────────────────────
const getIntensityStyle = (name) => {
    const norm = name?.toLowerCase() || '';
    if (norm.includes('parfum') || norm.includes('edp')) {
        return {
            fill: 'url(#gEdp)',
            solid: '#3982aa',
            bg: 'linear-gradient(180deg, #62b6e4 0%, #3982aa 100%)'
        };
    }
    if (norm.includes('toilette') || norm.includes('edt')) {
        return {
            fill: 'url(#gEdt)',
            solid: '#c09628',
            bg: 'linear-gradient(180deg, #ebc96e 0%, #c09628 100%)'
        };
    }
    if (norm.includes('cologne') || norm.includes('edc')) {
        return {
            fill: 'url(#gEdc)',
            solid: '#5b8f87',
            bg: 'linear-gradient(180deg, #77bbb0 0%, #5b8f87 100%)'
        };
    }
    return {
        fill: 'url(#gOther)',
        solid: '#694aa3',
        bg: 'linear-gradient(180deg, #8f77bb 0%, #694aa3 100%)'
    };
};

const getSizeStyle = (name) => {
    const norm = name?.toLowerCase() || '';
    if (norm.includes('30 ml') || norm.includes('30ml')) {
        return {
            gradient: 'linear-gradient(180deg, #62b6e4 0%, #3982aa 100%)',
            border: '#1b87c3'
        };
    }
    if (norm.includes('100 ml') || norm.includes('100ml')) {
        return {
            gradient: 'linear-gradient(180deg, #ebc96e 0%, #c09628 100%)',
            border: '#c1941b'
        };
    }
    if (norm.includes('50 ml') || norm.includes('50ml')) {
        return {
            gradient: 'linear-gradient(180deg, #77bbb0 0%, #5b8f87 100%)',
            border: '#499286'
        };
    }
    if (norm.includes('10 ml') || norm.includes('10ml')) {
        return {
            gradient: 'linear-gradient(180deg, #8f77bb 0%, #694aa3 100%)',
            border: '#561ebe'
        };
    }
    return {
        gradient: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)',
        border: '#475569'
    };
};

const getPaymentStyle = (name) => {
    const norm = name?.toLowerCase() || '';
    if (norm.includes('qris')) {
        return {
            gradient: 'linear-gradient(180deg, #54b8c3 0%, #39a1ac 100%)',
            color: '#39a1ac'
        };
    }
    if (norm.includes('tunai') || norm.includes('cash')) {
        return {
            gradient: 'linear-gradient(180deg, #62b6e4 0%, #3982aa 100%)',
            color: '#3982aa'
        };
    }
    if (norm.includes('transfer') || norm.includes('bank') || norm.includes('debit')) {
        return {
            gradient: 'linear-gradient(180deg, #ebc96e 0%, #c09628 100%)',
            color: '#c09628'
        };
    }
    return {
        gradient: 'linear-gradient(180deg, #8f77bb 0%, #694aa3 100%)',
        color: '#694aa3'
    };
};

// ─── FORMAT ───────────────────────────────────────────────────────────────────
const idr = (v) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(v ?? 0);

const compact = (v) => {
    v = v ?? 0;
    if (v >= 1_000_000_000) return `Rp${(v / 1_000_000_000).toFixed(1)}M`;
    if (v >= 1_000_000)     return `Rp${(v / 1_000_000).toFixed(1)}Jt`;
    if (v >= 1_000)         return `Rp${(v / 1_000).toFixed(0)}Rb`;
    return `Rp${v}`;
};

const num = (v) => new Intl.NumberFormat('id-ID').format(v ?? 0);

const splitDateTime = (dateStr) => {
    if (!dateStr) return { date: '-', time: '' };
    const parts = dateStr.split(' ');
    if (parts.length >= 4) {
        const time = parts[parts.length - 1];
        const date = parts.slice(0, parts.length - 1).join(' ');
        return { date, time };
    }
    return { date: dateStr, time: '' };
};

// ─── CHART TOOLTIP ────────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 min-w-[160px]">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2 border-b border-slate-100 dark:border-slate-700 pb-1.5">
                {label}
            </p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-xs mb-1 last:mb-0">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-slate-500 dark:text-slate-400">{p.name}</span>
                    </div>
                    <span className="font-bold tabular-nums" style={{ color: p.color }}>
                        {typeof p.value === 'number' && p.value > 10000
                            ? compact(p.value)
                            : num(p.value)}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── TREND BADGE ──────────────────────────────────────────────────────────────
function TrendBadge({ value }) {
    if (value === null || value === undefined) return null;
    const up = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            up
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
            {up ? <IconArrowUpRight size={11} /> : <IconArrowDownRight size={11} />}
            {Math.abs(value).toFixed(2)}%
        </span>
    );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent = C.primary }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[14px] items-start pb-[16px] pt-[15px] px-[16px] rounded-[16px] w-full overflow-hidden">
            {/* Icon + Label row */}
            <div className="flex gap-[12px] items-start shrink-0">
                <div
                    className="size-9 p-2 relative bg-gradient-to-b from-teal-400 to-cyan-600 rounded-[8px] outline outline-[0.50px] outline-offset-[-0.50px] outline-teal-200/60 inline-flex justify-center items-center gap-2.5 overflow-hidden flex-shrink-0"
                    style={{
                        boxShadow:
                            '0px 0px 0px 0.5px rgba(44, 156, 168, 1.00), 0px 0px 0.224852px 0.224852px rgba(0,0,0,0.07), inset 0px 2px 3px 0px rgba(72, 208, 223, 0.50)',
                    }}
                >
                    <div className="w-20 h-9 left-[-22px] top-[33px] absolute bg-gradient-to-r from-teal-200 to-teal-200/0 rounded-full blur-[5px] pointer-events-none" />
                    <div className="size-5 relative z-10 overflow-hidden flex items-center justify-center text-white">
                        {Icon && <Icon size={18} strokeWidth={1.8} className="text-white" />}
                    </div>
                </div>
                <div className="flex flex-col justify-center h-[36px]">
                    <p className="font-medium text-[16px] text-slate-900 dark:text-slate-100 leading-[1.4]">{label}</p>
                </div>
            </div>
            {/* Value row */}
            <div className="flex flex-col gap-[14px] items-start leading-[1.4] overflow-hidden w-full">
                <p className="font-bold text-[26px] text-slate-900 dark:text-white leading-none truncate w-full">{value}</p>
                {sub && <div className="font-medium text-[14px] text-slate-500 dark:text-slate-400 leading-tight w-full">{sub}</div>}
            </div>
        </div>
    );
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
function STitle({ icon: Icon, children, sub, accent = C.primary }) {
    return (
        <div className="flex items-center gap-2.5 mb-4">
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: accent + '18' }}
            >
                <Icon size={15} style={{ color: accent }} />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{children}</h3>
                {sub && (
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{sub}</p>
                )}
            </div>
        </div>
    );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ message = 'Belum ada data', icon = '📊' }) {
    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 gap-3 w-full border border-dashed border-[#e8e8e8] dark:border-slate-800 rounded-[12px] bg-[#fafafa]/50 dark:bg-slate-900/50">
            <span className="text-3xl filter drop-shadow-[0px_2px_4px_rgba(0,0,0,0.08)]">{icon}</span>
            <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500 text-center">{message}</p>
        </div>
    );
}

// ─── STOCK ITEM ───────────────────────────────────────────────────────────────
function StockItem({ item, variant = 'warning' }) {
    const isEmpty    = item.status === 'empty';
    const isCritical = item.status === 'critical';
    const isRed      = isEmpty || isCritical;

    const bg    = variant === 'danger' || isRed
        ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50'
        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50';
    const badge = isRed
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    const valColor = isRed
        ? 'text-red-600 dark:text-red-400'
        : 'text-amber-600 dark:text-amber-400';

    return (
        <div className={`flex items-center justify-between p-3 rounded-xl ${bg}`}>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.warehouse_name ? `${item.warehouse_name} · ` : ''}
                    Min: {num(item.minimum)} {item.unit}
                </p>
            </div>
            <div className="text-right ml-3 flex-shrink-0">
                <p className={`text-sm font-bold ${valColor}`}>
                    {num(item.current)} {item.unit}
                </p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge}`}>
                    {isEmpty ? 'Habis' : isCritical ? 'Kritis' : 'Rendah'}
                </span>
            </div>
        </div>
    );
}

// ─── TAB BUTTON (SOLID Principle: Single Responsibility Component) ─────────────
function TabButton({ tabKey, active, label, icon: Icon, badgeCount, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex gap-[7px] h-[30px] items-center px-[12px] rounded-[8px] transition-all text-[12px] whitespace-nowrap ${
                active
                    ? 'bg-white dark:bg-slate-800 border border-[#e5e5e5] dark:border-slate-700 shadow-[0px_1px_3px_0px_rgba(15,23,41,0.08)] font-semibold text-slate-900 dark:text-slate-100'
                    : 'border border-transparent font-medium text-[#4d5360] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
        >
            <Icon
                size={15}
                className={
                    active
                        ? tabKey === 'overview'
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-700 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-500 transition-colors group-hover:text-slate-600 dark:group-hover:text-slate-350'
                }
            />
            <span>{label}</span>
            {badgeCount > 0 && (
                <span className="bg-[#fdecec] dark:bg-red-950/40 text-[#c73939] dark:text-red-400 px-[6px] py-[1px] rounded-full font-bold text-[9.5px] leading-none ml-1.5 flex-shrink-0">
                    {badgeCount}
                </span>
            )}
        </button>
    );
}

// ─── TOPBAR (SOLID Principle: Single Responsibility Component & Figma Design Match) ───
function Topbar({
    stores = [],
    currentStore = null,
    selectedStore = '',
    changeStore,
    canFilterStore = false,
    isSuperAdmin = false,
}) {
    const { darkMode, themeSwitcher } = useTheme();

    const subtitleText = useMemo(() => {
        if (currentStore) {
            return `Menampilkan data ${currentStore.name} · Live`;
        }
        return `Menampilkan data Semua Toko · ${stores.length} toko aktif`;
    }, [currentStore, stores]);

    return (
        <div className="bg-transparent flex gap-[12px] items-center py-1 relative w-full" data-node-id="2550:137" data-name="Topbar">
            <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] items-start min-w-px overflow-clip relative" data-node-id="2550:138" data-name="Title">
                <p className="font-semibold text-[22px] text-slate-900 dark:text-white leading-tight" data-node-id="2550:139">
                    Dashboard
                </p>
                <p className="font-medium text-slate-500 dark:text-slate-400 text-[14px] leading-tight" data-node-id="2550:140">
                    {subtitleText}
                </p>
            </div>
            
            <div className="flex gap-[8px] items-center shrink-0" data-node-id="2550:141" data-name="Topbar Actions">
                {canFilterStore && stores.length > 0 && (
                    <div className="relative bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex items-center h-[34px] rounded-[9px] w-[150px]" data-node-id="2550:142" data-name="Store Selector">
                        <div className="absolute left-[10px] top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" data-node-id="2550:143" data-name="icon/store">
                            <IconBuildingStore size={16} />
                        </div>
                        <select
                            value={selectedStore}
                            onChange={(e) => changeStore(e.target.value)}
                            className="appearance-none bg-transparent bg-none border-none w-full h-full py-0 pl-[34px] pr-[32px] text-[12px] font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-0 cursor-pointer truncate"
                            data-node-id="2550:146"
                        >
                            {isSuperAdmin && (
                                <option value="">Semua Toko</option>
                            )}
                            {stores.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-[8px] top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" data-node-id="2550:147" data-name="icon/caret">
                            <IconChevronDown size={14} />
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={themeSwitcher}
                    className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex items-center justify-center rounded-[9px] shrink-0 size-[34px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                    data-node-id="2550:149"
                    data-name="IconButton"
                >
                    <div className="size-[16px] flex items-center justify-center" data-node-id="2550:150" data-name="icon/mode">
                        {darkMode ? <IconSun size={16} /> : <IconMoon size={16} />}
                    </div>
                </button>
            </div>
        </div>
    );
}

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────
const TABS = [
    { key: 'overview',    label: 'Overview',    icon: IconLayoutGrid  },
    { key: 'penjualan',   label: 'Penjualan',   icon: IconTrendingUp  },
    { key: 'produk',      label: 'Produk',      icon: IconBox         },
    { key: 'operasional', label: 'Operasional', icon: IconStack3      },
    { key: 'toko',        label: 'Toko',        icon: IconBuildingStore },
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard({
    startDate, endDate, diffDays = 30, isSuperAdmin = false, isAdmin = false,
    canFilterStore = false, selectedStoreId = null, stores = [],
    currentStore = null, error = null,
    kpi = {}, counts = {},
    revenueTrend = [], salesByIntensity = [], salesBySize = [],
    paymentBreakdown = [], discountUsage = [],
    topVariants = [], topCustomers = [], topPackaging = [], salesPeoplePerformance = [],
    storePerformance = [],
    activeCashDrawer = null, lowStockIngredients = [], lowStockWarehouse = [],
    recentTransactions = [],
}) {
    const [activeTab, setActiveTab] = useState('overview');
    const [sd, setSd] = useState(startDate || '');
    const [ed, setEd] = useState(endDate || '');
    const [selectedStore, setSelectedStore] = useState(selectedStoreId ?? '');

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [tempSd, setTempSd] = useState(sd);
    const [tempEd, setTempEd] = useState(ed);

    useEffect(() => {
        setTempSd(sd);
        setTempEd(ed);
    }, [sd, ed]);

    const formatToYmd = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handlePreset = (days) => {
        const today = new Date();
        let start;
        if (days === 0) {
            start = today;
        } else if (days === 'month') {
            start = new Date(today.getFullYear(), today.getMonth(), 1);
        } else {
            start = new Date();
            start.setDate(today.getDate() - days);
        }
        setTempSd(formatToYmd(start));
        setTempEd(formatToYmd(today));
    };

    const applyDates = () => {
        setSd(tempSd);
        setEd(tempEd);
        changeFilter(tempSd, tempEd, selectedStore || null);
        setIsCalendarOpen(false);
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const dateDisplayString = useMemo(() => {
        if (sd && ed) {
            return `${formatDateDisplay(sd)} – ${formatDateDisplay(ed)}`;
        }
        return 'Pilih Tanggal';
    }, [sd, ed]);

    const changeFilter = useCallback((newSd, newEd, newStoreId) => {
        const params = {};
        if (newSd && newEd) {
            params.start_date = newSd;
            params.end_date = newEd;
        }
        if (newStoreId) params.store_id = newStoreId;
        router.get(route('dashboard'), params, { preserveState: true, preserveScroll: true });
    }, []);

    const handleStartDateChange = useCallback((e) => {
        const newSd = e.target.value;
        setSd(newSd);
        if (newSd && ed) changeFilter(newSd, ed, selectedStore || null);
    }, [ed, selectedStore, changeFilter]);

    const handleEndDateChange = useCallback((e) => {
        const newEd = e.target.value;
        setEd(newEd);
        if (sd && newEd) changeFilter(sd, newEd, selectedStore || null);
    }, [sd, selectedStore, changeFilter]);

    const changeStore = useCallback((storeId) => {
        setSelectedStore(storeId);
        changeFilter(sd, ed, storeId || null);
    }, [sd, ed, changeFilter]);

    const profitMargin = useMemo(() => {
        if (!kpi.totalRevenue) return 0;
        return (((kpi.totalProfit ?? 0) / kpi.totalRevenue) * 100).toFixed(2);
    }, [kpi]);

    const stockAlertCount = lowStockIngredients.length + lowStockWarehouse.length;
    const paymentTotal    = paymentBreakdown.reduce((a, b) => a + (b.total_amount ?? 0), 0);

    const radarData = ['Revenue', 'Volume', 'Share'].map((m, mi) => {
        const obj = { metric: m };
        salesByIntensity.forEach((s) => {
            obj[s.code] = mi === 0
                ? Math.round(s.revenue / 1_000_000)
                : mi === 1 ? s.qty : s.pct;
        });
        return obj;
    });

    const visibleTabs = TABS.filter((t) => t.key !== 'toko' || canFilterStore);

    return (
        <>
            <Head title="Dashboard" />
            <div className="bg-white dark:bg-slate-900 flex flex-col gap-5 w-full relative pb-8">

                {/* ── ERROR ─────────────────────────────────────────────────── */}
                {error && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <IconAlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-800 dark:text-red-300">Terjadi Kesalahan</p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {/* ── TOPBAR (Figma Design Match: Title, Subtitle, Store Selector & Theme Toggle) ── */}
                <Topbar
                    stores={stores}
                    currentStore={currentStore}
                    selectedStore={selectedStore}
                    changeStore={changeStore}
                    canFilterStore={canFilterStore}
                    isSuperAdmin={isSuperAdmin}
                />

                {/* ── TABS + PERIOD ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Tabs (SOLID Principle: Single Responsibility Component & Figma Design Match) */}
                    <div className="bg-[#fbfbfb] dark:bg-slate-900/60 border border-[#e8e8e8] dark:border-slate-800 flex gap-[2px] items-center p-[4px] rounded-[8px] overflow-x-auto scrollbar-none">
                        {visibleTabs.map((t) => (
                            <TabButton
                                key={t.key}
                                tabKey={t.key}
                                active={activeTab === t.key}
                                label={t.label}
                                icon={t.icon}
                                badgeCount={t.key === 'operasional' ? stockAlertCount : 0}
                                onClick={() => setActiveTab(t.key)}
                            />
                        ))}
                    </div>

                    {/* Filters: Period & Export */}
                    <div className="relative flex items-center gap-2 flex-wrap">
                        {/* Figma Chip Calendar Range Picker Trigger */}
                        <button
                            type="button"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex gap-[7px] items-center h-[34px] pl-[11px] pr-[12px] rounded-[8px] hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-colors cursor-pointer select-none"
                            data-node-id="2550:192"
                            data-name="Chip / Calendar Range Picker"
                        >
                            <div className="relative shrink-0 size-[15px]" data-node-id="2550:193" data-name="icon/calendar">
                                <IconCalendar size={15} className="absolute inset-0 size-full text-slate-500 dark:text-slate-400" />
                            </div>
                            <p className="font-medium text-[12.5px] text-slate-900 dark:text-slate-100 whitespace-nowrap" data-node-id="2550:198">
                                {dateDisplayString}
                            </p>
                        </button>

                        {/* Calendar Dropdown Popover Modal */}
                        {isCalendarOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsCalendarOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    {/* Presets */}
                                    <div className="mb-4">
                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Pilihan Cepat</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handlePreset(0)}
                                                className="text-xs text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium text-slate-700 dark:text-slate-200 transition-colors"
                                            >
                                                Hari Ini
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePreset(6)}
                                                className="text-xs text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium text-slate-700 dark:text-slate-200 transition-colors"
                                            >
                                                7 Hari Terakhir
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePreset(29)}
                                                className="text-xs text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium text-slate-700 dark:text-slate-200 transition-colors"
                                            >
                                                30 Hari Terakhir
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handlePreset('month')}
                                                className="text-xs text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium text-slate-700 dark:text-slate-200 transition-colors"
                                            >
                                                Bulan Ini
                                            </button>
                                        </div>
                                    </div>

                                    {/* Custom dates */}
                                    <div className="space-y-3 mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Rentang Kustom</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-slate-450 dark:text-slate-500 font-medium mb-1">Dari</label>
                                                <input
                                                    type="date"
                                                    value={tempSd}
                                                    onChange={(e) => setTempSd(e.target.value)}
                                                    className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-450 dark:text-slate-500 font-medium mb-1">Sampai</label>
                                                <input
                                                    type="date"
                                                    value={tempEd}
                                                    onChange={(e) => setTempEd(e.target.value)}
                                                    className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setIsCalendarOpen(false)}
                                            className="text-xs px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-500 dark:text-slate-450 transition-colors"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={applyDates}
                                            disabled={!tempSd || !tempEd}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 font-bold text-white shadow-sm transition-colors"
                                        >
                                            Terapkan
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* OVERVIEW                                                    */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-5">

                        {/* Count widgets — scrollable on mobile */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Widget title="Varian Parfum" subtitle="Total Aktif"
                                color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                icon={<IconFlask size={20} strokeWidth={1.5} />}
                                total={counts.variants ?? 0} />
                            <Widget title="Bahan Baku" subtitle="Total Ingredient"
                                color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                icon={<IconBox size={20} strokeWidth={1.5} />}
                                total={counts.ingredients ?? 0} />
                            <Widget title="Transaksi" subtitle={`${diffDays} hari`}
                                color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                icon={<IconShoppingCart size={20} strokeWidth={1.5} />}
                                total={kpi.totalTransactions ?? 0} />
                            <Widget title="Member Aktif" subtitle="Total Pelanggan"
                                color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                icon={<IconUsers size={20} strokeWidth={1.5} />}
                                total={counts.customers ?? 0} />
                        </div>
                        
                        {/* Financial KPI */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <KpiCard label="Total Pendapatan" value={compact(kpi.totalRevenue)}
                                sub={
                                    <div className="space-y-1">
                                        <div className="truncate">{idr(kpi.totalRevenue)}</div>
                                        <TrendBadge value={kpi.trendRevenue} />
                                    </div>
                                }
                                icon={IconMoneybag} accent={C.primary} />
                            <KpiCard label="Total Profit" value={compact(kpi.totalProfit)}
                                sub={
                                    <div className="space-y-1">
                                        <div>Margin {profitMargin}%</div>
                                        <TrendBadge value={kpi.trendProfit} />
                                    </div>
                                }
                                icon={IconTrendingUp} accent={C.success} />
                            <KpiCard label="Rata-rata Order" value={compact(kpi.avgOrder)}
                                sub={
                                    <div>
                                        <div>Per transaksi</div>
                                        <TrendBadge value={kpi.trendTransactions} />
                                    </div>
                                }
                                icon={IconChartBar} accent={C.info} />
                            <KpiCard label="Hari ini" value={num(kpi.todayTransactions)}
                                sub={<div>{compact(kpi.todayRevenue)}</div>}
                                icon={IconCash} accent={C.warning} />
                        </div>

                        {/* Revenue + Profit trend chart */}
                        <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[14px] items-start overflow-hidden px-[18px] py-[16px] rounded-[16px] w-full">
                            {/* Card Head: Title left + Legend right */}
                            <div className="flex gap-[10px] items-center w-full">
                                <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0 overflow-hidden">
                                    <p className="font-semibold text-[16px] text-slate-900 dark:text-white leading-[1.4] whitespace-nowrap">Tren Keuangan</p>
                                    <p className="font-medium text-[14px] text-slate-500 dark:text-slate-400 leading-[1.4] whitespace-nowrap">Revenue · Profit · COGS per hari</p>
                                </div>
                                <div className="flex gap-[14px] items-center flex-shrink-0">
                                    {[
                                        { label: 'Revenue', color: '#ff718b' },
                                        { label: 'Profit',  color: '#0f894d' },
                                        { label: 'COGS',    color: '#4a3aff' },
                                    ].map(({ label, color }) => (
                                        <div key={label} className="flex gap-[6px] items-center">
                                            <span className="size-[7px] rounded-full flex-shrink-0" style={{ background: color }} />
                                            <span className="font-medium text-[11px] text-slate-500 dark:text-slate-400 leading-[16px] whitespace-nowrap">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Chart */}
                            {revenueTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={196}>
                                    <LineChart data={revenueTrend} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="0" stroke="#eef2f7" className="dark:stroke-slate-800" horizontal={true} vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: '#94a3b8', fontSize: 9.5, fontWeight: 500 }}
                                            axisLine={false} tickLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(v) => compact(v).replace('Rp', '')}
                                            tick={{ fill: '#94a3b8', fontSize: 9.5, fontWeight: 500 }}
                                            axisLine={false} tickLine={false} width={48}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (!active || !payload?.length) return null;
                                                const colors = { Revenue: '#ff718b', Profit: '#0f894d', COGS: '#4a3aff' };
                                                return (
                                                    <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 rounded-[10px] px-[12px] py-[10px] flex flex-col gap-[8px] min-w-[150px]" style={{ boxShadow: '0px 6px 18px -4px rgba(15,23,41,0.14)' }}>
                                                        <p className="font-semibold text-[14px] text-slate-900 dark:text-white leading-[1.4] whitespace-nowrap">{label}</p>
                                                        <div className="flex flex-col gap-[8px]">
                                                            {payload.map((p) => (
                                                                <div key={p.name} className="flex gap-[10px] items-center w-full">
                                                                    <span className="size-[8px] rounded-full flex-shrink-0" style={{ background: colors[p.name] ?? p.color }} />
                                                                    <span className="flex-1 font-medium text-[12px] text-slate-500 dark:text-slate-400 min-w-0">{p.name}</span>
                                                                    <span className="font-semibold text-[12px] whitespace-nowrap" style={{ color: colors[p.name] ?? p.color }}>{compact(p.value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#ff718b" strokeWidth={2.5} dot={false} activeDot={<CustomActiveDot />} />
                                        <Line type="monotone" dataKey="profit"  name="Profit"  stroke="#0f894d" strokeWidth={2}   dot={false} activeDot={<CustomActiveDot />} />
                                        <Line type="monotone" dataKey="cogs"    name="COGS"    stroke="#4a3aff" strokeWidth={2}   dot={false} activeDot={<CustomActiveDot />} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : <EmptyState message="Belum ada data tren" icon="📈" />}
                        </div>

                        {/* Intensity + Size + Payment */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[10px]">

                            {/* ── Card / Sales by Intensity ── */}
                            <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[14px] items-start overflow-hidden px-[18px] py-[16px] rounded-[16px] self-stretch">
                                {/* Head */}
                                <div className="flex gap-[10px] items-center w-full">
                                    <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0">
                                        <p className="font-semibold text-[16px] text-slate-900 dark:text-white leading-[1.4]">Sales by Intensity</p>
                                        <p className="font-medium text-[14px] text-slate-500 dark:text-slate-400 leading-[1.4]">Distribusi konsentrasi</p>
                                    </div>
                                </div>
                                {salesByIntensity.length > 0 ? (
                                    <>
                                        {/* Donut centered */}
                                        <div className="flex items-center justify-center py-[6px] w-full">
                                            <ResponsiveContainer width={142} height={142}>
                                                <PieChart>
                                                    <defs>
                                                        <linearGradient id="gEdp" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#62b6e4" />
                                                            <stop offset="100%" stopColor="#3982aa" />
                                                        </linearGradient>
                                                        <linearGradient id="gEdt" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#ebc96e" />
                                                            <stop offset="100%" stopColor="#c09628" />
                                                        </linearGradient>
                                                        <linearGradient id="gEdc" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#77bbb0" />
                                                            <stop offset="100%" stopColor="#5b8f87" />
                                                        </linearGradient>
                                                        <linearGradient id="gOther" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#8f77bb" />
                                                            <stop offset="100%" stopColor="#694aa3" />
                                                        </linearGradient>
                                                    </defs>
                                                    <Pie
                                                        data={salesByIntensity}
                                                        dataKey="pct" nameKey="name"
                                                        cx="50%" cy="50%"
                                                        innerRadius={42} outerRadius={66}
                                                        paddingAngle={3} startAngle={90} endAngle={-270}
                                                    >
                                                        {salesByIntensity.map((entry, i) => (
                                                            <Cell key={i} fill={getIntensityStyle(entry.name).fill} stroke="none" />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (!active || !payload?.length) return null;
                                                            const p = payload[0];
                                                            return (
                                                                <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 rounded-[10px] px-[10px] py-[8px] text-[12px]" style={{ boxShadow: '0px 6px 18px -4px rgba(15,23,41,0.14)' }}>
                                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{p.name}: </span>
                                                                    <span className="font-semibold" style={{ color: getIntensityStyle(p.name).solid }}>{p.value}%</span>
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Legend */}
                                        <div className="flex flex-col gap-[10px] w-full">
                                            {salesByIntensity.map((s, i) => {
                                                const style = getIntensityStyle(s.name);
                                                return (
                                                    <div key={i} className="flex gap-[10px] items-center w-full overflow-hidden">
                                                        <span className="size-[9px] rounded-[3px] flex-shrink-0" style={{ background: style.bg }} />
                                                        <span className="flex-1 font-medium text-[12px] text-slate-900 dark:text-slate-100 leading-[18px] min-w-0 truncate">{s.name}</span>
                                                        <span className="font-normal text-[11.5px] text-slate-400 leading-[18px] flex-shrink-0 tabular-nums">{num(s.qty)}</span>
                                                        <span className="font-semibold text-[12px] text-slate-900 dark:text-white leading-[18px] flex-shrink-0 tabular-nums">{s.pct}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : <EmptyState message="Belum ada data intensity" />}
                            </div>

                            {/* ── Card / Sales by Size ── */}
                            <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[14px] items-start overflow-hidden px-[18px] py-[16px] rounded-[16px] self-stretch">
                                {/* Head */}
                                <div className="flex gap-[10px] items-center w-full">
                                    <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0">
                                        <p className="font-semibold text-[16px] text-slate-900 dark:text-white leading-[1.4]">Sales by Size</p>
                                        <p className="font-medium text-[14px] text-slate-500 dark:text-slate-400 leading-[1.4]">Per ukuran botol</p>
                                    </div>
                                </div>
                                {salesBySize.length > 0 ? (() => {
                                    const maxQty = Math.max(...salesBySize.map(s => s.qty), 1);
                                    const BAR_MAX_H = 104;
                                    return (
                                        <>
                                            {/* Custom gradient bars */}
                                            <div className="flex items-end justify-between w-full overflow-hidden" style={{ height: 138 }}>
                                                {salesBySize.map((s, i) => {
                                                    const h = Math.max(Math.round((s.qty / maxQty) * BAR_MAX_H), 12);
                                                    const style = getSizeStyle(s.name);
                                                    return (
                                                        <div key={i} className="flex flex-col gap-[8px] items-center justify-end overflow-hidden" style={{ height: 138, flex: 1 }}>
                                                            <div
                                                                className="rounded-[8px] flex-shrink-0 w-[46px] max-w-full transition-all duration-500"
                                                                style={{
                                                                    height: h,
                                                                    background: style.gradient,
                                                                    border: `1px solid ${style.border}`,
                                                                }}
                                                            />
                                                            <p className="font-medium text-[10.5px] text-slate-400 leading-[14px] whitespace-nowrap">{s.name}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {/* Totals boxes */}
                                            <div className="flex gap-[10px] items-center w-full whitespace-nowrap">
                                                {salesBySize.map((s, i) => (
                                                    <div key={i} className="bg-[#fafafa] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex flex-1 flex-col gap-px items-center justify-center min-w-0 overflow-hidden py-[9px] rounded-[6px]">
                                                        <p className="font-bold text-[17px] text-slate-900 dark:text-white leading-[22px]">{num(s.qty)}</p>
                                                        <p className="font-medium text-[10px] text-slate-400 leading-[14px]">{s.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })() : <EmptyState message="Belum ada data ukuran" />}
                            </div>

                            {/* ── Card / Pembayaran ── */}
                            <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[14px] items-start overflow-hidden px-[18px] py-[16px] rounded-[16px] self-stretch">
                                {/* Head */}
                                <div className="flex gap-[10px] items-center w-full">
                                    <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0">
                                        <p className="font-semibold text-[16px] text-slate-900 dark:text-white leading-[1.4]">Pembayaran</p>
                                        <p className="font-medium text-[14px] text-slate-500 dark:text-slate-400 leading-[1.4]">Metode pembayaran</p>
                                    </div>
                                </div>
                                {paymentBreakdown.length > 0 ? (
                                    <div className="flex flex-1 flex-col items-start w-full gap-[14px]">
                                        <div className="flex flex-col gap-[14px] items-start w-full">
                                            {paymentBreakdown.map((p, i) => {
                                                const share = paymentTotal > 0
                                                    ? Math.round((p.total_amount / paymentTotal) * 100)
                                                    : 0;
                                                const style = getPaymentStyle(p.method_name);
                                                return (
                                                    <div key={i} className="flex flex-col gap-[8px] items-start w-full overflow-hidden">
                                                        {/* Top row */}
                                                        <div className="flex gap-[8px] items-center w-full overflow-hidden">
                                                            <span className="size-[8px] rounded-full flex-shrink-0" style={{ background: style.color }} />
                                                            <span className="flex-1 font-medium text-[12px] text-slate-900 dark:text-slate-100 leading-[1.4] min-w-0 truncate">{p.method_name}</span>
                                                            <div className="flex gap-[8px] items-center flex-shrink-0">
                                                                <span className="font-normal text-[12px] text-slate-400 leading-[1.2] whitespace-nowrap">{p.total_transactions}×</span>
                                                                <span className="font-semibold text-[14px] leading-[1.2] whitespace-nowrap" style={{ color: style.color }}>{share}%</span>
                                                            </div>
                                                        </div>
                                                        {/* Progress track */}
                                                        <div className="bg-[#eef2f7] dark:bg-slate-700 h-[6px] w-full rounded-full overflow-hidden">
                                                            <div
                                                                className="h-[6px] rounded-full transition-all duration-500"
                                                                style={{ width: `${share}%`, background: style.gradient }}
                                                            />
                                                        </div>
                                                        {/* Bottom: amount right */}
                                                        <div className="flex items-center w-full">
                                                            <div className="flex-1" />
                                                            <span className="font-medium text-[12px] text-slate-500 dark:text-slate-400 leading-[16px] whitespace-nowrap">{compact(p.total_amount)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Summary note */}
                                        {paymentBreakdown.length === 1 && (
                                            <div className="bg-[#fafafa] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex items-center justify-center overflow-hidden px-[14px] py-[12px] rounded-[10px] w-full">
                                                <p className="font-normal text-[11px] text-slate-400 leading-[15px] text-center">
                                                    Seluruh {paymentBreakdown[0].total_transactions} transaksi periode ini dibayar via {paymentBreakdown[0].method_name}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : <EmptyState message="Belum ada data pembayaran" />}
                            </div>

                        </div>

                        {/* Top Variants + Top Customers */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Card / Top Varian Parfum */}
                            <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[10px] items-start pb-[10px] pt-[16px] px-[18px] rounded-[16px] w-full">
                                {/* Head */}
                                <div className="flex gap-[10px] items-center w-full">
                                    <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0">
                                        <p className="font-semibold text-[16px] text-slate-900 dark:text-white leading-[1.4]">Top Varian Parfum</p>
                                        <p className="font-medium text-[14px] text-slate-500 dark:text-slate-400 leading-[1.4]">By revenue</p>
                                    </div>
                                </div>
                                {topVariants.length > 0 ? (
                                    <div className="flex flex-col w-full">
                                        {topVariants.map((v, i) => (
                                            <div key={i} className="border-b border-[#e8e8e8] dark:border-slate-850 flex gap-[12px] items-start py-[9px] w-full last:border-b-0 last:pb-0">
                                                <div className="bg-[#fafafa] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex items-center justify-center rounded-[8px] flex-shrink-0 size-[30px]">
                                                    <p className="font-medium text-[14px] text-slate-900 dark:text-slate-100 leading-none">{i + 1}</p>
                                                </div>
                                                <div className="flex flex-1 flex-col gap-[6px] items-start min-w-0">
                                                    <div className="flex gap-[7px] items-center flex-wrap w-full">
                                                        <p className="font-semibold text-[14px] text-slate-900 dark:text-white leading-tight truncate">{v.name}</p>
                                                        <span className="bg-[#f7f9fc] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 font-medium px-[8px] py-[2px] rounded-full text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.2px] capitalize">
                                                            {v.gender}
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-[12px] text-slate-500 dark:text-slate-400 leading-[1.4] whitespace-nowrap">
                                                        {num(v.qty)} unit · margin {v.margin}%
                                                    </p>
                                                </div>
                                                <p className="font-semibold text-[12.5px] text-slate-900 dark:text-white text-right w-[84px] leading-[20px] flex-shrink-0 tabular-nums">
                                                    {compact(v.revenue)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <EmptyState message="Belum ada data penjualan" icon="🏅" />}
                            </div>

                            {/* Card / Top Pelanggan */}
                            <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[10px] items-start pb-[10px] pt-[16px] px-[18px] rounded-[16px] w-full">
                                {/* Head */}
                                <div className="flex gap-[10px] items-center w-full">
                                    <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0">
                                        <p className="font-semibold text-[16px] text-slate-900 dark:text-white leading-[1.4]">Top Pelanggan</p>
                                        <p className="font-medium text-[14px] text-slate-500 dark:text-slate-400 leading-[1.4]">Total belanja</p>
                                    </div>
                                </div>
                                {topCustomers.length > 0 ? (
                                    <div className="flex flex-col w-full gap-[10px]">
                                        <div className="flex flex-col w-full">
                                            {topCustomers.map((c, i) => (
                                                <div key={i} className="border-b border-[#e8e8e8] dark:border-slate-850 flex gap-[12px] items-start py-[9px] w-full last:border-b-0 last:pb-0">
                                                    <div className="bg-[#fafafa] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex items-center justify-center rounded-[8px] flex-shrink-0 size-[30px]">
                                                        <p className="font-medium text-[14px] text-slate-900 dark:text-slate-100 leading-none">{i + 1}</p>
                                                    </div>
                                                    <div className="flex flex-1 flex-col gap-[4px] items-start min-w-0">
                                                        <div className="flex items-center gap-[6px] flex-wrap w-full">
                                                            <p className="font-semibold text-[14px] text-slate-900 dark:text-white leading-tight truncate">{c.name}</p>
                                                            {c.tier && (
                                                                <span className={`border border-solid font-medium px-[6px] py-[1px] rounded-full text-[9px] capitalize ${
                                                                    c.tier === 'platinum' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-650 dark:text-purple-400 border-purple-100 dark:border-purple-900/50'
                                                                    : c.tier === 'gold'   ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-650 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
                                                                    : c.tier === 'silver' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                                    :                       'bg-orange-50 dark:bg-orange-900/30 text-orange-650 dark:text-orange-400 border-orange-100 dark:border-orange-900/50'
                                                                }`}>
                                                                    {c.tier}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="font-medium text-[12px] text-slate-500 dark:text-slate-400 leading-[1.4] whitespace-nowrap">
                                                            {c.total_orders} transaksi · {num(c.current_points)} pts
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold text-[12.5px] text-slate-900 dark:text-white text-right w-[84px] leading-[20px] flex-shrink-0 tabular-nums">
                                                        {compact(c.total_spending)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Summary Note Box */}
                                        <div className="bg-[#fafafa] dark:bg-slate-800 border border-[#e8e8e8] dark:border-slate-700 flex items-center justify-center overflow-hidden px-[14px] py-[12px] rounded-[10px] w-full mt-2">
                                            <p className="font-normal text-[11px] text-slate-400 leading-[15px] text-center">
                                                {topCustomers.length} dari {counts.customers ?? 0} member aktif bertransaksi pada periode ini
                                            </p>
                                        </div>
                                    </div>
                                ) : <EmptyState message="Belum ada data pelanggan" icon="👥" />}
                            </div>
                        </div>

                        {/* Low stock alert snippet */}
                        {lowStockIngredients.length > 0 && (
                            <Card className="border-amber-200 dark:border-amber-800">
                                <STitle icon={IconAlertTriangle} sub={`${lowStockIngredients.length} item di bawah minimum`} accent={C.warning}>
                                    Peringatan Stok Bahan
                                </STitle>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {lowStockIngredients.map((item, i) => (
                                        <StockItem key={i} item={item} />
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Recent Transactions */}
                        <div className="bg-white dark:bg-slate-900 border border-[#e8e8e8] dark:border-slate-800 flex flex-col gap-[14px] items-start px-[18px] py-[16px] rounded-[16px] w-full">
                            {/* Head Row */}
                            <div className="flex gap-[10px] items-center w-full">
                                <div className="flex flex-1 flex-col gap-[2px] items-start min-w-0">
                                    <p className="font-semibold text-[16px] text-slate-900 dark:text-white leading-[1.4]">Transaksi Terbaru</p>
                                    <p className="font-medium text-[14px] text-slate-500 dark:text-slate-400 leading-[1.4]">8 transaksi terbaru</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('penjualan')}
                                    className="bg-[#f7f9fc] hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-[#e8e8e8] dark:border-slate-700 text-[#4d5360] dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    Riwayat lengkap
                                </button>
                            </div>
                            {recentTransactions.length > 0 ? (
                                <div className="overflow-x-auto w-full -mx-4 sm:mx-0">
                                    <table className="w-full text-sm min-w-[640px]">
                                        <thead>
                                            <tr className="border-b border-[#e8e8e8] dark:border-slate-800">
                                                {['Invoice', 'Tanggal', 'Pelanggan', 'Kasir', 'Total', 'Profit', 'Status'].map((h) => (
                                                    <th key={h} className="text-left py-2 px-3 text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTransactions.map((tx, i) => (
                                                <tr key={i} className="border-b border-[#f3f4f6] dark:border-slate-850 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                    {/* Invoice */}
                                                    <td className="py-3 px-3 text-[13px] font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                                        {tx.invoice}
                                                    </td>
                                                    {/* Tanggal (Date & Time split) */}
                                                    <td className="py-3 px-3 text-[13px] whitespace-nowrap">
                                                        {(() => {
                                                            const { date, time } = splitDateTime(tx.date);
                                                            return (
                                                                <div className="flex flex-col leading-tight">
                                                                    <span className="font-semibold text-slate-900 dark:text-white">{date}</span>
                                                                    <span className="text-[10px] text-slate-400 mt-0.5">{time}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    {/* Pelanggan */}
                                                    <td className="py-3 px-3 text-[13px] font-semibold text-slate-900 dark:text-white max-w-[140px] truncate">
                                                        {tx.customer}
                                                    </td>
                                                    {/* Kasir */}
                                                    <td className="py-3 px-3 text-[13px] text-slate-500 dark:text-slate-450 max-w-[120px] truncate">
                                                        {tx.cashier}
                                                    </td>
                                                    {/* Total */}
                                                    <td className="py-3 px-3 text-[13px] font-semibold text-slate-900 dark:text-white whitespace-nowrap tabular-nums">
                                                        {idr(tx.total)}
                                                    </td>
                                                    {/* Profit */}
                                                    <td className={`py-3 px-3 text-[13px] font-semibold whitespace-nowrap tabular-nums ${
                                                        tx.gross_profit > 0
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-red-650 dark:text-red-405'
                                                    }`}>
                                                        {idr(tx.gross_profit)}
                                                    </td>
                                                    {/* Status badge with indicator dot */}
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        {tx.status === 'completed' ? (
                                                            <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded-full px-2.5 py-0.5 text-[11px] font-semibold inline-flex items-center gap-1.5">
                                                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                                                Selesai
                                                            </span>
                                                        ) : tx.status === 'refunded' ? (
                                                            <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded-full px-2.5 py-0.5 text-[11px] font-semibold inline-flex items-center gap-1.5">
                                                                <span className="size-1.5 rounded-full bg-amber-500" />
                                                                Refund
                                                            </span>
                                                        ) : (
                                                            <span className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-full px-2.5 py-0.5 text-[11px] font-semibold inline-flex items-center gap-1.5">
                                                                <span className="size-1.5 rounded-full bg-red-500" />
                                                                Batal
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <EmptyState message="Belum ada transaksi" icon="🧾" />}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* PENJUALAN                                                   */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {activeTab === 'penjualan' && (
                    <div className="space-y-5">

                        {/* Financial KPI mini-row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Total Revenue',    value: compact(kpi.totalRevenue),  accent: C.primary,  icon: IconMoneybag     },
                                { label: 'Total Profit',     value: compact(kpi.totalProfit),   accent: C.success,  icon: IconTrendingUp   },
                                { label: 'Total COGS',       value: compact(kpi.totalCogs),     accent: C.danger,   icon: IconCurrencyDollar },
                                { label: 'Total Diskon',     value: compact(kpi.totalDiscount), accent: C.warning,  icon: IconDiscount2    },
                            ].map((k) => (
                                <KpiCard key={k.label} label={k.label} value={k.value}
                                    icon={k.icon} accent={k.accent} />
                            ))}
                        </div>

                        {/* Daily sales bar chart */}
                        <Card>
                            <STitle icon={IconChartBar} sub="Revenue · Profit · COGS · Transaksi per hari">Grafik Penjualan Harian</STitle>
                            {revenueTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={revenueTrend} barGap={3} barCategoryGap="25%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} className="dark:stroke-slate-700" />
                                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={(v) => compact(v).replace('Rp', '')} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<ChartTip />} />
                                        <Legend formatter={(v) => <span className="text-xs text-slate-500">{v}</span>} />
                                        <Bar dataKey="revenue"      name="Revenue"   fill={C.primary} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                                        <Bar dataKey="profit"       name="Profit"    fill={C.success} radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                                        <Bar dataKey="cogs"         name="COGS"      fill={C.danger}  radius={[4, 4, 0, 0]} fillOpacity={0.7}  />
                                        <Bar dataKey="transactions" name="Transaksi" fill={C.info}    radius={[4, 4, 0, 0]} fillOpacity={0.6}  />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <EmptyState message="Belum ada data harian" icon="📅" />}
                        </Card>

                        {/* Radar + Discount */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Card>
                                <STitle icon={IconPercentage} sub="Analisis per intensity">Radar Intensity</STitle>
                                {salesByIntensity.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-700" />
                                            <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                            {salesByIntensity.map((s, i) => (
                                                <Radar
                                                    key={s.code} name={s.code} dataKey={s.code}
                                                    stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]}
                                                    fillOpacity={0.12} strokeWidth={2}
                                                />
                                            ))}
                                            <Legend formatter={(v) => <span className="text-xs text-slate-500">{v}</span>} />
                                            <Tooltip content={<ChartTip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                ) : <EmptyState message="Belum ada data intensity" />}
                            </Card>

                            <Card>
                                <STitle icon={IconDiscount2} sub="Penggunaan diskon per kategori" accent={C.warning}>Analisis Diskon</STitle>
                                {discountUsage.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {discountUsage.map((d, i) => (
                                            <div
                                                key={i}
                                                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                                            >
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 truncate">{d.category}</p>
                                                <p className="text-xl font-bold tabular-nums" style={{ color: COLORS[i % COLORS.length] }}>
                                                    {compact(d.total_discount_given)}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{num(d.usage_count)} kali digunakan</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <EmptyState message="Tidak ada data diskon" />}
                            </Card>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* PRODUK                                                      */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {activeTab === 'produk' && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Top Variants rank list */}
                            <Card>
                                <STitle icon={IconStar} sub="Top 5 varian by qty">Top Varian Parfum</STitle>
                                {topVariants.length > 0 ? (
                                    <div className="space-y-3">
                                        {topVariants.map((v, i) => {
                                            const maxQty = topVariants[0]?.qty ?? 1;
                                            return (
                                                <div key={i}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-lg flex-shrink-0">{'🥇🥈🥉🏅🏅'[i] ?? '🏅'}</span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{v.name}</span>
                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 flex-shrink-0 capitalize">
                                                                        {v.gender}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-slate-400 tabular-nums">
                                                                    {num(v.qty)} unit · margin {v.margin}%
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2 tabular-nums">
                                                            {compact(v.revenue)}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${(v.qty / maxQty) * 100}%`, background: COLORS[i] }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <EmptyState message="Belum ada data varian" icon="🏅" />}
                            </Card>

                            {/* Margin analysis horizontal bar */}
                            <Card>
                                <STitle icon={IconChartBar} sub="Margin % per varian" accent={C.success}>Analisis Margin</STitle>
                                {topVariants.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={topVariants} layout="vertical" barSize={14}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} className="dark:stroke-slate-700" />
                                            <XAxis
                                                type="number" domain={[0, 80]}
                                                tickFormatter={(v) => `${v}%`}
                                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                axisLine={false} tickLine={false}
                                            />
                                            <YAxis
                                                dataKey="name" type="category"
                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                axisLine={false} tickLine={false} width={90}
                                            />
                                            <Tooltip content={<ChartTip />} />
                                            <Bar dataKey="margin" name="Margin %" radius={[0, 5, 5, 0]}>
                                                {topVariants.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <EmptyState message="Belum ada data margin" />}
                            </Card>
                        </div>

                        {/* Packaging table */}
                        <Card>
                            <STitle icon={IconPackage} sub="Top 5 packaging add-on terlaris" accent={C.info}>Packaging Terlaris</STitle>
                            {topPackaging.length > 0 ? (
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <table className="w-full text-sm min-w-[420px]">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                {['#', 'Packaging', 'Kode', 'Qty', 'Revenue'].map((h) => (
                                                    <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topPackaging.map((p, i) => (
                                                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">{i + 1}</td>
                                                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                                                    <td className="py-2.5 px-3 font-mono text-xs text-slate-400">{p.code}</td>
                                                    <td className="py-2.5 px-3 font-bold tabular-nums" style={{ color: COLORS[i % COLORS.length] }}>
                                                        {num(p.qty)}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white tabular-nums">
                                                        {compact(p.revenue)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <EmptyState message="Belum ada data packaging" icon="📦" />}
                        </Card>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* OPERASIONAL                                                 */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {activeTab === 'operasional' && (
                    <div className="space-y-5">

                        {/* Cash Drawer */}
                        {activeCashDrawer ? (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <IconLockOpen size={18} className="text-emerald-600 dark:text-emerald-400" />
                                    <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                                        Shift Aktif — Laci Kas Terbuka
                                    </h3>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-auto" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {[
                                        { label: 'Dibuka Oleh',     v: activeCashDrawer.opened_by },
                                        { label: 'Sejak',           v: activeCashDrawer.opened_at },
                                        { label: 'Modal Awal',      v: idr(activeCashDrawer.opening_cash) },
                                        { label: 'Total Penjualan', v: idr(activeCashDrawer.total_sales) },
                                        { label: 'Transaksi',       v: `${num(activeCashDrawer.transaction_count)} tx` },
                                        { label: 'Gross Profit',    v: compact(activeCashDrawer.gross_profit) },
                                    ].map(({ label, v }) => (
                                        <div key={label} className="bg-emerald-100 dark:bg-emerald-900/30 rounded-xl p-2.5">
                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-500 uppercase tracking-wider font-semibold">{label}</p>
                                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">{v}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <IconLock size={18} className="text-slate-400" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Tidak ada shift kasir yang aktif saat ini
                                </p>
                            </div>
                        )}

                        {/* Low stock grids */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <Card className={lowStockIngredients.length > 0 ? 'border-amber-200 dark:border-amber-800' : ''}>
                                <STitle
                                    icon={IconAlertTriangle}
                                    sub={`${lowStockIngredients.length} item`}
                                    accent={lowStockIngredients.length > 0 ? C.warning : C.success}
                                >
                                    Stok Bahan — Toko
                                </STitle>
                                {lowStockIngredients.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {lowStockIngredients.map((item, i) => (
                                            <StockItem key={i} item={item} />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState message="Stok toko aman ✅" icon="✅" />
                                )}
                            </Card>

                            <Card className={lowStockWarehouse.length > 0 ? 'border-red-200 dark:border-red-800' : ''}>
                                <STitle
                                    icon={IconAlertTriangle}
                                    sub={`${lowStockWarehouse.length} item`}
                                    accent={lowStockWarehouse.length > 0 ? C.danger : C.success}
                                >
                                    Stok Bahan — Gudang
                                </STitle>
                                {lowStockWarehouse.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {lowStockWarehouse.map((item, i) => (
                                            <StockItem key={i} item={item} variant="danger" />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState
                                        message={canFilterStore ? 'Stok gudang aman ✅' : 'Hanya Admin yang dapat melihat stok gudang'}
                                        icon="✅"
                                    />
                                )}
                            </Card>
                        </div>

                        {/* Sales people */}
                        <Card>
                            <STitle icon={IconUserCheck} sub="Performa tim sales" accent={C.success}>
                                Sales People Performance
                            </STitle>
                            {salesPeoplePerformance.length > 0 ? (
                                <div className="space-y-2.5">
                                    {salesPeoplePerformance.map((sp, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="text-xl flex-shrink-0">{'🥇🥈🥉🏅🏅'[i] ?? '🏅'}</span>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{sp.name}</p>
                                                    <p className="text-xs text-slate-400 tabular-nums">
                                                        {sp.code} · {num(sp.total_transactions)} transaksi
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-3">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{compact(sp.total_revenue)}</p>
                                                <p className="text-xs text-slate-400 tabular-nums">AOV {compact(sp.avg_order)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <EmptyState message="Belum ada data sales person" icon="👤" />}
                        </Card>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* TOKO (Super Admin only)                                     */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {activeTab === 'toko' && canFilterStore && (
                    <div className="space-y-5">

                        {/* Store cards grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {storePerformance.map((s, i) => (
                                <Card key={i} className="relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: COLORS[i % COLORS.length] }} />
                                    <div className="flex items-center justify-between mt-1 mb-2">
                                        <IconBuildingStore size={15} className="text-slate-400" />
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                            i === 0
                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                        }`}>#{i + 1}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate">{s.store_name}</p>
                                    <p className="text-lg font-bold tabular-nums truncate" style={{ color: COLORS[i % COLORS.length] }}>
                                        {compact(s.total_revenue)}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                                        {num(s.total_transactions)} tx · {s.margin}%
                                    </p>
                                </Card>
                            ))}
                        </div>

                        {/* Store comparison chart */}
                        <Card>
                            <STitle icon={IconBuildingStore} sub="Revenue & Profit per outlet">Perbandingan Toko</STitle>
                            {storePerformance.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={storePerformance} barGap={4} barCategoryGap="25%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} className="dark:stroke-slate-700" />
                                        <XAxis
                                            dataKey="store_name"
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            axisLine={false} tickLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={(v) => compact(v).replace('Rp', '')}
                                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                                            axisLine={false} tickLine={false}
                                        />
                                        <Tooltip content={<ChartTip />} />
                                        <Legend formatter={(v) => <span className="text-xs text-slate-500">{v}</span>} />
                                        <Bar dataKey="total_revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                                            {storePerformance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Bar>
                                        <Bar dataKey="total_profit" name="Profit" fill={C.success} fillOpacity={0.75} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <EmptyState message="Belum ada data toko" icon="🏪" />}
                        </Card>

                        {/* Store detail table */}
                        <Card>
                            <STitle icon={IconChartBar} sub="Detail performa per outlet">Detail Performa Toko</STitle>
                            {storePerformance.length > 0 ? (
                                <div className="overflow-x-auto -mx-4 sm:mx-0">
                                    <table className="w-full text-sm min-w-[640px]">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                {['Toko', 'Kode', 'Revenue', 'Profit', 'Tx', 'AOV', 'Margin', 'Share'].map((h) => (
                                                    <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const totalRev = storePerformance.reduce((a, b) => a + b.total_revenue, 0);
                                                return storePerformance.map((s, i) => {
                                                    const share = totalRev > 0
                                                        ? Math.round((s.total_revenue / totalRev) * 100)
                                                        : 0;
                                                    return (
                                                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                                                {'🥇🥈🥉🏅🏅'[i] ?? '🏅'} {s.store_name}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono text-xs text-slate-400">{s.store_code}</td>
                                                            <td className="py-2.5 px-3 font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap tabular-nums">
                                                                {compact(s.total_revenue)}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                                                                {compact(s.total_profit)}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 tabular-nums">
                                                                {num(s.total_transactions)}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap tabular-nums">
                                                                {compact(s.avg_order)}
                                                            </td>
                                                            <td className={`py-2.5 px-3 font-bold tabular-nums ${
                                                                s.margin >= 50 ? 'text-emerald-600 dark:text-emerald-400'
                                                                : s.margin >= 35 ? 'text-amber-600 dark:text-amber-400'
                                                                :                  'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                {s.margin}%
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="flex items-center gap-2 min-w-[80px]">
                                                                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full rounded-full transition-all duration-500"
                                                                            style={{ width: `${share}%`, background: COLORS[i % COLORS.length] }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-semibold text-slate-500 w-7 tabular-nums">{share}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            ) : <EmptyState message="Belum ada data toko" icon="🏪" />}
                        </Card>
                    </div>
                )}
            </div>
        </>
    );
}

Dashboard.layout = (page) => <DashboardLayout children={page} />;
