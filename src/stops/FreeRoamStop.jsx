import { Eye, Gamepad2, Hand, Keyboard, LogOut, MapPin } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';

// The instructor at the last pit stop, in each theme's voice
const INSTRUCTOR = {
  vice: {
    name: 'Rico · driving instructor',
    line: "Hey, you made it to the end of the tour! Now it's your turn behind the wheel. Cruise the city any way you like and pull into any marker to revisit a section.",
  },
  medieval: {
    name: 'Old Bran · stablemaster',
    line: 'Well met, traveller. The tour is done and the reins are yours. Ride the vale as you please, and stop at any waymark to hear its tale again.',
  },
  space: {
    name: 'Sgt. Vale · flight instructor',
    line: "Diver! Guided tour's over. The stick is yours. Fly the sector your way and set down on any beacon to pull up its briefing.",
  },
};

export default function FreeRoamStop({ onFreeRoam }) {
  const { id, copy } = useTheme();
  const guide = INSTRUCTOR[id] ?? INSTRUCTOR.vice;
  const verb = copy.driveHelp;
  const Verb = verb[0].toUpperCase() + verb.slice(1);
  return (
    <div className="freeroam-stop">
      <ScreenHeader title={copy.areas.freeroam?.area ?? copy.freeOff} stop="freeroam" />
      <div className="freeroam-grid">
        <div className="speech">
          <p className="speech-name">{guide.name}</p>
          <p className="speech-line">{guide.line}</p>
        </div>
        <ul className="freeroam-how">
          <li>
            <Keyboard size={18} aria-hidden="true" />
            <span>
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd> or arrow keys to {verb}, <kbd>Space</kbd> to brake
            </span>
          </li>
          <li>
            <Hand size={18} aria-hidden="true" />
            <span>On a phone, use the on-screen pads</span>
          </li>
          <li>
            <MapPin size={18} aria-hidden="true" />
            <span>{Verb} into a glowing marker to open that section</span>
          </li>
          <li>
            <Eye size={18} aria-hidden="true" />
            <span>Drag the scene to look around</span>
          </li>
          <li>
            <LogOut size={18} aria-hidden="true" />
            <span>
              <kbd>F</kbd>, <kbd>Esc</kbd> or the top-bar button takes you back to the tour
            </span>
          </li>
        </ul>
        <button className="btn btn-primary freeroam-start" onClick={onFreeRoam}>
          <Gamepad2 size={22} aria-hidden="true" />
          Start {copy.freeOff.toLowerCase()}
        </button>
      </div>
    </div>
  );
}
