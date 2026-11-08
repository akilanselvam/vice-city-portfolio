import { useId } from 'react';
import { BRIDGES, LAND_OUTLINES, MAP_POINTS, SIDE_ROADS, outlinePath, polylinePath } from '../city/layout.js';
import { ROUTE_PATH } from '../journey/route.js';
import { useTheme } from '../theme/ThemeContext.jsx';

const LAND = LAND_OUTLINES.map(outlinePath);
// Neon city plan for Vice City, ink on parchment for medieval, a tactical scope for the galactic theme
const PALETTES = {
  vice: {
    sea: ['#1a1450', '#060518'], grid: '#2de2ff', gridOpacity: 0.08, beach: '#f5b97a', land: '#22123f',
    zones: ['#8b3dff', '#ff2d95', '#2de2ff', '#ff9a3d', '#8b3dff', '#ff2d95'], zoneOpacity: 0.16, streets: '#fff', streetOpacity: 0.07,
    coast: '#2de2ff', coastOpacity: 0.7, roads: '#ff4fb3', roadOpacity: 0.55, bridges: '#2de2ff', bridgeDash: '6 5',
  },
  medieval: {
    sea: ['#5d7378', '#2c3a3e'], grid: '#e8d9b0', gridOpacity: 0.06, beach: '#a08a5e', land: '#d8c79e',
    zones: ['#8a6a3a', '#5a7a3a', '#7a3a2a', '#8a6a3a', '#5a7a3a', '#7a3a2a'], zoneOpacity: 0.14, streets: '#5a4630', streetOpacity: 0.06,
    coast: '#4a3a26', coastOpacity: 0.85, roads: '#6e4c2c', roadOpacity: 0.75, bridges: '#4a3a26', bridgeDash: '3 3',
  },
  space: {
    sea: ['#0e1636', '#02030a'], grid: '#4da3ff', gridOpacity: 0.07, beach: '#4da3ff', land: '#1c212c',
    zones: ['#4da3ff', '#ffd100', '#ff4a3a', '#4da3ff', '#9aff5a', '#ffd100'], zoneOpacity: 0.12, streets: '#fff', streetOpacity: 0.05,
    coast: '#4da3ff', coastOpacity: 0.75, roads: '#ffd100', roadOpacity: 0.55, bridges: '#4da3ff', bridgeDash: '2 4',
  },
};
const ZONE_POINTS = Object.values(MAP_POINTS);
const STREETS = (() => {
  let d = '';
  for (let v = 24; v < 800; v += 24) d += `M${v} 0V560`;
  for (let v = 24; v < 560; v += 24) d += `M0 ${v}H800`;
  return d;
})();

function Land(props) {
  return LAND.map((d) => <path key={d} d={d} {...props} />);
}

export default function MapArt({ children }) {
  const c = PALETTES[useTheme().id] ?? PALETTES.vice;
  const uid = `ma${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const water = `${uid}-water`;
  const grid = `${uid}-grid`;
  const land = `${uid}-land`;

  return (
    <svg viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id={water} cx="50%" cy="45%" r="70%">
          <stop offset="0" stopColor={c.sea[0]} />
          <stop offset="1" stopColor={c.sea[1]} />
        </radialGradient>
        <pattern id={grid} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke={c.grid} strokeOpacity={c.gridOpacity} />
        </pattern>
        <clipPath id={land}>
          <Land />
        </clipPath>
      </defs>

      <rect width="800" height="560" fill={`url(#${water})`} />
      <rect width="800" height="560" fill={`url(#${grid})`} />
      <g fill="none" stroke={c.beach} strokeOpacity="0.3" strokeWidth="10">
        <Land />
      </g>
      <g fill={c.land}>
        <Land />
      </g>

      <g clipPath={`url(#${land})`}>
        {ZONE_POINTS.map(([cx, cy], i) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="55" fill={c.zones[i % c.zones.length]} opacity={c.zoneOpacity} />
        ))}
        <path d={STREETS} stroke={c.streets} strokeOpacity={c.streetOpacity} strokeWidth="1" />
      </g>

      <g fill="none" stroke={c.coast} strokeOpacity={c.coastOpacity} strokeWidth="1.5">
        <Land />
      </g>
      <g fill="none" stroke={c.roads} strokeOpacity={c.roadOpacity} strokeLinecap="round" strokeLinejoin="round">
        {SIDE_ROADS.map((pts) => (
          <path key={pts.join()} d={polylinePath(pts)} strokeWidth="4" />
        ))}
        <path d={ROUTE_PATH} strokeWidth="6" />
      </g>
      <g fill="none" stroke={c.bridges} strokeOpacity="0.85" strokeWidth="4" strokeDasharray={c.bridgeDash}>
        {BRIDGES.map((pts) => (
          <path key={pts.join()} d={polylinePath(pts)} />
        ))}
      </g>
      {children}
    </svg>
  );
}
