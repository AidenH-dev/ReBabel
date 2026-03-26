import { useEffect, useState } from 'react';
import { usePDF } from '@react-pdf/renderer';
import KanjiPracticeDocument from './KanjiPracticeDocument';
import BouncingDots from '@/components/ui/BouncingDots';

export default function KanjiPracticeViewer(props) {
  const [showOverlay, setShowOverlay] = useState(true);

  const [instance, updateInstance] = usePDF({
    document: <KanjiPracticeDocument {...props} />,
  });

  useEffect(() => {
    setShowOverlay(true);
    updateInstance(<KanjiPracticeDocument {...props} />);
  }, [
    props.kanji,
    props.meaningText,
    props.onList,
    props.kunList,
    props.practiceColumns,
    props.practiceRows,
    props.showGuides,
    props.guideStyle,
    props.includeTraceRow,
    props.noBackgroundColor,
  ]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      {showOverlay && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-card">
          <BouncingDots scale={0.6} />
          <p className="mt-1 text-sm text-gray-400">Rendering preview...</p>
        </div>
      )}

      {instance.url && (
        <iframe
          src={`${instance.url}#toolbar=0`}
          title="Kanji practice PDF preview"
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
