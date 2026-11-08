import { useEffect, useState } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { contact, courses, experience, isExpired, profile, projects, sortedCerts } from '../../data/content.jsx';

// The board on the back wall of each pit-stop cart. It shows that section's real content (skills,
// projects, jobs, contact details...) drawn onto a canvas in the theme's colours and fonts.

const STYLES = {
  vice: {
    bg: '#160828',
    border: '#ff2d95',
    glow: 'rgba(255, 45, 149, 0.9)',
    head: '#ffd6f0',
    sub: '#2de2ff',
    text: '#f7f0ff',
    label: '#ff7ad1',
    muted: '#d4c2ea',
    chipBg: 'rgba(255, 45, 149, 0.16)',
    chipLine: 'rgba(255, 122, 209, 0.8)',
    headFont: 'Anton, Impact, sans-serif',
    headWeight: '400',
    bodyFont: 'Rajdhani, "Segoe UI", sans-serif',
    load: ['64px Anton', '600 34px Rajdhani', '700 34px Rajdhani'],
    upper: true,
    bright: 1.05,
  },
  medieval: {
    bg: '#efe0bb',
    border: '#7a5a2a',
    glow: null,
    head: '#3a2412',
    sub: '#7a1d14',
    text: '#2e1d0e',
    label: '#7a1d14',
    muted: '#6a4a28',
    chipBg: 'rgba(122, 90, 42, 0.12)',
    chipLine: 'rgba(122, 90, 42, 0.7)',
    headFont: 'Cinzel, Georgia, serif',
    headWeight: '700',
    bodyFont: '"Alegreya Sans", "Segoe UI", sans-serif',
    load: ['700 60px Cinzel', '500 34px "Alegreya Sans"', '700 34px "Alegreya Sans"'],
    upper: false,
    bright: 0.95,
  },
  space: {
    bg: '#0a0f1a',
    border: '#ffd100',
    glow: 'rgba(255, 209, 0, 0.6)',
    head: '#ffd100',
    sub: '#4da3ff',
    text: '#f1f3f5',
    label: '#ffd100',
    muted: '#a7afbb',
    chipBg: 'rgba(77, 163, 255, 0.14)',
    chipLine: 'rgba(77, 163, 255, 0.75)',
    headFont: '"Chakra Petch", "Segoe UI", sans-serif',
    headWeight: '700',
    bodyFont: '"Chakra Petch", "Segoe UI", sans-serif',
    load: ['700 60px "Chakra Petch"', '600 34px "Chakra Petch"'],
    upper: true,
    bright: 1.1,
  },
};

const VERB = { vice: 'Drive', medieval: 'Ride', space: 'Fly' };
// Short names that fit the certification board
const CERT_SHORT = {
  'ccdv-f': 'Claude Developer',
  'gcp-ace': 'Google Cloud Engineer',
  'gh-copilot': 'GitHub Copilot',
  'az-400': 'AZ-400 DevOps Expert',
  'az-204': 'AZ-204 Azure Developer',
  'dp-900': 'DP-900 Data Fundamentals',
  'az-900': 'AZ-900 Azure Fundamentals',
};
const site = (url) => (url ? url.replace(/^https?:\/\/(www\.)?/, '') : '');

// What each section's board says, straight from the portfolio data
function boardContent(id, theme) {
  switch (id) {
    case 'home':
      return {
        heading: profile.name,
        sub: `${profile.role} · ${profile.company}`,
        chips: profile.motto,
        cols: 4,
        footer: profile.tagline.join(' '),
      };
    case 'about':
      return {
        heading: 'About me',
        sub: profile.name,
        rows: [
          ['Role', profile.role],
          ['Company', profile.company],
          ['Based in', profile.location],
          ['Education', profile.education],
          ['Stack', profile.stack.slice(0, 5).join(' · ')],
        ],
      };
    case 'skills': {
      const certs = sortedCerts();
      return {
        heading: 'Certifications',
        sub: `${certs.filter((c) => !isExpired(c)).length} current · ${certs.length} earned`,
        chips: certs.map((c) => CERT_SHORT[c.id] ?? c.name),
        cols: 2,
        footer: `+ ${courses.length} courses`,
      };
    }
    case 'projects':
      return {
        heading: 'Projects',
        sub: `${projects.length} featured builds`,
        rows: projects.slice(0, 5).map((p) => [p.title, p.tech.slice(0, 3).join(' · ')]),
        wide: true,
      };
    case 'experience':
      return {
        heading: 'Experience',
        sub: 'Career journey',
        rows: experience.map((e) => [e.period, e.org ? `${e.role} · ${e.org}` : e.role]),
      };
    case 'contact':
      return {
        heading: 'Contact',
        sub: "Let's connect",
        rows: [
          ['Email', contact.email],
          ['LinkedIn', site(contact.linkedin)],
          ['GitHub', site(contact.github)],
          ['Location', contact.location],
        ].filter(([, v]) => v),
      };
    case 'freeroam': {
      const verb = VERB[theme] ?? 'Drive';
      return {
        heading: 'How to play',
        sub: `${verb} anywhere you like`,
        rows: [
          ['W A S D', `${verb} and steer (or arrow keys)`],
          ['Space', 'Brake'],
          ['Markers', `${verb} in to open a section`],
          ['Drag', 'Look around'],
          ['F / Esc', 'Back to the tour'],
        ],
      };
    }
    default:
      return null;
  }
}

// Shrinks the font until the text fits the width
function fit(g, text, weight, size, family, maxWidth) {
  let s = size;
  g.font = `${weight} ${s}px ${family}`;
  while (s > 14 && g.measureText(text).width > maxWidth) {
    s -= 2;
    g.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

function paintBoard(theme, id) {
  const st = STYLES[theme];
  const content = boardContent(id, theme);
  if (!st || !content) return null;
  const w = 1024;
  const h = 456;
  const pad = 46;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const up = (t) => (st.upper ? t.toUpperCase() : t);

  g.fillStyle = st.bg;
  g.fillRect(0, 0, w, h);
  g.save();
  if (st.glow) {
    g.shadowColor = st.glow;
    g.shadowBlur = 22;
  }
  g.strokeStyle = st.border;
  g.lineWidth = 8;
  g.strokeRect(14, 14, w - 28, h - 28);
  g.restore();
  if (theme === 'medieval') {
    g.strokeStyle = 'rgba(122, 90, 42, 0.45)';
    g.lineWidth = 2;
    g.strokeRect(26, 26, w - 52, h - 52);
  }

  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillStyle = st.head;
  fit(g, up(content.heading), st.headWeight, 58, st.headFont, w * 0.56);
  g.fillText(up(content.heading), pad, 98);
  g.fillStyle = st.sub;
  g.textAlign = 'right';
  fit(g, up(content.sub), '700', 30, st.bodyFont, w * 0.4);
  g.fillText(up(content.sub), w - pad, 96);
  g.textAlign = 'left';
  g.fillStyle = st.chipLine;
  g.fillRect(pad, 120, w - pad * 2, 3);

  const top = 146;
  const bottom = h - (content.footer ? 70 : 40);
  if (content.chips) {
    const cols = content.cols;
    const gap = 14;
    const rows = Math.ceil(content.chips.length / cols);
    const cw = (w - pad * 2 - gap * (cols - 1)) / cols;
    const ch = Math.min(64, (bottom - top - gap * (rows - 1)) / rows);
    content.chips.forEach((name, k) => {
      const x = pad + (k % cols) * (cw + gap);
      const y = top + Math.floor(k / cols) * (ch + gap);
      g.fillStyle = st.chipBg;
      g.fillRect(x, y, cw, ch);
      g.strokeStyle = st.chipLine;
      g.lineWidth = 2;
      g.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
      g.fillStyle = st.text;
      g.textAlign = 'center';
      fit(g, name, '700', Math.round(ch * 0.5), st.bodyFont, cw - 20);
      g.fillText(name, x + cw / 2, y + ch * 0.66);
    });
    g.textAlign = 'left';
  } else if (content.rows) {
    const n = content.rows.length;
    const rh = Math.min(58, (bottom - top) / n);
    const labelW = content.wide ? 0 : 230;
    content.rows.forEach(([label, value], k) => {
      const y = top + k * rh + rh * 0.68;
      if (k > 0) {
        g.fillStyle = st.chipBg;
        g.fillRect(pad, top + k * rh, w - pad * 2, 2);
      }
      if (content.wide) {
        // Projects: title on the left, tech on the right
        g.fillStyle = st.text;
        fit(g, label, '700', 32, st.bodyFont, (w - pad * 2) * 0.58);
        g.fillText(label, pad, y);
        g.fillStyle = st.muted;
        g.textAlign = 'right';
        fit(g, value, '600', 26, st.bodyFont, (w - pad * 2) * 0.4);
        g.fillText(value, w - pad, y);
        g.textAlign = 'left';
      } else {
        g.fillStyle = st.label;
        fit(g, up(label), '700', 26, st.bodyFont, labelW - 20);
        g.fillText(up(label), pad, y);
        g.fillStyle = st.text;
        fit(g, value, '600', 32, st.bodyFont, w - pad * 2 - labelW);
        g.fillText(value, pad + labelW, y);
      }
    });
  }
  if (content.footer) {
    g.fillStyle = st.muted;
    g.textAlign = 'center';
    fit(g, up(content.footer), '600', 28, st.bodyFont, w - pad * 2);
    g.fillText(up(content.footer), w / 2, h - 44);
  }

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Splits text into at most `max` lines that fit the width
function wrap(g, text, maxWidth, max) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (g.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, max);
}

// The projects cart's notice board: one pinned card per project, with its title and main tech
function paintProjectCards(theme) {
  const st = STYLES[theme];
  const w = 768;
  const h = 486;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = theme === 'medieval' ? '#5a3d26' : theme === 'space' ? '#0b1424' : '#2a1a40';
  g.fillRect(0, 0, w, h);
  const list = projects.slice(0, 4);
  const gap = 22;
  const cw = (w - gap * 3) / 2;
  const ch = (h - gap * 3) / 2;
  list.forEach((p, k) => {
    const x = gap + (k % 2) * (cw + gap);
    const y = gap + Math.floor(k / 2) * (ch + gap);
    g.save();
    g.translate(x + cw / 2, y + ch / 2);
    g.rotate((k % 2 ? 1 : -1) * 0.025);
    g.translate(-cw / 2, -ch / 2);
    if (theme === 'vice') {
      const grad = g.createLinearGradient(0, 0, cw, ch);
      grad.addColorStop(0, p.palette?.[0] ?? '#ff2d95');
      grad.addColorStop(1, p.palette?.[1] ?? '#2de2ff');
      g.fillStyle = grad;
    } else g.fillStyle = theme === 'medieval' ? '#efe0bb' : '#101a2c';
    g.fillRect(0, 0, cw, ch);
    if (theme === 'space') {
      g.strokeStyle = st.border;
      g.lineWidth = 4;
      g.strokeRect(2, 2, cw - 4, ch - 4);
    }
    // pin
    g.fillStyle = theme === 'medieval' ? '#7a1d14' : theme === 'space' ? '#ffd100' : '#ffffff';
    g.beginPath();
    g.arc(cw / 2, 14, 8, 0, Math.PI * 2);
    g.fill();
    const ink = theme === 'medieval' ? '#2e1d0e' : '#ffffff';
    g.fillStyle = ink;
    g.textAlign = 'left';
    g.font = `700 34px ${st.bodyFont}`;
    const lines = wrap(g, p.title, cw - 36, 2);
    lines.forEach((ln, i) => g.fillText(ln, 18, 66 + i * 38));
    g.fillStyle = theme === 'medieval' ? '#7a1d14' : theme === 'space' ? '#4da3ff' : 'rgba(255, 255, 255, 0.85)';
    fit(g, p.tech.slice(0, 2).join(' · '), '600', 24, st.bodyFont, cw - 36);
    g.fillText(p.tech.slice(0, 2).join(' · '), 18, ch - 22);
    g.restore();
  });
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Paints a canvas texture once the theme's fonts are ready, and frees it when it's no longer used
function useBoardTexture(theme, key, paint) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    let live = true;
    let made = null;
    const st = STYLES[theme];
    Promise.all((st?.load ?? []).map((f) => document.fonts.load(f)))
      .catch(() => {})
      .then(() => {
        if (!live) return;
        made = paint();
        setTex(made);
      });
    return () => {
      live = false;
      made?.dispose();
    };
    // paint is a new function each render; what it draws depends only on theme and key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, key]);
  return tex;
}

export function ProjectCards({ theme, position, size }) {
  const tex = useBoardTexture(theme, 'projects', () => paintProjectCards(theme));
  if (!tex) return null;
  return (
    <mesh position={position} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} color={[0.95, 0.95, 0.95]} toneMapped={false} />
    </mesh>
  );
}

export default function ContentBoard({ theme, id, position, size }) {
  const tex = useBoardTexture(theme, id, () => paintBoard(theme, id));
  if (!tex) return null;
  const b = STYLES[theme].bright;
  return (
    <mesh position={position} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={tex} color={[b, b, b]} toneMapped={false} />
    </mesh>
  );
}
