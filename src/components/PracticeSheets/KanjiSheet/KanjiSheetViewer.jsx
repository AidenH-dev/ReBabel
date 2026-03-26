import PracticeSheetViewer from '@/components/PracticeSheets/shared/PracticeSheetViewer';
import KanjiSheetDocument from './KanjiSheetDocument';

export default function KanjiSheetViewer(props) {
  return (
    <PracticeSheetViewer
      DocumentComponent={KanjiSheetDocument}
      documentProps={props}
      deps={[
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
      ]}
    />
  );
}
