import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Castle, Check, ChevronDown, Rocket, TreePalm } from 'lucide-react';
import { THEME_ORDER } from '../theme/themes.js';
import { themeCopy, useTheme } from '../theme/ThemeContext.jsx';
import { ensureThemeFonts } from '../theme/fonts.js';

export const THEME_ICONS = { vice: TreePalm, medieval: Castle, space: Rocket };

// One row per theme: swatch, icon, name and blurb; the active theme is ticked
export function ThemeOptions({ onPick, className = 'theme-option', role = 'menuitemradio', itemRef }) {
  const { id: active } = useTheme();
  return THEME_ORDER.map((id, i) => {
    const t = themeCopy(id);
    const Icon = THEME_ICONS[id];
    const on = id === active;
    return (
      <button
        key={id}
        ref={itemRef ? (el) => itemRef(el, i) : undefined}
        className={`${className}${on ? ' active' : ''}`}
        role={role}
        aria-checked={role === 'menuitemradio' ? on : undefined}
        aria-current={role === 'menuitemradio' ? undefined : on || undefined}
        onClick={() => onPick(id)}
      >
        <span className="theme-swatch" style={{ background: t.swatch }} aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className="theme-option-text">
          <span className="theme-option-name">{t.name}</span>
          <span className="theme-option-blurb">{t.blurb}</span>
        </span>
        {on && <Check size={18} className="theme-option-check" aria-hidden="true" />}
      </button>
    );
  });
}

// Top-bar theme picker: shows the current theme, opens a list of all three
export default function ThemeMenu({ onSwitch }) {
  const { id } = useTheme();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const items = useRef([]);
  const Icon = THEME_ICONS[id];

  useEffect(() => {
    if (!open) return;
    // Fetch the other themes' fonts as soon as someone looks at the options
    THEME_ORDER.forEach(ensureThemeFonts);
    items.current[THEME_ORDER.indexOf(id)]?.focus();
    const onDown = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        root.current?.querySelector('.theme-toggle')?.focus();
        return;
      }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const list = items.current.filter(Boolean);
      const at = list.indexOf(document.activeElement);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      list[(at + step + list.length) % list.length]?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, id]);

  const pick = (theme) => {
    setOpen(false);
    onSwitch(theme);
  };

  return (
    <div className="theme-menu" ref={root}>
      <button
        className={`btn theme-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Theme: ${themeCopy(id).name}. Choose a theme`}
        title="Choose a theme"
      >
        <Icon size={18} aria-hidden="true" />
        <span className="theme-label">{themeCopy(id).switchLabel}</span>
        <ChevronDown size={16} className="theme-chevron" aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            className="theme-popover"
            role="menu"
            aria-label="Themes"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <p className="theme-popover-title">Choose your world</p>
            <ThemeOptions
              onPick={pick}
              itemRef={(el, i) => {
                items.current[i] = el;
              }}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
