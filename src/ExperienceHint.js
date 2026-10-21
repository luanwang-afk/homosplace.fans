import { useEffect, useState } from 'react';

export default function ExperienceHint({ headphones }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 6000);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="experience-hint" role="status">
      {headphones ? (
        <span>
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M5 19v-4a11 11 0 0 1 22 0v4M5 17H4v9h6V16H7a2 2 0 0 0-2 1Zm22 0h1v9h-6V16h3a2 2 0 0 1 2 1Z" />
          </svg>
          Headphones recommended
        </span>
      ) : (
        <>
          <span>
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <ellipse cx="16" cy="16" rx="5" ry="11" />
              <path d="M27 12c-2-3-6-4-11-4C9 8 3 12 3 16s6 8 13 8c5 0 9-2 11-5M23 12h5V7M9 20H4v5" />
            </svg>
            Drag to rotate
          </span>
          <span>
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="13" cy="13" r="9" />
              <path d="m20 20 8 8M9 13h8M13 9v8" />
            </svg>
            <span className="hint-mouse">Scroll to zoom</span>
            <span className="hint-touch">Pinch to zoom</span>
          </span>
        </>
      )}
    </div>
  );
}
