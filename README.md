# Akilan Selvam — Portfolio

A drivable 3D portfolio. Scroll (or use the top bar) to tour seven pit stops: Home, About, Skills,
Projects, Experience, Contact and Free roam. Or take the wheel and free roam the map. Three themes share
one route: Neon Bay (car), Medieval (horse and cart) and Galactic (dropship).

Built with React 19, Vite, three.js / React Three Fiber and framer-motion.

## Setup

Needs Node.js 20.19+ or 22.12+ (it was built with Node 24 and npm 11). `npm install` uses
`package-lock.json`, so you get the exact same dependency versions.

## Scripts

```bash
npm install        # once
npm run dev        # dev server with hot reload
npm run lint       # oxlint
npm run build      # production build into dist/
npm run preview    # serve dist/ locally to check the production build
```

## Deploying

`dist/` is a fully static site. Routing uses the URL hash (`/#/projects`), so no server rewrites are
needed. Upload `dist/` to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3).

- Files in `dist/assets/` have content hashes in their names, so they can be cached forever
  (`Cache-Control: public, max-age=31536000, immutable`). Keep `index.html` uncached.
- If the site lives under a sub-path (for example GitHub Pages at `/<repo>/`), build with
  `npx vite build --base=/<repo>/`.
- Fonts load from Google Fonts. Only the active theme's fonts are fetched.

## Load budget (gzip)

| What | Size | When |
| --- | --- | --- |
| HTML + CSS | ~12 kB | first |
| App script (React, UI, motion) | ~137 kB | first |
| 3D engine (three.js + R3F) | ~244 kB | in parallel, preloaded from the HTML |
| 3D world + effects | ~32 kB | in parallel, preloaded |
| Theme kit + pit stops | ~25 kB | in parallel, only the active theme |

## Where things live

- `src/city/` — the map, route and generated city layout (shared by every theme)
- `src/world3d/` — the 3D scene: player, traffic, camera, markers; `kits/` holds each theme's look
- `src/stops/` — the popup for each pit stop
- `src/journey/` — HUD, radar, map, theme menu, scroll and tour logic
- `src/theme/` — theme definitions, copy and fonts
- `src/data/portfolio.js` — the portfolio content (bio, skills, projects, experience, contact)
