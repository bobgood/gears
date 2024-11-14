// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
let zoom = 50;         // Initial zoom (distance from the scene along Z-axis)
let panX = 0;          // Horizontal pan
let panY = 0;          // Vertical pan
let rotationY = 0;     // Rotation around the Y-axis


// Add ambient light (soft, all-directional light)
const ambientLight = new THREE.AmbientLight(0x404040, 1); // Color and intensity
scene.add(ambientLight);

// Add directional light (stronger light from a specific direction)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Color and intensity
directionalLight.position.set(5, 5, 10); // Position the light above and to the side
scene.add(directionalLight);

// Variables to store both extruded meshes for rotation
let mesh1 = null, mesh2 = null, mesh3 = null, mesh4 = null, mesh5 = null, mesh6=null;
const pitchRadius = 5;

// Function to instantiate and add an extruded mesh to the scene
function extrudeAndAddToScene(shape, extrusionDepth, offsetX = 0, color) {
    const extruder = new Extrude(shape, extrusionDepth);
    
    // Get the mesh generated by the extruder
    const mesh = extruder.getMesh(color);

    // Position the mesh with an offset if provided
    mesh.position.x = offsetX;

    // Add the mesh to the scene
    scene.add(mesh);
    return mesh; // Return the mesh to store in a variable
}

let outline, faces, teeth;
// Test function to generate the gear shape
let lastNumTeeth = 0;
let lastShift = 0;
let lastEccentricity = 0;
let egear2;
function build(numTeeth = 4, shift = 0, eccentricity = 0) {
    if (numTeeth === lastNumTeeth && shift === lastShift && eccentricity === lastEccentricity) {
        return;
    };

    lastNumTeeth = numTeeth;
    lastShift = shift;
    lastEccentricity = eccentricity;

    const pressureAngle = 20 * Math.PI / 180;
    const module = 1;
    const extrusionDepth = 2;

//    const gear = new SimpleGear(module, numTeeth, pressureAngle, shift);
//    scene.remove(mesh1);
//    mesh1 = extrudeAndAddToScene(gear, extrusionDepth,shift, 0x0077ff);
//
//    // Extrude and add the second gear, offset to the right by the pitchRadius * 2
//    scene.remove(mesh2);
//    mesh2 = extrudeAndAddToScene(gear, extrusionDepth, gear.Rpitch * 2, 0x00ff88);

    const pgear = new PlanetaryGear(module, numTeeth, pressureAngle,shift);
    scene.remove(mesh3);
    mesh3 = extrudeAndAddToScene(pgear, extrusionDepth,0, 0xff77ff);
    mesh3.position.z = 5;

//    const egear = new EllipticalGear(module, numTeeth, pressureAngle, shift, eccentricity);
//    scene.remove(mesh4);
//    mesh4 = extrudeAndAddToScene(egear, extrusionDepth, -(egear.A+egear.B)/2, 0xffffff);
//    mesh4.position.z = 10;
//
//    egear2 = new EllipticalGear(module, numTeeth, pressureAngle, shift + .5, eccentricity);
//    scene.remove(mesh5);
//    mesh5 = extrudeAndAddToScene(egear2, extrusionDepth, (egear.A + egear.B) / 2, 0xffff00);
//    mesh5.position.z = 10;
//    mesh5.rotation.z = Math.PI/2;
//
//    frame = new FrameGear(5, 1, 3);
//    scene.remove(mesh6);
//    mesh6 = extrudeAndAddToScene(frame, extrusionDepth, 0, 0xff0000);
//    mesh6.position.z = 13;

}


// Position the camera to view both shapes
camera.position.set(15, 15, 20); // Adjusted to see both objects
camera.lookAt(0, 0, 0); // Point the camera at the center of the scene

const slider1 = document.getElementById('mySlider1');
const sliderValueDisplay1 = document.getElementById('sliderValue1');
const slider2 = document.getElementById('mySlider2');
const sliderValueDisplay2 = document.getElementById('sliderValue2');
const slider3 = document.getElementById('mySlider3');
const sliderValueDisplay3 = document.getElementById('sliderValue3');
const slider4 = document.getElementById('mySlider4');
const sliderValueDisplay4 = document.getElementById('sliderValue4');
const slider5 = document.getElementById('mySlider5');
const sliderValueDisplay5 = document.getElementById('sliderValue5');
const slider6 = document.getElementById('mySlider6');
const sliderValueDisplay6 = document.getElementById('sliderValue6');
const sliderB1 = document.getElementById('mySliderB1');
const sliderValueDisplayB1 = document.getElementById('sliderValueB1');
const sliderB2 = document.getElementById('mySliderB2');
const sliderValueDisplayB2 = document.getElementById('sliderValueB2');
const sliderB3 = document.getElementById('mySliderB3');
const sliderValueDisplayB3 = document.getElementById('sliderValueB3');
const sliderB4 = document.getElementById('mySliderB4');
const sliderValueDisplayB4 = document.getElementById('sliderValueB4');
const sliderB5 = document.getElementById('mySliderB5');
const sliderValueDisplayB5 = document.getElementById('sliderValueB5');
const sliderB6 = document.getElementById('mySliderB6');
const sliderValueDisplayB6 = document.getElementById('sliderValueB6');

// Animation loop to render the scene
function animate() {
    requestAnimationFrame(animate);
    const value1 = Number(slider1.value);
    sliderValueDisplay1.textContent = value1;
    const value2 = Number(slider2.value);
    sliderValueDisplay2.textContent = value2;
    const value3 = Number(slider3.value);
    sliderValueDisplay3.textContent = value3;
    const value4 = Number(slider4.value);
    sliderValueDisplay4.textContent = value4;
    const value5 = Number(slider5.value);
    sliderValueDisplay5.textContent = value5;
    const value6 = Number(slider6.value);
    sliderValueDisplay6.textContent = value6;
    const valueB1 = Number(sliderB1.value);
    sliderValueDisplayB1.textContent = valueB1;
    const valueB2 = Number(sliderB2.value);
    sliderValueDisplayB2.textContent = valueB2;
    const valueB3 = Number(sliderB3.value);
    sliderValueDisplayB3.textContent = valueB3;
    const valueB4 = Number(sliderB4.value);
    sliderValueDisplayB4.textContent = valueB4;
    const valueB5 = Number(sliderB5.value);
    sliderValueDisplayB5.textContent = valueB5;
    const valueB6 = Number(sliderB6.value);
    sliderValueDisplayB6.textContent = valueB6;
    zoom = valueB1;
    panX = -valueB2;
    panY = -valueB3;
    rotationY = -valueB4*Math.PI/180;
    gearRot = valueB5 *Math.PI/180;

    toothCount = value6;
    toothShift = (value2 - 50) / 50;
    eccentricity = value3 / 100;
    build(toothCount, toothShift, eccentricity)
    
    // Rotate both extruded meshes if they exist
    if (mesh1) {
        mesh1.rotation.z += 0.01; // Rotate around z-axis
        //camera.rotation.z+=.05;

        var rot2=Math.PI/value6+Math.PI;

//        // Use the slider value in your three.js code, e.g., to change cube rotation speed
          mesh1.rotation.z = gearRot; // Rotate around z-axis
    }
    if (mesh2) {
        mesh2.rotation.z -= 0.01; // Rotate around z-axis
         mesh2.rotation.z = rot2-gearRot; // Rotate around z-axis

    }
    if (mesh3) {
        mesh3.rotation.z = gearRot; // Rotate around z-axis

    }
    if (mesh4) {
        mesh4.rotation.z = gearRot; // Rotate around z-axis

    }
    if (mesh5) {
        mesh5.rotation.z = egear2.convert_angle_to_ellipse_pair(gearRot);

    }
    if (mesh6) {
        mesh6.rotation.z = gearRot;
    }

    var cx = panX + zoom * Math.sin(rotationY);
    var cz = zoom * Math.cos(rotationY);
//    camera.position.set(panX, panY, zoom);
//    directionalLight.position.set(panX, panY, zoom); // Position the light above and to the side

    camera.position.set(cx, panY, cz);
    directionalLight.position.set(cx,panY,cz); // Position the light above and to the side

    camera.lookAt(new THREE.Vector3(panX, panY, 0)); // Keep looking toward the scene center

    renderer.render(scene, camera);
}
 
// Start the animation loop
animate();
