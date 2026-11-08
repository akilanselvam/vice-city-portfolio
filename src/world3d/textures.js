import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { rng } from '../city/layout.js';

function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export function makeWindowTexture() {
  const r = rng(11);
  const tex = canvas(128, 256, (g, w, h) => {
    g.fillStyle = '#2a1d3e';
    g.fillRect(0, 0, w, h);
    const cols = 8;
    const rows = 16;
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        const roll = r();
        g.fillStyle = roll < 0.34 ? '#ffd27a' : roll < 0.42 ? '#ff6fd0' : roll < 0.48 ? '#6ff0ff' : '#3a2c52';
        g.fillRect(cx * (w / cols) + 3, cy * (h / rows) + 3, w / cols - 6, h / rows - 7);
      }
    }
  });
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

// One road tile: u runs across the road, v along it (one tile = ROAD_TILE_METERS).
// Painting the lines into a mipmapped texture keeps them visible far down the road,
// where thin line meshes would shrink below a pixel and vanish.
export const ROAD_TILE_METERS = 8;

export function makeRoadTexture(edge) {
  const tex = canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#463a5c';
    g.fillRect(0, 0, w, h);
    const r = rng(23);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
      g.fillRect(r() * w, r() * h, 2, 2);
    }
    g.fillStyle = edge;
    g.fillRect(w * 0.035, 0, w * 0.045, h);
    g.fillRect(w * 0.92, 0, w * 0.045, h);
    g.fillStyle = '#fff4dc';
    g.fillRect(w * 0.48, 0, w * 0.04, h * 0.55);
  });
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.anisotropy = 16;
  return tex;
}

export function makeGlowTexture() {
  return canvas(128, 128, (g, w) => {
    const grad = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, w);
  });
}

export function makeFadeTexture() {
  return canvas(4, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

// Neon sign text; assumes the web font has loaded so the canvas can use it
export function makeSignTexture(title, sub) {
  return canvas(1024, 384, (g, w, h) => {
    g.fillStyle = 'rgba(14, 6, 26, 0.92)';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ff2d95';
    g.lineWidth = 14;
    g.shadowColor = '#ff2d95';
    g.shadowBlur = 30;
    g.strokeRect(18, 18, w - 36, h - 36);
    g.textAlign = 'center';
    g.fillStyle = '#ffd6f0';
    g.font = '150px Yellowtail, cursive';
    g.fillText(title, w / 2, 200);
    g.shadowColor = '#2de2ff';
    g.fillStyle = '#c8f8ff';
    g.font = '62px Anton, Impact, sans-serif';
    g.fillText(sub.toUpperCase(), w / 2, 305);
  });
}
