export function isValidPosition(position) {
  return Array.isArray(position) && position.length === 2 &&
    Number.isFinite(position[0]) && Math.abs(position[0]) <= 90 &&
    Number.isFinite(position[1]) && Math.abs(position[1]) <= 180;
}

export function getStopPosition(stop) {
  const position = [stop?.latitude, stop?.longitude];
  return isValidPosition(position) ? position : null;
}

export function getOrderedRouteStops(stops, routeId) {
  const unique = new Map();
  for (const stop of stops) {
    if (stop._id && (stop.route?._id || stop.route) === routeId) unique.set(stop._id, stop);
  }
  return [...unique.values()].sort((a, b) => {
    const first = Number.isFinite(a.stopOrder) ? a.stopOrder : Infinity;
    const second = Number.isFinite(b.stopOrder) ? b.stopOrder : Infinity;
    return first === second ? 0 : first - second;
  });
}
