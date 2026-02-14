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
  { id: "provence", name: "Provence", country: "Frankreich", coordinates: [5.9, 43.5], grapes: ["Grenache", "Cinsault", "Mourvèdre"], characteristics: ["Rosé-Spezialist", "Fruchtig", "Trocken"], color: "hsl(350, 40%, 55%)" },
  { id: "languedoc", name: "Languedoc-Roussillon", country: "Frankreich", coordinates: [3.0, 43.3], grapes: ["Grenache", "Syrah", "Carignan"], characteristics: ["Sonnig", "Würzig", "Preiswert"], color: "hsl(352, 55%, 32%)" },

  // Italy
  { id: "piemont", name: "Piemont", country: "Italien", coordinates: [8.0, 44.7], grapes: ["Nebbiolo", "Barbera", "Dolcetto"], characteristics: ["Tanninreich", "Teer", "Rosenblätter"], color: "hsl(352, 55%, 32%)" },
  { id: "toskana", name: "Toskana", country: "Italien", coordinates: [11.25, 43.35], grapes: ["Sangiovese", "Cabernet Sauvignon"], characteristics: ["Kirsche", "Kräuter", "Elegant"], color: "hsl(352, 55%, 32%)" },
  { id: "venetien", name: "Venetien", country: "Italien", coordinates: [11.5, 45.6], grapes: ["Corvina", "Glera", "Garganega"], characteristics: ["Fruchtig", "Vielseitig"], color: "hsl(350, 40%, 55%)" },
  { id: "lombardei", name: "Lombardei", country: "Italien", coordinates: [9.9, 45.5], grapes: ["Chardonnay", "Pinot Noir", "Nebbiolo"], characteristics: ["Elegant", "Perlend", "Feinfruchtig"], color: "hsl(43, 55%, 54%)" },
  { id: "sizilien", name: "Sizilien", country: "Italien", coordinates: [14.0, 37.5], grapes: ["Nero d'Avola", "Nerello Mascalese", "Grillo"], characteristics: ["Vulkanisch", "Intensiv", "Würzig"], color: "hsl(352, 55%, 32%)" },
  { id: "suedtirol", name: "Südtirol", country: "Italien", coordinates: [11.35, 46.7], grapes: ["Gewürztraminer", "Lagrein", "Vernatsch"], characteristics: ["Alpin", "Frisch", "Aromatisch"], color: "hsl(43, 55%, 54%)" },

  // Spain
  { id: "rioja", name: "Rioja", country: "Spanien", coordinates: [-2.5, 42.45], grapes: ["Tempranillo", "Garnacha", "Graciano"], characteristics: ["Vanille", "Eiche", "Reif"], color: "hsl(352, 55%, 32%)" },
  { id: "priorat", name: "Priorat", country: "Spanien", coordinates: [0.75, 41.2], grapes: ["Garnacha", "Cariñena"], characteristics: ["Konzentriert", "Mineralisch", "Schiefer"], color: "hsl(352, 55%, 32%)" },
  { id: "ribera", name: "Ribera del Duero", country: "Spanien", coordinates: [-3.7, 41.6], grapes: ["Tempranillo"], characteristics: ["Kraftvoll", "Lagerfähig", "Dunkelfruchtig"], color: "hsl(352, 55%, 32%)" },
  { id: "jerez", name: "Jerez", country: "Spanien", coordinates: [-6.13, 36.68], grapes: ["Palomino", "Pedro Ximénez", "Moscatel"], characteristics: ["Sherry", "Oxidativ", "Nussig"], color: "hsl(43, 55%, 54%)" },

  // Portugal
  { id: "douro", name: "Douro", country: "Portugal", coordinates: [-7.8, 41.15], grapes: ["Touriga Nacional", "Tinta Roriz", "Touriga Franca"], characteristics: ["Port", "Konzentriert", "Terrassen"], color: "hsl(352, 55%, 32%)" },
  { id: "alentejo", name: "Alentejo", country: "Portugal", coordinates: [-7.9, 38.6], grapes: ["Aragonez", "Trincadeira", "Antão Vaz"], characteristics: ["Warm", "Fruchtig", "Vollmundig"], color: "hsl(352, 55%, 32%)" },

  // Germany
  { id: "mosel", name: "Mosel", country: "Deutschland", coordinates: [7.1, 49.9], grapes: ["Riesling"], characteristics: ["Schiefer", "Filigran", "Restsüss"], color: "hsl(43, 55%, 54%)" },
  { id: "rheingau", name: "Rheingau", country: "Deutschland", coordinates: [8.0, 50.0], grapes: ["Riesling", "Spätburgunder"], characteristics: ["Mineralisch", "Elegant", "Klassisch"], color: "hsl(43, 55%, 54%)" },
  { id: "pfalz", name: "Pfalz", country: "Deutschland", coordinates: [8.15, 49.3], grapes: ["Riesling", "Dornfelder", "Spätburgunder"], characteristics: ["Warm", "Fruchtig", "Vielseitig"], color: "hsl(43, 55%, 54%)" },
  { id: "baden", name: "Baden", country: "Deutschland", coordinates: [7.85, 48.0], grapes: ["Spätburgunder", "Grauburgunder", "Müller-Thurgau"], characteristics: ["Warm", "Vollmundig", "Burgundisch"], color: "hsl(352, 55%, 32%)" },

  // Austria
  { id: "wachau", name: "Wachau", country: "Österreich", coordinates: [15.4, 48.35], grapes: ["Grüner Veltliner", "Riesling"], characteristics: ["Mineralisch", "Pfeffrig", "Kraftvoll"], color: "hsl(43, 55%, 54%)" },
  { id: "burgenland", name: "Burgenland", country: "Österreich", coordinates: [16.5, 47.5], grapes: ["Blaufränkisch", "Zweigelt", "St. Laurent"], characteristics: ["Dunkelfruchtig", "Samtig", "Würzig"], color: "hsl(352, 55%, 32%)" },
  { id: "steiermark", name: "Steiermark", country: "Österreich", coordinates: [15.45, 46.9], grapes: ["Sauvignon Blanc", "Welschriesling", "Muskateller"], characteristics: ["Steil", "Frisch", "Aromatisch"], color: "hsl(43, 55%, 54%)" },

  // Switzerland
  { id: "wallis", name: "Wallis", country: "Schweiz", coordinates: [7.6, 46.3], grapes: ["Pinot Noir", "Chasselas", "Petite Arvine"], characteristics: ["Alpin", "Trocken", "Mineralisch"], color: "hsl(352, 55%, 32%)" },
  { id: "waadt", name: "Waadt (Lavaux)", country: "Schweiz", coordinates: [6.75, 46.5], grapes: ["Chasselas", "Pinot Noir"], characteristics: ["Terrassiert", "Elegant", "Seenah"], color: "hsl(43, 55%, 54%)" },

  // Greece
  { id: "santorini", name: "Santorini", country: "Griechenland", coordinates: [25.43, 36.4], grapes: ["Assyrtiko", "Athiri", "Aidani"], characteristics: ["Vulkanisch", "Salzig", "Mineralisch"], color: "hsl(43, 55%, 54%)" },
  { id: "naoussa", name: "Naoussa", country: "Griechenland", coordinates: [22.07, 40.63], grapes: ["Xinomavro"], characteristics: ["Tanninreich", "Komplex", "Nebbiolo-ähnlich"], color: "hsl(352, 55%, 32%)" },

  // Hungary
  { id: "tokaj", name: "Tokaj", country: "Ungarn", coordinates: [21.4, 48.12], grapes: ["Furmint", "Hárslevelű"], characteristics: ["Süsswein", "Edelfäule", "Honigartig"], color: "hsl(43, 55%, 54%)" },

  // USA
  { id: "napa", name: "Napa Valley", country: "USA", coordinates: [-122.3, 38.5], grapes: ["Cabernet Sauvignon", "Chardonnay", "Merlot"], characteristics: ["Opulent", "Eiche", "Reife Frucht"], color: "hsl(352, 55%, 32%)" },
  { id: "sonoma", name: "Sonoma", country: "USA", coordinates: [-122.7, 38.3], grapes: ["Pinot Noir", "Chardonnay", "Zinfandel"], characteristics: ["Kühl-klimatisch", "Elegant", "Vielseitig"], color: "hsl(352, 55%, 32%)" },
  { id: "willamette", name: "Willamette Valley", country: "USA", coordinates: [-123.1, 45.0], grapes: ["Pinot Noir", "Pinot Gris", "Chardonnay"], characteristics: ["Kühl", "Burgundisch", "Filigran"], color: "hsl(352, 55%, 32%)" },

  // South America
  { id: "mendoza", name: "Mendoza", country: "Argentinien", coordinates: [-68.85, -32.9], grapes: ["Malbec", "Bonarda", "Torrontés"], characteristics: ["Kraftvoll", "Pflaume", "Würzig"], color: "hsl(352, 55%, 32%)" },
  { id: "maipo", name: "Maipo Valley", country: "Chile", coordinates: [-70.6, -33.5], grapes: ["Cabernet Sauvignon", "Carménère", "Merlot"], characteristics: ["Elegant", "Kräuter", "Mineralisch"], color: "hsl(352, 55%, 32%)" },
  { id: "colchagua", name: "Colchagua", country: "Chile", coordinates: [-71.2, -34.65], grapes: ["Carménère", "Syrah", "Cabernet Sauvignon"], characteristics: ["Warm", "Schokolade", "Gewürze"], color: "hsl(352, 55%, 32%)" },
  { id: "casablanca", name: "Casablanca Valley", country: "Chile", coordinates: [-71.4, -33.3], grapes: ["Sauvignon Blanc", "Chardonnay", "Pinot Noir"], characteristics: ["Kühl", "Küstennah", "Frisch"], color: "hsl(43, 55%, 54%)" },

  // South Africa
  { id: "stellenbosch", name: "Stellenbosch", country: "Südafrika", coordinates: [18.86, -33.93], grapes: ["Pinotage", "Chenin Blanc", "Cabernet Sauvignon"], characteristics: ["Vielfältig", "Rauchig", "Fruchtig"], color: "hsl(352, 55%, 32%)" },
  { id: "swartland", name: "Swartland", country: "Südafrika", coordinates: [18.7, -33.35], grapes: ["Syrah", "Chenin Blanc", "Grenache"], characteristics: ["Natürlich", "Trocken", "Alte Reben"], color: "hsl(352, 55%, 32%)" },

  // Australia
  { id: "barossa", name: "Barossa Valley", country: "Australien", coordinates: [138.95, -34.55], grapes: ["Shiraz", "Grenache", "Riesling"], characteristics: ["Kraftvoll", "Schokolade", "Pfeffer"], color: "hsl(352, 55%, 32%)" },
  { id: "mclaren", name: "McLaren Vale", country: "Australien", coordinates: [138.55, -35.22], grapes: ["Shiraz", "Grenache", "Cabernet Sauvignon"], characteristics: ["Mediterran", "Reife Frucht", "Samtig"], color: "hsl(352, 55%, 32%)" },
  { id: "margaret", name: "Margaret River", country: "Australien", coordinates: [115.0, -33.95], grapes: ["Cabernet Sauvignon", "Chardonnay", "Sauvignon Blanc"], characteristics: ["Maritim", "Elegant", "Bordeaux-Stil"], color: "hsl(352, 55%, 32%)" },
  { id: "yarra", name: "Yarra Valley", country: "Australien", coordinates: [145.5, -37.75], grapes: ["Pinot Noir", "Chardonnay", "Shiraz"], characteristics: ["Kühl-klimatisch", "Filigran", "Elegant"], color: "hsl(352, 55%, 32%)" },

  // New Zealand
  { id: "marlborough", name: "Marlborough", country: "Neuseeland", coordinates: [173.95, -41.5], grapes: ["Sauvignon Blanc", "Pinot Noir", "Chardonnay"], characteristics: ["Stachelbeere", "Frisch", "Aromatisch"], color: "hsl(43, 55%, 54%)" },
  { id: "centralotago", name: "Central Otago", country: "Neuseeland", coordinates: [169.3, -45.0], grapes: ["Pinot Noir"], characteristics: ["Südlichste Weinregion", "Kühl", "Intensiv"], color: "hsl(352, 55%, 32%)" },
  { id: "hawkesbay", name: "Hawke's Bay", country: "Neuseeland", coordinates: [176.85, -39.5], grapes: ["Syrah", "Chardonnay", "Cabernet Sauvignon"], characteristics: ["Warm", "Bordeaux-Blends", "Elegant"], color: "hsl(352, 55%, 32%)" },

  // Lebanon
  { id: "bekaa", name: "Bekaa-Tal", country: "Libanon", coordinates: [35.9, 33.85], grapes: ["Cabernet Sauvignon", "Cinsault", "Obaideh"], characteristics: ["Antik", "Würzig", "Sonnig"], color: "hsl(352, 55%, 32%)" },

  // Georgia
  { id: "kakheti", name: "Kachetien", country: "Georgien", coordinates: [45.5, 41.65], grapes: ["Saperavi", "Rkatsiteli", "Mtsvane"], characteristics: ["Qvevri-Ausbau", "Orange Wine", "Uralte Tradition"], color: "hsl(43, 55%, 54%)" },

  // China
  { id: "ningxia", name: "Ningxia", country: "China", coordinates: [106.2, 38.5], grapes: ["Cabernet Sauvignon", "Merlot", "Marselan"], characteristics: ["Wüstenklima", "Aufstrebend", "Konzentriert"], color: "hsl(352, 55%, 32%)" },

  // Japan
  { id: "yamanashi", name: "Yamanashi", country: "Japan", coordinates: [138.6, 35.66], grapes: ["Koshu", "Muscat Bailey A"], characteristics: ["Delikat", "Elegant", "Einzigartig"], color: "hsl(43, 55%, 54%)" },
];

export function matchWineToRegion(wineRegion: string): WineRegion | undefined {
  const lower = wineRegion.toLowerCase();
  return wineRegions.find(r => r.name.toLowerCase() === lower || r.id === lower);
}
