import { createContext, useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

let toastIdCounter = 0;

const store = {
  toasts: [],
  listeners: new Set(),
  timers: {},

  add(toast) {
    this.toasts = [...this.toasts, toast];
    this.emit();
  },

  markExiting(id) {
    this.toasts = this.toasts.map((t) =>
      t.id === id ? { ...t, exiting: true } : t
    );
    this.emit();
  },

  remove(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    if (this.timers[id]) delete this.timers[id];
    this.emit();
  },

  emit() {
    const snapshot = [...this.toasts];
    this.listeners.forEach((fn) => {
      try { fn(snapshot); } catch (e) {}
    });
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
};

function toast(message, type = 'success', duration = 2500) {
  const id = ++toastIdCounter;
  store.add({ id, message, type, exiting: false });

  const exitDelay = 300;

  store.timers[id] = window.setTimeout(() => {
    store.markExiting(id);
    store.timers[id] = window.setTimeout(() => {
      store.remove(id);
    }, exitDelay);
  }, duration);

  return id;
}

function dismiss(id) {
  if (store.timers[id]) {
    window.clearTimeout(store.timers[id]);
    delete store.timers[id];
  }
  store.markExiting(id);
  setTimeout(() => store.remove(id), 300);
}

// Expose globally so non-React code (services/utils.js) can also fire toasts
if (typeof window !== 'undefined') {
  window.__nexus_toast = toast;
}

export function ToastProvider({ children }) {
  return (
    <ToastContext.Provider value={{ showToast: toast, removeToast: dismiss }}>
      {children}
      <ToastPortal />
    </ToastContext.Provider>
  );
}

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

// Inline styles — cannot be overridden by any stylesheet rule
const containerStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  left: 'auto',
  bottom: 'auto',
  zIndex: 2147483647,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '12px',
  width: 'auto',
  maxWidth: 'min(380px, calc(100vw - 40px))',
  minWidth: 0,
  height: 'auto',
  margin: 0,
  padding: 0,
  pointerEvents: 'none',
  boxSizing: 'border-box',
  transform: 'none',
};

const toastStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 16px',
  borderRadius: '14px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  boxShadow:
    '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  pointerEvents: 'all',
  width: '100%',
  maxWidth: '380px',
  minWidth: 0,
  position: 'relative',
  overflow: 'hidden',
  flexShrink: 0,
  boxSizing: 'border-box',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const iconStyle = {
  flexShrink: 0,
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
  position: 'relative',
};

const messageStyle = {
  flex: 1,
  fontSize: '0.9rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  lineHeight: 1.4,
  letterSpacing: '0.2px',
  wordWrap: 'break-word',
  overflowWrap: 'break-word',
  minWidth: 0,
};

const closeStyle = {
  background: 'rgba(0, 0, 0, 0.05)',
  border: '1px solid transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
  lineHeight: 1,
  transition: 'all 0.25s ease',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
};

function ToastPortal() {
  const [toasts, setToasts] = useState(store.toasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setToasts([...store.toasts]);

    const unsubscribe = store.subscribe((newToasts) => {
      setToasts(newToasts);
    });

    return () => unsubscribe();
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="toast-container" style={containerStyle}>
      {toasts.map((t) => {
        const Icon = TOAST_ICONS[t.type] || CheckCircle2;
        return (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : ''}`}
            style={toastStyle}
          >
            <span className="toast-icon" style={iconStyle}>
              <Icon size={22} strokeWidth={2.5} />
            </span>
            <span className="toast-message" style={messageStyle}>
              {t.message}
            </span>
            <button
              type="button"
              className="toast-close"
              style={closeStyle}
              onClick={() => dismiss(t.id)}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}