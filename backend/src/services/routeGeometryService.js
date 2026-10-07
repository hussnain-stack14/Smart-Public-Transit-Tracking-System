const Route = require('../models/Route');
const { getStopsForRoute } = require('./routeStopService');

const ROUTING_BASE_URL = (process.env.OSRM_ROUTING_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
const ROUTING_TIMEOUT_MS = 8000;

function validStop(stop) {
  return Number.isFinite(Number(stop?.latitude)) && Number.isFinite(Number(stop?.longitude));
}

function appendSegment(target, segment) {
  segment.forEach((point) => {
    const last = target[target.length - 1];
    if (!last || last[0] !== point[0] || last[1] !== point[1]) target.push(point);
  });
}

async function routeLeg(start, end, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTING_TIMEOUT_MS);
  try {
    const coordinates = `${Number(start.longitude)},${Number(start.latitude)};${Number(end.longitude)},${Number(end.latitude)}`;
    const response = await fetchImpl(`${ROUTING_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Routing request failed (${response.status}).`);
    const data = await response.json();
    const points = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(points) || points.length < 2) throw new Error('Routing response did not include road coordinates.');
    return points.map(([longitude, latitude]) => [Number(latitude), Number(longitude)]).filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude));
  } finally {
    clearTimeout(timeout);
  }
}

async function buildRoadGeometry(stops, fetchImpl = fetch) {
  const orderedStops = stops.filter(validStop);
  if (orderedStops.length < 2) return [];
  const positions = [];
  for (let index = 0; index < orderedStops.length - 1; index += 1) {
    appendSegment(positions, await routeLeg(orderedStops[index], orderedStops[index + 1], fetchImpl));
  }
  return positions;
}

async function refreshRouteGeometry(routeId) {
  await Route.findByIdAndUpdate(routeId, { $set: { geometryStatus: 'pending' } });
  try {
    const stops = await getStopsForRoute(routeId);
    const outbound = await buildRoadGeometry(stops);
    // Request the return trip independently: a road network can have one-way
    // streets, so simply reversing outbound coordinates would be inaccurate.
    const inbound = await buildRoadGeometry([...stops].reverse());
    if (outbound.length < 2 || inbound.length < 2) throw new Error('Insufficient road geometry.');
    await Route.findByIdAndUpdate(routeId, { $set: { geometry: { outbound, return: inbound }, geometryStatus: 'ready', geometryUpdatedAt: new Date() } });
    return { outbound, return: inbound };
  } catch (error) {
    await Route.findByIdAndUpdate(routeId, { $set: { geometry: { outbound: [], return: [] }, geometryStatus: 'unavailable', geometryUpdatedAt: new Date() } });
    throw error;
  }
}

function queueRouteGeometryRefresh(routeId) {
  if (!routeId) return;
  void refreshRouteGeometry(routeId).catch((error) => {
    console.warn(`Route geometry refresh failed for ${routeId}: ${error.message}`);
  });
}

module.exports = { buildRoadGeometry, routeLeg, refreshRouteGeometry, queueRouteGeometryRefresh };
