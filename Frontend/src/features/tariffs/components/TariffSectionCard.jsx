import React from 'react';

// Color themes mapping for tariff section cards
const THEME_MAP = {
  slate: {
    cardBorder: 'border-stone-200/90 hover:border-stone-300',
    headerBg: 'bg-stone-50/70 border-stone-200/80',
    title: 'text-stone-900',
    subtitle: 'text-stone-500',
    icon: 'text-slate-700',
    badge: 'bg-stone-100 text-stone-700 border-stone-200'
  },
  emerald: {
    cardBorder: 'border-emerald-200/90',
    headerBg: 'bg-emerald-50/70 border-emerald-200/80',
    title: 'text-emerald-950',
    subtitle: 'text-emerald-700/90',
    icon: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300/80'
  },
  rose: {
    cardBorder: 'border-rose-200/90',
    headerBg: 'bg-rose-50/70 border-rose-200/80',
    title: 'text-rose-950',
    subtitle: 'text-rose-700/90',
    icon: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-800 border-rose-300/80'
  },
  sky: {
    cardBorder: 'border-sky-200/90',
    headerBg: 'bg-sky-50/70 border-sky-200/80',
    title: 'text-sky-950',
    subtitle: 'text-sky-700/90',
    icon: 'text-sky-600',
    badge: 'bg-sky-100 text-sky-800 border-sky-300/80'
  },
  blue: {
    cardBorder: 'border-blue-200/90',
    headerBg: 'bg-blue-50/70 border-blue-200/80',
    title: 'text-blue-950',
    subtitle: 'text-blue-700/90',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800 border-blue-300/80'
  },
  indigo: {
    cardBorder: 'border-indigo-200/90',
    headerBg: 'bg-indigo-50/70 border-indigo-200/80',
    title: 'text-indigo-950',
    subtitle: 'text-indigo-700/90',
    icon: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300/80'
  }
};

/**
 * Shared Tariff Section Card Component.
 * Encapsulates the outer card container, color themes, header structure, title/subtitle, badge, and body container.
 */
export default function TariffSectionCard({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  action,
  colorTheme = 'slate',
  className = '',
  bodyClassName = 'p-5 space-y-4',
  children
}) {
  const theme = THEME_MAP[colorTheme] || THEME_MAP.slate;

  return (
    <div className={`bg-white border ${theme.cardBorder} rounded-2xl overflow-hidden shadow-2xs transition-all ${className}`}>
      {/* Shared Section Header */}
      <div className={`${theme.headerBg} border-b px-5 py-3.5 flex items-center justify-between`}>
        <div>
          <h2 className={`text-base font-extrabold ${theme.title} tracking-tight flex items-center gap-2`}>
            {Icon && <Icon className={`w-4 h-4 ${theme.icon} stroke-[2.5]`} />}
            <span>{title}</span>
          </h2>
          {subtitle && (
            <p className={`text-xs ${theme.subtitle} font-medium mt-0.5`}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right side: Action button or Badge pill */}
        {action ? (
          action
        ) : badgeText ? (
          <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${theme.badge}`}>
            {badgeText}
          </span>
        ) : null}
      </div>

      {/* Shared Body Container */}
      <div className={bodyClassName}>
        {children}
      </div>
    </div>
  );
}
