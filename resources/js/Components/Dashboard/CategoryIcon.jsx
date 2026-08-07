import React from 'react';

const VARIANTS = {
    teal: {
        bg: 'from-teal-400 to-cyan-600',
        outline: 'outline-teal-200/60',
        glow: 'from-teal-200 to-teal-200/0',
        shadow: '0px 0px 0px 0.5px rgba(44, 156, 168, 1.00), 0px 0px 0.224852px 0.224852px rgba(0,0,0,0.07), inset 0px 2px 3px 0px rgba(72, 208, 223, 0.50)',
    },
    orange: {
        bg: 'from-amber-400 to-orange-600',
        outline: 'outline-orange-200/60',
        glow: 'from-orange-200 to-orange-200/0',
        shadow: '0px 0px 0px 0.5px rgba(217, 119, 6, 1.00), 0px 0px 0.224852px 0.224852px rgba(0,0,0,0.07), inset 0px 2px 3px 0px rgba(253, 230, 138, 0.50)',
    },
    emerald: {
        bg: 'from-emerald-400 to-teal-600',
        outline: 'outline-emerald-200/60',
        glow: 'from-emerald-200 to-emerald-200/0',
        shadow: '0px 0px 0px 0.5px rgba(16, 185, 129, 1.00), 0px 0px 0.224852px 0.224852px rgba(0,0,0,0.07), inset 0px 2px 3px 0px rgba(167, 243, 208, 0.50)',
    },
    blue: {
        bg: 'from-blue-400 to-indigo-600',
        outline: 'outline-blue-200/60',
        glow: 'from-blue-200 to-blue-200/0',
        shadow: '0px 0px 0px 0.5px rgba(37, 99, 235, 1.00), 0px 0px 0.224852px 0.224852px rgba(0,0,0,0.07), inset 0px 2px 3px 0px rgba(191, 219, 254, 0.50)',
    },
    purple: {
        bg: 'from-violet-400 to-purple-600',
        outline: 'outline-violet-200/60',
        glow: 'from-violet-200 to-violet-200/0',
        shadow: '0px 0px 0px 0.5px rgba(124, 58, 237, 1.00), 0px 0px 0.224852px 0.224852px rgba(0,0,0,0.07), inset 0px 2px 3px 0px rgba(221, 214, 254, 0.50)',
    },
};

export default function CategoryIcon({
    icon,
    variant = 'teal',
    size = 'size-9',
    className = '',
}) {
    const v = VARIANTS[variant] || VARIANTS.teal;

    return (
        <div
            className={`${size} p-2 relative bg-gradient-to-b ${v.bg} rounded-lg outline outline-[0.50px] outline-offset-[-0.50px] ${v.outline} inline-flex justify-center items-center gap-2.5 overflow-hidden flex-shrink-0 ${className}`}
            style={{ boxShadow: v.shadow }}
        >
            <div className={`w-20 h-9 left-[-22px] top-[33px] absolute bg-gradient-to-r ${v.glow} rounded-full blur-[5px] pointer-events-none`} />
            <div className="size-5 relative z-10 overflow-hidden flex items-center justify-center text-white">
                {React.isValidElement(icon)
                    ? React.cloneElement(icon, { size: icon.props.size || 20 })
                    : icon}
            </div>
        </div>
    );
}
