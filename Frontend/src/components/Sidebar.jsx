import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart,
  FileText,
  Activity,
  Bell,
  MapPin,
  Zap,
  CreditCard,
  Receipt,
  Percent,
  History,
  Users,
  LogOut,
  UserCheck,
  Shield
} from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { useAuthorization } from '../features/auth/hooks/useAuthorization';
import { PERMISSIONS } from '../config/permissions';

const navGroups = [
  {
    title: 'Dashboard',
    items: [
      { name: 'Analytics', icon: BarChart, path: '/analytics', permission: PERMISSIONS.ANALYTICS_VIEW },
      { name: 'Reports', icon: FileText, path: '/reports', permission: PERMISSIONS.REPORTS_VIEW },
      { name: 'Alerts', icon: Bell, path: '/alerts', permission: PERMISSIONS.ALERTS_VIEW },
    ],
  },
  {
    title: 'Operations',
    items: [
      { name: 'Live Sessions', icon: Activity, path: '/live-sessions', permission: PERMISSIONS.SESSION_VIEW },
      { name: 'Session History', icon: History, path: '/session-history', permission: PERMISSIONS.SESSION_VIEW },
    ],
  },
  {
    title: 'Charging',
    items: [
      { name: 'Charging Stations', icon: MapPin, path: '/charging-stations', permission: PERMISSIONS.STATION_VIEW },
      { name: 'Charge Points', icon: Zap, path: '/charge-points', permission: PERMISSIONS.CHARGE_POINT_VIEW },
      { name: 'Fleets', icon: Users, path: '/fleets', permission: PERMISSIONS.FLEET_VIEW },
      { name: 'Tariffs', icon: CreditCard, path: '/tariffs', permission: PERMISSIONS.TARIFF_VIEW },
      { name: 'Bills', icon: Receipt, path: '/bills', permission: PERMISSIONS.BILL_VIEW },
      { name: 'Discounts', icon: Percent, path: '/discounts', permission: PERMISSIONS.DISCOUNT_VIEW },
    ],
  },
  {
    title: 'Teams',
    items: [
      { name: 'Team Members', icon: UserCheck, path: '/team-members', permission: PERMISSIONS.TEAM_VIEW },
      { name: 'Groups', icon: Users, path: '/groups', permission: PERMISSIONS.GROUP_VIEW },
      { name: 'Permission Rules', icon: Shield, path: '/permission-rules', permission: PERMISSIONS.PERMISSION_RULE_VIEW },
    ],
  },
  {
    title: 'Payments',
    items: [
      { name: 'Payment Providers', icon: CreditCard, path: '/payment-providers', permission: PERMISSIONS.PAYMENT_VIEW },
      { name: 'Payment Logs', icon: History, path: '/payment-logs', permission: PERMISSIONS.PAYMENT_LOGS_VIEW },
    ],
  },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { logout } = useAuth();
  const { hasPermission, user, role } = useAuthorization();

  // Filter navigation items using the centralized authorization layer
  const filteredNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-950/95 backdrop-blur-2xl border-r border-slate-900 flex flex-col transform transition-all duration-300 ease-in-out md:relative ${isOpen ? 'translate-x-0 md:ml-0' : '-translate-x-full md:-ml-64'}`}>
      <div className="h-16 flex items-center justify-between gap-3 px-4 border-b border-slate-900 shrink-0">
        {/* Logo Card Container */}
        <NavLink
          to="/"
          className="flex-1 min-w-0 bg-white border-2 border-[#4DA944] rounded-lg px-3 py-1.5 flex items-center justify-center shadow-xs"
        >
          <img
            src="/logo-2.jpeg"
            alt="openev.io"
            className="h-5 sm:h-5.5 lg:h-6 w-auto max-w-[135px] object-contain object-left"
          />
        </NavLink>

        {/* Separate Close Cross Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 text-slate-100 bg-slate-900 hover:bg-slate-800 hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer border border-slate-800 shadow-2xs"
          aria-label="Close menu"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pt-3.5 pb-6 px-4 space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {filteredNavGroups.map((group, idx) => (
          <div key={idx}>
            <h2 className="px-3 text-[11px] font-black text-slate-300 uppercase tracking-widest mb-2.5 opacity-100">
              {group.title}
            </h2>

            <ul className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;

                return (
                  <li key={itemIdx}>
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setIsOpen(false);
                        }
                      }}
                      className={({ isActive }) =>
                        `relative w-[calc(100%+2rem)] flex items-center justify-between py-2.5 pr-7 pl-7 rounded-none -ml-4 text-sm font-medium transition-colors duration-200 cursor-pointer active:scale-[0.98] group border-l-2 overflow-hidden ${
                          isActive
                            ? 'text-white border-[#4DA944] shadow-[inset_1px_0_0_rgba(255,255,255,0.1)]'
                            : 'text-slate-400 border-transparent hover:border-l-[#4DA944]/60 hover:text-slate-100 hover:bg-gradient-to-r hover:from-[#4DA944]/15 hover:to-transparent'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className={`absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#4DA944]/25 to-transparent transition-transform duration-700 ease-out z-0 ${isActive ? 'translate-x-0' : '-translate-x-full'}`}></div>

                          <div className="flex items-center gap-3 relative z-10">
                            <Icon
                              size={18}
                              className={isActive ? 'text-[#4DA944] drop-shadow-[0_0_6px_rgba(77,169,68,0.5)]' : 'text-slate-400 group-hover:text-[#4DA944] transition-colors'}
                            />
                            <span>{item.name}</span>
                          </div>

                          {item.count && (
                            <span
                              className={`relative z-10 text-xs py-0.5 px-2 rounded-full transition-colors ${
                                isActive
                                  ? 'bg-[#4DA944]/20 text-[#6bd65f] border border-[#4DA944]/30'
                                  : 'bg-slate-900 text-slate-400 group-hover:bg-slate-800'
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User Footer Profile & Role Display */}
      <div className="p-4 border-t border-slate-900 shrink-0 bg-slate-950/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[#4DA944] font-bold shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserCheck className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Admin User'}</p>
              <p className="text-[10px] text-slate-300 font-medium truncate">{role || 'Operator'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
