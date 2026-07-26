import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const isChargePointsPage = location.pathname.startsWith('/charge-points');
  const isChargingStationsPage = location.pathname.startsWith('/charging-stations');
  const isLiveSessionsPage = location.pathname.startsWith('/live-sessions');
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
    <div className="flex h-screen w-full overflow-hidden text-stone-800 relative z-0 bg-orange-50/50">
      {/* Sunset Animated Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/15 blur-[120px]" />
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full bg-amber-400/20 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[20%] w-[35%] h-[35%] rounded-full bg-yellow-400/15 blur-[100px]" />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-20 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative z-0">
        <header className="h-16 flex items-center justify-between px-6 neo-outset-30-static shrink-0 z-10 mx-4 md:mx-8 mt-4 rounded-2xl">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-xl text-stone-500 hover:text-indigo-600 neo-button transition"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="font-semibold  uppercase  text-[17px] text-slate-800 tracking-tight hidden sm:block">
              {isChargePointsPage ? 'Charge Point Management' :
                isChargingStationsPage ? 'Charging Station Management' :
                  isLiveSessionsPage ? 'Live Session Management' : ''}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="group p-2.5 rounded-xl neo-button !shadow-[0_6px_20px_rgba(0,0,0,0.15),0_0_15px_var(--shadow-light)] transition-all duration-300 cursor-pointer outline-none flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,1)] group-hover:brightness-125 group-hover:drop-shadow-[0_0_20px_rgba(245,158,11,1)] group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>

            <div className="relative" ref={userMenuRef}>
              <div
                className="w-10 h-10 rounded-full neo-button !shadow-[0_6px_20px_rgba(0,0,0,0.15),0_0_15px_var(--shadow-light)] flex items-center justify-center cursor-pointer transition-all duration-300 group"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <button className="cursor-pointer outline-none flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,1)] group-hover:brightness-125 group-hover:drop-shadow-[0_0_20px_rgba(99,102,241,1)] group-hover:scale-110 transition-all duration-300" />
                </button>
              </div>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-sm font-bold text-stone-800">{user?.email || 'admin@example.com'}</p>
                    <p className="text-xs text-stone-500">Administrator</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-2 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 md:px-10 py-6">
          <div className="w-full max-w-[1380px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
