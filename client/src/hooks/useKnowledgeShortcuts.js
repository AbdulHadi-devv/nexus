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
        // Allow Escape to blur input
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      // Ctrl/Cmd + N: New Item
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (onCreate) onCreate();
      }

      // Ctrl/Cmd + K: Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (onSearch) onSearch();
      }

      // Ctrl/Cmd + D: Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !e.shiftKey) {
        e.preventDefault();
        if (onDashboard) onDashboard();
      }

      // Ctrl/Cmd + G: Graph
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        if (onGraph) onGraph();
      }

      // Ctrl/Cmd + Shift + D: Toggle Theme
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        if (onToggleTheme) onToggleTheme();
      }

      // Ctrl/Cmd + Shift + L: Logout
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        if (onLogout) onLogout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCreate, onSearch, onDashboard, onGraph, onLogout, onToggleTheme]);
}