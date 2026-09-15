import { useEffect, useRef } from 'react';
import { useLoading } from '../context/LoadingContext';

export function useMinimumLoader(isLoading, minMs = 1400) {
  const { showLoader, hideLoader } = useLoading();
  const mountTime = useRef(performance.now());

  useEffect(() => {
    showLoader();
  }, [showLoader]);

  useEffect(() => {
    if (isLoading) return;

    const elapsed = performance.now() - mountTime.current;
    const remaining = Math.max(0, minMs - elapsed);

    const timer = setTimeout(() => {
      hideLoader();
    }, remaining);

    return () => clearTimeout(timer);
  }, [isLoading, minMs, showLoader, hideLoader]);
}

export default useMinimumLoader;