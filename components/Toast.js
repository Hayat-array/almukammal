'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="toast-portal" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-close"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .toast-portal {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          pointer-events: none;
          max-width: 90vw;
          width: 380px;
        }

        .toast-item {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1.15rem;
          border-radius: 9999px;
          background: rgba(11, 15, 25, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #f8fafc;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
          font-size: 0.9rem;
          font-weight: 500;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: bold;
          flex-shrink: 0;
        }

        .toast-success .toast-icon {
          background: #10b981;
          color: white;
        }

        .toast-error .toast-icon {
          background: #ef4444;
          color: white;
        }

        .toast-warning .toast-icon {
          background: #f59e0b;
          color: white;
        }

        .toast-info .toast-icon {
          background: #3b82f6;
          color: white;
        }

        .toast-message {
          flex: 1;
          line-height: 1.4;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: color 0.15s;
        }

        .toast-close:hover {
          color: #ffffff;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

const DEFAULT_TOAST = {
  addToast: (msg) => {
    if (typeof window !== 'undefined') console.log('Toast:', msg);
  },
  removeToast: () => {},
};

export function useToast() {
  const context = useContext(ToastContext);
  return context || DEFAULT_TOAST;
}
