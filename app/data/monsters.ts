export type Monster = { id: string; name: string; element: string; rank: string; initials: string; color: string };

export const monsters: Monster[] = [
  { id: "dummee", name: "Dummee", element: "Neutral", rank: "E", initials: "DU", color: "#788295" },
  { id: "leaflet", name: "Leaflet", element: "Nature", rank: "D", initials: "LE", color: "#79e3ae" },
  { id: "wattoad", name: "Wattoad", element: "Water", rank: "C", initials: "WA", color: "#70b7ff" },
  { id: "treemo", name: "Treemo", element: "Nature", rank: "B", initials: "TR", color: "#9fd66f" },
  { id: "flamix", name: "Flamix", element: "Fire", rank: "A", initials: "FL", color: "#ff9d6c" },
  { id: "puffu", name: "Puffu", element: "Air", rank: "S", initials: "PU", color: "#caa6ff" },
];
export const filterLabels = ["Island", "Element", "Rank", "Evolution"];
