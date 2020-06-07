var thresh;
var words,active_words;
var data,active_data,hideAxis=false, neighbors,selected_word ="none";
var pc
var attrs = ["gender","race","economic_status"],
categories = [{"gender":"Male","race":"Caucasian","economic_status":"Rich"},
              {"gender":"Female","race":"African American","economic_status":"Poor"}];
categories1 = [{"word":"Male","gender":"Caucasian","race":"Rich"},
              {"word":"Female","gender":"African American","race":"Poor"}];

// called when the application is first loaded 
$( document ).ready(function() {
    // load default target words
    // load_default_words()

    // create parallel plot
    d3.json("/get_csv/", function(data) {
      this.data = data.map(function(d){return {word:d.word,gender:d.gender,race:d.race,economic_status:d.eco}})
      console.log(data.length)
      this.words = data.map(function(d){return {title:d.word}})
      $('.ui.search')
        .search({
          source: words
        });
      // this.pc = createParallelCoord(this.data);
      plot_histogram()
      // pc.dimensions()
      // console.log(pc.dimensions())
      // createZeroLine()
    });
});

function createZeroLine(){
  // console.log(pc.svg)
    // ctx = pc.ctx['highlight']
    d = "M "
    // x = pc.position(attrs[0])
    // y = pc.dimensions()[attrs[0]].yscale(0)
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
       // fill="none"></path>')

}

function showText(data_rows, word){
  ctx = pc.ctx['highlight']
  console.log(ctx,word)
  ctx.font = "14px sans-serif"
  ctx.textAlign = "end";
  attr = "gender"
  x = pc.position(attr)
  data_rows.forEach(function(row){
    y = pc.dimensions()[attr].yscale(row[attr])
    if(row['word'] == word)
      ctx.fillStyle = "#43a2ca";
    else
      ctx.fillStyle = "orange";
    ctx.fillText(row['word'], x-10, y);
  })
  
}
function highlightWords(word,neighbors){
  // console.log(neighbors)
  data_rows = this.data.filter(function(d,i){return d.word == word || neighbors.includes(d.word.toLowerCase())})
  if(active_words.length <70){
    new_words = [...active_words]
    data_rows.forEach(function(row){
      if(active_words.indexOf(row['word'] == -1))
        new_words.push(row['word'])
    })
    pc.dimensions()["word"].yscale.domain(new_words)
    pc.dimensions()["word"].tickValues = new_words
    pc.updateAxes()
    
  }
  console.log(word,data_rows)
  pc.highlight(data_rows)
  
  if(active_words.length>= 70)
    showText(data_rows,word)

}
// function moveLabels(){
//   // $(".polarity1").empty()
//   // $(".polarity2").empty()
//   attrs.forEach(function(attr){
//     console.log(d3.select(".polarity1").text())
//   })

// }
function cloneCanvas(){
  var canvas = $('.foreground')
  console.log(canvas.width())
  clone = canvas.clone(); // true means clone all childNodes and all event handlers
  clone.attr("class", "words");
  $("#parallel_coord").append(clone);
}
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
// on dropdown menu for histogram type -- ALL, gender, etc.
$('#histogram_type').change(function(event) {
    console.log("Change dropdown menu - histogram_type")
    if($('#slider').text().length != 0) { // If slider for histogram exist
          console.log("slider exist");
          plot_histogram(); 
    } 
});

// fetch and replot parallel coordiante
function onChangeHistogram() {
  hist_type = $("#histogram_type").val();
  var slider_ranges = slider.noUiSlider.get();
  // create parallel plot
  $.get("/fetch_data", {
    hist_type : hist_type,
    slider_sel : slider_ranges
  }, res => {
      this.active_data = JSON.parse(res).map(function(d){return {word:d.word,gender:d.gender,race:d.race,economic_status:d.eco}})
      this.active_words = active_data.map(function(d){return d.word})
      // console.log(active_data)
      if(this.pc){
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
          // moveLabels()
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
$("body").on("mouseover",".result",function(){
  
  word = $(this).find(".title").html()
  selected_word = word
  // console.log(data[0])
  $.get("/search/"+word, {
      //type: bias_identify_type
  }, res=>{
    highlightWords(word,res)
  })
  // console.log(pc.dimensions()['gender'].yscale(data_row[0]['gender']))
  // console.log(pc.position("gender"))
})
$("body").on("mouseout",".result",function(){
  if(active_words.length<70){
    console.log("mouseout")
    // pc.clear("highlight")
    // console.log(new_words,active_words)
    pc.dimensions()["word"].yscale.domain(active_words)
    pc.dimensions()["word"].tickValues = active_words
    pc.updateAxes()
    // pc
    
  }
  pc.unhighlight()
  
})

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
