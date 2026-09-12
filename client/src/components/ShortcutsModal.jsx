import { useEffect, useState } from 'react';
import { Keyboard, X } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Double rAF ensures browser paints initial state first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      const timeout = setTimeout(() => setShouldRender(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const shortcuts = [
    { key: 'Ctrl + K', action: 'Focus search' },
    { key: 'Ctrl + D', action: 'Toggle theme' },
    { key: 'Alt + N', action: 'Create new item' },
    { key: 'Alt + G', action: 'Go to Graph' },
    { key: 'Alt + H', action: 'Scroll to top' },
    { key: 'Alt + K', action: 'Show this menu' },
    { key: 'Ctrl + Shift + L', action: 'Logout' },
    { key: 'Esc', action: 'Close modals / blur input' },
  ];

  return (
    <div
      className={`shortcuts-overlay ${isVisible ? 'visible' : ''}`}
      onClick={onClose}
    >
      <div
        className={`shortcuts-modal ${isVisible ? 'visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-header">
          <h3>
            <Keyboard size={20} /> Keyboard Shortcuts
          </h3>
          <button className="shortcuts-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="shortcuts-list">
          {shortcuts.map((s, i) => (
            <div key={i} className="shortcut-item">
              <span className="shortcut-key">{s.key}</span>
              <span className="shortcut-action">{s.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}