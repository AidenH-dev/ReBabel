/* eslint-disable @next/next/no-img-element */

export function getTextWidthPx(text) {
  if (typeof document === 'undefined') return 40;
  const canvas = getTextWidthPx._canvas || document.createElement('canvas');
  getTextWidthPx._canvas = canvas;
  const context = canvas.getContext('2d');
  if (!context) return 40;
  context.font =
    '14px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  return Math.ceil(context.measureText(text || '').width);
}
getTextWidthPx._canvas = null;

export function createListItem(value) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    value,
  };
}

export function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function SvgText({
  text,
  width,
  height,
  fontSize,
  color = '#111111',
  weight = '600',
  letterSpacing = '0',
  family = 'Arial, sans-serif',
  align = 'left',
  baseline = '50%',
  strokeColor,
  strokeWidth = 0,
}) {
  const x = align === 'center' ? '50%' : align === 'right' ? '100%' : '0';
  const anchor =
    align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="${x}" y="${baseline}" dominant-baseline="middle" text-anchor="${anchor}" font-family="${family}" font-size="${fontSize}" font-weight="${weight}" letter-spacing="${letterSpacing}" fill="${color}" stroke="${strokeColor || 'none'}" stroke-width="${strokeWidth}" paint-order="stroke fill">${String(
    text || ''
  )
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</text></svg>`;
  return (
    <img
      src={svgToDataUri(svg)}
      alt={typeof text === 'string' ? text : ''}
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
    />
  );
}
