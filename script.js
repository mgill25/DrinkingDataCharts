$(function() {
  var margin = {top: 75, right: 40, bottom: 140, left: 90},
      width = 970 - margin.left - margin.right,
      height = 695 - margin.top - margin.bottom;

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

  var sortTimeout;

  // Append a heading
  /* d3.select("body").append("h3")
    .text("Alcohol Price - lower is better")
    .style("font-weight", "normal"); */

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
      return "Liquor Shops";
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
                .select("#" + sectionType + "-section")
                .append("svg")
                .attr("width", width + margin.left + margin.right + 200)
                .attr("height", height + margin.top + margin.bottom)
                .attr("class", sectionType)
                .attr("id", elementName)
                .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var titleText = getMetricName(elementName);
    // Metric Title
    svg.append("text")
      .attr("class", "title")
      .attr("id", elementName + "-title")
      .attr("dy", "1.20em")
      .attr("text-anchor", "middle")
      .attr("transform", "translate("+ (width + 60) +",0)")
      .text(titleText.charAt(0).toUpperCase() + titleText.slice(1))

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

    var mainTitle = svg.append("text")
        .attr("class", "heading")
        .attr("dy", ".10em")
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ (width + 30) +",0)")  // centre below axis
        .text(headingText.charAt(0).toUpperCase() + headingText.slice(1))


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
    function sortUpdate(sectionType) {
      sortTimeout = setTimeout(function() {
        d3.select("#" + sectionType + "-section")
          .select("input").property("checked", true).each(change);
      }, 1000);
    }

    function change() {
      // clearTimeout(sortTimeout);     // We're no longer using the setTimeout way

      // Copy-on-write since tweens are evaluated after a delay.
      var x0 = x.domain(data.sort(this.checked
          ? function(a, b) { return b[metricType] - a[metricType]; }
          : function(a, b) { return d3.ascending(a.city, b.city); })
          .map(function(d) { return d.city; }))
          .copy();

      // Sorting transition
      var transition = svg.transition().duration(200),
          delay = function(d, i) { return i * 50; };

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
              .style("font-weight", "bold")
              // Will have to fiddle with these settings a bit!
              .attr("dx", "-.8em")
              .attr("dy", ".005em")
              .attr("transform", function(d) {
                // first move the text left so no longer centered on the tick
                // then rotate up to get 45 degrees
                return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height*+1.6 + ")" + "rotate(-45)"
              })

    yAxis.tickFormat(yTickFormat);

    svg.append("text")
      .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate("+ (width/2) +","+(height + 100)+")")  // centre below axis
      .text("States");

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
        .text(yLabelText);

    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.city); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) {
          // console.log('metricType: ' + metricType + ' value: ' + d[metricType]);
          return y(d[metricType]);
        })
        .attr("height", function(d) {
            return height - y(d[metricType]);
          })
        .attr("style", function(d) {
          // highlight Denver
          if (d.city === "Denver") {
            return "fill: FireBrick";
          }
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

    d3.select("#" + sectionType + "-section input").on("change", change);

    d3.select("#" + sectionType + "-section").selectAll("button").on("click", function() {
      if (d3.event.defaultPrevented) { 
        console.log("Click Supressed!!!");
        return;
      } else {
        metricType = this.id.split("-")[0];
        updateChart(metricType, data);
      }
    });

    // Update function that performs the animated transition.
    function updateChart(metricType, data) {
      // Ensure sort is false when switching
      d3.selectAll("#" + sectionType + "-section").select("input").property("checked", false);

      // Update text
      var titleText = getMetricName(metricType);
      d3.select("#" + sectionType + "-section")
        .select(".title")
        .text(titleText.charAt(0).toUpperCase() + titleText.slice(1));

      // Update the domain based on the new metric.
      y.domain([0, d3.max(data, function(d) {
        return d[metricType];
      })]);

      // Re-draw the scale
      var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(yTickFormat);

      // Re-adjust the Y-axis 
      svg.selectAll("rect")
        .attr("y", function(d) {
            // console.log('updating y to: ' + (height - y(d[metricType])));
            return y(d[metricType]);
          })
        .attr("height", function(d) {
          // console.log('updating height to: ' + y(d[metricType]));
          return height - y(d[metricType]);
        })

      var transition = svg.transition().duration(750);

      transition.selectAll(".bar")
          .attr("y", function(d) { return y(d[metricType]); });

      transition.selectAll(".y.axis")
          .call(yAxis);
   
      // Call update transitions 
      d3.select("#" + sectionType + "-section input").on("change", change);
    }
  }

  // Create the SVG Elements
  var section1 = createSVGElement("pi", "price");
  var section2 = createSVGElement("ge_one", "booze");
  var section3 = createSVGElement("shops", "liquor");

  // Load the data and render the charts.
  d3.csv("booze.csv", function(error, data) {
    renderData(data, section1, "pi", "price");
    renderData(data, section2, "ge_one", "booze");
    renderData(data, section3, "shops", "liquor");
  });


  // Onepage Scroll!
  $(".main").onepage_scroll({
    sectionContainer: "section",     // sectionContainer accepts any kind of selector in case you don't want to use section
    easing: "ease",                  // Easing options accepts the CSS3 easing animation such "ease", "linear", "ease-in", 
                                    // "ease-out", "ease-in-out", or even cubic bezier value such as "cubic-bezier(0.175, 0.885, 0.420, 1.310)"
    animationTime: 1000,             // AnimationTime let you define how long each section takes to animate
    pagination: true,                // You can either show or hide the pagination. Toggle true for show, false for hide.
    updateURL: false,                // Toggle this true if you want the URL to be updated automatically when the user scroll to each page.
    beforeMove: function(index) {},  // This option accepts a callback function. The function will be called before the page moves.
    afterMove: function(index) {},   // This option accepts a callback function. The function will be called after the page moves.
    loop: false,                     // You can have the page loop back to the top/bottom when the user navigates at up/down on the first/last page.
    keyboard: true,                  // You can activate the keyboard controls
    responsiveFallback: false,        // You can fallback to normal page scroll by defining the width of the browser in which
                                      // you want the responsive fallback to be triggered. For example, set this to 600 and whenever 
                                      // the browser's width is less than 600, the fallback will kick in.
    direction: "vertical"            // You can now define the direction of the One Page Scroll animation. Options available are "vertical" and "horizontal". The default value is "vertical".  
  });
  
  // Toggle Show/Hide using jQuery.
  // $('.wine').hide();
  // $('#beer-button').click(function() {
  //   $('.beer').toggle()
  // })
  // $('#wine-button').click(function() {
  //   $('.wine').toggle()
  // })
})
