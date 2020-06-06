



function scatterplot(url){

  var margin = {top: 25, right: 10, bottom: 25, left: 10},
    outerWidth = $("#scatter_plot").width(),
    //outerHeight = $(document).height()-$("#navbar").height()-$("#options").height()-100,
    outerHeight = $("#scatter_plot").height(),
    width = outerWidth - margin.left - margin.right,
    height = outerHeight - margin.top - margin.bottom;
  var aspect = width/height;

	// console.log(data[0][x],data[0][y])
	// set the ranges
	var xScale = d3.scale.linear().range([0, width]);
	var yScale = d3.scale.linear().range([height, 0]);

	// xMin = 
	valMax = d3.max(data, function(d) { return d.regr_val; })
	valMin = d3.min(data, function(d) { return d.regr_val; })
	var colorScale1 = d3.scaleSequential().domain([valMin, valMax]).interpolator(d3.interpolateRdBu);
	
	// append the svg obgect to the body of the page
	// appends a 'group' element to 'svg'
	// moves the 'group' element to the top left margin
	var svg = d3.select("#scatter_plot").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform",
	          "translate(" + margin.left + "," + margin.top + ")");

	// Scale the range of the data
	// xMax = d3.max(data, function(d) { return d.PC1; })
	// xMin = d3.min(data, function(d) { return d.PC1; })
	// yMax = d3.max(data, function(d) { return d.PC2; })
	// yMin = d3.min(data, function(d) { return d.PC2; })
	
	xScale.domain([-1,1]);
	yScale.domain([-1,1]);
	 
	// Add the scatterplot
	  svg.selectAll(".dot")
	      .data(data)
	    .enter().append("circle")
	      .attr('class','dot')
	      .attr("r", function(d) {
	      	if(d.index >= 0 ) 
	      		return dot_size
	      	else
	      		return 8;
	      })
	      .attr("cx", function(d) { return xScale(d.PC1); })
	      .attr("cy", function(d) { return yScale(d.PC2); })
	      // .style("fill","steelblue");
	      .style("fill", function(d) {	return colorScale1(d.regr_val);})

	// Add the X Axis
	//   svg.append("g")
	//       .attr("transform", "translate(0," + height + ")")
	//       .attr('class','axisGrey')
	//       .call(d3.axisBottom(xScale).ticks(5));

	// // Add the Y Axis
	//   svg.append("g")
	//   	  .attr("transform", "translate(0,0)")
	//   	  .attr('class','axisGrey')
	//       .call(d3.axisLeft(yScale).ticks(5));

	// // text label for the x axis
    svg.append("text")             
      .attr("transform",
            "translate(" + (width/2+10) + " ," + 
                           (-20) + ")")
      .style("text-anchor", "middle")
      .style("opacity","1")
      .text("Persona Map");


    continuous("#legend1", colorScale1, 160, 75);

	  // $("#scatter_div").append("<div id='details_div'></div>")
	
}

// create continuous color legend
function continuous(selector_id, colorscale, legendheight, legendwidth) {
  var margin = {top: 20, right: 60, bottom: 10, left: 2};

  var canvas = d3.select(selector_id)
    .style("position", "absolute")
    .append("canvas")
    .attr("height", legendheight - margin.top - margin.bottom)
    .attr("width", 1)
    .style("height", (legendheight - margin.top - margin.bottom) + "px")
    .style("width", (legendwidth - margin.left - margin.right) + "px")
    .style("border", "1px solid #000")
    .style("position", "absolute")
    .style("top",  "40px")
    .style("left",  "-5px")
    .node();

  var ctx = canvas.getContext("2d");

  var legendscale = d3.scaleLinear()
    .range([ legendheight - margin.top - margin.bottom,1])
    .domain(colorscale.domain());

  // image data hackery based on http://bl.ocks.org/mbostock/048d21cf747371b11884f75ad896e5a5
  var image = ctx.createImageData(1, legendheight);
  d3.range(legendheight).forEach(function(i) {
  	// console.log(i)
    var c = d3.rgb(colorscale(legendscale.invert(i)));
    image.data[4*i] = c.r;
    image.data[4*i + 1] = c.g;
    image.data[4*i + 2] = c.b;
    image.data[4*i + 3] = 255;
  });
  ctx.putImageData(image, 0, 0);

  var legendaxis = d3.axisRight()
    .scale(legendscale)
    .tickSize(6)
    .ticks(6);

  var svg = d3.select(selector_id)
    .append("svg")
    .attr("height", (legendheight) + "px")
    .attr("width", (legendwidth) + "px")
    .style("position", "absolute")
    .style("left", "-5px")
    .style("top", "20px")

  svg
    .append("g")
    .attr("transform", "translate(" + (legendwidth - margin.left - margin.right) + "," + (margin.top) + ")")
    .call(legendaxis);
};


