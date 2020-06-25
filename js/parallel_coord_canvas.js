function createParallelCoord(data){
	// linear color scale
	$("#parallel_coord").empty()
	
	var pc = d3.parcoords()("#parallel_coord")
	    .data(data)
	    .bundlingStrength(0) // set bundling strength
		.smoothness(0)
		.bundleDimension("gender")
	    .hideAxis(["word"])
	    .composite("darken")
	    .color("steelblue")  // quantitative color scale
	    .alpha(0.5)
	    .mode("queue")
	    .render()
	    .brushMode("1D-axes-multi")  // enable brushing
	    .interactive()  // command line mode
	    .reorderable()

	return pc
}