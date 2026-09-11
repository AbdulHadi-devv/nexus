import { createContext, useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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

  // Exit animation starts before the toast is removed
  const exitDelay = 300; // must match the .toast-exit animation duration

  store.timers[id] = window.setTimeout(() => {
    store.markExiting(id);

    // After the exit animation plays, remove the toast from state
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

export function ToastProvider({ children }) {
  return (
    <ToastContext.Provider value={{ showToast: toast, removeToast: dismiss }}>
      {children}
      <ToastPortal />
    </ToastContext.Provider>
  );
}

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
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : ''}`}
        >
          <span className="toast-icon">
            {t.type === 'success' && '✅'}
            {t.type === 'error' && '❌'}
            {t.type === 'info' && 'ℹ️'}
            {t.type === 'warning' && '⚠️'}
          </span>
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => dismiss(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}