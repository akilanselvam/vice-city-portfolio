import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three';
import { rng } from '../../city/layout.js';

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function speckle(g, w, h, seed, n, colors) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    const s = 1 + r() * 3;
    g.fillRect(r() * w, r() * h, s, s);
  }
}

// One road tile (u across, v along). Packed dirt with wheel ruts and grassy verges.
export function makeDirtTexture() {
  return canvas(256, 256, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#556b34');
    grad.addColorStop(0.1, '#7a6440');
    grad.addColorStop(0.5, '#8a7150');
    grad.addColorStop(0.9, '#7a6440');
    grad.addColorStop(1, '#556b34');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, 31, 1600, ['rgba(40,28,16,0.25)', 'rgba(170,150,110,0.25)', 'rgba(90,70,45,0.3)']);
    g.fillStyle = 'rgba(55,40,24,0.35)';
    for (const u of [0.3, 0.66]) g.fillRect(w * u, 0, w * 0.06, h);
    speckle(g, w * 0.08, h, 32, 220, ['rgba(70,100,40,0.7)', 'rgba(95,120,55,0.6)']);
    g.save();
    g.translate(w * 0.92, 0);
    speckle(g, w * 0.08, h, 33, 220, ['rgba(70,100,40,0.7)', 'rgba(95,120,55,0.6)']);
    g.restore();
  });
}

// Town cobblestones for the main road, edged with a darker kerb of setts
export function makeCobbleTexture() {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#4a4540';
    g.fillRect(0, 0, w, h);
    const r = rng(41);
    const rows = 16;
    const rh = h / rows;
    for (let row = 0; row < rows; row++) {
      let x = row % 2 ? -rh * 0.5 : 0;
      while (x < w) {
        const sw = rh * (0.9 + r() * 0.6);
        const shade = 98 + Math.floor(r() * 40);
        g.fillStyle = `rgb(${shade + 6},${shade},${shade - 8})`;
        g.beginPath();
        g.roundRect(x + 1.5, row * rh + 1.5, sw - 3, rh - 3, 4);
        g.fill();
        x += sw;
      }
    }
    g.fillStyle = 'rgba(30,26,22,0.55)';
    g.fillRect(0, 0, w * 0.05, h);
    g.fillRect(w * 0.95, 0, w * 0.05, h);
    speckle(g, w, h, 42, 500, ['rgba(0,0,0,0.12)', 'rgba(255,240,220,0.08)']);
  });
}

// Half-timbered wall: one storey per tile vertically, two window bays across. Returns the colour map and an
// emissive map holding just the window glow, so lit windows can brighten at night.
export function makeTimberTextures() {
  const r = rng(51);
  const lit = [];
  for (let i = 0; i < 4; i++) lit.push(r() < 0.55);
  const W = 256;
  const H = 256;
  const windows = (g, glow) => {
    [0.25, 0.75].forEach((cx, k) => {
      const x = W * cx - 22;
      const y = H * 0.36;
      if (glow) {
        g.fillStyle = lit[k] ? '#ffb347' : '#000';
        g.fillRect(x + 4, y + 4, 36, 52);
        return;
      }
      g.fillStyle = '#3b2a1c';
      g.fillRect(x - 4, y - 4, 52, 68);
      g.fillStyle = lit[k] ? '#e0a050' : '#2a2a30';
      g.fillRect(x + 4, y + 4, 36, 52);
      g.fillStyle = '#3b2a1c';
      g.fillRect(x + 20, y + 4, 4, 52);
      g.fillRect(x + 4, y + 28, 36, 4);
    });
  };
  const map = canvas(W, H, (g) => {
    g.fillStyle = '#d6c7a4';
    g.fillRect(0, 0, W, H);
    speckle(g, W, H, 52, 1400, ['rgba(120,100,70,0.18)', 'rgba(255,250,235,0.2)']);
    g.fillStyle = '#4a3322';
    const beam = 14;
    g.fillRect(0, 0, W, beam);
    g.fillRect(0, H - beam, W, beam);
    for (const x of [0, W / 2]) g.fillRect(x, 0, beam, H);
    g.lineWidth = beam * 0.85;
    g.strokeStyle = '#4a3322';
    g.beginPath();
    g.moveTo(beam, H - beam);
    g.lineTo(W / 2 - 40, H * 0.32);
    g.moveTo(W - beam / 2, H - beam);
    g.lineTo(W / 2 + 40, H * 0.32);
    g.stroke();
    windows(g, false);
  });
  const glow = canvas(W, H, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    windows(g, true);
  });
  return { map, glow };
}

// Rough grey stonework for towers and the windmill
export function makeStoneTexture() {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#5c5751';
    g.fillRect(0, 0, w, h);
    const r = rng(61);
    const rows = 8;
    const rh = h / rows;
    for (let row = 0; row < rows; row++) {
      let x = row % 2 ? -rh : 0;
      while (x < w) {
        const sw = rh * (1.4 + r() * 1.2);
        const shade = 112 + Math.floor(r() * 36);
        g.fillStyle = `rgb(${shade},${shade - 4},${shade - 10})`;
        g.fillRect(x + 2, row * rh + 2, sw - 4, rh - 4);
        x += sw;
      }
    }
    speckle(g, w, h, 62, 700, ['rgba(0,0,0,0.15)', 'rgba(90,110,70,0.18)']);
  });
}

// Parchment noticeboard naming a stop; assumes the web fonts have loaded
export function makeNoticeTexture(title, sub) {
  const tex = canvas(1024, 384, (g, w, h) => {
    g.fillStyle = '#3a2716';
    g.fillRect(0, 0, w, h);
    const grad = g.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.6);
    grad.addColorStop(0, '#efe0bb');
    grad.addColorStop(1, '#c9b07c');
    g.fillStyle = grad;
    g.fillRect(28, 28, w - 56, h - 56);
    speckle(g, w, h, 71, 900, ['rgba(110,80,40,0.12)']);
    g.strokeStyle = '#7a1d14';
    g.lineWidth = 4;
    g.strokeRect(48, 48, w - 96, h - 96);
    g.textAlign = 'center';
    g.fillStyle = '#2b1b10';
    g.font = '700 118px Cinzel, Georgia, serif';
    g.fillText(title, w / 2, 196);
    g.fillStyle = '#7a1d14';
    g.font = 'italic 600 58px "Cormorant Garamond", Georgia, serif';
    g.fillText(sub, w / 2, 290);
  });
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}
