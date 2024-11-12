// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add ambient light (soft, all-directional light)
const ambientLight = new THREE.AmbientLight(0x404040, 1); // Color and intensity
scene.add(ambientLight);

// Add directional light (stronger light from a specific direction)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Color and intensity
directionalLight.position.set(5, 5, 10); // Position the light above and to the side
scene.add(directionalLight);

// Variables to store both extruded meshes for rotation
let extrudedMesh1= null, extrudedMesh2=null;
const pitchRadius = 5;

// Function to instantiate and add an extruded mesh to the scene
function extrudeAndAddToScene(outline, faces, teeth, extrusionDepth, offsetX = 0, col) {
    const extruder = new Extrude();
    
    // Call extrudeShape to create the extrusion from outline, faces, and teeth
    extruder.extrudeShape(outline, faces, teeth, extrusionDepth);
    
    // Get the mesh generated by the extruder
    const extrudedMesh = extruder.getMesh(col);

    // Position the mesh with an offset if provided
    extrudedMesh.position.x = offsetX;

    // Add the mesh to the scene
    scene.add(extrudedMesh);
    return extrudedMesh; // Return the mesh to store in a variable
}

let outline, faces, teeth;
// Test function to generate the gear shape
function test(numTeeth=4) {
    const pressureAngle = 20 * Math.PI / 180;
    const module = 1;

    const gear = new PlanetaryGear(module, numTeeth, pressureAngle);
    const extrusionDepth = 2;
    scene.remove(extrudedMesh1);
    extrudedMesh1 = extrudeAndAddToScene(gear.Outline, gear.Faces, gear.Teeth, extrusionDepth,0, 0x0077ff);

    // Extrude and add the second gear, offset to the right by the pitchRadius * 2
    //scene.remove(extrudedMesh2);
    //extrudedMesh2 = extrudeAndAddToScene(gear.Outline, gear.Faces, gear.Teeth, extrusionDepth, gear.Rpitch * 2, 0x00ff88);
}


// Run the test function to add the extruded shapes to the scene
test();

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

// Animation loop to render the scene
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate both extruded meshes if they exist
    if (extrudedMesh1 && extrudedMesh2) {
        //extrudedMesh1.rotation.z += 0.01; // Rotate around z-axis
        //extrudedMesh2.rotation.z -= 0.01; // Rotate around z-axis
        //camera.rotation.z+=.05;

        const value1 = slider1.value;
        sliderValueDisplay1.textContent = value1;
        const value2 = slider2.value;
        sliderValueDisplay2.textContent = value2;
        const value3 = slider3.value;
        sliderValueDisplay3.textContent = value3;
        const value4 = slider4.value;
        sliderValueDisplay4.textContent = value4;
        const value5 = slider5.value;
        sliderValueDisplay5.textContent = value5;
        const value6 = slider6.value;
        sliderValueDisplay6.textContent = value6;

        test(value6)
        var rot2=Math.PI/value6+Math.PI;

//        // Use the slider value in your three.js code, e.g., to change cube rotation speed
          extrudedMesh1.rotation.z = Math.PI*value1/200; // Rotate around z-axis
         // extrudedMesh2.rotation.z = rot2-Math.PI*value1/200; // Rotate around z-axis
    }

    renderer.render(scene, camera);
}
 
// Start the animation loop
animate();
