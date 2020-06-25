
function updateWordAxis(data){
  words = data.map(d => d.word )
  if(data.length <70){
    if(hideAxis){
      pc.hideAxis([])
      hideAxis = false
    }
    pc.dimensions()["word"].yscale.domain( words)
    pc.dimensions()['word'].tickValues = words
    pc.updateAxes()
  }
  else if(!hideAxis){
    pc.hideAxis(["word"])
    hideAxis = true
  }
}
/*
Word search and highlight functions
*/
function showText(data_rows, word){
  attr = hideAxis ? "gender": "word"
  ctx = afterHighlight ? pc.ctx['after_highlight']:pc.ctx['highlight']
  x = pc.position(attr)
  y1 = 10
  data_rows.forEach(function(row){
    color = (row['word'] == word) ? "#43a2ca" : "orange"
    y = pc.dimensions()[attr].yscale(row[attr]) 
    if (typeof y == 'undefined' & !hideAxis){
      row["x"] = x-10
      row["color"] = color
      row["y"] = y1+3
      if(!afterHighlight){
        ctx.strokeStyle = color
        drawLine(ctx, x, y1, pc.position("gender"), pc.dimensions()["gender"].yscale(row["gender"]))
      }
      else{
        ctx.strokeStyle = "orange"
        drawLine(ctx, x, globalY, pc.position("gender"), pc.dimensions()["gender"].yscale(row["gender"]))
      }
      y1 += 20
    }
    else if((row['word'] != word)  || hideAxis){
      row["x"] = x-10
      row["color"] = color
      row["y"] = y+3 
    }
  })
  if(!afterHighlight)
    addSVGLabels(data_rows)
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
    showText(data_rows,word)
    $("#neighbors_list").empty()
    neighbors.forEach(function(neighbor,i){
        $("#neighbors_list").append('<li class="list-group-item">'+neighbor+'</li>')
    })
  }
  else{
    pc.afterHighlight(data_rows)
    // drawWordLines(data_rows,"after_highlight")
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
    y1 = pc.dimensions()["word"].yscale.domain(row['word']) ? pc.dimensions()["word"].yscale.domain(row['word']) : y2
    if(inSearch && !afterHighlight)
      ctx.strokeStyle = (row['word'] == selected_word) ? "steelblue": "orange"
    drawLine(ctx, x1, y1, x2, y2 )
    // y1 += 15
  })
}
function drawWords(data_rows, canvas_layer) {
  $("#word_dimension .tick text").attr("opacity","0.1")
  x = (hideAxis) ? pc.position("gender")-5: pc.position("word")-5
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
  if(!inSearch) 
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
$("body").on("mouseenter","#word_dimension .tick text", function(){ 
  if(!inSearch)
    $(this).attr("fill","steelblue") ;
  mouseenter($(this).html())
})
$("body").on("mouseleave","#word_dimension .tick text", mouseleave)

$("body").on("click","#canvas_svg",function(e){ // click
    if(!inSearch && e.target.nodeName == "text" && ($(e.target).parents(".tick").length) && ($(e.target).parents("#word_dimension").length)){
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
})
$("body").on("mouseleave",".list-group-item",function(e){
  $(this).css("color","black")
  mouseleave()
})

