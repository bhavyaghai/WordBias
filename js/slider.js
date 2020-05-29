slider = document.getElementById("slider");
noise_thresh = document.getElementById("threshold");

function createSlider(min_val, max_val) {
    min_val = min_val - 0.01;
    max_val = max_val + 0.01;
    $("#slider").empty();
    noUiSlider.create(slider, {
        start: [min_val, min_val+0.05, max_val-0.05, max_val],
        connect: [false, true, false, true, false],
        behaviour: 'drag-tap',
        range: {
            'min': min_val,
            'max': max_val
        },
        tooltips: true
    });    
}

// Slider for Noise threshold
noUiSlider.create(noise_thresh, {
    start: 0,
    connect: [true, false],
    range: {
        'min': 0,
        'max': 0.15
    },
    step: 0.01,
    tooltips: false
});    

// Binding signature
noise_thresh.noUiSlider.on("update", function() {
    coeff_val_change(noise_thresh.noUiSlider.get());
});