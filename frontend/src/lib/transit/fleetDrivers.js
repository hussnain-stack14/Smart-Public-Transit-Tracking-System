// These are references returned by the fleet API, not a complete user directory.
export function getFleetDriverReferences(buses) {
  const references = new Map();
  buses.forEach((bus) => {
    const driver = bus.driver;
    const id = driver?._id || driver;
    if (!id) return;
    if (!references.has(id)) references.set(id, { driver: typeof driver === "object" ? driver : { _id: id }, buses: [] });
    references.get(id).buses.push(bus);
  });
  return Array.from(references.values());
}
