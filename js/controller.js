var thresh,
words,active_words,selected_word ="none",
data,active_data, neighbors,
pc,
attrs = ["gender","race","economic_status"],
categories = [{"gender":"Male","race":"Caucasian","economic_status":"Rich"},
              {"gender":"Female","race":"African American","economic_status":"Poor"}],
hideAxis=false, inSearch= false;
bias_words = {
  "gender": {
      "Male": "he,him,boy",
      "Female": "she,her,girl"
  },
  "race": {
      "White": "european,white",
      "Black": "african,black"
  },
  "economic_status": {
      "rich": "rich,wealthy",
      "poor": "poor,impoverished"
  }
}
var last_selected_axis_name = null;

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

// highlight a given word with optional neighbors
function highlightWords(word,neighbors=[]){
  // console.log(neighbors)
  selected_word = word
  $("#word_dimension .tick text").attr("opacity","0.1")
  this.neighbors = neighbors
  data_rows = this.data.filter(function(d,i){return d.word == word || neighbors.includes(d.word.toLowerCase())})
  pc.highlight(data_rows)
  
  // if(active_words.length >= 70)
  showText(data_rows,word)

  $("#neighbors_list").empty()
    neighbors.forEach(function(neighbor,i){
        if(i<20) {
          $("#neighbors_list").append('<li class="list-group-item">'+neighbor+'</li>')
        }
  })

}

function cancelHighlight(){
  if(!inSearch){
    if(active_words.length<70){
      //console.log("mouseout")
      $("#word_dimension .tick text").attr("opacity","1")
      // pc.updateAxes()
    }
    $("#neighbors_list").empty()
    pc.unhighlight()
  }   
}

/*
Create zero divider
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
*/


/*
Word search and highlight functions
*/
function showText(data_rows, word){
  if(hideAxis)
    attr = "gender"
  else
    attr = "word"

  ctx = pc.ctx['highlight']
  // ctx.globalAlpha = 0.5;
  //console.log(ctx,word)
  ctx.font = "14px sans-serif"
  ctx.textAlign = "end";
  
  x = pc.position(attr)
  y1 = 10
  data_rows.forEach(function(row){
    y = pc.dimensions()[attr].yscale(row[attr])
    //console.log(row[attr],y)
    if(row['word'] == word){
      ctx.fillStyle = "steelblue";  //"#43a2ca"
      ctx.strokeStyle = "steelblue";  //"#43a2ca"
    }
    else{
      ctx.fillStyle = "orange";
      ctx.strokeStyle = "orange"
    }

    if (typeof y == 'undefined'){
      ctx.fillText(row['word'], x-10, y1+3);
      if(!hideAxis){
        ctx.beginPath();
        ctx.moveTo(x, y1+3) 
        ctx.lineTo(pc.position("gender"), pc.dimensions()["gender"].yscale(row["gender"])) 
        ctx.stroke();
      }
    }
    else
      ctx.fillText(row['word'], x-10, y+3);

    y1 += 20
  })
  
}


function searchWords(word){
  $.get("/search/"+word, {
      //type: bias_identify_type
  }, res=>{
    highlightWords(word,res)
  })
}

// Hover over any word in the word axis
// Highlight word on hover
$("body").on("mouseover","#word_dimension .tick text",function(){
  if(!inSearch)
    highlightWords($(this).html())
})
// Remove highlighting on mouseout
$("body").on("mouseout","#word_dimension .tick text",function(){
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


//$("body").on("mouseout",".result",function(){
//  cancelHighlight()  
//})

//$(".cancel.icon").on("click",function(){
//  $(".ui.search").search("set value","")
//  inSearch = false
//  cancelHighlight()
//  // $("#neighbors_list").empty()
// })

/*
Top pane events
Parallel coordinates properties
smoothness, alpha. etc.
paracoord.js library events
*/
$("#alpha_input").on("change",function(){
  alpha = parseFloat($(this).val())
  pc.alpha(alpha).render()
  $("#alpha_text").html(alpha)
})

$("#smoothness_input").on("change",function(){
  smooth = parseFloat($(this).val())
  console.log("Smoothness: ", smooth)
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

// Reset brush button -- removes all brushes
$("#reset_brush").on("click",function(){
  pc.brushReset()
})


// EXTRAS
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