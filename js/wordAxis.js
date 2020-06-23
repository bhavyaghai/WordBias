
function addWords(data_rows,neighbors) {
  if(!neighbors.length){  /// case of single data
    w = data_rows[0].word
    if(wordAxis(w)) drawWordLines(data_rows,"highlight")  /// word exists in the axis
    else drawWords(data_rows,"highlight")
  }

}

function updateWordAxis(data,canvas_layer="foreground"){
  words = data.map(function (d) {return d.word})
  wordAxis.domain(words) 
  $("#word_axis").empty()
  var yAxis = d3.svg.axis()
    .scale(wordAxis)
    .tickValues(words)
    .orient("left");

  d3.select("#word_axis").call(yAxis);
  drawWordLines(data,canvas_layer)
}


function drawWordLines(data_rows,canvas_layer){
  ctx = pc.ctx[canvas_layer]
  x=100,y=2
  data_rows.forEach(function(row){
    row['x'] = x
    row['y'] = y 
    drawLine(ctx, x+5, wordAxis(row['word']), pc.position("gender"), pc.dimensions()["gender"].yscale(row["gender"]))
    y += 15
  })
}
function drawWords(data_rows, canvas_layer) {
  ctx = pc.ctx[canvas_layer]
  ctx.textAlign = "end";
  ctx.font = "14px Sans Sarif";
  x = (hidAxis) ? pc.position("gender")-5 : 100
    
  data_rows.forEach(function(row){
    ctx.fillText(row['word'], x, pc.dimensions()["gender"].yscale(row["gender"]))
  })
  
}

function drawLine(ctx,x1,y1,x2,y2){
  ctx.beginPath();
  ctx.moveTo(x1, y1) 
  ctx.lineTo(x2, y2) 
  ctx.stroke();
}
function addLabels(data_rows,cls="labels"){
  d3.select("#word_axis")
    .selectAll(cls)
      .data(data_rows).enter()
        .append("text")
        .attr("class",cls)
        .attr("x",d => d.x)
        .attr("y",d => d.y)
        .attr("fill",d => d.color)
        .attr("text-anchor","end")
        .style("z-index","-4")
        .text(d => d.word)
}