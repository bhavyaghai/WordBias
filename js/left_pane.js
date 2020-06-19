/*
Left pane events
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
        values = res["values"]
        $("#histogram").empty();
        createHistogram(values)
        onChangeHistogram([[0.45,0.65]]);
  });
}


// Given a list as input, populate drop down menu with each element as an option
function populateDropDownList(data) {
  var option = '';
  for (var i=0;i<data.length;i++){
   option += '<option value="'+ data[i] + '">' + data[i] + '</option>';
  }
  return option;
}

function changeTarget(selVal) {
  // path = './data/wordList/target/'+selVal
  if(current_embedding =='Hindi fastText'){
    path = './data/wordList/target/hi/'+selVal
  }
  else if (current_embedding == 'French fastText'){
    path = './data/wordList/target/fr/'+selVal
  }
  else {
    path = './data/wordList/target/en/'+selVal
  }
  console.log("selval is: ", selVal);
  if(selVal=='Custom') {
    $('#target').val("");
    return;
  }
  $.get("/getWords", {
    path: path
    }, res => {
    console.log(res);
    $('#target').val(res["target"].join());
  });
}

// @input
// id: specifies whether its gp1_dropdown, gp2_dropdown
// function: populates gp1 textarea & gp2 textarea corresponding to dropdown value 
function changeBiastype(id) {
  var selectedOption = $('#'+id).val();
  console.log("selected option is: ", selectedOption);
  if(current_embedding =='Hindi fastText'){
    path = './data/wordList/groups/hi/'+selectedOption;
  }
  else if (current_embedding == 'French fastText'){
    path = './data/wordList/groups/fr/'+selectedOption;
  }
  else {
    path = './data/wordList/groups/en/'+selectedOption;
  }
  
  console.log("path for file is: ", path);
  if(selectedOption=='Custom') {
    if(id=="gp1_dropdown") {
      $('#gp1').val("");
    }
    else if(id=="gp2_dropdown"){
      $('#gp2').val("");
    }
    return;
  }
  $.get("/getWords", {
    path: path
    }, res => {
    console.log(res);
    if(id=="gp1_dropdown") {
      $('#gp1').val(res["target"].join());
    }
    else if(id=="gp2_dropdown"){
      $('#gp2').val(res["target"].join());
    }
  });
}


// fetch and replot parallel coordiante
function onChangeHistogram(ranges=[]) {
  console.log(ranges)
  hist_type = $("#histogram_type").val();
  // var slider_ranges = slider.noUiSlider.get();
  // create parallel plot
  $.ajax({
      url: '/fetch_data',
      data: JSON.stringify({hist_type : hist_type,slider_sel : ranges}),
      type: 'POST',
      success: function(res){
          console.log(JSON.parse(res))
          active_data = JSON.parse(res).map(function(d){
            return {word:d.word,gender:d.gender,race:d.race,economic_status:d.eco}
          })
          active_words = active_data.map(function(d){return d.word})
          // console.log(active_data)
          if(pc){
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
            pc.data(active_data).render()
          }
          else{
            pc = createParallelCoord(active_data);
            pc.render()
            // cloneCanvas()
          }         
      },
      error: function(error){
          console.log("error !!!!");
      }
  });
}

function rerender(axis_name) {
  for(i=0;i<data.length;i++) {
    data[i][axis_name] = Math.random()
  }
  for(i=0;i<active_data.length;i++) {
    active_data[i][axis_name] = Math.random()
  }
  pc.data(active_data)
  dim = pc.dimensions()
  dim[axis_name] = {title:axis_name}
  pc.dimensions(dim).updateAxes().render()
  clear_bias_words_section()
}

function deleteAxis(axis_name) {
    delete bias_words[axis_name]
    dim = pc.dimensions()
    delete dim[axis_name]
    pc.dimensions(dim).updateAxes().render()
}

$("#delete_axis").click(function() {
    console.log("Delete button clicked");
    axis_name = $("#bias_type").val()
    deleteAxis(axis_name)
});

$("#add_axis").click(function() {
    console.log("Add button clicked");
    axis_name = $("#bias_type").val()
    gp1_name = $("#gp1_label").val()
    gp2_name = $("#gp2_label").val()
    console.log(axis_name, gp1_name, gp2_name)
    if(axis_name=="" || gp1_name=="" || gp2_name=="" || $("#gp1").val()=="" || $("#gp2").val()=="") {
      return
    }
    bias_words[axis_name] = {
      gp1_name: $("#gp1").val(),
      gp2_name: $("#gp2").val()
    }
    rerender(axis_name)
    //pc.dimensions(dim).updateAxes().render()
});

$("#update_axis").click(function() {
    console.log("Update button clicked");
    deleteAxis(last_selected_axis_name)
    last_selected_axis_name = null;
    axis_name = $("#bias_type").val()
    gp1_name = $("#gp1_label").val()
    gp2_name = $("#gp2_label").val()
    if(axis_name=="" || gp1_name=="" || gp2_name=="" || $("#gp1").val()=="" || $("#gp2").val()=="") {
      return
    }
    bias_words[axis_name] = {
      gp1_name: $("#gp1").val(),
      gp2_name: $("#gp2").val()
    }
    rerender(axis_name)
    //pc.dimensions(dim).updateAxes().render()
});


function clear_bias_words_section() {
  $("#gp1_label").val("")
  $("#gp1").val("")

  $("#gp2_label").val("")
  $("#gp2").val("")

  $("#bias_type").val("")
}

$("body").on("click","svg",function(e){
  // if ($("#word_dimension .tick text").contains(e.target)){
    // target = $(e.target)
    ele = $(e.target);
    // clicking on word in the word axis
    if($("#word_dimension .tick").has(ele).length==1 && e.target.nodeName == "text"){
      // console.log(target)
      console.log("clicking on a tick") 
      inSearch = true
      word_selected = ele.html();
      $(".ui.search").search("set value",word_selected)
      searchWords(word_selected)
    }
    // clicking on title of axis like "gender", "race", etc.
    else if($(".tick").has(ele).length==0 && e.target.nodeName == "text") {
        axis_name = ele.html();
        last_selected_axis_name = axis_name;
        console.log("clicking on the title of axis "+axis_name)
        if(axis_name!="word") {
          clear_bias_words_section()
          // populate corresponding bias words in the textarea
          group_words = bias_words[axis_name]
          group_names = Object.keys(group_words);

          $("#bias_type").val(axis_name)         

          $("#gp1_label").val(group_names[0])
          $("#gp2_label").val(group_names[1])

          $("#gp1").val(group_words[group_names[0]])
          $("#gp2").val(group_words[group_names[1]])
        }
    }
    // clicking anywhere else -> cancelHighlight
    else{
      console.log("clicking eleswhere") 
      inSearch = false
      $(".ui.search").search("set value","")
      cancelHighlight()
      clear_bias_words_section()
    }

  // } 
})
