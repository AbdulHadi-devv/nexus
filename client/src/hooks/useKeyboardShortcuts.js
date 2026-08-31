import { useEffect } from 'react';

export function useKeyboardShortcuts({
  onAnalyze,
  onGenerateSolutions,
  onGenerateBlueprint,
  onCopy,
  onExport,
  onToggleTheme,
  onToggleHistory,
  onToggleShortcuts
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing in input/textarea (except Ctrl+Enter)
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          if (onAnalyze) onAnalyze();
        }
        return;
      }

      // Ctrl+1: Analyze
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        if (onAnalyze) onAnalyze();
      }
      
      // Ctrl+2: Generate Solutions
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        if (onGenerateSolutions) onGenerateSolutions();
      }
      
      // Ctrl+3: Generate Blueprint
      if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        if (onGenerateBlueprint) onGenerateBlueprint();
      }
      
      // Ctrl+C: Copy (when blueprint is visible)
      if (e.ctrlKey && e.key === 'c' && !e.shiftKey) {
        const blueprintElement = document.getElementById('blueprint-content');
        if (blueprintElement) {
          e.preventDefault();
          if (onCopy) onCopy();
        }
      }
      
      // Ctrl+E: Export
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        if (onExport) onExport();
      }
      
      // Ctrl+D: Toggle Dark Mode
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (onToggleTheme) onToggleTheme();
      }
      
      // Ctrl+H: Toggle History
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        if (onToggleHistory) onToggleHistory();
      }
      
      // Ctrl+Shift+?: Toggle Shortcuts
      if (e.ctrlKey && e.shiftKey && e.key === '/') {
        e.preventDefault();
        if (onToggleShortcuts) onToggleShortcuts();
      }
      
      // Escape: Close modals
      if (e.key === 'Escape') {
        // The overlay click handlers will handle this
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAnalyze, onGenerateSolutions, onGenerateBlueprint, onCopy, onExport, onToggleTheme, onToggleHistory, onToggleShortcuts]);
}