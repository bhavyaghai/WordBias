/*
Create zero divider
*/
function createZeroLine(){
    d = "M "
    for(i=0;i<attrs.length;i++){
      // console.log(x,y)
      x = pc.position(attrs[i])
      y = pc.dimensions()[attrs[i]].yscale(0)
      d = d+x.toString()+" "+y.toString()
      if(i < attrs.length-1)
        d = d+" L "
    }
    console.log(d)
    d3.select("#canvas_svg>g")
      .append('path')
      .attr("d", d)
      .attr( "stroke","grey")
      .attr( "stroke-width","3")
}

function drawLine(ctx,x1,y1,x2,y2){
	ctx.beginPath();
	ctx.moveTo(x1, y1) 
	ctx.lineTo(x2, y2) 
	ctx.stroke();
}
function addLabels(data_rows){
	d3.select("#canvas_svg>g")
    .selectAll(".dynamicLabel")
      .data(data_rows).enter()
        .append("text")
        .attr("class","dynamicLabel")
        .attr("x",d => d.x)
        .attr("y",d => d.y)
        .attr("fill",d => d.color)
        .attr("text-anchor","end")
        .style("z-index","-4")
        .text(d => d.word)
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
  	addLabels(data_rows)
}
function highlightWords(word,neighbors=[]){
  this.neighbors = neighbors
  data_rows = this.data.filter(function(d,i){return d.word == word || neighbors.includes(d.word.toLowerCase())})
  if(!afterHighlight){
    console.log("enterrr")
    selected_word = word
    $("#word_dimension .tick text").attr("opacity","0.0")
    pc.highlight(data_rows)
    showText(data_rows,word)
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

/*
Plot histogram, and histogram change functions
*/
function plot_histogram() {
  hist_type = $("#histogram_type").val();
  console.log(hist_type)
  $.get("/get_histogram/"+hist_type, {
      //type: bias_identify_type
    }, res=>{
        min_val = res["min"]
        max_val = res["max"]
        // console.log("Min and max val: ", min_val, "    ", max_val)
        values = res["values"]
        // console.log(values.length)
        // clear existing histogram
        $("#histogram").empty();
        createHistogram(values)
        // If slider for histogram exist
        if($('#slider').text().length != 0) { 
          slider.noUiSlider.destroy()
        }
        // create slider  
        if(hist_type=="ALL") {
            console.log("creating slider")
            createSlider(0, 0, max_val-0.2, max_val);
        }
        else {
            createSlider(min_val, min_val+0.1, max_val-0.1, max_val); 
        } 
        onChangeHistogram();
  });
}

// fetch and replot parallel coordiante
function onChangeHistogram() {
  hist_type = $("#histogram_type").val();
  var slider_ranges = slider.noUiSlider.get();
  // create parallel plot
  $.get("/fetch_data", {
    hist_type : hist_type,
    slider_sel : slider_ranges
  }, res => {
      this.active_data = JSON.parse(res).map(function(d){
        return {word:d.word,gender:d.gender,race:d.race,economic_status:d.eco}
      })
      this.active_words = active_data.map(function(d){return d.word})
      // console.log(active_data)
      if(this.pc){
        if(active_words.length <70){
          if(hideAxis){
            pc.hideAxis([])
            hideAxis = false
          }
          pc.dimensions()["word"].yscale.domain( active_words)
          pc.dimensions()['word'].tickValues = active_words
          pc.updateAxes()
        }
        else if(!hideAxis){
          pc.hideAxis(["word"])
          hideAxis = true
        }
        this.pc.data(active_data).render()
      }
      else{
        this.pc = createParallelCoord(active_data);
        pc.render()
        // cloneCanvas()
      }
  });
}