// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Generate gear outline points
const radius = 5;
const toothCount = 20;
const pressureAngle = 20;
const segmentsPerDegree = 1;

//const gearOutlinePoints = //generateGearOutline(radius, toothCount, pressureAngle, segmentsPerDegree);
//createGearOutline(.2, 20, 25, addCoeff = 1.0, dedCoeff = 1.25) ;

const wireBuilder = new WireBuilder();

// Call the _create_involute_profile function with sample parameters
_create_involute_profile(
    wireBuilder,
    2,              // module
    20,             // number_of_teeth
    (20 * Math.PI) / 180, // pressure_angle in radians
    true,           // split_involute
    0,              // rotation
    1.0,            // outer_height_coefficient
    1.0,            // inner_height_coefficient
    0.0,            // outer_fillet_coefficient
    0.0,            // inner_fillet_coefficient
    0.0             // profile_shift_coefficient
);

// Convert gear outline points to Vector2 for Three.js
const points = wireBuilder.getPoints().map(p => new THREE.Vector2(p.x, p.y));

// Create a shape from the points
const shape = new THREE.Shape(points);

// Create geometry from shape
const geometry = new THREE.BufferGeometry().setFromPoints(points);

// Create a line material
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

// Create the line and add it to the scene
const line = new THREE.Line(geometry, lineMaterial);
scene.add(line);

// Position the camera to view the shape
camera.position.z = 15;

// Animation loop to render the scene
function animate() {
    requestAnimationFrame(animate);

    // Render the scene
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
