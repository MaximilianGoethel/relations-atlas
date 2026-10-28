// Relations Atlas: draws the world map, shows country names on hover,
// draws arrows to a country's key partners and opens a side panel on click.

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

// Arrow colour for each relationship status (from good to bad)
const STATUS_COLORS = {
  "very good": "#1b7837",
  "good": "#5aae61",
  "mixed": "#e6a700",
  "tense": "#e66101",
  "hostile": "#d7191c",
  "war": "#67001f",
};

// Arrow thickness for each level of influence
const INFLUENCE_WIDTHS = {
  "very high": 3.5,
  "high": 2.5,
  "medium": 1.5,
};

const TREND_SYMBOLS = { rising: "↗", stable: "→", falling: "↘" };

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

const container = document.getElementById("map-container");
const statusText = document.getElementById("map-status");
const tooltip = document.getElementById("tooltip");
const legend = document.getElementById("legend");
const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panel-title");
const panelNote = document.getElementById("panel-note");
const panelContent = document.getElementById("panel-content");
const panelClose = document.getElementById("panel-close");
const panelBack = document.getElementById("panel-back");
const svg = d3.select("#map");

// Everything inside this group moves together when zooming
const mapLayer = svg.append("g");

// Arrows sit on top of the map; they are redrawn after every zoom so they keep their size
const arrowLayer = svg.append("g").attr("class", "arrows");

let countries = [];
const countriesByIso3 = new Map();

// Country files that were already loaded (ISO3 code -> data, or null if there is no file)
const countryData = new Map();

// The clicked country (or null), its data, and the country the mouse is currently over (or null)
let selectedCountry = null;
let selectedData = null;
let hoveredCountry = null;

// ISO3 code of the partner whose relationship profile is open in the panel (or null)
let openPartner = null;

// Current zoom position, needed to place the arrows
let zoomTransform = d3.zoomIdentity;

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath(projection);

// Zoom with mouse wheel / pinch, move by dragging
const zoom = d3.zoom()
  .scaleExtent([1, 12])
  // Small mouse movements during a click still count as a click, not a drag
  .clickDistance(6)
  .on("zoom", (event) => {
    zoomTransform = event.transform;
    mapLayer.attr("transform", zoomTransform);
    updateArrowPositions();
  });
svg.call(zoom);

addArrowheads();
buildLegend();

Promise.all([d3.json(WORLD_URL), d3.json(CODES_URL)])
  .then(([world, codes]) => {
    countries = topojson
      .feature(world, world.objects.countries)
      .features.filter((country) => !HIDDEN_IDS.has(country.id));

    // Give every country its ISO codes, a display name and a point where arrows start and end
    countries.forEach((country) => {
      const [iso2, iso3] = codes[country.id] || CODES_BY_NAME[country.properties.name] || [];
      country.iso3 = iso3 || null;
      country.displayName = countryName(iso2, country.properties.name);
      country.anchor = anchorPoint(country);
      if (country.iso3 && !countriesByIso3.has(country.iso3)) {
        countriesByIso3.set(country.iso3, country);
      }
    });

    // One shape per country
    mapLayer.selectAll(".country")
      .data(countries)
      .join("path")
      .attr("class", "country")
      .on("pointerenter", onCountryEnter)
      .on("pointermove", moveTooltip)
      .on("pointerleave", onCountryLeave)
      .on("click", (event, country) => selectCountry(country));

    statusText.remove();
    resizeMap();
    // Refit the map whenever its area changes size (window resized, panel opened or closed)
    new ResizeObserver(resizeMap).observe(container);
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

// Centre of a country's largest piece of land, so that e.g. the arrow to the USA
// ends in the mainland and not somewhere between Alaska and Hawaii
function anchorPoint(country) {
  const geometry = country.geometry;
  if (geometry.type !== "MultiPolygon") {
    return d3.geoCentroid(country);
  }
  const pieces = geometry.coordinates.map((coordinates) => ({ type: "Polygon", coordinates }));
  return d3.geoCentroid(d3.greatest(pieces, (piece) => d3.geoArea(piece)));
}

// Fit the map to the current size of its area
function resizeMap() {
  const { width, height } = container.getBoundingClientRect();
  if (width === 0 || height === 0) {
    return;
  }
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.fitExtent([[10, 10], [width - 10, height - 10]], { type: "FeatureCollection", features: countries });
  mapLayer.selectAll("path").attr("d", path);
  updateArrowPositions();
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

async function loadCountryDataSafely(iso3) {
  try {
    return await loadCountryData(iso3);
  } catch (error) {
    console.error(error);
    return null;
  }
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ---------- Hover ----------

async function onCountryEnter(event, country) {
  hoveredCountry = country;
  showTooltip(event, country.displayName);

  // While a country is selected, hovering one of its partners highlights that arrow
  if (selectedCountry) {
    focusPartner(country.iso3);
    return;
  }

  // Otherwise preview the hovered country's arrows (mouse only; a tap selects instead)
  if (event.pointerType !== "mouse") {
    return;
  }
  const data = await loadCountryDataSafely(country.iso3);
  if (hoveredCountry === country && !selectedCountry) {
    showRelations(country, data);
  }
}

function onCountryLeave() {
  hoveredCountry = null;
  hideTooltip();
  if (selectedCountry) {
    focusPartner(null);
  } else {
    showRelations(null, null);
  }
}

// ---------- Selection and panel ----------

// Click on a country: select it, or open a relationship profile if it is a partner of the selected country
async function selectCountry(country) {
  if (selectedCountry && country !== selectedCountry && findRelation(country.iso3)) {
    openRelation(country.iso3);
    return;
  }
  if (country === selectedCountry) {
    if (openPartner) {
      showOverview();
    }
    return;
  }

  selectedCountry = country;
  selectedData = null;
  openPartner = null;
  mapLayer.selectAll(".country").classed("selected", (d) => d === country);
  panelTitle.textContent = country.displayName;
  panelNote.textContent = "Loading…";
  panelBack.hidden = true;
  panelContent.replaceChildren();
  panel.hidden = false;
  hideTooltip();

  const data = await loadCountryDataSafely(country.iso3);

  // Ignore the result if another country was clicked in the meantime
  if (selectedCountry !== country) {
    return;
  }
  selectedData = data;
  showRelations(country, data);
  if (data) {
    showOverview();
  } else {
    panelNote.textContent = "No data yet.";
  }
}

function findRelation(iso3) {
  return selectedData ? selectedData.relations.find((relation) => relation.partner === iso3) : undefined;
}

// Panel view 1: the list of all 10 partners
function showOverview() {
  openPartner = null;
  panelTitle.textContent = selectedCountry.displayName;
  panelNote.textContent = `Data as of ${formatDate(selectedData.country.asOf)}`;
  panelBack.hidden = true;
  renderRelationList(selectedData.relations);
  focusPartner(null);
  panel.scrollTop = 0;
}

function renderRelationList(relations) {
  const heading = document.createElement("h3");
  heading.className = "panel-heading";
  heading.textContent = "Top 10 relations";

  const hint = document.createElement("p");
  hint.className = "panel-hint";
  hint.textContent = "Click a partner, its arrow or its country for the full profile.";

  const list = document.createElement("ol");
  list.className = "relation-list";

  [...relations].sort((a, b) => a.rank - b.rank).forEach((relation) => {
    const item = document.createElement("li");
    item.className = "relation-item";
    item.dataset.partner = relation.partner;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "relation-button";

    const rank = document.createElement("span");
    rank.className = "relation-rank";
    rank.textContent = relation.rank;

    const dot = document.createElement("span");
    dot.className = "relation-dot";
    dot.style.background = STATUS_COLORS[relation.status];

    const text = document.createElement("span");
    text.className = "relation-text";
    const name = document.createElement("strong");
    name.textContent = partnerName(relation.partner);
    const meta = document.createElement("span");
    meta.className = "relation-meta";
    meta.textContent = `${relation.status} · ${relation.trend} ${TREND_SYMBOLS[relation.trend]} · influence ${relation.influence}`;
    const headline = document.createElement("span");
    headline.className = "relation-headline";
    headline.textContent = relation.headline;
    text.append(name, meta, headline);

    button.append(rank, dot, text);
    button.addEventListener("click", () => openRelation(relation.partner));
    item.append(button);
    item.addEventListener("pointerenter", () => focusPartner(relation.partner));
    item.addEventListener("pointerleave", () => focusPartner(null));
    list.append(item);
  });

  panelContent.replaceChildren(heading, hint, list);
}

// Panel view 2: the full profile of one relationship
function openRelation(iso3) {
  const relation = findRelation(iso3);
  if (!relation) {
    return;
  }
  openPartner = iso3;
  hideTooltip();

  panelTitle.textContent = `${selectedCountry.displayName} → ${partnerName(iso3)}`;
  panelNote.textContent = relation.headline;
  panelBack.textContent = `← All relations of ${selectedCountry.displayName}`;
  panelBack.hidden = false;

  // Rank, status and trend as small facts at the top
  const facts = document.createElement("dl");
  facts.className = "relation-facts";
  const statusDot = document.createElement("span");
  statusDot.className = "relation-dot";
  statusDot.style.background = STATUS_COLORS[relation.status];
  addFact(facts, "Rank", `${relation.rank} of ${selectedData.relations.length}`);
  addFact(facts, "Status", relation.status, statusDot);
  addFact(facts, "Trend", `${relation.trend} ${TREND_SYMBOLS[relation.trend]}`);

  const sections = [
    bulletSection("Economy", relation.economic),
    bulletSection("Politics and security", relation.politicalSecurity),
    bulletSection("Current situation", relation.current),
  ].filter(Boolean);

  // Our own judgement, clearly separated from the sourced facts
  const assessment = document.createElement("section");
  assessment.className = "assessment";
  const assessmentLabel = document.createElement("h3");
  assessmentLabel.textContent = "Our assessment";
  const influence = document.createElement("p");
  influence.className = "assessment-influence";
  influence.textContent = `Influence on ${selectedCountry.displayName}: ${relation.influence}`;
  const assessmentText = document.createElement("p");
  assessmentText.textContent = relation.assessment;
  assessment.append(assessmentLabel, influence, assessmentText);

  panelContent.replaceChildren(facts, ...sections, assessment, sourceSection(relation.sources));
  focusPartner(null);
  panel.scrollTop = 0;
}

function addFact(list, label, value, marker) {
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  if (marker) {
    detail.append(marker);
  }
  detail.append(value);
  list.append(term, detail);
}

// A heading with a bullet list; a short lead-in before the first colon is shown in bold
function bulletSection(title, points) {
  if (!points || points.length === 0) {
    return null;
  }
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  heading.className = "panel-heading";
  heading.textContent = title;
  const list = document.createElement("ul");
  list.className = "bullet-list";
  points.forEach((point) => {
    const item = document.createElement("li");
    const colon = point.indexOf(": ");
    if (colon > 0 && colon <= 30) {
      const lead = document.createElement("strong");
      lead.textContent = point.slice(0, colon + 1);
      item.append(lead, point.slice(colon + 1));
    } else {
      item.textContent = point;
    }
    list.append(item);
  });
  section.append(heading, list);
  return section;
}

function sourceSection(sources) {
  const section = document.createElement("section");
  const heading = document.createElement("h3");
  heading.className = "panel-heading";
  heading.textContent = "Sources";
  const list = document.createElement("ol");
  list.className = "source-list";
  sources.forEach((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = source.title;
    item.append(link, ` (${source.date})`);
    list.append(item);
  });
  section.append(heading, list);
  return section;
}

function partnerName(iso3) {
  const partner = countriesByIso3.get(iso3);
  return partner ? partner.displayName : iso3;
}

function closePanel() {
  selectedCountry = null;
  selectedData = null;
  openPartner = null;
  panel.hidden = true;
  mapLayer.selectAll(".country").classed("selected", false);
  showRelations(null, null);
}

panelClose.addEventListener("click", closePanel);
panelBack.addEventListener("click", showOverview);

// Escape goes back from a relationship profile to the list, otherwise closes the panel
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }
  if (openPartner) {
    showOverview();
  } else {
    closePanel();
  }
});

// A click on the ocean closes the panel
svg.on("click", (event) => {
  if (event.target === svg.node()) {
    closePanel();
  }
});

// ---------- Arrows ----------

// One arrowhead per status colour (SVG arrowheads cannot take the colour of their line)
function addArrowheads() {
  svg.append("defs")
    .selectAll("marker")
    .data(Object.entries(STATUS_COLORS))
    .join("marker")
    .attr("id", ([status]) => arrowheadId(status))
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 8)
    .attr("refY", 5)
    .attr("markerUnits", "userSpaceOnUse")
    .attr("markerWidth", 11)
    .attr("markerHeight", 11)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,0 L10,5 L0,10 z")
    .attr("fill", ([, color]) => color);
}

function arrowheadId(status) {
  return `arrowhead-${status.replace(/\s+/g, "-")}`;
}

// Draw arrows from a country to its partners and tint the partner countries.
// Called with (null, null) to remove everything.
function showRelations(country, data) {
  const relations = country && data ? data.relations : [];
  const arrows = relations
    .filter((relation) => countriesByIso3.has(relation.partner))
    .map((relation) => ({ relation, from: country, to: countriesByIso3.get(relation.partner) }));
  const partnerIds = new Set(arrows.map((arrow) => arrow.relation.partner));

  mapLayer.selectAll(".country").classed("partner", (d) => partnerIds.has(d.iso3));

  // Each arrow is a white outline with the coloured line on top, so it stays visible on any background
  const groups = arrowLayer.selectAll(".arrow")
    .data(arrows, (arrow) => arrow.relation.partner)
    .join((enter) => {
      const group = enter.append("g").attr("class", "arrow");
      group.append("path").attr("class", "arrow-casing");
      group.append("path").attr("class", "arrow-line");
      // Wide invisible line that makes the arrow easy to click
      group.append("path")
        .attr("class", "arrow-hit")
        .on("pointerenter", (event, arrow) => focusPartner(arrow.relation.partner))
        .on("pointerleave", () => focusPartner(null))
        .on("click", (event, arrow) => openRelation(arrow.relation.partner));
      return group;
    });
  groups.select(".arrow-casing")
    .attr("stroke-width", (arrow) => INFLUENCE_WIDTHS[arrow.relation.influence] + 2.5);
  groups.select(".arrow-line")
    .attr("stroke", (arrow) => STATUS_COLORS[arrow.relation.status])
    .attr("stroke-width", (arrow) => INFLUENCE_WIDTHS[arrow.relation.influence])
    .attr("marker-end", (arrow) => `url(#${arrowheadId(arrow.relation.status)})`);

  // Arrows can only be clicked once a country is selected, so the hover preview is not disturbed
  arrowLayer.classed("clickable", selectedCountry !== null);
  updateArrowPositions();
  legend.hidden = arrows.length === 0;
  focusPartner(null);
}

// Recalculate the curve of every arrow for the current map size and zoom
function updateArrowPositions() {
  arrowLayer.selectAll(".arrow path").attr("d", (arrow) => arrowPath(arrow.from, arrow.to));
}

// A curved line that bends upwards (towards the north), like a flight route
function arrowPath(from, to) {
  const [x1, y1] = zoomTransform.apply(projection(from.anchor));
  const [x2, y2] = zoomTransform.apply(projection(to.anchor));
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy) || 1;
  let normalX = -dy / distance;
  let normalY = dx / distance;
  if (normalY > 0) {
    normalX = -normalX;
    normalY = -normalY;
  }
  const bend = distance * 0.2;
  const controlX = (x1 + x2) / 2 + normalX * bend;
  const controlY = (y1 + y2) / 2 + normalY * bend;
  return `M${x1},${y1} Q${controlX},${controlY} ${x2},${y2}`;
}

// Make one partner's arrow and country stand out. With null, the partner whose profile is open
// stays highlighted; if no profile is open, all arrows are shown normally.
function focusPartner(iso3) {
  const target = iso3 || openPartner;
  const hasArrow = !arrowLayer.selectAll(".arrow").filter((arrow) => arrow.relation.partner === target).empty();
  const active = target && hasArrow ? target : null;
  arrowLayer.classed("has-focus", active !== null);
  arrowLayer.selectAll(".arrow").classed("active", (arrow) => arrow.relation.partner === active);
  mapLayer.selectAll(".country").classed("partner-focus", (d) => active !== null && d.iso3 === active);
  panelContent.querySelectorAll(".relation-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.partner === active);
  });
}

// ---------- Legend ----------

function buildLegend() {
  const title = document.createElement("strong");
  title.textContent = "Relationship status";

  const list = document.createElement("ul");
  Object.entries(STATUS_COLORS).forEach(([status, color]) => {
    const item = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.background = color;
    item.append(swatch, status);
    list.append(item);
  });

  const widthNote = document.createElement("p");
  widthNote.textContent = "Thicker arrow = more influence";

  legend.append(title, list, widthNote);
}

// ---------- Tooltip ----------

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
