import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    dismiss: removeToast,
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-slate-900/95 border-emerald-500/40 text-emerald-200 shadow-emerald-500/10';
      case 'error':
        return 'bg-slate-900/95 border-rose-500/40 text-rose-200 shadow-rose-500/10';
      case 'warning':
        return 'bg-slate-900/95 border-amber-500/40 text-amber-200 shadow-amber-500/10';
      default:
        return 'bg-slate-900/95 border-blue-500/40 text-blue-200 shadow-blue-500/10';
    }
  };

  return (
    <ToastContext.Provider value={{ toast, showToast: addToast }}>
      {children}
      {/* Toast Render Container */}
      <div 
        aria-live="polite" 
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${getToastStyles(
              t.type
            )}`}
          >
            <div className="flex items-start gap-2.5 pt-0.5">
              {getToastIcon(t.type)}
              <div className="text-xs font-semibold leading-relaxed">
                {t.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Dismiss toast notification"
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
  return context.toast;
};

export default ToastContext;
