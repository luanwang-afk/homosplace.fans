import { useEffect, useState } from 'react';

import { requestCounter } from './counterApi';

const COUNTER_KEY = 'homosplace_visits_71b29c0e';
const START_COUNT = 150;
const SESSION_KEY = 'homosplace-visit-count-v2';
let pendingRequest = null;
let fallbackCount = null;

function readSessionCount() {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored === null) return null;
    const count = Number(stored);
    return Number.isSafeInteger(count) && count >= 0 ? count : null;
  } catch {
    return fallbackCount;
  }
}

function loadVisits() {
  // Share the request across mounts, including React StrictMode's effect replay.
  if (pendingRequest) return pendingRequest;
  const previous = readSessionCount();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  pendingRequest = (async () => {
    try {
      const value = await requestCounter(COUNTER_KEY, previous !== null, controller.signal);
      // The API may briefly return a stale read after a confirmed increment.
      const count = Math.max(previous ?? 0, value);
      fallbackCount = count;
      try { window.sessionStorage.setItem(SESSION_KEY, String(count)); } catch { /* Optional storage. */ }
      return count;
    } finally {
      window.clearTimeout(timeout);
    }
  })().finally(() => { pendingRequest = null; });
  return pendingRequest;
}

export default function VisitorCounter() {
  const [count, setCount] = useState(readSessionCount);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadVisits().then(value => {
      if (active) setCount(value);
    }).catch(() => {
      if (active) setFailed(true);
    });
    // Do not cancel a shared increment: the server may already have counted it.
    return () => { active = false; };
  }, []);

  return (
    <div className="site-visitor-counter" title={failed
      ? 'Besucherzähler gerade nicht erreichbar.'
      : 'Ein Besuch pro Sitzung in diesem Browser-Tab'}>
      <span className="site-pulse-number" aria-live="polite">{count === null ? '–' : (START_COUNT + count).toLocaleString('de-DE')}</span>
      <span className="site-pulse-label">Besuche</span>
    </div>
  );
}
