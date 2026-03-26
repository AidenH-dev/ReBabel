import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import {
  Cell,
  PdfHeader,
  PdfFooter,
  sharedStyles,
} from '@/lib/practiceSheets/pdfShared';
import { cellPt, hPadPt, vPadPt } from '@/lib/practiceSheets/constants';

const maxCols = Math.floor((595.28 - 2 * hPadPt) / cellPt);

const localStyles = StyleSheet.create({
  // Compact info line
  compactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  compactKanji: {
    fontSize: 20,
    fontFamily: 'NotoSerifJP',
    color: '#111111',
    fontWeight: 700,
    width: 28,
  },
  compactMeaning: {
    fontSize: 9,
    fontFamily: 'Fredoka',
    color: '#334155',
    fontWeight: 600,
  },
  compactReading: {
    fontSize: 9,
    fontFamily: 'NotoSansJP',
    color: '#64748b',
  },
  compactBlock: {
    marginBottom: 14,
  },
  // Full page info
  fullInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  fullLargeKanji: {
    fontSize: 58,
    fontFamily: 'NotoSerifJP',
    color: '#111111',
    lineHeight: 1,
    width: 68,
    textAlign: 'center',
    marginTop: -13,
  },
  fullInfoLines: { flex: 1, gap: 3, marginTop: 4 },
  fullInfoLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fullInfoLabel: {
    fontSize: 10.5,
    fontFamily: 'Fredoka',
    color: '#111827',
    fontWeight: 600,
    width: 52,
  },
  fullInfoValue: { fontSize: 10.5, fontFamily: 'Fredoka', color: '#334155' },
  fullInfoValueJP: {
    fontSize: 10.5,
    fontFamily: 'NotoSansJP',
    color: '#334155',
  },
  sections: { marginTop: 16, gap: 12 },
  // Grid-only
  gridLabel: {
    fontSize: 14,
    fontFamily: 'NotoSerifJP',
    color: '#334155',
    marginBottom: 2,
  },
  gridBlock: {
    marginBottom: 10,
  },
});

export default function MultiKanjiSheetDocument({
  kanjiList,
  layoutMode,
  practiceRows,
  showGuides,
  guideStyle,
  noBackgroundColor,
}) {
  if (!kanjiList || kanjiList.length === 0) {
    return (
      <Document>
        <Page size="A4" style={sharedStyles.page}>
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Fredoka',
              color: '#64748b',
              marginTop: 40,
              textAlign: 'center',
            }}
          >
            No kanji added yet.
          </Text>
        </Page>
      </Document>
    );
  }

  const bgColor = noBackgroundColor ? '#ffffff' : '#f6f1ea';
  const cols = Array.from({ length: maxCols }, (_, c) => c);
  const pRows = Array.from({ length: practiceRows }, (_, r) => r);

  // Full layout: one Page per kanji
  if (layoutMode === 'full') {
    return (
      <Document>
        {kanjiList.map((item, i) => {
          const displayKanji = item.kanji || '?';
          return (
            <Page
              key={i}
              size="A4"
              style={[sharedStyles.page, { backgroundColor: bgColor }]}
            >
              <PdfHeader title="書く練習" subtitle="かくれんしゅう" />
              <View style={localStyles.fullInfoRow}>
                <Text style={localStyles.fullLargeKanji}>{displayKanji}</Text>
                <View style={localStyles.fullInfoLines}>
                  <View style={localStyles.fullInfoLine}>
                    <Text style={localStyles.fullInfoLabel}>Meaning:</Text>
                    <Text style={localStyles.fullInfoValue}>
                      {item.meaning || '-'}
                    </Text>
                  </View>
                  <View style={localStyles.fullInfoLine}>
                    <Text style={localStyles.fullInfoLabel}>On:</Text>
                    <Text style={localStyles.fullInfoValueJP}>
                      {item.onyomi || '-'}
                    </Text>
                  </View>
                  <View style={localStyles.fullInfoLine}>
                    <Text style={localStyles.fullInfoLabel}>Kun:</Text>
                    <Text style={localStyles.fullInfoValueJP}>
                      {item.kunyomi || '-'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={localStyles.sections}>
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
                <View>
                  <Text style={sharedStyles.sectionLabel}>Practice grid</Text>
                  {pRows.map((r) => (
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
          );
        })}
      </Document>
    );
  }

  // Compact layout: all kanji on one (or more) pages, content wraps
  if (layoutMode === 'compact') {
    return (
      <Document>
        <Page
          size="A4"
          style={[sharedStyles.page, { backgroundColor: bgColor }]}
        >
          <PdfHeader title="書く練習" subtitle="かくれんしゅう" />
          {kanjiList.map((item, i) => {
            const displayKanji = item.kanji || '?';
            const readingParts = [];
            if (item.onyomi) readingParts.push(`On: ${item.onyomi}`);
            if (item.kunyomi) readingParts.push(`Kun: ${item.kunyomi}`);
            return (
              <View key={i} style={localStyles.compactBlock} wrap={false}>
                <View style={localStyles.compactInfo}>
                  <Text style={localStyles.compactKanji}>{displayKanji}</Text>
                  {item.meaning ? (
                    <Text style={localStyles.compactMeaning}>
                      {item.meaning}
                    </Text>
                  ) : null}
                  {readingParts.length > 0 ? (
                    <Text style={localStyles.compactReading}>
                      {readingParts.join('  ')}
                    </Text>
                  ) : null}
                </View>
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
                {pRows.map((r) => (
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
            );
          })}
          <PdfFooter />
        </Page>
      </Document>
    );
  }

  // Grid-only layout: most compact, no readings
  return (
    <Document>
      <Page size="A4" style={[sharedStyles.page, { backgroundColor: bgColor }]}>
        <PdfHeader title="書く練習" subtitle="かくれんしゅう" />
        {kanjiList.map((item, i) => {
          const displayKanji = item.kanji || '?';
          return (
            <View key={i} style={localStyles.gridBlock} wrap={false}>
              <Text style={localStyles.gridLabel}>{displayKanji}</Text>
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
              {pRows.map((r) => (
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
          );
        })}
        <PdfFooter />
      </Page>
    </Document>
  );
}
