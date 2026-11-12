(() => {
'use strict';
/* ============ base ============ */
const H = 270, GROUND = 224;
let VW = 480, rot = false, sx = 1, sy = 1, cssW = 0;
const wrap = document.getElementById('wrap'), cv = document.getElementById('game'), ctx = cv.getContext('2d');
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let seed = 1;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = a => a[rnd() * a.length | 0];
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (c, cx, cy, r, col) => { c.fillStyle = col; for (let dy = -r; dy <= r; dy++) { const dx = Math.floor(Math.sqrt(r * r - dy * dy)); c.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* ============ police pixel 3x5 ============ */
const FONT = { A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57755', N: '65555', O: '25552', P: '65644', Q: '25573', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247', 0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716', '/': '11244', '-': '00700', '.': '00002', '!': '22202', ':': '02020', "'": '22000', '>': '42124', '+': '02720' };
function txt(c, s, x, y, sc = 1, col = '#fff', align = 0, shadow = true) {
  s = String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const w = s.length * 4 * sc - sc;
  x = Math.round(align === 1 ? x - w / 2 : align === 2 ? x - w : x);
  for (const [o, cl] of shadow ? [[1, '#000'], [0, col]] : [[0, col]]) {
    c.fillStyle = cl;
    for (let n = 0; n < s.length; n++) {
      const g = FONT[s[n]]; if (!g) continue;
      for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (+g[j] & (4 >> i)) c.fillRect(x + n * 4 * sc + i * sc + o, y + j * sc + o, sc, sc);
    }
  }
}

/* ============ sprites ============ */
function sprite(rows, pal) {
  const c = mk(18, rows.length), g = c.getContext('2d');
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] !== '.') { g.fillStyle = pal ? pal[r[i]] : '#fff'; g.fillRect(i, j, 1, 1); } });
  return c;
}
function blit(s, cx, y, flip, ox) {
  cx = Math.round(cx); y = Math.round(y);
  if (flip) { ctx.save(); ctx.translate(cx, y); ctx.scale(-1, 1); ctx.drawImage(s, -ox, 0); ctx.restore(); }
  else ctx.drawImage(s, cx - ox, y);
}
const HERO_TOP = ['....hhhhhh', '...hhhhhhhh', '...hhhsssss', '...hhsskssk', '...hsssssss', '....ssssss', '...jjjjjjj', '..jjjjjjjjj', '..jjdjjjjjsss', '..jjdjjjjjj', '..jjdjjjjj', '..jjjjjjjj', '...bbbbbbb', '...ppppppp'];
const HERO_A = HERO_TOP.concat(['...ppp.ppp', '...ppp.ppp', '...ppp.ppp', '...ppp..ppp', '...ppp..ppp', '..kkkk..kkkk']);
const HERO_B = HERO_TOP.concat(['...ppp.ppp', '...pppppp', '....pppp', '....pppp', '....pppp', '...kkkkk']);
const HP = { h: '#2a1a22', s: '#e8b088', k: '#15131c', j: '#c2362f', d: '#7a1c24', b: '#3a2a1e', p: '#34508a' };
const heroS = [sprite(HERO_A, HP), sprite(HERO_B, HP), sprite(HERO_A, null)];
const Z_TOP = ['......HHHHH', '.....HHHHHHH', '.....zrzzrzz', '.....zzzzzzz', '.....zkkkkzz', '......zzzzz', '.....ttttttt', 'zzzzztttttt', '....tttTtttt', 'zzzzzttttttt', '.....ttTtttt', '.....ttttttt', '.....ttttTtt', '.....ppppppp'];
const Z_A = Z_TOP.concat(['.....ppp.ppp', '.....ppp.ppp', '.....pp..ppp', '.....pp...pp', '.....pp...pp', '....kkk..kkk']);
const Z_B = Z_TOP.concat(['.....ppp.ppp', '.....pppppp', '......pppp', '......ppp', '......ppp', '.....kkkk']);
const zWhite = sprite(Z_A, null);
const zpal = (z, H2, t, T, p, r = '#ff3b3b') => ({ z, H: H2, r, k: '#1c2a18', t, T, p });
const zCache = new Map();
const zSpr = pal => { let s = zCache.get(pal); if (!s) { s = [sprite(Z_A, pal), sprite(Z_B, pal)]; zCache.set(pal, s); } return s; };
const G = '#7fae5a';
const ZPALS = {
  city: [zpal(G, G, '#5a6a8a', '#7a1c24', '#3a3340'), zpal(G, '#3a2a22', '#8a5a3a', '#5a2a1a', '#2e3a4a'), zpal(G, G, '#6a4a7a', '#7a1c24', '#3a3340'), zpal(G, '#d8c070', '#b8a070', '#7a1c24', '#4a3a2e'), zpal(G, '#2a1a22', '#4a6a5a', '#7a1c24', '#2e3a4a')],
  base: [zpal(G, '#3a4a2a', '#5a6a3a', '#3a4426', '#4a5630'), zpal(G, '#5a4a3a', '#e9e9e0', '#b01c2c', '#5a6070'), zpal('#a9b4c0', '#a9b4c0', '#6a7a8a', '#4a5a6a', '#55606c', '#101018')],
  runner: zpal('#c8d86a', '#c8d86a', '#b01c2c', '#7a1c24', '#3a3340', '#fff06a'),
  armor: zpal(G, '#8d95a4', '#2e3440', '#4a5260', '#22262e'),
};
const ZT = { n: { hp: 3, sp: [14, 22], dmg: 10 }, r: { hp: 2, sp: [44, 54], dmg: 8 }, a: { hp: 8, sp: [10, 14], dmg: 16 } };
const GUNS = {
  pistol: { n: 'PISTOLET', cd: .3, dmg: 2, pierce: 1, ammo: 18 },
  shotgun: { n: 'FUSIL A POMPE', cd: .65, dmg: 5, pierce: 3, ammo: 10 },
  uzi: { n: 'UZI', cd: .09, dmg: 1, pierce: 1, ammo: 60 },
};

/* ============ niveaux ============ */
const LEVELS = [
  { name: 'BRONX', sub: 'COUCHER DU SOLEIL', kind: 'city', len: 2400, seed: 11,
    sky: ['#140c2e', '#1f0f3c', '#31124a', '#4a1856', '#6c2158', '#93304f', '#bd4a44', '#e06a3c', '#f39a44', '#fbc468'], stars: 40,
    sun: { x: 250, y: 112, r: 24, c1: '#ffd98a', c2: '#fff0c0', bars: '#e06a3c' },
    far: [['#4a1c5c', 70, 125], ['#2a1244', 100, 140]], farWin: ['#fbc468', '#f39a44'],
    mid: { cols: ['#3d1a50', '#4a2058', '#34164a'], edge: '#5c2a66', shade: '#2a103c', lo: 50, hi: 120, lit: .25, win: ['#f8b85a', '#f39a44'], dark: '#2a123e' },
    bricks: [{ base: '#7d3a35', dark: '#5a2730', light: '#9c4f41' }, { base: '#8f6a48', dark: '#6b4a38', light: '#ad8658' }, { base: '#5e3b41', dark: '#432a34', light: '#7b4f4c' }],
    tops: [25, 60], lit: .3, litC: ['#f2b24a', '#ffdc8c', '#c9782e'], glass: ['#171530', '#2e2c56', '#232148'],
    glow: 'rgba(255,170,80,.075)',
    street: { side: '#6b6878', hi: '#8f8ba0', joint: '#55526a', curb: '#474458', road: '#22202c', n1: '#2c2a38', n2: '#191722', dash: '#a88a34' },
    picks: ['shotgun', 'med', 'ammo', 'uzi', 'med'], zmax: 6, rate: 2.4, types: 'nnnnnr', zp: 'city' },
  { name: 'MANHATTAN', sub: 'NUIT', kind: 'city', len: 3000, seed: 29, rain: true,
    sky: ['#04051a', '#070922', '#0b0e2c', '#101436', '#151b42', '#1b234e', '#222c5a', '#2a3666'], stars: 130,
    sun: { x: 330, y: 44, r: 14, c1: '#cfd6ee', c2: '#eef1fb' },
    far: [['#141a44', 30, 120], ['#0c1030', 70, 140]], farWin: ['#ffd46a', '#6ad0ff'],
    mid: { cols: ['#161a40', '#1c2250', '#12163a'], edge: '#2a326a', shade: '#0c1030', lo: 0, hi: 90, lit: .42, win: ['#ffd46a', '#ffe9a8', '#6ad0ff'], dark: '#0c1030' },
    bricks: [{ base: '#3d3550', dark: '#2a2440', light: '#564a6e' }, { base: '#4a3a4a', dark: '#342838', light: '#655064' }, { base: '#2f3a54', dark: '#222a40', light: '#44527a' }],
    tops: [-30, 30], lit: .45, litC: ['#ffd46a', '#fff0b8', '#d99a3a'], glass: ['#0c0e24', '#1c2048', '#161a3a'],
    glow: 'rgba(120,170,255,.07)',
    street: { side: '#4a4c62', hi: '#6a6e8a', joint: '#383a50', curb: '#30324a', road: '#14141e', n1: '#1e1e2c', n2: '#0c0c14', dash: '#8a7a34' },
    picks: ['uzi', 'med', 'shotgun', 'ammo', 'med', 'ammo'], zmax: 8, rate: 1.9, types: 'nnnnrra', zp: 'city' },
  { name: 'ZONE 51', sub: 'PLEIN JOUR', kind: 'base', len: 3200, seed: 51,
    sky: ['#1f6fc0', '#2c7fcc', '#3f92d6', '#5aa6de', '#7dbbe6', '#a4d0ec', '#c9e2ee', '#e8eedc', '#f6ecc0'], stars: 0,
    sun: { x: 300, y: 36, r: 11, c1: '#fff6c8', c2: '#ffffff' }, clouds: true,
    glow: 'rgba(255,240,180,.05)',
    street: { side: '#a89e88', hi: '#c4bba4', joint: '#8a816c', curb: '#7a725e', road: '#3a3833', n1: '#46443e', n2: '#2e2c28', dash: '#d9b030' },
    picks: ['shotgun', 'med', 'uzi', 'ammo', 'med', 'shotgun', 'ammo'], zmax: 10, rate: 1.6, types: 'nnnrraa', zp: 'base' },
];

/* ============ décor : pièces ============ */
function skyCanvas(L) {
  const c = mk(720, 214), g = c.getContext('2d'), S = L.sky;
  for (let y = 0; y < 214; y++) {
    const f = Math.min(y / 178, 1) * (S.length - 1.001), i = Math.floor(f);
    R(g, 0, y, 720, 1, S[i]);
    if (f - i > .5) { g.fillStyle = S[i + 1]; for (let x = y % 2; x < 720; x += 2) g.fillRect(x, y, 1, 1); }
  }
  for (let i = 0; i < L.stars; i++) R(g, rnd() * 720, rnd() * 90, 1, 1, rnd() < .3 ? '#fff' : '#9a9ad0');
  const s = L.sun;
  if (L.kind === 'base') { g.globalCompositeOperation = 'lighter'; disc(g, s.x, s.y, s.r + 14, 'rgba(255,255,220,.12)'); disc(g, s.x, s.y, s.r + 6, 'rgba(255,255,220,.18)'); g.globalCompositeOperation = 'source-over'; }
  disc(g, s.x, s.y, s.r, s.c1); disc(g, s.x, s.y, s.r - 4, s.c2);
  if (s.bars) [-8, -2, 5, 13].forEach((d, i) => R(g, s.x - s.r - 2, s.y + d, s.r * 2 + 6, 1 + (i > 1), s.bars));
  else if (L.kind === 'city') { disc(g, s.x - 4, s.y - 3, 3, s.c1); disc(g, s.x + 5, s.y + 4, 2, s.c1); }
  if (L.clouds) for (let i = 0; i < 7; i++) { const x = rnd() * 700, y = 20 + rnd() * 80, w = 30 + rnd() * 40; R(g, x, y, w, 4, '#fff'); R(g, x + 6, y - 3, w - 16, 3, '#fff'); R(g, x + 4, y + 4, w - 10, 2, '#dfeaf2'); }
  return c;
}
function farCity(L) {
  const c = mk(512, 214), g = c.getContext('2d');
  L.far.forEach(([col, lo, hi], k) => {
    for (let x = 0; x < 512;) {
      let w = 12 + rnd() * 18 | 0; if (512 - x - w < 12) w = 512 - x;
      const top = lo + rnd() * (hi - lo) | 0; R(g, x, top, w, 214 - top, col);
      if (rnd() < .35) { R(g, x + 3, top - 5, w - 6, 5, col); R(g, x + w / 2, top - 14, 1, 9, col); }
      for (let i = 0; i < 7; i++) if (rnd() < .5) R(g, x + 2 + (rnd() * (w - 4) | 0), top + 3 + (rnd() * 50 | 0), 1, 2, L.farWin[k % 2]);
      x += w;
    }
  });
  return c;
}
function midCity(L) {
  const c = mk(720, 214), g = c.getContext('2d'), M = L.mid;
  for (let x = 0; x < 720;) {
    let w = 38 + rnd() * 44 | 0; if (720 - x - w < 30) w = 720 - x;
    const top = M.lo + rnd() * (M.hi - M.lo) | 0;
    R(g, x, top, w, 214 - top, pick(M.cols)); R(g, x, top, 2, 214 - top, M.edge); R(g, x + w - 3, top, 3, 214 - top, M.shade); R(g, x, top, w, 2, M.edge);
    for (let wy = top + 7; wy < 208; wy += 9) for (let wx = x + 5; wx < x + w - 6; wx += 7) R(g, wx, wy, 3, 5, rnd() < M.lit ? pick(M.win) : M.dark);
    const q = rnd();
    if (top > 16 && q < .3) { R(g, x + 8, top - 12, 12, 9, M.shade); R(g, x + 9, top - 3, 1, 3, M.shade); R(g, x + 18, top - 3, 1, 3, M.shade); R(g, x + 10, top - 14, 8, 2, M.shade); }
    else if (top > 16 && q < .55) { R(g, x + w / 2, top - 16, 1, 16, M.shade); R(g, x + w / 2, top - 16, 1, 1, '#ff4040'); }
    x += w;
  }
  return c;
}
function farDesert() {
  const c = mk(512, 214), g = c.getContext('2d'), k = Math.PI * 2 / 512;
  for (let x = 0; x < 512; x++) {
    const h1 = 138 - (16 * Math.sin(k * x * 2 + 1) + 10 * Math.sin(k * x * 5) + 5 * Math.sin(k * x * 11 + 2)) | 0;
    R(g, x, h1, 1, 214 - h1, '#b0a0c0'); if (x % 2) R(g, x, h1, 1, 3, '#c4b6d0');
    const h2 = 160 - (9 * Math.sin(k * x * 3 + 4) + 5 * Math.sin(k * x * 7 + 1)) | 0;
    R(g, x, h2, 1, 214 - h2, '#c9a88e');
  }
  return c;
}
function midDesert() {
  const c = mk(720, 214), g = c.getContext('2d');
  const mesa = (cx, w, top) => {
    for (let y = top; y < 188; y++) {
      const half = w / 2 + (y > top + 16 ? (y - top - 16) * 1.3 : 0) | 0, band = ((y - top) / 5 | 0) % 2;
      R(g, cx - half, y, half * 2, 1, band ? '#b5693a' : '#c47a44'); R(g, cx + half * .35, y, half * .65, 1, band ? '#8f4e2e' : '#9c5a34');
    }
    R(g, cx - w / 2, top, w, 2, '#dc9a5c');
  };
  mesa(110, 90, 96); mesa(390, 60, 118); mesa(600, 130, 84);
  for (let y = 184; y < 214; y++) R(g, 0, y, 720, 1, y < 190 ? '#d2a868' : y < 200 ? '#dcb474' : '#e4c084');
  for (let i = 0; i < 90; i++) R(g, rnd() * 720, 186 + rnd() * 26, 2 + rnd() * 3, 1, rnd() < .5 ? '#c49a5a' : '#ecd09a');
  [[230, 60], [480, 44]].forEach(([x, w]) => { R(g, x, 172, w, 14, '#8d9484'); R(g, x + 4, 168, w - 8, 4, '#8d9484'); R(g, x + 10, 165, w - 20, 3, '#9ba292'); R(g, x + w / 2 - 6, 177, 12, 9, '#565c50'); });
  [300, 540].forEach(x => { R(g, x, 140, 1, 46, '#4a4a48'); R(g, x - 3, 150, 7, 1, '#4a4a48'); R(g, x - 2, 160, 5, 1, '#4a4a48'); R(g, x, 139, 1, 1, '#ff3030'); });
  R(g, 664, 170, 3, 16, '#6a6e66'); for (let i = 0; i < 9; i++) R(g, 656 + i, 160 + Math.abs(i - 4), 1, 10 - Math.abs(i - 4) * 2 + 2, '#c9cfc4'); R(g, 665, 158, 1, 8, '#4a4a48');
  [40, 190, 350, 450, 700].forEach(x => { R(g, x, 174, 2, 14, '#5a6a3a'); R(g, x - 4, 177, 4, 2, '#5a6a3a'); R(g, x - 4, 172, 2, 6, '#5a6a3a'); R(g, x + 2, 180, 4, 2, '#5a6a3a'); R(g, x + 4, 175, 2, 6, '#5a6a3a'); });
  return c;
}
function street(c, len, P) {
  R(c, 0, 210, len, 16, P.side); R(c, 0, 210, len, 1, P.hi); for (let x = 10; x < len; x += 26) R(c, x, 211, 1, 15, P.joint);
  for (let i = 0; i < len / 7; i++) R(c, rnd() * len, 212 + rnd() * 13, 1, 1, rnd() < .5 ? P.hi : P.joint);
  R(c, 0, 226, len, 3, P.curb); R(c, 0, 226, len, 1, P.hi);
  R(c, 0, 229, len, 41, P.road); for (let i = 0; i < len * .55; i++) R(c, rnd() * len, 230 + rnd() * 40, 1 + (rnd() * 2 | 0), 1, rnd() < .5 ? P.n1 : P.n2);
  for (let x = 14; x < len; x += 44) R(c, x, 250, 20, 2, P.dash);
}
function building(c, L, x, w, top, B, pitch) {
  const bot = 210;
  c.save(); c.beginPath(); c.rect(x, top, w, bot - top); c.clip();
  R(c, x, top, w, bot - top, B.base);
  for (let y = top, r = 0; y < bot; y += 4, r++) {
    R(c, x, y + 3, w, 1, B.dark);
    for (let bx = x - (r % 2) * 4; bx < x + w; bx += 8) { const q = rnd(); if (q < .16) R(c, bx, y, 7, 3, B.light); else if (q < .34) R(c, bx, y, 7, 3, B.dark); R(c, bx + 7, y, 1, 3, B.dark); }
  }
  R(c, x, top, 2, bot - top, B.light); R(c, x + w - 3, top, 3, bot - top, 'rgba(0,0,0,.35)');
  c.restore();
  R(c, x - 2, top - 5, w + 4, 5, B.light); R(c, x - 2, top, w + 4, 2, B.dark); for (let dx = x; dx < x + w; dx += 4) R(c, dx, top + 2, 2, 2, B.light);
  const n = Math.floor((w - 12) / 26), m = (w - n * 26 + 14) / 2 | 0, rows = [];
  for (let wy = 150; wy > top + 10; wy -= pitch) rows.unshift(wy);
  rows.forEach(wy => {
    for (let i = 0; i < n; i++) {
      const wx = x + m + i * 26, q = rnd();
      R(c, wx - 2, wy - 3, 16, 2, B.light); R(c, wx - 1, wy - 1, 14, 21, '#140f1c');
      if (q < L.lit) {
        R(c, wx, wy, 12, 19, L.litC[0]); R(c, wx, wy, 12, 6, L.litC[1]);
        if (rnd() < .4) { R(c, wx + 4, wy + 9, 4, 4, '#3a1d2a'); R(c, wx + 3, wy + 13, 6, 6, '#3a1d2a'); } else R(c, wx, wy, 3, 19, L.litC[2]);
      } else if (q < L.lit + .1) { R(c, wx, wy, 12, 19, '#3a2a22'); for (let k = 1; k < 19; k += 5) R(c, wx, wy + k, 12, 3, k % 2 ? '#7a5632' : '#684726'); }
      else { R(c, wx, wy, 12, 19, L.glass[0]); R(c, wx + 1, wy + 1, 4, 7, L.glass[1]); R(c, wx + 7, wy + 11, 3, 5, L.glass[2]); }
      R(c, wx, wy + 9, 12, 1, '#140f1c'); R(c, wx + 5, wy, 1, 19, '#140f1c'); R(c, wx - 2, wy + 19, 16, 2, B.light); R(c, wx - 2, wy + 21, 16, 1, B.dark);
    }
  });
  return rows;
}
function fireEscape(c, x, w, rows) {
  const iron = '#0d0b14', hi = '#2e2a3c';
  if (!rows.length) return;
  rows.forEach((wy, i) => {
    const py = wy + 22;
    if (i < rows.length - 1) { const n = rows[i + 1] + 22 - py, d = i % 2; for (let s = 0; s < n; s++) { const t = s / n, sxx = d ? x + 5 + t * (w - 16) : x + w - 11 - t * (w - 16); R(c, sxx, py + s, 6, 1, s % 3 ? iron : hi); } }
    R(c, x - 1, py, w + 2, 2, iron); R(c, x - 1, py + 2, w + 2, 1, hi); R(c, x - 1, py - 10, w + 2, 1, iron); R(c, x - 1, py - 6, w + 2, 1, iron);
    for (let bx = x; bx < x + w; bx += 3) R(c, bx, py - 10, 1, 10, iron);
    R(c, x + 2, py + 3, 1, 3, iron); R(c, x + w - 3, py + 3, 1, 3, iron);
  });
  const ly = rows[rows.length - 1] + 25; R(c, x + 4, ly, 1, 11, iron); R(c, x + 10, ly, 1, 11, iron); for (let k = 1; k < 11; k += 3) R(c, x + 4, ly + k, 7, 1, iron);
}
function ladderArt(c, x, top) {
  const y = top - 5, h = 210 - y;
  R(c, x - 1, y, 12, h, 'rgba(0,0,0,.35)'); R(c, x, y, 2, h, '#f2c230'); R(c, x + 8, y, 2, h, '#f2c230'); R(c, x + 1, y, 1, h, '#b8860f'); R(c, x + 9, y, 1, h, '#b8860f');
  for (let ry = y + 4; ry < 208; ry += 5) { R(c, x + 2, ry, 6, 1, '#ffe07a'); R(c, x + 2, ry + 1, 6, 1, '#b8860f'); }
}
function stoop(c, x) {
  R(c, x, 178, 26, 32, '#c9b9a4'); R(c, x + 4, 182, 18, 28, '#2a1620'); R(c, x + 6, 184, 6, 12, '#3d2230'); R(c, x + 14, 184, 6, 12, '#3d2230'); R(c, x + 19, 197, 2, 2, '#d9a441');
  R(c, x - 2, 204, 30, 3, '#9d93a6'); R(c, x - 4, 207, 34, 3, '#847a90');
}
function boarded(c, x) { R(c, x, 186, 16, 18, '#3a2a22'); [187, 193, 199].forEach(y => R(c, x, y, 16, 4, '#7a5632')); }
function cans(c, x) { [0, 11].forEach((d, i) => { R(c, x + d, 198 + i * 2, 9, 12 - i * 2, '#6a7280'); R(c, x + d - 1, 197 + i * 2, 11, 2, '#8d95a4'); for (let k = 1; k < 9; k += 3) R(c, x + d + k, 200 + i * 2, 1, 9 - i * 2, '#4a5260'); }); }
function shop(c, x, w) {
  const name = pick(['DELI', 'PIZZA', 'BAR', 'TATTOO', 'CAFE', '24H']), neon = pick(['#ff6ec7', '#ffe14a', '#6ef0ff', '#ff5a4a']), aw = pick(['#2f7d5b', '#b8463c', '#3a5a9a']);
  R(c, x + 4, 170, w - 8, 40, '#1c2328'); R(c, x + 8, 180, 54, 26, '#0f3f47'); R(c, x + 10, 182, 50, 22, '#1d7f82'); R(c, x + 10, 182, 50, 5, '#3fc4b8');
  [14, 24, 36, 48].forEach((d, i) => R(c, x + d, 196 - (i % 2) * 3, 7, 8 + (i % 2) * 3, '#0f3f47'));
  txt(c, name, x + 35, 185, 2, neon, 1, false);
  c.globalCompositeOperation = 'lighter'; R(c, x + 10, 182, 50, 14, 'rgba(255,120,200,.08)'); c.globalCompositeOperation = 'source-over';
  R(c, x + 68, 180, 20, 30, '#0f1418'); R(c, x + 70, 182, 16, 28, '#3a2c26'); R(c, x + 72, 184, 12, 12, '#1d7f82'); R(c, x + 83, 198, 2, 2, '#d9a441');
  for (let ax = x + 4, i = 0; ax < x + 98; ax += 8, i++) { R(c, ax, 168, 8, 9, i % 2 ? '#e9dfc0' : aw); R(c, ax + 1, 177, 6, 2, i % 2 ? '#e9dfc0' : aw); }
  if (w >= 120) { R(c, x + 98, 180, 16, 22, '#55402e'); R(c, x + 100, 182, 12, 8, '#e9dfc0'); R(c, x + 100, 192, 12, 2, '#b8463c'); R(c, x + 100, 196, 8, 2, '#b8463c'); }
}
function metalDoor(c, x) {
  R(c, x, 182, 20, 28, '#1a141e'); R(c, x + 2, 184, 16, 26, '#3f4a5a'); R(c, x + 4, 186, 12, 8, '#2b3340'); R(c, x + 15, 198, 2, 2, '#c9c2d4');
  R(c, x + 24, 186, 14, 18, '#d9cfae'); R(c, x + 26, 188, 10, 6, '#7a2030'); R(c, x + 26, 196, 10, 1, '#3a2a2e'); R(c, x + 26, 199, 7, 1, '#3a2a2e');
}
function lamp(c, x, glow) {
  R(c, x, 116, 3, 110, '#0d0b14'); R(c, x - 2, 222, 7, 4, '#0d0b14'); R(c, x - 12, 116, 14, 2, '#0d0b14'); R(c, x - 16, 117, 9, 4, '#0d0b14'); R(c, x - 15, 121, 7, 2, '#fff0c0');
  c.globalCompositeOperation = 'lighter'; [40, 28, 17, 9].forEach(r => disc(c, x - 12, 126, r, glow));
  [[-44, 212, 66], [-38, 216, 54], [-32, 220, 42]].forEach(([d, y, w]) => R(c, x + d, y, w, 4, glow)); c.globalCompositeOperation = 'source-over';
}
function hydrant(c, x) { R(c, x + 1, 213, 6, 11, '#c2362f'); R(c, x, 212, 8, 2, '#e0554a'); R(c, x + 2, 210, 4, 2, '#e0554a'); R(c, x - 1, 216, 10, 3, '#c2362f'); R(c, x + 3, 216, 2, 2, '#7a1c1c'); R(c, x, 223, 8, 2, '#8a2420'); }
function car(c, x, body, hi, lo, taxi) {
  R(c, x - 2, 262, 82, 3, 'rgba(0,0,0,.5)');
  R(c, x, 245, 78, 13, body); R(c, x + 16, 234, 40, 12, body); R(c, x, 245, 78, 2, hi); R(c, x + 16, 234, 40, 1, hi);
  R(c, x + 19, 236, 16, 9, '#161c2c'); R(c, x + 38, 236, 15, 9, '#161c2c'); R(c, x + 21, 237, 4, 3, '#3a4666'); R(c, x + 42, 238, 1, 6, '#e9dfd2'); R(c, x + 43, 240, 3, 1, '#e9dfd2');
  if (taxi) { for (let i = 0; i < 26; i++) R(c, x + i * 3, 251, 3, 2, i % 2 ? '#15131c' : '#f6f0d8'); R(c, x + 31, 231, 10, 3, '#fff0c0'); R(c, x + 33, 232, 6, 1, '#15131c'); }
  R(c, x, 256, 78, 2, lo); R(c, x + 76, 247, 2, 4, '#fff0c0'); R(c, x, 247, 2, 4, '#b8362f');
  disc(c, x + 16, 259, 5, '#0d0b14'); disc(c, x + 62, 259, 5, '#0d0b14'); disc(c, x + 16, 259, 2, '#6a7280'); disc(c, x + 62, 259, 2, '#6a7280');
}
function fence(c, x, w, top, col, barbed) {
  c.fillStyle = col; for (let y = top + 2; y < 210; y++) for (let fx = x + (y % 2); fx < x + w; fx += 2) c.fillRect(fx, y, 1, 1);
  R(c, x, top, w, 2, '#3a364a'); for (let px = x; px < x + w; px += 30) R(c, px, top - 3, 2, 213 - top, '#3a364a');
  if (barbed) for (let fx = x; fx < x + w; fx += 2) R(c, fx, top - 4 - (fx / 2 % 2 | 0) * 2, 1, 1, '#2a2a2a');
}
function garage(c, x) {
  R(c, x, 150, 90, 60, '#4d485e'); for (let i = 0; i < 60; i++) R(c, x + rnd() * 88, 150 + rnd() * 60, 2, 1, rnd() < .5 ? '#5b566e' : '#3f3b4e');
  R(c, x - 2, 145, 94, 5, '#6a6480'); R(c, x - 2, 150, 94, 2, '#2e2a3c');
  R(c, x + 8, 162, 60, 48, '#2b2838'); R(c, x + 10, 164, 56, 46, '#3d3a4e'); for (let y = 166; y < 210; y += 3) R(c, x + 10, y, 56, 1, '#2e2b3c');
  const a = pick(['#e0457b', '#f2c230', '#7ad13a']), b2 = pick(['#3fd0c9', '#ff7a3a']);
  txt(c, 'Z', x + 17, 174, 6, b2, 0, false); txt(c, 'Z', x + 15, 172, 6, a, 0, false); txt(c, pick(['Z', 'X', 'K']), x + 43, 180, 4, '#f2c230', 0, false);
  R(c, x + 36, 170, 3, 3, a); R(c, x + 60, 198, 4, 2, b2); R(c, x + 13, 203, 9, 2, a);
  R(c, x + 6, 136, 14, 9, '#5b566e'); R(c, x + 8, 138, 10, 2, '#2e2a3c'); R(c, x + 8, 141, 10, 2, '#2e2a3c');
  ladderArt(c, x + 76, 146);
}
function scaffold(c, x) {
  R(c, x + 4, 168, 2, 42, '#6e6a80'); R(c, x + 54, 168, 2, 42, '#6e6a80'); R(c, x + 29, 171, 2, 39, '#56526a');
  for (let i = 0; i < 24; i++) R(c, x + 30 + i, 172 + i * 1.5, 1, 1, '#56526a');
  R(c, x, 167, 58, 3, '#b07c40'); R(c, x, 170, 58, 1, '#6a4622'); for (let px = x + 12; px < x + 58; px += 12) R(c, px, 167, 1, 3, '#6a4622');
  R(c, x + 4, 156, 54, 1, '#6e6a80'); R(c, x + 54, 156, 2, 12, '#6e6a80');
  ladderArt(c, x + 8, 168);
}
function bunker(c, x, con, conD, conL) {
  R(c, x, 128, 200, 82, con); R(c, x + 10, 118, 190, 10, con); R(c, x + 26, 110, 174, 8, con);
  R(c, x, 128, 200, 2, conL); R(c, x + 10, 118, 190, 2, conL); R(c, x + 26, 110, 174, 2, conL); R(c, x, 128, 3, 82, conL);
  for (let y = 138; y < 210; y += 12) R(c, x, y, 200, 1, conD);
  for (let i = 0; i < 80; i++) R(c, x + rnd() * 198, 112 + rnd() * 96, 2, 1, rnd() < .5 ? conD : conL);
  R(c, x + 30, 142, 34, 5, '#0d0b14'); R(c, x + 136, 142, 34, 5, '#0d0b14');
  R(c, x + 78, 160, 44, 50, conD); for (let i = 0; i < 11; i++) R(c, x + 78 + i * 4, 160, 4, 4, i % 2 ? '#15131c' : '#f2c230');
  R(c, x + 82, 166, 36, 44, '#4a5a52'); R(c, x + 82, 166, 36, 2, '#6a7e72'); R(c, x + 99, 166, 2, 44, '#2a3630'); R(c, x + 92, 186, 4, 6, '#c9c2d4'); R(c, x + 104, 186, 4, 6, '#c9c2d4');
  txt(c, 'BUNKER', x + 100, 146, 2, '#f2c230', 1);
  for (let i = 0; i < 4; i++) { R(c, x + 14 + i * 14, 198, 13, 6, '#8a7a56'); R(c, x + 14 + i * 14, 198, 13, 1, '#a8966a'); }
  for (let i = 0; i < 3; i++) R(c, x + 21 + i * 14, 192, 13, 6, '#7a6c4c');
}

/* ============ génération d'un niveau ============ */
function genCity(c, L, W) {
  const end = L.len - 200; let x = -10, last = 0, alt = 0, prev = '', pi = 0, first = true;
  const np = () => L.picks[pi++ % L.picks.length];
  while (x < end - 30) {
    let t = first ? 'ten' : x - last > 360 ? (alt++ % 2 ? 'scaf' : 'gar') : pick(['ten', 'ten', 'lot', 'alley', 'ten', 'lot']);
    if (t === prev && t !== 'ten') t = 'ten';
    first = false;
    let w = t === 'gar' ? 90 : t === 'alley' ? 30 : t === 'lot' ? 80 + (rnd() * 3 | 0) * 20 : t === 'scaf' ? 130 : 110 + (rnd() * 4 | 0) * 10;
    if (x + w > end) { t = 'lot'; w = end - x; }
    if (t === 'ten' || t === 'scaf') {
      const top = L.tops[0] + rnd() * (L.tops[1] - L.tops[0]) | 0, rows = building(c, L, x, w, top, pick(L.bricks), 30 + (rnd() * 4 | 0) * 2);
      if (t === 'scaf') {
        metalDoor(c, x + 16); fireEscape(c, x + 12, 44, rows.slice(0, -1)); scaffold(c, x + 62);
        const pl = { x: x + 62, w: 58, y: 167 }; W.plats.push(pl); W.lads.push({ cx: x + 75, top: 167, plat: pl }); W.picks.push({ x: x + 102, y: 167, type: np() }); last = x;
      } else {
        const g = rnd();
        if (g < .4 && w >= 110) shop(c, x, w); else if (g < .75) { stoop(c, x + (w >> 1) - 13); boarded(c, x + 14); cans(c, x + w - 30); } else { metalDoor(c, x + 20); boarded(c, x + w - 34); }
        fireEscape(c, rnd() < .5 ? x + w - 60 : x + 12, 46, rows);
      }
    } else if (t === 'gar') {
      garage(c, x); const pl = { x: x - 2, w: 94, y: 145 }; W.plats.push(pl); W.lads.push({ cx: x + 81, top: 145, plat: pl }); W.picks.push({ x: x + 34, y: 145, type: np() }); last = x;
    } else if (t === 'lot') {
      fence(c, x, w, 172, '#15131c');
      if (w >= 100) { R(c, x + w / 2, 150, 2, 60, '#3a364a'); R(c, x + w / 2 - 9, 146, 20, 14, '#d9cfae'); R(c, x + w / 2 - 4, 153, 10, 6, '#b8463c'); R(c, x + w / 2 - 2, 160, 7, 1, '#e06a3c'); }
    } else { R(c, x, 120, 30, 90, 'rgba(10,6,22,.5)'); R(c, x, 185, 30, 25, 'rgba(10,6,22,.5)'); fence(c, x, 30, 176, '#0d0b14'); }
    prev = t; x += w;
  }
  street(c, L.len, L.street);
  bunker(c, L.len - 200, '#6a6878', '#4c4a5a', '#8a889a');
  for (let lx = 150; lx < L.len - 230; lx += 230 + (rnd() * 60 | 0)) { let px = lx; if (W.lads.some(l => Math.abs(l.cx - px) < 26 || Math.abs(l.cx - px + 12) < 26)) px += 44; lamp(c, px, L.glow); }
  for (let hx = 260; hx < L.len - 260; hx += 300 + (rnd() * 200 | 0)) hydrant(c, hx);
  for (let cx = 30, i = 0; cx < L.len - 300; cx += 380 + (rnd() * 260 | 0), i++) {
    if (i % 3 === 0) car(c, cx, '#e0a81e', '#f6cc4c', '#8a6410', true); else if (i % 3 === 1) car(c, cx, '#5a6a8a', '#7a8cae', '#34405a'); else car(c, cx, '#7a2a2e', '#a84044', '#4a181c');
    R(c, cx + 110, 238, 34, 1, L.street.n1); R(c, cx + 116, 240, 26, 1, L.street.dash);
  }
}
function genBase(c, L, W) {
  const end = L.len - 200; let x = 0, last = 0, alt = 0, prev = '', pi = 0, first = true, n = 0;
  const np = () => L.picks[pi++ % L.picks.length];
  const cont = (cx, cy, w, col, dk, lt) => { R(c, cx, cy, w, 26, col); for (let i = 3; i < w - 2; i += 3) R(c, cx + i, cy + 2, 1, 22, dk); R(c, cx, cy, w, 2, lt); R(c, cx, cy + 24, w, 2, dk); R(c, cx, cy, 2, 26, lt); R(c, cx + w - 2, cy, 2, 26, dk); };
  const CC = [['#a8452e', '#7a2e20', '#c85e40'], ['#3a6a9a', '#284c70', '#5288ba'], ['#5a6a3a', '#3e4a28', '#76884e'], ['#c9a23a', '#94762a', '#e2bc58']];
  while (x < end - 30) {
    let t = first ? 'fence' : x - last > 340 ? (alt++ % 2 ? 'cont' : 'tower') : pick(['fence', 'hangar', 'fence', 'saucer', 'hangar', 'fence']);
    if (t === prev) t = t === 'fence' ? 'hangar' : 'fence';
    if (t === 'saucer' && n++ % 2) t = 'fence';
    first = false;
    let w = t === 'fence' ? 90 + (rnd() * 3 | 0) * 30 : t === 'hangar' ? 170 : t === 'tower' ? 60 : t === 'cont' ? 116 : 120;
    if (x + w > end) { t = 'fence'; w = end - x; }
    if (t === 'fence') {
      fence(c, x, w, 168, '#3a3a34', true);
      if (w >= 90) { const sxx = x + (w >> 1) - 18; R(c, sxx - 1, 179, 38, 18, '#15131c'); R(c, sxx, 180, 36, 16, '#e0b020'); txt(c, 'DANGER', sxx + 18, 182, 1, '#15131c', 1, false); txt(c, 'ZONE 51', sxx + 18, 189, 1, '#7a1c1c', 1, false); }
    } else if (t === 'hangar') {
      for (let i = 0; i < w; i++) { const u = (i - w / 2) / (w / 2), top = 210 - (34 + 56 * Math.sqrt(1 - u * u)) | 0; R(c, x + i, top, 1, 210 - top, i % 10 === 0 ? '#5c6258' : i % 10 < 5 ? '#8a9184' : '#7d8478'); R(c, x + i, top, 1, 2, '#a8b0a0'); }
      R(c, x + w / 2 - 38, 156, 76, 54, '#40463c'); R(c, x + w / 2 - 35, 159, 70, 51, '#565c50'); R(c, x + w / 2 - 1, 159, 2, 51, '#30352c');
      for (let dx = -35; dx < 35; dx += 5) R(c, x + w / 2 + dx, 205, 5, 5, (dx / 5 | 0) % 2 ? '#15131c' : '#e0b020');
      txt(c, String(10 + (rnd() * 80 | 0)), x + w / 2, 172, 4, '#d9d4c0', 1, false); R(c, x + w / 2 - 3, 148, 6, 4, '#ffe9a8');
    } else if (t === 'tower') {
      const tx = x + 5; R(c, tx + 4, 150, 3, 60, '#4a4a40'); R(c, tx + 43, 150, 3, 60, '#4a4a40');
      for (let i = 0; i < 36; i++) { R(c, tx + 7 + i, 152 + i * .75, 1, 1, '#5e5e52'); R(c, tx + 42 - i, 180 + i * .75, 1, 1, '#5e5e52'); }
      R(c, tx + 4, 179, 42, 1, '#5e5e52'); R(c, tx, 146, 50, 4, '#7a6a44'); R(c, tx, 150, 50, 1, '#4a3e26'); R(c, tx, 134, 50, 1, '#4a4a40'); for (let i = 0; i < 50; i += 7) R(c, tx + i, 134, 1, 12, '#4a4a40');
      R(c, tx + 3, 114, 2, 32, '#4a4a40'); R(c, tx + 45, 114, 2, 32, '#4a4a40'); R(c, tx - 4, 106, 58, 8, '#5a5f52'); R(c, tx - 4, 106, 58, 2, '#767c6c'); R(c, tx + 44, 118, 7, 5, '#2a2a2a'); R(c, tx + 51, 119, 2, 3, '#fff6c8');
      ladderArt(c, tx + 20, 147);
      const pl = { x: tx, w: 50, y: 146 }; W.plats.push(pl); W.lads.push({ cx: tx + 25, top: 146, plat: pl }); W.picks.push({ x: tx + 41, y: 146, type: np() }); last = x;
    } else if (t === 'cont') {
      const a = pick(CC), b2 = pick(CC), d = pick(CC);
      cont(x + 2, 184, 54, ...a); cont(x + 58, 184, 54, ...b2); cont(x + 24, 158, 60, ...d); ladderArt(c, x + 30, 159);
      const pl = { x: x + 24, w: 60, y: 158 }; W.plats.push(pl); W.lads.push({ cx: x + 35, top: 158, plat: pl }); W.picks.push({ x: x + 68, y: 158, type: np() }); last = x;
    } else {
      const cx = x + 60;
      for (let dy = -9; dy <= 9; dy++) { const hw = 46 * Math.sqrt(1 - dy * dy / 81) | 0; R(c, cx - hw, 196 + dy, hw * 2, 1, dy < -3 ? '#c4ccd4' : dy < 3 ? '#9aa4ae' : '#6c7680'); }
      for (let dy = -12; dy <= 0; dy++) { const hw = 18 * Math.sqrt(1 - dy * dy / 144) | 0; R(c, cx - hw, 187 + dy, hw * 2, 1, '#7fd8c8'); R(c, cx - hw, 187 + dy, 4, 1, '#c8fff0'); }
      for (let i = -3; i <= 3; i++) R(c, cx + i * 12 - 1, 196, 3, 2, i % 2 ? '#7aff7a' : '#fff06a');
      R(c, x + 6, 203, 108, 7, '#b89868'); R(c, x + 16, 200, 30, 3, '#b89868'); R(c, x + 70, 201, 36, 2, '#b89868');
      for (let i = 0; i < 14; i++) R(c, cx + 20 + Math.sin(i) * 4, 176 - i * 5, 5 + i % 3, 4, i % 2 ? 'rgba(60,60,60,.5)' : 'rgba(90,90,90,.4)');
    }
    prev = t; x += w;
  }
  street(c, L.len, L.street);
  bunker(c, L.len - 200, '#a89878', '#7e7058', '#c8b894');
  for (let lx = 200; lx < L.len - 230; lx += 300 + (rnd() * 80 | 0)) { let px = lx; if (W.lads.some(l => Math.abs(l.cx - px) < 26 || Math.abs(l.cx - px + 12) < 26)) px += 44; lamp(c, px, L.glow); }
  for (let jx = 90; jx < L.len - 300; jx += 520 + (rnd() * 300 | 0)) {
    R(c, jx - 2, 262, 74, 3, 'rgba(0,0,0,.4)'); R(c, jx, 246, 70, 12, '#5a6a3a'); R(c, jx + 22, 234, 26, 12, '#4a5630'); R(c, jx + 25, 237, 20, 8, '#161c2c'); R(c, jx, 246, 70, 2, '#76884e'); R(c, jx + 54, 240, 12, 6, '#5a6a3a');
    txt(c, 'US', jx + 6, 250, 1, '#e9e9e0', 0, false); disc(c, jx + 14, 259, 5, '#0d0b14'); disc(c, jx + 56, 259, 5, '#0d0b14'); disc(c, jx + 14, 259, 2, '#6a6e66'); disc(c, jx + 56, 259, 2, '#6a6e66');
  }
}

/* ============ état du jeu ============ */
let world, sky, far, mid, L, W, li = 0, state = 'title', stT = 0, time = 0, shake = 0;
let p, zombies, bullets, parts, pops, spawnT, kills = 0, totalKills = 0, camX = 0;
const input = { x: 0, y: 0, fire: false };

function loadLevel(i, keep) {
  li = i; L = LEVELS[i]; seed = L.seed;
  W = { plats: [], lads: [], picks: [] };
  sky = skyCanvas(L);
  far = L.kind === 'city' ? farCity(L) : farDesert();
  mid = L.kind === 'city' ? midCity(L) : midDesert();
  world = mk(L.len, H); const c = world.getContext('2d');
  (L.kind === 'city' ? genCity : genBase)(c, L, W);
  const old = p;
  p = { x: 40, y: GROUND, vy: 0, dir: 1, hp: 100, st: 'ground', plat: null, lad: null, gun: 'pistol', ammo: 18, cd: 0, inv: 0, swing: 0, flash: 0, walk: 0 };
  if (keep && old) { p.gun = old.gun; p.ammo = Math.max(old.ammo, 12); p.hp = Math.min(100, old.hp + 30); }
  zombies = []; bullets = []; parts = []; pops = []; spawnT = 1.5; kills = 0; camX = 0;
  [300, 420, 560].forEach(x => spawn(x));
}
function spawn(x) {
  const t = pick(L.types.split('')), T = ZT[t];
  const pal = t === 'r' ? ZPALS.runner : t === 'a' ? ZPALS.armor : pick(ZPALS[L.zp]);
  zombies.push({ x, t, hp: T.hp, sp: T.sp[0] + rnd() * (T.sp[1] - T.sp[0]), dmg: T.dmg, pal, off: rnd() * 14 - 7, kb: 0, hit: 0, ph: rnd() * 6 });
}
function blood(x, y, n) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * 90, vy: -Math.random() * 110, life: .5 + Math.random() * .4, col: Math.random() < .6 ? '#b01c2c' : '#e0354b' }); }
function pop(x, y, s, col = '#fff') { pops.push({ x, y, s, col, life: 1.1 }); }
function hurtZ(z, dmg, dir) {
  z.hp -= dmg; z.hit = .1; z.kb = dir * (z.t === 'a' ? 40 : 90); blood(z.x, GROUND - 12, 4); snd(180, .06, 'square', .04, -80);
  if (z.hp <= 0) {
    blood(z.x, GROUND - 10, 12); kills++; totalKills++; zombies.splice(zombies.indexOf(z), 1);
    const q = Math.random(); if (q < .16) W.picks.push({ x: z.x, y: GROUND, type: 'ammo' }); else if (q < .2) W.picks.push({ x: z.x, y: GROUND, type: 'med' });
  }
}
function setState(s) { state = s; stT = 0; }

/* ============ mise à jour ============ */
function update(dt) {
  time += dt; stT += dt; shake = Math.max(0, shake - dt * 8);
  if (state !== 'play') return;
  const doorX = L.len - 100;
  p.cd -= dt; p.inv -= dt; p.swing -= dt; p.flash -= dt;
  if (p.st === 'ladder') {
    p.y += input.y * 62 * dt; p.x = p.lad.cx; p.walk += Math.abs(input.y) * dt * 8;
    if (p.y <= p.lad.top) { p.y = p.lad.top; p.st = 'plat'; p.plat = p.lad.plat; }
    else if (p.y >= GROUND) { p.y = GROUND; p.st = 'ground'; }
  } else {
    p.x = clamp(p.x + input.x * 72 * dt, 8, doorX);
    if (Math.abs(input.x) > .2) { p.dir = Math.sign(input.x); p.walk += dt * 9; }
    const lad = W.lads.find(l => Math.abs(p.x - l.cx) < 8);
    if (lad) {
      if (p.st === 'ground' && input.y < -.55) { p.st = 'ladder'; p.lad = lad; p.y -= 1; }
      else if (p.st === 'plat' && input.y > .55 && p.plat === lad.plat) { p.st = 'ladder'; p.lad = lad; p.y += 1; }
    }
    if (p.st === 'plat' && (p.x < p.plat.x - 2 || p.x > p.plat.x + p.plat.w + 2)) { p.st = 'fall'; p.vy = 0; }
    if (p.st === 'fall') { p.vy += 620 * dt; p.y += p.vy * dt; if (p.y >= GROUND) { p.y = GROUND; p.st = 'ground'; } }
    if (input.fire && p.cd <= 0) {
      const g = GUNS[p.gun];
      if (p.ammo > 0) {
        p.ammo--; p.cd = g.cd; p.flash = .06;
        bullets.push({ x: p.x + p.dir * 12, y: p.y - 12, vx: p.dir * 420, dmg: g.dmg, pierce: g.pierce, life: p.gun === 'shotgun' ? .38 : .9, hitSet: [] });
        snd(p.gun === 'shotgun' ? 110 : p.gun === 'uzi' ? 300 : 220, p.gun === 'shotgun' ? .18 : .08, 'sawtooth', .06, -90);
        if (p.gun === 'shotgun') shake = 1;
      } else {
        p.cd = .4; p.swing = .16; snd(140, .07, 'triangle', .05, 60);
        if (p.y > GROUND - 8) zombies.slice().forEach(z => { const d = (z.x - p.x) * p.dir; if (d > -4 && d < 22) hurtZ(z, 2, p.dir); });
      }
    }
  }
  if (p.x >= doorX - 1 && p.st === 'ground') { snd(520, .15, 'square', .05, 300); setState(li < LEVELS.length - 1 ? 'clear' : 'win'); return; }
  /* caméra */
  camX += (clamp(p.x - VW * .4 + p.dir * 20, 0, L.len - VW) - camX) * Math.min(1, dt * 5);
  /* zombies */
  const prog = p.x / L.len;
  spawnT -= dt;
  if (spawnT <= 0 && zombies.length < L.zmax) {
    spawnT = L.rate * (1 - .4 * prog) * (.7 + Math.random() * .6);
    let x = Math.random() < .7 ? camX + VW + 14 : camX - 14;
    if (x < 0) x = camX + VW + 14; if (x > doorX - 30) x = camX - 14;
    if (x > 0) spawn(x);
  }
  zombies.forEach(z => {
    z.hit -= dt;
    if (Math.abs(z.kb) > 4) { z.x += z.kb * dt; z.kb *= Math.pow(.002, dt); }
    else { const tx = p.x + z.off, d = tx - z.x; if (Math.abs(d) > 2) { z.x += Math.sign(d) * z.sp * dt; z.dir = Math.sign(d); } z.ph += dt * (z.sp > 30 ? 12 : 6); }
    if (Math.abs(z.x - p.x) < 9 && p.y > GROUND - 20 && p.inv <= 0) {
      p.hp -= z.dmg; p.inv = .8; shake = 1.5; blood(p.x, p.y - 12, 5); snd(90, .15, 'sawtooth', .07, -40);
      if (p.st !== 'ladder') p.x = clamp(p.x + Math.sign(p.x - z.x || 1) * 6, 8, doorX);
      if (p.hp <= 0) { p.hp = 0; setState('dead'); }
    }
  });
  /* balles */
  bullets.forEach(b => {
    b.x += b.vx * dt; b.life -= dt;
    if (b.y > GROUND - 21) for (const z of zombies.slice()) if (b.pierce > 0 && !b.hitSet.includes(z) && Math.abs(z.x - b.x) < 7) { b.hitSet.push(z); b.pierce--; hurtZ(z, b.dmg, Math.sign(b.vx)); }
  });
  bullets = bullets.filter(b => b.life > 0 && b.pierce > 0 && b.x > camX - 20 && b.x < camX + VW + 20);
  /* bonus */
  W.picks.forEach(k => {
    if (k.got || Math.abs(k.x - p.x) > 10 || Math.abs(k.y - p.y) > 14) return;
    k.got = true; snd(660, .12, 'square', .05, 400);
    if (k.type === 'med') { p.hp = Math.min(100, p.hp + 40); pop(k.x, k.y - 26, '+40 VIE', '#7aff7a'); }
    else if (k.type === 'ammo') { p.ammo += Math.ceil(GUNS[p.gun].ammo / 2); pop(k.x, k.y - 26, '+MUNITIONS', '#f2c230'); }
    else { p.gun = k.type; p.ammo = GUNS[k.type].ammo; pop(k.x, k.y - 26, GUNS[k.type].n, '#f2c230'); }
  });
  parts.forEach(q => { q.vy += 400 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.y > GROUND + 2) { q.y = GROUND + 2; q.vx = 0; q.vy = 0; } q.life -= dt; });
  parts = parts.filter(q => q.life > 0);
  pops.forEach(q => { q.y -= 14 * dt; q.life -= dt; }); pops = pops.filter(q => q.life > 0);
}

/* ============ rendu ============ */
function tile(img, f) { const w = img.width, o = -((camX * f) % w) | 0; for (let x = o; x < VW; x += w) ctx.drawImage(img, x, 0); }
function drawPickup(k) {
  const x = Math.round(k.x), y = Math.round(k.y - 14 + Math.sin(time * 2.4 + k.x) * 1.5);
  ctx.globalCompositeOperation = 'lighter'; disc(ctx, x, y, 10, 'rgba(120,255,140,.10)'); disc(ctx, x, y, 6, 'rgba(120,255,140,.13)'); ctx.globalCompositeOperation = 'source-over';
  if (k.type === 'med') { R(ctx, x - 6, y - 4, 13, 10, '#f6f0e4'); R(ctx, x - 6, y + 5, 13, 1, '#b9b0a4'); R(ctx, x - 1, y - 2, 3, 6, '#e0354b'); R(ctx, x - 3, y, 7, 2, '#e0354b'); R(ctx, x - 2, y - 6, 5, 2, '#b9b0a4'); }
  else if (k.type === 'ammo') { R(ctx, x - 6, y - 3, 12, 8, '#4a5a34'); R(ctx, x - 6, y - 3, 12, 1, '#6a7e4a'); R(ctx, x - 4, y, 2, 4, '#f2c230'); R(ctx, x - 1, y, 2, 4, '#f2c230'); R(ctx, x + 2, y, 2, 4, '#f2c230'); }
  else if (k.type === 'shotgun') { R(ctx, x - 7, y - 1, 10, 2, '#c9d2e0'); R(ctx, x + 3, y - 1, 5, 3, '#a8743c'); R(ctx, x - 3, y + 1, 3, 1, '#a8743c'); }
  else { R(ctx, x - 5, y - 2, 10, 3, '#8d95a4'); R(ctx, x - 2, y + 1, 2, 5, '#5a6070'); R(ctx, x + 2, y + 1, 2, 3, '#5a6070'); R(ctx, x + 5, y - 1, 3, 1, '#5a6070'); }
}
function drawPlayer() {
  const x = Math.round(p.x), y = Math.round(p.y) - 20, d = p.dir;
  if (p.inv > 0 && (time * 20 | 0) % 2) return;
  const fr = (p.st === 'ladder' || Math.abs(input.x) > .2) ? (p.walk | 0) % 2 : 0;
  if (p.st === 'ladder') { blit(heroS[fr], x, y, (p.walk | 0) % 2, 7); return; }
  blit(heroS[fr], x, y, d < 0, 7);
  const HR = (dx, dy, w, h, col) => R(ctx, d > 0 ? x + dx : x - dx - w, y + dy, w, h, col);
  if (p.ammo > 0) {
    if (p.gun === 'pistol') { HR(6, 7, 4, 2, '#9aa2b4'); HR(6, 9, 1, 1, '#5a6070'); }
    else if (p.gun === 'shotgun') { HR(4, 8, 11, 1, '#c9d2e0'); HR(4, 9, 5, 1, '#a8743c'); }
    else { HR(6, 7, 6, 2, '#8d95a4'); HR(7, 9, 1, 3, '#5a6070'); }
    if (p.flash > 0) { HR(p.gun === 'shotgun' ? 15 : 11, 6, 3, 3, '#f2c230'); HR(p.gun === 'shotgun' ? 16 : 12, 7, 4, 1, '#fff'); }
  } else if (p.swing > 0) { HR(6, 8, 12, 2, '#c89a5a'); HR(15, 7, 3, 4, '#e2b878'); }
  else { HR(6, -1, 2, 10, '#c89a5a'); HR(5, -2, 4, 4, '#e2b878'); }
}
function hud() {
  const m = 16;
  txt(ctx, 'VIE', m, 12); R(ctx, m + 15, 10, 64, 9, '#000'); R(ctx, m + 16, 11, 62, 7, '#3a1420');
  for (let i = 0; i < 10; i++) if (p.hp > i * 10) R(ctx, m + 17 + i * 6, 12, 5, 5, p.hp <= 30 ? '#ff7a3a' : '#e0354b');
  txt(ctx, p.ammo > 0 ? GUNS[p.gun].n + ' ' + p.ammo : 'BATTE', m, 24, 1, '#f2c230');
  txt(ctx, L.name + ' - ' + L.sub, VW - m, 12, 1, '#fff', 2); txt(ctx, 'ZOMBIES ' + kills, VW - m, 24, 1, '#fff', 2);
  const bw = 110, bx = (VW - bw) >> 1; R(ctx, bx - 1, 13, bw + 2, 4, '#000'); R(ctx, bx, 14, bw, 2, '#55526a');
  const px = bx + bw * clamp(p.x / (L.len - 100), 0, 1); R(ctx, bx, 14, px - bx, 2, '#f2c230'); R(ctx, px - 1, 11, 3, 8, '#e0354b');
  R(ctx, bx + bw + 2, 10, 9, 9, '#6a7e72'); R(ctx, bx + bw + 5, 13, 3, 6, '#15131c'); R(ctx, bx + bw + 2, 10, 9, 2, '#f2c230');
  if (stT < 3) { const a = stT < 2.4 ? 1 : (3 - stT) / .6; ctx.globalAlpha = a; txt(ctx, 'NIVEAU ' + (li + 1), VW / 2, 70, 2, '#fff', 1); txt(ctx, L.name, VW / 2, 88, 5, '#f08a3c', 1); txt(ctx, L.sub, VW / 2, 120, 2, '#fff', 1); txt(ctx, 'ATTEINS LE BUNKER', VW / 2, 140, 1, '#f2c230', 1); ctx.globalAlpha = 1; }
}
function controls() {
  const jx = joy.id !== null ? joy.ox : 58, jy = joy.id !== null ? joy.oy : H - 58;
  ctx.globalAlpha = .28; disc(ctx, jx, jy, 30, '#fff'); ctx.globalAlpha = .5; disc(ctx, jx, jy, 27, '#15131c');
  ctx.globalAlpha = .75; disc(ctx, Math.round(jx + input.jx * 22), Math.round(jy + input.jy * 22), 12, '#e9dfd2');
  const fx = VW - 58, fy = H - 58;
  ctx.globalAlpha = input.fire ? .9 : .55; disc(ctx, fx, fy, 27, '#7a1c24'); disc(ctx, fx, fy, 23, input.fire ? '#ff5a5a' : '#e0354b');
  ctx.globalAlpha = 1;
  if (p.ammo > 0) { R(ctx, fx - 9, fy - 4, 16, 4, '#fff'); R(ctx, fx - 9, fy, 4, 6, '#fff'); R(ctx, fx + 8, fy - 3, 3, 1, '#f2c230'); }
  else { for (let i = 0; i < 12; i++) R(ctx, fx - 8 + i, fy + 6 - i, 3 + (i > 7), 3, '#fff'); }
}
function overlay(a) { ctx.fillStyle = `rgba(8,5,18,${a})`; ctx.fillRect(0, 0, VW, H); }
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (shake > 0) ctx.translate((Math.random() - .5) * shake * 3 | 0, (Math.random() - .5) * shake * 3 | 0);
  ctx.drawImage(sky, 0, 0); tile(far, .12); tile(mid, .4);
  const cx = Math.round(camX);
  ctx.drawImage(world, cx, 0, VW, H, 0, 0, VW, H);
  ctx.save(); ctx.translate(-cx, 0);
  /* porte du bunker */
  const bx = L.len - 100, on = (time * 2 | 0) % 2;
  R(ctx, bx - 3, 155, 6, 4, on ? '#7aff7a' : '#2a6a2a');
  if (on) { ctx.globalCompositeOperation = 'lighter'; disc(ctx, bx, 157, 9, 'rgba(120,255,120,.14)'); ctx.globalCompositeOperation = 'source-over'; }
  /* repère échelle */
  W.lads.forEach(l => { if (p.st === 'ground' && Math.abs(l.cx - p.x) < 44 && (time * 3 | 0) % 2) { R(ctx, l.cx - 1, 196, 3, 1, '#fff'); R(ctx, l.cx - 2, 197, 5, 1, '#fff'); R(ctx, l.cx - 3, 198, 7, 1, '#fff'); R(ctx, l.cx - 1, 199, 3, 4, '#fff'); } });
  W.picks.forEach(k => { if (!k.got && k.x > cx - 20 && k.x < cx + VW + 20) drawPickup(k); });
  zombies.forEach(z => {
    if (z.x < cx - 20 || z.x > cx + VW + 20) return;
    const s = z.hit > 0 ? zWhite : zSpr(z.pal)[(z.ph | 0) % 2];
    blit(s, z.x, GROUND - 20 + ((z.ph | 0) % 2), z.dir > 0, 8);
    if (z.t === 'a' && z.hp < 8) { R(ctx, z.x - 6, GROUND - 25, 12, 2, '#000'); R(ctx, z.x - 6, GROUND - 25, 12 * z.hp / 8, 2, '#e0354b'); }
  });
  drawPlayer();
  bullets.forEach(b => { R(ctx, b.x - (b.vx > 0 ? 6 : 0), b.y, 6, 1, '#fff0c0'); R(ctx, b.x - (b.vx > 0 ? 12 : -6), b.y, 6, 1, '#f39a44'); });
  parts.forEach(q => R(ctx, q.x, q.y, 1 + (q.life > .5), 1, q.col));
  pops.forEach(q => { ctx.globalAlpha = Math.min(1, q.life * 2); txt(ctx, q.s, q.x, q.y, 1, q.col, 1); ctx.globalAlpha = 1; });
  ctx.restore();
  if (L.rain) for (let i = 0; i < 60; i++) { const rx = (((i * 53 - time * 60 - cx * 1.2) % VW) + VW) % VW, ry = (i * 131 + time * 430) % 236; R(ctx, rx, ry, 1, 5, 'rgba(160,190,255,.3)'); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const blink = (time * 2 | 0) % 2;
  if (state === 'play') { hud(); controls(); }
  else if (state === 'title') {
    overlay(.6); txt(ctx, 'ZOMBIETOWN', VW / 2 + 2, 62, 7, '#5a1d58', 1, false); txt(ctx, 'ZOMBIETOWN', VW / 2, 60, 7, '#f08a3c', 1);
    txt(ctx, 'TRAVERSE LA VILLE JUSQU\'AU BUNKER', VW / 2, 118, 2, '#fff', 1);
    txt(ctx, 'JOYSTICK A GAUCHE : AVANCER - MONTER AUX ECHELLES JAUNES', VW / 2, 150, 1, '#e9dfd2', 1); txt(ctx, 'BOUTON A DROITE : TIRER - FRAPPER SANS MUNITIONS', VW / 2, 162, 1, '#e9dfd2', 1);
    if (blink) txt(ctx, 'TOUCHE L\'ECRAN POUR JOUER', VW / 2, 200, 2, '#f2c230', 1);
  } else if (state === 'clear') {
    overlay(.6); txt(ctx, 'NIVEAU TERMINE', VW / 2, 70, 5, '#7aff7a', 1); txt(ctx, 'ZOMBIES TUES : ' + kills, VW / 2, 120, 2, '#fff', 1);
    txt(ctx, 'PROCHAIN : ' + LEVELS[li + 1].name + ' - ' + LEVELS[li + 1].sub, VW / 2, 142, 2, '#f08a3c', 1); if (blink && stT > .6) txt(ctx, 'TOUCHE POUR CONTINUER', VW / 2, 190, 2, '#f2c230', 1);
  } else if (state === 'dead') {
    overlay(.7); txt(ctx, 'TU ES MORT', VW / 2, 80, 6, '#e0354b', 1); txt(ctx, 'ZOMBIES TUES : ' + kills, VW / 2, 130, 2, '#fff', 1); if (blink && stT > .6) txt(ctx, 'TOUCHE POUR RECOMMENCER', VW / 2, 180, 2, '#f2c230', 1);
  } else if (state === 'win') {
    overlay(.6); txt(ctx, 'TU AS SURVECU', VW / 2, 70, 6, '#7aff7a', 1); txt(ctx, 'TOTAL ZOMBIES TUES : ' + totalKills, VW / 2, 126, 2, '#fff', 1); if (blink && stT > .6) txt(ctx, 'TOUCHE POUR REJOUER', VW / 2, 180, 2, '#f2c230', 1);
  }
}

/* ============ son ============ */
let ac = null;
function snd(f, d, type = 'square', v = .05, slide = 0) {
  if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d);
  } catch (e) { /* son indisponible */ }
}

/* ============ entrées ============ */
const joy = { id: null, ox: 0, oy: 0 }; let fireId = null; input.jx = 0; input.jy = 0;
const keys = {};
function resize() {
  const r = wrap.getBoundingClientRect(), vw = r.width || 480, vh = r.height || 270;
  rot = vw < vh; const LW = rot ? vh : vw, LH = rot ? vw : vh;
  VW = clamp(Math.round(H * LW / LH), 360, 720); cv.width = VW; cv.height = H;
  cv.style.width = LW + 'px'; cv.style.height = LH + 'px'; cv.style.transform = rot ? `translate(${vw}px,0) rotate(90deg)` : 'none';
  sx = VW / LW; sy = H / LH; cssW = vw; ctx.imageSmoothingEnabled = false;
}
function toGame(t) { const r = wrap.getBoundingClientRect(), cx = t.clientX - r.left, cy = t.clientY - r.top; return rot ? [cy * sx, (cssW - cx) * sy] : [cx * sx, cy * sy]; }
function advance() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
  if (ac && ac.state === 'suspended') ac.resume();
  if (state === 'play' || stT < .6) return false;
  if (state === 'title') setState('play');
  else if (state === 'clear') { loadLevel(li + 1, true); setState('play'); }
  else if (state === 'dead') { loadLevel(li, false); setState('play'); }
  else if (state === 'win') { totalKills = 0; loadLevel(0, false); setState('play'); }
  return true;
}
function down(id, t) {
  if (advance()) return;
  if (state !== 'play') return;
  const [gx, gy] = toGame(t);
  if (gx < VW / 2) { if (joy.id === null) { joy.id = id; joy.ox = clamp(gx, 40, VW / 2 - 20); joy.oy = clamp(gy, 60, H - 40); input.jx = input.jy = 0; } }
  else if (fireId === null) fireId = id;
}
function move(id, t) {
  if (id !== joy.id) return;
  const [gx, gy] = toGame(t); let dx = (gx - joy.ox) / 24, dy = (gy - joy.oy) / 24; const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
  input.jx = dx; input.jy = dy;
}
function up(id) { if (id === joy.id) { joy.id = null; input.jx = input.jy = 0; } if (id === fireId) fireId = null; }
const each = (e, f) => { e.preventDefault(); for (const t of e.changedTouches) f(t.identifier, t); };
wrap.addEventListener('touchstart', e => each(e, down), { passive: false });
wrap.addEventListener('touchmove', e => each(e, move), { passive: false });
wrap.addEventListener('touchend', e => each(e, up), { passive: false });
wrap.addEventListener('touchcancel', e => each(e, up), { passive: false });
wrap.addEventListener('mousedown', e => down('m', e)); addEventListener('mousemove', e => move('m', e)); addEventListener('mouseup', () => up('m'));
wrap.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space' || e.code === 'Enter') advance(); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
addEventListener('blur', () => { up(joy.id); fireId = null; });
function readInput() {
  const kx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA || keys.KeyQ ? 1 : 0), ky = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW || keys.KeyZ ? 1 : 0);
  input.x = kx || (Math.abs(input.jx) > .25 ? input.jx : 0); input.y = ky || input.jy; input.fire = fireId !== null || !!keys.Space;
}

/* ============ boucle ============ */
resize(); loadLevel(0, false);
let lastT = 0;
function loop(ms) { const dt = Math.min(.05, (ms - lastT) / 1000 || 0); lastT = ms; readInput(); update(dt); render(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
window.ZT = { goto: i => { loadLevel(i, false); setState('play'); }, get p() { return p; }, get L() { return L; }, get state() { return state; } };
})();
