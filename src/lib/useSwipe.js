import { useRef, useCallback } from 'react';

/**
 * useSwipe — Detects horizontal swipe gestures on touch devices.
 *
 * @param {Object} handlers
 * @param {Function} [handlers.onSwipeLeft] - Called on left swipe (next)
 * @param {Function} [handlers.onSwipeRight] - Called on right swipe (previous)
 * @param {number} [threshold=50] - Minimum distance in px to trigger a swipe
 * @returns {{ onTouchStart, onTouchMove, onTouchEnd }} — Spread onto the swipeable element
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 } = {}) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchStart.current - touchEnd.current;

    if (Math.abs(distance) >= threshold) {
      if (distance > 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }

    touchStart.current = null;
    touchEnd.current = null;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
