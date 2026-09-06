import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

function ToastItem({ toast, onRemove }) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4500;

  useEffect(() => {
    if (duration <= 0 || isHovered) return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onRemove(toast.id);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [duration, isHovered, onRemove, toast.id]);

  const theme = {
    success: {
      border: 'border-l-emerald-500',
      iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
      progressBg: 'bg-cyan-500',
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
      className={`relative flex items-start gap-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200/80 ${theme.border} border-l-4 pointer-events-auto transition-all duration-200 hover:translate-y-[-2px] animate-in fade-in slide-in-from-bottom-5`}
    >
      <div className={`p-2 rounded-xl border shrink-0 ${theme.iconBg}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900 tracking-tight">{toast.title}</h4>
          {toast.code && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 border border-stone-200/60 font-mono">
              {toast.code}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-600 font-medium mt-0.5 leading-relaxed">{toast.message}</p>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="text-stone-400 hover:text-stone-600 transition p-1 rounded-lg hover:bg-stone-100 cursor-pointer shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {toast.action && (
        <div className="mt-2 pt-2 border-t border-stone-100 flex justify-end">
          <button
            onClick={() => {
              toast.action.onClick && toast.action.onClick();
              onRemove(toast.id);
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            {toast.action.label || 'Action'}
          </button>
        </div>
      )}

      {/* timer bar */}
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

    setToasts((prev) => [...prev.slice(-4), newToast]);
  }, []);

  const formatErrorMessage = (errOrMsg) => {
    let msg = typeof errOrMsg === 'string' ? errOrMsg : (errOrMsg?.message || '');
    if (
      !msg ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('Network Error') ||
      msg.includes('connection error') ||
      errOrMsg?.isNetworkError
    ) {
      return 'Server connection error. Please check if the server is connected.';
    }
    return msg;
  };

  const toast = {
    success: (message, options = {}) => addToast({ type: 'success', title: options.title || 'Success', message, code: options.code || 200, ...options }),
    error: (errOrMsg, options = {}) => {
      const message = formatErrorMessage(errOrMsg);
      const isNet = message.includes('Server connection error');
      return addToast({
        type: 'error',
        title: options.title || (isNet ? 'Server Connection Error' : (typeof errOrMsg === 'object' && errOrMsg?.title) ? errOrMsg.title : 'Error'),
        message,
        code: options.code || (typeof errOrMsg === 'object' && errOrMsg?.code) ? errOrMsg.code : 503,
        ...options
      });
    },
    warning: (message, options = {}) => addToast({ type: 'warning', title: options.title || 'Warning', message, code: options.code || 400, ...options }),
    info: (message, options = {}) => addToast({ type: 'info', title: options.title || 'Notification', message, code: options.code || 200, ...options }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
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
