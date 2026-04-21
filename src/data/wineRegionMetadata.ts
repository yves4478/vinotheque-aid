import type { Wine } from "./wines";

export interface CountryWineProfile {
  center: [number, number]; // [lng, lat]
  spread: number;
  grapes: string[];
  characteristics: string[];
  color: string;
  styles: Wine["type"][];
}

export interface GeneratedRegionOverride {
  id?: string;
  coordinates?: [number, number];
  grapes?: string[];
  characteristics?: string[];
  color?: string;
  styles?: Wine["type"][];
  aliases?: string[];
}

export interface WineRegionGuideEntry {
  title: string;
  ageing: string;
  drinkWindow: string;
  serve: string;
  opened: string;
}

export interface WineRegionGuide {
  title: string;
  summary: string;
  entries: WineRegionGuideEntry[];
}

function normalizeMetadataKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function buildRegionMetadataKey(country: string, region: string): string {
  return `${normalizeMetadataKey(country)}::${normalizeMetadataKey(region)}`;
}

export const countryWineProfiles: Record<string, CountryWineProfile> = {
  Frankreich: {
    center: [2.5, 46.2],
    spread: 2.1,
    grapes: ["Pinot Noir", "Chardonnay", "Cabernet Franc"],
    characteristics: ["Terroir-geprägt", "Klassisch", "Vielschichtig"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "schaumwein"],
  },
  Italien: {
    center: [12.4, 43.0],
    spread: 2.3,
    grapes: ["Sangiovese", "Nebbiolo", "Trebbiano"],
    characteristics: ["Kulinarisch", "Strukturiert", "Vielseitig"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "schaumwein", "dessert"],
  },
  Spanien: {
    center: [-3.6, 40.2],
    spread: 2.4,
    grapes: ["Tempranillo", "Garnacha", "Albariño"],
    characteristics: ["Sonnig", "Würzig", "Konzentriert"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "rosé"],
  },
  Portugal: {
    center: [-8.0, 39.5],
    spread: 1.5,
    grapes: ["Touriga Nacional", "Aragonez", "Alvarinho"],
    characteristics: ["Atlantisch", "Markant", "Traditionsreich"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "dessert"],
  },
  Deutschland: {
    center: [9.8, 50.0],
    spread: 1.6,
    grapes: ["Riesling", "Spätburgunder", "Silvaner"],
    characteristics: ["Präzise", "Mineralisch", "Kühl-klimatisch"],
    color: "hsl(43, 55%, 54%)",
    styles: ["weiss", "rot", "schaumwein"],
  },
  Österreich: {
    center: [14.2, 47.7],
    spread: 1.2,
    grapes: ["Grüner Veltliner", "Riesling", "Zweigelt"],
    characteristics: ["Frisch", "Würzig", "Präzise"],
    color: "hsl(43, 55%, 54%)",
    styles: ["weiss", "rot", "dessert"],
  },
  Schweiz: {
    center: [8.2, 46.8],
    spread: 1.0,
    grapes: ["Pinot Noir", "Chasselas", "Merlot"],
    characteristics: ["Alpin", "Präzise", "Kleinstrukturiert"],
    color: "hsl(43, 55%, 54%)",
    styles: ["rot", "weiss"],
  },
  Griechenland: {
    center: [22.8, 38.6],
    spread: 1.9,
    grapes: ["Assyrtiko", "Xinomavro", "Agiorgitiko"],
    characteristics: ["Sonnig", "Würzig", "Mineralisch"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "dessert"],
  },
  Ungarn: {
    center: [19.2, 47.2],
    spread: 1.0,
    grapes: ["Furmint", "Kékfrankos", "Hárslevelű"],
    characteristics: ["Kontinental", "Würzig", "Traditionsreich"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "dessert"],
  },
  USA: {
    center: [-120.0, 40.5],
    spread: 4.0,
    grapes: ["Cabernet Sauvignon", "Pinot Noir", "Chardonnay"],
    characteristics: ["Innovativ", "Klimageprägt", "Fruchtbetont"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "rosé", "schaumwein"],
  },
  Argentinien: {
    center: [-68.6, -34.2],
    spread: 2.6,
    grapes: ["Malbec", "Bonarda", "Torrontés"],
    characteristics: ["Hochlagen", "Kraftvoll", "Sonnig"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "rosé"],
  },
  Chile: {
    center: [-70.8, -34.6],
    spread: 2.5,
    grapes: ["Cabernet Sauvignon", "Carménère", "Sauvignon Blanc"],
    characteristics: ["Anden", "Pazifikgeprägt", "Frisch"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "schaumwein"],
  },
  Südafrika: {
    center: [19.0, -33.9],
    spread: 1.2,
    grapes: ["Pinotage", "Chenin Blanc", "Syrah"],
    characteristics: ["Kapklima", "Würzig", "Kontrastreich"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "rosé"],
  },
  Australien: {
    center: [138.8, -34.7],
    spread: 4.0,
    grapes: ["Shiraz", "Cabernet Sauvignon", "Chardonnay"],
    characteristics: ["Sonnig", "Reif", "Selbstbewusst"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "rosé", "schaumwein"],
  },
  Neuseeland: {
    center: [173.0, -41.7],
    spread: 2.8,
    grapes: ["Sauvignon Blanc", "Pinot Noir", "Chardonnay"],
    characteristics: ["Kühl", "Duftig", "Präzise"],
    color: "hsl(43, 55%, 54%)",
    styles: ["weiss", "rot", "schaumwein"],
  },
  Libanon: {
    center: [35.8, 34.0],
    spread: 0.8,
    grapes: ["Cinsault", "Cabernet Sauvignon", "Obaideh"],
    characteristics: ["Mediterran", "Sonnig", "Gewürzbetont"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss"],
  },
  Georgien: {
    center: [44.8, 42.0],
    spread: 1.0,
    grapes: ["Saperavi", "Rkatsiteli", "Mtsvane"],
    characteristics: ["Qvevri", "Historisch", "Eigenständig"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss"],
  },
  China: {
    center: [106.5, 36.0],
    spread: 4.5,
    grapes: ["Cabernet Sauvignon", "Merlot", "Marselan"],
    characteristics: ["Aufstrebend", "Kontinental", "Konzentriert"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss"],
  },
  Japan: {
    center: [138.8, 36.6],
    spread: 2.5,
    grapes: ["Koshu", "Muscat Bailey A", "Chardonnay"],
    characteristics: ["Delikat", "Fein", "Kühl-klimatisch"],
    color: "hsl(43, 55%, 54%)",
    styles: ["weiss", "rot", "schaumwein"],
  },
  Kroatien: {
    center: [16.0, 44.9],
    spread: 1.8,
    grapes: ["Malvazija Istarska", "Plavac Mali", "Graševina"],
    characteristics: ["Adriatisch", "Kräutrig", "Sonnig"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss"],
  },
  Slowenien: {
    center: [14.9, 46.1],
    spread: 0.9,
    grapes: ["Rebula", "Sauvignon Blanc", "Modra Frankinja"],
    characteristics: ["Alpin", "Frisch", "Präzise"],
    color: "hsl(43, 55%, 54%)",
    styles: ["weiss", "rot", "schaumwein"],
  },
  Rumänien: {
    center: [25.0, 45.6],
    spread: 1.6,
    grapes: ["Fetească Neagră", "Fetească Albă", "Merlot"],
    characteristics: ["Kontinental", "Fruchtig", "Vielseitig"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "dessert"],
  },
  Türkei: {
    center: [32.8, 39.0],
    spread: 2.4,
    grapes: ["Kalecik Karası", "Öküzgözü", "Narince"],
    characteristics: ["Anatolisch", "Sonnig", "Würzig"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "rosé"],
  },
  Kanada: {
    center: [-96.0, 47.5],
    spread: 8.5,
    grapes: ["Pinot Noir", "Chardonnay", "Riesling"],
    characteristics: ["Kühl", "Frisch", "Kontrastreich"],
    color: "hsl(43, 55%, 54%)",
    styles: ["weiss", "rot", "dessert", "schaumwein"],
  },
  Uruguay: {
    center: [-56.0, -33.6],
    spread: 0.9,
    grapes: ["Tannat", "Albariño", "Merlot"],
    characteristics: ["Atlantisch", "Saftig", "Würzig"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "rosé"],
  },
  Brasilien: {
    center: [-52.2, -29.2],
    spread: 1.3,
    grapes: ["Merlot", "Moscato", "Chardonnay"],
    characteristics: ["Höhenlagen", "Fruchtig", "Schaumwein-stark"],
    color: "hsl(43, 55%, 54%)",
    styles: ["weiss", "rot", "schaumwein"],
  },
  Israel: {
    center: [35.1, 31.9],
    spread: 0.9,
    grapes: ["Cabernet Sauvignon", "Syrah", "Chardonnay"],
    characteristics: ["Sonnig", "Mediterran", "Konzentriert"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss"],
  },
  Moldawien: {
    center: [28.7, 47.0],
    spread: 0.9,
    grapes: ["Rară Neagră", "Fetească Albă", "Cabernet Sauvignon"],
    characteristics: ["Kontinental", "Preiswert", "Traditionsreich"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss", "dessert"],
  },
  Bulgarien: {
    center: [25.2, 42.7],
    spread: 1.2,
    grapes: ["Mavrud", "Melnik", "Chardonnay"],
    characteristics: ["Warm", "Würzig", "Kontinental"],
    color: "hsl(352, 55%, 32%)",
    styles: ["rot", "weiss"],
  },
  England: {
    center: [-0.4, 51.0],
    spread: 0.6,
    grapes: ["Chardonnay", "Pinot Noir", "Pinot Meunier"],
    characteristics: ["Kühl", "Kreidig", "Präzise"],
    color: "hsl(43, 55%, 54%)",
    styles: ["schaumwein", "weiss", "rosé"],
  },
};

export const generatedRegionOverrides: Record<string, GeneratedRegionOverride> = {
  [buildRegionMetadataKey("Frankreich", "Jura")]: { coordinates: [5.65, 46.78], styles: ["weiss", "rot", "dessert"] },
  [buildRegionMetadataKey("Frankreich", "Savoie")]: { coordinates: [6.1, 45.58], styles: ["weiss", "rot"] },
  [buildRegionMetadataKey("Frankreich", "Korsika")]: { coordinates: [9.0, 42.15], styles: ["rot", "weiss", "rosé"] },
  [buildRegionMetadataKey("Frankreich", "Beaujolais")]: { coordinates: [4.7, 46.12], styles: ["rot", "rosé", "weiss"] },
  [buildRegionMetadataKey("Frankreich", "Südwestfrankreich")]: { coordinates: [0.6, 44.0], styles: ["rot", "weiss", "dessert"] },

  [buildRegionMetadataKey("Italien", "Sardinien")]: { coordinates: [9.0, 40.1] },
  [buildRegionMetadataKey("Italien", "Abruzzen")]: { coordinates: [13.9, 42.2] },
  [buildRegionMetadataKey("Italien", "Apulien")]: { coordinates: [16.6, 41.2] },
  [buildRegionMetadataKey("Italien", "Kampanien")]: { coordinates: [14.8, 40.9] },
  [buildRegionMetadataKey("Italien", "Emilia-Romagna")]: { coordinates: [11.0, 44.3], styles: ["rot", "weiss", "schaumwein"] },
  [buildRegionMetadataKey("Italien", "Friaul-Julisch Venetien")]: { coordinates: [13.2, 46.1] },
  [buildRegionMetadataKey("Italien", "Umbrien")]: { coordinates: [12.6, 42.9] },
  [buildRegionMetadataKey("Italien", "Marken")]: { coordinates: [13.1, 43.5] },
  [buildRegionMetadataKey("Italien", "Kalabrien")]: { coordinates: [16.5, 39.1] },
  [buildRegionMetadataKey("Italien", "Basilikata")]: { coordinates: [15.9, 40.5] },
  [buildRegionMetadataKey("Italien", "Trentino")]: { coordinates: [11.2, 46.1] },
  [buildRegionMetadataKey("Italien", "Ligurien")]: { coordinates: [9.8, 44.1] },

  [buildRegionMetadataKey("Spanien", "Rías Baixas")]: { coordinates: [-8.6, 42.4], styles: ["weiss"] },
  [buildRegionMetadataKey("Spanien", "Penedès")]: { coordinates: [1.7, 41.3], styles: ["schaumwein", "weiss", "rot"] },
  [buildRegionMetadataKey("Spanien", "Rueda")]: { coordinates: [-4.9, 41.4], styles: ["weiss"] },
  [buildRegionMetadataKey("Spanien", "Toro")]: { coordinates: [-5.4, 41.5], styles: ["rot", "rosé"] },
  [buildRegionMetadataKey("Spanien", "Navarra")]: { coordinates: [-1.65, 42.6] },
  [buildRegionMetadataKey("Spanien", "Jumilla")]: { coordinates: [-1.33, 38.5] },
  [buildRegionMetadataKey("Spanien", "Somontano")]: { coordinates: [0.1, 42.1] },
  [buildRegionMetadataKey("Spanien", "Bierzo")]: { coordinates: [-6.8, 42.6] },
  [buildRegionMetadataKey("Spanien", "La Mancha")]: { coordinates: [-3.0, 39.3] },
  [buildRegionMetadataKey("Spanien", "Calatayud")]: { coordinates: [-1.6, 41.4] },
  [buildRegionMetadataKey("Spanien", "Mallorca")]: { coordinates: [3.0, 39.7], styles: ["rot", "weiss", "rosé"] },

  [buildRegionMetadataKey("Portugal", "Dão")]: { coordinates: [-7.9, 40.6] },
  [buildRegionMetadataKey("Portugal", "Vinho Verde")]: { coordinates: [-8.3, 41.6], styles: ["weiss", "rosé", "schaumwein"] },
  [buildRegionMetadataKey("Portugal", "Bairrada")]: { coordinates: [-8.45, 40.4], styles: ["rot", "weiss", "schaumwein"] },
  [buildRegionMetadataKey("Portugal", "Lisboa")]: { coordinates: [-9.2, 39.1] },
  [buildRegionMetadataKey("Portugal", "Setúbal")]: { coordinates: [-8.8, 38.5], styles: ["dessert", "rot", "weiss"] },
  [buildRegionMetadataKey("Portugal", "Madeira")]: { coordinates: [-16.95, 32.75], styles: ["dessert", "weiss"] },
  [buildRegionMetadataKey("Portugal", "Azoren")]: { coordinates: [-28.0, 38.6], styles: ["weiss", "dessert"] },

  [buildRegionMetadataKey("Deutschland", "Rheinhessen")]: { coordinates: [8.1, 49.9] },
  [buildRegionMetadataKey("Deutschland", "Nahe")]: { coordinates: [7.7, 49.9] },
  [buildRegionMetadataKey("Deutschland", "Franken")]: { coordinates: [9.9, 49.8] },
  [buildRegionMetadataKey("Deutschland", "Württemberg")]: { coordinates: [9.3, 48.7] },
  [buildRegionMetadataKey("Deutschland", "Ahr")]: { coordinates: [7.1, 50.5], styles: ["rot"] },
  [buildRegionMetadataKey("Deutschland", "Sachsen")]: { coordinates: [13.7, 51.1] },
  [buildRegionMetadataKey("Deutschland", "Saale-Unstrut")]: { coordinates: [11.8, 51.2] },
  [buildRegionMetadataKey("Deutschland", "Mittelrhein")]: { coordinates: [7.6, 50.2] },
  [buildRegionMetadataKey("Deutschland", "Hessische Bergstrasse")]: { coordinates: [8.6, 49.7] },

  [buildRegionMetadataKey("Österreich", "Kamptal")]: { coordinates: [15.7, 48.5], styles: ["weiss", "rot"] },
  [buildRegionMetadataKey("Österreich", "Kremstal")]: { coordinates: [15.6, 48.4], styles: ["weiss", "rot"] },
  [buildRegionMetadataKey("Österreich", "Traisental")]: { coordinates: [15.7, 48.3], styles: ["weiss", "rot"] },
  [buildRegionMetadataKey("Österreich", "Wagram")]: { coordinates: [15.8, 48.4], styles: ["weiss", "rot"] },
  [buildRegionMetadataKey("Österreich", "Weinviertel")]: { coordinates: [16.5, 48.6], styles: ["weiss"] },
  [buildRegionMetadataKey("Österreich", "Wien")]: { coordinates: [16.4, 48.2], styles: ["weiss", "rot"] },
  [buildRegionMetadataKey("Österreich", "Thermenregion")]: { coordinates: [16.2, 47.9], styles: ["weiss", "rot"] },
  [buildRegionMetadataKey("Österreich", "Neusiedlersee")]: { coordinates: [16.8, 47.8], styles: ["dessert", "rot", "weiss"] },
  [buildRegionMetadataKey("Österreich", "Carnuntum")]: { coordinates: [16.8, 48.1], styles: ["rot", "weiss"] },

  [buildRegionMetadataKey("Griechenland", "Nemea")]: { coordinates: [22.66, 37.82], styles: ["rot"] },
  [buildRegionMetadataKey("Griechenland", "Kreta")]: { coordinates: [24.9, 35.2], styles: ["weiss", "rot"] },
  [buildRegionMetadataKey("Griechenland", "Makedonien")]: { coordinates: [22.9, 40.7], styles: ["rot", "weiss"] },
  [buildRegionMetadataKey("Griechenland", "Peloponnes")]: { coordinates: [22.0, 37.5], styles: ["rot", "weiss"] },
  [buildRegionMetadataKey("Griechenland", "Attika")]: { coordinates: [23.8, 38.1], styles: ["weiss", "rosé", "rot"] },

  [buildRegionMetadataKey("Ungarn", "Eger")]: { coordinates: [20.37, 47.9], styles: ["rot", "weiss"] },
  [buildRegionMetadataKey("Ungarn", "Villány")]: { coordinates: [18.45, 45.87], styles: ["rot"] },
  [buildRegionMetadataKey("Ungarn", "Szekszárd")]: { coordinates: [18.7, 46.35], styles: ["rot"] },
  [buildRegionMetadataKey("Ungarn", "Somló")]: { coordinates: [17.36, 47.13], styles: ["weiss"] },
  [buildRegionMetadataKey("Ungarn", "Balaton")]: { coordinates: [17.8, 46.8], styles: ["weiss", "rot"] },

  [buildRegionMetadataKey("USA", "Paso Robles")]: { coordinates: [-120.69, 35.63] },
  [buildRegionMetadataKey("USA", "Santa Barbara")]: { coordinates: [-120.0, 34.6] },
  [buildRegionMetadataKey("USA", "Finger Lakes")]: { coordinates: [-77.05, 42.65], styles: ["weiss", "rot", "schaumwein"] },
  [buildRegionMetadataKey("USA", "Washington State")]: { coordinates: [-120.55, 46.3] },
  [buildRegionMetadataKey("USA", "Oregon")]: { coordinates: [-120.7, 44.0] },
  [buildRegionMetadataKey("USA", "Central Coast")]: { coordinates: [-120.2, 35.4] },
  [buildRegionMetadataKey("USA", "Lodi")]: { coordinates: [-121.3, 38.1] },

  [buildRegionMetadataKey("Argentinien", "Uco Valley")]: { coordinates: [-69.2, -33.6] },
  [buildRegionMetadataKey("Argentinien", "Salta")]: { coordinates: [-65.6, -25.4] },
  [buildRegionMetadataKey("Argentinien", "Patagonien")]: { coordinates: [-68.1, -39.4] },
  [buildRegionMetadataKey("Argentinien", "San Juan")]: { coordinates: [-68.5, -31.6] },

  [buildRegionMetadataKey("Chile", "Aconcagua")]: { coordinates: [-70.7, -32.9] },
  [buildRegionMetadataKey("Chile", "Rapel Valley")]: { coordinates: [-71.0, -34.2] },
  [buildRegionMetadataKey("Chile", "Bío Bío")]: { coordinates: [-72.1, -37.5] },
  [buildRegionMetadataKey("Chile", "Leyda Valley")]: { coordinates: [-71.43, -33.63], styles: ["weiss", "rot", "schaumwein"] },
  [buildRegionMetadataKey("Chile", "Limarí Valley")]: { coordinates: [-71.3, -30.7], styles: ["weiss", "rot"] },

  [buildRegionMetadataKey("Südafrika", "Franschhoek")]: { coordinates: [19.12, -33.9] },
  [buildRegionMetadataKey("Südafrika", "Paarl")]: { coordinates: [18.96, -33.73] },
  [buildRegionMetadataKey("Südafrika", "Constantia")]: { coordinates: [18.43, -34.03], styles: ["dessert", "weiss", "rot"] },
  [buildRegionMetadataKey("Südafrika", "Walker Bay")]: { coordinates: [19.25, -34.45] },
  [buildRegionMetadataKey("Südafrika", "Elgin")]: { coordinates: [19.02, -34.13] },
  [buildRegionMetadataKey("Südafrika", "Robertson")]: { coordinates: [19.88, -33.8] },

  [buildRegionMetadataKey("Australien", "Hunter Valley")]: { coordinates: [151.1, -32.75] },
  [buildRegionMetadataKey("Australien", "Coonawarra")]: { coordinates: [140.84, -37.29] },
  [buildRegionMetadataKey("Australien", "Clare Valley")]: { coordinates: [138.61, -33.83] },
  [buildRegionMetadataKey("Australien", "Eden Valley")]: { coordinates: [139.1, -34.65] },
  [buildRegionMetadataKey("Australien", "Adelaide Hills")]: { coordinates: [138.8, -35.0] },
  [buildRegionMetadataKey("Australien", "Tasmania")]: { coordinates: [146.8, -41.7], styles: ["schaumwein", "weiss", "rot"] },

  [buildRegionMetadataKey("Neuseeland", "Martinborough")]: { coordinates: [175.45, -41.22] },
  [buildRegionMetadataKey("Neuseeland", "Gisborne")]: { coordinates: [178.0, -38.66], styles: ["weiss"] },
  [buildRegionMetadataKey("Neuseeland", "Waipara")]: { coordinates: [172.7, -43.15] },
  [buildRegionMetadataKey("Neuseeland", "Nelson")]: { coordinates: [173.2, -41.2] },

  [buildRegionMetadataKey("Libanon", "Batroun")]: { coordinates: [35.63, 34.25] },
  [buildRegionMetadataKey("Libanon", "Mount Lebanon")]: { coordinates: [35.65, 33.9] },

  [buildRegionMetadataKey("Georgien", "Kartlien")]: { coordinates: [44.7, 41.9] },
  [buildRegionMetadataKey("Georgien", "Imeretien")]: { coordinates: [42.8, 42.1] },

  [buildRegionMetadataKey("China", "Shandong")]: { coordinates: [120.4, 37.2] },
  [buildRegionMetadataKey("China", "Yunnan")]: { coordinates: [102.7, 25.6] },
  [buildRegionMetadataKey("China", "Xinjiang")]: { coordinates: [87.6, 43.8] },

  [buildRegionMetadataKey("Japan", "Nagano")]: { coordinates: [138.2, 36.5] },
  [buildRegionMetadataKey("Japan", "Hokkaido")]: { coordinates: [141.7, 43.4], styles: ["weiss", "rot", "schaumwein"] },

  [buildRegionMetadataKey("Kroatien", "Istrien")]: { coordinates: [13.8, 45.2] },
  [buildRegionMetadataKey("Kroatien", "Dalmatien")]: { coordinates: [16.5, 43.5] },
  [buildRegionMetadataKey("Kroatien", "Slawonien")]: { coordinates: [18.0, 45.5] },
  [buildRegionMetadataKey("Kroatien", "Kvarner")]: { coordinates: [14.5, 45.1] },

  [buildRegionMetadataKey("Slowenien", "Goriška Brda")]: { coordinates: [13.56, 46.0] },
  [buildRegionMetadataKey("Slowenien", "Vipava-Tal")]: { coordinates: [13.9, 45.85] },
  [buildRegionMetadataKey("Slowenien", "Štajerska")]: { coordinates: [15.9, 46.5] },

  [buildRegionMetadataKey("Rumänien", "Dealu Mare")]: { coordinates: [26.7, 45.1] },
  [buildRegionMetadataKey("Rumänien", "Moldau")]: { coordinates: [27.8, 47.2] },
  [buildRegionMetadataKey("Rumänien", "Transsylvanien")]: { coordinates: [24.7, 46.5] },
  [buildRegionMetadataKey("Rumänien", "Banat")]: { coordinates: [21.5, 45.7] },

  [buildRegionMetadataKey("Türkei", "Thrakien")]: { coordinates: [27.8, 41.0] },
  [buildRegionMetadataKey("Türkei", "Kappadokien")]: { coordinates: [34.8, 38.6] },
  [buildRegionMetadataKey("Türkei", "Ägäis")]: { coordinates: [27.1, 38.6] },

  [buildRegionMetadataKey("Kanada", "Okanagan Valley")]: { coordinates: [-119.5, 49.5] },
  [buildRegionMetadataKey("Kanada", "Niagara Peninsula")]: { coordinates: [-79.2, 43.1], styles: ["weiss", "rot", "dessert", "schaumwein"] },
  [buildRegionMetadataKey("Kanada", "Prince Edward County")]: { coordinates: [-76.95, 44.0], styles: ["weiss", "rot", "schaumwein"] },

  [buildRegionMetadataKey("Uruguay", "Canelones")]: { coordinates: [-56.3, -34.6] },
  [buildRegionMetadataKey("Uruguay", "Maldonado")]: { coordinates: [-54.95, -34.8] },
  [buildRegionMetadataKey("Uruguay", "Rivera")]: { coordinates: [-55.53, -30.9] },

  [buildRegionMetadataKey("Brasilien", "Serra Gaúcha")]: { coordinates: [-51.4, -29.2], styles: ["weiss", "rot", "schaumwein"] },
  [buildRegionMetadataKey("Brasilien", "Vale dos Vinhedos")]: { coordinates: [-51.7, -29.16], styles: ["weiss", "rot", "schaumwein"] },
  [buildRegionMetadataKey("Brasilien", "Campanha")]: { coordinates: [-54.0, -30.6], styles: ["rot", "weiss"] },

  [buildRegionMetadataKey("Israel", "Golanhöhen")]: { coordinates: [35.8, 33.1] },
  [buildRegionMetadataKey("Israel", "Galiläa")]: { coordinates: [35.4, 32.9] },
  [buildRegionMetadataKey("Israel", "Judäische Hügel")]: { coordinates: [35.0, 31.7] },

  [buildRegionMetadataKey("Moldawien", "Codru")]: { coordinates: [28.6, 47.0] },
  [buildRegionMetadataKey("Moldawien", "Valul lui Traian")]: { coordinates: [28.1, 45.7] },
  [buildRegionMetadataKey("Moldawien", "Purcari")]: { coordinates: [29.9, 46.7] },

  [buildRegionMetadataKey("Bulgarien", "Thrakien-Tal")]: { coordinates: [25.1, 42.1] },
  [buildRegionMetadataKey("Bulgarien", "Donau-Ebene")]: { coordinates: [25.5, 43.8] },
  [buildRegionMetadataKey("Bulgarien", "Struma-Tal")]: { coordinates: [23.1, 41.7] },

  [buildRegionMetadataKey("England", "Sussex")]: { coordinates: [0.3, 50.9] },
  [buildRegionMetadataKey("England", "Kent")]: { coordinates: [0.8, 51.2] },
  [buildRegionMetadataKey("England", "Hampshire")]: { coordinates: [-1.2, 51.0] },
  [buildRegionMetadataKey("England", "Surrey")]: { coordinates: [-0.5, 51.2] },
};

export const wineRegionGuides: Record<string, WineRegionGuide> = {
  douro: {
    title: "Portwein-Stile",
    summary:
      "Die IVDP unterscheidet vor allem fruchtbetonten Ruby-Ausbau und oxidativ gereiften Tawny-Ausbau. Temperatur, Trinkfenster und Haltbarkeit nach dem Öffnen unterscheiden sich deutlich.",
    entries: [
      {
        title: "Ruby / Ruby Reserve",
        ageing: "Relativ kurze Reife in grossen Behältern, damit Farbe und Frucht erhalten bleiben.",
        drinkWindow: "Jung bis mittelreif trinken; auf Primärfrucht und Kraft ausgelegt.",
        serve: "12-16 °C, ideal zu Schokolade oder leicht gekühlt solo.",
        opened: "Etwa 8-10 Tage haltbar.",
      },
      {
        title: "Late Bottled Vintage (LBV)",
        ageing: "Jahrgangsport, 4-6 Jahre im Holz, danach meist trinkfertig auf den Markt.",
        drinkWindow: "Direkt nach Kauf gut trinkbar; einzelne Versionen reifen weiter auf der Flasche.",
        serve: "12-16 °C, oft dekantieren; stark zu Käse und Schoko-Desserts.",
        opened: "Etwa 4-5 Tage haltbar.",
      },
      {
        title: "Vintage Port",
        ageing: "Nur 2-3 Jahre im Fass, danach lange Flaschenreife; reift 10-50 Jahre weiter.",
        drinkWindow: "Für lange Lagerung oder jung dekantiert bei besonderen Anlässen.",
        serve: "12-16 °C, immer mit Luft und meist nach dem Dekantieren trinken.",
        opened: "Etwa 1-2 Tage haltbar.",
      },
      {
        title: "Tawny / Tawny Reserve",
        ageing: "Oxidative Reife im Holz; Farbe wird heller, Aromen gehen Richtung Nuss und Trockenfrucht.",
        drinkWindow: "Bereits bei Abfüllung trinkfertig, keine weitere Kellerreife nötig.",
        serve: "10-14 °C, leicht gekühlt zu Nüssen, Caramel oder als After-Dinner-Port.",
        opened: "Etwa 3-4 Wochen haltbar.",
      },
      {
        title: "Tawny 10 / 20 / 30 / 40 Years",
        ageing: "Langer oxidativer Holzausbau; je älter, desto komplexer, nussiger und feiner.",
        drinkWindow: "Immer trinkfertig; ideal für gereifte Aromen statt Primärfrucht.",
        serve: "10-14 °C, leicht gekühlt; besonders stark zu Kaffee, Nüssen und feinen Desserts.",
        opened: "Etwa 1-4 Monate haltbar.",
      },
      {
        title: "Colheita",
        ageing: "Tawny aus einem einzigen Jahrgang mit langer Fassreife.",
        drinkWindow: "Trinkfertig bei Veröffentlichung; verbindet Jahrgangscharakter mit Tawny-Reife.",
        serve: "10-14 °C, leicht gekühlt; sehr gut zu Nuss- und Karamell-Desserts.",
        opened: "Etwa 1-4 Monate haltbar.",
      },
      {
        title: "White Port",
        ageing: "Je nach Stil frisch-fruchtig oder oxidativ gereift; trocken bis Lágrima.",
        drinkWindow: "Junge, frische Versionen früh trinken; gereifte White Ports sind direkt bereit.",
        serve: "6-10 °C, als Aperitif, Port Tonic oder zu salzigen Vorspeisen.",
        opened: "Je nach Stil etwa 8-20 Tage, gereifte Exemplare deutlich länger.",
      },
      {
        title: "Rosé Port",
        ageing: "Sehr kurze Maischung, ohne oxidative Reife; auf Frische und Primärfrucht gebaut.",
        drinkWindow: "Jung trinken, nicht für lange Lagerung gedacht.",
        serve: "Um 4 °C, pur auf Eis oder im Cocktail.",
        opened: "Wenige Tage bis etwa eine Woche am frischesten.",
      },
    ],
  },
};
