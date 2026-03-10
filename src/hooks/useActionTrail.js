import { useEffect, useRef } from 'react';

const MAX_ENTRIES = 25;
const TEXT_LIMIT = 40;
const CLASS_LIMIT = 60;

export function useActionTrail() {
  const trailRef = useRef([]);

  useEffect(() => {
    function handleEvent(event) {
      const el = event.target;
      if (!el || !el.tagName) return;

      const entry = {
        timestamp: new Date().toISOString(),
        eventType: event.type,
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        testId: el.dataset?.testid || null,
        text: (el.textContent || '').trim().slice(0, TEXT_LIMIT) || null,
        className:
          (typeof el.className === 'string' ? el.className : '').slice(
            0,
            CLASS_LIMIT
          ) || null,
      };

      trailRef.current = [...trailRef.current, entry].slice(-MAX_ENTRIES);
    }

    document.addEventListener('click', handleEvent, true);
    document.addEventListener('input', handleEvent, true);

    return () => {
      document.removeEventListener('click', handleEvent, true);
      document.removeEventListener('input', handleEvent, true);
    };
  }, []);

  return trailRef;
}
