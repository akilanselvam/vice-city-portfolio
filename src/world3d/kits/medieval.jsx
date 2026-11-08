import Atmosphere, { prepare } from '../Atmosphere.jsx';
import Realm from './Realm.jsx';
import { PlayerCart, Wagon } from './HorseCart.jsx';
import { MedievalTermini } from './Termini.jsx';
import PitStops from './PitStops.jsx';

// Daylight the whole way: a golden morning over the vale, bright midday and a clear afternoon through
// town, then a warm late afternoon at Contact. No dusk or night in this theme.
const MEDIEVAL_SKY = {
  keys: prepare([
    { at: 0, top: '#6a8ab8', mid: '#e0c08a', bottom: '#ffe2b0', fog: '#c9b48e', sun: 0.16, light: 2.1, hemi: 1.3, win: 0.2, stars: 0 },
    { at: 1.5, top: '#5a86c8', mid: '#a8c4e0', bottom: '#fff4dc', fog: '#b8c4c8', sun: 0.32, light: 2.3, hemi: 1.4, win: 0.12, stars: 0 },
    { at: 2.6, top: '#5f88c0', mid: '#b8cce0', bottom: '#fff0d0', fog: '#bcc6c4', sun: 0.26, light: 2.2, hemi: 1.38, win: 0.12, stars: 0 },
    { at: 4.2, top: '#6a8ab8', mid: '#d8c8a0', bottom: '#ffe6bc', fog: '#c8bca0', sun: 0.18, light: 2.15, hemi: 1.32, win: 0.18, stars: 0 },
    { at: 5, top: '#6f86b0', mid: '#e6bc84', bottom: '#ffd9a0', fog: '#c9ae86', sun: 0.12, light: 2.05, hemi: 1.3, win: 0.25, stars: 0 },
  ]),
  fog: ['#c9b48e', 70, 600],
  hemi: ['#e8d8b8', '#3a4630'],
  ambient: ['#9aa2b4', 0.62],
  halo: '#ffcf8a',
  sun: { stripes: 0, low: [1.0, 0.72, 0.42], high: [1.0, 0.93, 0.75], boost: 1.35, scale: 95 },
  moon: false,
  starSize: 1.5,
};

function Scenery({ glow, stops }) {
  return (
    <>
      <Atmosphere glow={glow} sky={MEDIEVAL_SKY} />
      <Realm glow={glow} stops={stops} />
      <MedievalTermini />
      <PitStops theme="medieval" />
    </>
  );
}

export const kit = {
  Scenery,
  Vehicle: PlayerCart,
  TrafficModel: Wagon,
  traffic: [
    { coat: '#8a8580', mane: '#3a3632', socks: '#d8d2c6', canvas: '#d9ccb0' },
    { coat: '#2b2622', mane: '#121010', socks: '#2b2622', canvas: '#8a3a2a' },
    { coat: '#d8d2c6', mane: '#b8b0a2', socks: '#d8d2c6', canvas: '#5a6a4a' },
    { coat: '#5a3420', mane: '#1e140c', socks: '#e8e0d0', canvas: '#c9b48a' },
    { coat: '#7a5a3a', mane: '#3a2a1a', socks: '#7a5a3a', canvas: '#4a5a6e' },
  ],
  trafficSpeed: 0.75,
  // A horse is slower than a car and turns a little tighter
  handling: { top: 30, accel: 13, reverse: 8, steer: 2.0 },
  marker: { column: [1.35, 1.0, 0.55], ring: [1.5, 1.05, 0.45] },
  bloom: { intensity: 0.7, threshold: 0.92 },
};
