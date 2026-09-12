import { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import ShortcutsModal from './ShortcutsModal';

export default function HeaderShortcutsButton() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handle = (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  return (
    <>
      <button
        className="theme-toggle-small"
        onClick={() => setIsOpen(true)}
        title="Keyboard shortcuts (Alt+K)"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard size={18} />
      </button>
      <ShortcutsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}