import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import {
  Cell,
  PdfHeader,
  PdfFooter,
  sharedStyles,
} from '@/lib/practiceSheets/pdfShared';
import { cellPt } from '@/lib/practiceSheets/constants';

const hPadPt = 40.5;
const vPadPt = 39;

const styles = StyleSheet.create({
  // Kanji info
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  largeKanji: {
    fontSize: 58,
    fontFamily: 'NotoSerifJP',
    color: '#111111',
    lineHeight: 1,
    width: 68,
    textAlign: 'center',
    marginTop: -13,
  },
  infoLines: {
    flex: 1,
    gap: 3,
    marginTop: 4,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 10.5,
    fontFamily: 'Fredoka',
    color: '#111827',
    fontWeight: 600,
    width: 52,
  },
  infoValue: {
    fontSize: 10.5,
    fontFamily: 'Fredoka',
    color: '#334155',
  },
  infoValueJP: {
    fontSize: 10.5,
    fontFamily: 'NotoSansJP',
    color: '#334155',
  },
  // Grid sections
  sections: {
    marginTop: 16,
    gap: 12,
  },
});

export default function KanjiSheetDocument({
  kanji,
  meaningText,
  onList,
  kunList,
  practiceColumns,
  practiceRows,
  showGuides,
  guideStyle,
  includeTraceRow,
  noBackgroundColor,
}) {
  const cols = Array.from({ length: practiceColumns }, (_, i) => i);
  const rows = Array.from({ length: practiceRows }, (_, i) => i);
  const bgColor = noBackgroundColor ? '#ffffff' : '#f6f1ea';
  const displayKanji = kanji || '水';

  return (
    <Document>
      <Page
        size="A4"
        style={[
          sharedStyles.page,
          {
            paddingHorizontal: hPadPt,
            paddingVertical: vPadPt,
            backgroundColor: bgColor,
          },
        ]}
      >
        <PdfHeader title="書く練習" subtitle="かくれんしゅう" />

        {/* Kanji info row */}
        <View style={styles.infoRow}>
          <Text style={styles.largeKanji}>{displayKanji}</Text>
          <View style={styles.infoLines}>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>Meaning:</Text>
              <Text style={styles.infoValue}>{meaningText || '-'}</Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>On:</Text>
              <Text style={styles.infoValueJP}>
                {onList && onList.length ? onList.join(', ') : '-'}
              </Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>Kun:</Text>
              <Text style={styles.infoValueJP}>
                {kunList && kunList.length ? kunList.join(', ') : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Grid sections */}
        <View style={styles.sections}>
          {includeTraceRow && (
            <View>
              <Text style={sharedStyles.sectionLabel}>Model row</Text>
              <View style={sharedStyles.row}>
                {cols.map((c) => (
                  <Cell
                    key={c}
                    character={displayKanji}
                    faint
                    showGuides={showGuides}
                    guideStyle={guideStyle}
                  />
                ))}
              </View>
            </View>
          )}

          <View>
            <Text style={sharedStyles.sectionLabel}>Practice grid</Text>
            {rows.map((r) => (
              <View key={r} style={sharedStyles.row}>
                {cols.map((c) => (
                  <Cell
                    key={c}
                    showGuides={showGuides}
                    guideStyle={guideStyle}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
}
