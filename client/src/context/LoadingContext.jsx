import { createContext, useContext, useState, useCallback, useRef } from 'react';
import NexusLoader from '../components/NexusLoader';
import '../components/NexusLoader.css';

const LoadingContext = createContext(null);

/**
 * Single global NexusLoader instance.
 * Pages call `showLoader()` on mount and `hideLoader()` when their data is ready.
 * The loader itself ensures the snake animation runs to completion.
 */
export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const hideRef = useRef(null);

  const showLoader = useCallback((opts = {}) => {
    setLoading(true);
    if (hideRef.current) clearTimeout(hideRef.current);
  }, []);

  const hideLoader = useCallback(() => {
    // Small debounce so rapid show/hide calls don't flicker
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => {
      setLoading(false);
    }, 50);
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, showLoader, hideLoader }}>
      {children}
      {/* Single, app-wide loader instance */}
      <NexusLoader isVisible={loading} duration={1400} fullscreen={false} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used inside <LoadingProvider>');
  return ctx;
}