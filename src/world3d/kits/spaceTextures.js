import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace } from 'three';
import { rng } from '../../city/layout.js';

function canvas(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  tex.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping;
  tex.anisotropy = 16;
  return tex;
}

// Yellow/black hazard chevrons in a vertical band
function hazard(g, x, w, h, tile = 16) {
  g.save();
  g.beginPath();
  g.rect(x, 0, w, h);
  g.clip();
  g.fillStyle = '#ffd100';
  g.fillRect(x, 0, w, h);
  g.fillStyle = '#111214';
  for (let y = -w; y < h + w; y += tile * 2) {
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + w, y + w);
    g.lineTo(x + w, y + w + tile);
    g.lineTo(x, y + tile);
    g.fill();
  }
  g.restore();
}

// Flight-lane tile (u across, v along): riveted deck plating, hazard-striped edges, blue guide lights down the middle
export function makeLaneTexture(edge = 'hazard', guide = '#7fc8ff') {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#3a3f4a';
    g.fillRect(0, 0, w, h);
    const r = rng(81);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)';
      g.fillRect(r() * w, r() * h, 2, 2);
    }
    g.strokeStyle = 'rgba(10,12,16,0.7)';
    g.lineWidth = 3;
    for (const v of [0, h / 2]) {
      g.beginPath();
      g.moveTo(0, v);
      g.lineTo(w, v);
      g.stroke();
    }
    for (const u of [0.3, 0.7]) {
      g.beginPath();
      g.moveTo(w * u, 0);
      g.lineTo(w * u, h);
      g.stroke();
    }
    if (edge === 'hazard') {
      hazard(g, w * 0.02, w * 0.07, h);
      hazard(g, w * 0.91, w * 0.07, h);
    } else {
      g.fillStyle = edge;
      g.fillRect(w * 0.035, 0, w * 0.04, h);
      g.fillRect(w * 0.925, 0, w * 0.04, h);
    }
    g.fillStyle = guide;
    for (const v of [0.12, 0.62]) g.fillRect(w * 0.47, h * v, w * 0.06, h * 0.22);
  });
}

// Outpost hull panels: one deck per tile, small lit ports. Colour map plus an emissive map of only the lights.
export function makeHullTextures() {
  const r = rng(91);
  const ports = [];
  for (let i = 0; i < 6; i++) ports.push(r() < 0.6 ? (r() < 0.75 ? '#ffd27a' : '#7fc8ff') : null);
  const W = 256;
  const H = 256;
  const drawPorts = (g, glow) => {
    ports.forEach((c, k) => {
      const x = 22 + k * 38;
      const y = H * 0.42;
      if (glow) {
        g.fillStyle = c ?? '#000';
        g.fillRect(x, y, 24, 14);
        return;
      }
      g.fillStyle = '#0d0f13';
      g.fillRect(x - 3, y - 3, 30, 20);
      g.fillStyle = c ?? '#1c222c';
      g.fillRect(x, y, 24, 14);
    });
  };
  const map = canvas(W, H, (g) => {
    g.fillStyle = '#4a505c';
    g.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)';
      g.fillRect(r() * W, r() * H, 2, 2);
    }
    g.strokeStyle = '#2a2e36';
    g.lineWidth = 4;
    g.strokeRect(2, 2, W - 4, H - 4);
    g.beginPath();
    g.moveTo(W / 2, 0);
    g.lineTo(W / 2, H * 0.3);
    g.stroke();
    g.fillStyle = '#2a2e36';
    g.fillRect(0, H * 0.72, W, 6);
    g.save();
    g.translate(0, H * 0.8);
    g.rotate(-Math.PI / 2);
    hazard(g, -H * 0.16, H * 0.16, W, 14);
    g.restore();
    drawPorts(g, false);
  });
  const glow = canvas(W, H, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, W, H);
    drawPorts(g, true);
  });
  return { map, glow };
}

// Holographic billboard naming a stop; assumes the web fonts have loaded
export function makeHoloSign(title, sub) {
  return canvas(
    1024,
    384,
    (g, w, h) => {
      g.fillStyle = 'rgba(6, 12, 24, 0.9)';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(127, 200, 255, 0.12)';
      g.lineWidth = 2;
      for (let y = 8; y < h; y += 8) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
      }
      hazard(g, 18, 26, h, 14);
      hazard(g, w - 44, 26, h, 14);
      g.textAlign = 'center';
      g.shadowColor = '#ffd100';
      g.shadowBlur = 18;
      g.fillStyle = '#ffd100';
      g.font = '120px "Saira Stencil One", Impact, sans-serif';
      g.fillText(title.toUpperCase(), w / 2, 196);
      g.shadowColor = '#7fc8ff';
      g.fillStyle = '#cfe8ff';
      g.font = '600 56px "Chakra Petch", sans-serif';
      g.fillText(sub.toUpperCase(), w / 2, 296);
    },
    false,
  );
}

// Banded gas giant for the sky
export function makePlanetTexture() {
  return canvas(512, 256, (g, w, h) => {
    const r = rng(101);
    const colors = ['#c98a4a', '#e8c48a', '#a8603a', '#f0dcb0', '#b8743e', '#d8a868', '#8a4a2a'];
    let y = 0;
    while (y < h) {
      const band = 6 + r() * 26;
      g.fillStyle = colors[Math.floor(r() * colors.length)];
      g.fillRect(0, y, w, band + 1);
      y += band;
    }
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(60,20,0,0.08)';
      g.fillRect(r() * w, r() * h, 10 + r() * 30, 2);
    }
    g.fillStyle = 'rgba(170, 60, 30, 0.75)';
    g.beginPath();
    g.ellipse(w * 0.62, h * 0.62, 34, 14, 0, 0, Math.PI * 2);
    g.fill();
  });
}

export function makeRingTexture() {
  return canvas(
    512,
    8,
    (g, w, h) => {
      const r = rng(111);
      for (let x = 0; x < w; x++) {
        const a = (0.25 + r() * 0.5) * Math.sin((x / w) * Math.PI);
        g.fillStyle = `rgba(230, 210, 170, ${a.toFixed(3)})`;
        g.fillRect(x, 0, 1, h);
      }
    },
    false,
  );
}
