/*
Left pane events
Bias options change events
*/

/* 
on Word Embedding dropdown menu -- word2vec, glove
*/
$('#dropdown_embedding').change(function(event) {
    console.log("Change dropdown menu - Word Embedding") 
    // set current embedding
    current_embedding = $("#dropdown_embedding").val()
    $.get("/set_model", {
    	embedding: current_embedding
    }, function(res) {
    	load_and_plot_new_data();
    });
});


/* 
on dropdown menu for feature scaling -- Percentile, Normalization 
*/
$('#scaling').change(function(event) {
    console.log("Change dropdown menu - Feature scaling") 
    console.log($('#scaling').val());
	load_and_plot_new_data();    
});

function load_and_plot_new_data() {
	$.get("/get_csv/", {
        scaling : $('#scaling').val(),
        embedding: $("#dropdown_embedding").val()
      },
      function(res) {
        data = JSON.parse(res)
        this.data = data
        this.words = data.map(function(d){return {title:d.word}})
        $('.ui.search').search('refresh')
        $('.ui.search')
          .search({
            source: words,
            onSelect: function(d){
              onClick(d.title)
            }
          });
		
        initalize_bundle(d3.keys(data[0]))

        // loading icon stops once data is loaded  
        //$('#spinner').removeClass("lds-hourglass");
        //$('.container-fluid').show();     // show everything once loaded

        pc = createParallelCoord(this.data);  // important to load the PC with the whole dataset
        pc.on("brushend",function (d) { 
          populate_neighbors(d)
          if(inSearch){
            d3.selectAll([pc.canvas["highlight"]]).classed("faded", true);
            d3.selectAll([pc.canvas["brushed"]]).classed("faded", false);
            // d3.selectAll([pc.canvas["brushed"]]).classed("full", true);
            pc.canvas["brushed"].globalAlpha = 1
          }
        })
        plot_histogram()
    });
}

/* 
on dropdown menu for histogram type -- ALL, gender, etc.
*/
$('#histogram_type').change(function(event) {
    console.log("Change dropdown menu - histogram_type")
    //if($('#slider').text().length != 0) { // If slider for histogram exist
        console.log("slider exist");
        plot_histogram(); 
    //} 
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
        hist_type = $("#histogram_type").val();
        ranges = []
        if(hist_type=="ALL") {
            ranges = [[max_val-0.05, max_val]]
        }
         else {
             ranges = [[min_val, min_val+0.1],[max_val-0.1, max_val]]
        }
        createHistogram(values, ranges)
        onChangeHistogram(ranges);
  });
}

// fetch and replot parallel coordiante
function onChangeHistogram(ranges=[]) {
  if(!ranges.length){
    alert("No data selected! please re-select")
    return
  }

  hist_type = $("#histogram_type").val();
  $.ajax({
      url: '/fetch_data',
      data: JSON.stringify({hist_type : hist_type,slider_sel : ranges}),
      type: 'POST',
      success: function(res){
          active_data = JSON.parse(res)
          active_words = active_data.map(function(d){return d.word}) 
          pc.brushReset()
          pc.data(active_data).render()
          updateWordAxis(active_data)        
      },
      error: function(error){
          console.log("error !!!!");
      }
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

//function rerender(axis_name) {
function rerender(axis_name, res_all, res_active) {
  for(i=0;i<data.length;i++) {
    data[i][axis_name] = res_all[i]
  }
  for(i=0;i<active_data.length;i++) {
    active_data[i][axis_name] = res_active[i]
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
    for(i=0;i<data.length;i++) {
      delete data[i][axis_name]
    } 
    for(i=0;i<active_data.length;i++) {
      delete active_data[i][axis_name]
    }
    clear_bias_words_section()
}

$("#delete_axis").click(function() {
    console.log("Delete button clicked");
    axis_name = $("#bias_type").val()
    $("option[value='"+axis_name+"']").remove();
    deleteAxis(axis_name)
});

$("#add_axis").click(function() {
    console.log("Add button clicked");
    axis_name = $("#bias_type").val().toLowerCase()
    gp1_name = $("#gp1_label").val().toLowerCase()
    gp2_name = $("#gp2_label").val().toLowerCase()
    console.log(axis_name, gp1_name, gp2_name)
    if(axis_name=="" || gp1_name=="" || gp2_name=="" || $("#gp1").val()=="" || $("#gp2").val()=="") {
      alert('Fill all required fields');
      return
    }
    bias_words[axis_name] = {
      [gp2_name]: $("#gp2").val(),
      [gp1_name]: $("#gp1").val()
    }

    $.get("/compute_new_bias", {
        axis_name: axis_name,
        gp1_words: $("#gp1").val().toLowerCase(),
        gp2_words: $("#gp2").val().toLowerCase(),
        active_words: JSON.stringify(active_words)
    }, res => {
      console.log(res);
      rerender(axis_name, res["all_data"], res["active_data"])

      // update bias type histogram options
      new_html = $("#histogram_type").html() + "<option value='"+axis_name+"'>"+axis_name+"</option>"
      $("#histogram_type").html(new_html)
    });
});

function clear_bias_words_section() {
  $("#gp1_label").val("")
  $("#gp1").val("")

  $("#gp2_label").val("")
  $("#gp2").val("")

  $("#bias_type").val("")
}

// On click Highlight button
$("#highlight_words").click(function() {
    console.log("Highlight button clicked");
    // afterHighlight =  true
    inSearch = true
    filter_words = []
    text = $("#target").val().toLowerCase()
    // Regex expression to split by newline and comma
    // https://stackoverflow.com/questions/34316090/split-string-on-newline-and-comma
    // https://stackoverflow.com/questions/10346722/how-can-i-split-a-javascript-string-by-white-space-or-comma
    text = text.split(/[\n, ]+/)
    for(i=0;i<text.length;i++) {
    	if(text[i].length>0) {
    		filter_words.push(text[i])
    	}
    }
    highlightWords(null,neighbors=filter_words)
});