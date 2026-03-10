/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { useFetchLogger } from '../useFetchLogger';

// Test harness that exposes the ref
let logsRef;
function TestComponent() {
  logsRef = useFetchLogger();
  return null;
}

describe('useFetchLogger', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = window.fetch;
    logsRef = null;
  });

  afterEach(() => {
    // Cleanup: unmount restores fetch, but also restore manually just in case
    window.fetch = originalFetch;
  });

  it('intercepts fetch and logs successful requests', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 200,
      clone: () => ({ text: () => Promise.resolve('ok') }),
    });
    window.fetch = mockFetch;

    const { unmount } = render(<TestComponent />);

    await act(async () => {
      await window.fetch('/api/test', { method: 'GET' });
    });

    expect(logsRef.current).toHaveLength(1);
    expect(logsRef.current[0]).toMatchObject({
      method: 'GET',
      url: '/api/test',
      status: 200,
    });
    expect(logsRef.current[0].durationMs).toBeGreaterThanOrEqual(0);
    expect(logsRef.current[0].timestamp).toBeDefined();

    unmount();
  });

  it('captures error body for failed responses (status >= 400)', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 500,
      clone: () => ({ text: () => Promise.resolve('{"error":"db down"}') }),
    });
    window.fetch = mockFetch;

    const { unmount } = render(<TestComponent />);

    await act(async () => {
      await window.fetch('/api/broken');
    });

    expect(logsRef.current).toHaveLength(1);
    expect(logsRef.current[0].status).toBe(500);
    expect(logsRef.current[0].bodyPreview).toBe('{"error":"db down"}');

    unmount();
  });

  it('logs fetch errors (network failures)', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    window.fetch = mockFetch;

    const { unmount } = render(<TestComponent />);

    await act(async () => {
      try {
        await window.fetch('/api/down');
      } catch {
        // expected
      }
    });

    expect(logsRef.current).toHaveLength(1);
    expect(logsRef.current[0].error).toBe('Network error');
    expect(logsRef.current[0].status).toBeNull();

    unmount();
  });

  it('limits entries to 20', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 200,
      clone: () => ({ text: () => Promise.resolve('') }),
    });
    window.fetch = mockFetch;

    const { unmount } = render(<TestComponent />);

    await act(async () => {
      for (let i = 0; i < 25; i++) {
        await window.fetch(`/api/item/${i}`);
      }
    });

    expect(logsRef.current).toHaveLength(20);
    // Should keep the most recent entries
    expect(logsRef.current[19].url).toBe('/api/item/24');

    unmount();
  });

  it('skips /api/bug-reporter/ URLs', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 200,
      clone: () => ({ text: () => Promise.resolve('') }),
    });
    window.fetch = mockFetch;

    const { unmount } = render(<TestComponent />);

    await act(async () => {
      await window.fetch('/api/bug-reporter/report');
      await window.fetch('/api/bug-reporter/permission');
    });

    expect(logsRef.current).toHaveLength(0);

    unmount();
  });

  it('restores original fetch on unmount', () => {
    const mockFetch = jest.fn();
    window.fetch = mockFetch;

    const { unmount } = render(<TestComponent />);
    const interceptedFetch = window.fetch;
    expect(interceptedFetch).not.toBe(mockFetch);

    unmount();
    expect(window.fetch).toBe(mockFetch);
  });
});
