import type { Wine } from "./wines";

/**
 * Deterministischer Pseudozufallsgenerator (Mulberry32)
 * Damit die Testdaten bei jedem Build identisch sind.
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(rng: () => number, arr: T[], min: number, max: number): T[] {
  const n = min + Math.floor(rng() * (max - min + 1));
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

function rangeInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// ── Weinregionen mit passenden Trauben & Produzenten ──────────────────

interface RegionProfile {
  country: string;
  region: string;
  grapes: { name: string; type: Wine["type"] }[];
  producers: string[];
  wineNames: string[];
  priceRange: [number, number];
  locations: string[];
}

const regionProfiles: RegionProfile[] = [
  // FRANKREICH
  {
    country: "Frankreich", region: "Bordeaux",
    grapes: [
      { name: "Cabernet Sauvignon", type: "rot" }, { name: "Merlot", type: "rot" },
      { name: "Cabernet Franc", type: "rot" }, { name: "Sauvignon Blanc", type: "weiss" },
      { name: "Sémillon", type: "weiss" },
    ],
    producers: ["Château Margaux", "Château Lafite Rothschild", "Château Latour", "Château Mouton Rothschild",
      "Château Haut-Brion", "Château Pétrus", "Château Cheval Blanc", "Château Lynch-Bages",
      "Château Cos d'Estournel", "Château Palmer", "Château Ducru-Beaucaillou", "Château Pichon Baron"],
    wineNames: ["Grand Vin", "Second Vin", "Les Forts", "Réserve Spéciale", "Cuvée Prestige", "Médoc Supérieur"],
    priceRange: [25, 350],
    locations: ["Bordeaux Vinothek", "Wine & Co Online", "Vinothek Brancaia"],
  },
  {
    country: "Frankreich", region: "Burgund",
    grapes: [
      { name: "Pinot Noir", type: "rot" }, { name: "Chardonnay", type: "weiss" },
      { name: "Gamay", type: "rot" }, { name: "Aligoté", type: "weiss" },
    ],
    producers: ["Domaine de la Romanée-Conti", "Domaine Leroy", "Domaine Leflaive", "Joseph Drouhin",
      "Louis Jadot", "Domaine Comte Georges de Vogüé", "Domaine Armand Rousseau", "Bouchard Père & Fils",
      "Domaine Dujac", "Albert Bichot", "Maison Roche de Bellene"],
    wineNames: ["Gevrey-Chambertin", "Meursault", "Chablis Premier Cru", "Pommard", "Nuits-Saint-Georges",
      "Puligny-Montrachet", "Corton-Charlemagne", "Chambolle-Musigny", "Volnay"],
    priceRange: [20, 280],
    locations: ["Weinhandlung Kreis", "La Cave de Bourgogne", "Vinothek Bern"],
  },
  {
    country: "Frankreich", region: "Champagne",
    grapes: [
      { name: "Chardonnay, Pinot Noir, Pinot Meunier", type: "schaumwein" },
      { name: "Chardonnay", type: "schaumwein" }, { name: "Pinot Noir", type: "schaumwein" },
    ],
    producers: ["Dom Pérignon", "Krug", "Louis Roederer", "Bollinger", "Veuve Clicquot",
      "Taittinger", "Moët & Chandon", "Pol Roger", "Ruinart", "Laurent-Perrier", "Billecart-Salmon"],
    wineNames: ["Brut Réserve", "Blanc de Blancs", "Rosé", "Cuvée Prestige", "Millésimé", "Grand Cru"],
    priceRange: [30, 250],
    locations: ["Globus", "Manor", "Champagne Direct"],
  },
  {
    country: "Frankreich", region: "Rhône",
    grapes: [
      { name: "Syrah", type: "rot" }, { name: "Grenache", type: "rot" },
      { name: "Mourvèdre", type: "rot" }, { name: "Viognier", type: "weiss" },
      { name: "Grenache, Syrah, Mourvèdre", type: "rot" },
    ],
    producers: ["Château Rayas", "E. Guigal", "M. Chapoutier", "Paul Jaboulet Aîné",
      "Domaine Jean-Louis Chave", "Domaine du Vieux Télégraphe", "Château de Beaucastel",
      "Clos des Papes", "Domaine de la Janasse"],
    wineNames: ["Châteauneuf-du-Pape", "Hermitage", "Côte-Rôtie La Mouline", "Crozes-Hermitage",
      "Saint-Joseph", "Gigondas", "Condrieu"],
    priceRange: [15, 180],
    locations: ["Wine & Co Online", "Weinhandlung Kreis", "Vinothek Zürich"],
  },
  {
    country: "Frankreich", region: "Loire",
    grapes: [
      { name: "Sauvignon Blanc", type: "weiss" }, { name: "Chenin Blanc", type: "weiss" },
      { name: "Cabernet Franc", type: "rot" }, { name: "Melon de Bourgogne", type: "weiss" },
    ],
    producers: ["Domaine Huet", "Domaine Didier Dagueneau", "Domaine de la Taille aux Loups",
      "Nicolas Joly", "Domaine Vacheron", "Alphonse Mellot", "François Chidaine"],
    wineNames: ["Sancerre", "Pouilly-Fumé", "Vouvray Sec", "Muscadet Sèvre et Maine",
      "Chinon", "Bourgueil", "Savennières"],
    priceRange: [12, 65],
    locations: ["Weinhandlung Kreis", "La Cave du Vin", "Vinothek Basel"],
  },
  {
    country: "Frankreich", region: "Elsass",
    grapes: [
      { name: "Riesling", type: "weiss" }, { name: "Gewürztraminer", type: "weiss" },
      { name: "Pinot Gris", type: "weiss" }, { name: "Muscat", type: "weiss" },
      { name: "Pinot Blanc", type: "weiss" },
    ],
    producers: ["Domaine Weinbach", "Trimbach", "Hugel & Fils", "Zind-Humbrecht",
      "Marcel Deiss", "Albert Mann", "Domaine Ostertag"],
    wineNames: ["Grand Cru Schlossberg", "Cuvée Frédéric Emile", "Sélection de Grains Nobles",
      "Vendange Tardive", "Grand Cru Hengst", "Clos Sainte Hune"],
    priceRange: [14, 95],
    locations: ["Weinhandlung Kreis", "Vinothek Strasbourg", "Globus"],
  },
  // ITALIEN
  {
    country: "Italien", region: "Piemont",
    grapes: [
      { name: "Nebbiolo", type: "rot" }, { name: "Barbera", type: "rot" },
      { name: "Dolcetto", type: "rot" }, { name: "Arneis", type: "weiss" },
      { name: "Moscato", type: "dessert" },
    ],
    producers: ["Giacomo Conterno", "Bruno Giacosa", "Gaja", "Vietti", "Pio Cesare",
      "Bartolo Mascarello", "Produttori del Barbaresco", "Elio Altare", "Luciano Sandrone",
      "Roberto Voerzio", "Paolo Scavino", "Ceretto"],
    wineNames: ["Barolo Riserva", "Barbaresco", "Barolo Monfortino", "Barbera d'Alba",
      "Dolcetto d'Alba", "Langhe Nebbiolo", "Moscato d'Asti", "Roero Arneis"],
    priceRange: [12, 250],
    locations: ["Vinothek am Naschmarkt", "Weinhandlung Kreis", "Metro"],
  },
  {
    country: "Italien", region: "Toskana",
    grapes: [
      { name: "Sangiovese", type: "rot" }, { name: "Cabernet Sauvignon", type: "rot" },
      { name: "Merlot", type: "rot" }, { name: "Vernaccia", type: "weiss" },
      { name: "Sangiovese, Cabernet Sauvignon", type: "rot" },
    ],
    producers: ["Antinori", "Sassicaia (Tenuta San Guido)", "Ornellaia", "Fontodi",
      "Isole e Olena", "Castello di Ama", "Fèlsina", "Montevertine", "Tignanello",
      "Castello Banfi", "Il Poggione", "Biondi-Santi"],
    wineNames: ["Brunello di Montalcino", "Chianti Classico Riserva", "Bolgheri Superiore",
      "Vino Nobile di Montepulciano", "Vernaccia di San Gimignano", "Super Tuscan", "Rosso di Montalcino"],
    priceRange: [10, 220],
    locations: ["Vinothek Brancaia", "Weinhandlung Kreis", "Wine & Co Online"],
  },
  {
    country: "Italien", region: "Venetien",
    grapes: [
      { name: "Corvina", type: "rot" }, { name: "Garganega", type: "weiss" },
      { name: "Glera", type: "schaumwein" }, { name: "Corvina, Rondinella", type: "rot" },
    ],
    producers: ["Allegrini", "Masi", "Bertani", "Romano Dal Forno", "Pieropan",
      "Anselmi", "Quintarelli", "Zenato", "Tommasi"],
    wineNames: ["Amarone della Valpolicella", "Valpolicella Ripasso", "Soave Classico",
      "Prosecco Superiore", "Recioto della Valpolicella", "Lugana"],
    priceRange: [8, 150],
    locations: ["Metro", "Vinothek Zürich", "Coop"],
  },
  {
    country: "Italien", region: "Südtirol",
    grapes: [
      { name: "Lagrein", type: "rot" }, { name: "Gewürztraminer", type: "weiss" },
      { name: "Pinot Grigio", type: "weiss" }, { name: "Vernatsch (Schiava)", type: "rot" },
      { name: "Pinot Blanc", type: "weiss" },
    ],
    producers: ["Alois Lageder", "Elena Walch", "Terlano", "San Michele Appiano",
      "Nals Margreid", "Tramin", "Hofstätter", "Manincor"],
    wineNames: ["Lagrein Riserva", "Gewürztraminer Nussbaumer", "Pinot Grigio",
      "Terlaner Cuvée", "St. Magdalener", "Sauvignon Blanc Lieben Aich"],
    priceRange: [10, 55],
    locations: ["Vinothek Bozen", "Weinhandlung Kreis", "Coop"],
  },
  {
    country: "Italien", region: "Sizilien",
    grapes: [
      { name: "Nero d'Avola", type: "rot" }, { name: "Nerello Mascalese", type: "rot" },
      { name: "Grillo", type: "weiss" }, { name: "Carricante", type: "weiss" },
    ],
    producers: ["Planeta", "Tasca d'Almerita", "Donnafugata", "Benanti", "Frank Cornelissen",
      "Passopisciaro", "Cos", "Occhipinti"],
    wineNames: ["Etna Rosso", "Etna Bianco", "Nero d'Avola Riserva", "Cerasuolo di Vittoria",
      "Ben Ryé Passito di Pantelleria", "Santa Cecilia"],
    priceRange: [8, 65],
    locations: ["Vinothek Zürich", "Wine & Co Online", "Metro"],
  },
  // SPANIEN
  {
    country: "Spanien", region: "Rioja",
    grapes: [
      { name: "Tempranillo", type: "rot" }, { name: "Garnacha", type: "rot" },
      { name: "Graciano", type: "rot" }, { name: "Viura", type: "weiss" },
    ],
    producers: ["López de Heredia", "La Rioja Alta", "CVNE", "Marqués de Murrieta",
      "Muga", "Roda", "Artadi", "Remírez de Ganuza", "Bodegas Lan", "Sierra Cantabria"],
    wineNames: ["Viña Tondonia Reserva", "Gran Reserva 904", "Imperial Reserva",
      "Crianza", "Reserva", "Viña Ardanza"],
    priceRange: [8, 85],
    locations: ["Vinothek Zürich", "Wine & Co Online", "Weinhandlung Kreis"],
  },
  {
    country: "Spanien", region: "Priorat",
    grapes: [
      { name: "Garnacha", type: "rot" }, { name: "Cariñena", type: "rot" },
      { name: "Cabernet Sauvignon", type: "rot" }, { name: "Syrah", type: "rot" },
    ],
    producers: ["Alvaro Palacios", "Clos Mogador", "Mas Doix", "Clos Figueras",
      "Clos Erasmus", "Terroir al Límit", "Mas Martinet"],
    wineNames: ["L'Ermita", "Finca Dofí", "Clos Mogador", "Les Terrasses",
      "Camins del Priorat", "Gratallops"],
    priceRange: [18, 350],
    locations: ["Vinothek Barcelona", "Wine & Co Online", "Weinhandlung Kreis"],
  },
  {
    country: "Spanien", region: "Ribera del Duero",
    grapes: [
      { name: "Tempranillo", type: "rot" }, { name: "Cabernet Sauvignon", type: "rot" },
    ],
    producers: ["Vega Sicilia", "Pingus", "Pesquera", "Emilio Moro",
      "Pago de Carraovejas", "Arzuaga", "Protos", "Aalto"],
    wineNames: ["Único", "Flor de Pingus", "Crianza", "Reserva", "Tinto Pesquera", "PS"],
    priceRange: [12, 300],
    locations: ["Wine & Co Online", "Vinothek Zürich", "Globus"],
  },
  // DEUTSCHLAND
  {
    country: "Deutschland", region: "Mosel",
    grapes: [
      { name: "Riesling", type: "weiss" },
    ],
    producers: ["Joh. Jos. Prüm", "Egon Müller", "Markus Molitor", "Dr. Loosen",
      "Fritz Haag", "Willi Schaefer", "Clemens Busch", "Schloss Lieser",
      "Zilliken", "Van Volxem"],
    wineNames: ["Wehlener Sonnenuhr Spätlese", "Scharzhofberger Auslese", "Ürziger Würzgarten Kabinett",
      "Brauneberger Juffer Spätlese", "Graacher Himmelreich", "Riesling Trocken GG"],
    priceRange: [10, 180],
    locations: ["Weinhaus Becker", "Weinhandlung Kreis", "Globus"],
  },
  {
    country: "Deutschland", region: "Rheingau",
    grapes: [
      { name: "Riesling", type: "weiss" }, { name: "Spätburgunder", type: "rot" },
    ],
    producers: ["Robert Weil", "Schloss Johannisberg", "Peter Jakob Kühn",
      "Eva Fricke", "Leitz", "Spreitzer", "Georg Breuer"],
    wineNames: ["Kiedrich Gräfenberg GG", "Rüdesheimer Berg Schlossberg",
      "Hattenheimer Nussbrunnen", "Berg Roseneck", "Riesling Kabinett"],
    priceRange: [12, 95],
    locations: ["Weinhaus Becker", "Weinhandlung Kreis", "Jacques Wein-Depot"],
  },
  {
    country: "Deutschland", region: "Pfalz",
    grapes: [
      { name: "Riesling", type: "weiss" }, { name: "Spätburgunder", type: "rot" },
      { name: "Weissburgunder", type: "weiss" }, { name: "Grauburgunder", type: "weiss" },
    ],
    producers: ["Bürklin-Wolf", "Müller-Catoir", "Christmann", "Knipser",
      "Reichsrat von Buhl", "A. Christmann", "Philipp Kuhn", "Von Winning"],
    wineNames: ["Forster Ungeheuer GG", "Haardter Bürgergarten", "Gimmeldinger Mandelgarten",
      "Riesling Trocken", "Spätburgunder Réserve"],
    priceRange: [9, 65],
    locations: ["Weinhaus Becker", "Jacques Wein-Depot", "Globus"],
  },
  // ÖSTERREICH
  {
    country: "Österreich", region: "Wachau",
    grapes: [
      { name: "Grüner Veltliner", type: "weiss" }, { name: "Riesling", type: "weiss" },
    ],
    producers: ["F.X. Pichler", "Hirtzberger", "Knoll", "Prager", "Domäne Wachau",
      "Rudi Pichler", "Nikolaihof", "Alzinger"],
    wineNames: ["Grüner Veltliner Smaragd", "Riesling Smaragd Kellerberg", "Federspiel Terrassen",
      "Steinertal", "Achleiten", "Loibner Grüner Veltliner"],
    priceRange: [15, 95],
    locations: ["Vinothek am Naschmarkt", "Ab Hof", "Weinhandlung Kreis"],
  },
  {
    country: "Österreich", region: "Burgenland",
    grapes: [
      { name: "Blaufränkisch", type: "rot" }, { name: "Zweigelt", type: "rot" },
      { name: "St. Laurent", type: "rot" }, { name: "Welschriesling", type: "weiss" },
    ],
    producers: ["Ernst Triebaumer", "Moric", "Heinrich", "Prieler", "Pittnauer",
      "Umathum", "Kracher", "Claus Preisinger", "Judith Beck"],
    wineNames: ["Blaufränkisch Ried Mariental", "Lutzmannsburg Alte Reben", "Zweigelt Heideboden",
      "St. Laurent Reserve", "Beerenauslese Nouvelle Vague", "Pannobile"],
    priceRange: [10, 75],
    locations: ["Ab Hof", "Vinothek am Naschmarkt", "Weinhandlung Kreis"],
  },
  {
    country: "Österreich", region: "Steiermark",
    grapes: [
      { name: "Sauvignon Blanc", type: "weiss" }, { name: "Morillon (Chardonnay)", type: "weiss" },
      { name: "Welschriesling", type: "weiss" }, { name: "Muskateller", type: "weiss" },
    ],
    producers: ["Tement", "Polz", "Sattlerhof", "Wohlmuth", "Gross", "Lackner-Tinnacher"],
    wineNames: ["Sauvignon Blanc Zieregg", "Morillon Obegg", "Gelber Muskateller Steirisch",
      "Welschriesling Klassik", "Sauvignon Blanc Grassnitzberg"],
    priceRange: [10, 55],
    locations: ["Ab Hof", "Vinothek am Naschmarkt", "Weinhandlung Kreis"],
  },
  // SCHWEIZ
  {
    country: "Schweiz", region: "Wallis",
    grapes: [
      { name: "Pinot Noir", type: "rot" }, { name: "Gamay", type: "rot" },
      { name: "Syrah", type: "rot" }, { name: "Fendant (Chasselas)", type: "weiss" },
      { name: "Petite Arvine", type: "weiss" }, { name: "Humagne Rouge", type: "rot" },
      { name: "Cornalin", type: "rot" },
    ],
    producers: ["Marie-Thérèse Chappaz", "Domaine Jean-René Germanier", "Cave du Rhodan",
      "Simon Maye & Fils", "Provins", "Albert Mathier", "Didier Joris", "Denis Mercier"],
    wineNames: ["Fendant Grand Cru", "Petite Arvine", "Humagne Rouge", "Cornalin du Valais",
      "Syrah Réserve", "Dôle Blanche", "Heida", "Amigne de Vétroz"],
    priceRange: [12, 55],
    locations: ["Coop", "Manor", "Ab Hof", "Vinothek Sion"],
  },
  {
    country: "Schweiz", region: "Waadt (Lavaux)",
    grapes: [
      { name: "Chasselas", type: "weiss" }, { name: "Pinot Noir", type: "rot" },
      { name: "Gamay", type: "rot" },
    ],
    producers: ["Domaine Louis Bovard", "Blaise Duboux", "Luc Massy",
      "Cave de La Côte", "Domaine Croix Duplex", "Henri Badoux"],
    wineNames: ["Dézaley Grand Cru", "Epesses", "Saint-Saphorin", "Calamin",
      "Salvagnin", "Aigle Les Murailles"],
    priceRange: [12, 45],
    locations: ["Coop", "Manor", "Vinothek Lausanne"],
  },
  {
    country: "Schweiz", region: "Tessin",
    grapes: [
      { name: "Merlot", type: "rot" }, { name: "Merlot", type: "weiss" },
    ],
    producers: ["Gialdi", "Tamborini", "Delea", "Agriloro", "Guido Brivio",
      "Werner Stucky", "Daniel Huber", "Kopp von der Crone Visini"],
    wineNames: ["Merlot del Ticino Riserva", "Merlot Bianco", "Platinum", "Sassi Grossi",
      "Montagna Magica", "Vinattieri"],
    priceRange: [14, 65],
    locations: ["Coop", "Manor", "Vinothek Lugano", "Ab Hof"],
  },
  {
    country: "Schweiz", region: "Graubünden",
    grapes: [
      { name: "Pinot Noir", type: "rot" }, { name: "Chardonnay", type: "weiss" },
      { name: "Completer", type: "weiss" },
    ],
    producers: ["Gantenbein", "Donatsch", "Davaz", "Fromm", "Studach",
      "Cottinelli", "Georg Schlegel"],
    wineNames: ["Pinot Noir Sélection", "Maienfelder Pinot Noir", "Fläscher Pinot Noir",
      "Chardonnay Barrique", "Completer", "Jeninser Blauburgunder"],
    priceRange: [18, 85],
    locations: ["Ab Hof", "Manor", "Vinothek Chur"],
  },
  // PORTUGAL
  {
    country: "Portugal", region: "Douro",
    grapes: [
      { name: "Touriga Nacional", type: "rot" }, { name: "Tinta Roriz", type: "rot" },
      { name: "Touriga Franca", type: "rot" }, { name: "Touriga Nacional, Tinta Roriz", type: "rot" },
    ],
    producers: ["Quinta do Noval", "Niepoort", "Quinta do Crasto", "Quinta do Vale Meão",
      "Quinta do Vallado", "Prats & Symington", "Wine & Soul"],
    wineNames: ["Nacional Vintage Port", "Redoma Reserva", "Douro Tinto Reserva",
      "Charme", "Post Scriptum", "Adelaide"],
    priceRange: [8, 120],
    locations: ["Wine & Co Online", "Vinothek Zürich", "Metro"],
  },
  {
    country: "Portugal", region: "Alentejo",
    grapes: [
      { name: "Aragonez (Tempranillo)", type: "rot" }, { name: "Trincadeira", type: "rot" },
      { name: "Alicante Bouschet", type: "rot" },
    ],
    producers: ["Herdade do Esporão", "João Portugal Ramos", "Herdade dos Grous",
      "Cortes de Cima", "Dona Maria", "Monte da Ravasqueira"],
    wineNames: ["Reserva", "Private Selection", "Monte Velho", "Marquês de Borba",
      "Vila Santa Reserva"],
    priceRange: [6, 45],
    locations: ["Metro", "Wine & Co Online", "Coop"],
  },
  // USA
  {
    country: "USA", region: "Napa Valley",
    grapes: [
      { name: "Cabernet Sauvignon", type: "rot" }, { name: "Chardonnay", type: "weiss" },
      { name: "Merlot", type: "rot" }, { name: "Zinfandel", type: "rot" },
    ],
    producers: ["Opus One", "Screaming Eagle", "Caymus", "Stag's Leap Wine Cellars",
      "Silver Oak", "Robert Mondavi", "Joseph Phelps", "Duckhorn", "Far Niente",
      "Shafer", "Ridge", "Dominus Estate"],
    wineNames: ["Cabernet Sauvignon Reserve", "Insignia", "Artemis", "Napa Valley Cab",
      "SLV Cabernet", "FEL Chardonnay", "Hillside Select"],
    priceRange: [25, 350],
    locations: ["Wine & Co Online", "Globus", "Vinothek Zürich"],
  },
  {
    country: "USA", region: "Sonoma",
    grapes: [
      { name: "Pinot Noir", type: "rot" }, { name: "Chardonnay", type: "weiss" },
      { name: "Zinfandel", type: "rot" },
    ],
    producers: ["Williams Selyem", "Kistler", "Peter Michael", "Flowers",
      "Marcassin", "Littorai", "Hirsch Vineyards"],
    wineNames: ["Russian River Valley Pinot Noir", "Sonoma Coast Chardonnay",
      "Dry Creek Zinfandel", "Estate Pinot Noir"],
    priceRange: [20, 150],
    locations: ["Wine & Co Online", "Globus", "Vinothek Zürich"],
  },
  // ARGENTINIEN
  {
    country: "Argentinien", region: "Mendoza",
    grapes: [
      { name: "Malbec", type: "rot" }, { name: "Cabernet Sauvignon", type: "rot" },
      { name: "Torrontés", type: "weiss" },
    ],
    producers: ["Catena Zapata", "Achaval-Ferrer", "Zuccardi", "Terrazas de los Andes",
      "Trapiche", "Norton", "Luigi Bosca", "Salentein"],
    wineNames: ["Malbec Argentino", "Adrianna Vineyard", "Nicasia", "Quimera",
      "Gran Reserva", "Altos del Plata"],
    priceRange: [8, 95],
    locations: ["Wine & Co Online", "Coop", "Metro"],
  },
  // CHILE
  {
    country: "Chile", region: "Maipo Valley",
    grapes: [
      { name: "Cabernet Sauvignon", type: "rot" }, { name: "Carmenère", type: "rot" },
      { name: "Sauvignon Blanc", type: "weiss" },
    ],
    producers: ["Concha y Toro", "Almaviva", "Santa Rita", "Viña Errázuriz",
      "Montes", "Casa Lapostolle", "De Martino"],
    wineNames: ["Don Melchor", "Almaviva", "Alpha M", "Clos Apalta",
      "Casa Real", "Purple Angel"],
    priceRange: [8, 120],
    locations: ["Wine & Co Online", "Coop", "Metro"],
  },
  // SÜDAFRIKA
  {
    country: "Südafrika", region: "Stellenbosch",
    grapes: [
      { name: "Cabernet Sauvignon", type: "rot" }, { name: "Pinotage", type: "rot" },
      { name: "Chenin Blanc", type: "weiss" }, { name: "Syrah", type: "rot" },
    ],
    producers: ["Kanonkop", "Meerlust", "Rust en Vrede", "Thelema",
      "Vergelegen", "Jordan", "Neil Ellis", "Waterford"],
    wineNames: ["Estate Pinotage", "Rubicon", "Cabernet Sauvignon Reserve",
      "The FMC Chenin Blanc", "Estate Syrah"],
    priceRange: [8, 65],
    locations: ["Wine & Co Online", "Coop", "Globus"],
  },
  // AUSTRALIEN
  {
    country: "Australien", region: "Barossa Valley",
    grapes: [
      { name: "Shiraz", type: "rot" }, { name: "Grenache", type: "rot" },
      { name: "Cabernet Sauvignon", type: "rot" },
    ],
    producers: ["Penfolds", "Henschke", "Torbreck", "Two Hands",
      "Peter Lehmann", "Grant Burge", "Yalumba", "Turkey Flat"],
    wineNames: ["Grange", "Hill of Grace", "RunRig", "The Laird",
      "Stonewell Shiraz", "The Octavius"],
    priceRange: [12, 450],
    locations: ["Wine & Co Online", "Globus", "Vinothek Zürich"],
  },
  // NEUSEELAND
  {
    country: "Neuseeland", region: "Marlborough",
    grapes: [
      { name: "Sauvignon Blanc", type: "weiss" }, { name: "Pinot Noir", type: "rot" },
      { name: "Chardonnay", type: "weiss" },
    ],
    producers: ["Cloudy Bay", "Dog Point", "Craggy Range", "Villa Maria",
      "Greywacke", "Seresin", "Framingham"],
    wineNames: ["Sauvignon Blanc", "Te Wahi Pinot Noir", "Pinot Noir Reserve",
      "Chardonnay", "Late Harvest Riesling"],
    priceRange: [10, 45],
    locations: ["Coop", "Wine & Co Online", "Globus"],
  },
  // GEORGIEN
  {
    country: "Georgien", region: "Kachetien",
    grapes: [
      { name: "Saperavi", type: "rot" }, { name: "Rkatsiteli", type: "weiss" },
      { name: "Mtsvane", type: "weiss" },
    ],
    producers: ["Pheasant's Tears", "Iago's Wine", "Lapati Wines",
      "Teliani Valley", "Château Mukhrani", "Orgo"],
    wineNames: ["Saperavi Qvevri", "Rkatsiteli Amber Wine", "Mtsvane",
      "Tsinandali", "Mukuzani"],
    priceRange: [8, 35],
    locations: ["Wine & Co Online", "Vinothek Zürich", "Spezialitätenhandel"],
  },
  // UNGARN
  {
    country: "Ungarn", region: "Tokaj",
    grapes: [
      { name: "Furmint", type: "weiss" }, { name: "Furmint", type: "dessert" },
      { name: "Hárslevelű", type: "weiss" },
    ],
    producers: ["Royal Tokaji", "Disznókő", "Oremus", "Szepsy",
      "Patricius", "Gróf Degenfeld"],
    wineNames: ["Tokaji Aszú 5 Puttonyos", "Tokaji Szamorodni", "Furmint Dry",
      "Late Harvest", "Essencia"],
    priceRange: [10, 150],
    locations: ["Wine & Co Online", "Vinothek Zürich", "Spezialitätenhandel"],
  },
  // GRIECHENLAND
  {
    country: "Griechenland", region: "Santorini",
    grapes: [
      { name: "Assyrtiko", type: "weiss" }, { name: "Athiri", type: "weiss" },
    ],
    producers: ["Domaine Sigalas", "Hatzidakis", "Gaia Wines",
      "Estate Argyros", "Santo Wines"],
    wineNames: ["Assyrtiko", "Nykteri", "Santorini Barrel Fermented",
      "Vinsanto", "Wild Ferment Assyrtiko"],
    priceRange: [12, 45],
    locations: ["Wine & Co Online", "Vinothek Zürich", "Spezialitätenhandel"],
  },
  // LIBANON
  {
    country: "Libanon", region: "Bekaa-Tal",
    grapes: [
      { name: "Cabernet Sauvignon, Cinsault", type: "rot" },
      { name: "Obaideh", type: "weiss" }, { name: "Syrah, Cabernet Sauvignon", type: "rot" },
    ],
    producers: ["Château Musar", "Château Kefraya", "Domaine des Tourelles",
      "Château Ksara", "Massaya"],
    wineNames: ["Château Musar Red", "Hochar Père et Fils", "Comte de M",
      "Gold Réserve", "Classic"],
    priceRange: [10, 55],
    locations: ["Wine & Co Online", "Spezialitätenhandel", "Vinothek Zürich"],
  },
];

// ── Notizen-Templates ─────────────────────────────────────────────────

const notesTemplates = {
  rot: [
    "Dunkle Frucht, Brombeere, Cassis, samtige Tannine",
    "Komplex, Tabak, Leder, lange Nachhaltigkeit",
    "Kirsche, Pflaume, Vanille aus dem Holz",
    "Elegante Struktur, mittlerer Körper, feine Würze",
    "Reife Frucht, Schokolade, erdige Noten",
    "Kräftige Tannine, braucht noch Zeit",
    "Weich und rund, sofort trinkbar",
    "Rauchig, Pfeffer, mediterrane Kräuter",
    "Veilchen, Rosenblüte, feine Mineralik",
    "Konzentriert, dunkle Beeren, Mokka im Abgang",
  ],
  weiss: [
    "Mineralisch, Zitrus, grüner Apfel",
    "Exotische Frucht, Mango, reife Birne",
    "Knackig, frisch, Grapefruit und Limette",
    "Cremig, Butter, elegantes Holz",
    "Weisser Pfeffer, Steinobst, lebhafte Säure",
    "Blumig, Akazie, Honignoten",
    "Flintig, Feuerstein, straffe Säure",
    "Pfirsich, Aprikose, zarter Schmelz",
    "Herbal, Holunder, knackige Frische",
    "Nussig, Brioche, komplexe Textur",
  ],
  "rosé": [
    "Erdbeere, Himbeere, frischer Sommertrunk",
    "Provence-Stil, zart lachsfarben, trocken",
    "Wassermelone, Rosenblüte, leicht und spritzig",
  ],
  schaumwein: [
    "Feine Perlage, Brioche, Zitrusfrüchte",
    "Hefig, Toastnoten, eleganter Abgang",
    "Apfel, Birne, lebhafte Mousse",
    "Cremig, Mandel, lange Reife auf der Hefe",
  ],
  dessert: [
    "Honig, Aprikose, konzentrierte Süsse",
    "Rosinen, Feigen, perfekte Balance Süsse-Säure",
    "Karamell, Orangenschale, sirupartige Textur",
  ],
};

// ── Generator ─────────────────────────────────────────────────────────

export function generateTestWines(count: number = 300): Wine[] {
  const rng = mulberry32(42); // Seed 42 für reproduzierbare Daten
  const wines: Wine[] = [];

  for (let i = 0; i < count; i++) {
    const profile = pick(rng, regionProfiles);
    const grapeInfo = pick(rng, profile.grapes);
    const producer = pick(rng, profile.producers);
    const wineName = pick(rng, profile.wineNames);
    const location = pick(rng, profile.locations);

    const vintage = rangeInt(rng, 2005, 2023);
    const ageability = grapeInfo.type === "dessert" ? rangeInt(rng, 15, 40) :
      grapeInfo.type === "schaumwein" ? rangeInt(rng, 3, 12) :
        grapeInfo.type === "rot" ? rangeInt(rng, 3, 25) :
          rangeInt(rng, 2, 10);
    const drinkFrom = vintage + rangeInt(rng, 1, Math.min(5, ageability));
    const drinkUntil = vintage + ageability;

    const price = rangeInt(rng, profile.priceRange[0], profile.priceRange[1]);
    const quantity = rangeInt(rng, 1, 12);

    const purchaseYear = rangeInt(rng, Math.max(vintage, 2018), 2025);
    const purchaseMonth = String(rangeInt(rng, 1, 12)).padStart(2, "0");
    const purchaseDay = String(rangeInt(rng, 1, 28)).padStart(2, "0");
    const purchaseDate = `${purchaseYear}-${purchaseMonth}-${purchaseDay}`;

    const hasRating = rng() > 0.3;
    const rating = hasRating ? rangeInt(rng, 82, 100) : undefined;
    const hasPersonalRating = rng() > 0.4;
    const personalRating = hasPersonalRating ? rangeInt(rng, 2, 5) : undefined;

    const typeNotes = notesTemplates[grapeInfo.type] || notesTemplates.rot;
    const hasNotes = rng() > 0.3;
    const notes = hasNotes ? pick(rng, typeNotes) : undefined;

    const isGift = rng() > 0.9;
    const giftGivers = ["Tante Maria", "Onkel Hans", "Freund Marco", "Weinclub", "Geburtstag Petra", "Chef Thomas"];

    wines.push({
      id: `test_${(i + 1).toString().padStart(4, "0")}`,
      name: `${wineName}`,
      producer,
      vintage,
      region: profile.region,
      country: profile.country,
      type: grapeInfo.type,
      grape: grapeInfo.name,
      quantity,
      purchasePrice: price,
      purchaseDate,
      purchaseLocation: location,
      drinkFrom,
      drinkUntil,
      ...(rating !== undefined && { rating }),
      ...(personalRating !== undefined && { personalRating }),
      ...(notes && { notes }),
      ...(isGift && { isGift: true, giftFrom: pick(rng, giftGivers) }),
    });
  }

  return wines;
}

/** Vorberechnete 300 Testdaten */
export const testWines: Wine[] = generateTestWines(300);
