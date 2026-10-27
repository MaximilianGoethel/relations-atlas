// Relations Atlas: draws the world map and shows country names on hover.

// Country borders from Natural Earth (via the world-atlas package)
const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json";

// Antarctica (numeric code 010) is left out to give the other countries more space
const HIDDEN_IDS = new Set(["010"]);

const container = document.getElementById("map-container");
const statusText = document.getElementById("map-status");
const tooltip = document.getElementById("tooltip");
const svg = d3.select("#map");

// Everything inside this group moves together when zooming
const mapLayer = svg.append("g");

let countries = [];

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath(projection);

// Zoom with mouse wheel / pinch, move by dragging
const zoom = d3.zoom()
  .scaleExtent([1, 12])
  .on("zoom", (event) => {
    mapLayer.attr("transform", event.transform);
  });
svg.call(zoom);

d3.json(WORLD_URL)
  .then((world) => {
    countries = topojson
      .feature(world, world.objects.countries)
      .features.filter((country) => !HIDDEN_IDS.has(country.id));

    // One shape per country
    mapLayer.selectAll(".country")
      .data(countries)
      .join("path")
      .attr("class", "country")
      .on("pointerenter", (event, country) => showTooltip(event, country.properties.name))
      .on("pointermove", moveTooltip)
      .on("pointerleave", hideTooltip);

    statusText.remove();
    resizeMap();
    window.addEventListener("resize", resizeMap);
  })
  .catch((error) => {
    console.error(error);
    statusText.textContent = "The map could not be loaded. Please check your internet connection and reload.";
  });

// Fit the map to the current size of the screen
function resizeMap() {
  const { width, height } = container.getBoundingClientRect();
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  projection.fitExtent([[10, 10], [width - 10, height - 10]], { type: "FeatureCollection", features: countries });
  mapLayer.selectAll("path").attr("d", path);
}

function showTooltip(event, name) {
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
