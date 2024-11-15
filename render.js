const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

slider_defs = [
    ["mySlider1", "sliderValue1", 0, 100, 50, "unused", ""],
    ["mySlider2", "sliderValue2", 0, 100, 50, "Tooth Shift:", "SliderToothShift", (x) => (x - 50) / 50],
    ["mySlider3", "sliderValue3", 0, 100, 50, "Eccentricity", "SliderEccentricity", (x) => x / 100],
    ["mySlider4", "sliderValue4", 0, 100, 50, "unused", ""],
    ["mySlider5", "sliderValue5", 0, 100, 50, "unused", ""],
    ["mySlider6", "sliderValue6", 0, 100, 12, "Teeth Count", "SliderNumberOfTeeth"],

    ["mySliderB1", "sliderValueB1", 0, 100, 50, "zoom:", "SliderZoom"],
    ["mySliderB2", "sliderValueB2", 0, 100, 50, "PanX:", "SliderPanX", (x) => -x],
    ["mySliderB3", "sliderValueB3", 0, 100, 50, "PanY", "SliderPanY", (x) => -x],
    ["mySliderB4", "sliderValueB4", 0, 100, 50, "RotationY", "SliderRotationY", (x) => -x * Math.PI / 180],
    ["mySliderB5", "sliderValueB5", 0, 100, 50, "Gear Rot:", "SliderGearRot", (x) => x * Math.PI / 180], 
    ["mySliderB6", "sliderValueB6", 0, 100, 50, "unused", ""]
];

destructiveSliders = ["SliderShift", "SliderEccentricity", "SliderNumberOfTeeth"]

slider_ids=[]
function set_sliders()
{
    for (var i = 0; i < slider_defs.length;i++) {
        sliderdef = slider_defs[i];
        var slider = document.getElementById(sliderdef[0])
        var display = document.getElementById(sliderdef[1]);
        slider_ids.push(
            { slider: slider, display: display, prev: null }
        );
        slider.min = sliderdef[2];
        slider.max = sliderdef[3];
        slider.value = sliderdef[4];

        // Update the displayed value
        display.textContent = sliderdef[4];

        const label = document.querySelector(`label[for="${slider.id}"]`);
        label.textContent = sliderdef[5];
    }
}
set_sliders();

function check_sliders()
{
    for (var i = 0; i < slider_defs.length; i++) {
        var was = slider_ids[i].prev;
        var value = Number(slider_ids[i].slider.value);
        slider_ids[i].prev = value;
        slider_ids[i].display.textContent = value;
        if (was != value) {
            const variable = slider_defs[i][6];
            if (slider_defs[i].length > 7)
            {
                lambda = slider_defs[i][7];
                value = lambda(value);
            }
            if (variable != "") {
                root_object[variable] = value;
            }
            if (variable in destructiveSliders) {
                root_object.rebuild();
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    check_sliders();

    root_object.animate();
}

function start() {
    if (root_object != null) {
        root_object.reset_cache();
    }
    ConfigureMechanism(configuration_json)

    animate();
}

start();
