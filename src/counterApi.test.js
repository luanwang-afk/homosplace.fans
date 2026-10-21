import { requestCounter } from './counterApi';

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

test('reads a missing counter as zero without creating or incrementing it', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  await expect(requestCounter('test-key', true)).resolves.toBe(0);
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch.mock.calls[0][0]).toContain('/get/test-key');
});

test('does not interpret a failed increment as a successful zero count', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  await expect(requestCounter('test-key', false)).rejects.toThrow('Counter unavailable');
});

test.each([null, '', 'garbage', -1, '1.5', '9007199254740992', true])('rejects invalid value %p', async value => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ value }) });
  await expect(requestCounter('test-key', true)).rejects.toThrow('Invalid counter value');
});
