import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import {
  Cell,
  PdfHeader,
  PdfFooter,
  sharedStyles,
} from '@/lib/practiceSheets/pdfShared';
import { cellPt, hPadPt } from '@/lib/practiceSheets/constants';

const maxCols = Math.floor((595.28 - 2 * hPadPt) / cellPt);

const localStyles = StyleSheet.create({
  charLabel: {
    fontSize: 24,
    fontFamily: 'NotoSerifJP',
    color: '#111111',
    marginBottom: 4,
    textAlign: 'center',
    width: cellPt,
  },
  charSectionLabel: {
    fontSize: 10.5,
    fontFamily: 'NotoSansJP',
    color: '#334155',
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  charBlock: {
    marginBottom: 14,
  },
});

const TITLES = {
  hiragana: { title: 'ひらがな練習', subtitle: 'ひらがなれんしゅう' },
  katakana: { title: 'カタカナ練習', subtitle: 'カタカナれんしゅう' },
};

export default function KanaSheetDocument({
  characters = [],
  characterType = 'hiragana',
  practiceRows = 3,
  showGuides = true,
  guideStyle = 'standard',
  noBackgroundColor = true,
}) {
  const bgColor = noBackgroundColor ? '#ffffff' : '#f6f1ea';
  const cols = Array.from({ length: maxCols }, (_, i) => i);
  const rows = Array.from({ length: practiceRows }, (_, i) => i);
  const titleInfo = TITLES[characterType] || TITLES.hiragana;

  return (
    <Document>
      <Page size="A4" style={[sharedStyles.page, { backgroundColor: bgColor }]}>
        <PdfHeader title={titleInfo.title} subtitle={titleInfo.subtitle} />

        {characters.map((char, ci) => (
          <View
            key={`${char}-${ci}`}
            style={localStyles.charBlock}
            wrap={false}
          >
            <Text style={localStyles.charSectionLabel}>{char}</Text>
            {/* Model row */}
            <View style={sharedStyles.row}>
              {cols.map((c) => (
                <Cell
                  key={c}
                  character={char}
                  faint
                  showGuides={showGuides}
                  guideStyle={guideStyle}
                />
              ))}
            </View>
            {/* Practice rows */}
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
        ))}

        <PdfFooter tipText="Write each character carefully, following the correct stroke order." />
      </Page>
    </Document>
  );
}
