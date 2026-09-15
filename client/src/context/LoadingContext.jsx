import { createContext, useContext, useState, useCallback } from 'react';
import NexusLoader from '../components/NexusLoader';
import '../components/NexusLoader.css';

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(1400);

  const showLoader = useCallback((opts = {}) => {
    setDuration(opts.duration ?? 1400);
    setLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setLoading(false);
  }, []);

  /**
   * Wrap an async function with the loader:
   *   await withLoader(() => fetch('/api/items'))
   */
  const withLoader = useCallback(
    async (fn, opts = {}) => {
      showLoader(opts);
      try {
        return await fn();
      } finally {
        // Ensure the snake finishes drawing at minimum
        const wait = opts.duration ?? 1400;
        await new Promise((r) => setTimeout(r, wait));
        hideLoader();
      }
    },
    [showLoader, hideLoader]
  );

  return (
    <LoadingContext.Provider value={{ loading, showLoader, hideLoader, withLoader }}>
      {children}
      <NexusLoader isVisible={loading} duration={duration} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used inside <LoadingProvider>');
  return ctx;
}