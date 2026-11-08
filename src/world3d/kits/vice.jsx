import Atmosphere, { VICE_SKY } from '../Atmosphere.jsx';
import City from '../City.jsx';
import Roadster from '../Roadster.jsx';
import Car from '../Car.jsx';
import { ViceTermini } from './Termini.jsx';
import PitStops from './PitStops.jsx';

function Scenery({ glow, stops }) {
  return (
    <>
      <Atmosphere glow={glow} sky={VICE_SKY} />
      <City glow={glow} stops={stops} />
      <ViceTermini />
      <PitStops theme="vice" />
    </>
  );
}

export const kit = {
  Scenery,
  Vehicle: Roadster,
  TrafficModel: Car,
  traffic: [
    { paint: '#2de2ff', trim: '#ffffff' },
    { paint: '#ffd36b', trim: '#ff2d95' },
    { paint: '#ff4fa8', trim: '#2de2ff' },
    { paint: '#f3f0ff', trim: '#ff2d95' },
    { paint: '#7a4dff', trim: '#ffd36b' },
  ],
  trafficSpeed: 1,
  handling: { top: 42, accel: 20, reverse: 14, steer: 1.8 },
  marker: { column: [1.5, 1.05, 0.3], ring: [1.6, 1.1, 0.3] },
  bloom: { intensity: 1.1, threshold: 0.9 },
};
