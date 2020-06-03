var thresh;
var content;
var data;
var pc

// called when the application is first loaded 
$( document ).ready(function() {
    // load default target words
    // load_default_words()

    // create parallel plot
    d3.json("/get_csv/", function(data) {
      this.data = data
      content = data.map(function(d){return {title:d.word}})
      $('.ui.search')
        .search({
          source: content
        });
      console.log(data)
      this.pc = createParallelCoord(data);
    });
});

function showText(word,x,y){
  ctx = pc.ctx['highlight']
  console.log(ctx,word)
  ctx.font = "14px Verdana"
  ctx.textAlign = "end";
  ctx.fillStyle = "#43a2ca";
  ctx.fillText(word, x-10, y);

}
$("body").on("mouseover",".result",function(){
  
  word = $(this).find(".title").html()
  // console.log(data[0])
  data_row = data.filter(function(d){return d.word == word})
  console.log(word,data_row)
  pc.highlight(data_row.map(function(d){return {gender:d.gender,race:d.race,economic_status:d.eco}}))
  attr = "gender"
  x = pc.position(attr)
  y = pc.dimensions()[attr].yscale(data_row[0][attr])
  showText(data_row[0]['word'],x,y)
  // console.log(pc.dimensions()['gender'].yscale(data_row[0]['gender']))
  // console.log(pc.position("gender"))
})
$("body").on("mouseout",".result",function(){
  console.log("mouseout")
  // pc.clear("highlight")
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
