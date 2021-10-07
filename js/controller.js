var thresh,
  words,
  active_words,
  selected_word = "none",
  wordAxis,
  data,
  active_data,
  highlighted_data,
  global_neighbors = [],
  pc,
  hideAxis = true,
  inSearch = false,
  afterHighlight = false,
  dragEndFlag = true;
//var defaultBrushExtent = [[0.4,0.45]];

bias_words = {
  gender: {
    Female:
      "she, daughter, hers, her, mother, woman, girl, herself, female, sister, daughters, mothers, women, girls, sisters, aunt, aunts, niece, nieces",
    Male: "he, son, his, him, father, man, boy, himself, male, brother, sons, fathers, men, boys, males, brothers, uncle, uncles, nephew, nephews",
  },
  race: {
    White:
      "white, whites, White, Whites, Caucasian, caucasian, European, european, Anglo",
    Black: "black, blacks, Black, Blacks, African, african, Afro",
  },
  sentiment: {
    unpleasant:
      "abuse, crash, filth, murder, sickness, accident, death, grief, poison, stink, assault, disaster, hatred, pollute, tragedy, divorce, jail, poverty, ugly, cancer, kill, rotten, vomit, agony, prison",
    pleasant:
      "caress, freedom, health, love, peace, cheer, friend, heaven, loyal, pleasure, diamond, gentle, honest, lucky, rainbow, diploma, gift, honor, miracle, sunrise, family, happy, laughter, paradise, vacation",
  },
  religion: {
    Islam:
      "allah, ramadan, turban, emir, salaam, sunni, koran, imam, sultan, prophet, veil, ayatollah, shiite, mosque, islam, sheik, muslim, muhammad",
    Christanity:
      "baptism, messiah, catholicism, resurrection, christianity, salvation, protestant, gospel, trinity, jesus, christ, christian, cross, catholic, church",
  },
  age: {
    Old: "ethel,bernice,gertrude,agnes,cecil,wilbert,mortimer,edgar",
    Young: "tiffany,michelle,cindy,kristy,brad,eric,joey,billy",
  },
  economic: {
    Poor: "poor, poorer, poorest, poverty, destitude, needy, impoverished, economical, inexpensive, ruined, cheap, penurious, underprivileged, penniless, valueless, penury, indigence, bankrupt, beggarly, moneyless, insolvent",
    Rich: "rich, richer, richest, affluence, advantaged, wealthy, costly, exorbitant, expensive, exquisite, extravagant, flush, invaluable, lavish, luxuriant, luxurious, luxury, moneyed, opulent, plush, precious, priceless, privileged, prosperous, classy",
  },
};

var last_selected_axis_name = null; // required for updating axis
var current_embedding = null;

/* 
called when the application is first loaded 
*/
$(document).ready(function () {
  // Spinner start
  // loading icon starts here
  //$('.container-fluid').hide();     // hide everything
  $("#spinner").addClass("lds-hourglass");

  $.get("/getFileNames/", function (res) {
    var target = res[1]; // List of file names for target

    //$('#gp1_dropdown').append(populateDropDownList(group));
    //$('#gp2_dropdown').append(populateDropDownList(group));
    $("#dropdown_target").append(populateDropDownList(target));
    //$('#word_sim_dropdown').append(populateDropDownList(sim_files));
    //$('#word_ana_dropdown').append(populateDropDownList(ana_files));

    // set current embedding
    current_embedding = $("#dropdown_embedding").val();

    // Choose default target : Profession
    $('#dropdown_target option[value="Profession"]').attr("selected", true);
    changeTarget("Profession");

    // Choose default groups
    //$('#gp1_dropdown option[value="Gender - Female"]').attr("selected",true);
    //changeBiastype("gp1_dropdown");
    //$('#gp2_dropdown option[value="Gender - Male"]').attr("selected",true);
    //changeBiastype("gp2_dropdown");
  });
  // create parallel plot

  $.get(
    "/get_csv/",
    {
      scaling: $("#scaling").val(),
      embedding: $("#dropdown_embedding").val(),
    },
    function (res) {
      initialize(res);
    }
  );
});

function initialize(res) {
  (hideAxis = true), (inSearch = false), (afterHighlight = false);
  word_clicked = "";
  $("#neighbors_list").empty();
  data = JSON.parse(res);
  //console.log(data);
  words = data.map(function (d) {
    return { title: d.word };
  });
  $(".ui.search").search("refresh");
  $(".ui.search").search({
    source: words,
    onSelect: function (d) {
      onClick(d.title);
    },
  });

  // populate histogram bias types
  populate_histogram_bias_type(data[0]);

  // loading icon stops once data is loaded
  $("#spinner").removeClass("lds-hourglass");
  $(".container-fluid").show(); // show everything once loaded

  pc = createParallelCoord(data); // important to load the PC with the whole dataset
  pc.on("brushend", function (d) {
    populate_neighbors(d);
    updateProgressBar(d);
    if (inSearch) {
      d3.selectAll([pc.canvas["highlight"]]).classed("faded", true);
      d3.selectAll([pc.canvas["brushed"]]).classed("faded", false);
      // d3.selectAll([pc.canvas["brushed"]]).classed("full", true);
      pc.canvas["brushed"].globalAlpha = 1;
    }
  });
  pc.on("brush", function (d) {
    addExtentLabels(pc.brushExtents());
  });
  plot_histogram();
}

function populate_histogram_bias_type(row) {
  bias_types = ["ALL"];
  for (key in row) {
    if (key == "word") {
      continue;
    }
    bias_types.push(key);
    //console.log(key);
  }
  $("#histogram_type").empty();
  $("#histogram_type").append(populateDropDownList(bias_types));
}

function addExtentLabels(extents) {
  d3.selectAll(".extentLabels").remove();
  ex = [];
  d3.keys(extents).forEach(function (k) {
    axis_extents = extents[k];
    axis_extents.forEach(function (d) {
      y0 = pc.dimensions()[k].yscale(d[0]);
      y1 = pc.dimensions()[k].yscale(d[1]) + 5;
      x = pc.position(k) - 18;
      ex.push({ x: x, y: y0, color: "black", word: d[0].toFixed(2) });
      ex.push({ x: x, y: y1, color: "black", word: d[1].toFixed(2) });
    });
  });
  addSVGLabels(ex, "extentLabels");
}

/* 
on dropdown menu change for Word Embedding
*/
$("#dropdown_embedding").change(function (event) {
  console.log("Change dropdown menu - Word Embedding");
  console.log($("#dropdown_embedding").val());
});

function searchWords(word) {
  $.get("/search/" + word, {}, (res) => {
    updateProgressBar(res);
    highlightWords(word, res);
  });
}

function populate_neighbors(brushed_data) {
  $("#neighbors_list").empty();
  brushed_data.forEach(function (neighbor, i) {
    $("#neighbors_list").append(
      '<li class="list-group-item">' + neighbor["word"] + "</li>"
    );
  });
}

function populate_brushed_words() {
  brushed_data = pc.brushed(); //.map(function(d){return d.word});
  $("#neighbors_list").empty();
  //console.log("brushed words -- ",brushed_words);
  tmp = "";
  brushed_data.forEach(function (neighbor, i) {
    //console.log("neighbor  ",neighbor)
    tmp = tmp + '<li class="list-group-item">' + neighbor["word"] + "</li>";
    //$("#neighbors_list").append('<li class="list-group-item">'+neighbor+'</li>')
  });
  setTimeout(function () {
    $("#neighbors_list").html(tmp);
  }, 100);
  //$("#neighbors_list").html(tmp);
  //highlightWords(null,neighbors=brushed_words)
}
