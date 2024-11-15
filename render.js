// Set up the renderer
const grenderer = new THREE.WebGLRenderer();
grenderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(grenderer.domElement);


slider_defs = [
    ["mySlider1", "sliderValue1", 0, 100, 50, "unused", ""],
    ["mySlider2", "sliderValue2", 0, 100, 50, "Tooth Shift:", "SliderToothShift", (x) => (x - 50) / 50],
    ["mySlider3", "sliderValue3", 0, 100, 50, "Eccentricity", "SliderEccentricity", (x) => x / 100],
    ["mySlider4", "sliderValue4", 0, 100, 50, "unused", ""],
    ["mySlider5", "sliderValue5", 0, 100, 50, "unused", ""],
    ["mySlider6", "sliderValue6", 4, 200, 12, "Teeth Count", "SliderNumberOfTeeth"],

    ["mySliderB1", "sliderValueB1", 0, 100, 50, "zoom:", "SliderZoom"],
    ["mySliderB2", "sliderValueB2", -50, 50, 0, "PanX:", "SliderPanX", (x) => -x],
    ["mySliderB3", "sliderValueB3", -50, 50, 0, "PanY", "SliderPanY", (x) => -x],
    ["mySliderB4", "sliderValueB4", -180, 180, 0, "RotationY", "SliderRotationY"],
    ["mySliderB5", "sliderValueB5", -180, 180, 0, "Gear Rot:", "SliderGearRot"], 
    ["mySliderB6", "sliderValueB6", 0, 100, 50, "unused", ""]
];

destructiveSliders = ["SliderShift", "SliderEccentricity", "SliderNumberOfTeeth","SliderToothShift"]

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
var hold = true;

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
            if (!hold && destructiveSliders.includes(variable)) {
                root_object.rebuild();
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    check_sliders();

    root_object.animate();
    hold = false;
}

function start() {
    if (root_object != null) {
        root_object.reset_cache();
        root_object.rebuild_all=true;
    }
    ConfigureMechanism(configuration_json, grenderer)

    animate();
}

function test() {
//    var g2 = root_object.childrenmap["gear2"];
//    var v = g2.getParameter("mult(gear1.Rpitch, 2)");
//    console.log(v);
    start();
}

start();
