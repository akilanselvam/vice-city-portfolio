// Per-frame values shared between scene parts without React re-renders
export const store = {
  tod: 0,
  windowMaterials: [],
  // Marker label elements live in the DOM overlay; the scene positions them each frame
  labels: [],
  // Car positions for collisions: the player and each traffic car, in map units
  player: { x: 0, y: 0, yaw: 0 },
  npcs: [],
  // Hits the player dealt to traffic this frame, consumed by Traffic
  impacts: [],
  shake: 0,
  // The stop the player is parked at (-1 while moving); pit-stop characters react to it
  parkStop: -1,
  // Look-around from dragging the scene: yaw (radians around the vehicle) and pitch (camera height)
  orbit: { yaw: 0, pitch: 0, dragging: false, lastInput: 0 },
  // Road neon shaders read these so the glow follows the car
  neon: {
    // A plain {x, y, z} (three.js reads vec3 uniforms from any object with x, y, z), so this module, which the
    // page shell also imports, doesn't pull the whole 3D engine into the first download
    uCar: {
      value: {
        x: 0,
        y: 0,
        z: 0,
        set(x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
          return this;
        },
      },
    },
    uTime: { value: 0 },
    uSpeed: { value: 0 },
  },
};
