// Prvlar brand: deep violet-blue tile with a white geometric "P" monogram and a small amber spark, and the Home illustration.
// Pure SVG strings (no DOM) shared by the app and the icon scripts in scripts/.
import { iconPaths } from './icons.js';

export const BRAND = {
  blue: '#2F6BFF', blueLight: '#7B61FF', blueDeep: '#2563EB', violet: '#8A7CF8', amber: '#FFC83D',
  bg: '#F4F7FC', ink: '#0F1A3D', white: '#FFFFFF'
};

let uid = 0;
// The app mark (0.9): a violet-to-blue tile with a white open book whose right page carries a little map route
// and pin ("atlas"), plus an amber sparkle. Informed by current study-app icon trends: one bold glyph on a
// vivid gradient tile, soft top highlight, a single warm accent.
// tile: 'rounded' | 'square' | 'circle' | 'none'; inset scales the glyph (safe zones on Android).
// mono: one colour only (Android themed icons / favicon at tiny sizes).
export function markSVG({ size = 1024, tile = 'rounded', inset = 1, glyph = BRAND.white, mono = false } = {}) {
  const id = 'km' + (uid++);
  const r = tile === 'rounded' ? size * 0.23 : tile === 'circle' ? size / 2 : 0;
  const k = (size * 0.62 * inset) / 24, off = (size - 24 * k) / 2;
  const ink = tile === 'none' ? BRAND.blueDeep : `url(#${id})`;
  const bg = tile === 'none' ? '' : `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND.blueLight}"/><stop offset="1" stop-color="${BRAND.blueDeep}"/></linearGradient>
<radialGradient id="${id}h" cx="0.25" cy="0.12" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="${size}" height="${size}" rx="${r}" fill="url(#${id})"/><rect width="${size}" height="${size}" rx="${r}" fill="url(#${id}h)"/>`;
  // 0.9.8 Prvlar mark: a geometric serif-free "P" (stem + open bowl) with a thin baseline rule, plus the amber spark.
  const spark = `<path d="M18.6 13.6c.22 1.15.65 1.58 1.8 1.8-1.15.22-1.58.65-1.8 1.8-.22-1.15-.65-1.58-1.8-1.8 1.15-.22 1.58-.65 1.8-1.8z" fill="${mono ? glyph : BRAND.amber}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${bg}
<g transform="translate(${off} ${off}) scale(${k})">
<g transform="translate(1.1 0)"><rect x="6.4" y="3.6" width="2.9" height="16.8" rx="1.45" fill="${glyph}"/>
<path d="M9.3 3.6h4.3a5.3 5.3 0 0 1 0 10.6H9.3v-2.9h4.3a2.4 2.4 0 0 0 0-4.8H9.3z" fill="${glyph}"/>
${spark}</g></g></svg>`;
}

// Home illustration: a glowing study brain on a platform, with documents orbiting it.
export function heroArt() {
  const card = (x, y, w, h, rot, fill, lines) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})" filter="url(#hsh)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="#E3E9F6"/>${lines}</g>`;
  const bar = (x, y, w, c = '#C9D6EE') => `<rect x="${x}" y="${y}" width="${w}" height="5" rx="2.5" fill="${c}"/>`;
  return `<svg class="hero-art" viewBox="0 0 360 250" role="img" aria-label="Documents turning into a study map" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="hglow" cx="0.5" cy="0.55" r="0.5"><stop offset="0" stop-color="#9DB8FF" stop-opacity=".55"/><stop offset="1" stop-color="#9DB8FF" stop-opacity="0"/></radialGradient>
  <radialGradient id="hbrain" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#7FE0FF"/><stop offset=".55" stop-color="#3D8BFF"/><stop offset="1" stop-color="#5B5BF0"/></radialGradient>
  <linearGradient id="hring" x1="0" x2="1"><stop offset="0" stop-color="#8FB2FF"/><stop offset="1" stop-color="#C3A9FF"/></linearGradient>
  <filter id="hblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
  <filter id="hsh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#2F4FA0" flood-opacity=".16"/></filter>
</defs>
<ellipse cx="180" cy="150" rx="170" ry="95" fill="url(#hglow)"/>
<ellipse cx="180" cy="122" rx="168" ry="62" fill="none" stroke="url(#hring)" stroke-width="1.4" opacity=".7"/>
<circle cx="14" cy="128" r="5" fill="#3D7BFF"/><circle cx="345" cy="112" r="3.5" fill="#B9A6FF"/>
<ellipse class="hp1" cx="180" cy="200" rx="128" ry="30" stroke="url(#hring)" stroke-width="1.5"/>
<ellipse class="hp2" cx="180" cy="198" rx="96" ry="21" stroke="url(#hring)" stroke-width="1.2"/>
<ellipse class="hp3" cx="180" cy="196" rx="62" ry="13"/>
${card(46, 52, 78, 58, -10, '#FFFFFF', bar(58, 66, 34) + bar(58, 78, 52) + bar(58, 90, 44) + `<rect x="98" y="64" width="16" height="16" rx="5" fill="#EEF3FF"/><path d="M102 74l3 3 6-7" stroke="#3D7BFF" stroke-width="2" fill="none" stroke-linecap="round"/>`)}
${card(142, 14, 76, 58, 0, '#FFFFFF', bar(154, 28, 48, '#7EA6FF') + bar(154, 40, 34, '#B8CCFF') + bar(154, 52, 52, '#B8CCFF'))}
${card(238, 46, 66, 62, 9, '#FFF6E0', `<rect x="256" y="62" width="30" height="30" rx="9" fill="#FFB020"/><path d="M265 74a6 6 0 1 1 9 5v3h-6v-3a6 6 0 0 1-3-5zM268 85h6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)}
<ellipse cx="180" cy="150" rx="52" ry="42" fill="#5AA2FF" filter="url(#hblur)" opacity=".75"/>
<path d="M180 108c-10-8-30-6-36 6-12 0-20 12-16 24-8 8-6 22 4 28 2 12 16 18 28 14 6 8 16 8 20 2 4 6 14 6 20-2 12 4 26-2 28-14 10-6 12-20 4-28 4-12-4-24-16-24-6-12-26-14-36-6z" fill="url(#hbrain)" stroke="#E6F3FF" stroke-width="2" stroke-opacity=".8"/>
<g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-opacity=".9">
  <path d="M180 112v74M180 132h-16l-8-8M180 150h-22M180 168h-14l-6 8M180 128h18l8-8M180 146h24M180 164h16l6 8"/>
</g>
<g fill="#FFC23D"><circle cx="156" cy="124" r="4.5"/><circle cx="158" cy="150" r="4"/><circle cx="204" cy="146" r="4.5"/><circle cx="206" cy="120" r="4"/></g>
<circle cx="106" cy="150" r="12" fill="#3D7BFF" filter="url(#hsh)"/><path d="M101 150l3.5 3.5 6.5-7" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="292" cy="134" r="11" fill="#FF6B6B" filter="url(#hsh)"/><circle cx="292" cy="134" r="4" fill="#fff"/>
</svg>`;
}
