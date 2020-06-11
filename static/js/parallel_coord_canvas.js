function createParallelCoord(data){
	// linear color scale
	$("#parallel_coord").empty()
	$("#parallel_coord").css("height",4*$(window).height()/5)
	$("#neighbors_list").css("max-height",4*$(window).height()/5)
	var blue_to_brown = d3.scale.linear()
	  .domain([-1, 1])
	  .range(["steelblue", "brown"])
	  .interpolate(d3.interpolateLab);

	// interact with this variable from a javascript console
	var pc1;
	var dimensions = {
			'word': {title: "word",'tickValues':[]},
            'gender': {title: "gender"},
            'race': {title: "race"},
            'economic_status': {'title':'economic_status'}
        };

	// load csv file and create the chart
	
	  console.log(data.length)
	  pc1 = d3.parcoords()("#parallel_coord")
	    .data(data)
	    // .dimensions(dimensions)
	    .bundlingStrength(0) // set bundling strength
		.smoothness(0)
		.bundleDimension("gender")
		// .hideAxis(['word'])
	    .composite("darken")
	    .color("#40bad5")  // quantitative color scale
	    .alpha(0.5)
	    .mode("queue")
	    // .render()
	    .brushMode("1D-axes-multi")  // enable brushing
	    .interactive()  // command line mode
	    .reorderable()

	  var explore_count = 0;
	  var exploring = {};
	  var explore_start = false;
	  
	  return pc1
}