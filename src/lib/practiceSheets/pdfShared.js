import {
  Font,
  Text,
  View,
  Svg,
  Rect,
  Line,
  StyleSheet,
} from '@react-pdf/renderer';
import { cellPt, hPadPt, vPadPt, accentColor, guideColor } from './constants';

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
Font.register({
  family: 'Fredoka',
  fonts: [
    { src: '/fonts/Fredoka-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Fredoka-SemiBold.ttf', fontWeight: 600 },
  ],
});

export const sharedStyles = StyleSheet.create({
  page: {
    paddingHorizontal: hPadPt,
    paddingVertical: vPadPt,
    fontFamily: 'NotoSansJP',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: 'Fredoka',
    color: '#334155',
    fontWeight: 600,
    letterSpacing: 1.2,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
  },
  footerTip: {
    fontSize: 8,
    fontFamily: 'Fredoka',
    color: '#64748b',
  },
  footerBrand: {
    fontSize: 8,
    fontFamily: 'Fredoka',
    color: accentColor,
    fontWeight: 600,
  },
});

export function Cell({ character, faint, showGuides, guideStyle }) {
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

      {/* Character text: SVG text uses x/y/textAnchor/fill, not CSS box-model */}
      {character ? (
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
          {character}
        </Text>
      ) : null}
    </Svg>
  );
}

export function PdfHeader({ title, subtitle }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'NotoSansJP',
            color: '#334155',
            fontWeight: 'bold',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 9,
            fontFamily: 'NotoSansJP',
            color: '#64748b',
            marginTop: 0,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.1)',
          backgroundColor: 'rgba(255,255,255,0.55)',
          paddingHorizontal: 10,
          paddingVertical: 5,
          marginTop: -5,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            minWidth: 100,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'Fredoka',
              color: '#64748b',
              fontWeight: 600,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            Name:
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            minWidth: 90,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              fontFamily: 'Fredoka',
              color: '#64748b',
              fontWeight: 600,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            Date:
          </Text>
        </View>
      </View>
    </View>
  );
}

export function PdfFooter({
  tipText = 'Practice slowly and aim for balance, proportion, and clean stroke direction.',
}) {
  return (
    <View style={sharedStyles.footer}>
      <Text style={sharedStyles.footerTip}>{tipText}</Text>
      <Text style={sharedStyles.footerBrand}>ReBabel.org</Text>
    </View>
  );
}
