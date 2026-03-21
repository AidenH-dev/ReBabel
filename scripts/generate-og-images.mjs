import sharp from 'sharp';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fontkit = require('fontkit');
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const WIDTH = 1200;
const HEIGHT = 630;
const BRAND = '#e30a5f';
const DARK_BRAND = '#B0104F';

// Load Fredoka fonts
const fontSemiBold = fontkit.openSync(join(__dirname, 'fonts', 'Fredoka-SemiBold.ttf'));
const fontRegular = fontkit.openSync(join(__dirname, 'fonts', 'Fredoka-Regular.ttf'));
console.log('Loaded Fredoka fonts:', fontSemiBold.familyName, '/', fontRegular.familyName);

/**
 * Convert text to SVG <path> using fontkit glyph outlines.
 * This bakes the Fredoka glyphs directly as vector paths — no font rendering needed by sharp.
 */
function textToPath(text, x, y, fontSize, opts = {}) {
  const font = opts.weight === 'regular' ? fontRegular : fontSemiBold;
  const scale = fontSize / font.unitsPerEm;
  const run = font.layout(text);

  let svgPaths = '';
  let xOffset = 0;

  for (let i = 0; i < run.glyphs.length; i++) {
    const glyph = run.glyphs[i];
    const position = run.positions[i];
    const svgPath = glyph.path.toSVG();
    if (svgPath) {
      const gx = x + (xOffset + position.xOffset) * scale;
      // y baseline: SVG font coords are inverted, scale flips them
      const gy = y;
      svgPaths += `<g transform="translate(${gx.toFixed(1)},${gy.toFixed(1)}) scale(${scale.toFixed(6)},${(-scale).toFixed(6)})"><path d="${svgPath}"/></g>`;
    }
    xOffset += position.xAdvance;
  }

  const fill = opts.fill || 'white';
  const opacity = opts.opacity !== undefined ? ` opacity="${opts.opacity}"` : '';
  return `<g fill="${fill}"${opacity}>${svgPaths}</g>`;
}

/** Measure text width at a given font size. */
function measureText(text, fontSize, opts = {}) {
  const font = opts.weight === 'regular' ? fontRegular : fontSemiBold;
  const scale = fontSize / font.unitsPerEm;
  const run = font.layout(text);
  let width = 0;
  for (const pos of run.positions) {
    width += pos.xAdvance;
  }
  return width * scale;
}

/** Render text centered horizontally at a given y baseline. */
function textToPathCentered(text, centerX, y, fontSize, opts = {}) {
  const w = measureText(text, fontSize, opts);
  return textToPath(text, centerX - w / 2, y, fontSize, opts);
}

// Load logo as base64
let logoBase64 = '';
try {
  const logoBuffer = readFileSync(join(publicDir, 'ReBabelIcon.png'));
  logoBase64 = logoBuffer.toString('base64');
} catch {
  console.warn('Could not load ReBabelIcon.png');
}

const logoImg = logoBase64
  ? `<image href="data:image/png;base64,${logoBase64}" x="50" y="50" width="80" height="80" />`
  : '';

function brandCardSvg(title, subtitle) {
  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${DARK_BRAND}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <circle cx="1100" cy="100" r="200" fill="white" opacity="0.05"/>
  <circle cx="100" cy="530" r="150" fill="white" opacity="0.05"/>
  ${logoImg}
  ${textToPath('ReBabel', 150, 100, 28, { fill: 'white', opacity: 0.9 })}
  ${textToPathCentered(title, WIDTH / 2, HEIGHT / 2 - 10, 56, { fill: 'white' })}
  ${textToPathCentered(subtitle, WIDTH / 2, HEIGHT / 2 + 50, 24, { fill: 'white', weight: 'regular', opacity: 0.85 })}
  <rect x="50" y="${HEIGHT - 80}" width="200" height="4" rx="2" fill="white" opacity="0.3"/>
  ${textToPath('rebabel.org', 50, HEIGHT - 45, 18, { fill: 'white', weight: 'regular', opacity: 0.6 })}
</svg>`;
}

function kanjiPracticeSvg() {
  const cellSize = 64;
  const gridX = 620;
  const gridY = 140;
  const cols = 6;
  const rows = 5;

  let gridCells = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = gridX + c * cellSize;
      const y = gridY + r * cellSize;
      gridCells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="white" stroke="#d0d0d0" stroke-width="1"/>`;
      gridCells += `<line x1="${x + cellSize / 2}" y1="${y}" x2="${x + cellSize / 2}" y2="${y + cellSize}" stroke="#ececec" stroke-width="1"/>`;
      gridCells += `<line x1="${x}" y1="${y + cellSize / 2}" x2="${x + cellSize}" y2="${y + cellSize / 2}" stroke="#ececec" stroke-width="1"/>`;
    }
  }

  // Kanji as plain SVG text (serif, not Fredoka)
  const kanjiInCells = `
    <text x="${gridX + cellSize / 2}" y="${gridY + cellSize / 2 + 4}" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-size="44" fill="#b8b8b8">&#27700;</text>
    <text x="${gridX + cellSize + cellSize / 2}" y="${gridY + cellSize / 2 + 4}" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-size="44" fill="#b8b8b8">&#27700;</text>
    <text x="${gridX + 2 * cellSize + cellSize / 2}" y="${gridY + cellSize / 2 + 4}" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-size="44" fill="#b8b8b8">&#27700;</text>
  `;

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fcfaf7"/>
      <stop offset="52%" stop-color="#f4ede3"/>
      <stop offset="100%" stop-color="#eef3f6"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <rect x="0" y="0" width="580" height="${HEIGHT}" fill="${BRAND}" opacity="0.03"/>
  ${logoImg.replace('x="50" y="50"', 'x="50" y="60"')}
  ${textToPath('ReBabel', 150, 110, 28, { fill: BRAND })}

  ${textToPath('Kanji Writing', 60, 220, 40, { fill: '#1a1a1a' })}
  ${textToPath('Practice Sheets', 60, 275, 40, { fill: '#1a1a1a' })}
  ${textToPath('Printable PDFs with custom', 60, 330, 22, { fill: '#666', weight: 'regular' })}
  ${textToPath('guides, readings & grid sizes', 60, 360, 22, { fill: '#666', weight: 'regular' })}

  <!-- Large example kanji -->
  <text x="180" y="520" text-anchor="middle" font-family="serif" font-size="120" fill="${BRAND}" opacity="0.15">&#27700;</text>

  <rect x="60" y="${HEIGHT - 80}" width="160" height="4" rx="2" fill="${BRAND}" opacity="0.3"/>
  ${textToPath('Free tool \u2014 no login required', 60, HEIGHT - 45, 16, { fill: '#999', weight: 'regular' })}

  <rect x="600" y="120" width="${cols * cellSize + 40}" height="${rows * cellSize + 60}" rx="16" fill="white" stroke="#e0e0e0" stroke-width="1"/>
  ${textToPath('Practice Grid', 620, 152, 14, { fill: '#333' })}
  ${gridCells}
  ${kanjiInCells}
</svg>`;
}

function conjugationHubSvg() {
  // Example conjugation forms shown as a visual element
  const forms = [
    { jp: '食べる', form: 'Dictionary' },
    { jp: '食べます', form: 'Masu' },
    { jp: '食べて', form: 'Te-form' },
    { jp: '食べない', form: 'Negative' },
    { jp: '食べた', form: 'Past' },
    { jp: '食べたい', form: 'Tai' },
  ];

  let formRows = '';
  forms.forEach((f, i) => {
    const y = 160 + i * 58;
    formRows += `<rect x="640" y="${y}" width="500" height="44" rx="8" fill="white" opacity="0.12"/>`;
    formRows += `<text x="660" y="${y + 28}" font-family="serif" font-size="22" fill="white" opacity="0.9">${f.jp}</text>`;
    formRows += textToPath(f.form, 880, y + 30, 14, { fill: 'white', weight: 'regular', opacity: 0.6 });
  });

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${DARK_BRAND}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <circle cx="1100" cy="80" r="200" fill="white" opacity="0.04"/>
  <circle cx="80" cy="550" r="120" fill="white" opacity="0.04"/>
  ${logoImg}
  ${textToPath('ReBabel', 150, 100, 28, { fill: 'white', opacity: 0.9 })}

  ${textToPath('Japanese Conjugation', 60, 240, 44, { fill: 'white' })}
  ${textToPath('Practice', 60, 295, 44, { fill: 'white' })}
  ${textToPath('JLPT N5 \u2013 N1 \u00b7 3,700+ words', 60, 350, 20, { fill: 'white', weight: 'regular', opacity: 0.8 })}
  ${textToPath('19 verb forms \u00b7 6 adjective forms', 60, 380, 20, { fill: 'white', weight: 'regular', opacity: 0.8 })}

  ${formRows}

  <rect x="50" y="${HEIGHT - 80}" width="200" height="4" rx="2" fill="white" opacity="0.3"/>
  ${textToPath('Free tool \u2014 no login required', 50, HEIGHT - 45, 16, { fill: 'white', weight: 'regular', opacity: 0.6 })}
</svg>`;
}

function conjugationLevelSvg(level, label, wordCount) {
  const levelColors = {
    5: ['#10b981', '#059669'],
    4: ['#3b82f6', '#0891b2'],
    3: ['#f59e0b', '#ea580c'],
    2: ['#8b5cf6', '#7c3aed'],
    1: ['#ef4444', '#e11d48'],
  };
  const [c1, c2] = levelColors[level];

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${DARK_BRAND}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <circle cx="1050" cy="120" r="250" fill="white" opacity="0.04"/>
  <circle cx="120" cy="530" r="100" fill="white" opacity="0.04"/>
  ${logoImg}
  ${textToPath('ReBabel', 150, 100, 28, { fill: 'white', opacity: 0.9 })}

  <!-- Level badge -->
  <rect x="60" y="180" width="120" height="120" rx="20" fill="${c1}" opacity="0.9"/>
  <text x="120" y="230" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="white">JLPT</text>
  <text x="120" y="278" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="bold" fill="white">N${level}</text>

  ${textToPath('Conjugation Practice', 210, 230, 40, { fill: 'white' })}
  ${textToPath(label, 210, 280, 24, { fill: 'white', weight: 'regular', opacity: 0.8 })}

  ${textToPath(`${wordCount} words \u00b7 19 verb forms \u00b7 6 adjective forms`, 60, 370, 20, { fill: 'white', weight: 'regular', opacity: 0.8 })}
  ${textToPath('Godan \u00b7 Ichidan \u00b7 Irregular \u00b7 I-adj \u00b7 Na-adj', 60, 400, 20, { fill: 'white', weight: 'regular', opacity: 0.6 })}

  <rect x="50" y="${HEIGHT - 80}" width="200" height="4" rx="2" fill="white" opacity="0.3"/>
  ${textToPath('Free tool \u2014 no login required', 50, HEIGHT - 45, 16, { fill: 'white', weight: 'regular', opacity: 0.6 })}
</svg>`;
}

async function generateImage(name, svgString) {
  const outPath = join(publicDir, name);
  await sharp(Buffer.from(svgString))
    .resize(WIDTH, HEIGHT)
    .png({ quality: 90 })
    .toFile(outPath);
  console.log(`Generated: ${outPath}`);
}

async function main() {
  await generateImage('og-help.png', brandCardSvg(
    'Help & FAQ',
    'Answers to common questions about learning Japanese with ReBabel'
  ));

  await generateImage('og-blog.png', brandCardSvg(
    'ReBabel Blog',
    'Tips, guides & updates for Japanese learners'
  ));

  await generateImage('og-contact.png', brandCardSvg(
    'Contact Us',
    'Get in touch with the ReBabel team'
  ));

  await generateImage('og-srs-guide.png', brandCardSvg(
    'What Is SRS?',
    "A Japanese learner's guide to spaced repetition"
  ));

  await generateImage('og-kanji-practice.png', kanjiPracticeSvg());

  // Conjugation practice images
  await generateImage('og-conjugation-practice.png', conjugationHubSvg());

  const levelLabels = { 5: 'Beginner', 4: 'Elementary', 3: 'Intermediate', 2: 'Upper Intermediate', 1: 'Advanced' };
  const levelCounts = { 5: 219, 4: 303, 3: 774, 2: 809, 1: 1666 };
  for (const n of [5, 4, 3, 2, 1]) {
    await generateImage(`og-conjugation-n${n}.png`, conjugationLevelSvg(n, levelLabels[n], levelCounts[n]));
  }

  console.log('\nAll OG images generated with Fredoka font!');
}

main().catch(console.error);
