import { useCallback, useEffect, useRef, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';

const spinnerCSS = `
@keyframes ps-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes ps-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
`;

function CssSpinner() {
  return (
    <>
      <style>{spinnerCSS}</style>
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(227, 10, 95, 0.15)',
          borderTopColor: 'var(--brand-pink, #e30a5f)',
          borderRadius: '50%',
          animation: 'ps-spin 0.8s linear infinite',
          willChange: 'transform',
        }}
      />
      <p
        className="text-sm text-gray-400"
        style={{
          animation: 'ps-pulse 1.5s ease-in-out infinite',
          marginTop: 12,
        }}
      >
        Rendering preview...
      </p>
    </>
  );
}

export default function PracticeSheetViewer({
  DocumentComponent,
  documentProps,
  deps,
}) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);

  const [instance, updateInstance] = usePDF({});

  const scheduleRender = useCallback(
    (doc) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShowOverlay(true);
      timerRef.current = setTimeout(() => {
        updateInstance(doc);
      }, 400);
    },
    [updateInstance]
  );

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    scheduleRender(<DocumentComponent {...documentProps} />);
  }, [ready, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      {showOverlay && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-card">
          <CssSpinner />
        </div>
      )}
      {instance.url && (
        <iframe
          src={`${instance.url}#toolbar=0`}
          title="Practice sheet PDF preview"
          onLoad={() => setShowOverlay(false)}
          className="transition-opacity duration-300"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            minHeight: '500px',
            opacity: showOverlay ? 0 : 1,
          }}
        />
      )}
    </div>
  );
}
