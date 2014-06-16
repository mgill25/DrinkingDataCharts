$(function() {
  var margin = {top: 10, right: 80, bottom: 440, left: 290},
      width = 870 - margin.left - margin.right + 250,
      height = 895 - margin.top - margin.bottom;

  var percentFormat = d3.format("0.%");       // TODO
  var dollarFormat = d3.format("$");

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], 0.1, 1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(dollarFormat);

  var toggle, sortTimeout;

  function getMetricName(metricType) {
    // Return the full metric name for display
    if (metricType === "pi") {
      return "Price Index";
    } else if (metricType === "di") {
      return "Drinkers Index";
    } else if (metricType === "ai") {
      return "Accessibility Index";
    } else if (metricType === "places_pc") {
      return "Drinking Places (per capita)";
    } else if (metricType === "places") {
      return  "Drinking Places";
    } else if (metricType === "shops_pc") {
      return "Liquor Shops (per capita)";
    } else if (metricType === "ge_one") {
      return "> 1 Drink";
    } else if (metricType === "shops") {
      return "Number of Liquor Shops";
    } else if (metricType === "bingers") {
      return "Binge Drinkers";
    } else if (metricType === "heavy") {
      return "Heavy Drinkers";
    } else {
      return metricType;
    }
  }
 
  // Create the SVG element
  function createSVGElement(elementName, sectionType) {
    var svg = d3.select("body")
                .select("section")
                .append("svg")
                .attr("width", width + margin.left + margin.right - 100)
                .attr("height", height + margin.top + margin.bottom + 100)
                .attr("class", sectionType)
                .attr("id", elementName)
                .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    /*
    // Metric Title
    var titleText = getMetricName(elementName);
    svg.append("text")
      .attr("class", "title")
      .attr("id", elementName + "-title")
      .attr("dy", "1.20em")
      .attr("text-anchor", "middle")
      .attr("transform", "translate("+ (width + 20) +"," + ((height/3) + 30) + ")")
      .text(titleText.charAt(0).toUpperCase() + titleText.slice(1))
    */
    return svg;
  }

  // ********** Meat of the chart rendering ************ //
  function renderData(data, svg, metricType, sectionType) {
    // Setup some variables
    var yLabelText, yTickFormat;
    if (sectionType !== "price") {
      yTickFormat = percentFormat;
    } else {
      yLabelText = "Price";
      yTickFormat = dollarFormat;
    }

    // Main Heading 
    var headingText;
    if (sectionType === "price") {
      headingText = "Alcohol Prices";
    } else if (sectionType === "booze") {
      headingText = "Booze Culture";
    } else if (sectionType === "liquor") {
      headingText = "Liquor Shops";
    }

    /*
    var mainTitle = svg.append("text")
        .attr("class", "heading")
        .attr("dy", ".10em")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ (width + 20) +"," + (height/3) + ")")  // centre below axis
        .text(headingText.charAt(0).toUpperCase() + headingText.slice(1))
    */

    var rectangle = svg.append("rect")
        .attr("class", "rectangle")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 20)
        .attr("height", 10)
        .style({"fill": "#2E86A5"})
        // .style({"width": "20px", "height": "10px", "background": "FireBrick"})
        .attr("transform", "translate(" + (width/2 - 40) + "," + (height + 180) + ")")
      
    var label = svg.append("text")
        .attr("transform", "translate(" + (width/2) + "," + (height + 200) + ")")
        .text("Denver")
        .style({"color": "white"});

    // Setup the tooltip
    var prefix;
    var tip = d3.tip()
      .attr("class", "d3-tip")
      .offset([-10, 0])
      .html(function(d) {
        if (sectionType === "price") {
          prefix = "$";
        } else {
          prefix = "";
        }
        return "<strong>" + d.city + "</strong> <span style='color:aliceblue'>" + prefix + d[metricType] + "</span>";
      })

    svg.call(tip);

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
    /*
    function sortUpdate(sectionType) {
      sortTimeout = setTimeout(function() {
        d3.select("input").property("checked", true).each(change);
      }, 500);
    }
    */

    function change(toggle) {
      // clearTimeout(sortTimeout);     // We're no longer using the setTimeout way

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
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate("+ (width/2) +","+(height + 100)+")")  // centre below axis
      .text("States")
      .style({"color": "white"});

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)

      /*
      .append("text")
        .attr("class", "y label")
        // .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("dy", "-5px")
        .attr("text-anchor", "end")
        .text("Price")
        .style({"font-size": "15px"}); */

    

    svg.append("text")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate(-45" +","+(height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
        .text(yLabelText)
        .style({"color": "white"});

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

    d3.selectAll(".clickable").on("click", function() {
      // Make sure all items are normal weight at the beginning
      d3.selectAll("li").style({"font-weight": "normal"});
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

      // Update text
      /*
      var titleText = getMetricName(metricType);
      d3.select("section")
        .select(".title")
        .text(titleText.charAt(0).toUpperCase() + titleText.slice(1));
      */

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
  // var section2 = createSVGElement("ge_one", "booze");
  // var section3 = createSVGElement("shops", "liquor");

  // Load the data and render the charts.
  d3.csv("booze.csv", function(error, data) {
    renderData(data, section1, "pi", "price");
    // renderData(data, section2, "ge_one", "booze");
    // renderData(data, section3, "shops", "liquor");
  });
})
