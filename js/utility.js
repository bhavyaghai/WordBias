
function initializePC(){
  pc = createParallelCoord(active_data);
  pc.render()
  wordAxis = d3.scale.ordinal()
            .domain(active_words)
            .rangePoints([pc.h(), 1]);
  d3.select("#canvas_svg>g").append("g")
      .attr("id", "word_axis")
      .attr("class","y axis")
      .attr("transform", "translate(105,0)")
  addWords(active_data)
}
function addWords(active_data){
  
  $("#word_axis").empty()
  var yAxis = d3.svg.axis()
    .scale(wordAxis)
    .tickValues(active_words)
    .orient("left");

  d3.select("#word_axis").call(yAxis);
  drawWordLines(active_data,"foreground")
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

function updatePC(active_words){
  if(active_words.length <75){
    wordAxis.domain(active_words) 
    addWords(active_data)
  }
  else{
    $("#word_axis").empty();
    
    d3.select("#word_axis").append("foreignObject")
                    .attr("width",250)
                    .attr("height",200)
                    .attr("y",pc.h()/2)
                    .attr("x",-100)
                    // .style("width","100px")
                    .append("xhtml")
                    .html("<h4>Word axis is currently not available</h4>"+
                      "<p> as number of words > 100. "+
                      "Use brushing, hover, search bar, or histogram on the left to select words.</p>")
  }
}
// fetch and replot parallel coordiante
function onChangeHistogram(ranges=[]) {
  console.log(ranges)
  hist_type = $("#histogram_type").val();
  // create parallel plot
  $.ajax({
      url: '/fetch_data',
      data: JSON.stringify({hist_type : hist_type,slider_sel : ranges}),
      type: 'POST',
      success: function(res){
          // console.log(JSON.parse(res))
          active_data = JSON.parse(res)
          active_words = active_data.map(function(d){return d.word})
          if(pc){
            
            pc.data(active_data).render()
            updatePC(active_words)
          }
          else{
            initializePC()
          }         
      },
      error: function(error){
          console.log("error !!!!");
      }
  });
}

/*Word search and highlight functions
*/
function showText(data_rows, word){
  attr = "gender" 
  ctx = afterHighlight ? pc.ctx['after_highlight']:pc.ctx['highlight']
  x = pc.position(attr)
  y1 = 2
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
    addLabels(data_rows,"dynamicLabel")
}

function highlightWords(word,neighbors=[]){
  this.neighbors = neighbors
  data_rows = this.data.filter(function(d,i){return d.word == word || neighbors.includes(d.word.toLowerCase())})
  if(!afterHighlight){
    selected_word = word
    pc.highlight(data_rows)
    drawWordLines(data_rows,"highlight")
    // showText(data_rows,word)
    $("#neighbors_list").empty()
    neighbors.forEach(function(neighbor,i){
        // if(i<)
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
    if(active_words.length<70){
      console.log("mouseout")
      $("#word_dimension .tick text").attr("opacity","1")
      // pc.updateAxes()
    }
    $("#neighbors_list").empty()
    $(".dynamicLabel").remove()
    // $("text").removeClass("dynamicLabel")
    pc.unhighlight()

  }  
}
function searchWords(word){
  $.get("/search/"+word, {
  }, res=>{
    highlightWords(word,res)
  })
}