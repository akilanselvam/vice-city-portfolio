// Each theme's web fonts load on their own, so a visitor only downloads the theme they see.
// index.html loads the starting theme's set before the app runs; others load when picked
// (or when the theme menu opens, so switching is instant).
export const THEME_FONTS = {
  vice: 'family=Anton&family=Rajdhani:wght@500;600;700&family=Yellowtail',
  medieval: 'family=Cinzel:wght@500;700;900&family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Alegreya+Sans:wght@500;700',
  space: 'family=Chakra+Petch:wght@500;600;700&family=Saira+Stencil+One',
};

export function ensureThemeFonts(id) {
  if (!THEME_FONTS[id] || document.querySelector(`link[data-fonts="${id}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${THEME_FONTS[id]}&display=swap`;
  link.dataset.fonts = id;
  document.head.appendChild(link);
}
