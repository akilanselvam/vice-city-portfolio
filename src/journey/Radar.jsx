import { m, useTransform } from 'framer-motion';
import MapArt from '../components/MapArt.jsx';
import { stops } from '../data/portfolio.js';
import { useTheme } from '../theme/ThemeContext.jsx';
import { MAP_POINTS, ROUTE_PATH } from './route.js';

const ROUTE_STYLE = {
  vice: { color: '#ffd36b' },
  medieval: { color: '#8a1c14', dash: '10 7' },
  space: { color: '#ffd100', dash: '14 6' },
};

export function RouteLine() {
  const { color, dash } = ROUTE_STYLE[useTheme().id] ?? ROUTE_STYLE.vice;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={ROUTE_PATH} stroke={color} strokeOpacity="0.25" strokeWidth="12" />
      <path d={ROUTE_PATH} stroke={color} strokeWidth="4" strokeDasharray={dash} />
    </g>
  );
}

// GTA-style radar: the map slides and turns under a fixed player arrow, heading always up
export default function Radar({ pose, layout, onOpen }) {
  const D = layout.radar;
  const zoom = D / 2 / 105;
  const x = useTransform(pose.x, (v) => -v * zoom);
  const y = useTransform(pose.y, (v) => -v * zoom);
  const rotate = useTransform(pose.h, (h) => -h);
  const upright = useTransform(rotate, (r) => -r);

  return (
    <m.button className="radar" style={{ width: D, height: D }} onClick={onOpen} aria-label="Open the city map">
      <m.div className="radar-rot" style={{ rotate }}>
        <m.div className="radar-map" style={{ x, y, width: 800 * zoom, height: 560 * zoom }}>
          <MapArt>
            <RouteLine />
            {stops.map((st) => {
              const [bx, by] = MAP_POINTS[st.id];
              return (
                <m.g key={st.id} style={{ rotate: upright }}>
                  <circle cx={bx} cy={by} r="14" className="blip" />
                  <text x={bx} y={by + 1} className="blip-text" textAnchor="middle" dominantBaseline="central">
                    {st.id[0].toUpperCase()}
                  </text>
                </m.g>
              );
            })}
          </MapArt>
        </m.div>
        <m.span className="radar-north" style={{ y: -(D / 2 - 13), rotate: upright }}>
          N
        </m.span>
      </m.div>
      <span className="radar-player" aria-hidden="true" />
    </m.button>
  );
}
