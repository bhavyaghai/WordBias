
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
  updatePC(active_data)
  pc.on("brushend",function (d) {
    updatePC(d,"brushed")
  })
}

// fetch and replot parallel coordiante
function onChangeHistogram(ranges=[]) {
  // console.log(ranges)
  hist_type = $("#histogram_type").val();
  // create parallel plot
  $.ajax({
      url: '/fetch_data',
      data: JSON.stringify({hist_type : hist_type,slider_sel : ranges}),
      type: 'POST',
      success: function(res){
          active_data = JSON.parse(res)
          active_words = active_data.map(function(d){return d.word})
          if(pc){
            pc.brushReset()
            pc.data(active_data).render()
            updatePC(active_data)
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

function searchWords(word){
  $.get("/search/"+word, {
  }, res=>{
    highlightWords(word,res)
  })
}