var thresh,
words,active_words,selected_word ="none",wordAxis,
data,active_data, highlighted_data, global_neighbors = [],
pc,
hideAxis=true, inSearch= false, afterHighlight=false;
//var defaultBrushExtent = [[0.4,0.45]];

bias_words = {
  "gender": {
      "Female": "woman,girl,she,mother,daughter,gal,female,her,herself,mary",
      "Male": "man,boy,he,father,son,guy,male,his,himself,john"
  },
  "race": {
      "White": "emily,anne,jill,allison,laurie,sarah,meredith,carrie,kristen,todd,neil,geoffrey,brett,brendan,greg,matthew,jay,brad",
      "Black": "aisha,keisha,tamika,lakisha,tanisha,latoya,kenya,latonya,ebony,rasheed,tremayne,kareem,darnell,tyrone,hakim,jamal,leroy,jermaine"
  },
  "sentiment": {
      "unpleasant": "abuse, crash, filth, murder, sickness, accident, death, grief, poison, stink, assault, disaster, hatred, pollute, tragedy, divorce, jail, poverty, ugly, cancer, kill, rotten, vomit, agony, prison",
      "pleasant": "caress, freedom, health, love, peace, cheer, friend, heaven, loyal, pleasure, diamond, gentle, honest, lucky, rainbow, diploma, gift, honor, miracle, sunrise, family, happy, laughter, paradise, vacation"
  },
  "religion": {
    "Islam": "allah, ramadan, turban, emir, salaam, sunni, koran, imam, sultan, prophet, veil, ayatollah, shiite, mosque, islam, sheik, muslim, muhammad",
    "Christanity": "baptism, messiah, catholicism, resurrection, christianity, salvation, protestant, gospel, trinity, jesus, christ, christian, cross, catholic, church"
  },
  "age": {
  	"Old": "ethel,bernice,gertrude,agnes,cecil,wilbert,mortimer,edgar",
    "Young": "tiffany,michelle,cindy,kristy,brad,eric,joey,billy"
  },
  "economic": {
    "Poor": "poor,poorer,poorest,needy,impoverished,economical,inexpensive,cheap,bankrupt,worthless,basic,plain",
    "Rich": "rich,richer,richest,affluence,affluent,wealthy,costly,lavish,luxury,plush,expensive,invaluable"
  }
}

var last_selected_axis_name = null;   // required for updating axis
var current_embedding = null;

/* 
called when the application is first loaded 
*/
$( document ).ready(function() {
    // Spinner start
    // loading icon starts here
    //$('.container-fluid').hide();     // hide everything
    $('#spinner').addClass("lds-hourglass"); 


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
      this.data = data
      // console.log(data.length)
      this.words = data.map(function(d){return {title:d.word}})
      $('.ui.search').search('refresh')
      $('.ui.search')
        .search({
          source: words,
          onSelect: function(d){
            onClick(d.title)
          }
        });
      $("#bundle_dimension").append(populateDropDownList(d3.keys(data[0])))
      $("#bias_type_dropdown").append(populateDropDownList(d3.keys(data[0])))
      console.log(data.length)
      // $("#prgressbar").progress({percent:85})
      // initalize_bundle(d3.keys(data[0]))

      // populate histogram bias types
      populate_histogram_bias_type(data[0])

      // loading icon stops once data is loaded  
      $('#spinner').removeClass("lds-hourglass");
      $('.container-fluid').show();     // show everything once loaded

      pc = createParallelCoord(this.data);  // important to load the PC with the whole dataset
      pc.on("brushend",function (d) { 

        populate_neighbors(d)
        updateProgressBar(d)
        if(inSearch){
          d3.selectAll([pc.canvas["highlight"]]).classed("faded", true);
          d3.selectAll([pc.canvas["brushed"]]).classed("faded", false);
          // d3.selectAll([pc.canvas["brushed"]]).classed("full", true);
          pc.canvas["brushed"].globalAlpha = 1
        }
        // console.log(pc.brushExtents())
        addExtentLabels(pc.brushExtents())
      })
      plot_histogram()
    });

    // set pointer type when hovering over any word on the word axis
    //$('#word_dimension .tick text').css('cursor', 'pointer');
});

function populate_histogram_bias_type(row) {
	bias_types = []
	for(key in row) {
		if(key=="word") {
			continue;
		}
		bias_types.push(key)
		//console.log(key);
	}
	$('#histogram_type').append(populateDropDownList(bias_types));
}

function addExtentLabels(extents){
  d3.selectAll(".extentLabels").remove()
  ex = []
  d3.keys(extents).forEach(function(k){
    axis_extents = extents[k]
    axis_extents.forEach(function(d){
      y0 = pc.dimensions()[k].yscale(d[0]) 
      y1 = pc.dimensions()[k].yscale(d[1])+5
      x = pc.position(k)-18
      ex.push({"x":x,"y":y0,"color":"black","word":d[0].toFixed(2)})
      ex.push({"x":x,"y":y1,"color":"black","word":d[1].toFixed(2)})
    })

  }) 
  addSVGLabels(ex,"extentLabels")
}

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


function searchWords(word){
  $.get("/search/"+word, {
  }, res=>{
    updateProgressBar(res)
    highlightWords(word,res)
  })
}

function populate_neighbors(brushed_data) {
  $("#neighbors_list").empty();
  brushed_data.forEach(function(neighbor,i){
      $("#neighbors_list").append('<li class="list-group-item">'+neighbor['word']+'</li>')
  })
}

function populate_brushed_words() {
  brushed_data = pc.brushed() //.map(function(d){return d.word});
  $("#neighbors_list").empty();
  //console.log("brushed words -- ",brushed_words);
  tmp = ""
    brushed_data.forEach(function(neighbor,i){
      //console.log("neighbor  ",neighbor)
      tmp = tmp + '<li class="list-group-item">'+neighbor["word"]+'</li>';
        //$("#neighbors_list").append('<li class="list-group-item">'+neighbor+'</li>')
    }) 
    setTimeout(function() { 
      $("#neighbors_list").html(tmp);
    }, 100);
    //$("#neighbors_list").html(tmp);
    //highlightWords(null,neighbors=brushed_words)
}