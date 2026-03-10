import { useEffect, useRef } from 'react';

// Extracted from BugReporter.js — Implements SPEC-LLM-UI-010
export function useConsoleErrorCapture() {
  const errorsRef = useRef([]);

  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      errorsRef.current = [...errorsRef.current, args.join(' ')].slice(-10);
      originalError(...args);
    };

    const onWindowError = (event) => {
      errorsRef.current = [
        ...errorsRef.current,
        event.message || String(event),
      ].slice(-10);
    };
    window.addEventListener('error', onWindowError);

    return () => {
      console.error = originalError;
      window.removeEventListener('error', onWindowError);
    };
  }, []);

  return errorsRef;
}
