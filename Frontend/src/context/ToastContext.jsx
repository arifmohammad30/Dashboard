import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

function ToastItem({ toast, onRemove }) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4500;

  useEffect(() => {
    if (duration <= 0 || isHovered) return;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onRemove(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [duration, isHovered, onRemove, toast.id]);

  const theme = {
    success: {
      border: 'border-l-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      progressBg: 'bg-emerald-500',
      icon: CheckCircle2
    },
    error: {
      border: 'border-l-rose-500',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
      progressBg: 'bg-rose-500',
      icon: AlertCircle
    },
    warning: {
      border: 'border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
      progressBg: 'bg-amber-500',
      icon: AlertTriangle
    },
    info: {
      border: 'border-l-indigo-500',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      progressBg: 'bg-indigo-500',
      icon: Info
    }
  }[toast.type] || {
    border: 'border-l-indigo-500',
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    progressBg: 'bg-indigo-500',
    icon: Info
  };

  const IconComponent = theme.icon;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`pointer-events-auto w-full bg-white/95 backdrop-blur-xl border border-stone-200/90 border-l-4 ${theme.border} shadow-[0_16px_40px_rgba(0,0,0,0.12)] rounded-2xl p-4 flex flex-col gap-2.5 transition-all duration-300 transform hover:-translate-y-0.5 animate-in fade-in slide-in-from-top-4 relative overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${theme.iconBg} shadow-2xs`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0 flex-1 pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-extrabold text-stone-900 tracking-tight truncate">{toast.title}</h4>
              <span className="text-[10px] font-semibold text-stone-400 shrink-0">Just now</span>
            </div>
            <p className="text-xs text-stone-600 font-medium leading-relaxed mt-0.5 break-words">
              {toast.message}
            </p>
          </div>
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition-colors shrink-0 cursor-pointer -mr-1 -mt-1"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {toast.action && (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => {
              if (toast.action.onClick) toast.action.onClick();
              onRemove(toast.id);
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            {toast.action.label || 'Action'}
          </button>
        </div>
      )}

      {/* timer bar  */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100/80 overflow-hidden">
          <div
            className={`h-full ${theme.progressBg} transition-all duration-75 ease-linear opacity-80`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'success', title, message, code, duration = 4500, action }) => {
    const id = Date.now() + Math.random().toString();
    const statusCode = code || (type === 'success' ? 200 : type === 'error' ? 500 : type === 'warning' ? 400 : 200);
    const newToast = { id, type, title, message, code: statusCode, duration, action };


    if (typeof console !== 'undefined' && console.groupCollapsed) {
      const colorMap = {
        success: '#10b981',
        error: '#f43f5e',
        warning: '#f59e0b',
        info: '#6366f1'
      };
      console.groupCollapsed(
        `%c[Server Response ${statusCode}] %c${title}`,
        `color: ${colorMap[type] || '#6366f1'}; font-weight: bold; padding: 2px 4px; border-radius: 3px; background: rgba(0,0,0,0.05);`,
        'font-weight: bold; color: #1e293b;'
      );
      console.log('Timestamp:', new Date().toISOString());
      console.log('Notification Type:', type);
      console.log('HTTP Status Code:', statusCode);
      console.log('Title:', title);
      console.log('Message:', message);
      console.groupEnd();
    }

    setToasts((prev) => [...prev.slice(-4), newToast]);
  }, []);

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
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
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
