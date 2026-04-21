/**
 * Konfigurationstabelle: Weinländer und ihre Regionen
 * Die Regionen sind abhängig vom gewählten Land.
 */

export interface CountryRegionConfig {
  country: string;
  regions: string[];
}

export const countryRegions: CountryRegionConfig[] = [
  {
    country: "Frankreich",
    regions: [
      "Bordeaux",
      "Burgund",
      "Champagne",
      "Rhône",
      "Loire",
      "Elsass",
      "Provence",
      "Languedoc-Roussillon",
      "Jura",
      "Savoie",
      "Korsika",
      "Beaujolais",
      "Südwestfrankreich",
    ],
  },
  {
    country: "Italien",
    regions: [
      "Piemont",
      "Toskana",
      "Venetien",
      "Lombardei",
      "Sizilien",
      "Südtirol",
      "Sardinien",
      "Abruzzen",
      "Apulien",
      "Kampanien",
      "Emilia-Romagna",
      "Friaul-Julisch Venetien",
      "Umbrien",
      "Marken",
      "Kalabrien",
      "Basilikata",
      "Trentino",
      "Ligurien",
    ],
  },
  {
    country: "Spanien",
    regions: [
      "Rioja",
      "Priorat",
      "Ribera del Duero",
      "Jerez",
      "Rías Baixas",
      "Penedès",
      "Rueda",
      "Toro",
      "Navarra",
      "Jumilla",
      "Somontano",
      "Bierzo",
      "La Mancha",
      "Calatayud",
      "Mallorca",
    ],
  },
  {
    country: "Portugal",
    regions: [
      "Douro",
      "Alentejo",
      "Dão",
      "Vinho Verde",
      "Bairrada",
      "Lisboa",
      "Setúbal",
      "Madeira",
      "Azoren",
    ],
  },
  {
    country: "Deutschland",
    regions: [
      "Mosel",
      "Rheingau",
      "Pfalz",
      "Baden",
      "Rheinhessen",
      "Nahe",
      "Franken",
      "Württemberg",
      "Ahr",
      "Sachsen",
      "Saale-Unstrut",
      "Mittelrhein",
      "Hessische Bergstrasse",
    ],
  },
  {
    country: "Österreich",
    regions: [
      "Wachau",
      "Burgenland",
      "Steiermark",
      "Kamptal",
      "Kremstal",
      "Traisental",
      "Wagram",
      "Weinviertel",
      "Wien",
      "Thermenregion",
      "Neusiedlersee",
      "Carnuntum",
    ],
  },
  {
    country: "Schweiz",
    regions: [
      "Wallis",
      "Waadt (Lavaux)",
      "Genf",
      "Tessin",
      "Graubünden",
      "Zürich",
      "Schaffhausen",
      "Thurgau",
      "Aargau",
      "Neuenburg",
      "Drei-Seen-Region",
    ],
  },
  {
    country: "Griechenland",
    regions: [
      "Santorini",
      "Naoussa",
      "Nemea",
      "Kreta",
      "Makedonien",
      "Peloponnes",
      "Attika",
    ],
  },
  {
    country: "Ungarn",
    regions: [
      "Tokaj",
      "Eger",
      "Villány",
      "Szekszárd",
      "Somló",
      "Balaton",
    ],
  },
  {
    country: "USA",
    regions: [
      "Napa Valley",
      "Sonoma",
      "Willamette Valley",
      "Paso Robles",
      "Santa Barbara",
      "Finger Lakes",
      "Washington State",
      "Oregon",
      "Central Coast",
      "Lodi",
    ],
  },
  {
    country: "Argentinien",
    regions: [
      "Mendoza",
      "Uco Valley",
      "Salta",
      "Patagonien",
      "San Juan",
    ],
  },
  {
    country: "Chile",
    regions: [
      "Maipo Valley",
      "Colchagua",
      "Casablanca Valley",
      "Aconcagua",
      "Rapel Valley",
      "Bío Bío",
      "Leyda Valley",
      "Limarí Valley",
    ],
  },
  {
    country: "Südafrika",
    regions: [
      "Stellenbosch",
      "Swartland",
      "Franschhoek",
      "Paarl",
      "Constantia",
      "Walker Bay",
      "Elgin",
      "Robertson",
    ],
  },
  {
    country: "Australien",
    regions: [
      "Barossa Valley",
      "McLaren Vale",
      "Margaret River",
      "Yarra Valley",
      "Hunter Valley",
      "Coonawarra",
      "Clare Valley",
      "Eden Valley",
      "Adelaide Hills",
      "Tasmania",
    ],
  },
  {
    country: "Neuseeland",
    regions: [
      "Marlborough",
      "Central Otago",
      "Hawke's Bay",
      "Martinborough",
      "Gisborne",
      "Waipara",
      "Nelson",
    ],
  },
  {
    country: "Libanon",
    regions: [
      "Bekaa-Tal",
      "Batroun",
      "Mount Lebanon",
    ],
  },
  {
    country: "Georgien",
    regions: [
      "Kachetien",
      "Kartlien",
      "Imeretien",
    ],
  },
  {
    country: "China",
    regions: [
      "Ningxia",
      "Shandong",
      "Yunnan",
      "Xinjiang",
    ],
  },
  {
    country: "Japan",
    regions: [
      "Yamanashi",
      "Nagano",
      "Hokkaido",
    ],
  },
  {
    country: "Kroatien",
    regions: [
      "Istrien",
      "Dalmatien",
      "Slawonien",
      "Kvarner",
    ],
  },
  {
    country: "Slowenien",
    regions: [
      "Goriška Brda",
      "Vipava-Tal",
      "Štajerska",
    ],
  },
  {
    country: "Rumänien",
    regions: [
      "Dealu Mare",
      "Moldau",
      "Transsylvanien",
      "Banat",
    ],
  },
  {
    country: "Türkei",
    regions: [
      "Thrakien",
      "Kappadokien",
      "Ägäis",
    ],
  },
  {
    country: "Kanada",
    regions: [
      "Okanagan Valley",
      "Niagara Peninsula",
      "Prince Edward County",
    ],
  },
  {
    country: "Uruguay",
    regions: [
      "Canelones",
      "Maldonado",
      "Rivera",
    ],
  },
  {
    country: "Brasilien",
    regions: [
      "Serra Gaúcha",
      "Vale dos Vinhedos",
      "Campanha",
    ],
  },
  {
    country: "Israel",
    regions: [
      "Golanhöhen",
      "Galiläa",
      "Judäische Hügel",
    ],
  },
  {
    country: "Moldawien",
    regions: [
      "Codru",
      "Valul lui Traian",
      "Purcari",
    ],
  },
  {
    country: "Bulgarien",
    regions: [
      "Thrakien-Tal",
      "Donau-Ebene",
      "Struma-Tal",
    ],
  },
  {
    country: "England",
    regions: [
      "Sussex",
      "Kent",
      "Hampshire",
      "Surrey",
    ],
  },
];

/** Alle Länder alphabetisch sortiert */
export const countries: string[] = countryRegions
  .map((c) => c.country)
  .sort((a, b) => a.localeCompare(b, "de"));

/** Regionen für ein bestimmtes Land abrufen */
export function getRegionsForCountry(country: string): string[] {
  const entry = countryRegions.find((c) => c.country === country);
  return entry ? entry.regions : [];
}
