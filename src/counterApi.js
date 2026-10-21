const API_URL = 'https://countapi.mileshilliard.com/api/v1';

export async function requestCounter(key, readOnly, signal) {
  const response = await fetch(`${API_URL}/${readOnly ? 'get' : 'hit'}/${key}`, {
    cache: 'no-store', credentials: 'omit', signal
  });
  // New keys are created by their first hit; reading must never add a visit.
  if (readOnly && response.status === 404) return 0;
  if (!response.ok) throw new Error('Counter unavailable');
  const { value } = await response.json();
  if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+$/.test(value))) {
    throw new Error('Invalid counter value');
  }
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid counter value');
  return count;
}
