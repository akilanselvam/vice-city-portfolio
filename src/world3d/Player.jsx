import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { PITSTOPS, hitsBuilding, isDrivable } from '../city/generate.js';
import { headingAtLength, lengthAtStop, nearestStop, pointAtLength, stopAtLength } from '../journey/route.js';
import { MAP_POINTS } from '../city/layout.js';
import { store } from './store.js';
import { carsOverlap } from './carCollision.js';
import { stops } from '../data/portfolio.js';

const DEG = Math.PI / 180;
const LANE = 2.8;
const damp = (a, b, rate, dt) => a + (b - a) * (1 - Math.exp(-rate * dt));
const dampAngle = (a, b, rate, dt) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * (1 - Math.exp(-rate * dt));
};
const approach = (v, target, step) => (v > target ? Math.max(target, v - step) : Math.min(target, v + step));

const START = MAP_POINTS.home;
const desired = new Vector3();
const look = new Vector3();

const clear = (x, y, r) => isDrivable(x, y) && !hitsBuilding(x, y, r);
const wrapAngle = (a) => ((((a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;

// Marker lock: drive within CAPTURE of a stop and the car takes over, eases to a stop dead centre and locks
const STOP_POINTS = stops.map((st) => MAP_POINTS[st.id]);
const PIT_BY_STOP = stops.map((st) => PITSTOPS.find((q) => q.id === st.id) ?? null);
const focusPos = new Vector3();
const focusLook = new Vector3();
const CAPTURE = 14;
const CAPTURE_MAX = 34;
const LOCK_DECEL = 14; // gentle braking: faster cars get grabbed from further out
const CRAWL = 4;
const LOCK_HOLD = 0.6;

// Far captures need the marker ahead of the car and a clear straight run to it
function canCapture(c, index, distance, v) {
  if (distance < CAPTURE) return true;
  if (distance > Math.min(CAPTURE_MAX, (v * v) / (2 * LOCK_DECEL)) || v < 0) return false;
  const [tx, ty] = STOP_POINTS[index];
  if (Math.abs(wrapAngle(Math.atan2(tx - c.x, -(ty - c.y)) - c.yaw)) > Math.PI / 4) return false;
  for (let k = 1; k < 8; k++) {
    const f = k / 8;
    if (hitsBuilding(c.x + (tx - c.x) * f, c.y + (ty - c.y) * f, 1.2)) return false;
  }
  return true;
}

// One frame of the pull-in: constant deceleration that lands exactly on the marker. Returns signed speed.
function pullIn(c, dt) {
  const [tx, ty] = STOP_POINTS[c.lock];
  const dx = tx - c.x;
  const dy = ty - c.y;
  const d = Math.hypot(dx, dy);
  const speed = Math.min(Math.sqrt(2 * c.lockA * d), Math.max(Math.abs(c.v), CRAWL));
  const step = Math.min(d, speed * dt);
  // Steer toward the centre while there's room; stop turning on the final approach so it doesn't spin
  if (d > 0.8) c.yaw = dampAngle(c.yaw, Math.atan2(dx, -dy) + (c.lockDir < 0 ? Math.PI : 0), 3.5, dt);
  if (d - step < 0.03) {
    c.x = tx;
    c.y = ty;
    c.parkedAt = c.lock;
    c.lock = -1;
    c.held = 0;
    c.armed = false;
    return 0;
  }
  c.x += (dx / d) * step;
  c.y += (dy / d) * step;
  return c.lockDir * speed;
}

const DEFAULT_HANDLING = { top: 42, accel: 20, reverse: 14, steer: 1.8 };
// The tour drives at one steady, relaxed pace for every trip and every theme (free roam keeps each
// vehicle's own handling). Jumps across several sections simply take longer rather than speeding up.
const TOUR = { speed: 25.9, accel: 12.2, brake: 13 };

export default function Player({ s, ride, focus, mode, input, pose, onZone, onReady, glow, Vehicle, handling = DEFAULT_HANDLING }) {
  const camera = useThree((state) => state.camera);
  const group = useRef();
  const wheels = useRef([]);
  const st = useRef({ x: START[0], y: START[1], yaw: 0, v: 0, dir: 1, lane: LANE, L: null, tv: 0, laneVel: 0, passing: -1, passDir: 1, parkStop: -1, focus: 0, focusPit: null, zone: -1, near: -1, mode: 'tour', lock: -1, lockA: 5, lockDir: 1, parkedAt: -1, skip: -1, held: 0, armed: false, tod: 0, framing: 0, ready: false });
  const cam = useRef({ init: false, look: new Vector3() });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const c = st.current;
    let teleported = false;
    let parked = false;

    if (mode === 'tour') {
      // Scrolling only sets where to go; the vehicle drives there: ease up to the tour pace, cruise,
      // then brake to stop exactly on the mark
      const goal = lengthAtStop(s.get());
      if (c.L == null || c.mode !== 'tour') {
        c.L = goal;
        c.tv = 0;
        c.mode = 'tour';
        c.laneVel = 0;
        c.passing = -1;
        teleported = true;
      }
      const dist = goal - c.L;
      const far = Math.abs(dist);
      const brake = TOUR.brake;
      // Traffic, driven like a person would: if we're closing on a vehicle in our lane and the other lane
      // is clear, commit to overtaking it and stay out until we're well past; otherwise follow it calmly at
      // a gap. Committing (instead of re-deciding every frame) is what stops lane flicking.
      const myLane = LANE * c.dir;
      const travel = Math.sign(dist) || c.dir;
      let laneTarget = myLane;
      let cap = Infinity;
      if (far > 1) {
        if (c.passing >= 0) {
          const n = store.npcs[c.passing];
          const rel = n ? (n.L - c.L) * travel : 0;
          if (!n || n.ghost || travel !== c.passDir || rel < -11 || rel > 50) c.passing = -1;
        }
        if (c.passing < 0) {
          let lead = -1;
          let gap = Infinity;
          store.npcs.forEach((n, j) => {
            if (!n || n.L == null || n.ghost || Math.abs(n.lane - myLane) > 3.2) return;
            const ahead = (n.L - c.L) * travel;
            if (ahead > 0 && ahead < 40 && ahead < gap) {
              lead = j;
              gap = ahead;
            }
          });
          if (lead >= 0) {
            // Traffic always runs down the route (-L), so its speed along our direction of travel:
            const leadAlong = -store.npcs[lead].v * travel;
            const otherBusy = store.npcs.some(
              (o, j) => o && !o.ghost && j !== lead && o.L != null && Math.abs(o.lane + myLane) < 3.2 && Math.abs((o.L - c.L) * travel - 20) < 45,
            );
            if (!otherBusy && TOUR.speed > leadAlong + 2 && gap < 30) {
              c.passing = lead;
              c.passDir = travel;
            } else {
              cap = Math.max(0, leadAlong) + Math.max(0, (gap - 10) * 1.1);
            }
          }
        }
        if (c.passing >= 0) laneTarget = -myLane;
      }
      const want = Math.sign(dist) * Math.min(TOUR.speed, Math.sqrt(2 * brake * far), cap);
      const speedingUp = Math.sign(want) === Math.sign(c.tv) && Math.abs(want) > Math.abs(c.tv);
      c.tv = approach(c.tv, want, (speedingUp ? TOUR.accel : brake * 1.6) * dt);
      let step = c.tv * dt;
      if (Math.abs(dist) < 0.05 && Math.abs(c.tv) < 1.5) {
        step = dist;
        c.tv = 0;
      } else if (Math.sign(step) === Math.sign(dist) && Math.abs(step) > Math.abs(dist)) {
        step = dist;
        c.tv = 0;
      }
      c.L += step;
      const L = c.L;
      if (Math.abs(c.tv) > 0.5) c.dir = Math.sign(c.tv);
      // Parked at the very start: face up the road (it may have reversed in), not at the landmark behind
      if (Math.abs(c.tv) < 0.01 && L < 1) c.dir = 1;
      const h = headingAtLength(L) * DEG;
      // Reversing up the tour turns the car around into the other lane rather than driving backwards.
      // Lane changes move on a critically damped spring (eases out, eases in, no overshoot), and the
      // nose points along the actual path, so the car turns gently into the change and straightens out.
      // Slower and gentler at low speed, like pulling out after waiting
      const springK = 1.6 + 2.9 * Math.min(1, Math.abs(c.tv) / 20);
      c.laneVel = (c.laneVel ?? 0) + ((laneTarget - c.lane) * springK - (c.laneVel ?? 0) * 2 * Math.sqrt(springK)) * dt;
      c.lane += c.laneVel * dt;
      const swerve = Math.max(-0.3, Math.min(0.3, Math.atan2(c.laneVel, Math.max(9, Math.abs(c.tv))))) * c.dir;
      const targetYaw = h + (c.dir < 0 ? Math.PI : 0) + swerve;
      const [rx, ry] = pointAtLength(L);
      const nx = rx + Math.cos(h) * c.lane;
      const ny = ry + Math.sin(h) * c.lane;
      teleported = teleported || Math.hypot(nx - c.x, ny - c.y) > 25;
      c.yaw = teleported ? targetYaw : dampAngle(c.yaw, targetYaw, 7, dt);
      c.v = Math.abs(c.tv);
      c.x = nx;
      c.y = ny;
      const at = stopAtLength(L);
      c.tod = at;
      // Popups and arrival follow where the vehicle really is, not the scroll position
      if (ride && Math.abs(ride.get() - at) > 1e-4) ride.set(at);
      parked = c.v < 1 && Math.abs(at - Math.round(at)) < 0.03;
      c.parkStop = parked ? Math.round(at) : -1;
      c.zone = -1;
      c.near = -1;
      c.mode = 'tour';
    } else {
      if (c.mode !== 'free') {
        // Just entered free roam: don't grab the car at the stop it's already sitting at
        c.mode = 'free';
        c.v = 0;
        c.tv = 0;
        c.lock = -1;
        c.parkedAt = -1;
        const n = nearestStop(c.x, c.y);
        c.skip = n.distance < CAPTURE ? n.index : -1;
      }
      const inp = input.current;
      const throttleValue = Number.isFinite(inp.throttle) ? inp.throttle : (inp.up ? 1 : 0) - (inp.down ? 1 : 0);
      const steerValue = Number.isFinite(inp.steer) ? inp.steer : (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      const throttle = throttleValue;
      const steer = steerValue * 0.72;
      // Reversing during the pull-in skips this marker
      if (c.lock >= 0 && throttle < 0) {
        c.skip = c.lock;
        c.lock = -1;
      }
      // Locked in: a fresh press of accelerate or reverse drives off (a key held on arrival doesn't count)
      if (c.parkedAt >= 0) {
        c.held += dt;
        if (throttle === 0) c.armed = true;
        else if (c.armed && c.held > LOCK_HOLD) {
          c.skip = c.parkedAt;
          c.parkedAt = -1;
        }
      }
      let v = c.v;
      if (c.lock >= 0) v = pullIn(c, dt);
      else if (c.parkedAt >= 0) v = 0;
      else {
        const accelScale = 0.6;
        if (inp.brake) v = approach(v, 0, 55 * dt);
        else if (throttle > 0) v += (v < 0 ? 45 : handling.accel * accelScale) * dt;
        else if (throttle < 0) v -= (v > 0 ? 45 : handling.reverse * accelScale) * dt;
        else v = approach(v, 0, 7 * dt);
        v = Math.max(-14, Math.min(handling.top, v));
        const grip = Math.min(1, Math.abs(v) / 7) * (1 - Math.min(0.45, Math.abs(v) / 90));
        c.yaw += steer * handling.steer * grip * Math.sign(v || 1) * dt;
        const fx = Math.sin(c.yaw);
        const fy = -Math.cos(c.yaw);
        const nx = c.x + fx * v * dt;
        const ny = c.y + fy * v * dt;
        const nose = Math.sign(v || 1) * 1.9;
        // Generous radius keeps the car out of alleys too narrow for the chase camera
        const ok = (x, y) => clear(x, y, 2.1) && clear(x + fx * nose, y + fy * nose, 1.3);
        if (ok(nx, ny)) {
          c.x = nx;
          c.y = ny;
        } else if (ok(nx, c.y)) {
          c.x = nx;
          v *= 0.85;
        } else if (ok(c.x, ny)) {
          c.y = ny;
          v *= 0.85;
        } else {
          v *= -0.25;
        }
      }
      const fx = Math.sin(c.yaw);
      const fy = -Math.cos(c.yaw);

      // Traffic is solid: push out of any car we overlap, bounce, and knock that car aside
      store.npcs.forEach((npc, j) => {
        if (!npc || npc.ghost) return;
        const hit = carsOverlap(c.x, c.y, c.yaw, npc.x, npc.y, npc.yaw);
        if (!hit) return;
        const px = c.x + hit.nx * hit.depth;
        const py = c.y + hit.ny * hit.depth;
        if (clear(px, py, 1.5)) {
          c.x = px;
          c.y = py;
        }
        const closing = -(fx * v * hit.nx + fy * v * hit.ny);
        if (closing > 0.5) {
          store.impacts.push({ index: j, nx: -hit.nx, ny: -hit.ny, strength: closing });
          store.shake = Math.min(1, Math.max(store.shake, closing / 22));
          v *= -0.3;
        }
      });

      c.v = v;
      c.tod = (c.tod + dt * 0.03) % 5;

      const { index, distance } = nearestStop(c.x, c.y);
      if (c.skip >= 0 && (index !== c.skip || distance > CAPTURE_MAX + 4)) c.skip = -1;
      if (c.lock < 0 && c.parkedAt < 0 && index !== c.skip && canCapture(c, index, distance, v)) {
        const [tx, ty] = STOP_POINTS[index];
        const off = wrapAngle(Math.atan2(tx - c.x, -(ty - c.y)) - c.yaw);
        c.lock = index;
        c.lockDir = Math.abs(off) < Math.PI / 2 ? 1 : -1;
        // Brake evenly from the current speed so the car comes to rest exactly on the marker
        c.lockA = Math.max(5, (v * v) / (2 * Math.max(1, distance)));
      }
      const zone = c.lock >= 0 ? c.lock : c.parkedAt >= 0 ? c.parkedAt : distance < 9 ? index : -1;
      const near = c.parkedAt;
      parked = near >= 0;
      c.parkStop = near;
      if (zone !== c.zone || near !== c.near) {
        c.zone = zone;
        c.near = near;
        onZone(zone, near);
      }
    }
    store.tod = c.tod;
    store.player.x = c.x;
    store.player.y = c.y;
    store.player.yaw = c.yaw;
    store.neon.uCar.value.set(c.x, 0, c.y);
    store.neon.uTime.value += dt;
    store.neon.uSpeed.value = damp(store.neon.uSpeed.value, Math.min(1, Math.abs(c.v) / 22), 3, dt);

    group.current.position.set(c.x, 0, c.y);
    group.current.rotation.y = -c.yaw;
    for (const w of wheels.current) if (w) w.rotation.x -= (c.v * dt) / (w.userData.radius ?? 0.38);

    // Chase camera; when parked it rises so the car sits below the section panel.
    // Dragging the scene swings it around the vehicle (orbit); once you let go and the vehicle is
    // moving, it eases back behind. Parked, it stays where you left it.
    const o = store.orbit;
    if (!o.dragging && performance.now() - o.lastInput > 1600 && c.v > 3) {
      o.yaw = dampAngle(o.yaw, 0, 1.6, dt);
      o.pitch = damp(o.pitch, 0, 1.6, dt);
    }
    o.yaw = wrapAngle(o.yaw);
    c.framing = damp(c.framing, parked ? 1 : 0, 2.5, dt);
    const back = (10 - c.framing) * (1 - o.pitch * 0.15);
    const height = 6.2 + c.framing * 1.6 + o.pitch * 9;
    const ahead = 11 + c.framing * 3;
    // The camera's angle around the vehicle is smoothed as an angle, so swinging round (by dragging or
    // as the vehicle turns) follows a circle instead of cutting straight across over the roof
    const snap = !cam.current.init || teleported;
    const aim = c.yaw + o.yaw;
    c.camYaw = snap || c.camYaw == null ? aim : dampAngle(c.camYaw, aim, o.dragging ? 14 : 4.5, dt);
    const fx = Math.sin(c.camYaw);
    const fy = -Math.cos(c.camYaw);
    let reach = back;
    for (let k = 1; k <= 6; k++) {
      const d = (back * k) / 6;
      if (hitsBuilding(c.x - fx * d, c.y - fy * d, 1.2)) {
        reach = Math.max(2.5, (back * (k - 1)) / 6);
        break;
      }
    }
    // Something behind the car: pull in and crane up over it instead of clipping into the wall
    c.camReach = snap || c.camReach == null ? reach : damp(c.camReach, reach, 6, dt);
    c.camHeight = snap || c.camHeight == null ? height + (back - reach) * 1.5 : damp(c.camHeight, height + (back - reach) * 1.5, 4.5, dt);
    desired.set(c.x - fx * c.camReach, c.camHeight, c.y - fy * c.camReach);
    look.set(c.x + fx * ahead, 1, c.y + fy * ahead);
    // Parked at a section (not the title stop): swing round to face its pit-stop cart. The popup waits
    // for this (focus reports the stop whose cart is in view) and the camera swings back on driving off.
    const pit = c.parkStop > 0 ? PIT_BY_STOP[c.parkStop] : null;
    if (pit) c.focusPit = pit;
    c.focus = snap ? (pit ? 1 : 0) : damp(c.focus, pit ? 1 : 0, pit ? 2.2 : 3.5, dt);
    if (c.focusPit && c.focus > 0.001) {
      const q = c.focusPit;
      const e = c.focus * c.focus * (3 - 2 * c.focus);
      // From across the road and a little back, so the parked vehicle sits in the foreground
      focusPos.set(q.x + q.toRoad[0] * 12 - q.fwd[0] * 9, 4.8, q.y + q.toRoad[1] * 12 - q.fwd[1] * 9);
      focusLook.set(q.x, 2.3, q.y);
      desired.lerp(focusPos, e);
      look.lerp(focusLook, e);
    } else {
      c.focusPit = null;
    }
    store.parkStop = c.parkStop;
    const inView = pit && c.focus > 0.93 ? c.parkStop : -1;
    if (focus && focus.get() !== inView) focus.set(inView);
    camera.position.copy(desired);
    cam.current.look.copy(look);
    cam.current.init = true;
    if (store.shake > 0.01) {
      const s = store.shake * 0.6;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
      camera.position.z += (Math.random() - 0.5) * s;
      store.shake *= Math.exp(-dt * 6);
    }
    camera.lookAt(cam.current.look);
    const fov = 58 + Math.min(1, Math.abs(c.v) / 40) * 12;
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = damp(camera.fov, fov, 3, dt);
      camera.updateProjectionMatrix();
    }

    const headingDeg = c.yaw / DEG;
    if (Math.abs(pose.x.get() - c.x) > 0.01 || Math.abs(pose.y.get() - c.y) > 0.01) {
      pose.x.set(c.x);
      pose.y.set(c.y);
    }
    if (Math.abs(pose.h.get() - headingDeg) > 0.05) pose.h.set(headingDeg);

    if (!c.ready) {
      c.ready = true;
      onReady();
    }
  });

  return (
    <group ref={group}>
      <Vehicle shadow={glow} wheels={wheels} />
    </group>
  );
}
