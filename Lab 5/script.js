const dataUrl =
  "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/" +
  "csse_covid_19_data/csse_covid_19_time_series/" +
  "time_series_covid19_confirmed_global.csv";

const dateColumn = "4/5/20";

const margin = { top: 40, right: 40, bottom: 60, left: 70 },
      width  = 900 - margin.left - margin.right,
      height = 500 - margin.top  - margin.bottom;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width",  width  + margin.left + margin.right)
  .attr("height", height + margin.top  + margin.bottom);

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

d3.csv(dataUrl, d3.autoType).then(data => {

  data = data.filter(d => d.Lat != null && d.Long != null);

  const maxCases = d3.max(data, d => d[dateColumn]);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Long)).nice()
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Lat)).nice()
    .range([height, 0]);

  const opacity = d3.scaleSqrt()
    .domain([0, maxCases])
    .range([0.3, 1]);     

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .call(d3.axisLeft(y));

  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.Long))
    .attr("cy", d => y(d.Lat))
    .attr("r", 6)                     
    .attr("fill", "#0b4fa8")            
    .attr("fill-opacity", d => opacity(d[dateColumn]))
    .on("mouseover", function(event, d) {

      const cx = x(d.Long);
      const cy = y(d.Lat);
      const rect = svg.node().getBoundingClientRect();

      const pageX = rect.left + window.scrollX + margin.left + cx;
      const pageY = rect.top  + window.scrollY + margin.top  + cy;

      tooltip
        .style("opacity", 1)
        .style("left", (pageX + 10) + "px")
        .style("top",  (pageY - 30) + "px")
        .html(
          `Country: ${d["Country/Region"]}<br>` +
          `Latitude: ${d.Lat}<br>` +
          `Longitude: ${d.Long}<br>` +
          `Confirmed cases: ${d[dateColumn]}`
        );
    })
    .on("mouseout", () => tooltip.style("opacity", 0));
});
