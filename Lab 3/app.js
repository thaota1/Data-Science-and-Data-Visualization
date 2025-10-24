const svg = d3.select("#scatter");
const width = +svg.attr("width");
const height = +svg.attr("height");
const margin = { top: 16, right: 20, bottom: 44, left: 56 };
const iw = width - margin.left - margin.right;
const ih = height - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// sửa cột 
const firstDefined = (row, keys) => {
  for (const k of keys) if (row[k] != null && row[k] !== "") return row[k];
  return undefined;
};
// convert comma to dot for decimals
const num = v => (v == null || v === "" ? NaN : +String(v).replace(",", "."));
// Load CSV
const URL = "https://tungth.github.io/data/vn-provinces-data.csv";
d3.csv(URL).then(raw => {
  // Map fields (robust to header variants)
  const data = raw.map(r => {
    const name = firstDefined(r, ["Province","province","Name","name","Tỉnh/TP","Tinh/TP"]) || "Unknown";
    const population = num(firstDefined(r, [
      "Population (thousand people)","Population","population","Population (thousand)",
      "Dân số (nghìn người)","Dân số","dan_so","danso","dan so"
    ]));
    const grdp = num(firstDefined(r, [
      "GRDP-VND (million VND/person/year)","GRDP-VND","grdp-vnd","GRDP (VND)",
      "GRDP (triệu VND/người/năm)","GRDP (VND/người/năm)"
    ]));
    const area = num(firstDefined(r, [
      "Area (km2)","Area","area","area_km2","Diện tích (km2)","Diện tích","dien_tich","Dien tich"
    ]));
    const density = num(firstDefined(r, [
      "Density (person per km2)","Density","density","population_density",
      "Mật độ dân số (người/km2)","Mật độ dân số","Mat do dan so","mat_do","mat do"
    ]));
    return { name, population, grdp, area, density };
  }).filter(d => d.population != null && d.grdp != null);

  // Scales
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.population) * 1.05]).nice()
    .range([0, iw]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.grdp) * 1.05]).nice()
    .range([ih, 0]);

  // Radius so circle AREA proportional to province AREA
  const areaVals = data.map(d => d.area).filter(v => v != null);
  const r = d3.scaleSqrt()
    .domain(areaVals.length ? d3.extent(areaVals) : [1, 1])
    .range([3, 18]);

  // Discrete blues by density
  const densityVals = data.map(d => d.density || 1);
  const color = d3.scaleQuantile()
  .domain(densityVals)
  .range(["#08306B", "#1570c0ff", "rgba(103, 173, 214, 1)", "#53708bff"]);

  // Axes
  g.append("g") 
    .attr("class", "axis")
    .attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.format(",")));

  g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format(",")));

  // Axis labels
  g.append("text")
    .attr("x", iw / 2)
    .attr("y", ih + 36)
    .attr("text-anchor", "middle")
    .attr("fill", "#333")
    .text("POPULATION");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -ih / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .attr("fill", "#333")
    .text("GRDP-VND");

  // Points (simple <title> tooltips keep it pure D3/SVG)
  g.selectAll("circle")
    .data(data)
    .join("circle")
      .attr("cx", d => x(d.population))
      .attr("cy", d => y(d.grdp))
      .attr("r", d => (d.area != null ? r(d.area) : 5))
      .attr("fill", d => (d.density != null ? color(d.density) : d3.schemeBlues[5][2]))
      .attr("opacity", 0.9)
      .append("title")
        .text(d =>
`${d.name}
Population: ${d3.format(",")(d.population)}
GRDP-VND: ${d3.format(",")(d.grdp)}
Area: ${d.area ?? "?"} km²
Density: ${d.density ?? "?"}/km²`);
}).catch(err => console.error("CSV load error:", err));
