// Relations Atlas: draws the world map, shows country names on hover
// and opens a side panel when a country is clicked.

// Country borders from Natural Earth (via the world-atlas package)
const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json";

// Translates the map's numeric country codes into ISO alpha-2 and alpha-3 codes
const CODES_URL = "data/country-codes.json";

// Antarctica (numeric code 010) is left out to give the other countries more space
const HIDDEN_IDS = new Set(["010"]);

// Shapes that have no numeric code in the map data
const CODES_BY_NAME = { "Kosovo": ["XK", "XKX"] };

// Nicer names where the browser's built-in English names are awkward
const NAME_OVERRIDES = {
  CD: "DR Congo",
  CG: "Republic of the Congo",
  HK: "Hong Kong",
  MM: "Myanmar",
  MO: "Macau",
  PS: "Palestine",
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const container = document.getElementById("map-container");
const statusText = document.getElementById("map-status");
const tooltip = document.getElementById("tooltip");
const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panel-title");
const panelNote = document.getElementById("panel-note");
const panelClose = document.getElementById("panel-close");
const svg = d3.select("#map");

// Everything inside this group moves together when zooming
const mapLayer = svg.append("g");

let countries = [];

// Country files that were already loaded (ISO3 code -> data, or null if there is no file)
const countryData = new Map();

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath(projection);

// Zoom with mouse wheel / pinch, move by dragging
const zoom = d3.zoom()
  .scaleExtent([1, 12])
  // Small mouse movements during a click still count as a click, not a drag
  .clickDistance(6)
  .on("zoom", (event) => {
    mapLayer.attr("transform", event.transform);
  });
svg.call(zoom);

Promise.all([d3.json(WORLD_URL), d3.json(CODES_URL)])
  .then(([world, codes]) => {
    countries = topojson
      .feature(world, world.objects.countries)
      .features.filter((country) => !HIDDEN_IDS.has(country.id));

    // Give every country its ISO codes and a display name
    countries.forEach((country) => {
      const [iso2, iso3] = codes[country.id] || CODES_BY_NAME[country.properties.name] || [];
      country.iso3 = iso3 || null;
      country.displayName = countryName(iso2, country.properties.name);
    });

    // One shape per country
    mapLayer.selectAll(".country")
      .data(countries)
      .join("path")
      .attr("class", "country")
      .on("pointerenter", (event, country) => showTooltip(event, country.displayName))
      .on("pointermove", moveTooltip)
      .on("pointerleave", hideTooltip)
      .on("click", (event, country) => selectCountry(event.currentTarget, country));

    statusText.remove();
    resizeMap();
    window.addEventListener("resize", resizeMap);
  })
  .catch((error) => {
    console.error(error);
    statusText.textContent = "The map could not be loaded. Please check your internet connection and reload.";
  });

// English country name from the ISO alpha-2 code, with the map's own name as fallback
function countryName(iso2, fallback) {
  if (!iso2) {
    return fallback;
  }
  if (NAME_OVERRIDES[iso2]) {
    return NAME_OVERRIDES[iso2];
  }
  try {
    return regionNames.of(iso2).replace(" & ", " and ");
  } catch {
    return fallback;
  }
}

// Fit the map to the current size of the screen
function resizeMap() {
  const { width, height } = container.getBoundingClientRect();
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.fitExtent([[10, 10], [width - 10, height - 10]], { type: "FeatureCollection", features: countries });
  mapLayer.selectAll("path").attr("d", path);
}

// Load data/countries/<ISO3>.json once; returns null if the country has no file yet
async function loadCountryData(iso3) {
  if (!iso3) {
    return null;
  }
  if (!countryData.has(iso3)) {
    const response = await fetch(`data/countries/${iso3}.json`);
    countryData.set(iso3, response.ok ? await response.json() : null);
  }
  return countryData.get(iso3);
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Highlight the clicked country and show its name in the side panel
async function selectCountry(shape, country) {
  mapLayer.selectAll(".country").classed("selected", false);
  d3.select(shape).classed("selected", true);
  panelTitle.textContent = country.displayName;
  panelNote.textContent = "Loading…";
  panel.hidden = false;
  panel.dataset.iso3 = country.iso3 || "";
  hideTooltip();

  let data = null;
  try {
    data = await loadCountryData(country.iso3);
  } catch (error) {
    console.error(error);
  }

  // Ignore the result if another country was clicked in the meantime
  if (panel.dataset.iso3 !== (country.iso3 || "")) {
    return;
  }
  panelNote.textContent = data
    ? `Data as of ${formatDate(data.country.asOf)} · ${data.relations.length} key relations`
    : "No data yet.";
}

function closePanel() {
  panel.hidden = true;
  mapLayer.selectAll(".country").classed("selected", false);
}

panelClose.addEventListener("click", closePanel);

// Escape key or a click on the ocean also closes the panel
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePanel();
  }
});
svg.on("click", (event) => {
  if (event.target === svg.node()) {
    closePanel();
  }
});

function showTooltip(event, name) {
  // Only for mouse: on touch screens a tap opens the panel instead
  if (event.pointerType !== "mouse") {
    return;
  }
  tooltip.textContent = name;
  tooltip.hidden = false;
  moveTooltip(event);
}

// Place the label next to the mouse, but keep it inside the map area
function moveTooltip(event) {
  const box = container.getBoundingClientRect();
  let x = event.clientX - box.left + 12;
  let y = event.clientY - box.top + 12;
  if (x + tooltip.offsetWidth > box.width) {
    x -= tooltip.offsetWidth + 24;
  }
  if (y + tooltip.offsetHeight > box.height) {
    y -= tooltip.offsetHeight + 24;
  }
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}
