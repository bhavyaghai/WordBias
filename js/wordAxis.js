
function addWords(data_rows,neighbors) {
  if(!neighbors.length){  /// case of single data
    w = data_rows[0].word
    if(wordAxis(w)) drawWordLines(data_rows,"highlight")  /// word exists in the axis
    else drawWords(data_rows,"highlight")
  }

}

/*
Word axis update functions
*/
function updateWordAxisDomain(data){ // set word axis domain
  wordAxis.domain(words) 
}

function updateWordAxis(data,canvas_layer="foreground"){  // word axis update
  words = data.map(function (d) {return d.word})
  updateWordAxisDomain(words)
  $("#word_axis").empty()
  var yAxis = d3.svg.axis()
    .scale(wordAxis)
    .tickValues(words)
    .orient("left");

  d3.select("#word_axis").call(yAxis);
  drawWordLines(data,canvas_layer)
}

function updatePC(data,canvas_layer){
  if(data.length <75){
    hideAxis = false
    updateWordAxis(data,canvas_layer)
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
    addWords(data_rows,neighbors)
    $("#neighbors_list").empty()
    neighbors.forEach(function(neighbor,i){
        $("#neighbors_list").append('<li class="list-group-item">'+neighbor+'</li>')
    })
  }
  else{
    pc.afterHighlight(data_rows)
    showText(data_rows,word)
  }
  
}
function cancelHighlight(){
  if(afterHighlight){
    afterHighlight = false
    pc.unAfterHighlight()
  }
  else{
    $("text").removeClass("focused")
    $("text").removeAttr("fill")
    $("#neighbors_list").empty()
    $("#word_axis .tick text").attr("opacity","1")
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

function drawText(ctx,text,x,y){  // draw a single text
  ctx.fillText(text,x,y)
}

function drawWordLines(data_rows,canvas_layer){
  ctx = pc.ctx[canvas_layer]
  x1=100,y1=2, x2= pc.position("gender")
  data_rows.forEach(function(row){
    drawLine(ctx, x1+5, wordAxis(row['word']), x2, pc.dimensions()["gender"].yscale(row["gender"]))
    // y1 += 15
  })
}
function drawWords(data_rows, canvas_layer) {
  ctx = pc.ctx[canvas_layer]
  ctx.textAlign = "end";
  ctx.font = "14px Sans Sarif";
  x = (hidAxis) ? pc.position("gender")-5 : 100
    
  data_rows.forEach(function(row){
    drawText(ctx,row['word'], x, pc.dimensions()["gender"].yscale(row["gender"]))
  }) 
}

/*
SVG Manipulations
*/
function addSVGLabels(data_rows,cls="dynamicLabels"){ //dynamically add labels on the word axis
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

/* 
events associated with word axis
*/
$("body").on("mouseenter","#word_axis .tick text",function(e){
  if(!inSearch){
    $(this).addClass("focused")
    $(this).attr("fill","#43a2ca")
    // $(".labels").attr("opacity","0.1")
    highlightWords($(this).html())
  }
  
})

$("body").on("mouseleave","#word_axis .tick text",function(){
  if(!inSearch)
    cancelHighlight() 
})

$("body").on("click","#canvas_svg",function(e){
    console.log(e.target.nodeName)
    if(e.target.nodeName == "text" && ($(e.target).parents(".tick").length) && ($(e.target).parents("#word_axis").length)){
      console.log("enterr")
      inSearch = true
      searchWords($(e.target).html())
      // $("#word_dimension .tick text").attr("opacity","0.0")
    }
    else if(!$(e.target).hasClass("dynamicLabel")){
      inSearch = false
      cancelHighlight()
    }
})

$("body").on("mouseenter",".dynamicLabel",function(){
  $(".dynamicLabel").not(this).attr("opacity","0.5")
  afterHighlight = true
  globalY = parseFloat($(this).attr("y"))
  highlightWords($(this).html())
})
$("body").on("mouseleave",".dynamicLabel",function(){
  $(".dynamicLabel").attr("opacity","1")
  cancelHighlight()
})
$("body").on("mouseenter",".list-group-item",function(e){
  $(this).css("color","orange")
  word = $(this).html()
  wordLabel = $(".dynamicLabel").filter(function(){
    // console.log(d)
    return $(this).html() == word
  })
  // console.log(wordLabel)
  $(".dynamicLabel").not(wordLabel).attr("opacity","0.5")
  afterHighlight = true
  globalY = parseFloat(wordLabel.attr("y"))
  highlightWords(word)
})
$("body").on("mouseleave",".list-group-item",function(e){
  $(this).css("color","black")
  $(".dynamicLabel").attr("opacity","1")
})

/*
Search events
*/
$("body").on("mouseover",".result",function(){
  inSearch = false
  word = $(this).find(".title").html()
  // $("#word_axis .tick text").attr("opacity","0.0")
  highlightWords(word)
})

//$("body").on("mouseout",".result",function(){
//  cancelHighlight()  
//})
