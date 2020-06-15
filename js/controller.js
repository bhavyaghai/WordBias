var thresh,
words,active_words,selected_word ="none",
data,active_data, neighbors,
pc,
attrs = ["gender","race","economic_status"],
categories = [{"gender":"Male","race":"Caucasian","economic_status":"Rich"},
              {"gender":"Female","race":"African American","economic_status":"Poor"}],
hideAxis=false, inSearch= false, afterHighlight=false;

/* 
called when the application is first loaded 
*/
$( document ).ready(function() {
    // create parallel plot
    d3.json("/get_csv/", function(data) {
      this.data = data.map(function(d){return {word:d.word,gender:d.gender,race:d.race,economic_status:d.eco}})
      console.log(data.length)
      this.words = data.map(function(d){return {title:d.word}})
      $('.ui.search').search('refresh')
      $('.ui.search')
        .search({
          source: words,
          onSelect: function(d){
            inSearch = true
            // console.log(d)
            searchWords(d.title)
          }
        });
      // this.pc = createParallelCoord(this.data);
      plot_histogram()
    });
});

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

/*
Word search and highlight functions
*/
function showText(data_rows, word){
  attr = hideAxis ? "gender": "word"
  ctx = pc.ctx['highlight']
  x = pc.position(attr)
  y1 = 10
  data_rows.forEach(function(row){
    // if(row['word'])
    color = (row['word'] == word) ? "#43a2ca" : "orange"
    ctx.strokeStyle = color
    y = pc.dimensions()[attr].yscale(row[attr]) 
    if (typeof y == 'undefined' & !hideAxis){
      row["x"] = x-10
      row["color"] = color
      row["y"] = y1+3
      ctx.beginPath();
      ctx.moveTo(x, y1+3) 
      ctx.lineTo(pc.position("gender"), pc.dimensions()["gender"].yscale(row["gender"])) 
      ctx.stroke();
      y1 += 20
    }
    else if(row['word'] != word){
      row["x"] = x-10
      row["color"] = color
      row["y"] = y+3 
    }
  })
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
function highlightWords(word,neighbors=[]){
  // console.log(neighbors)
  selected_word = word
  this.neighbors = neighbors
  data_rows = this.data.filter(function(d,i){return d.word == word || neighbors.includes(d.word.toLowerCase())})
  if(!afterHighlight){
    console.log("enterrr")
    $("#word_dimension .tick text").attr("opacity","0.0")
    pc.highlight(data_rows)
  
    showText(data_rows,word)
    $("#neighbors_list").empty()
    neighbors.forEach(function(neighbor,i){
        // if(i<)
        $("#neighbors_list").append('<li class="list-group-item">'+neighbor+'</li>')
    })

  }
  else
    pc.afterHighlight(data_rows)
  
}
function cancelHighlight(){
  $("text").removeClass("focused")
  $("text").removeAttr("fill")
  if(afterHighlight){
    afterHighlight = false
    pc.unAfterHighlight()

  }
  else{
    if(active_words.length<70){
      console.log("mouseout")
      $("#word_dimension .tick text").attr("opacity","1")
      // pc.updateAxes()
    }
    $("#neighbors_list").empty()
    $(".dynamicLabel").remove()
    pc.unhighlight()

  }  
}
function searchWords(word){
  $.get("/search/"+word, {
  }, res=>{
    highlightWords(word,res)
  })
}

$("body").on("mouseenter","#word_dimension .tick text",function(e){
  if(!inSearch){
    // $("text").removeClass("focused")
    $(this).addClass("focused")
    $(this).attr("fill","#43a2ca")
    highlightWords($(this).html())
  }
  
})

$("body").on("mouseleave","#word_dimension .tick text",function(){
  if(!inSearch)
    cancelHighlight()
  
})
$("body").on("click","#canvas_svg",function(e){
    console.log(e.target.nodeName)
    if(e.target.nodeName == "text"){
      // console.log(target)
      inSearch = true
      searchWords($(e.target).html())
    }
    else{
      inSearch = false
      cancelHighlight()
    }
    // afterHighlight = true
})

$("body").on("mouseenter",".dynamicLabel",function(){
  afterHighlight = true
  highlightWords($(this).html())
})
$("body").on("mouseleave",".dynamicLabel",function(){
  cancelHighlight()
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
$(".cancel.icon").on("click",function(){
  $(".ui.search").search("set value","")
  inSearch = false
  cancelHighlight()
})

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
        // inSearch = false
        // cancelHighlight()
        // console.log(pc.dimensions()["word"])
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

/* 
on dropdown menu for histogram type -- ALL, gender, etc.
*/
$('#histogram_type').change(function(event) {
    console.log("Change dropdown menu - histogram_type")
    if($('#slider').text().length != 0) { // If slider for histogram exist
        console.log("slider exist");
        plot_histogram(); 
    } 
});

/*
paracoord.js library events
*/
$("#alpha_input").on("change",function(){
  alpha =+ $(this).val()
  pc.alpha(alpha).render()
  $("#alpha_text").html(alpha)
})
$("#smoothness_input").on("change",function(){
  smooth =+ $(this).val()
  pc.smoothness(smooth).render()
  $("#smoothness_text").html(smooth)
})
$("#bundle_input").on("change",function(){
  bundle =+ $(this).val()
  pc.bundlingStrength(bundle).render()
  $("#bundle_text").html(bundle)
})
$("#bundle_dimension").dropdown({
  onChange: function(value){
    console.log(value)
    pc.bundleDimension(value)}
    // $("#bundle_text").html(bundle)
})

/*
Bias options change events
*/
$("#dropdown_embedding").dropdown({
  // onChange: function(value){
  //   console.log(value)
  //   pc.bundleDimension(value)}
    // $("#bundle_text").html(bundle)
})
$("#quantification").dropdown({
  // onChange: function(value){
  //   console.log(value)
  //   pc.bundleDimension(value)}
    // $("#bundle_text").html(bundle)
})
$("#histogram_type").dropdown({})

$("#reset_brush").on("click",function(){
  pc.brushReset()
})

// on clicking ShowBias button
$('#showBias').on('click', function(event) {
    var tar = document.getElementById("target").value;
    tar = tar.split(/[ ,]+/).filter(Boolean);
    $.get("/groupDirectBias", {
      target: JSON.stringify(tar)
      //type: bias_identify_type
    },res => {
      console.log("Direct bias success fn called !!!");
      $("#parallel_coord").empty();
      createParallelCoord('/get_tar_csv/');
    });
    //highlight(tar);
  });

function coeff_val_change(newVal){
    thresh = newVal;
    $('#coeff_slider_val').text(newVal);
    change_threshold();
}

function load_default_words() {
    $.get("/get_tar_words/", res => {
        console.log(res);
        $('#target').val(res.join());
      });
}
