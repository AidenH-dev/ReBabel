import PracticeSheetViewer from '@/components/PracticeSheets/shared/PracticeSheetViewer';
import KanaSheetDocument from './KanaSheetDocument';

export default function KanaSheetViewer(props) {
  return (
    <PracticeSheetViewer
      DocumentComponent={KanaSheetDocument}
      documentProps={props}
      deps={[
        props.characters,
        props.characterType,
        props.practiceRows,
        props.showGuides,
        props.guideStyle,
        props.noBackgroundColor,
      ]}
    />
  );
}
