import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'success', title, message, code = 200, duration = 4000 }) => {
    const id = Date.now() + Math.random().toString();
    const newToast = { id, type, title, message, code };

    setToasts((prev) => [...prev.slice(-4), newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message, options = {}) => addToast({ type: 'success', title: options.title || 'Success', message, code: options.code || 200, ...options }),
    error: (message, options = {}) => addToast({ type: 'error', title: options.title || 'Error', message, code: options.code || 500, ...options }),
    warning: (message, options = {}) => addToast({ type: 'warning', title: options.title || 'Warning', message, code: options.code || 400, ...options }),
    info: (message, options = {}) => addToast({ type: 'info', title: options.title || 'Notification', message, code: options.code || 200, ...options }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.12)] rounded-2xl p-4 flex items-start justify-between gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-3"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {t.type === 'error' && (
                  <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {t.type === 'warning' && (
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                {t.type === 'info' && (
                  <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-sky-600">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-xs text-stone-900 truncate">{t.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                    t.type === 'success' ? 'bg-emerald-100 text-emerald-800' :
                    t.type === 'error' ? 'bg-rose-100 text-rose-800' :
                    t.type === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                  }`}>
                    HTTP {t.code}
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-medium mt-1 leading-snug break-words">
                  {t.message}
                </p>
              </div>
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
