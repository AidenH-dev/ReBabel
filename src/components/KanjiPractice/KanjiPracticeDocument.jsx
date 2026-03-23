import {
  Document,
  Font,
  Page,
  View,
  Text,
  Svg,
  Rect,
  Line,
  StyleSheet,
} from '@react-pdf/renderer';

Font.register({
  family: 'NotoSerifJP',
  fonts: [
    { src: '/fonts/NotoSerifJP-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/NotoSerifJP-Bold.ttf', fontWeight: 700 },
  ],
});
Font.register({
  family: 'NotoSansJP',
  fonts: [
    { src: '/fonts/NotoSansJP-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/NotoSansJP-Bold.ttf', fontWeight: 700 },
  ],
});

// A4 at 72dpi: 595.28 x 841.89 pt
// Conversion: px * 0.75 = pt

const cellPt = 36; // 48px * 0.75
const hPadPt = 40.5; // 54px * 0.75
const vPadPt = 39; // 52px * 0.75
const accentColor = 'var(--brand-pink)';
const guideColor = '#e3e3e3';

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: hPadPt,
    paddingVertical: vPadPt,
    fontFamily: 'NotoSansJP',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'NotoSansJP',
    color: '#334155',
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 9,
    fontFamily: 'NotoSansJP',
    color: '#64748b',
    marginTop: 2,
  },
  nameBox: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: -5,
  },
  nameField: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minWidth: 100,
  },
  nameDateLabel: {
    fontSize: 8,
    fontFamily: 'NotoSansJP',
    color: '#64748b',
    fontWeight: 'bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
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
    fontFamily: 'NotoSansJP',
    color: '#111827',
    fontWeight: 'bold',
    width: 52,
  },
  infoValue: {
    fontSize: 10.5,
    fontFamily: 'NotoSansJP',
    color: '#334155',
  },
  // Grid sections
  sections: {
    marginTop: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: 'NotoSansJP',
    color: '#334155',
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  // Footer
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
  },
  footerTip: {
    fontSize: 8,
    fontFamily: 'NotoSansJP',
    color: '#64748b',
  },
  footerBrand: {
    fontSize: 8,
    fontFamily: 'NotoSansJP',
    color: accentColor,
    fontWeight: 'bold',
  },
});

function Cell({ kanjiChar, faint, showGuides, guideStyle }) {
  const half = cellPt / 2;
  return (
    <Svg width={cellPt} height={cellPt} viewBox={`0 0 ${cellPt} ${cellPt}`}>
      {/* Cell border */}
      <Rect
        x={0}
        y={0}
        width={cellPt}
        height={cellPt}
        fill="white"
        stroke="#d0d0d0"
        strokeWidth={0.75}
      />

      {/* Guide lines */}
      {showGuides && guideStyle === 'dotted-cross' && (
        <>
          <Line
            x1={half}
            y1={0}
            x2={half}
            y2={cellPt}
            stroke={guideColor}
            strokeWidth={0.75}
            strokeDasharray="1.5 2.5"
          />
          <Line
            x1={0}
            y1={half}
            x2={cellPt}
            y2={half}
            stroke={guideColor}
            strokeWidth={0.75}
            strokeDasharray="1.5 2.5"
          />
        </>
      )}
      {showGuides && guideStyle === 'standard' && (
        <>
          <Line
            x1={half}
            y1={0}
            x2={half}
            y2={cellPt}
            stroke={guideColor}
            strokeWidth={0.75}
          />
          <Line
            x1={0}
            y1={half}
            x2={cellPt}
            y2={half}
            stroke={guideColor}
            strokeWidth={0.75}
          />
          {/* Diagonal top-left to bottom-right */}
          <Line
            x1={0}
            y1={0}
            x2={cellPt}
            y2={cellPt}
            stroke={guideColor}
            strokeWidth={0.75}
          />
          {/* Diagonal top-right to bottom-left */}
          <Line
            x1={cellPt}
            y1={0}
            x2={0}
            y2={cellPt}
            stroke={guideColor}
            strokeWidth={0.75}
          />
        </>
      )}

      {/* Faint kanji for model row — SVG text: x/y/textAnchor/fill, not CSS box-model */}
      {kanjiChar ? (
        <Text
          x={half}
          y={cellPt * 0.78}
          textAnchor="middle"
          style={{
            fontSize: cellPt - 6,
            fontFamily: 'NotoSerifJP',
            fill: faint ? '#c0c0c0' : '#111111',
          }}
        >
          {kanjiChar}
        </Text>
      ) : null}
    </Svg>
  );
}

export default function KanjiPracticeDocument({
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
      <Page size="A4" style={[styles.page, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>書く練習</Text>
            <Text style={styles.headerSubtitle}>かくれんしゅう</Text>
          </View>
          <View style={styles.nameBox}>
            <View style={styles.nameField}>
              <Text style={styles.nameDateLabel}>Name:</Text>
            </View>
            <View style={[styles.nameField, { minWidth: 90 }]}>
              <Text style={styles.nameDateLabel}>Date:</Text>
            </View>
          </View>
        </View>

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
              <Text style={styles.infoValue}>
                {onList && onList.length ? onList.join(', ') : '-'}
              </Text>
            </View>
            <View style={styles.infoLine}>
              <Text style={styles.infoLabel}>Kun:</Text>
              <Text style={styles.infoValue}>
                {kunList && kunList.length ? kunList.join(', ') : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Grid sections */}
        <View style={styles.sections}>
          {includeTraceRow && (
            <View>
              <Text style={styles.sectionLabel}>Model row</Text>
              <View style={styles.row}>
                {cols.map((c) => (
                  <Cell
                    key={c}
                    kanjiChar={displayKanji}
                    faint
                    showGuides={showGuides}
                    guideStyle={guideStyle}
                  />
                ))}
              </View>
            </View>
          )}

          <View>
            <Text style={styles.sectionLabel}>Practice grid</Text>
            {rows.map((r) => (
              <View key={r} style={styles.row}>
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTip}>
            Practice slowly and aim for balance, proportion, and clean stroke
            direction.
          </Text>
          <Text style={styles.footerBrand}>ReBabel.org</Text>
        </View>
      </Page>
    </Document>
  );
}
