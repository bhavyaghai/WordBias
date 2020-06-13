/* code adopted from: http://bl.ocks.org/nnattawat/8916402 */
function createHistogram(values) {
    var color = "steelblue";
    //var color = "#007bff";
    // Generate a 1000 data points using normal distribution with mean=20, deviation=5
    //var values = d3.range(1000).map(d3.random.normal(20, 5));

    // A formatter for counts.
    var formatCount = d3.format(",.0f");

    var max_width=$(".feature").width(), max_height=$("#histogram").height();
    var margin = {top: 5, right: 0, bottom: 10, left: 0},
        width = max_width - margin.left - margin.right,
        height = max_height - margin.top - margin.bottom;

    var max = d3.max(values);
    var min = d3.min(values);
    var x = d3.scale.linear()
        .domain([min, max])
        .range([0, width]);


    // Number of bins: Sturge's formula
    num_bins = Math.ceil(Math.log2(values.length))+1;
    console.log("number of bins ", num_bins);
  

    // Generate a histogram using twenty uniformly-spaced bins.
    var data = d3.layout.histogram()
        .bins(num_bins)(values);

    var yMax = d3.max(data, function(d){return d.length});
    var yMin = d3.min(data, function(d){return d.length});
    var colorScale = d3.scale.linear()
                .domain([yMin, yMax])
                .range([d3.rgb(color).brighter(), d3.rgb(color).darker()]);

    var y = d3.scale.linear()
        .domain([0, yMax])
        .range([height, 0]);

    
    // var xAxis = d3.svg.axis()
    //     .scale(x)
    //     .orient("bottom");

    // var yAxis = d3.svg.axis()
    //     .ticks(Math.round(height / 15))
    //     .scale(y)
    //     .orient("left");
    

    var svg = d3.select("#histogram").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        /*
        .call(d3.behavior.zoom().on("zoom", function () {
            svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
        })); */
        //.append("g");
    
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d,i) {
            return "<strong>range: </strong><span>"+(d.x.toFixed(3))+" - "+(d.x+d.dx).toFixed(3)+"</span><br><strong>count: </strong><span style='color:steelblue'>" + d.length + "</span>";
        });    
    svg.call(tip);

    /*
    high_area1 = svg.append("g")
        .attr("transform", function(d) { return "translate(" + x(0) + "," + y(yMax) + ")"; });

    high_area2 = svg.append("g")
        .attr("transform", function(d) { return "translate(" + x(0.2) + "," + y(yMax) + ")"; });
    
    high_area1.append("rect")
        .attr({"id":"high_area1",
            "height": height,
            "width": x(0.1),
            "fill": "lightgray" 
    });

    high_area2.append("rect")
        .attr({"id":"high_area2",
            "height": height,
            "width": x(0.2),
            "fill": "lightgray" 
    });
    */

    var bar = svg.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    bar.append("rect")
        .attr("x", 1)
        .attr("width", (x(data[0].dx) - x(0)) - 1)
        .attr("height", function(d) { return height - y(d.y); })
        .attr("fill", color)
        .on("mouseover", function(d) {
            d3.select(this)
                .attr("fill", "red");
            tip.show(d);
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("fill", color);
            tip.hide(d);
        });
    
    // console.log(data)
    // svg.append("g")
    //     .attr("class", "x axis")
    //     .attr("transform", "translate(0," + height + ")")
    //     .call(xAxis);

    // svg.append("g")
    //     .attr("class", "y axis")
    //     //.attr("transform", "translate(0," + height + ")")
    //     .call(yAxis);
    
    
}