import Atmosphere, { prepare } from '../Atmosphere.jsx';
import Starfield from './Starfield.jsx';
import { PlayerShip, TrafficShip } from './Dropship.jsx';
import { SpaceTermini } from './Termini.jsx';
import PitStops from './PitStops.jsx';

// Deep space the whole way, with the nebula shifting along the tour: blue, violet, a burning red front,
// a toxic green front, then back to blue at Contact
const SPACE_SKY = {
  keys: prepare([
    { at: 0, top: '#04060f', mid: '#4a6ad0', bottom: '#cfe0ff', fog: '#1a2650', sun: 0.18, light: 2.1, hemi: 1.35, win: 1.0, stars: 1 },
    { at: 1.5, top: '#06040f', mid: '#8a50d0', bottom: '#f0d8ff', fog: '#2a1a4a', sun: 0.12, light: 1.9, hemi: 1.3, win: 1.2, stars: 1 },
    { at: 2.6, top: '#0a0406', mid: '#d0603a', bottom: '#ffd0b0', fog: '#3a1812', sun: 0.06, light: 1.8, hemi: 1.25, win: 1.4, stars: 1 },
    { at: 4.2, top: '#030a0c', mid: '#3ab09a', bottom: '#d8fff0', fog: '#0e2a28', sun: 0.1, light: 1.85, hemi: 1.3, win: 1.3, stars: 1 },
    { at: 5, top: '#04060f', mid: '#5a74d8', bottom: '#fff0c8', fog: '#1a2246', sun: 0.2, light: 2.1, hemi: 1.35, win: 1.0, stars: 1 },
  ]),
  fog: ['#1a2650', 160, 950],
  hemi: ['#b8c8ff', '#1a1430'],
  ambient: ['#8090c0', 0.62],
  halo: '#9ab8ff',
  sun: { stripes: 0, low: [0.8, 0.9, 1.0], high: [1.0, 1.0, 1.0], boost: 1.7, scale: 55 },
  moon: false,
  starSize: 2,
};

function Scenery({ glow, stops }) {
  return (
    <>
      <Atmosphere glow={glow} sky={SPACE_SKY} />
      <Starfield glow={glow} stops={stops} />
      <SpaceTermini />
      <PitStops theme="space" />
    </>
  );
}

export const kit = {
  Scenery,
  Vehicle: PlayerShip,
  TrafficModel: TrafficShip,
  traffic: [
    { hull: '#8a8f99', accent: '#4da3ff', thruster: [0.6, 1.6, 4], cockpit: '#1a3a6a' },
    { hull: '#3a3f4a', accent: '#ff4a3a', thruster: [4, 0.8, 0.3], cockpit: '#4a1a14' },
    { hull: '#c8ccd2', accent: '#ffd100', thruster: [0.6, 1.6, 4], cockpit: '#1a3a6a' },
    { hull: '#4a5a3a', accent: '#9aff5a', thruster: [1, 3.5, 1.2], cockpit: '#1a3a24' },
    { hull: '#5a4a6a', accent: '#c87aff', thruster: [2.4, 1, 4], cockpit: '#2a1a4a' },
  ],
  trafficSpeed: 1.25,
  // Ships are quicker and nimbler than the car
  handling: { top: 50, accel: 26, reverse: 14, steer: 2.2 },
  marker: { column: [0.45, 1.3, 3.4], ring: [0.55, 1.5, 3.6] },
  bloom: { intensity: 1.2, threshold: 0.85 },
};
