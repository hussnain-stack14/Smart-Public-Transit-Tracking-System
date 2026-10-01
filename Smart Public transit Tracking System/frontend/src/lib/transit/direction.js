export function getBusDirection(bus) {
  return bus?.direction === "return" ? "return" : "outbound";
}

export function getStopsInDirection(stops, direction) {
  return direction === "return" ? [...stops].reverse() : stops;
}

export function getDirectionEndpoints(route, direction) {
  const outbound = direction !== "return";
  return {
    origin: outbound ? route?.startPoint : route?.endPoint,
    destination: outbound ? route?.endPoint : route?.startPoint,
  };
}

export function getDirectionLabel(route, direction) {
  const { origin, destination } = getDirectionEndpoints(route, direction);
  return origin && destination ? `${origin} → ${destination}` : "Direction unavailable";
}
