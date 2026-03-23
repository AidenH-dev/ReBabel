import { PDFViewer } from '@react-pdf/renderer';
import KanjiPracticeDocument from './KanjiPracticeDocument';

export default function KanjiPracticeViewer(props) {
  return (
    <PDFViewer
      showToolbar={false}
      width="100%"
      height="100%"
      style={{ border: 'none', display: 'block', minHeight: '500px' }}
    >
      <KanjiPracticeDocument {...props} />
    </PDFViewer>
  );
}
