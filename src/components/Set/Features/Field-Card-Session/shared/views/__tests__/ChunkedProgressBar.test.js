/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChunkedProgressBar from '../ChunkedProgressBar';

// Mock matchMedia for responsive tests
function mockMatchMedia(matches) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe('ChunkedProgressBar', () => {
  const defaultProps = {
    totalChunks: 3,
    currentChunkIndex: 1,
    chunkProgress: 50,
    totalItems: 75,
    itemsCompleted: 37,
    chunkSize: 25,
    color: 'bg-brand-pink',
  };

  beforeEach(() => {
    mockMatchMedia(false); // desktop by default
  });

  test('1. renders chunk label with correct numbers', () => {
    render(<ChunkedProgressBar {...defaultProps} />);
    expect(screen.getByText('Chunk 2/3')).toBeInTheDocument();
    expect(screen.getByText('37 of 75 total')).toBeInTheDocument();
  });

  test('2. renders correct number of segments (small set, no windowing)', () => {
    const { container } = render(<ChunkedProgressBar {...defaultProps} />);
    const segments = container.querySelectorAll(
      '.rounded-full.overflow-hidden.flex-1'
    );
    expect(segments.length).toBe(3);
  });

  test('3. handles single chunk (totalChunks=1)', () => {
    render(
      <ChunkedProgressBar
        {...defaultProps}
        totalChunks={1}
        currentChunkIndex={0}
        chunkProgress={80}
      />
    );
    expect(screen.getByText('Chunk 1/1')).toBeInTheDocument();
  });

  test('4. clamps progress above 100', () => {
    const { container } = render(
      <ChunkedProgressBar {...defaultProps} chunkProgress={150} />
    );
    const fills = container.querySelectorAll('[style]');
    const activeBar = Array.from(fills).find(
      (el) => el.style.width === '100%' && el.style.opacity === '1'
    );
    expect(activeBar).toBeTruthy();
  });

  test('5. clamps progress below 0', () => {
    const { container } = render(
      <ChunkedProgressBar {...defaultProps} chunkProgress={-10} />
    );
    const fills = container.querySelectorAll('[style]');
    const activeBar = Array.from(fills).find(
      (el) => el.style.width === '0%' && el.style.opacity === '1'
    );
    expect(activeBar).toBeTruthy();
  });

  // ── Sliding window tests ──

  test('6. totalChunks <= 9: all segments rendered, no overflow', () => {
    const { container } = render(
      <ChunkedProgressBar
        {...defaultProps}
        totalChunks={7}
        currentChunkIndex={3}
        totalItems={175}
      />
    );
    const segments = container.querySelectorAll(
      '.rounded-full.overflow-hidden.flex-1'
    );
    expect(segments.length).toBe(7);
    // No overflow badges
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  test('7. 24 chunks, active=12: 9 visible, overflow on both sides', () => {
    const { container } = render(
      <ChunkedProgressBar
        {...defaultProps}
        totalChunks={24}
        currentChunkIndex={12}
        totalItems={600}
      />
    );
    const segments = container.querySelectorAll(
      '.rounded-full.overflow-hidden.flex-1'
    );
    expect(segments.length).toBe(9);
    // Left overflow: 12 - 4 = 8, so start=8, overflowLeft=8
    expect(screen.getByText('+8')).toBeInTheDocument();
    // Right overflow: 24 - 17 = 7
    expect(screen.getByText('+7')).toBeInTheDocument();
  });

  test('8. 24 chunks, active=0: no left overflow, right overflow', () => {
    const { container } = render(
      <ChunkedProgressBar
        {...defaultProps}
        totalChunks={24}
        currentChunkIndex={0}
        totalItems={600}
      />
    );
    const segments = container.querySelectorAll(
      '.rounded-full.overflow-hidden.flex-1'
    );
    expect(segments.length).toBe(9);
    // No left overflow (start=0)
    expect(screen.getByText('+15')).toBeInTheDocument(); // right: 24-9=15
  });

  test('9. 24 chunks, active=23: left overflow, no right overflow', () => {
    const { container } = render(
      <ChunkedProgressBar
        {...defaultProps}
        totalChunks={24}
        currentChunkIndex={23}
        totalItems={600}
      />
    );
    const segments = container.querySelectorAll(
      '.rounded-full.overflow-hidden.flex-1'
    );
    expect(segments.length).toBe(9);
    // Left overflow: 24-9=15
    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  test('10. hides per-chunk counts when windowed', () => {
    const { container } = render(
      <ChunkedProgressBar {...defaultProps} totalChunks={24} totalItems={600} />
    );
    const countRows = container.querySelectorAll('.hidden.sm\\:flex');
    expect(countRows.length).toBe(0);
  });

  test('11. shows per-chunk counts when not windowed', () => {
    const { container } = render(
      <ChunkedProgressBar {...defaultProps} totalChunks={5} totalItems={125} />
    );
    const countRows = container.querySelectorAll('.hidden.sm\\:flex');
    expect(countRows.length).toBe(1);
  });
});
