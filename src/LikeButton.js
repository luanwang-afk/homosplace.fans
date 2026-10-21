import React, { useEffect, useRef, useState } from 'react';

import { requestCounter } from './counterApi';

const COUNTER_KEY = 'homosplace_likes_71b29c0e';
const START_COUNT = 73;
const LIKED_KEY = 'homosplace-heart-liked';

async function requestCount(readOnly, signal) {
  // Preserve the original display baseline; CountAPI stores new likes only.
  return START_COUNT + await requestCounter(COUNTER_KEY, readOnly, signal);
}

export default function LikeButton() {
  const [count, setCount] = useState(START_COUNT);
  const [liked, setLiked] = useState(() => {
    try { return window.localStorage.getItem(LIKED_KEY) === 'true'; }
    catch { return false; }
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    requestCount(true, controller.signal)
      .then(value => setCount(current => Math.max(current, value)))
      .catch(() => {
        if (!controller.signal.aborted) setError('Like-Zähler gerade nicht erreichbar.');
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  async function handleLike() {
    if (liked || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const value = await requestCount(false, controller.signal);
      setCount(current => Math.max(current, value));
      setLiked(true);
      // Only the browser's repeat-click guard is local; the count lives on the server.
      try { window.localStorage.setItem(LIKED_KEY, 'true'); } catch { /* Storage is optional. */ }
    } catch {
      setError('Like konnte nicht bestätigt werden. Bitte später erneut versuchen.');
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button
        className={`site-heart-button ${liked ? 'is-liked' : ''}`}
        type="button"
        onClick={handleLike}
        disabled={liked || pending}
        aria-label={liked ? 'Bereits gelikt' : 'Gefällt mir'}
        aria-pressed={liked}
        aria-busy={pending}
        aria-describedby={error ? 'like-error' : undefined}
        title={error || (liked ? 'Danke für dein Herz!' : 'Gefällt mir')}
      >
        <span aria-hidden="true">♥</span>
        <span className="site-pulse-number" aria-live="polite">{count.toLocaleString('de-DE')}</span>
      </button>
      {error && <span id="like-error" role="status" className="site-like-error">{error}</span>}
    </>
  );
}
