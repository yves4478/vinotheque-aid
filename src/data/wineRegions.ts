export interface WineRegion {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
  grapes: string[];
  characteristics: string[];
  color: string; // for map marker
}

export const wineRegions: WineRegion[] = [
  // France
  { id: "bordeaux", name: "Bordeaux", country: "Frankreich", coordinates: [-0.57, 44.84], grapes: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc"], characteristics: ["Tanninreich", "Komplex", "Lagerfähig"], color: "hsl(352, 55%, 32%)" },
  { id: "burgund", name: "Burgund", country: "Frankreich", coordinates: [4.85, 47.05], grapes: ["Pinot Noir", "Chardonnay"], characteristics: ["Elegant", "Mineralisch", "Terroir-betont"], color: "hsl(352, 55%, 32%)" },
  { id: "champagne", name: "Champagne", country: "Frankreich", coordinates: [3.95, 49.05], grapes: ["Chardonnay", "Pinot Noir", "Pinot Meunier"], characteristics: ["Perlend", "Frisch", "Hefeig"], color: "hsl(43, 55%, 54%)" },
  { id: "rhone", name: "Rhône", country: "Frankreich", coordinates: [4.8, 44.1], grapes: ["Syrah", "Grenache", "Mourvèdre"], characteristics: ["Würzig", "Kraftvoll", "Dunkelfruchtig"], color: "hsl(352, 55%, 32%)" },
  { id: "loire", name: "Loire", country: "Frankreich", coordinates: [0.7, 47.4], grapes: ["Sauvignon Blanc", "Chenin Blanc", "Cabernet Franc"], characteristics: ["Frisch", "Mineralisch", "Vielseitig"], color: "hsl(43, 55%, 54%)" },
  { id: "elsass", name: "Elsass", country: "Frankreich", coordinates: [7.35, 48.2], grapes: ["Riesling", "Gewürztraminer", "Pinot Gris"], characteristics: ["Aromatisch", "Trocken bis süss", "Blumig"], color: "hsl(43, 55%, 54%)" },

  // Italy
  { id: "piemont", name: "Piemont", country: "Italien", coordinates: [8.0, 44.7], grapes: ["Nebbiolo", "Barbera", "Dolcetto"], characteristics: ["Tanninreich", "Teer", "Rosenblätter"], color: "hsl(352, 55%, 32%)" },
  { id: "toskana", name: "Toskana", country: "Italien", coordinates: [11.25, 43.35], grapes: ["Sangiovese", "Cabernet Sauvignon"], characteristics: ["Kirsche", "Kräuter", "Elegant"], color: "hsl(352, 55%, 32%)" },
  { id: "venetien", name: "Venetien", country: "Italien", coordinates: [11.5, 45.6], grapes: ["Corvina", "Glera", "Garganega"], characteristics: ["Fruchtig", "Vielseitig"], color: "hsl(350, 40%, 55%)" },
  { id: "lombardei", name: "Lombardei", country: "Italien", coordinates: [9.9, 45.5], grapes: ["Chardonnay", "Pinot Noir", "Nebbiolo"], characteristics: ["Elegant", "Perlend", "Feinfruchtig"], color: "hsl(43, 55%, 54%)" },
  { id: "sizilien", name: "Sizilien", country: "Italien", coordinates: [14.0, 37.5], grapes: ["Nero d'Avola", "Nerello Mascalese", "Grillo"], characteristics: ["Vulkanisch", "Intensiv", "Würzig"], color: "hsl(352, 55%, 32%)" },

  // Spain
  { id: "rioja", name: "Rioja", country: "Spanien", coordinates: [-2.5, 42.45], grapes: ["Tempranillo", "Garnacha", "Graciano"], characteristics: ["Vanille", "Eiche", "Reif"], color: "hsl(352, 55%, 32%)" },
  { id: "priorat", name: "Priorat", country: "Spanien", coordinates: [0.75, 41.2], grapes: ["Garnacha", "Cariñena"], characteristics: ["Konzentriert", "Mineralisch", "Schiefer"], color: "hsl(352, 55%, 32%)" },

  // Germany
  { id: "mosel", name: "Mosel", country: "Deutschland", coordinates: [7.1, 49.9], grapes: ["Riesling"], characteristics: ["Schiefer", "Filigran", "Restsüss"], color: "hsl(43, 55%, 54%)" },
  { id: "rheingau", name: "Rheingau", country: "Deutschland", coordinates: [8.0, 50.0], grapes: ["Riesling", "Spätburgunder"], characteristics: ["Mineralisch", "Elegant", "Klassisch"], color: "hsl(43, 55%, 54%)" },
  { id: "pfalz", name: "Pfalz", country: "Deutschland", coordinates: [8.15, 49.3], grapes: ["Riesling", "Dornfelder", "Spätburgunder"], characteristics: ["Warm", "Fruchtig", "Vielseitig"], color: "hsl(43, 55%, 54%)" },

  // Austria
  { id: "wachau", name: "Wachau", country: "Österreich", coordinates: [15.4, 48.35], grapes: ["Grüner Veltliner", "Riesling"], characteristics: ["Mineralisch", "Pfeffrig", "Kraftvoll"], color: "hsl(43, 55%, 54%)" },
  { id: "burgenland", name: "Burgenland", country: "Österreich", coordinates: [16.5, 47.5], grapes: ["Blaufränkisch", "Zweigelt", "St. Laurent"], characteristics: ["Dunkelfruchtig", "Samtig", "Würzig"], color: "hsl(352, 55%, 32%)" },

  // Other
  { id: "napa", name: "Napa Valley", country: "USA", coordinates: [-122.3, 38.5], grapes: ["Cabernet Sauvignon", "Chardonnay", "Merlot"], characteristics: ["Opulent", "Eiche", "Reife Frucht"], color: "hsl(352, 55%, 32%)" },
  { id: "mendoza", name: "Mendoza", country: "Argentinien", coordinates: [-68.85, -32.9], grapes: ["Malbec", "Bonarda", "Torrontés"], characteristics: ["Kraftvoll", "Pflaume", "Würzig"], color: "hsl(352, 55%, 32%)" },
  { id: "stellenbosch", name: "Stellenbosch", country: "Südafrika", coordinates: [18.86, -33.93], grapes: ["Pinotage", "Chenin Blanc", "Cabernet Sauvignon"], characteristics: ["Vielfältig", "Rauchig", "Fruchtig"], color: "hsl(352, 55%, 32%)" },
  { id: "barossa", name: "Barossa Valley", country: "Australien", coordinates: [138.95, -34.55], grapes: ["Shiraz", "Grenache", "Riesling"], characteristics: ["Kraftvoll", "Schokolade", "Pfeffer"], color: "hsl(352, 55%, 32%)" },
];

export function matchWineToRegion(wineRegion: string): WineRegion | undefined {
  const lower = wineRegion.toLowerCase();
  return wineRegions.find(r => r.name.toLowerCase() === lower || r.id === lower);
}
