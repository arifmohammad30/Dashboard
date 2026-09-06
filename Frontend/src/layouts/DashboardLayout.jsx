import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../features/auth/context/AuthContext';
import finalLogoSvg from '../assets/final-logo.svg';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();

  const isChargePointsPage = location.pathname.startsWith('/charge-points');
  const isChargingStationsPage = location.pathname.startsWith('/charging-stations');
  const isLiveSessionsPage = location.pathname.startsWith('/live-sessions');
  const isSessionHistoryPage = location.pathname.startsWith('/session-history');
  const isSessionLogsPage = location.pathname.startsWith('/session-logs');
  const isTariffsPage = location.pathname.startsWith('/tariffs');
  const isFleetsPage = location.pathname.startsWith('/fleets');
  const isBillsPage = location.pathname.startsWith('/bills') || location.pathname.startsWith('/billing') || location.pathname.startsWith('/invoices');
  const isDiscountsPage = location.pathname.startsWith('/discounts');
  const isAnalyticsPage = location.pathname.startsWith('/analytics');

  const isPaymentsPage = location.pathname.startsWith('/payment-providers') || location.pathname.startsWith('/payment-logs');
  const isTeamsPage = location.pathname.startsWith('/team-members') || location.pathname.startsWith('/teams') || location.pathname.startsWith('/groups') || location.pathname.startsWith('/permission-rules');


  const { logout, user } = useAuth();
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden text-stone-800 relative z-0 bg-slate-50">

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-20 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-0">
        <header className="h-16 flex items-center justify-between px-6 bg-white border border-stone-200/80 shadow-2xs shrink-0 z-10 mx-3 md:mx-4 mt-1.5 rounded-2xl">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <div className="flex items-center gap-3 animate-in fade-in duration-200">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 -ml-2 rounded-xl text-stone-600 hover:text-slate-900 bg-stone-100/90 hover:bg-stone-200 transition cursor-pointer border border-stone-200/80 shrink-0"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>

                {/* Brand Logo in Top Navbar when Sidebar is closed */}
                <Link
                  to="/"
                  className="flex items-center min-w-0 focus:outline-none"
                  title="openEV.io Dashboard"
                >
                  <img
                    src={finalLogoSvg}
                    alt="openev.io"
                    className="h-5 sm:h-5.5 w-auto max-w-[110px] object-contain"
                  />
                </Link>

                <div className="h-5 w-px bg-stone-200 hidden sm:block mx-0.5"></div>
              </div>
            )}
            <div className="font-semibold uppercase text-[17px] text-slate-800 tracking-tight hidden sm:block">
              {isChargePointsPage ? 'Charge Point Management' :
                isChargingStationsPage ? 'Charging Station Management' :
                  (isLiveSessionsPage || isSessionHistoryPage || isSessionLogsPage) ? 'Session Management' :
                    isTariffsPage ? 'Tariff Management' :
                      isFleetsPage ? 'Fleet Management' :
                        isBillsPage ? 'Billing & Invoicing' :
                          isDiscountsPage ? 'Discount Management' :
                            isAnalyticsPage ? 'Analytics & Intelligence' :
                              isPaymentsPage ? 'Payment Gateway & Integration' :
                                isTeamsPage ? 'Teams & Access Management' : ''}

            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-2xl bg-white/90 border-2 border-stone-300 hover:border-slate-800 transition cursor-pointer outline-none flex items-center justify-center shadow-2xs active:scale-95">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>

            {/* User Profile Pill & Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`w-10 h-10 rounded-full bg-stone-100/80 hover:bg-stone-200/80 border-2 transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 ${isUserMenuOpen ? 'border-[#1EB8D4] ring-2 ring-[#1EB8D4]/20' : 'border-stone-300 hover:border-slate-800'}`}
                aria-label="User Profile"
              >
                <span className="font-extrabold text-sm text-[#1EB8D4]">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl border-2 border-stone-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-3 pb-3 border-b border-stone-200">
                    <div className="w-10 h-10 rounded-full bg-[#1EB8D4]/10 border-2 border-[#1EB8D4]/30 flex items-center justify-center text-[#1EB8D4] font-extrabold text-base shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-stone-900 text-sm truncate">{user?.name || 'Admin User'}</p>
                      <p className="text-xs text-stone-500 font-medium truncate">{user?.email || 'admin@openev.io'}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-extrabold bg-[#1EB8D4]/15 text-[#148296] border border-[#1EB8D4]/30 rounded-full uppercase tracking-wider">
                        {role || 'System Admin'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-2 rounded-xl mt-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-5 pt-2.5 pb-4 transform-gpu translate-z-0 custom-scrollbar">
          <div className="w-full max-w-[1380px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
