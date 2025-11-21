var dataset = [];

var selectedCountries = ["Vietnam", "US", "France"];
var startDate = new Date("2020-03-31");
var endDate = new Date("2020-05-01");

d3.csv(
    "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv"
)
    .then(function (data) {
        data.forEach(function (d) {
            var country = d["Country/Region"];

            if (
                selectedCountries.includes(country) &&
                d["Province/State"] === ""
            ) {
                var countryData = {
                    country: country,
                    values: [],
                };

                Object.entries(d).forEach(function ([key, value]) {
                    if (
                        key !== "Country/Region" &&
                        key !== "Lat" &&
                        key !== "Long" &&
                        key !== "Province/State"
                    ) {
                        var date = new Date(key);

                        if (date >= startDate && date <= endDate) {
                            countryData.values.push({
                                date: new Date(key),
                                cases: parseInt(value),
                            });
                        }
                    }
                });

                dataset.push(countryData);
            }
        });

        draw();
    })
    .catch(function (error) {
        console.error("Error loading data:", error);
    });

function draw() {
    var width = 800;
    var height = 600;

    var padding = 15;
    var xAxisPadding = 40;
    var yAxisPadding = 65;
    var legendSpace = 100;

    // scale x, y
    var maxCases = d3.max(
        dataset.flatMap((country) => country.values),
        function (d) {
            return d.cases;
        }
    );
    var xScale = d3
        .scaleTime()
        .domain([startDate, endDate])
        .range([yAxisPadding / 1.3, width - padding - legendSpace]);
    var yScale = d3
        .scaleLinear()
        .domain([0, maxCases])
        .range([height - xAxisPadding, padding]);

    // define line generator
    var line = d3
        .line()
        .x(function (d) {
            return xScale(d.date);
        })
        .y(function (d) {
            return yScale(d.cases);
        });

    // Define a custom color scale
    var colorScale = ["red", "blue", "green"];

    // define svg
    var svg = d3
        .select("#chart")
        .append("svg")
        .attr("height", height)
        .attr("width", width);

    // create a container for the focus elements
    var focusContainer = svg.append("g").style("display", "none");

    // define the legends container
    var legends = svg
        .append("g")
        .attr("transform", "translate(" + (width - legendSpace) + ", 20)");

    // draw line chart for each country
    dataset.forEach(function (countryData, i) {
        var country = countryData.country;
        var countryValues = countryData.values;

        // set specific colors for each country
        var lineColor;
        switch (country) {
            case "France":
                lineColor = "red";
                break;
            case "US":
                lineColor = "blue";
                break;
            case "Vietnam":
                lineColor = "green";
                break;
            default:
                lineColor = colorScale[i % colorScale.length];
        }

        // create line
        svg
            .append("path")
            .datum(countryValues)
            .attr("class", "line line-" + country)
            .attr("fill", "none")
            .attr("stroke", lineColor)
            .attr("stroke-width", 2)
            .attr("d", line);

        // create focus for each line
        var focus = focusContainer.append("g").style("opacity", 0);

        var focusCircleColor;
        if (country === "France") {
            focusCircleColor = "red";
        } else if (country === "US") {
            focusCircleColor = "blue";
        } else if (country === "Vietnam") {
            focusCircleColor = "green";
        } else {
            focusCircleColor = colorScale[i % colorScale.length];
        }

        focus
            .append("circle")
            .style("fill", "none")
            .attr("stroke", focusCircleColor)
            .attr("stroke-width", 2)
            .attr("r", 8.5);

        focus.append("text").attr("dy", "-1em").attr("dx", "-2em");
        focus
            .append("text")
            .attr("dy", "-2em")
            .attr("dx", "-2em")
            .append("tspan")
            .attr("class", "focus-date");
        // create legend for each line
        var legend = legends
            .append("g")
            .attr("transform", "translate(0, " + i * 20 + ")")
            .style("cursor", "pointer")
            .on("mouseover", legendMouseover)
            .on("mouseout", legendMouseout);

        legend
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", colorScale[i % colorScale.length]);

        legend.append("text").attr("x", 15).attr("y", 10).text(country);

        function legendMouseover() {
            svg.selectAll(".line").style("opacity", 0.2);

            svg.select(".line-" + country).style("opacity", 1);
        }

        function legendMouseout() {
            svg.selectAll(".line").style("opacity", 1);
        }
    });

    svg
        .append("rect")
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr("width", width - legendSpace)
        .attr("height", height)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout);

    var bisectDate = d3.bisector(function (d) {
        return d.date;
    }).left;

    function mouseover() {
        focusContainer.style("display", null);
    }

    function mousemove(event) {
        var mouseX = d3.pointer(event)[0];

        dataset.forEach(function (countryData, i) {
            var countryValues = countryData.values;
            var index = bisectDate(countryValues, xScale.invert(mouseX), 1);
            var closestDataPoint = countryValues[index];

            var focus = focusContainer.selectAll("g").filter(function (d, j) {
                return i === j;
            });
            focus;
            focus
                .attr(
                    "transform",
                    "translate(" +
                    xScale(closestDataPoint.date) +
                    "," +
                    yScale(closestDataPoint.cases) +
                    ")"
                )
                .style("opacity", 1);

            focus
                .select("text")
                .text(
                    countryData.country + ": " + + closestDataPoint.cases + " Cases");
        });
    }

    function mouseout() {
        focusContainer.style("display", "none");
    }

    // define axis
    var xAxis = d3
        .axisBottom(xScale)
        .tickFormat(d3.timeFormat("%b %d"))
        .ticks(d3.timeDay.every(2));
    var yAxis = d3.axisLeft(yScale).ticks();

    // add x axis
    svg
        .append("g")
        .attr("transform", "translate(0," + (height - xAxisPadding) + ")")
        .call(xAxis);

    // add x axis label
    svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", (width - legendSpace) / 2)
        .attr("y", height)
        .text("Date")
        .attr("font-size", "15px");

    // add y axis
    svg
        .append("g")
        .attr("transform", "translate(" + yAxisPadding + ",0)")
        .call(yAxis);

    // add y axis labels
    svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", -height / 2)
        .attr("y", 10)
        .attr("transform", "rotate(-90)")
        .text("Number of Confirmed Cases")
        .attr("font-size", "15px");
}