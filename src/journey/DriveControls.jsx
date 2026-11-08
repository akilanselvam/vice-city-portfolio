import { useRef } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';

function Joystick({ input }) {
  const padRef = useRef(null);
  const knobRef = useRef(null);

  const setStick = (clientX, clientY) => {
    const pad = padRef.current;
    const knob = knobRef.current;
    if (!pad || !knob) return;

    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const maxRadius = rect.width * 0.34;
    const deadZone = 34;
    const distance = Math.hypot(dx, dy);

    if (distance < deadZone) {
      knob.style.transform = 'translate(0px, 0px)';
      input.current.left = false;
      input.current.right = false;
      input.current.up = false;
      input.current.down = false;
      input.current.steer = 0;
      input.current.throttle = 0;
      return;
    }

    const limited = Math.min(distance, maxRadius);
    const scale = limited / distance;
    const clampedX = dx * scale;
    const clampedY = dy * scale;
    const x = (clampedX / maxRadius) * 100;
    const y = (clampedY / maxRadius) * 100;
    knob.style.transform = `translate(${x}px, ${y}px)`;

    const steerValue = Math.abs(x) > 18 ? Math.max(-1, Math.min(1, x / 100)) : 0;
    const throttleValue = Math.abs(y) > 18 ? Math.max(-1, Math.min(1, (y * -1) / 100)) : 0;

    input.current.left = steerValue < -0.18;
    input.current.right = steerValue > 0.18;
    input.current.up = throttleValue > 0.18;
    input.current.down = throttleValue < -0.18;
    input.current.steer = steerValue;
    input.current.throttle = throttleValue;
  };

  const clearStick = () => {
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
    input.current.left = false;
    input.current.right = false;
    input.current.up = false;
    input.current.down = false;
    input.current.steer = 0;
    input.current.throttle = 0;
  };

  const onPointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setStick(event.clientX, event.clientY);
  };

  const onPointerMove = (event) => {
    if (event.buttons === 0 && event.pressure === 0) return;
    setStick(event.clientX, event.clientY);
  };

  const onPointerEnd = (event) => {
    event.preventDefault();
    clearStick();
  };

  return (
    <div
      ref={padRef}
      className="drive-stick"
      aria-label="Steer and throttle stick"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerLeave={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={knobRef} className="drive-stick-knob" />
    </div>
  );
}

export default function DriveControls({ input }) {
  const { copy } = useTheme();
  const verb = copy.driveHelp;
  return (
    <div className="drive-ui">
      <p className="drive-help">
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> {verb} · <kbd>Space</kbd> brake · {verb} into a marker to lock in · <kbd>W</kbd> to {verb} off · drag to look around · <kbd>F</kbd> back to the tour
      </p>
      <div className="mobile-drive-controls">
        <Joystick input={input} />
      </div>
    </div>
  );
}
