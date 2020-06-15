var thresh,
words,active_words,selected_word ="none",
data,active_data, neighbors,
pc,
attrs = ["gender","race","economic_status"],
categories = [{"gender":"Male","race":"Caucasian","economic_status":"Rich"},
              {"gender":"Female","race":"African American","economic_status":"Poor"}],
hideAxis=false, inSearch= false, afterHighlight=false,globalY;

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
            $("#word_dimension .tick text").attr("opacity","0.0")
            searchWords(d.title)
          }
        });
      // this.pc = createParallelCoord(this.data);
      plot_histogram()
    });
});

/* 
events associated with word axis
*/
$("body").on("mouseenter","#word_dimension .tick text",function(e){
  if(!inSearch){
    $(this).addClass("focused")
    $(this).attr("fill","#43a2ca")
    $("#word_dimension .tick text").attr("opacity","0.1")
    highlightWords($(this).html())
  }
  
})

$("body").on("mouseleave","#word_dimension .tick text",function(){
  if(!inSearch)
    cancelHighlight()
  
})
$("body").on("click","#canvas_svg",function(e){
    console.log(e.target.nodeName)
    if(e.target.nodeName == "text" && ($(e.target).parents("#word_dimension").length)){
      console.log("enterr")
      inSearch = true
      searchWords($(e.target).html())
      $("#word_dimension .tick text").attr("opacity","0.0")
    }
    else if(!$(e.target).hasClass("dynamicLabel")){
      inSearch = false
      cancelHighlight()
    }
})

$("body").on("mouseenter",".dynamicLabel",function(){
  $(".dynamicLabel").not(this).attr("opacity","0.5")
  afterHighlight = true
  globalY = parseFloat($(this).attr("y"))
  highlightWords($(this).html())
})
$("body").on("mouseleave",".dynamicLabel",function(){
  $(".dynamicLabel").attr("opacity","1")
  cancelHighlight()
})
$("body").on("mouseenter",".list-group-item",function(e){
  $(this).css("color","orange")
  word = $(this).html()
  wordLabel = $(".dynamicLabel").filter(function(){
    // console.log(d)
    return $(this).html() == word
  })
  // console.log(wordLabel)
  $(".dynamicLabel").not(wordLabel).attr("opacity","0.5")
  afterHighlight = true
  globalY = parseFloat(wordLabel.attr("y"))
  highlightWords(word)
})
$("body").on("mouseleave",".list-group-item",function(e){
  $(this).css("color","black")
  $(".dynamicLabel").attr("opacity","1")
  cancelHighlight()
})

/*
Search events
*/
$("body").on("mouseover",".result",function(){
  inSearch = false
  word = $(this).find(".title").html()
  $("#word_dimension .tick text").attr("opacity","0.1")
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
