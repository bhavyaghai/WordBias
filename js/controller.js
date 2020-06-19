var thresh,
words,active_words,selected_word ="none",
data,active_data, neighbors,
pc,
//attrs = ["gender","race","economic_status"],
categories = [{"gender":"Female","race":"Caucasian","religion":"Christanity", "sentiment":"Pleasant"},
              {"gender":"Male","race":"African American","religion":"Islam", "sentiment":"Unpleasant"}],

hideAxis=false, inSearch= false, afterHighlight=false,globalY;
var defaultBrushExtent = [[0.45,0.65]];

bias_words = {
  "gender": {
      "Male": "man,boy,he,father,son,guy,male,his,himself,john",
      "Female": "woman,girl,she,mother,daughter,gal,female,her,herself,mary"
  },
  "race": {
      "White": "emily,anne,jill,allison,laurie,sarah,meredith,carrie,kristen,todd,neil,geoffrey,brett,brendan,greg,matthew,jay,brad",
      "Black": "aisha,keisha,tamika,lakisha,tanisha,latoya,kenya,latonya,ebony,rasheed,tremayne,kareem,darnell,tyrone,hakim,jamal,leroy,jermaine"
  },
  "sentiment": {
      "pleasant": "",
      "unpleasant": ""
  },
  "religion": {
    "Christanity": "",
    "Islam": ""
  }
}

var last_selected_axis_name = null;
var current_embedding = null;

/* 
called when the application is first loaded 
*/
$( document ).ready(function() {
    $.get( '/getFileNames/', function(res) {
    var group = res[0];     // List of file names for group
    console.log("groups dropdown has ", group);
    var target = res[1];   // List of file names for target
    //var sim_files = res[2]; // List of file names for word similarity benchmark
    //var ana_files = res[3]; // List of file names for word analogy benchmark
    // popoulating options for dropdown from file list drawn from backend
    $('#gp1_dropdown').append(populateDropDownList(group));
    $('#gp2_dropdown').append(populateDropDownList(group));
    $('#dropdown_target').append(populateDropDownList(target));
    //$('#word_sim_dropdown').append(populateDropDownList(sim_files));
    //$('#word_ana_dropdown').append(populateDropDownList(ana_files));

    // set current embedding
    current_embedding = $("#dropdown_embedding").val()

    // Choose default target : Profession
    $('#dropdown_target option[value="Profession"]').attr("selected",true);
    changeTarget("Profession");

    // Choose default groups
    //$('#gp1_dropdown option[value="Gender - Female"]').attr("selected",true);
    //changeBiastype("gp1_dropdown"); 
    //$('#gp2_dropdown option[value="Gender - Male"]').attr("selected",true);
    //changeBiastype("gp2_dropdown");
    });
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