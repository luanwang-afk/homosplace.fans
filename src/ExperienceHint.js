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
        <svg className="experience-orbit" viewBox="0 0 48 48" role="img" aria-label="Drag to rotate">
          <path d="m24 7 9 5v11l-9 5-9-5V12Z M15 12l9 5 9-5 M24 17v11" />
          <path d="M37 20c7 3 9 7 5 11-7 7-29 7-36 0-5-5-1-9 5-12 M6 18l5 1-2 5" />
        </svg>
      )}
    </div>
  );
}
