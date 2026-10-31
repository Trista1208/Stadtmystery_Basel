/* Live waste grid for the Silent Ferry.
   Illegal-dump reports: Basel-Stadt open data, Stadtreinigung, dataset 100070.
   Official drop-offs: dataset 100021. Positions of dumps are snapped to a 50 m grid. */

const DUMP_QUERY = "within_distance(geo_point_2d, geom'POINT(7.590 47.557)', 900m)";
const BIN_QUERY = "within_distance(geo_point_2d, geom'POINT(7.590 47.557)', 1200m)";

const CITY_FEED = {
  status: "loading",
  fetchedAt: null,
  dumps: [],
  bins: [],
  note: "Asking Basel-Stadt for the latest cleaning reports."
};

const DUMP_FALLBACK = [
  { id: "fb1", bearbeitungszeit_meldung: "2026-10-29T08:00:00+00:00", abfallkategorie: "Bebbi-Sagg, falscher Sack, Sack zu schwer", bez_name: "Theodor", geo_point_2d: { lon: 7.5947468162384775, lat: 47.56170683988836 } },
  { id: "fb2", bearbeitungszeit_meldung: "2026-10-29T08:10:00+00:00", abfallkategorie: "Bebbi-Sagg, falscher Sack, Sack zu schwer", bez_name: "Klingental", geo_point_2d: { lon: 7.590760646055422, lat: 47.56171211096502 } },
  { id: "fb3", bearbeitungszeit_meldung: "2026-10-28T09:00:00+00:00", abfallkategorie: "Metall", bez_name: "Peter", geo_point_2d: { lon: 7.586100180962577, lat: 47.558120610543575 } },
  { id: "fb4", bearbeitungszeit_meldung: "2026-10-28T09:05:00+00:00", abfallkategorie: "Papier/Karton", bez_name: "Peter", geo_point_2d: { lon: 7.586100180962577, lat: 47.558120610543575 } },
  { id: "fb5", bearbeitungszeit_meldung: "2026-10-28T09:06:00+00:00", abfallkategorie: "Sonderabfall", bez_name: "Peter", geo_point_2d: { lon: 7.586100180962577, lat: 47.558120610543575 } },
  { id: "fb6", bearbeitungszeit_meldung: "2026-10-27T11:00:00+00:00", abfallkategorie: "Sperrgut", bez_name: "Klingental", geo_point_2d: { lon: 7.589433192258526, lat: 47.562163521719995 } },
  { id: "fb7", bearbeitungszeit_meldung: "2026-10-27T11:05:00+00:00", abfallkategorie: "Papier/Karton", bez_name: "Klingental", geo_point_2d: { lon: 7.589433192258526, lat: 47.562163521719995 } },
  { id: "fb8", bearbeitungszeit_meldung: "2026-10-23T12:00:00+00:00", abfallkategorie: "Metall", bez_name: "Steinen", geo_point_2d: { lon: 7.5834356000962755, lat: 47.5554258307718 } },
  { id: "fb9", bearbeitungszeit_meldung: "2026-10-22T13:00:00+00:00", abfallkategorie: "Sperrgut", bez_name: "Steinen", geo_point_2d: { lon: 7.582100996206423, lat: 47.55317904564992 } },
  { id: "fb10", bearbeitungszeit_meldung: "2026-10-21T14:00:00+00:00", abfallkategorie: "Bebbi-Sagg, falscher Sack, Sack zu schwer", bez_name: "Peter", geo_point_2d: { lon: 7.586098939529438, lat: 47.55767092563829 } },
  { id: "fb11", bearbeitungszeit_meldung: "2026-10-20T15:00:00+00:00", abfallkategorie: "Elektrogerät", bez_name: "Steinen", geo_point_2d: { lon: 7.5827676774676, lat: 47.554077597590236 } },
  { id: "fb12", bearbeitungszeit_meldung: "2026-10-20T15:05:00+00:00", abfallkategorie: "Metall", bez_name: "Steinen", geo_point_2d: { lon: 7.5827676774676, lat: 47.554077597590236 } }
];

function classifyWaste(label) {
  const c = String(label || "").toLowerCase();
  if (/sonder|elektro|batter|chemie|spritze|munition/.test(c)) return "hazard";
  if (/metall/.test(c)) return "metal";
  if (/papier|karton/.test(c)) return "paper";
  if (/glas/.test(c)) return "glass";
  if (/kunststoff|plastic/.test(c)) return "plastic";
  if (/bio|küchen|kuchen|organ/.test(c)) return "food";
  if (/zig|stummel|kippe/.test(c)) return "butts";
  return "other";
}

function groupDumps(records) {
  const groups = new Map();
  records.forEach((record) => {
    const point = record.geo_point_2d;
    if (!point) return;
    const id = `${Number(point.lat).toFixed(5)}|${Number(point.lon).toFixed(5)}`;
    let group = groups.get(id);
    if (!group) {
      group = {
        id,
        lat: point.lat,
        lon: point.lon,
        count: 0,
        categories: {},
        latest: record.bearbeitungszeit_meldung || "",
        district: record.bez_name || ""
      };
      groups.set(id, group);
    }
    group.count += 1;
    const cat = record.abfallkategorie || "Unspecified";
    group.categories[cat] = (group.categories[cat] || 0) + 1;
    if ((record.bearbeitungszeit_meldung || "") > group.latest) group.latest = record.bearbeitungszeit_meldung;
    if (record.bez_name) group.district = record.bez_name;
  });
  return [...groups.values()];
}

function typeCounts(site) {
  const counts = {};
  Object.entries(site.categories || {}).forEach(([label, n]) => {
    const type = classifyWaste(label);
    counts[type] = (counts[type] || 0) + n;
  });
  return counts;
}

function topCategory(site) {
  let best = "Unspecified";
  let n = 0;
  Object.entries(site.categories || {}).forEach(([label, count]) => {
    if (count > n) {
      best = label;
      n = count;
    }
  });
  return best;
}

function dominantType(site) {
  const counts = typeCounts(site);
  let best = "other";
  let n = -1;
  Object.entries(counts).forEach(([type, count]) => {
    if (count > n) {
      best = type;
      n = count;
    }
  });
  return best;
}

function nearbyDumps(lat, lon, radius) {
  return CITY_FEED.dumps
    .map((site) => ({ site, dist: haversine(lat, lon, site.lat, site.lon) }))
    .filter((row) => row.dist <= radius)
    .sort((a, b) => a.dist - b.dist)
    .map((row) => row.site);
}

function nearbyBins(lat, lon, radius) {
  return CITY_FEED.bins
    .map((bin) => ({ bin, dist: haversine(lat, lon, bin.lat, bin.lon) }))
    .filter((row) => row.dist <= radius)
    .sort((a, b) => a.dist - b.dist)
    .map((row) => row.bin);
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function refreshCityFeed() {
  CITY_FEED.status = "loading";
  CITY_FEED.note = "Asking Basel-Stadt for the latest cleaning reports.";
  if (typeof window.onCityFeed === "function") window.onCityFeed();
  try {
    const dumpsUrl = "https://data.bs.ch/api/explore/v2.1/catalog/datasets/100070/records?" + new URLSearchParams({
      limit: "80",
      where: DUMP_QUERY,
      order_by: "bearbeitungszeit_meldung DESC"
    });
    const binsUrl = "https://data.bs.ch/api/explore/v2.1/catalog/datasets/100021/records?" + new URLSearchParams({
      limit: "40",
      where: BIN_QUERY
    });
    const [dumpRes, binRes] = await Promise.all([
      fetch(dumpsUrl, { signal: AbortSignal.timeout(8000) }),
      fetch(binsUrl, { signal: AbortSignal.timeout(8000) })
    ]);
    if (!dumpRes.ok) throw new Error("dumps");
    const dumpJson = await dumpRes.json();
    const dumps = groupDumps(dumpJson.results || []);
    let bins = [];
    if (binRes.ok) {
      const binJson = await binRes.json();
      bins = (binJson.results || []).map((row) => ({
        id: row.gml_id || row.es_name,
        name: row.es_name || "Drop-off",
        kind: row.es_kategorie || "Entsorgung",
        address: row.es_adresse || "",
        lat: row.geo_point_2d.lat,
        lon: row.geo_point_2d.lon
      })).filter((bin) => Number.isFinite(bin.lat));
    }
    CITY_FEED.dumps = dumps;
    CITY_FEED.bins = bins;
    CITY_FEED.status = "live";
    CITY_FEED.fetchedAt = new Date().toISOString();
    const reports = dumps.reduce((sum, site) => sum + site.count, 0);
    CITY_FEED.note = `${reports} recent illegal-dump reports within 900 m of the walk, from the Stadtreinigung. Official drop-offs are the teal dots.`;
  } catch (err) {
    CITY_FEED.dumps = groupDumps(DUMP_FALLBACK);
    CITY_FEED.bins = [];
    CITY_FEED.status = "sample";
    CITY_FEED.fetchedAt = null;
    CITY_FEED.note = "The live feed did not answer. Showing a saved sample of real reports from 20–29 October 2026.";
  }
  if (typeof window.onCityFeed === "function") window.onCityFeed();
}
