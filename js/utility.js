
// show, hide word axis
function updateWordAxis(data){
  words = data.map(d => d.word )
  if(data.length <75){
    if(hideAxis){
      pc.hideAxis([])
      hideAxis = false
    }
    pc.dimensions()["word"].yscale.domain( words)
    pc.dimensions()['word'].tickValues = words
    pc.updateAxes()
    d3.selectAll("#word_dimension .tick text").on("click",labelClick)
  }
  else if(!hideAxis){
    pc.hideAxis(["word"])
    hideAxis = true
  }
}

//Highlight words using highlight or after_highlight canvas
function highlightWords(word,neighbors=[]){
  global_neighbors = neighbors
  $(".dynamicLabel").remove()
  data_rows = data.filter(function(d,i){return d.word == word || neighbors.includes(d.word.toLowerCase())})
  
  if(!afterHighlight){
    selected_word = word
    if(!neighbors.length){ // case of single data
      if(!hideAxis && !pc.dimensions()['word'].yscale(word))  // update word axis if the axis is visible, 
        updateWordAxis($.merge( $.merge( [], active_data ), data_rows ))  // but the word is not the domain
      if(hideAxis) drawWords(data_rows,"highlight")  // if word axis is hidden, draw the word label
    }
    else{  // update word axis with the neighbors and populate neighbors list
      updateWordAxis(data_rows)
      populate_neighbors(data_rows)
    }
    pc.highlight(data_rows)  // highlight the selected words
  }
  else{ // highlight neighbors, using the extra canvas layer
    pc.afterHighlight(data_rows)
  }
  
}

// cancel highlight 
function cancelHighlight(updateNeighbor=true){
  pc.unhighlight()
  $("text").removeAttr("fill")
  $(".dynamicLabel").remove()
  $("#word_dimension .tick text").attr("opacity","1")
  if(updateNeighbor) $("#neighbors_list").empty()
  // if(!pc.isBrushed()) updateWordAxis(active_data)  
  clear_bias_words_section()
}

// manually draw word labels
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

// add svg texts
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
  $(this).css('cursor', 'pointer');
  highlightWords(word)
}

function mouseleave(){
  if(!inSearch) 
    cancelHighlight(false) 
    
  else if(afterHighlight){
    afterHighlight = false
    pc.unAfterHighlight()
  }
  //$(this).css('cursor', 'inherit');
}

function onClick(word){
  inSearch = true
  searchWords(word)
  selected_word = word
}

function labelClick(d,i){
  if(!inSearch) onClick($(this).html()) 
}


$("body").on("mouseenter","#word_dimension .tick text", function(){ 
  if(!inSearch)
    $(this).attr("fill","steelblue") ;
  mouseenter($(this).html())
})

$("body").on("mouseleave","#word_dimension .tick text", mouseleave)


$("body").on("click","#canvas_svg",function(e){ // click
    ele = $(e.target);

    // clicking on title of axis like "gender", "race", etc.
    if($(".tick").has(ele).length==0 && e.target.nodeName == "text") {
        axis_name = ele.html().toLowerCase();
        last_selected_axis_name = axis_name;
        console.log("clicking on the title of axis "+axis_name)
        if(axis_name!="word") {
          clear_bias_words_section()
          // populate corresponding bias words in the textarea
          group_words = bias_words[axis_name]
          group_names = Object.keys(group_words);

          $("#bias_type").val(axis_name)         

          $("#gp1_label").val(group_names[0])
          $("#gp2_label").val(group_names[1])

          $("#gp1").val(group_words[group_names[0]])
          $("#gp2").val(group_words[group_names[1]])
        }
    }
    // clicking anywhere else -> cancelHighlight
    else if(!(e.target.nodeName == "text") && !pc.isBrushed()){
      inSearch = false
      afterHighlight = false
      cancelHighlight()  
      updateWordAxis(active_data)
    }
})

//Search events
$("body").on("mouseover",".result",function(){
  inSearch = false
  word = $(this).find(".title").html()
  highlightWords(word)
})

// on hover list item events
$("body").on("mouseenter",".list-group-item",function(e){
  //$(this).css("color","orange")
  $(this).css("font-weight","bold")
  mouseenter($(this).html())
})

$("body").on("mouseleave",".list-group-item",function(e){
  //$(this).css("color","black")
  $(this).css("font-weight","normal")
  mouseleave()
})

// capitalize string; word => Word
function capitalize(s)  {
  return s.charAt(0).toUpperCase() + s.slice(1)
}