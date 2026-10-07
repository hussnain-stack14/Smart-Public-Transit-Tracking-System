const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRoadGeometry } = require('../src/services/routeGeometryService');

test('road geometry is built one ordered stop pair at a time', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const path = new URL(url).pathname.split('/').at(-1).split(';');
    const start = path[0].split(',').map(Number);
    const end = path[1].split(',').map(Number);
    return { ok: true, json: async () => ({ routes: [{ geometry: { coordinates: [start, [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], end] } }] }) };
  };
  const geometry = await buildRoadGeometry([
    { latitude: 31.4, longitude: 73.0 }, { latitude: 31.41, longitude: 73.01 }, { latitude: 31.42, longitude: 73.02 },
  ], fetchImpl);
  assert.equal(calls.length, 2);
  assert.deepEqual(geometry[0], [31.4, 73]);
  assert.deepEqual(geometry.at(-1), [31.42, 73.02]);
  assert.equal(geometry.length, 5);
});
