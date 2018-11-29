var margin = {top: 25, right: 10, bottom: 5, left: 10},
    outerWidth = $("#parallel_coord").width(),
    outerHeight = $(document).height()-$("#navbar").height()-$("#options").height()-100,
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;
var aspect = width/height;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left");

var svg,background,foreground;

function createParallelCoord(url) {

    svg = d3.select("#parallel_coord").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // delete existing parallel coordinates if exists
    d3.json(url, function(data) {
        temp = data;
        // Extract the list of dimensions and create a scale for each.
        x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
          if(d=="word") {
              return (y[d] = d3.scale.ordinal()
              .domain(data.map(function(d) { return d["word"]; }).sort())
              .rangePoints([0, height]));    
          }
          return (y[d] = d3.scale.linear()
              .domain(d3.extent(data, function(p) { return +p[d]; }))
              .range([height, 0]));
        }));
      
        // Add grey background lines for context.
        background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", function(d) {
                return path(d);
            });
      
        // Add blue foreground lines for focus.
        foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", path);
      
          var paths = svg.selectAll(".background path, .foreground path") 
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);
      
          function moveToFront() {
              // To make sure path is highlighted
              // I append it again to parent so that its order is on the top
              this.parentNode.appendChild(this);
          }
      
        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            .call(d3.behavior.drag()
              .origin(function(d) { return {x: x(d)}; })
              .on("dragstart", function(d) {
                dragging[d] = x(d);
                background.attr("visibility", "hidden");
              })
              .on("drag", function(d) {
                dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                foreground.attr("d", path);
                dimensions.sort(function(a, b) { return position(a) - position(b); });
                x.domain(dimensions);
                g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
              })
              .on("dragend", function(d) {
                delete dragging[d];
                transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                transition(foreground).attr("d", path);
                background
                    .attr("d", path)
                    .transition()
                    .delay(500)
                    .duration(0)
                    .attr("visibility", null);
              }));
      
        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
          .append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function(d) { return d; })
            .attr("class","title");
          
         var labels = svg.selectAll(".axis text")
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

        function mouseover(d) {
                // string when hover over word
                if($.type(d) === "string") {
                    foreground.classed("inactive", function(p) { return p["word"] !== d; });
                    foreground.filter(function(p) { return p["word"] === d; }).each(moveToFront).style("stroke-width","3px");    
                    labels.filter(function(p) { return p == d; }).style("font-weight", "bold");
                } // else when hover over path
                else {
                    foreground.classed("inactive", function(p) { return p !== d; });
                    foreground.filter(function(p) { return p === d; }).each(moveToFront).style("stroke-width","3px");
                    labels.filter(function(p) { return p == d["word"]; }).style("font-weight", "bold");
                }
            }
        
        function mouseout(d) {
                if($.type(d) === "string") {
                    foreground.filter(function(p) { return p["word"] === d; }).style("stroke-width","1px");
                    labels.filter(function(p) { return p === d; }).style("font-weight", "initial");
                }
                else {
                    foreground.filter(function(p) { return p === d; }).style("stroke-width","1px");
                    labels.filter(function(p) { return p == d["word"]; }).style("font-weight", "initial");
                }
                foreground.classed("inactive",false);
            }
      
        // Add and store a brush for each axis.
        g.append("g")
            .attr("class", "brush")
            .each(function(d) {
              d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
            })
          .selectAll("rect")
            .attr("x", -8)
            .attr("width", 16);
      
          // To make svg responsive to different screen sizes 
          d3.select(window)
          .on("resize", function() {
              var chart = d3.select('#parallel_coord');
              var targetWidth = chart.node().getBoundingClientRect().width;
              d3.select('#parallel_coord svg').attr("width", targetWidth);
              d3.select('#parallel_coord svg').attr("height", targetWidth / aspect);
          });  
      });
}

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { 
        return [position(p), y[p](d[p])]; 
    }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}


// change pc as per thresold values
function change_threshold() {
    foreground.style("display",function(d) {
        if(Math.abs(d["gender"])<thresh || Math.abs(d["eco"])<thresh || Math.abs(d["race"])<thresh) {
            return "none";
        }
        else {
            return "initial";
        }
    });
}

// color parallel coordinate with repsect to attribute like gender, etc.
$('#dropdown_color').on('change', function() {
    var selText = this.value; 
    console.log(selText);
    if(selText=="Default") {
        foreground.style("stroke","steelblue");
        return;
    }
    var mapping = {"Gender":"gender","Race":"race","Economic status":"eco"};
    var column = mapping[selText];

    foreground.style("stroke",function(d) {
        if(d[column]>0.01) {
            return "orangered";
        }
        else if(d[column]<-0.01) {
            return "green";
        }
    });

});