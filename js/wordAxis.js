
/*
Word axis update functions
*/
function updateWordAxisDomain(data){ // set word axis domain
  wordAxis.domain(words) 
}

function updateWordAxis(data,canvas_layer="foreground",drawLns=true){  // word axis update
  words = data.map(function (d) {return d.word})
  updateWordAxisDomain(words)
  $("#word_axis").empty()
  var yAxis = d3.svg.axis()
    .scale(wordAxis)
    .tickValues(words)
    .orient("left");

  d3.select("#word_axis").call(yAxis);
  // $("#word_axis .tick").attr("fill","orange")
  if(drawLns) 
    drawWordLines(data,canvas_layer)
}

function updatePC(data,canvas_layer="foreground",drawLns=true){
  if(data.length <75){
    hideAxis = false
    updateWordAxis(data,canvas_layer,drawLns) 
  }
  else{
    hideAxis =  true
    $("#word_axis").empty();
    d3.select("#word_axis")
      .append("foreignObject")
      .attr("width",200)
      .attr("height",200)
      .attr("y",pc.h()/2)
      .attr("x",-100)
      .append("xhtml")
      .html("<h4>Word axis is currently not available</h4>"+
        "<p> as number of words > 100. "+
        "Use brushing, hover, search bar, or histogram on the left to select words.</p>")
  }
}

/*
Highlight and unhighlight functions
*/
function highlightWords(word,neighbors=[]){
  this.neighbors = neighbors
  data_rows = this.data.filter(function(d,i){return d.word == word || neighbors.includes(d.word.toLowerCase())})
  
  if(!afterHighlight){
    selected_word = word
    pc.highlight(data_rows)
    if(!neighbors.length){  /// case of single data
      if(!hideAxis) drawWordLines(data_rows,"highlight") // need to draw the lines
      if(!wordAxis(word) || hideAxis || inSearch)   /// word does not exists in the axis or axis is hidden
        drawWords(data_rows,"highlight")
    }
    else{
      $(".dynamicLabel").remove()
      updatePC(data_rows,"highlight")

    }
    $("#neighbors_list").empty()
    neighbors.forEach(function(neighbor,i){
        $("#neighbors_list").append('<li class="list-group-item">'+neighbor+'</li>')
    })
  }
  else{
    pc.afterHighlight(data_rows)
    drawWordLines(data_rows,"after_highlight")
  }
  
}
function cancelHighlight(){
  // $("text").removeClass("focused")
  // $("text").removeAttr("fill")
  $(".dynamicLabel").remove()
  $("#word_axis .tick text").attr("opacity","1")
  if(afterHighlight){
    afterHighlight = false
    pc.unAfterHighlight()
  }
  else{
    $("#neighbors_list").empty()
    pc.unhighlight()
  }  
}

/*
canvas drawing utility functions
*/
function drawLine(ctx,x1,y1,x2,y2){ //draw a single line
  ctx.beginPath();
  ctx.moveTo(x1, y1) 
  ctx.lineTo(x2, y2) 
  ctx.stroke();
}

function drawWordLines(data_rows,canvas_layer){
  ctx = pc.ctx[canvas_layer]
  x1=105, x2= pc.position("gender")
  data_rows.forEach(function(row){
    y2 = pc.dimensions()["gender"].yscale(row["gender"])
    y1 = wordAxis(row['word']) ? wordAxis(row['word']): y2
    if(inSearch && !afterHighlight)
      ctx.strokeStyle = (row['word'] == selected_word) ? "steelblue": "orange"
    drawLine(ctx, x1, y1, x2, y2 )
    // y1 += 15
  })
}
function drawWords(data_rows, canvas_layer) {
  $("#word_axis .tick text").attr("opacity","0.1")
  x = pc.position("gender")-5
  if(!hideAxis || inSearch) x=100 
  y = 2
  step = Math.floor((pc.h()+1)/data_rows.length)
  data_rows.forEach(function(row){
    row['x'] = x
    row['y'] = (inSearch)? y: pc.dimensions()["gender"].yscale(row["gender"])
    row['color'] = "black"
    y += step
  }) 
  addSVGLabels(data_rows)
}

/*
SVG Manipulations
*/
function addSVGLabels(data_rows,cls="dynamicLabel"){ //dynamically add labels on the word axis
  d3.select("#canvas_svg>g")
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

/* 
events associated with word axis
*/
function mouseenter(word){
  if(inSearch) {
    afterHighlight = true
  } 
  highlightWords(word)
  // else highlightWords(word)
  
  // else highlightWords($(this).html())
}
function mouseleave(){
  // if(!inSearch) 
    cancelHighlight() 
    // if(!inSearch)
    $(this).removeAttr("fill")
    // $()

}
function onClick(word){
  console.log("enterr")
  inSearch = true
  searchWords(word)
  selected_word = word
  // setTimeout(function(){ wordLabel.attr("fill","steelblue") }, 500);

}
$("body").on("mouseenter","#word_axis .tick text", function(){ 
  if(!inSearch)
    $(this).attr("fill","steelblue") ;
  mouseenter($(this).html())
})
$("body").on("mouseleave","#word_axis .tick text", mouseleave)

$("body").on("click","#canvas_svg",function(e){ // click
    if(!inSearch && e.target.nodeName == "text" && ($(e.target).parents(".tick").length) && ($(e.target).parents("#word_axis").length)){
      onClick($(e.target).html())
    }
    else if(inSearch && !(e.target.nodeName == "text")){
      updatePC(active_data,"foreground",false)
      inSearch = false
      afterHighlight = false
      cancelHighlight()  
    }
})

/*
Search events
*/
$("body").on("mouseover",".result",function(){
  inSearch = false
  word = $(this).find(".title").html()
  highlightWords(word)
})
$("body").on("mouseout",".result",function(){
  if(!inSearch)
    cancelHighlight()  
})

$("body").on("mouseenter",".list-group-item",function(e){
  $(this).css("color","orange")
  mouseenter($(this).html())
  
  // afterHighlight = true
  // globalY = parseFloat(wordLabel.attr("y"))
  // highlightWords(word)
})
$("body").on("mouseleave",".list-group-item",function(e){
  $(this).css("color","black")
  mouseleave()
})

