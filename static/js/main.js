// called when the application is first loaded 
$(window).load(function(){
    // initialize slider
    //createSlider(0, 1);
    
    // load default target words
    load_target_words("Profession")
});


// load words for highlighting section
function load_target_words(value) {
  $.get("/get_tar_words/"+value, res => {
      console.log(res);
      $('#target').val(res.join());
  });
}


// on clicking Plot button - create parallel coordinate
$('#plot').on('click', function(event) {
    var embedding = $("#dropdown_embedding").val()
    // read embedding and calculate bias scores
    $.get("/setModel", {
      embedding: embedding
      //type: bias_identify_type
    }, res=>{
        plot_histogram();
    });
});


function plot_histogram() {
  hist_type = $("#histogram_type").val();
  $.get("/get_histogram/"+hist_type, {
      //type: bias_identify_type
    }, res=>{
        min_val = res["min"]
        max_val = res["max"]
        console.log("Min and max val: ", min_val, "    ", max_val)
        values = res["values"]
        // clear existing histogram
        $("#histogram").empty();
        createHistogram(values)
        // If slider for histogram exist
        if($('#slider').text().length != 0) { 
          slider.noUiSlider.destroy()
        }
        // create slider  
        if(hist_type=="ALL") {
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
      createParallelCoord(res);
  });
}


// on clicking ShowBias button
$('#showBias').on('click', function(event) {
    var tar = document.getElementById("target").value;
    var embedding = $("#dropdown_embedding").val()
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

