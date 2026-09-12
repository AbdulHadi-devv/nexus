import { useEffect } from 'react';

export function useKnowledgeShortcuts({
  onCreate,
  onSearch,
  onDashboard,
  onGraph,
  onLogout,
  onToggleTheme,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') target.blur();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (onSearch) onSearch();
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (onToggleTheme) onToggleTheme();
      }

      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (onCreate) onCreate();
      }

      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (onGraph) onGraph();
      }

      if (e.altKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        if (onDashboard) onDashboard();
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        if (onLogout) onLogout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCreate, onSearch, onDashboard, onGraph, onLogout, onToggleTheme]);
}