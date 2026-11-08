import { Award, Briefcase, Flag, Gamepad2, Mail, Rocket, User } from 'lucide-react';
import { store } from '../world3d/store.js';

// Same icons the city map uses for each stop
const ICONS = { home: Flag, about: User, skills: Award, projects: Rocket, experience: Briefcase, contact: Mail, freeroam: Gamepad2 };

// The floating waypoint tag above each marker. Markers.jsx moves and scales each one every frame through
// store.labels, so the outer element must stay a plain div with the 'marker-label' class.
export default function MarkerLabels({ stops }) {
  return (
    <div className="marker-labels" aria-hidden="true">
      {stops.map((st, i) => {
        const Icon = ICONS[st.id] ?? Flag;
        return (
          <div
            key={st.id}
            ref={(el) => {
              store.labels[i] = el;
            }}
            className="marker-label"
          >
            <div className="marker-tag">
              <span className="marker-icon">
                <Icon size={15} strokeWidth={2.4} />
              </span>
              <span className="marker-text">
                <span className="marker-name">{st.area}</span>
                {st.sub && <span className="marker-sub">{st.sub}</span>}
              </span>
            </div>
            <span className="marker-pin" />
          </div>
        );
      })}
    </div>
  );
}
