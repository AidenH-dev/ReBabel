import { useState, useEffect, useRef } from 'react';

/**
 * Animated count-up hook. Animates a numeric value from 0 to target
 * with cubic ease-out easing.
 *
 * @param {number} target - Target value to count up to
 * @param {number} duration - Animation duration in ms (default 1200)
 * @param {number} delay - Delay before animation starts in ms (default 300)
 * @param {boolean} animate - Whether to animate (false = jump to target immediately)
 * @returns {number} Current animated value
 */
export default function useCountUp(
  target,
  duration = 1200,
  delay = 300,
  animate = true
) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setValue(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!animate || target === 0) return;

    let start = null;
    timeoutRef.current = setTimeout(() => {
      const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay, animate]);

  return value;
}
