// Each theme's 3D kit (scenery, vehicle, traffic, marker look) is its own chunk, loaded only when picked
const loaders = {
  vice: () => import('./kits/vice.jsx'),
  medieval: () => import('./kits/medieval.jsx'),
  space: () => import('./kits/space.jsx'),
};
const cache = {};

export function loadKit(id) {
  if (!cache[id]) {
    const promise = loaders[id]().then((m) => {
      // Mark it settled so React's use() reads it straight away on later renders instead of suspending
      promise.status = 'fulfilled';
      promise.value = m.kit;
      return m.kit;
    });
    cache[id] = promise;
  }
  return cache[id];
}
