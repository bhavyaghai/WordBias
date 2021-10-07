function createParallelCoord(data) {
  // linear color scale
  $("#parallel_coord").empty();

  var pc = d3
    .parcoords()("#parallel_coord")
    .data(data)
    .bundlingStrength(0) // set bundling strength
    .smoothness(0)
    //.bundleDimension("gender")
    .bundleDimension(Object.keys(data[0])[1])
    .hideAxis(["word"])
    .composite("darken")
    .color("steelblue") // quantitative color scale
    .alpha(0.6)
    .mode("queue")
    //.render()
    .brushMode("1D-axes-multi") // enable brushing
    .interactive() // command line mode
    .reorderable();

  return pc;
}

/*
Top pane events
Parallel coordinates properties
smoothness, alpha. etc.
paracoord.js library events
*/
$("#alpha_input").on("change", function () {
  alpha = parseFloat($(this).val());
  pc.alpha(alpha).render();
  $("#alpha_text").html(alpha);
});

$("#smoothness_input").on("change", function () {
  smooth = parseFloat($(this).val());
  pc.smoothness(smooth).render();
  $("#smoothness_text").html(smooth);
});

$("#bundle_input").on("change", function () {
  bundle = +$(this).val();
  pc.bundlingStrength(bundle).render();
  $("#bundle_text").html(bundle);
});

$("#bundle_dimension").on("change", function () {
  value = $(this).val();
  console.log(value);
  pc.bundleDimension(value);
});

// Reset brush button -- removes all brushes
$("#reset_brush").on("click", brush_reset);

function brush_reset() {
  pc.brushReset();
  d3.selectAll(".extentLabels").remove();

  if (inSearch) {
    populate_neighbors(highlighted_data);
    updateProgressBar(highlighted_data);

    d3.selectAll([pc.canvas["highlight"]]).classed("faded", false);
    d3.selectAll([pc.canvas["brushed"]]).classed("full", false);
    d3.selectAll([pc.canvas["brushed"]]).classed("faded", true);
  } else {
    updateProgressBar(active_data);
    $("#neighbors_list").empty();
  }
}
