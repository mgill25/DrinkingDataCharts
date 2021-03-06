$(function() {
  var sectionWidth = $(document).width() - 270,
      // sectionHeight = $("#chart-section").height(),
      sectionHeight = $(document).height() - 43,
      margin = {top: 10, right: 20, bottom: 240, left: 100},
      width = sectionWidth - margin.left - margin.right,
      height = sectionHeight - margin.top - margin.bottom;

  // Keep the SVG container to the right-side of the page!
  d3.select("#chart-section")
    .attr("width", sectionWidth)
    .attr("height", sectionHeight)
    .style({"float": "left"});

  var dollarFormat = d3.format("$")
    , prefix = "$"
    , postfix = "";
  
  var yLabelText
    , yTickFormat = dollarFormat;         // default is $

  var transformWidth = margin.left + margin.right + 20
    , transformHeight = margin.top;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width - transformWidth], 0.1, 1);

  var y = d3.scale.linear()
      .range([height - transformHeight, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(dollarFormat);

  var toggle, sortTimeout;

  // Create the SVG element
  function createSVGElement(elementName, sectionType) {
    var totalWidth = width + margin.left + margin.right
      , totalHeight = height + margin.top + margin.bottom;

    console.log("Total SVG width: " + totalWidth);
    console.log("Total SVG Height: " + totalHeight);

    var svg = d3.select("body")
                .select("section")
                .append("svg")
                .attr("width", totalWidth)
                .attr("height", totalHeight)
                .attr("viewbox", "0 0 " + totalWidth + " " + totalHeight)
                .attr("preserveAspectRatio", "xMidYMid")
                .attr("class", sectionType)
                .attr("id", elementName)
                .append("g")
                  .attr("transform", "translate(" + transformWidth + "," + transformHeight + ")");

    return svg;
  }

  // ********** Meat of the chart rendering ************ //
  function renderData(data, svg, metricType, sectionType) {
    // Main Heading 
    var headingText;
    if (sectionType === "price") {
      headingText = "Alcohol Prices";
    } else if (sectionType === "booze") {
      headingText = "Booze Culture";
    } else if (sectionType === "liquor") {
      headingText = "Liquor Shops";
    }

    // Denver label Stuff
    var rectangle = svg.append("rect")
        .attr("class", "rectangle")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 15)
        .attr("height", 10)
        .style({"fill": "#2E86A5"})
        .attr("transform", "translate(" + (width/2 - 40) + "," + (height + 120) + ")")
      
    var label = svg.append("text")
        .attr("transform", "translate(" + (width/2) + "," + (height + 140) + ")")
        .text("Denver")
        .style({"color": "white"});

    // Setup the tooltip
    var tip = d3.tip()
      .attr("class", "d3-tip")
      .offset([-10, 0])
      .html(function(d) {
        return "<strong>" + d.city + "</strong> <span style='color:aliceblue'>" + prefix + d[metricType] + postfix + "</span>";
      })

    svg.call(tip);

    // Get the data
    data.forEach(function(d) {
      d.city = d.city;
      // Price
      d.beer = +d.beer;
      d.wine = +d.wine;
      d.pi = +d.pi;
      // Booze
      d.ge_one = +d.ge_one;
      d.bingers = +d.bingers;
      d.heavy = +d.heavy;
      // Liquor Shops
      d.shops = +d.shops;
      d.shops_pc = +d.shops_per_capita;
      d.places = +d.drinking_places;
      d.places_pc = +d.drinking_places_per_capita;
      d.CBSA = +d.CBSA_population;
      d.ai = +d.ai;
    });

    // *** Update Transition Functions *** //

    function change(toggle) {
      // Copy-on-write since tweens are evaluated after a delay.
      var x0 = x.domain(data.sort(toggle
          ? function(a, b) { return b[metricType] - a[metricType]; }
          : function(a, b) { return d3.ascending(a.city, b.city); })
          .map(function(d) { return d.city; }))
          .copy();

      // Sorting transition
      var transition = svg.transition().duration(50),
          delay = function(d, i) { return i * 25; };

      transition.selectAll(".bar")
          .delay(delay)
          .attr("x", function(d) { return x0(d.city); });

      transition.select(".x.axis")
          .call(xAxis)
        .selectAll("g")
          .delay(delay);
    }

    // Setup the domain
    x.domain(data.map(function(d) { return d.city; }));
    y.domain([0, d3.max(data, function(d) { return d[metricType]; })]);

    // Create the Chart
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        // Rotate the x-axis text labels, so they don't look crowded
        .selectAll("text")
              .style("text-anchor", "end")
              .style("font-weight", "normal")
              // Will have to fiddle with these settings a bit!
              .attr("dx", "-0.8em")
              .attr("dy", "0.5em")
              .attr("transform", function(d) {
                // first move the text left so no longer centered on the tick
                // then rotate up to get 45 degrees
                return "translate(" + this.getBBox().height * -2.7 + "," + this.getBBox().height* + 1.7 + ")" + "rotate(-45)"
              })

    yAxis.tickFormat(yTickFormat);

    svg.append("text")
      .attr("id", "xLabelText")
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate("+ (width/2) +","+(height + 100)+")")  // centre below axis
      .text("States")
      .style({"color": "white"});

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

    svg.append("text")
        .attr("id", "yLabelText")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate(-45" +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
        .text("Price")
        .style({"color": "white"});

    // Bars of the chart!
    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.city); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) {
          return y(d[metricType]);
        })
        .attr("height", function(d) {
            return height - y(d[metricType]);
          })
        .attr("style", function(d) {
          // highlight Denver
          if (d.city === "Denver") {
            return "fill: #2E86A5";
          }
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);
    change(true);

    // Update chart on click
    d3.selectAll(".clickable").on("click", function() {
      // Make sure all items are normal weight at the beginning

      if (d3.select(this).node().parentNode.className === "price") {
        yTickFormat = dollarFormat;
        yLabelText = "Price";
        prefix = "$";
        postfix = "";
      } else if (d3.select(this).attr("class") === "clickable percentage") {
        yTickFormat = function(d) {
          return parseInt(d, 10) + "%";
        };
        yLabelText = this.innerText;
        prefix = "";
        postfix = "%";
      } else {
        yTickFormat = d3.format("");
        yLabelText = this.innerText;
        prefix = "";
        postfix = "";
      }
      d3.select("#yLabelText").text(yLabelText).style({"font-weight": "normal", "font-family": "Source Sans Pro"});

      d3.selectAll("li").style({"font-weight": "100"});
      if (d3.event.defaultPrevented) {
        console.log("Click Supressed!!!");
        return;
      } else {
        metricType = this.id.split("-")[0];
        // Now make the selection bold!
        d3.select(this).style({"font-weight": "bold"}); 
        updateChart(metricType, data);
      }
    });


    // Update function that performs the animated transition.
    function updateChart(metricType, data) {

      // Update the domain based on the new metric.
      y.domain([0, d3.max(data, function(d) {
        return d[metricType];
      })]);

      // Re-draw the scale
      var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(yTickFormat);

      // Re-adjust the Y-axis 
      svg.selectAll(".bar")
        .attr("y", function(d) {
            return y(d[metricType]);
          })
        .attr("height", function(d) {
          // console.log('updating height to: ' + y(d[metricType]));
          return height - y(d[metricType]);
        })

      var transition = svg.transition().duration(350);

      transition.selectAll(".bar")
          .attr("y", function(d) { return y(d[metricType]); });

      transition.selectAll(".y.axis")
          .call(yAxis);
   
      // Call update transitions 
      // Ensure sort is false when switching
      toggle = true;
      change(toggle);
    }
  }

  // Create the SVG Elements
  var section1 = createSVGElement("pi", "price");

  // Load the data and render the charts.
  d3.csv("booze.csv", function(error, data) {
    renderData(data, section1, "pi", "price");

    /******************************/
    // SVG Responsive Stuff
    // Ref: http://stackoverflow.com/a/9539361/850898 
    var chart = $("svg")
      , aspect = chart.width() / chart.height()
      , container = chart.parent();

    var chart = d3.select("svg");

    function resize() {
      // var targetWidth = container.width();
      var barWidth = 12                         // Like it was in default.
        , yLabelWidth = 20
        , yAxisWidth = 50
        , yBuffer = 100;

      console.log(x.rangeBand());

      var targetWidth = (barWidth * 50) + yLabelWidth + yAxisWidth + yBuffer;
      console.log("Target width: " + targetWidth);

      d3.select("svg")
        .attr("width", targetWidth);

      chart.attr("height", Math.round(targetWidth / aspect));

      // Resize the scale
      x.range([0, width]);

      // Resize ALL the things!
      margin.left = 100;
      margin.right = 20;
      d3.select(chart.node().parentNode)
        .style('width', (targetWidth + margin.left + margin.right) + 'px');

      // update axes
      chart.select('.x.axis.top').call(xAxis.orient('top'));
      chart.select('.x.axis.bottom').call(xAxis.orient('bottom'));
    }

    // d3.select(window).on("resize", resize);

  });
})
