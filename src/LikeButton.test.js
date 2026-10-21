import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LikeButton from './LikeButton';

const originalFetch = global.fetch;
beforeEach(() => {
  window.localStorage.clear();
  global.fetch = jest.fn();
});
afterEach(() => { global.fetch = originalFetch; });
const reply = value => ({ ok: true, json: async () => ({ value }) });

test('reads the shared count without counting a page view and confirms one like', async () => {
  global.fetch.mockResolvedValueOnce(reply('0')).mockResolvedValueOnce(reply('1'));
  const view = render(<LikeButton />);
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  expect(global.fetch.mock.calls[0][0]).toContain('/get/');
  const button = screen.getByRole('button', { name: 'Gefällt mir' });
  fireEvent.click(button);
  fireEvent.click(button);
  await screen.findByText('74');
  expect(global.fetch).toHaveBeenCalledTimes(2);
  expect(global.fetch.mock.calls[1][0]).toContain('/hit/');
  expect(global.fetch.mock.calls[1][0]).not.toContain('/get/');
  expect(button).toBeDisabled();
  expect(window.localStorage.getItem('homosplace-heart-liked')).toBe('true');
  view.unmount();
  global.fetch.mockResolvedValueOnce(reply('1'));
  render(<LikeButton />);
  expect(screen.getByRole('button', { name: 'Bereits gelikt' })).toBeDisabled();
  await screen.findByText('74');
});

test('does not invent a local like when the server fails', async () => {
  global.fetch.mockResolvedValueOnce(reply('0')).mockRejectedValueOnce(new Error('Offline'));
  render(<LikeButton />);
  fireEvent.click(screen.getByRole('button'));
  await screen.findByRole('status');
  expect(screen.getByText('73')).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeEnabled();
  expect(window.localStorage.getItem('homosplace-heart-liked')).toBeNull();
});

test('a late initial read cannot overwrite a confirmed like', async () => {
  let finishRead;
  global.fetch.mockImplementationOnce(() => new Promise(resolve => { finishRead = resolve; }))
    .mockResolvedValueOnce(reply('1'));
  render(<LikeButton />);
  fireEvent.click(screen.getByRole('button'));
  await screen.findByText('74');
  finishRead(reply('0'));
  await waitFor(() => expect(screen.getByText('74')).toBeInTheDocument());
});
