import { useEffect, useState } from 'react';

/**
 * NexusLoader
 * ----------
 * A branded page-loading animation:
 *   • Gradient rounded tile (matches the Nexus logo, no "N" letter)
 *   • A snake grows inside the tile, tracing the letter "N"
 *   • When the snake completes, the loader fades out
 *
 * Props:
 *   isVisible {boolean} — show/hide the loader
 *   duration  {number}  — how long the snake takes to grow (ms)
 *   onComplete {fn}     — fired when the snake finishes drawing
 *   fullscreen {boolean} — cover the whole viewport (default true)
 */
export default function NexusLoader({
  isVisible = true,
  duration = 1400,
  onComplete,
  fullscreen = true,
}) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  // The "N" path — a single unbroken stroke
  // Coordinates are in a 100×100 viewBox
  const N_PATH = 'M 25 80 L 25 20 L 75 80 L 75 20';

  // Length of the path — computed once, used for stroke-dasharray
  const PATH_LENGTH = 240; // approximate; the exact value is set below via ref if needed

  useEffect(() => {
    if (!isVisible) {
      setExiting(true);
      const t = setTimeout(() => {
        setExiting(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(t);
    }

    setProgress(0);
    setExiting(false);

    const start = performance.now();
    let raf;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutCubic — smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isVisible, duration, onComplete]);

  if (!isVisible && !exiting) return null;

  // stroke-dashoffset: PATH_LENGTH means "nothing drawn"
  //                0 means "fully drawn"
  const dashOffset = PATH_LENGTH * (1 - progress);

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
        {/* Ambient glow behind the tile */}
        <div className="nexus-loader-glow" />

        {/* The tile itself — gradient background, no N letter */}
        <div className="nexus-loader-tile-inner">
          {/* The snake that draws the N */}
          <svg
            className="nexus-loader-svg"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Slight glow for the snake stroke */}
              <filter id="nexus-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Rounded line caps for a friendlier snake */}
              <linearGradient id="nexus-snake" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="100%" stopColor="#f0f0ff" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Faint guide path so the N is always slightly visible */}
            <path
              d={N_PATH}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* The growing snake */}
            <path
              d={N_PATH}
              fill="none"
              stroke="url(#nexus-snake)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#nexus-glow)"
              style={{
                strokeDasharray: PATH_LENGTH,
                strokeDashoffset: dashOffset,
                transition: 'stroke-dashoffset 0.05s linear',
              }}
            />

            {/* The "head" of the snake — a bright dot that leads the stroke */}
            <SnakeHead pathD={N_PATH} progress={progress} />
          </svg>
        </div>
      </div>

      <div className="nexus-loader-label">NEXUS</div>
      <div className="nexus-loader-sub">Loading experience…</div>
    </div>
  );
}

/**
 * Renders a small glowing dot at the current head of the snake.
 * Uses SVG path length math via getPointAtLength — implemented with a ref.
 */
function SnakeHead({ pathD, progress }) {
  const [point, setPoint] = useState({ x: 25, y: 80 });

  useEffect(() => {
    // Create a hidden path to measure length + get point at progress
    const svgNS = 'http://www.w3.org/2000/svg';
    const tempPath = document.createElementNS(svgNS, 'path');
    tempPath.setAttribute('d', pathD);
    // Not attached to DOM — getTotalLength still works in all modern browsers
    try {
      const len = tempPath.getTotalLength();
      const p = tempPath.getPointAtLength(len * progress);
      setPoint({ x: p.x, y: p.y });
    } catch {
      /* ignore */
    }
  }, [pathD, progress]);

  return (
    <circle
      cx={point.x}
      cy={point.y}
      r="5.5"
      fill="#ffffff"
      filter="url(#nexus-glow)"
      opacity={progress > 0 && progress < 1 ? 1 : 0}
    />
  );
}