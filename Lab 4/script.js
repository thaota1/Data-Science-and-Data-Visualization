// CONFIG
const csvUrl = "https://tungth.github.io/data/vn-provinces-data.csv";

const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");

const margin = { top: 60, right: 150, bottom: 60, left: 160 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// title
svg.append("text")
  .attr("class", "chart-title")
  .attr("x", width / 2)
  .attr("y", 30)
  .attr("text-anchor", "middle")
  .text("Horizontal Bar Chart of GRDP in VND by Province");

// axis groups
const xAxisG = g.append("g")
  .attr("class", "axis x-axis")
  .attr("transform", `translate(0,${innerHeight})`);

const yAxisG = g.append("g")
  .attr("class", "axis y-axis");

// axis labels
g.append("text")
  .attr("class", "axis-label")
  .attr("x", innerWidth / 2)
  .attr("y", innerHeight + 40)
  .attr("text-anchor", "middle")
  .text("GRDP in VND");

g.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -innerHeight / 2)
  .attr("y", -margin.left + 40)
  .attr("text-anchor", "middle")
  .text("Sorted by GRDP in VND");

// scales
const xScale = d3.scaleLinear().range([0, innerWidth]);
const yScale = d3.scaleBand().range([0, innerHeight]).padding(0.2);

// state
let allData = [];
let currentData = [];
let originalOrder = [];
let nextIndex = 0;

// LOAD DATA 
function rowConverter(row) {
  const province = row.Province || row.province || row.Name;

  const raw =
    row["GRDP-VND"] ||
    row["GRDP_VND"] ||
    row["GRDP"] ||
    row["GRDP (VND)"] ||
    "";
  const grdp = parseFloat(String(raw).replace(",", "."));

  return { province, grdp };
}

d3.csv(csvUrl, rowConverter).then(data => {
  allData = data.filter(d => d.province && !isNaN(d.grdp));

  // 20 provinces sorted high to low 
  currentData = allData.slice(0, 20).sort((a, b) => b.grdp - a.grdp);
  originalOrder = currentData.slice();
  nextIndex = 20;

  updateChart();
}).catch(err => console.error("CSV load error:", err));

// CONTROLS
d3.select("#add-btn").on("click", () => {
  if (nextIndex >= allData.length) return;
  const item = allData[nextIndex];
  currentData.push(item);
  originalOrder.push(item);
  nextIndex++;
  applySort();
});

d3.select("#remove-btn").on("click", () => {
  if (!currentData.length) return;
  const removed = currentData.pop();
  originalOrder = originalOrder.filter(d => d.province !== removed.province);
  applySort();
});

d3.select("#sort-select").on("change", () => applySort());

function applySort() {
  const criterion = d3.select("#sort-select").property("value");
  sortData(criterion);
  updateChart();
}

function sortData(criterion) {
  switch (criterion) {
    case "name-asc":
      currentData.sort((a, b) => d3.ascending(a.province, b.province));
      break;
    case "grdp-desc":
      currentData.sort((a, b) => d3.descending(a.grdp, b.grdp));
      break;
    case "grdp-asc":
      currentData.sort((a, b) => d3.ascending(a.grdp, b.grdp));
      break;
    case "original":
    default:
      currentData.sort(
        (a, b) =>
          originalOrderIndex(a.province) - originalOrderIndex(b.province)
      );
  }
}

function originalOrderIndex(name) {
  return originalOrder.findIndex(d => d.province === name);
}

// DRAW / UPDATE 
function updateChart() {
  if (!currentData.length) return;

  const maxGRDP = d3.max(currentData, d => d.grdp);
  const minGRDP = d3.min(currentData, d => d.grdp);

  xScale.domain([0, maxGRDP * 1.1]);
  yScale.domain(currentData.map(d => d.province));

  // Gradient red to yellow max = red, -> min = yellow
  const colorScale = d3.scaleLinear()
    .domain([minGRDP, maxGRDP])
    .range(["#ffe082", "#7f001f"]);

  // BARS 
  const bars = g.selectAll(".bar")
    .data(currentData, d => d.province); // key = province

  // EXIT
  bars.exit()
    .transition().duration(500)
    .on("start", function () {
      d3.select(this).style("fill-opacity", 0.6);
    })
    .attr("width", 0)
    .style("fill-opacity", 0)
    .remove();

  // ENTER
  const barsEnter = bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", d => yScale(d.province))
    .attr("height", yScale.bandwidth())
    .attr("width", 0)
    .style("fill", d => colorScale(d.grdp));

  // UPDATE + ENTER MERGE
  barsEnter.merge(bars)
    .transition().duration(800)
    .on("start", function () {
      d3.select(this)
        .style("stroke", "#ffffff")
        .style("stroke-width", 1.2);
    })
    .attr("y", d => yScale(d.province))
    .attr("height", yScale.bandwidth())
    .attr("width", d => xScale(d.grdp))
    .style("fill", d => colorScale(d.grdp))
    .on("end", function () {
      d3.select(this).style("stroke", "none");
    });

  // ----- PROVINCE NAME: NEXT TO THE BAR -----
  const nameLabels = g.selectAll(".bar-label")
    .data(currentData, d => d.province);

  nameLabels.exit()
    .transition().duration(500)
    .style("fill-opacity", 0)
    .remove();

  const nameEnter = nameLabels.enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("dy", "0.35em")
    .style("fill-opacity", 0);

  nameEnter.merge(nameLabels)
    .text(d => d.province)
    .transition().duration(800)
    .attr("x", d => xScale(d.grdp) + 5) // NEXT TO THE BARS
    .attr("y", d => yScale(d.province) + yScale.bandwidth() / 2)
    .attr("text-anchor", "start")
    .style("fill-opacity", 1);

  // ----- Y AXIS = GRDP VALUE -----
  // EACH tick corresponds to 1 province, label= GRDP value
  const formatGRDP = d3.format(".2f");
  yAxisG.transition().duration(800)
    .call(
      d3.axisLeft(yScale)
        .tickFormat(province => {
          const item = currentData.find(d => d.province === province);
          return item ? formatGRDP(item.grdp) : "";
        })
    );

  // ----- X AXIS -----
  xAxisG.transition().duration(800)
    .call(d3.axisBottom(xScale).ticks(10));
}
