export const liveBuses = [
  {
    id: "bus-01",
    number: "FSD-101",
    route: "R-01",
    routeName: "Clock Tower - D Ground",
    status: "On Time",
    eta: "4 min",
    nextStop: "Katchery Bazaar",
    occupancy: "Available",
    position: [31.4215, 73.0765],
  },
  {
    id: "bus-07",
    number: "FSD-207",
    route: "R-04",
    routeName: "Sargodha Road - Jinnah Colony",
    status: "Delayed",
    eta: "11 min",
    nextStop: "General Bus Stand",
    occupancy: "Limited",
    position: [31.4145, 73.088],
  },
  {
    id: "bus-12",
    number: "FSD-312",
    route: "R-07",
    routeName: "Gulberg - Aminpur Bazaar",
    status: "Arriving",
    eta: "2 min",
    nextStop: "D Ground Market",
    occupancy: "Full",
    position: [31.4075, 73.0715],
  },
];

export const popularRoutes = [
  { number: "R-01", name: "City Centre Loop", start: "Clock Tower", end: "D Ground", stops: 14, buses: "5 active" },
  { number: "R-04", name: "Sargodha Road Link", start: "General Bus Stand", end: "Jinnah Colony", stops: 18, buses: "3 active" },
  { number: "R-07", name: "Gulberg Connector", start: "Gulberg", end: "Aminpur Bazaar", stops: 11, buses: "2 active" },
];

export const routeLine = [
  [31.425, 73.073],
  [31.4215, 73.0765],
  [31.416, 73.081],
  [31.411, 73.078],
  [31.4075, 73.0715],
];

export const stops = [
  { id: "stop-clock-tower", name: "Clock Tower", position: [31.425, 73.073] },
  { id: "stop-katchery", name: "Katchery Bazaar", position: [31.416, 73.081] },
  { id: "stop-d-ground", name: "D Ground", position: [31.4075, 73.0715] },
];
