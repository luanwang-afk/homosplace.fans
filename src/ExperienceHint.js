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
        <svg viewBox="0 0 32 32" role="img" aria-label="Headphones recommended">
          <path d="M6 18v-3a10 10 0 0 1 20 0v3M6 17H5v9h5v-9H6Zm20 0h1v9h-5v-9h4Z" />
        </svg>
      ) : (
        <>
          <svg viewBox="0 0 32 32" role="img" aria-label="Drag to rotate">
            <path d="M7 11a10 10 0 0 1 18-1M25 5v5h-5M25 21a10 10 0 0 1-18 1M7 27v-5h5" />
            <circle cx="16" cy="16" r="1" />
          </svg>
          <svg viewBox="0 0 32 32" role="img" aria-label="Scroll or pinch to zoom">
            <path d="M12 20 5 27M5 21v6h6M20 12l7-7M21 5h6v6" />
            <circle cx="16" cy="16" r="1" />
          </svg>
        </>
      )}
    </div>
  );
}
