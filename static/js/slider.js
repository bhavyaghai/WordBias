slider = document.getElementById("slider");
noise_thresh = document.getElementById("threshold");
console.log($("#histogram").width())


// val_n represents initial position of 4 headers in the slider accompnaying the histogram
function createSlider(val1, val2, val3, val4) {
    $("#slider").css("width",$("#histogram>svg").width())
    min_val = val1 - 0.01;
    max_val = val4 + 0.01;
    $("#slider").empty();
    noUiSlider.create(slider, {
        start: [val1, val2, val3, val4],
        connect: [false, true, false, true, false],
        behaviour: 'drag-tap',
        range: {
            'min': min_val,
            'max': max_val
        },
        tooltips: true
    });

    // Binding signature
    slider.noUiSlider.on('change', function () {
        console.log("Slider values updated!");
        console.log(slider.noUiSlider.get());
        onChangeHistogram()
    });

    mergeTooltips(slider, 15, ' -> ');
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


/*  https://refreshless.com/nouislider/examples/
// merging tooltips when two headers come real close
/**
 * @param slider HtmlElement with an initialized slider
 * @param threshold Minimum proximity (in percentages) to merge tooltips
 * @param separator String joining tooltips
 */
function mergeTooltips(slider, threshold, separator) {

    var textIsRtl = getComputedStyle(slider).direction === 'rtl';
    var isRtl = slider.noUiSlider.options.direction === 'rtl';
    var isVertical = slider.noUiSlider.options.orientation === 'vertical';
    var tooltips = slider.noUiSlider.getTooltips();
    var origins = slider.noUiSlider.getOrigins();

    // Move tooltips into the origin element. The default stylesheet handles this.
    tooltips.forEach(function (tooltip, index) {
        if (tooltip) {
            origins[index].appendChild(tooltip);
        }
    });

    slider.noUiSlider.on('update', function (values, handle, unencoded, tap, positions) {

        var pools = [[]];
        var poolPositions = [[]];
        var poolValues = [[]];
        var atPool = 0;

        // Assign the first tooltip to the first pool, if the tooltip is configured
        if (tooltips[0]) {
            pools[0][0] = 0;
            poolPositions[0][0] = positions[0];
            poolValues[0][0] = values[0];
        }

        for (var i = 1; i < positions.length; i++) {
            if (!tooltips[i] || (positions[i] - positions[i - 1]) > threshold) {
                atPool++;
                pools[atPool] = [];
                poolValues[atPool] = [];
                poolPositions[atPool] = [];
            }

            if (tooltips[i]) {
                pools[atPool].push(i);
                poolValues[atPool].push(values[i]);
                poolPositions[atPool].push(positions[i]);
            }
        }

        pools.forEach(function (pool, poolIndex) {
            var handlesInPool = pool.length;

            for (var j = 0; j < handlesInPool; j++) {
                var handleNumber = pool[j];

                if (j === handlesInPool - 1) {
                    var offset = 0;

                    poolPositions[poolIndex].forEach(function (value) {
                        offset += 1000 - 10 * value;
                    });

                    var direction = isVertical ? 'bottom' : 'right';
                    var last = isRtl ? 0 : handlesInPool - 1;
                    var lastOffset = 1000 - 10 * poolPositions[poolIndex][last];
                    offset = (textIsRtl && !isVertical ? 100 : 0) + (offset / handlesInPool) - lastOffset;

                    // Center this tooltip over the affected handles
                    tooltips[handleNumber].innerHTML = poolValues[poolIndex].join(separator);
                    tooltips[handleNumber].style.display = 'block';
                    tooltips[handleNumber].style[direction] = offset + '%';
                } else {
                    // Hide this tooltip
                    tooltips[handleNumber].style.display = 'none';
                }
            }
        });
    });
}