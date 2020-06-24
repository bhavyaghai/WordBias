
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
  updateWordAxis(active_data)
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

/*Word search and highlight functions
*/
// function showText(data_rows, word){
//   attr = "gender" 
//   ctx = afterHighlight ? pc.ctx['after_highlight']:pc.ctx['highlight']
//   x = pc.position(attr)
//   y1 = 2
//   data_rows.forEach(function(row){
//     color = (row['word'] == word) ? "#43a2ca" : "orange"
//     y = pc.dimensions()[attr].yscale(row[attr]) 
//     if (typeof y == 'undefined' & !hideAxis){
//       row["x"] = x-10
//       row["color"] = color
//       row["y"] = y1+3
//       if(!afterHighlight){
//         ctx.strokeStyle = color
//         drawLine(ctx, x, y1, pc.position("gender"), pc.dimensions()["gender"].yscale(row["gender"]))
//       }
//       else{
//         ctx.strokeStyle = "orange"
//         drawLine(ctx, x, globalY, pc.position("gender"), pc.dimensions()["gender"].yscale(row["gender"]))
//       }
//       y1 += 20
//     }
//     else if((row['word'] != word)  || hideAxis){
//       row["x"] = x-10
//       row["color"] = color
//       row["y"] = y+3 
//     }
//   })
//   if(!afterHighlight)
//     addLabels(data_rows,"dynamicLabel")
// }


function searchWords(word){
  $.get("/search/"+word, {
  }, res=>{
    highlightWords(word,res)
  })
}