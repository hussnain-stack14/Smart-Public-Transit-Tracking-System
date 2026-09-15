export function getTransitId(item) {
  return item?._id || item?.id || item?.busId;
}

export function getRouteId(route) {
  return route?._id || route?.id || route;
}

export function getRouteName(route) {
  return route?.routeName || route?.name || "Transit route";
}

export function getBusPosition(bus) {
  if (Array.isArray(bus.position)) return bus.position;
  if (bus.currentLocation?.latitude != null && bus.currentLocation?.longitude != null) {
    return [bus.currentLocation.latitude, bus.currentLocation.longitude];
  }
  return null;
}

export function getEtaLabel(eta) {
  if (!eta || eta.etaMinutes == null) return null;
  return eta.etaMinutes <= 1 ? "Arriving" : `${Math.round(eta.etaMinutes)} min`;
}

export function normalizeBus(bus, eta, routeMap = {}) {
  const route = typeof bus.route === "object" ? bus.route : routeMap[bus.route];
  return {
    ...bus,
    id: getTransitId(bus),
    number: bus.busNumber || bus.number || "Transit bus",
    routeId: getRouteId(route),
    route: getRouteName(route),
    routeName: getRouteName(route),
    status: bus.status || "Status unavailable",
    eta: getEtaLabel(eta) || bus.eta || null,
    nextStop: eta?.nextStop?.stopName || bus.nextStop || null,
    position: getBusPosition(bus),
  };
}

export function getOccupancy(bus) {
  return bus.occupancy || null;
}
