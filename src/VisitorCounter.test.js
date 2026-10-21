import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import VisitorCounter from './VisitorCounter';

const originalFetch = global.fetch;
beforeEach(() => {
  window.sessionStorage.clear();
  global.fetch = jest.fn();
});
afterEach(() => { global.fetch = originalFetch; });
const reply = value => ({ ok: true, json: async () => ({ value: String(value) }) });

test('counts once in StrictMode and only reads on remount in the same session', async () => {
  global.fetch.mockResolvedValueOnce(reply(1));
  const view = render(<StrictMode><VisitorCounter /></StrictMode>);
  await screen.findByText('151');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch.mock.calls[0][0]).toContain('/hit/');
  view.unmount();
  global.fetch.mockResolvedValueOnce(reply(0));
  render(<VisitorCounter />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  expect(global.fetch.mock.calls[1][0]).toContain('/get/');
  expect(screen.getByText('151')).toBeInTheDocument();
});

test('counts a new session separately', async () => {
  global.fetch.mockResolvedValueOnce(reply(2));
  render(<VisitorCounter />);
  await screen.findByText('152');
  expect(global.fetch.mock.calls[0][0]).toContain('/hit/');
  expect(window.sessionStorage.getItem('homosplace-visit-count-v2')).toBe('2');
});

test('does not claim a visit was saved when the server fails', async () => {
  global.fetch.mockRejectedValueOnce(new Error('Offline'));
  render(<VisitorCounter />);
  await screen.findByTitle('Besucherzähler gerade nicht erreichbar.');
  expect(screen.getByText('–')).toBeInTheDocument();
  expect(window.sessionStorage.getItem('homosplace-visit-count-v2')).toBeNull();
});
