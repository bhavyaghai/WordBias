/* code adopted from: http://bl.ocks.org/nnattawat/8916402 */
function createHistogram(values) {
    var color = "steelblue";

    // A formatter for counts.
    var formatCount = d3.format(",.0f");

    var max_width=$(".feature").width(), max_height=$("#histogram").height();
    var margin = {top: 5, right: 0, bottom: 20, left: 10},
        width = max_width - margin.left - margin.right,
        height = max_height - margin.top - margin.bottom;

    var max = d3.max(values);
    var min = d3.min(values);

    var x = d3.scale.linear()
        .domain([0, 1])
        .range([0, width]);

    var brush = d3.svg.brush()
                .x(x)
                .on("brushend", brushMove);
    // .on("brushend", brushend);

    // Number of bins: Sturge's formula
    num_bins = Math.ceil(Math.log2(values.length))+1;
    console.log("number of bins ", num_bins);
  
    // Generate a histogram using calculated bins.
    var data = d3.layout.histogram()
        .bins(num_bins)(values);

    var yMax = d3.max(data, function(d){return d.length});
    var y = d3.scale.linear()
        .domain([0, yMax])
        .range([height, 0]);
    
    var xAxis = d3.svg.axis()
        .ticks(5)
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .ticks(5)
        .scale(y)
        .orient("left");
    
    var svg = d3.select("#histogram").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var bar = svg.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    bar.append("rect")
        .attr("x", 1)
        .attr("width", (x(data[0].dx) - x(0)) - 1)
        .attr("height", function(d) { return height - y(d.y); })
        .attr("fill", "#43a2ca")
        
    var dimension = svg.append("g")
                    .attr("transform", "translate(0," + height + ")");

    dimension.append("g")
        .attr("class", "x axis")
        .call(xAxis);

    brushg = dimension.append("g")
        .classed("brush", true)
        .call(brush);

    brushg.selectAll("rect")
            .style("visibility", null)
            .attr("y", -10)
            .attr("height", 20);

    brushg.selectAll("rect.background")
            .style("fill", "transparent");

    brushg.selectAll("rect.extent")
            .style("fill", "rgba(255,255,255,0.25)")
            .style("stroke", "rgba(0,0,0,0.6)");

    brushg.selectAll(".resize rect")
            .style("fill", "rgba(0,0,0,0.1)");

    // svg.append("g")
    //     .attr("class", "y axis")
    //     .attr("transform", "translate(0,0)")
    //     .call(yAxis);

    

    // var tip = d3.tip()
    //     .attr('class', 'd3-tip')
    //     .offset([-10, 0])
    //     .html(function(d,i) {
    //         return "<strong>range: </strong><span>"+(d.x.toFixed(3))+" - "+(d.x+d.dx).toFixed(3)+"</span><br><strong>count: </strong><span style='color:steelblue'>" + d.length + "</span>";
    //     });    
    // svg.call(tip);
    function brushMove(){
        console.log("brushMoved")
    }
    
    
}