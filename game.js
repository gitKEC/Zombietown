(() => {
'use strict';
/* ============ base ============ */
const H = 270, TOP = 212, BOT = 266;
let VW = 480, rot = false, sx = 1, sy = 1, cssW = 0;
const wrap = document.getElementById('wrap'), cv = document.getElementById('game'), ctx = cv.getContext('2d');
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let seed = 1;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = a => a[rnd() * a.length | 0];
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const disc = (c, cx, cy, r, col) => { c.fillStyle = col; for (let dy = -r; dy <= r; dy++) { const dx = Math.floor(Math.sqrt(r * r - dy * dy)); c.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } };
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16), ch = s => clamp(Math.round(((n >> s) & 255) * f), 0, 255); return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1); };
const tri = c => ({ base: c, dark: shade(c, .72), light: shade(c, 1.25) });

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
function blit(s, cx, y, flip, ox, sc = 1) {
  cx = Math.round(cx); y = Math.round(y);
  ctx.save(); ctx.translate(cx, y); ctx.scale(flip ? -sc : sc, sc); ctx.drawImage(s, -ox, 0); ctx.restore();
}
const HERO_TOP = ['....hhhhhh', '...hhhhhhhh', '...hhhsssss', '...hhsskssk', '...hsssssss', '....ssssss', '...jjjjjjj', '..jjjjjjjjj', '..jjdjjjjjsss', '..jjdjjjjjj', '..jjdjjjjj', '..jjjjjjjj', '...bbbbbbb', '...ppppppp'];
const HERO_A = HERO_TOP.concat(['...ppp.ppp', '...ppp.ppp', '...ppp.ppp', '...ppp..ppp', '...ppp..ppp', '..kkkk..kkkk']);
const HERO_B = HERO_TOP.concat(['...ppp.ppp', '...pppppp', '....pppp', '....pppp', '....pppp', '...kkkkk']);
const HP = { h: '#2a1a22', s: '#e8b088', k: '#15131c', j: '#c2362f', d: '#7a1c24', b: '#3a2a1e', p: '#34508a' };
const heroS = [sprite(HERO_A, HP), sprite(HERO_B, HP)];
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
  mummy: [zpal('#d8c8a0', '#d8c8a0', '#c8b890', '#a89870', '#c8b890'), zpal('#d8c8a0', '#e8dcc0', '#b8a880', '#8a7a58', '#b8a880'), zpal(G, '#3a2a22', '#e9e0c8', '#7a1c24', '#8a7a58')],
  hazmat: [zpal(G, '#e0c030', '#e0c030', '#a88a20', '#e0c030'), zpal(G, '#e0c030', '#d8b828', '#7a1c24', '#c8a820'), zpal(G, '#3a4a2a', '#5a6a3a', '#3a4426', '#4a5630')],
  runner: zpal('#c8d86a', '#c8d86a', '#b01c2c', '#7a1c24', '#3a3340', '#fff06a'),
  armor: zpal(G, '#8d95a4', '#2e3440', '#4a5260', '#22262e'),
};
const ZT = { n: { hp: 3, sp: [14, 22], dmg: 10 }, r: { hp: 2, sp: [44, 54], dmg: 8 }, a: { hp: 8, sp: [10, 14], dmg: 16 } };
const BOSSES = [
  { n: 'LE BOUCHER', hp: 110, sc: 2, sp: 22, dmg: 20, charge: true, pal: zpal('#8fae6a', '#e9e9e0', '#e9e9e0', '#b01c2c', '#3a3340') },
  { n: 'LE CRACHEUR', hp: 170, sc: 2, sp: 16, dmg: 18, spit: true, summon: true, pal: zpal('#a8d84a', '#a8d84a', '#6a8a2a', '#4a6a1a', '#3a4a2a', '#fff06a') },
  { n: 'PATIENT ZERO', hp: 260, sc: 3, sp: 24, dmg: 25, charge: true, spit: true, summon: true, pal: zpal('#c8d0e0', '#c8d0e0', '#3a3a5a', '#7a1c24', '#22223a', '#6ef0ff') },
];
const GUNS = {
  pistol: { n: 'PISTOLET', cd: .3, dmg: 2, pierce: 1, ammo: 18, len: 4, col: '#9aa2b4' },
  magnum: { n: 'MAGNUM', cd: .5, dmg: 5, pierce: 2, ammo: 12, len: 6, col: '#d8dce8', shake: .6 },
  shotgun: { n: 'FUSIL A POMPE', cd: .65, dmg: 3, pierce: 2, ammo: 10, len: 11, col: '#c9d2e0', pellets: 3, life: .38, shake: 1 },
  uzi: { n: 'UZI', cd: .09, dmg: 1, pierce: 1, ammo: 60, len: 6, col: '#8d95a4' },
  ak47: { n: 'AK-47', cd: .13, dmg: 2, pierce: 1, ammo: 45, len: 12, col: '#8a6238' },
  sniper: { n: 'SNIPER', cd: .9, dmg: 9, pierce: 9, ammo: 8, len: 14, col: '#4a6a4a', speed: 800, shake: 1 },
  arbalete: { n: 'ARBALETE', cd: .55, dmg: 4, pierce: 4, ammo: 14, len: 9, col: '#a8743c', speed: 300, bolt: true },
  minigun: { n: 'MINIGUN', cd: .05, dmg: 1, pierce: 1, ammo: 150, len: 12, col: '#6a7080', shake: .4 },
  laser: { n: 'LASER', cd: .28, dmg: 4, ammo: 20, len: 9, col: '#5af0c0', beam: true },
  lanceflammes: { n: 'LANCE-FLAMMES', cd: .04, dmg: .45, pierce: 99, ammo: 160, len: 10, col: '#c2562f', flame: true },
  lancegrenades: { n: 'LANCE-GRENADES', cd: .8, dmg: 7, pierce: 1, ammo: 6, len: 10, col: '#5a7a44', boom: 36, speed: 260 },
};
const MELEE = {
  batte: { n: 'BATTE', dmg: 2, range: 22, cd: .4, col: '#c89a5a', tip: '#e2b878' },
  machette: { n: 'MACHETTE', dmg: 3, range: 22, cd: .3, col: '#c9d2e0', tip: '#eef1fb' },
  hache: { n: 'HACHE', dmg: 5, range: 20, cd: .5, col: '#8a5a2a', tip: '#c9d2e0' },
  katana: { n: 'KATANA', dmg: 4, range: 28, cd: .26, col: '#eef1fb', tip: '#ffffff' },
  tronconneuse: { n: 'TRONCONNEUSE', dmg: 1.2, range: 22, cd: .07, col: '#e06a3c', tip: '#c9d2e0' },
};

/* ============ niveaux ============ */
const SK = {
  sunset: ['#140c2e', '#1f0f3c', '#31124a', '#4a1856', '#6c2158', '#93304f', '#bd4a44', '#e06a3c', '#f39a44', '#fbc468'],
  night: ['#04051a', '#070922', '#0b0e2c', '#101436', '#151b42', '#1b234e', '#222c5a', '#2a3666'],
  day: ['#1f6fc0', '#2c7fcc', '#3f92d6', '#5aa6de', '#7dbbe6', '#a4d0ec', '#c9e2ee', '#e8eedc', '#f6ecc0'],
  dawn: ['#2a2a5a', '#4a3a72', '#7a4a82', '#b06088', '#e08a88', '#f4b090', '#fbd4a0', '#fde8c0'],
  london: ['#0c1018', '#141a24', '#1c2430', '#26303c', '#303c48', '#3c4854'],
  noon: ['#2a86d8', '#48a0e4', '#70baec', '#9cd0f0', '#c4e2f2', '#f0e8c8'],
  dusk: ['#2a1a4a', '#4a2460', '#7a3070', '#b04870', '#e07060', '#f4a060', '#fbd080'],
  neon: ['#0a0620', '#120a30', '#1c1044', '#281858', '#36206c', '#462a80'],
  snow: ['#0c1226', '#141c36', '#1e2848', '#2a3658', '#384668', '#485878'],
  grey: ['#3a3e3a', '#4c504a', '#60645a', '#787a6a', '#909078', '#a8a488'],
  jungle: ['#3a8ab8', '#5aa6c8', '#80c0d4', '#a8d8d8', '#d0e8d0', '#e8f0c0'],
  blizzard: ['#5a6878', '#6a7888', '#7c8a98', '#909ca8', '#a6b0ba', '#bcc4cc'],
  aurora: ['#020814', '#04101e', '#06182a', '#0a2236', '#102e44', '#183a52'],
};
const WARM = 'rgba(255,170,80,.075)', COOL = 'rgba(120,170,255,.07)', PALE = 'rgba(255,240,180,.05)';
const LEVELS = [
  { name: 'BRONX', sub: 'COUCHER DU SOLEIL', kind: 'city', len: 2300, seed: 11, sky: SK.sunset, stars: 40, sun: { x: 250, y: 112, r: 24, c1: '#ffd98a', c2: '#fff0c0', bars: '#e06a3c' },
    far: { t: 'sky', c: ['#4a1c5c', '#2a1244'], win: ['#fbc468', '#f39a44'] }, mid: { t: 'city', c: '#3d1a50', lo: 50, hi: 120, lit: .25, win: ['#f8b85a', '#f39a44'] },
    bricks: ['#7d3a35', '#8f6a48', '#5e3b41'], tops: [25, 60], lit: .3, win: '#f2b24a', glass: '#171530', glow: WARM, side: '#6b6878', road: '#22202c', shops: ['DELI', 'PIZZA', 'BAR', '24H'], taxi: true, zp: 'city',
    picks: ['shotgun', 'med', 'ammo', 'med'] },
  { name: 'MANHATTAN', sub: 'NUIT', kind: 'city', len: 2600, seed: 29, weather: 'rain', sky: SK.night, stars: 130, sun: { x: 330, y: 44, r: 14, c1: '#cfd6ee', c2: '#eef1fb', moon: true },
    far: { t: 'sky', c: ['#141a44', '#0c1030'], win: ['#ffd46a', '#6ad0ff'], lo: 30 }, mid: { t: 'city', c: '#161a40', lo: 0, hi: 90, lit: .42, win: ['#ffd46a', '#ffe9a8', '#6ad0ff'] },
    bricks: ['#3d3550', '#4a3a4a', '#2f3a54'], tops: [-30, 30], lit: .45, win: '#ffd46a', glass: '#0c0e24', glow: COOL, side: '#4a4c62', road: '#14141e', shops: ['DELI', 'JAZZ', 'BAR', 'TATTOO'], taxi: true, zp: 'city',
    picks: ['uzi', 'med', 'machette', 'ammo'] },
  { name: 'ZONE 51', sub: 'PLEIN JOUR', kind: 'base', len: 2800, seed: 51, sky: SK.day, stars: 0, sun: { x: 300, y: 36, r: 11, c1: '#fff6c8', c2: '#ffffff', halo: true }, clouds: true,
    far: { t: 'hills', c: ['#b0a0c0', '#c9a88e'] }, mid: { t: 'mesa' }, metal: '#7d8478', signs: ['DANGER', 'ZONE 51'], glow: PALE, side: '#a89e88', road: '#3a3833', dash: '#d9b030', saucer: true, zp: 'base',
    picks: ['laser', 'med', 'shotgun', 'ammo'] },
  { name: 'PARIS', sub: 'AUBE', kind: 'city', len: 2600, seed: 75, sky: SK.dawn, stars: 20, sun: { x: 420, y: 150, r: 16, c1: '#ffe0b0', c2: '#fff4dc' },
    far: { t: 'sky', c: ['#8a6a9a', '#6a5080'], win: ['#ffe0a0', '#ffe0a0'], lo: 110, hi: 150, mark: 'eiffel' }, mid: { t: 'city', c: '#9a7a98', lo: 96, hi: 128, lit: .1, win: ['#ffe0a0'] },
    bricks: ['#d8c8a8', '#c8b898', '#e0d0b4'], mansard: true, tops: [44, 64], lit: .15, win: '#ffe0a0', glass: '#3a4a6a', glow: PALE, side: '#8a8690', road: '#3a3840', shops: ['CAFE', 'BISTRO', 'TABAC', 'PAIN'], zp: 'city',
    picks: ['magnum', 'med', 'arbalete', 'ammo'] },
  { name: 'LONDRES', sub: 'NUIT DE PLUIE', kind: 'city', len: 1700, seed: 44, boss: 0, weather: 'rain', fog: true, sky: SK.london, stars: 0, sun: { x: 120, y: 50, r: 12, c1: '#7a8694', c2: '#98a4b0', moon: true },
    far: { t: 'sky', c: ['#26303e', '#1a222e'], win: ['#e8c870', '#e8c870'], mark: 'bigben' }, mid: { t: 'city', c: '#222a38', lo: 70, hi: 130, lit: .2, win: ['#e8c870'] },
    bricks: ['#5a3a34', '#4a342e', '#6a4a3a'], tops: [30, 70], lit: .3, win: '#e8c870', glass: '#10141c', glow: WARM, side: '#555a64', road: '#1a1c22', shops: ['PUB', 'TEA', 'BOOKS', 'FISH'], phone: true, zp: 'city',
    picks: ['ak47', 'med', 'lancegrenades', 'ammo', 'med'] },
  { name: 'LE CAIRE', sub: 'MIDI', kind: 'ruins', len: 2700, seed: 6, weather: 'sand', sky: SK.noon, stars: 0, sun: { x: 240, y: 30, r: 12, c1: '#fff6c8', c2: '#ffffff', halo: true },
    far: { t: 'hills', c: ['#e8d09c', '#d4b478'], mark: 'pyramids' }, mid: { t: 'hills', band: '#dcb474', hill: '#cca060', deco: ['palm', 'palm', 'cactus'] },
    stone: '#c9a56a', deco: ['palm', 'obelisk', 'tent'], glow: PALE, side: '#b89a68', road: '#9a7a4c', dash: null, zp: 'mummy',
    picks: ['shotgun', 'med', 'hache', 'ammo'] },
  { name: 'ROME', sub: 'COUCHER DU SOLEIL', kind: 'ruins', len: 2700, seed: 753, sky: SK.dusk, stars: 20, sun: { x: 140, y: 120, r: 20, c1: '#ffd98a', c2: '#fff0c0' },
    far: { t: 'hills', c: ['#6a3a68', '#52305a'], mark: 'colosseum' }, mid: { t: 'hills', band: '#5a4250', hill: '#4a3448', deco: ['cypress', 'cypress', 'tree'] },
    stone: '#b8a890', deco: ['cypress', 'statue', 'cypress'], glow: WARM, side: '#8a8078', road: '#4a4640', dash: null, zp: 'city',
    picks: ['arbalete', 'med', 'uzi', 'ammo'] },
  { name: 'TOKYO', sub: 'NUIT NEON', kind: 'city', len: 2800, seed: 8, weather: 'rain', sky: SK.neon, stars: 30, sun: { x: 420, y: 40, r: 10, c1: '#e8d8f8', c2: '#ffffff', moon: true },
    far: { t: 'sky', c: ['#241450', '#160c38'], win: ['#ff6ec7', '#6ef0ff'], lo: 40, mark: 'tokyo' }, mid: { t: 'city', c: '#1e1248', lo: 10, hi: 100, lit: .5, win: ['#ff6ec7', '#6ef0ff', '#ffe14a'] },
    bricks: ['#3a3a4e', '#44384e', '#2e3a4a'], neon: true, tops: [-20, 40], lit: .4, win: '#ffe9a8', glass: '#0c0e24', glow: 'rgba(255,110,200,.06)', side: '#4a4860', road: '#16141e', shops: ['RAMEN', 'SUSHI', 'SAKE', 'ARCADE'], zp: 'city',
    picks: ['katana', 'med', 'minigun', 'ammo'] },
  { name: 'MOSCOU', sub: 'NUIT DE NEIGE', kind: 'city', len: 2800, seed: 1917, weather: 'snow', snow: true, sky: SK.snow, stars: 50, sun: { x: 380, y: 46, r: 12, c1: '#cfd6ee', c2: '#eef1fb', moon: true },
    far: { t: 'sky', c: ['#2a3658', '#1c2644'], win: ['#ffd46a', '#ffd46a'], lo: 90, mark: 'domes' }, mid: { t: 'city', c: '#243050', lo: 60, hi: 120, lit: .3, win: ['#ffd46a'] },
    bricks: ['#6a3a3a', '#7a6a5a', '#4a4a5a'], tops: [20, 60], lit: .35, win: '#ffd46a', glass: '#141a30', glow: COOL, side: '#c8d0dc', road: '#5a6270', shops: ['VODKA', 'KAFE', 'BAR'], zp: 'city',
    picks: ['ak47', 'med', 'sniper', 'ammo'] },
  { name: 'TCHERNOBYL', sub: 'CREPUSCULE', kind: 'base', len: 1700, seed: 86, boss: 1, fog: true, sky: SK.grey, stars: 0, sun: { x: 400, y: 130, r: 14, c1: '#c8b888', c2: '#d8cca0' },
    far: { t: 'hills', c: ['#5a5e52', '#4a4e44'], mark: 'chernobyl' }, mid: { t: 'hills', band: '#5a5a48', hill: '#4a4c3e', deco: ['dead', 'dead', 'pine'] },
    metal: '#6a6e66', signs: ['DANGER', 'RADIATION'], glow: PALE, side: '#7a7a70', road: '#34342e', dash: '#8a8460', zp: 'hazmat',
    picks: ['lanceflammes', 'med', 'shotgun', 'ammo', 'med'] },
  { name: 'RIO', sub: 'FIN DE JOURNEE', kind: 'city', len: 2900, seed: 22, sky: SK.dusk, stars: 10, sun: { x: 300, y: 130, r: 22, c1: '#ffd98a', c2: '#fff0c0', bars: '#e07060' },
    far: { t: 'hills', c: ['#6a3a70', '#4a2858'], mark: 'rio' }, mid: { t: 'city', c: '#5a3068', lo: 112, hi: 150, lit: .4, win: ['#ffd46a', '#f39a44'] },
    bricks: ['#d86a4a', '#e0b040', '#4a9ab0', '#d06a8a', '#6ab06a'], tops: [70, 110], lit: .35, win: '#ffd46a', glass: '#2a2a4a', glow: WARM, side: '#8a7a78', road: '#2e2a30', shops: ['BAR', 'SUCO', 'SAMBA'], zp: 'city',
    picks: ['uzi', 'med', 'lancegrenades', 'ammo'] },
  { name: 'AMAZONIE', sub: 'JOUR', kind: 'ruins', len: 2900, seed: 33, weather: 'rain', sky: SK.jungle, stars: 0, sun: { x: 200, y: 40, r: 11, c1: '#fff6c8', c2: '#ffffff', halo: true },
    far: { t: 'hills', c: ['#3a7a5a', '#2a6048'] }, mid: { t: 'hills', band: '#2a5a38', hill: '#245030', deco: ['tree', 'tree', 'tree', 'palm'], dense: true },
    stone: '#7a8468', moss: true, deco: ['tree', 'statue', 'palm'], glow: PALE, side: '#5a6a48', road: '#4a4030', dash: null, zp: 'city',
    picks: ['tronconneuse', 'med', 'arbalete', 'ammo'] },
  { name: 'SYDNEY', sub: 'MATIN', kind: 'city', len: 3000, seed: 61, sky: SK.noon, stars: 0, sun: { x: 120, y: 50, r: 12, c1: '#fff6c8', c2: '#ffffff', halo: true }, clouds: true,
    far: { t: 'sky', c: ['#8ab0d0', '#6a94bc'], win: ['#e8f4ff', '#e8f4ff'], lo: 100, hi: 150, mark: 'sydney' }, mid: { t: 'city', c: '#7a9cc0', lo: 40, hi: 120, lit: .08, win: ['#e8f4ff'] },
    bricks: ['#c8b8a0', '#b0a8a0', '#d0a888'], tops: [30, 70], lit: .05, win: '#ffe9a8', glass: '#4a7aa8', glow: PALE, side: '#9a98a0', road: '#3a3a42', shops: ['SURF', 'CAFE', 'PUB', 'BBQ'], zp: 'city',
    picks: ['sniper', 'med', 'minigun', 'ammo'] },
  { name: 'SIBERIE', sub: 'BLIZZARD', kind: 'base', len: 3000, seed: 77, weather: 'snow', heavy: true, snow: true, sky: SK.blizzard, stars: 0, sun: { x: 300, y: 60, r: 10, c1: '#d0d8e0', c2: '#e8eef4' },
    far: { t: 'hills', c: ['#8a98a8', '#a8b4c0'] }, mid: { t: 'hills', band: '#d0d8e0', hill: '#b8c4d0', deco: ['pine', 'pine', 'pine'], snow: true },
    metal: '#6a7684', signs: ['STOP', 'SECTEUR 7'], glow: COOL, side: '#d8e0e8', road: '#7a8490', dash: null, zp: 'base',
    picks: ['lanceflammes', 'med', 'ak47', 'ammo'] },
  { name: 'ANTARCTIQUE', sub: 'AURORE AUSTRALE', kind: 'base', len: 1800, seed: 90, boss: 2, aurora: true, snow: true, sky: SK.aurora, stars: 150, sun: { x: 500, y: 40, r: 8, c1: '#cfd6ee', c2: '#eef1fb', moon: true },
    far: { t: 'hills', c: ['#1a3a52', '#28506a'] }, mid: { t: 'hills', band: '#b8d0e0', hill: '#9cb8cc', deco: ['ice', 'ice'], snow: true },
    metal: '#4a5a6a', signs: ['LABO', 'NIVEAU 0'], glow: 'rgba(120,255,200,.06)', side: '#c8dcea', road: '#5a7084', dash: null, zp: 'base',
    picks: ['laser', 'med', 'minigun', 'ammo', 'med', 'lancegrenades'] },
];

/* ============ arrière-plans ============ */
function skyCanvas(L) {
  const c = mk(720, 214), g = c.getContext('2d'), S = L.sky;
  for (let y = 0; y < 214; y++) {
    const f = Math.min(y / 178, 1) * (S.length - 1.001), i = Math.floor(f);
    R(g, 0, y, 720, 1, S[i]);
    if (f - i > .5) { g.fillStyle = S[i + 1]; for (let x = y % 2; x < 720; x += 2) g.fillRect(x, y, 1, 1); }
  }
  for (let i = 0; i < L.stars; i++) R(g, rnd() * 720, rnd() * 90, 1, 1, rnd() < .3 ? '#fff' : '#9a9ad0');
  if (L.aurora) for (let x = 0; x < 720; x++) {
    const y0 = 34 + 18 * Math.sin(x / 60) + 7 * Math.sin(x / 17) | 0, y1 = 70 + 14 * Math.sin(x / 45 + 2) + 5 * Math.sin(x / 13) | 0;
    R(g, x, y0, 1, 30, 'rgba(80,255,170,.13)'); R(g, x, y0 + 3, 1, 10, 'rgba(140,255,210,.2)'); R(g, x, y1, 1, 22, 'rgba(160,110,255,.12)');
  }
  const s = L.sun;
  if (s.halo) { g.globalCompositeOperation = 'lighter'; disc(g, s.x, s.y, s.r + 14, 'rgba(255,255,220,.12)'); disc(g, s.x, s.y, s.r + 6, 'rgba(255,255,220,.18)'); g.globalCompositeOperation = 'source-over'; }
  disc(g, s.x, s.y, s.r, s.c1); disc(g, s.x, s.y, s.r - 3, s.c2);
  if (s.bars) [-8, -2, 5, 13].forEach((d, i) => R(g, s.x - s.r - 2, s.y + d, s.r * 2 + 6, 1 + (i > 1), s.bars));
  if (s.moon) { disc(g, s.x - 3, s.y - 2, 2, s.c1); disc(g, s.x + 4, s.y + 3, 2, s.c1); }
  if (L.clouds) for (let i = 0; i < 7; i++) { const x = rnd() * 700, y = 20 + rnd() * 80, w = 30 + rnd() * 40; R(g, x, y, w, 4, '#fff'); R(g, x + 6, y - 3, w - 16, 3, '#fff'); R(g, x + 4, y + 4, w - 10, 2, '#dfeaf2'); }
  return c;
}
function tower(g, cx, top, col, band) {
  for (let y = top; y < 214; y++) {
    const t = (y - top) / (214 - top), half = 1 + Math.pow(t, 2.2) * 30 | 0, cl = band && ((y - top) / 14 | 0) % 2 ? band : col;
    if (t > .62) { const w = 4 + t * 3; R(g, cx - half, y, w, 1, cl); R(g, cx + half - w, y, w, 1, cl); } else R(g, cx - half, y, half * 2 + 1, 1, cl);
  }
  const yb = top + (214 - top) * .62; R(g, cx - 13, yb, 27, 3, col); R(g, cx - 6, top + (214 - top) * .33, 13, 2, col); R(g, cx, top - 12, 1, 12, col);
}
const MARKS = {
  eiffel: (g, c) => tower(g, 300, 52, c[1]),
  bigben: (g, c) => { const x = 300, d = c[1]; R(g, x - 7, 80, 14, 134, d); R(g, x - 9, 76, 18, 5, d); for (let i = 0; i < 14; i++) R(g, x - 7 + i / 2, 76 - i, 14 - i, 1, d); R(g, x, 54, 1, 8, d); disc(g, x, 92, 5, '#f8e8a0'); R(g, x, 89, 1, 3, '#222'); R(g, x, 92, 3, 1, '#222'); R(g, x + 8, 150, 96, 64, d); for (let i = 0; i < 6; i++) { R(g, x + 14 + i * 15, 140, 3, 10, d); R(g, x + 15 + i * 15, 134, 1, 6, d); } },
  pyramids: g => [[250, 108], [345, 130], [415, 150]].forEach(([cx, top]) => { for (let y = top; y < 196; y++) { const h = (y - top) * 1.25; R(g, cx - h, y, h, 1, y % 7 ? '#ecd096' : '#dcc084'); R(g, cx, y, h, 1, y % 7 ? '#b89458' : '#a8844c'); } }),
  colosseum: (g, c) => { const x0 = 230, d = shade(c[1], 1.5), k = shade(c[1], .6); [[50, 128], [22, 154], [0, 180]].forEach(([o, y]) => { R(g, x0 + o, y, 150 - o, 26, d); R(g, x0 + o, y, 150 - o, 2, shade(d, 1.2)); for (let ax = x0 + o + 5; ax < x0 + 142; ax += 14) { R(g, ax, y + 9, 8, 17, k); R(g, ax + 1, y + 7, 6, 2, k); } }); },
  tokyo: (g, c) => { for (let y = 66; y < 214; y++) { const h = (y - 66) * 1.7; R(g, 170 - h, y, h * 2, 1, y < 90 ? '#e8ecf8' : c[0]); } tower(g, 390, 74, '#e0453a', '#f4f0e8'); },
  domes: g => [[270, 90, '#c2362f', 8], [296, 120, '#e0b040', 10], [322, 84, '#3a7ab0', 7], [344, 66, '#3a9a5a', 6]].forEach(([cx, h, col, r]) => { R(g, cx - r + 2, 214 - h, r * 2 - 3, h, '#34406a'); disc(g, cx, 214 - h - r + 2, r, col); for (let i = -r; i < r; i += 4) R(g, cx + i, 214 - h - r, 2, r, shade(col, 1.3)); R(g, cx - 1, 214 - h - r * 2 - 2, 3, 5, col); R(g, cx, 214 - h - r * 2 - 9, 1, 8, '#f2c230'); R(g, cx - 2, 214 - h - r * 2 - 6, 5, 1, '#f2c230'); }),
  chernobyl: (g, c) => { const d = shade(c[1], .8); for (let y = 100; y < 214; y++) { const t = (y - 100) / 114, half = 17 + Math.pow(Math.abs(t - .3), 1.5) * 44 | 0; R(g, 240 - half, y, half * 2, 1, d); } for (let y = 70; y < 214; y += 8) R(g, 316, y, 5, 8, (y / 8 | 0) % 2 ? '#a84a40' : '#c8c4b8'); const cx = 410, cy = 150, r = 36; for (let a = 0; a < 6.3; a += .02) R(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1, 1, d); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; for (let q = 0; q < r; q += 2) R(g, cx + Math.cos(a) * q, cy + Math.sin(a) * q, 1, 1, d); R(g, cx + Math.cos(a) * r - 2, cy + Math.sin(a) * r, 4, 4, '#c8a830'); } for (let q = 0; q < 64; q++) { R(g, cx - q * .3, cy + q, 2, 1, d); R(g, cx + q * .3, cy + q, 2, 1, d); } },
  rio: (g, c) => { const d = shade(c[0], .8); for (let y = 86; y < 214; y++) { const half = Math.sqrt((y - 86) / 128) * 48 | 0; R(g, 210 - half, y, half * 2, 1, d); } for (let y = 100; y < 214; y++) { const h = (y - 100) * 1.1; R(g, 390 - h, y, h * 2, 1, d); } R(g, 390, 88, 2, 12, '#eef1fb'); R(g, 385, 91, 12, 1, '#eef1fb'); R(g, 390, 86, 2, 2, '#eef1fb'); },
  sydney: (g, c) => { R(g, 0, 196, 512, 18, '#4a84b8'); for (let i = 0; i < 60; i++) R(g, rnd() * 512, 198 + rnd() * 14, 4, 1, '#7ab0d8'); R(g, 232, 190, 112, 6, '#d8d4c8'); for (let k = 0; k < 4; k++) { const sx0 = 240 + k * 24, r = 34 - k * 5; for (let dy = 0; dy < r; dy++) { const w = Math.sqrt(r * r - (r - dy) * (r - dy)) * .62 | 0; R(g, sx0, 190 - r + dy, w, 1, dy % 5 ? '#f8f6ee' : '#d8d4c8'); } } const d = shade(c[1], .7); for (let x = 366; x < 478; x++) { const t = (x - 422) / 56, y = 146 + t * t * 34 | 0; R(g, x, y, 1, 2, d); if (x % 7 === 0) R(g, x, y, 1, 184 - y, d); } R(g, 356, 184, 132, 3, d); R(g, 364, 160, 5, 36, d); R(g, 474, 160, 5, 36, d); },
};
function farLayer(L) {
  const c = mk(512, 214), g = c.getContext('2d'), F = L.far;
  if (F.t === 'sky') {
    [[F.lo || 70, F.hi ? F.hi - 15 : 125], [(F.lo || 70) + 30, F.hi || 140]].forEach(([lo, hi], k) => {
      for (let x = 0; x < 512;) {
        let w = 12 + rnd() * 18 | 0; if (512 - x - w < 12) w = 512 - x;
        const top = lo + rnd() * (hi - lo) | 0; R(g, x, top, w, 214 - top, F.c[k]);
        if (rnd() < .35) { R(g, x + 3, top - 5, w - 6, 5, F.c[k]); R(g, x + w / 2, top - 14, 1, 9, F.c[k]); }
        for (let i = 0; i < 7; i++) if (rnd() < .5) R(g, x + 2 + (rnd() * (w - 4) | 0), top + 3 + (rnd() * 50 | 0), 1, 2, F.win[k % 2]);
        x += w;
      }
      if (k === 0 && F.mark) MARKS[F.mark](g, F.c);
    });
  } else {
    const k = Math.PI * 2 / 512;
    for (let x = 0; x < 512; x++) { const h1 = 138 - (16 * Math.sin(k * x * 2 + 1) + 10 * Math.sin(k * x * 5) + 5 * Math.sin(k * x * 11 + 2)) | 0; R(g, x, h1, 1, 214 - h1, F.c[0]); if (x % 2) R(g, x, h1, 1, 3, shade(F.c[0], 1.15)); if (L.snow) R(g, x, h1, 1, 7, '#eef2f8'); }
    if (F.mark) MARKS[F.mark](g, F.c);
    for (let x = 0; x < 512; x++) { const h2 = (F.mark ? 190 : 160) - (9 * Math.sin(k * x * 3 + 4) + 5 * Math.sin(k * x * 7 + 1)) * (F.mark ? .5 : 1) | 0; R(g, x, h2, 1, 214 - h2, F.c[1]); }
  }
  return c;
}
function deco(g, t, x, b, s, snow) {
  const P = (dx, dy, w, h, col) => R(g, x + dx * s, b + dy * s, w * s, h * s, col);
  if (t === 'palm') { for (let i = 0; i < 13; i++) P(Math.sin(i / 5) * 2, -i * 2 - 2, 2, 2, i % 2 ? '#7a5a34' : '#6a4a2a'); [[-9, -27, 9, 2], [1, -27, 9, 2], [-7, -30, 7, 2], [1, -30, 7, 2], [-10, -24, 5, 2], [6, -24, 5, 2], [-2, -32, 5, 3]].forEach(a => P(...a, '#3f8a44')); P(-11, -22, 3, 2, '#2e6a36'); P(9, -22, 3, 2, '#2e6a36'); }
  else if (t === 'cactus') { P(0, -14, 2, 14, '#5a7a3a'); P(-4, -11, 4, 2, '#5a7a3a'); P(-4, -15, 2, 5, '#5a7a3a'); P(2, -8, 4, 2, '#5a7a3a'); P(4, -12, 2, 5, '#5a7a3a'); }
  else if (t === 'pine') { P(0, -5, 2, 5, '#4a3a2a'); for (let i = 0; i < 5; i++) { P(-6 + i, -8 - i * 4, 14 - i * 2, 4, i % 2 ? '#2a5a40' : '#346a48'); if (snow) P(-6 + i, -8 - i * 4, 14 - i * 2, 1, '#eef2f8'); } }
  else if (t === 'tree') { P(0, -12, 3, 12, '#5a4028'); disc(g, x + s, b - 20 * s, 9 * s, '#2e7a3c'); disc(g, x - 5 * s, b - 15 * s, 6 * s, '#3a8a46'); disc(g, x + 7 * s, b - 15 * s, 6 * s, '#256a34'); disc(g, x - 2 * s, b - 24 * s, 4 * s, '#4a9a52'); }
  else if (t === 'dead') { P(0, -18, 2, 18, '#3a3428'); P(-5, -14, 5, 1, '#3a3428'); P(-5, -19, 1, 5, '#3a3428'); P(2, -10, 5, 1, '#3a3428'); P(6, -16, 1, 6, '#3a3428'); P(-2, -22, 1, 5, '#3a3428'); }
  else if (t === 'cypress') { P(0, -4, 2, 4, '#4a3a2a'); for (let i = 0; i < 14; i++) { const w = i < 3 ? 2 + i : i > 10 ? 15 - i : 5; P(1 - w / 2, -6 - i * 2, w, 2, i % 3 ? '#1e4a34' : '#2a5a40'); } }
  else if (t === 'ice') { for (let i = 0; i < 12; i++) P(-i / 2, -24 + i * 2, i + 1, 2, i % 3 ? '#d8ecf8' : '#a8cce0'); for (let i = 0; i < 7; i++) P(8 - i / 2, -14 + i * 2, i + 1, 2, '#c0dcec'); }
  else if (t === 'obelisk') { for (let i = 0; i < 30; i++) P(-2 - i / 15, -60 + i * 2, 5 + i / 7.5, 2, i % 6 ? '#d8b878' : '#b8985c'); P(-1, -64, 3, 2, '#d8b878'); P(0, -66, 1, 2, '#f2c230'); P(-5, -2, 11, 2, '#a8884c'); }
  else if (t === 'statue') { P(-5, -6, 11, 6, '#8a8478'); P(-3, -22, 7, 16, '#a8a294'); P(-2, -28, 5, 6, '#b8b2a4'); P(-6, -20, 3, 2, '#a8a294'); P(4, -24, 2, 8, '#a8a294'); P(-1, -26, 1, 1, '#4a463e'); P(1, -26, 1, 1, '#4a463e'); }
  else if (t === 'tent') { for (let i = 0; i < 8; i++) P(-12 + i * 3, -22, 3, 6, i % 2 ? '#e9dfc0' : '#b8463c'); P(-12, -16, 1, 16, '#5a4028'); P(11, -16, 1, 16, '#5a4028'); P(-10, -8, 20, 8, '#7a5632'); P(-8, -11, 5, 3, '#e0a030'); P(-1, -11, 4, 3, '#b8463c'); P(5, -11, 4, 3, '#5a8a3a'); }
}
function midLayer(L) {
  const c = mk(720, 214), g = c.getContext('2d'), M = L.mid;
  if (M.t === 'city') {
    const cols = [M.c, shade(M.c, 1.18), shade(M.c, .86)], edge = shade(M.c, 1.5), sh = shade(M.c, .65), dark = shade(M.c, .72);
    for (let x = 0; x < 720;) {
      let w = 38 + rnd() * 44 | 0; if (720 - x - w < 30) w = 720 - x;
      const top = M.lo + rnd() * (M.hi - M.lo) | 0;
      R(g, x, top, w, 214 - top, pick(cols)); R(g, x, top, 2, 214 - top, edge); R(g, x + w - 3, top, 3, 214 - top, sh); R(g, x, top, w, 2, L.snow ? '#eef2f8' : edge);
      for (let wy = top + 7; wy < 208; wy += 9) for (let wx = x + 5; wx < x + w - 6; wx += 7) R(g, wx, wy, 3, 5, rnd() < M.lit ? pick(M.win) : dark);
      const q = rnd();
      if (top > 16 && q < .3) { R(g, x + 8, top - 12, 12, 9, sh); R(g, x + 9, top - 3, 1, 3, sh); R(g, x + 18, top - 3, 1, 3, sh); R(g, x + 10, top - 14, 8, 2, sh); }
      else if (top > 16 && q < .55) { R(g, x + w / 2, top - 16, 1, 16, sh); R(g, x + w / 2, top - 16, 1, 1, '#ff4040'); }
      x += w;
    }
  } else if (M.t === 'mesa') {
    const mesa = (cx, w, top) => { for (let y = top; y < 188; y++) { const half = w / 2 + (y > top + 16 ? (y - top - 16) * 1.3 : 0) | 0, band = ((y - top) / 5 | 0) % 2; R(g, cx - half, y, half * 2, 1, band ? '#b5693a' : '#c47a44'); R(g, cx + half * .35, y, half * .65, 1, band ? '#8f4e2e' : '#9c5a34'); } R(g, cx - w / 2, top, w, 2, '#dc9a5c'); };
    mesa(110, 90, 96); mesa(390, 60, 118); mesa(600, 130, 84);
    for (let y = 184; y < 214; y++) R(g, 0, y, 720, 1, y < 190 ? '#d2a868' : y < 200 ? '#dcb474' : '#e4c084');
    for (let i = 0; i < 90; i++) R(g, rnd() * 720, 186 + rnd() * 26, 2 + rnd() * 3, 1, rnd() < .5 ? '#c49a5a' : '#ecd09a');
    [[230, 60], [480, 44]].forEach(([x, w]) => { R(g, x, 172, w, 14, '#8d9484'); R(g, x + 4, 168, w - 8, 4, '#8d9484'); R(g, x + 10, 165, w - 20, 3, '#9ba292'); R(g, x + w / 2 - 6, 177, 12, 9, '#565c50'); });
    [300, 540].forEach(x => { R(g, x, 140, 1, 46, '#4a4a48'); R(g, x - 3, 150, 7, 1, '#4a4a48'); R(g, x, 139, 1, 1, '#ff3030'); });
    [40, 190, 350, 450, 700].forEach(x => deco(g, 'cactus', x, 188, 1));
  } else {
    const k = Math.PI * 2 / 720;
    for (let x = 0; x < 720; x++) { const h = 180 - (5 * Math.sin(k * x * 3) + 3 * Math.sin(k * x * 8 + 1)) | 0; R(g, x, h, 1, 214 - h, M.hill); }
    for (let y = 190; y < 214; y++) R(g, 0, y, 720, 1, y < 198 ? shade(M.band, .92) : y < 206 ? M.band : shade(M.band, 1.08));
    for (let i = 0; i < 70; i++) R(g, rnd() * 720, 192 + rnd() * 20, 2 + rnd() * 3, 1, shade(M.band, rnd() < .5 ? .85 : 1.15));
    for (let i = 0, n = M.dense ? 46 : 16; i < n; i++) deco(g, pick(M.deco), 10 + rnd() * 700 | 0, (M.dense ? 180 : 190) + rnd() * 12 | 0, 1, M.snow);
  }
  return c;
}

/* ============ décor : pièces ============ */
function street(c, len, L) {
  const s = L.side, r = L.road, hi = shade(s, 1.3), jo = shade(s, .8), dash = L.dash === undefined ? '#a88a34' : L.dash;
  R(c, 0, 210, len, 16, s); R(c, 0, 210, len, 1, hi); for (let x = 10; x < len; x += 26) R(c, x, 211, 1, 15, jo);
  for (let i = 0; i < len / 7; i++) R(c, rnd() * len, 212 + rnd() * 13, 1, 1, rnd() < .5 ? hi : jo);
  R(c, 0, 226, len, 3, shade(s, .68)); R(c, 0, 226, len, 1, hi);
  R(c, 0, 229, len, 41, r); for (let i = 0; i < len * .55; i++) R(c, rnd() * len, 230 + rnd() * 40, 1 + (rnd() * 2 | 0), 1, shade(r, rnd() < .5 ? 1.25 : .75));
  if (dash) for (let x = 14; x < len; x += 44) R(c, x, 248, 20, 2, dash);
}
function building(c, L, x, w, top, B, pitch) {
  const bot = 210, litC = [L.win, shade(L.win, 1.2), shade(L.win, .75)], gl = [L.glass, shade(L.glass, 1.7), shade(L.glass, 1.35)];
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
  if (L.mansard) {
    for (let i = 0; i < 18; i++) R(c, x + 6 - i / 3, top - 23 + i, w - 12 + i / 1.5, 1, i % 4 ? '#4a5268' : '#3c4458'); R(c, x + 6, top - 24, w - 12, 2, '#6a7288');
    for (let i = 0; i < n; i++) { const wx = x + m + i * 26; R(c, wx, top - 19, 12, 14, B.light); R(c, wx + 2, top - 16, 8, 11, gl[0]); R(c, wx + 2, top - 16, 3, 4, gl[1]); R(c, wx - 1, top - 21, 14, 2, '#6a7288'); }
    R(c, x + 12, top - 34, 8, 12, B.dark); R(c, x + 10, top - 36, 12, 3, B.base);
  }
  if (L.snow) { R(c, x - 3, top - 8, w + 6, 4, '#eef2f8'); R(c, x - 1, top - 10, w + 2, 2, '#eef2f8'); }
  for (let wy = 150; wy > top + 10; wy -= pitch) rows.unshift(wy);
  rows.forEach(wy => {
    for (let i = 0; i < n; i++) {
      const wx = x + m + i * 26, q = rnd();
      R(c, wx - 2, wy - 3, 16, 2, B.light); R(c, wx - 1, wy - 1, 14, 21, '#140f1c');
      if (q < L.lit) {
        R(c, wx, wy, 12, 19, litC[0]); R(c, wx, wy, 12, 6, litC[1]);
        if (rnd() < .4) { R(c, wx + 4, wy + 9, 4, 4, '#3a1d2a'); R(c, wx + 3, wy + 13, 6, 6, '#3a1d2a'); } else R(c, wx, wy, 3, 19, litC[2]);
      } else if (q < L.lit + .1) { R(c, wx, wy, 12, 19, '#3a2a22'); for (let k = 1; k < 19; k += 5) R(c, wx, wy + k, 12, 3, k % 2 ? '#7a5632' : '#684726'); }
      else { R(c, wx, wy, 12, 19, gl[0]); R(c, wx + 1, wy + 1, 4, 7, gl[1]); R(c, wx + 7, wy + 11, 3, 5, gl[2]); }
      R(c, wx, wy + 9, 12, 1, '#140f1c'); R(c, wx + 5, wy, 1, 19, '#140f1c'); R(c, wx - 2, wy + 19, 16, 2, L.snow ? '#eef2f8' : B.light); R(c, wx - 2, wy + 21, 16, 1, B.dark);
    }
  });
  if (L.neon) {
    const nx = rnd() < .5 ? x + 3 : x + w - 12, col = pick(['#ff6ec7', '#6ef0ff', '#ffe14a', '#ff5a4a', '#7aff7a']), y0 = Math.max(top + 14, 30);
    R(c, nx - 1, y0 - 1, 10, 164 - y0, '#0c0a18');
    for (let y = y0 + 2; y < 156; y += 9) for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) if (rnd() < .55) R(c, nx + 1 + i, y + j, 1, 1, col);
    c.globalCompositeOperation = 'lighter'; R(c, nx - 4, y0 - 3, 16, 168 - y0, 'rgba(255,255,255,.05)'); c.globalCompositeOperation = 'source-over';
  }
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
function shop(c, L, x, w) {
  const name = pick(L.shops), neon = pick(['#ff6ec7', '#ffe14a', '#6ef0ff', '#ff5a4a']), aw = pick(['#2f7d5b', '#b8463c', '#3a5a9a']);
  R(c, x + 4, 170, w - 8, 40, '#1c2328'); R(c, x + 8, 180, 54, 26, '#0f3f47'); R(c, x + 10, 182, 50, 22, '#1d7f82'); R(c, x + 10, 182, 50, 5, '#3fc4b8');
  [14, 24, 36, 48].forEach((d, i) => R(c, x + d, 196 - (i % 2) * 3, 7, 8 + (i % 2) * 3, '#0f3f47'));
  txt(c, name, x + 35, 185, 2, neon, 1, false);
  c.globalCompositeOperation = 'lighter'; R(c, x + 10, 182, 50, 14, 'rgba(255,120,200,.08)'); c.globalCompositeOperation = 'source-over';
  R(c, x + 68, 180, 20, 30, '#0f1418'); R(c, x + 70, 182, 16, 28, '#3a2c26'); R(c, x + 72, 184, 12, 12, '#1d7f82'); R(c, x + 83, 198, 2, 2, '#d9a441');
  for (let ax = x + 4, i = 0; ax < x + 98; ax += 8, i++) { const cl = L.snow ? (i % 2 ? '#eef2f8' : shade(aw, 1.3)) : i % 2 ? '#e9dfc0' : aw; R(c, ax, 168, 8, 9, cl); R(c, ax + 1, 177, 6, 2, cl); }
  if (w >= 120) { R(c, x + 98, 180, 16, 22, '#55402e'); R(c, x + 100, 182, 12, 8, '#e9dfc0'); R(c, x + 100, 192, 12, 2, '#b8463c'); R(c, x + 100, 196, 8, 2, '#b8463c'); }
}
function metalDoor(c, x) {
  R(c, x, 182, 20, 28, '#1a141e'); R(c, x + 2, 184, 16, 26, '#3f4a5a'); R(c, x + 4, 186, 12, 8, '#2b3340'); R(c, x + 15, 198, 2, 2, '#c9c2d4');
  R(c, x + 24, 186, 14, 18, '#d9cfae'); R(c, x + 26, 188, 10, 6, '#7a2030'); R(c, x + 26, 196, 10, 1, '#3a2a2e'); R(c, x + 26, 199, 7, 1, '#3a2a2e');
}
function lampGlow(c, x, glow) {
  c.globalCompositeOperation = 'lighter'; [40, 28, 17, 9].forEach(r => disc(c, x - 12, 126, r, glow));
  [[-44, 212, 66], [-38, 216, 54], [-32, 220, 42]].forEach(([d, y, w]) => R(c, x + d, y, w, 4, glow)); c.globalCompositeOperation = 'source-over';
}
function carArt(c, x, body, taxi) {
  const hi = shade(body, 1.25), lo = shade(body, .6);
  R(c, x - 2, 262, 82, 3, 'rgba(0,0,0,.5)');
  R(c, x, 245, 78, 13, body); R(c, x + 16, 234, 40, 12, body); R(c, x, 245, 78, 2, hi); R(c, x + 16, 234, 40, 1, hi);
  R(c, x + 19, 236, 16, 9, '#161c2c'); R(c, x + 38, 236, 15, 9, '#161c2c'); R(c, x + 21, 237, 4, 3, '#3a4666'); R(c, x + 42, 238, 1, 6, '#e9dfd2'); R(c, x + 43, 240, 3, 1, '#e9dfd2');
  if (taxi) { for (let i = 0; i < 26; i++) R(c, x + i * 3, 251, 3, 2, i % 2 ? '#15131c' : '#f6f0d8'); R(c, x + 31, 231, 10, 3, '#fff0c0'); R(c, x + 33, 232, 6, 1, '#15131c'); }
  R(c, x, 256, 78, 2, lo); R(c, x + 76, 247, 2, 4, '#fff0c0'); R(c, x, 247, 2, 4, '#b8362f');
  disc(c, x + 16, 259, 5, '#0d0b14'); disc(c, x + 62, 259, 5, '#0d0b14'); disc(c, x + 16, 259, 2, '#6a7280'); disc(c, x + 62, 259, 2, '#6a7280');
}
function jeepArt(c, x, col) {
  R(c, x - 2, 262, 74, 3, 'rgba(0,0,0,.4)'); R(c, x, 246, 70, 12, col); R(c, x + 22, 234, 26, 12, shade(col, .82)); R(c, x + 25, 237, 20, 8, '#161c2c'); R(c, x, 246, 70, 2, shade(col, 1.3)); R(c, x + 54, 240, 12, 6, col);
  txt(c, 'US', x + 6, 250, 1, '#e9e9e0', 0, false); disc(c, x + 14, 259, 5, '#0d0b14'); disc(c, x + 56, 259, 5, '#0d0b14'); disc(c, x + 14, 259, 2, '#6a6e66'); disc(c, x + 56, 259, 2, '#6a6e66');
}
function fence(c, x, w, top, col, barbed) {
  c.fillStyle = col; for (let y = top + 2; y < 210; y++) for (let fx = x + (y % 2); fx < x + w; fx += 2) c.fillRect(fx, y, 1, 1);
  R(c, x, top, w, 2, '#3a364a'); for (let px = x; px < x + w; px += 30) R(c, px, top - 3, 2, 213 - top, '#3a364a');
  if (barbed) for (let fx = x; fx < x + w; fx += 2) R(c, fx, top - 4 - (fx / 2 % 2 | 0) * 2, 1, 1, '#2a2a2a');
}
function garage(c, L, x) {
  R(c, x, 150, 90, 60, '#4d485e'); for (let i = 0; i < 60; i++) R(c, x + rnd() * 88, 150 + rnd() * 60, 2, 1, rnd() < .5 ? '#5b566e' : '#3f3b4e');
  R(c, x - 2, 145, 94, 5, L.snow ? '#eef2f8' : '#6a6480'); R(c, x - 2, 150, 94, 2, '#2e2a3c');
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
function bunker(c, x, con) {
  const conD = shade(con, .72), conL = shade(con, 1.25);
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
function stoneWall(c, L, S, x, w, top) {
  R(c, x, top, w, 210 - top, S.base);
  for (let y = top, r = 0; y < 210; y += 7, r++) { R(c, x, y + 6, w, 1, S.dark); for (let bx = x - (r % 2) * 7; bx < x + w; bx += 14) { const q = rnd(); if (bx >= x && bx + 13 <= x + w) { if (q < .2) R(c, bx, y, 13, 6, S.light); else if (q < .38) R(c, bx, y, 13, 6, S.dark); } if (bx + 13 >= x && bx + 13 < x + w) R(c, bx + 13, y, 1, 6, S.dark); } }
  for (let bx = x; bx < x + w; bx += 7) { const cut = rnd() < .45 ? 7 * (1 + (rnd() * 2 | 0)) : 0; if (cut) c.clearRect(bx, top, 7, cut); }
  R(c, x, top + 14, 2, 196 - top, S.light); R(c, x + w - 3, top + 14, 3, 196 - top, 'rgba(0,0,0,.3)');
  if (L.moss) { for (let bx = x; bx < x + w; bx += 3) if (rnd() < .6) R(c, bx, top + 12 + rnd() * 6, 2, 3 + rnd() * 26, rnd() < .5 ? '#3a7a3a' : '#4a8a44'); }
}

/* ============ génération d'un niveau ============ */
function prop(w, h, x, top, base, fn, solid) {
  const cn = mk(w, h), g = cn.getContext('2d'); g.translate(-x, -top); fn(g); W.props.push({ img: cn, x, top, base, w });
  if (solid) W.solids.push(solid);
}
function furniture(c, L) {
  for (let lx = 150; lx < L.len - 230; lx += 240 + (rnd() * 70 | 0)) {
    let px = lx; if (W.lads.some(l => Math.abs(l.cx - px + 6) < 30)) px += 46;
    lampGlow(c, px, L.glow);
    prop(24, 114, px - 18, 114, 226, g => { R(g, px, 116, 3, 110, '#0d0b14'); R(g, px - 2, 222, 7, 4, '#0d0b14'); R(g, px - 12, 116, 14, 2, '#0d0b14'); R(g, px - 16, 117, 9, 4, '#0d0b14'); R(g, px - 15, 121, 7, 2, '#fff0c0'); });
  }
  if (L.kind === 'city') for (let hx = 260; hx < L.len - 260; hx += 300 + (rnd() * 200 | 0)) {
    if (L.phone && rnd() < .6) prop(16, 36, hx - 1, 190, 226, g => { R(g, hx, 192, 14, 34, '#c2262f'); R(g, hx, 192, 14, 2, '#e0453a'); R(g, hx + 2, 197, 10, 22, '#1c2a34'); R(g, hx + 6, 197, 2, 22, '#c2262f'); R(g, hx + 2, 204, 10, 1, '#c2262f'); R(g, hx + 2, 211, 10, 1, '#c2262f'); R(g, hx + 1, 190, 12, 2, '#c2262f'); });
    else prop(12, 16, hx - 1, 210, 225, g => { R(g, hx + 1, 213, 6, 11, '#c2362f'); R(g, hx, 212, 8, 2, '#e0554a'); R(g, hx + 2, 210, 4, 2, '#e0554a'); R(g, hx - 1, 216, 10, 3, '#c2362f'); R(g, hx + 3, 216, 2, 2, '#7a1c1c'); R(g, hx, 223, 8, 2, '#8a2420'); });
  }
  const cols = L.kind === 'city' ? ['#5a6a8a', '#7a2a2e', '#3a6a5a', '#8a8a94'] : L.kind === 'base' ? [shade(L.metal, .8)] : ['#b89a5a', '#8a6a4a'];
  for (let cx = 120, i = 0; cx < L.len - 320; cx += 420 + (rnd() * 280 | 0), i++) {
    const x = cx, taxi = L.taxi && i % 2 === 0, col = taxi ? '#e0a81e' : pick(cols);
    prop(84, 38, x - 3, 229, 263, g => L.kind === 'city' ? carArt(g, x, col, taxi) : jeepArt(g, x, col), { x0: x, x1: x + 76, y0: 246 });
  }
}
function genCity(c, L) {
  const end = L.len - 200, B = L.bricks.map(tri); let x = -10, last = 0, alt = 0, prev = '', pi = 0, first = true;
  const np = () => L.picks[pi++ % L.picks.length];
  while (x < end - 30) {
    let t = first ? 'ten' : x - last > 360 ? (alt++ % 2 ? 'scaf' : 'gar') : pick(['ten', 'ten', 'lot', 'alley', 'ten', 'lot']);
    if (t === prev && t !== 'ten') t = 'ten';
    first = false;
    let w = t === 'gar' ? 90 : t === 'alley' ? 30 : t === 'lot' ? 80 + (rnd() * 3 | 0) * 20 : t === 'scaf' ? 130 : 110 + (rnd() * 4 | 0) * 10;
    if (x + w > end) { t = 'lot'; w = end - x; }
    if (t === 'ten' || t === 'scaf') {
      const top = L.tops[0] + rnd() * (L.tops[1] - L.tops[0]) | 0, rows = building(c, L, x, w, top, pick(B), 30 + (rnd() * 4 | 0) * 2);
      if (t === 'scaf') {
        metalDoor(c, x + 16); fireEscape(c, x + 12, 44, rows.slice(0, -1)); scaffold(c, x + 62);
        const pl = { x: x + 62, w: 58, y: 167 }; W.plats.push(pl); W.lads.push({ cx: x + 75, top: 167, plat: pl }); W.picks.push({ x: x + 102, y: 167, type: np() }); last = x;
      } else {
        const g = rnd();
        if (g < .45 && w >= 110) shop(c, L, x, w); else if (g < .78) { stoop(c, x + (w >> 1) - 13); boarded(c, x + 14); cans(c, x + w - 30); } else { metalDoor(c, x + 20); boarded(c, x + w - 34); }
        if (!L.mansard || rnd() < .4) fireEscape(c, rnd() < .5 ? x + w - 60 : x + 12, 46, rows);
      }
    } else if (t === 'gar') {
      garage(c, L, x); const pl = { x: x - 2, w: 94, y: 145 }; W.plats.push(pl); W.lads.push({ cx: x + 81, top: 145, plat: pl }); W.picks.push({ x: x + 34, y: 145, type: np() }); last = x;
    } else if (t === 'lot') {
      fence(c, x, w, 172, '#15131c');
      if (w >= 100) { R(c, x + w / 2, 150, 2, 60, '#3a364a'); R(c, x + w / 2 - 9, 146, 20, 14, '#d9cfae'); R(c, x + w / 2 - 4, 153, 10, 6, '#b8463c'); R(c, x + w / 2 - 2, 160, 7, 1, '#e06a3c'); }
    } else { R(c, x, 120, 30, 90, 'rgba(10,6,22,.5)'); R(c, x, 185, 30, 25, 'rgba(10,6,22,.5)'); fence(c, x, 30, 176, '#0d0b14'); }
    prev = t; x += w;
  }
  street(c, L.len, L); bunker(c, L.len - 200, L.snow ? '#8a94a4' : '#6a6878');
}
function genBase(c, L) {
  const end = L.len - 200, M = L.metal; let x = 0, last = 0, alt = 0, prev = '', pi = 0, first = true, n = 0;
  const np = () => L.picks[pi++ % L.picks.length];
  const cont = (cx, cy, w, col) => { const dk = shade(col, .7), lt = shade(col, 1.25); R(c, cx, cy, w, 26, col); for (let i = 3; i < w - 2; i += 3) R(c, cx + i, cy + 2, 1, 22, dk); R(c, cx, cy, w, 2, L.snow ? '#eef2f8' : lt); R(c, cx, cy + 24, w, 2, dk); R(c, cx, cy, 2, 26, lt); R(c, cx + w - 2, cy, 2, 26, dk); };
  const CC = ['#a8452e', '#3a6a9a', '#5a6a3a', '#c9a23a'];
  while (x < end - 30) {
    let t = first ? 'fence' : x - last > 340 ? (alt++ % 2 ? 'cont' : 'tower') : pick(['fence', 'hangar', 'fence', 'saucer', 'hangar', 'fence']);
    if (t === prev) t = t === 'fence' ? 'hangar' : 'fence';
    if (t === 'saucer' && (!L.saucer || n++ % 2)) t = 'fence';
    first = false;
    let w = t === 'fence' ? 90 + (rnd() * 3 | 0) * 30 : t === 'hangar' ? 170 : t === 'tower' ? 60 : t === 'cont' ? 116 : 120;
    if (x + w > end) { t = 'fence'; w = end - x; }
    if (t === 'fence') {
      fence(c, x, w, 168, '#3a3a34', true);
      if (w >= 90) { const sxx = x + (w >> 1) - 20; R(c, sxx - 1, 179, 42, 18, '#15131c'); R(c, sxx, 180, 40, 16, '#e0b020'); txt(c, L.signs[0], sxx + 20, 182, 1, '#15131c', 1, false); txt(c, L.signs[1], sxx + 20, 189, 1, '#7a1c1c', 1, false); }
    } else if (t === 'hangar') {
      for (let i = 0; i < w; i++) { const u = (i - w / 2) / (w / 2), top = 210 - (34 + 56 * Math.sqrt(1 - u * u)) | 0; R(c, x + i, top, 1, 210 - top, i % 10 === 0 ? shade(M, .72) : i % 10 < 5 ? shade(M, 1.1) : M); R(c, x + i, top, 1, L.snow ? 5 : 2, L.snow ? '#eef2f8' : shade(M, 1.35)); }
      R(c, x + w / 2 - 38, 156, 76, 54, shade(M, .5)); R(c, x + w / 2 - 35, 159, 70, 51, shade(M, .68)); R(c, x + w / 2 - 1, 159, 2, 51, shade(M, .38));
      for (let dx = -35; dx < 35; dx += 5) R(c, x + w / 2 + dx, 205, 5, 5, (dx / 5 | 0) % 2 ? '#15131c' : '#e0b020');
      txt(c, String(10 + (rnd() * 80 | 0)), x + w / 2, 172, 4, '#d9d4c0', 1, false); R(c, x + w / 2 - 3, 148, 6, 4, '#ffe9a8');
    } else if (t === 'tower') {
      const tx = x + 5; R(c, tx + 4, 150, 3, 60, '#4a4a40'); R(c, tx + 43, 150, 3, 60, '#4a4a40');
      for (let i = 0; i < 36; i++) { R(c, tx + 7 + i, 152 + i * .75, 1, 1, '#5e5e52'); R(c, tx + 42 - i, 180 + i * .75, 1, 1, '#5e5e52'); }
      R(c, tx + 4, 179, 42, 1, '#5e5e52'); R(c, tx, 146, 50, 4, '#7a6a44'); R(c, tx, 150, 50, 1, '#4a3e26'); R(c, tx, 134, 50, 1, '#4a4a40'); for (let i = 0; i < 50; i += 7) R(c, tx + i, 134, 1, 12, '#4a4a40');
      R(c, tx + 3, 114, 2, 32, '#4a4a40'); R(c, tx + 45, 114, 2, 32, '#4a4a40'); R(c, tx - 4, 106, 58, 8, '#5a5f52'); R(c, tx - 4, 106, 58, 2, L.snow ? '#eef2f8' : '#767c6c'); R(c, tx + 44, 118, 7, 5, '#2a2a2a'); R(c, tx + 51, 119, 2, 3, '#fff6c8');
      ladderArt(c, tx + 20, 147);
      const pl = { x: tx, w: 50, y: 146 }; W.plats.push(pl); W.lads.push({ cx: tx + 25, top: 146, plat: pl }); W.picks.push({ x: tx + 41, y: 146, type: np() }); last = x;
    } else if (t === 'cont') {
      cont(x + 2, 184, 54, pick(CC)); cont(x + 58, 184, 54, pick(CC)); cont(x + 24, 158, 60, pick(CC)); ladderArt(c, x + 30, 159);
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
  street(c, L.len, L); bunker(c, L.len - 200, L.snow ? '#8a9aa8' : shade(L.side, .95));
}
function genRuins(c, L) {
  const end = L.len - 200, S = tri(L.stone); let x = 0, last = 0, alt = 0, prev = '', pi = 0, first = true;
  const np = () => L.picks[pi++ % L.picks.length];
  while (x < end - 30) {
    let t = first ? 'wall' : x - last > 350 ? (alt++ % 2 ? 'scafw' : 'temple') : pick(['wall', 'cols', 'gap', 'wall', 'gap', 'cols']);
    if (t === prev) t = t === 'gap' ? 'wall' : 'gap';
    first = false;
    let w = t === 'wall' ? 90 + (rnd() * 4 | 0) * 14 : t === 'cols' ? 108 : t === 'temple' ? 120 : t === 'scafw' ? 130 : 60 + (rnd() * 3 | 0) * 15;
    if (x + w > end) { t = 'gap'; w = end - x; }
    if (t === 'wall') {
      const top = 110 + (rnd() * 6 | 0) * 7; stoneWall(c, L, S, x, w, top);
      if (rnd() < .6) { const ax = x + (w >> 1) - 11; c.clearRect(ax, 176, 22, 34); c.clearRect(ax + 2, 172, 18, 4); c.clearRect(ax + 5, 169, 12, 3); R(c, ax - 2, 176, 2, 34, S.light); R(c, ax + 22, 176, 2, 34, S.dark); }
      else { R(c, x + w / 2 - 8, 150, 16, 20, S.dark); R(c, x + w / 2 - 6, 152, 12, 16, '#1a1620'); }
    } else if (t === 'cols') {
      let full = 0;
      for (let i = 0; i < 4; i++) {
        const cx = x + 10 + i * 26, br = rnd() < .3, top = br ? 170 + (rnd() * 20 | 0) : 150; if (!br) full++;
        R(c, cx, top, 10, 210 - top, S.base); R(c, cx, top, 2, 210 - top, S.light); R(c, cx + 7, top, 3, 210 - top, S.dark); for (let y = top + 6; y < 206; y += 9) R(c, cx, y, 10, 1, S.dark);
        R(c, cx - 2, 205, 14, 5, S.base); R(c, cx - 2, 205, 14, 1, S.light); if (!br) { R(c, cx - 2, 146, 14, 5, S.light); R(c, cx - 2, 150, 14, 1, S.dark); }
        if (L.moss && rnd() < .7) R(c, cx + 2, top, 2, 14 + rnd() * 20, '#3a7a3a');
      }
      if (full >= 3) { R(c, x + 6, 136, 96, 10, S.base); R(c, x + 6, 136, 96, 2, S.light); R(c, x + 6, 144, 96, 2, S.dark); for (let bx = x + 12; bx < x + 100; bx += 12) R(c, bx, 139, 6, 4, S.dark); }
    } else if (t === 'temple') {
      [[0, 186, 120], [12, 168, 96], [24, 150, 72]].forEach(([o, y, ww]) => { stoneWallFlat(c, S, x + o, y, ww, 210 - y); });
      R(c, x + 50, 188, 20, 22, '#1a1620'); R(c, x + 48, 186, 24, 3, S.light); R(c, x + 53, 191, 14, 3, '#f2c230');
      if (L.moss) for (let i = 0; i < 12; i++) R(c, x + 24 + rnd() * 70, 150, 2, 4 + rnd() * 14, '#3a7a3a');
      ladderArt(c, x + 30, 151);
      const pl = { x: x + 24, w: 72, y: 150 }; W.plats.push(pl); W.lads.push({ cx: x + 35, top: 150, plat: pl }); W.picks.push({ x: x + 78, y: 150, type: np() }); last = x;
    } else if (t === 'scafw') {
      stoneWall(c, L, S, x, w, 96); scaffold(c, x + 62);
      const pl = { x: x + 62, w: 58, y: 167 }; W.plats.push(pl); W.lads.push({ cx: x + 75, top: 167, plat: pl }); W.picks.push({ x: x + 102, y: 167, type: np() }); last = x;
    } else { deco(c, pick(L.deco), x + (w >> 1), 210, 2); if (w > 70) R(c, x + 8, 204, 14, 6, S.dark); }
    prev = t; x += w;
  }
  street(c, L.len, L); bunker(c, L.len - 200, shade(L.stone, .82));
}
function stoneWallFlat(c, S, x, y, w, h) {
  R(c, x, y, w, h, S.base); R(c, x, y, w, 2, S.light); R(c, x, y, 2, h, S.light); R(c, x + w - 3, y, 3, h, S.dark);
  for (let yy = y + 6; yy < y + h; yy += 7) R(c, x, yy, w, 1, S.dark); for (let bx = x + 7; bx < x + w; bx += 14) for (let yy = y; yy < y + h; yy += 14) R(c, bx, yy, 1, 6, S.dark);
}

/* ============ état du jeu ============ */
let world, sky, far, mid, L, W, li = 0, state = 'title', stT = 0, time = 0, shake = 0, saved = 0;
let p, zombies, bullets, acids, parts, pops, beam, spawnT, kills = 0, totalKills = 0, camX = 0, boss = null, bossState = 0;
const input = { x: 0, y: 0, fire: false, jx: 0, jy: 0 };
try { saved = clamp(+localStorage.getItem('zt_level') || 0, 0, LEVELS.length - 1); } catch (e) { saved = 0; }
const save = i => { saved = i; try { localStorage.setItem('zt_level', String(i)); } catch (e) { /* stockage indisponible */ } };

function loadLevel(i, keep) {
  li = i; L = LEVELS[i]; seed = L.seed;
  W = { plats: [], lads: [], picks: [], props: [], solids: [] };
  sky = skyCanvas(L); far = farLayer(L); mid = midLayer(L);
  world = mk(L.len, H); const c = world.getContext('2d');
  (L.kind === 'city' ? genCity : L.kind === 'base' ? genBase : genRuins)(c, L);
  furniture(c, L);
  const old = p;
  p = { x: 40, y: 220, vy: 0, dir: 1, hp: 100, st: 'ground', plat: null, lad: null, gun: 'pistol', ammo: 18, melee: 'batte', cd: 0, inv: 0, swing: 0, flash: 0, walk: 0 };
  if (keep && old) { p.gun = old.gun; p.ammo = Math.max(old.ammo, 12); p.melee = old.melee; p.hp = Math.min(100, old.hp + 30); }
  zombies = []; bullets = []; acids = []; parts = []; pops = []; beam = null; spawnT = 1.5; kills = 0; camX = 0; boss = null; bossState = 0;
  L.zmax = Math.min(12, 5 + (i * .5 | 0)); L.rate = Math.max(1.2, 2.5 - i * .09); L.types = i < 1 ? 'n' : i < 3 ? 'nnnr' : i < 6 ? 'nnnrra' : 'nnrraa'; L.hpx = 1 + i * .07;
  [300, 420, 560].forEach(x => spawn(x));
}
function spawn(x, forceT) {
  const t = forceT || pick(L.types.split('')), T = ZT[t];
  const pal = t === 'r' ? ZPALS.runner : t === 'a' ? ZPALS.armor : pick(ZPALS[L.zp]);
  zombies.push({ x, y: 214 + rnd() * 30, t, hp: Math.ceil(T.hp * L.hpx), max: Math.ceil(T.hp * L.hpx), sp: T.sp[0] + rnd() * (T.sp[1] - T.sp[0]), dmg: T.dmg, pal, off: rnd() * 14 - 7, kb: 0, hit: 0, ph: rnd() * 6, dir: -1 });
}
function spawnBoss() {
  const B = BOSSES[L.boss];
  boss = { x: camX + VW + 40, y: 236, boss: B, t: 'b', hp: B.hp, max: B.hp, sp: B.sp, dmg: B.dmg, pal: B.pal, off: 0, kb: 0, hit: 0, ph: 0, dir: -1, mode: 'walk', mt: 2.5, spitT: 2, sumT: 5, cdir: -1 };
  zombies.push(boss); bossState = 1; stT = 0; shake = 2; snd(70, .6, 'sawtooth', .08, -30);
}
function blood(x, y, gy, n, cols = ['#b01c2c', '#e0354b']) { for (let i = 0; i < n; i++) parts.push({ x, y, gy, vx: (Math.random() - .5) * 90, vy: -Math.random() * 110, life: .5 + Math.random() * .4, col: cols[Math.random() < .6 ? 0 : 1] }); }
function pop(x, y, s, col = '#fff') { pops.push({ x, y, s, col, life: 1.2 }); }
function hurtZ(z, dmg, dir) {
  z.hp -= dmg; z.hit = .1; if (!z.boss) z.kb = dir * (z.t === 'a' ? 40 : 90);
  blood(z.x, z.y - 12, z.y, dmg < 1 ? 1 : 4); if (dmg >= 1) snd(180, .06, 'square', .04, -80);
  if (z.hp <= 0) {
    blood(z.x, z.y - 10, z.y, z.boss ? 60 : 12); kills++; totalKills++; zombies.splice(zombies.indexOf(z), 1);
    if (z.boss) { boss = null; bossState = 2; shake = 3; snd(60, .8, 'sawtooth', .09, -20); W.picks.push({ x: z.x, y: z.y, type: 'med' }); pop(z.x, z.y - 50, 'BOSS VAINCU !', '#7aff7a'); }
    else { const q = Math.random(); if (q < .16) W.picks.push({ x: z.x, y: z.y, type: 'ammo' }); else if (q < .2) W.picks.push({ x: z.x, y: z.y, type: 'med' }); }
  }
}
function explode(x, gy, r, dmg) {
  shake = 2.5; snd(80, .35, 'sawtooth', .09, -40);
  for (let i = 0; i < 26; i++) parts.push({ x, y: gy - 10, gy, vx: (Math.random() - .5) * 220, vy: -Math.random() * 160, life: .3 + Math.random() * .4, col: Math.random() < .5 ? '#f39a44' : '#ffe14a' });
  zombies.slice().forEach(z => { if (Math.abs(z.x - x) < r + (z.boss ? 12 : 0) && Math.abs(z.y - gy) < 20) hurtZ(z, dmg, Math.sign(z.x - x) || 1); });
}
function solidFix(e, ox) { for (const s of W.solids) if (e.y > s.y0 && e.x > s.x0 - 5 && e.x < s.x1 + 5) { if (ox <= s.x0 - 5 || ox >= s.x1 + 5) { e.x = ox; return true; } e.y = s.y0; } return false; }
function setState(s) { state = s; stT = 0; }

/* ============ mise à jour ============ */
function update(dt) {
  time += dt; stT += dt; shake = Math.max(0, shake - dt * 8);
  if (state !== 'play') return;
  const doorX = L.len - 100;
  p.cd -= dt; p.inv -= dt; p.swing -= dt; p.flash -= dt; if (beam) { beam.t -= dt; if (beam.t <= 0) beam = null; }
  if (p.st === 'ladder') {
    p.y += input.y * 62 * dt; p.x = p.lad.cx; p.walk += Math.abs(input.y) * dt * 8;
    if (p.y <= p.lad.top) { p.y = p.lad.top; p.st = 'plat'; p.plat = p.lad.plat; }
    else if (p.y >= TOP) { p.y = TOP + 1; p.st = 'ground'; }
  } else {
    const ox = p.x;
    p.x = clamp(p.x + input.x * 72 * dt, 8, doorX);
    if (Math.abs(input.x) > .2) p.dir = Math.sign(input.x);
    if (Math.abs(input.x) > .2 || (p.st === 'ground' && Math.abs(input.y) > .2)) p.walk += dt * 9;
    if (p.st === 'ground') { p.y = clamp(p.y + input.y * 50 * dt, TOP, BOT); solidFix(p, ox); }
    const lad = W.lads.find(l => Math.abs(p.x - l.cx) < 8);
    if (lad) {
      if (p.st === 'ground' && p.y <= TOP + 2.5 && input.y < -.55) { p.st = 'ladder'; p.lad = lad; p.y = TOP - 1; }
      else if (p.st === 'plat' && input.y > .55 && p.plat === lad.plat) { p.st = 'ladder'; p.lad = lad; p.y += 1; }
    }
    if (p.st === 'plat' && (p.x < p.plat.x - 2 || p.x > p.plat.x + p.plat.w + 2)) { p.st = 'fall'; p.vy = 0; }
    if (p.st === 'fall') { p.vy += 620 * dt; p.y += p.vy * dt; if (p.y >= TOP + 2) { p.y = TOP + 2; p.st = 'ground'; } }
    if (input.fire && p.cd <= 0) fire();
  }
  if (L.boss !== undefined && bossState === 0 && p.x > L.len - 640) spawnBoss();
  const open = L.boss === undefined || bossState === 2;
  if (open && p.x >= doorX - 1 && p.st === 'ground' && p.y < 228) {
    snd(520, .15, 'square', .05, 300);
    if (li < LEVELS.length - 1) { save(li + 1); setState('clear'); } else { save(0); setState('win'); }
    return;
  }
  camX += (clamp(p.x - VW * .4 + p.dir * 20, 0, L.len - VW) - camX) * Math.min(1, dt * 5);
  /* zombies */
  spawnT -= dt;
  if (spawnT <= 0 && zombies.length < (boss ? 4 : L.zmax)) {
    spawnT = L.rate * (1 - .4 * p.x / L.len) * (.7 + Math.random() * .6) * (boss ? 1.8 : 1);
    let x = Math.random() < .7 ? camX + VW + 14 : camX - 14;
    if (x < 0) x = camX + VW + 14; if (x > doorX - 30) x = camX - 14;
    if (x > 0) spawn(x);
  }
  const reach = p.st === 'ground' || (p.st === 'ladder' && p.y > 198), py = p.st === 'ground' ? p.y : TOP + 2;
  zombies.forEach(z => {
    z.hit -= dt; const ox = z.x; let sp = z.sp;
    if (z.boss) {
      const B = z.boss; z.mt -= dt;
      if (z.mode === 'walk' && z.mt <= 0 && B.charge) { z.mode = 'tele'; z.mt = .6; z.cdir = Math.sign(p.x - z.x) || 1; }
      else if (z.mode === 'tele' && z.mt <= 0) { z.mode = 'charge'; z.mt = 1; snd(120, .3, 'sawtooth', .06, 80); }
      else if (z.mode === 'charge' && z.mt <= 0) { z.mode = 'walk'; z.mt = 2.2 + Math.random() * 1.5; }
      if (z.mode === 'tele') sp = 0;
      if (z.mode === 'charge') { z.x = clamp(z.x + z.cdir * 140 * dt, camX - 30, L.len - 60); z.dir = z.cdir; z.y += clamp(py - z.y, -30 * dt, 30 * dt); z.ph += dt * 14; sp = -1; }
      if (B.spit && (z.spitT -= dt) <= 0) { z.spitT = 1.7; const dx = p.x - z.x, dy = py - z.y, m = Math.hypot(dx, dy) || 1; acids.push({ x: z.x, y: z.y, vx: dx / m * 115, vy: dy / m * 115, life: 3.5 }); snd(400, .12, 'triangle', .05, -200); }
      if (B.summon && (z.sumT -= dt) <= 0) { z.sumT = 6.5; spawn(camX - 14, 'r'); spawn(camX + VW + 14, 'n'); }
    }
    if (sp >= 0) {
      if (Math.abs(z.kb) > 4) { z.x += z.kb * dt; z.kb *= Math.pow(.002, dt); }
      else {
        const dx = p.x + z.off - z.x, dy = py - z.y;
        if (Math.abs(dx) > 2) { z.x += Math.sign(dx) * sp * dt; z.dir = Math.sign(dx); }
        if (Math.abs(dy) > 1.5) z.y += Math.sign(dy) * sp * .6 * dt;
        z.ph += dt * (z.sp > 30 ? 12 : 6);
      }
    }
    z.y = clamp(z.y, TOP, BOT); if (!z.boss && solidFix(z, ox)) z.y -= 30 * dt;
    const rx = z.boss ? 8 * z.boss.sc : 9;
    if (reach && Math.abs(z.x - p.x) < rx && Math.abs(z.y - py) < (z.boss ? 10 : 7)) hurtP(z.dmg, z.x);
  });
  /* tirs */
  bullets.forEach(b => {
    b.x += b.vx * dt; b.life -= dt; if (b.flame) { b.vx *= Math.pow(.05, dt); b.gy += b.vy * dt; }
    if (b.gy > 0) for (const z of zombies.slice()) if (b.pierce > 0 && !b.hitSet.includes(z) && Math.abs(z.x - b.x) < (z.boss ? 8 * z.boss.sc : 7) && Math.abs(z.y - b.gy) < (z.boss ? 13 : 8)) {
      b.hitSet.push(z); b.pierce--;
      if (b.boom) explode(b.x, b.gy, b.boom, b.dmg); else hurtZ(z, b.dmg, Math.sign(b.vx) || 1);
    }
    if (b.boom && b.life <= 0 && b.pierce > 0 && b.gy > 0) explode(b.x, b.gy, b.boom, b.dmg);
  });
  bullets = bullets.filter(b => b.life > 0 && b.pierce > 0 && b.x > camX - 20 && b.x < camX + VW + 20);
  acids.forEach(a => { a.x += a.vx * dt; a.y += a.vy * dt; a.life -= dt; if (reach && Math.abs(a.x - p.x) < 7 && Math.abs(a.y - py) < 7) { a.life = 0; hurtP(12, a.x); } });
  acids = acids.filter(a => a.life > 0 && a.y > TOP - 6 && a.y < BOT + 8);
  /* bonus */
  W.picks.forEach(k => {
    if (k.got || Math.abs(k.x - p.x) > 10 || Math.abs(k.y - p.y) > 11) return;
    k.got = true; snd(660, .12, 'square', .05, 400);
    if (k.type === 'med') { p.hp = Math.min(100, p.hp + 40); pop(k.x, k.y - 26, '+40 VIE', '#7aff7a'); }
    else if (k.type === 'ammo') { p.ammo += Math.ceil(GUNS[p.gun].ammo / 2); pop(k.x, k.y - 26, '+MUNITIONS', '#f2c230'); }
    else if (MELEE[k.type]) { p.melee = k.type; pop(k.x, k.y - 26, MELEE[k.type].n, '#6ef0ff'); }
    else { p.gun = k.type; p.ammo = GUNS[k.type].ammo; pop(k.x, k.y - 26, GUNS[k.type].n, '#f2c230'); }
  });
  parts.forEach(q => { q.vy += 400 * dt; q.x += q.vx * dt; q.y += q.vy * dt; if (q.y > q.gy + 2) { q.y = q.gy + 2; q.vx = 0; q.vy = 0; } q.life -= dt; });
  parts = parts.filter(q => q.life > 0);
  pops.forEach(q => { q.y -= 14 * dt; q.life -= dt; }); pops = pops.filter(q => q.life > 0);
}
function hurtP(dmg, fromX) {
  if (p.inv > 0) return;
  p.hp -= dmg; p.inv = .8; shake = 1.5; blood(p.x, p.y - 12, p.y, 5); snd(90, .15, 'sawtooth', .07, -40);
  if (p.st === 'ground') p.x = clamp(p.x + Math.sign(p.x - fromX || 1) * 6, 8, L.len - 100);
  if (p.hp <= 0) { p.hp = 0; setState('dead'); }
}
function fire() {
  const g = GUNS[p.gun], gy = p.st === 'ground' ? p.y : -99;
  if (p.ammo > 0) {
    p.ammo--; p.cd = g.cd; p.flash = .06; if (g.shake) shake = Math.max(shake, g.shake);
    if (g.beam) {
      beam = { x: p.x + p.dir * 14, y: p.y - 12, dir: p.dir, t: .09 }; snd(900, .12, 'sawtooth', .05, -600);
      if (gy > 0) zombies.slice().forEach(z => { const d = (z.x - p.x) * p.dir; if (d > 0 && d < VW && Math.abs(z.y - gy) < (z.boss ? 13 : 8)) hurtZ(z, g.dmg, p.dir); });
    } else if (g.flame) {
      bullets.push({ x: p.x + p.dir * 14, y: p.y - 12, gy, vx: p.dir * (190 + Math.random() * 50), vy: (Math.random() - .5) * 30, dmg: g.dmg, pierce: 99, life: .34 + Math.random() * .12, hitSet: [], flame: true });
      if ((time * 20 | 0) % 3 === 0) snd(160, .06, 'sawtooth', .025, 40);
    } else {
      const n = g.pellets || 1;
      for (let i = 0; i < n; i++) bullets.push({ x: p.x + p.dir * 12, y: p.y - 12, gy: gy > 0 ? gy + (i - (n - 1) / 2) * 8 : gy, off: (i - (n - 1) / 2) * 3, vx: p.dir * (g.speed || 420), dmg: g.dmg, pierce: g.pierce, life: g.life || (g.boom ? .55 : .9), hitSet: [], boom: g.boom, bolt: g.bolt });
      snd(g.pellets || g.boom ? 110 : g.cd < .15 ? 300 : g.bolt ? 500 : 220, g.pellets ? .18 : .08, g.bolt ? 'triangle' : 'sawtooth', .06, -90);
    }
  } else {
    const m = MELEE[p.melee]; p.cd = m.cd; p.swing = Math.max(.12, m.cd * .5); snd(m.cd < .1 ? 90 : 140, .07, m.cd < .1 ? 'sawtooth' : 'triangle', .05, 60);
    if (p.st === 'ground') zombies.slice().forEach(z => { const d = (z.x - p.x) * p.dir; if (d > -4 && d < m.range + (z.boss ? 10 : 0) && Math.abs(z.y - p.y) < (z.boss ? 13 : 9)) hurtZ(z, m.dmg, p.dir); });
  }
}

/* ============ rendu ============ */
function tile(img, f) { const w = img.width, o = -((camX * f) % w) | 0; for (let x = o; x < VW; x += w) ctx.drawImage(img, x, 0); }
function drawPickup(k) {
  const x = Math.round(k.x), y = Math.round(k.y - 14 + Math.sin(time * 2.4 + k.x) * 1.5), t = k.type;
  ctx.globalCompositeOperation = 'lighter'; disc(ctx, x, y, 10, 'rgba(120,255,140,.10)'); disc(ctx, x, y, 6, 'rgba(120,255,140,.13)'); ctx.globalCompositeOperation = 'source-over';
  if (t === 'med') { R(ctx, x - 6, y - 4, 13, 10, '#f6f0e4'); R(ctx, x - 6, y + 5, 13, 1, '#b9b0a4'); R(ctx, x - 1, y - 2, 3, 6, '#e0354b'); R(ctx, x - 3, y, 7, 2, '#e0354b'); R(ctx, x - 2, y - 6, 5, 2, '#b9b0a4'); }
  else if (t === 'ammo') { R(ctx, x - 6, y - 3, 12, 8, '#4a5a34'); R(ctx, x - 6, y - 3, 12, 1, '#6a7e4a'); R(ctx, x - 4, y, 2, 4, '#f2c230'); R(ctx, x - 1, y, 2, 4, '#f2c230'); R(ctx, x + 2, y, 2, 4, '#f2c230'); }
  else if (MELEE[t]) { const m = MELEE[t]; for (let i = 0; i < 12; i++) R(ctx, x - 6 + i, y + 5 - i, 2, 2, i < 3 ? '#5a4028' : m.col); R(ctx, x + 4, y - 7, 3, 3, m.tip); if (t === 'hache') R(ctx, x + 1, y - 8, 6, 5, m.tip); }
  else { const g = GUNS[t], l = g.len + 3; R(ctx, x - (l >> 1), y - 1, l, 2, g.col); R(ctx, x - (l >> 1), y - 1, l, 1, shade(g.col, 1.3)); R(ctx, x + (l >> 1) - 3, y + 1, 3, 3, '#5a4028'); if (g.len > 8) R(ctx, x - 1, y + 1, 2, 3, shade(g.col, .6)); }
}
function drawPlayer() {
  const x = Math.round(p.x), y = Math.round(p.y) - 20, d = p.dir;
  if (p.st === 'ground') R(ctx, x - 5, y + 19, 11, 2, 'rgba(0,0,0,.3)');
  if (p.inv > 0 && (time * 20 | 0) % 2) return;
  const moving = Math.abs(input.x) > .2 || Math.abs(input.y) > .2, fr = moving ? (p.walk | 0) % 2 : 0;
  if (p.st === 'ladder') { blit(heroS[fr], x, y, (p.walk | 0) % 2, 7); return; }
  blit(heroS[fr], x, y, d < 0, 7);
  const HR = (dx, dy, w, h, col) => R(ctx, d > 0 ? x + dx : x - dx - w, y + dy, w, h, col);
  if (p.ammo > 0) {
    const g = GUNS[p.gun]; HR(6, 7, g.len, 2, g.col); HR(6, 7, g.len, 1, shade(g.col, 1.3)); HR(6, 9, 1, 2, '#3a2a1e'); if (g.len > 8) HR(9, 9, 2, 2, shade(g.col, .6));
    if (p.flash > 0 && !g.flame && !g.beam) { HR(6 + g.len, 6, 3, 3, '#f2c230'); HR(7 + g.len, 7, 4, 1, '#fff'); }
  } else { const m = MELEE[p.melee]; if (p.swing > 0) { HR(6, 8, m.range - 10, 2, m.col); HR(m.range - 6, 7, 3, 4, m.tip); } else { HR(6, -1, 2, 10, m.col); HR(5, -3, 4, 4, m.tip); } }
}
function drawZombie(z) {
  const sc = z.boss ? z.boss.sc : 1, f = (z.ph | 0) % 2;
  R(ctx, z.x - 5 * sc, z.y - 1, 11 * sc, 2, 'rgba(0,0,0,.3)');
  const tele = z.boss && z.mode === 'tele' && (time * 16 | 0) % 2;
  blit(z.hit > 0 || tele ? zWhite : zSpr(z.pal)[f], z.x, z.y - 20 * sc + f, z.dir > 0, 8, sc);
  if (!z.boss && z.t === 'a' && z.hp < z.max) { R(ctx, z.x - 6, z.y - 25, 12, 2, '#000'); R(ctx, z.x - 6, z.y - 25, 12 * z.hp / z.max, 2, '#e0354b'); }
}
function hud() {
  const m = 16;
  txt(ctx, 'VIE', m, 12); R(ctx, m + 15, 10, 64, 9, '#000'); R(ctx, m + 16, 11, 62, 7, '#3a1420');
  for (let i = 0; i < 10; i++) if (p.hp > i * 10) R(ctx, m + 17 + i * 6, 12, 5, 5, p.hp <= 30 ? '#ff7a3a' : '#e0354b');
  txt(ctx, p.ammo > 0 ? GUNS[p.gun].n + ' ' + p.ammo : MELEE[p.melee].n, m, 24, 1, '#f2c230');
  if (p.ammo > 0) txt(ctx, MELEE[p.melee].n, m, 33, 1, '#8a94a8');
  txt(ctx, (li + 1) + '/' + LEVELS.length + ' ' + L.name, VW - m, 12, 1, '#fff', 2); txt(ctx, 'ZOMBIES ' + kills, VW - m, 24, 1, '#fff', 2);
  const bw = 110, bx = (VW - bw) >> 1; R(ctx, bx - 1, 13, bw + 2, 4, '#000'); R(ctx, bx, 14, bw, 2, '#55526a');
  const px = bx + bw * clamp(p.x / (L.len - 100), 0, 1); R(ctx, bx, 14, px - bx, 2, '#f2c230'); R(ctx, px - 1, 11, 3, 8, '#e0354b');
  R(ctx, bx + bw + 2, 10, 9, 9, '#6a7e72'); R(ctx, bx + bw + 5, 13, 3, 6, '#15131c'); R(ctx, bx + bw + 2, 10, 9, 2, '#f2c230');
  if (boss) { const w = 180, x0 = (VW - w) >> 1; txt(ctx, boss.boss.n, VW / 2, 26, 1, '#ff5a5a', 1); R(ctx, x0 - 1, 34, w + 2, 6, '#000'); R(ctx, x0, 35, w, 4, '#3a1420'); R(ctx, x0, 35, w * boss.hp / boss.max, 4, '#ff3b3b'); }
  if (bossState === 1 && stT < 2.5) { if ((time * 6 | 0) % 2) txt(ctx, 'BOSS', VW / 2, 80, 6, '#ff3b3b', 1); txt(ctx, boss ? boss.boss.n : '', VW / 2, 120, 3, '#fff', 1); }
  else if (bossState === 0 && stT < 3) {
    ctx.globalAlpha = stT < 2.4 ? 1 : (3 - stT) / .6;
    txt(ctx, 'NIVEAU ' + (li + 1) + (L.boss !== undefined ? ' - BOSS' : ''), VW / 2, 70, 2, L.boss !== undefined ? '#ff5a5a' : '#fff', 1); txt(ctx, L.name, VW / 2, 88, 5, '#f08a3c', 1); txt(ctx, L.sub, VW / 2, 120, 2, '#fff', 1);
    txt(ctx, L.boss !== undefined ? 'TUE LE BOSS POUR OUVRIR LE BUNKER' : 'ATTEINS LE BUNKER', VW / 2, 140, 1, '#f2c230', 1); ctx.globalAlpha = 1;
  }
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
function weather(cx) {
  const w = L.weather;
  if (w === 'rain') for (let i = 0; i < 60; i++) { const rx = (((i * 53 - time * 60 - cx * 1.2) % VW) + VW) % VW, ry = (i * 131 + time * 430) % 236; R(ctx, rx, ry, 1, 5, 'rgba(160,190,255,.3)'); }
  else if (w === 'snow') for (let i = 0, n = L.heavy ? 150 : 70; i < n; i++) { const rx = (((i * 37 + Math.sin(time + i) * 8 - cx * .6 - time * (L.heavy ? 90 : 10)) % VW) + VW) % VW, ry = (i * 71 + time * (30 + i % 3 * 12)) % 262; R(ctx, rx, ry, 1 + (i % 4 === 0), 1 + (i % 4 === 0), 'rgba(255,255,255,.8)'); }
  else if (w === 'sand') for (let i = 0; i < 40; i++) { const rx = (((i * 91 + time * 300 - cx) % VW) + VW) % VW; R(ctx, rx, (i * 29) % 250, 9, 1, 'rgba(240,210,150,.22)'); }
  if (L.fog) { R(ctx, 0, 110, VW, 120, 'rgba(170,180,190,.09)'); R(ctx, 0, 160, VW, 70, 'rgba(170,180,190,.09)'); }
}
function overlay(a) { ctx.fillStyle = `rgba(8,5,18,${a})`; ctx.fillRect(0, 0, VW, H); }
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (shake > 0) ctx.translate((Math.random() - .5) * shake * 3 | 0, (Math.random() - .5) * shake * 3 | 0);
  ctx.drawImage(sky, 0, 0); tile(far, .12); tile(mid, .4);
  const cx = Math.round(camX);
  ctx.drawImage(world, cx, 0, VW, H, 0, 0, VW, H);
  ctx.save(); ctx.translate(-cx, 0);
  const bx = L.len - 100, open = L.boss === undefined || bossState === 2, on = (time * 2 | 0) % 2;
  R(ctx, bx - 3, 155, 6, 4, open ? (on ? '#7aff7a' : '#2a6a2a') : '#ff3b3b');
  if (on || !open) { ctx.globalCompositeOperation = 'lighter'; disc(ctx, bx, 157, 9, open ? 'rgba(120,255,120,.14)' : 'rgba(255,60,60,.14)'); ctx.globalCompositeOperation = 'source-over'; }
  W.lads.forEach(l => { if (p.st === 'ground' && Math.abs(l.cx - p.x) < 44 && (time * 3 | 0) % 2) { R(ctx, l.cx - 1, 196, 3, 1, '#fff'); R(ctx, l.cx - 2, 197, 5, 1, '#fff'); R(ctx, l.cx - 3, 198, 7, 1, '#fff'); R(ctx, l.cx - 1, 199, 3, 4, '#fff'); } });
  /* tri en profondeur */
  const items = [];
  const vis = x => x > cx - 90 && x < cx + VW + 30;
  W.props.forEach(o => { if (vis(o.x)) items.push([o.base, () => ctx.drawImage(o.img, o.x, o.top)]); });
  W.picks.forEach(k => { if (!k.got && vis(k.x)) items.push([k.y - .5, () => drawPickup(k)]); });
  zombies.forEach(z => { if (vis(z.x)) items.push([z.y, () => drawZombie(z)]); });
  items.push([p.st === 'ground' ? p.y + .1 : 0, drawPlayer]);
  items.sort((a, b) => a[0] - b[0]).forEach(it => it[1]());
  bullets.forEach(b => {
    const y = b.y + (b.off || 0) + (b.flame ? (b.gy > 0 ? 0 : 0) : 0);
    if (b.flame) { const s = 2 + (b.life < .2 ? 2 : 0); R(ctx, b.x - 1, (b.gy > 0 ? b.gy - 12 : b.y) - s / 2, s + 1, s, b.life > .25 ? '#ffe14a' : b.life > .12 ? '#f39a44' : '#b8362f'); }
    else if (b.boom) { R(ctx, b.x - 2, y - 1, 5, 3, '#3a4a2a'); R(ctx, b.x - (b.vx > 0 ? 6 : -3), y, 4, 1, '#f39a44'); }
    else if (b.bolt) { R(ctx, b.x - 4, y, 8, 1, '#a8743c'); R(ctx, b.x + (b.vx > 0 ? 3 : -4), y - 1, 2, 3, '#c9d2e0'); }
    else { R(ctx, b.x - (b.vx > 0 ? 6 : 0), y, 6, 1, '#fff0c0'); R(ctx, b.x - (b.vx > 0 ? 12 : -6), y, 6, 1, '#f39a44'); }
  });
  if (beam) { const x0 = beam.dir > 0 ? beam.x : cx - 10, w = beam.dir > 0 ? cx + VW + 10 - beam.x : beam.x - cx + 10; R(ctx, x0, beam.y - 1, w, 3, 'rgba(90,240,192,.45)'); R(ctx, x0, beam.y, w, 1, '#eafff8'); }
  acids.forEach(a => { R(ctx, a.x - 3, a.y - 1, 6, 2, 'rgba(0,0,0,.3)'); disc(ctx, Math.round(a.x), Math.round(a.y - 10), 3, '#7aff3a'); R(ctx, a.x - 1, a.y - 12, 2, 2, '#e0ffb0'); });
  parts.forEach(q => R(ctx, q.x, q.y, 1 + (q.life > .5), 1, q.col));
  pops.forEach(q => { ctx.globalAlpha = Math.min(1, q.life * 2); txt(ctx, q.s, q.x, q.y, 1, q.col, 1); ctx.globalAlpha = 1; });
  ctx.restore();
  weather(cx);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const blink = (time * 2 | 0) % 2;
  if (state === 'play') { hud(); controls(); }
  else if (state === 'title') {
    overlay(.62); txt(ctx, 'ZOMBIETOWN', VW / 2 + 2, 42, 7, '#5a1d58', 1, false); txt(ctx, 'ZOMBIETOWN', VW / 2, 40, 7, '#f08a3c', 1);
    txt(ctx, '15 NIVEAUX AUTOUR DU MONDE - UN BOSS TOUS LES 5 NIVEAUX', VW / 2, 92, 1, '#fff', 1);
    txt(ctx, 'JOYSTICK : SE DEPLACER SUR LE TROTTOIR ET LA ROUTE', VW / 2, 112, 1, '#e9dfd2', 1); txt(ctx, 'POUSSE VERS LE HAUT AU PIED D\'UNE ECHELLE JAUNE POUR MONTER', VW / 2, 122, 1, '#e9dfd2', 1); txt(ctx, 'BOUTON ROUGE : TIRER - FRAPPER QUAND IL N\'Y A PLUS DE MUNITIONS', VW / 2, 132, 1, '#e9dfd2', 1);
    if (saved > 0) {
      R(ctx, VW / 2 - 150, 160, 140, 40, '#000'); R(ctx, VW / 2 - 148, 162, 136, 36, '#2a6a3a'); txt(ctx, 'CONTINUER', VW / 2 - 80, 168, 2, '#fff', 1); txt(ctx, 'NIVEAU ' + (saved + 1) + ' - ' + LEVELS[saved].name, VW / 2 - 80, 185, 1, '#c8ffd0', 1);
      R(ctx, VW / 2 + 10, 160, 140, 40, '#000'); R(ctx, VW / 2 + 12, 162, 136, 36, '#7a1c24'); txt(ctx, 'NOUVELLE PARTIE', VW / 2 + 80, 170, 2, '#fff', 1); txt(ctx, 'NIVEAU 1', VW / 2 + 80, 185, 1, '#ffc8c8', 1);
    } else if (blink) txt(ctx, 'TOUCHE L\'ECRAN POUR JOUER', VW / 2, 176, 2, '#f2c230', 1);
  } else if (state === 'clear') {
    const N = LEVELS[li + 1];
    overlay(.6); txt(ctx, 'NIVEAU TERMINE', VW / 2, 70, 5, '#7aff7a', 1); txt(ctx, 'ZOMBIES TUES : ' + kills, VW / 2, 120, 2, '#fff', 1);
    txt(ctx, 'PROCHAIN : ' + N.name + ' - ' + N.sub + (N.boss !== undefined ? ' - BOSS' : ''), VW / 2, 142, 2, N.boss !== undefined ? '#ff5a5a' : '#f08a3c', 1); if (blink && stT > .6) txt(ctx, 'TOUCHE POUR CONTINUER', VW / 2, 190, 2, '#f2c230', 1);
  } else if (state === 'dead') {
    overlay(.7); txt(ctx, 'TU ES MORT', VW / 2, 80, 6, '#e0354b', 1); txt(ctx, 'ZOMBIES TUES : ' + kills, VW / 2, 130, 2, '#fff', 1); if (blink && stT > .6) txt(ctx, 'TOUCHE POUR RECOMMENCER LE NIVEAU', VW / 2, 180, 2, '#f2c230', 1);
  } else if (state === 'win') {
    overlay(.6); txt(ctx, 'LE MONDE EST SAUVE', VW / 2, 70, 5, '#7aff7a', 1); txt(ctx, 'TOTAL ZOMBIES TUES : ' + totalKills, VW / 2, 126, 2, '#fff', 1); if (blink && stT > .6) txt(ctx, 'TOUCHE POUR REJOUER', VW / 2, 180, 2, '#f2c230', 1);
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
const joy = { id: null, ox: 0, oy: 0 }; let fireId = null;
const keys = {};
function resize() {
  const r = wrap.getBoundingClientRect(), vw = r.width || 480, vh = r.height || 270;
  rot = vw < vh; const LW = rot ? vh : vw, LH = rot ? vw : vh;
  VW = clamp(Math.round(H * LW / LH), 360, 720); cv.width = VW; cv.height = H;
  cv.style.width = LW + 'px'; cv.style.height = LH + 'px'; cv.style.transform = rot ? `translate(${vw}px,0) rotate(90deg)` : 'none';
  sx = VW / LW; sy = H / LH; cssW = vw; ctx.imageSmoothingEnabled = false;
}
function toGame(t) { const r = wrap.getBoundingClientRect(), cx = t.clientX - r.left, cy = t.clientY - r.top; return rot ? [cy * sx, (cssW - cx) * sy] : [cx * sx, cy * sy]; }
function advance(gx) {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
  if (ac && ac.state === 'suspended') ac.resume();
  if (state === 'play' || stT < .6) return false;
  if (state === 'title') { const start = saved > 0 && gx < VW / 2 ? saved : 0; if (start !== li) loadLevel(start, false); if (!start) save(0); totalKills = 0; setState('play'); }
  else if (state === 'clear') { loadLevel(li + 1, true); setState('play'); }
  else if (state === 'dead') { loadLevel(li, false); setState('play'); }
  else if (state === 'win') { totalKills = 0; loadLevel(0, false); setState('play'); }
  return true;
}
function down(id, t) {
  const [gx, gy] = toGame(t);
  if (advance(gx)) return;
  if (state !== 'play') return;
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
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space' || e.code === 'Enter') advance(0); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
addEventListener('blur', () => { up(joy.id); fireId = null; });
function readInput() {
  const kx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA || keys.KeyQ ? 1 : 0), ky = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW || keys.KeyZ ? 1 : 0);
  input.x = kx || (Math.abs(input.jx) > .25 ? input.jx : 0); input.y = ky || (Math.abs(input.jy) > .25 ? input.jy : 0); input.fire = fireId !== null || !!keys.Space;
}

/* ============ boucle ============ */
resize(); loadLevel(0, false);
let lastT = 0;
function loop(ms) { const dt = Math.min(.05, (ms - lastT) / 1000 || 0); lastT = ms; readInput(); update(dt); render(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
window.ZT = { goto: i => { loadLevel(i, false); setState('play'); }, get p() { return p; }, get L() { return L; }, get W() { return W; }, get state() { return state; }, get boss() { return boss; }, get z() { return zombies; }, n: LEVELS.length };
})();
