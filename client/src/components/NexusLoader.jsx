import { useEffect, useRef, useState } from 'react';

/**
 * NexusLoader
 * ----------
 * Branded loader: gradient tile + snake grows into an "N".
 * Non-linear speed: burst → slow → burst.
 * Always runs to completion. Locks body scroll while visible.
 */

const N_PATH = 'M 25 80 L 25 20 L 75 80 L 75 20';
const PATH_LENGTH = 200;

// Segment boundaries (in path-length units)
const SEG1_END = 60;    // bottom-left → top-left
const SEG2_END = 138;   // top-left → bottom-right (end ~198)

// Timing (ms)
const DURATION = 1400;
const T_SEG1 = 250;
const T_SEG2 = DURATION - 500; // 900
const T_SEG3 = 250;

export default function NexusLoader({
  isVisible = true,
  duration = DURATION,
  onComplete,
  fullscreen = true,
}) {
  const [mounted, setMounted] = useState(isVisible);
  const [exiting, setExiting] = useState(false);

  const svgPathRef = useRef(null);
  const headRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(0);
  const completedRef = useRef(false);

  // --- Mount / unmount ---
  useEffect(() => {
    if (isVisible) {
      setMounted(true);
      setExiting(false);
      completedRef.current = false;
    } else if (mounted) {
      setExiting(true);
      const t = setTimeout(() => {
        setExiting(false);
        setMounted(false);
      }, 380);
      return () => clearTimeout(t);
    }
  }, [isVisible, mounted]);

  // --- Lock body scroll while visible ---
  useEffect(() => {
    if (!mounted || exiting) return;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [mounted, exiting]);

  // --- Animation loop (direct DOM, no React re-render) ---
  useEffect(() => {
    if (!mounted) return;
    const pathEl = svgPathRef.current;
    const headEl = headRef.current;
    if (!pathEl || !headEl) return;

    // Measure real path length once
    let realLen = PATH_LENGTH;
    try {
      realLen = pathEl.getTotalLength();
    } catch { /* ignore */ }

    startTimeRef.current = performance.now();

    const easeOutQuad = (t) => 1 - Math.pow(1 - t, 2);
    const easeInOutQuad = (t) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const t = Math.min(elapsed / duration, 1);

      let pathProgress;
      if (t <= T_SEG1 / duration) {
        const localT = t / (T_SEG1 / duration);
        pathProgress = easeOutQuad(localT) * SEG1_END;
      } else if (t <= (T_SEG1 + T_SEG2) / duration) {
        const localT = (t - T_SEG1 / duration) / (T_SEG2 / duration);
        pathProgress = SEG1_END + easeInOutQuad(localT) * (SEG2_END - SEG1_END);
      } else {
        const localT = (t - (T_SEG1 + T_SEG2) / duration) / (T_SEG3 / duration);
        pathProgress = SEG2_END + easeOutQuad(localT) * (PATH_LENGTH - SEG2_END);
      }

      // Scale to real path length
      const scaled = (pathProgress / PATH_LENGTH) * realLen;

      // Direct DOM update — no React re-render
      pathEl.style.strokeDasharray = `${realLen}`;
      pathEl.style.strokeDashoffset = `${realLen - scaled}`;

      // Move the snake head along the path
      try {
        const p = pathEl.getPointAtLength(scaled);
        headEl.setAttribute('cx', p.x);
        headEl.setAttribute('cy', p.y);
        headEl.style.opacity = scaled > 2 && scaled < realLen - 2 ? '1' : '0';
      } catch { /* ignore */ }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        headEl.style.opacity = '0';
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mounted, duration, onComplete]);

  if (!mounted && !exiting) return null;

  return (
    <div
      className={`nexus-loader-overlay ${fullscreen ? 'fullscreen' : ''} ${
        exiting ? 'exiting' : ''
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="nexus-loader-tile">
        <div className="nexus-loader-glow" />
        <div className="nexus-loader-tile-inner">
          <svg
            className="nexus-loader-svg"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="nexus-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="nexus-snake" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#f0f0ff" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Faint guide path */}
            <path
              d={N_PATH}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Growing snake — driven by ref, no React re-render */}
            <path
              ref={svgPathRef}
              d={N_PATH}
              fill="none"
              stroke="url(#nexus-snake)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#nexus-glow)"
            />

            {/* Snake head — position set directly via ref */}
            <circle
              ref={headRef}
              cx="25"
              cy="80"
              r="5.5"
              fill="#ffffff"
              filter="url(#nexus-glow)"
              style={{ opacity: 0, transition: 'opacity 0.15s ease' }}
            />
          </svg>
        </div>
      </div>

      <div className="nexus-loader-label">NEXUS</div>
      <div className="nexus-loader-sub">Loading experience…</div>
    </div>
  );
}