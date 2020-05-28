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
        // create parallel plot
        createParallelCoord("/get_csv/");
    });
});


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

