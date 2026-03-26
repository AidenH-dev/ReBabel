import PracticeSheetViewer from '@/components/PracticeSheets/shared/PracticeSheetViewer';
import MultiKanjiSheetDocument from './MultiKanjiSheetDocument';

export default function MultiKanjiSheetViewer(props) {
  return (
    <PracticeSheetViewer
      DocumentComponent={MultiKanjiSheetDocument}
      documentProps={props}
      deps={[
        props.kanjiList,
        props.layoutMode,
        props.practiceRows,
        props.showGuides,
        props.guideStyle,
        props.noBackgroundColor,
      ]}
    />
  );
}
