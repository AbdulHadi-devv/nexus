import { useEffect, useState } from 'react';

/**
 * useMinimumLoader
 * ----------------
 * Returns `true` while the NexusLoader should stay visible.
 * Stays true until BOTH:
 *   1. `isLoading` becomes false (data resolved), AND
 *   2. at least `minMs` has elapsed since mount (snake finishes)
 */
export function useMinimumLoader(isLoading, minMs = 1400) {
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), minMs);
    return () => clearTimeout(t);
  }, [minMs]);

  return isLoading || !minTimePassed;
}

export default useMinimumLoader;