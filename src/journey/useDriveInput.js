import { useEffect, useRef } from 'react';

const KEYS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'brake',
};

// Shared input state for free-roam; keyboard here, touch pads write to the same object
export default function useDriveInput(active) {
  const input = useRef({ up: false, down: false, left: false, right: false, brake: false });

  useEffect(() => {
    const state = input.current;
    const reset = () => Object.keys(state).forEach((k) => (state[k] = false));
    if (!active) {
      reset();
      return;
    }
    const set = (value) => (e) => {
      const key = KEYS[e.code];
      if (!key || e.altKey || e.ctrlKey || e.metaKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      e.preventDefault();
      state[key] = value;
    };
    const down = set(true);
    const up = set(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', reset);
      reset();
    };
  }, [active]);

  return input;
}
