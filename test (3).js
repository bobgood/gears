// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


function ShapeVector2(points) {
    // Create a shallow copy of the original array to avoid modifying it
    const closedOutline = [...points];
    
    // Append the first point to the end to close the shape
    if (points.length > 0) {
        closedOutline.push(points[0]);
    }

    return closedOutline.map(p => new THREE.Vector2(p.x, p.y));
}

function addToScene(shape, color) {
    // Create geometry and material
    const geometry = new THREE.BufferGeometry().setFromPoints(ShapeVector2(shape));
    const lineMaterial = new THREE.LineBasicMaterial({ color: color });

    // Create the line and add it to the scene
    const line = new THREE.Line(geometry, lineMaterial);
    scene.add(line);
}


// Helper function to visualize a single large tooth
function test() {
    const outline = [];
    const inline = [];
    const teeth = [];
    const pitchRadius = 5;
    const addendum = 2; // Large addendum to make the tooth stand out
    const dedendum = 1; // Large dedendum to make the root obvious
    const segments = 4;
    const toothCount=9;
    const tipFrac=.4;
    pressureAngle = 20*Math.PI/180;

    gear(outline,inline, teeth, pitchRadius-dedendum, pitchRadius+dedendum, toothCount, tipFrac, pressureAngle, segments )
    addToScene(outline, 0x0000ff); // Blue outline
    addToScene(inline, 0x00ff00); // Blue outline
    addToScene(teeth[0], 0xff00ff); // Blue outline
}

// Uncomment one of the following lines to test
// testInvoluteCurve();
// testArc();
test(); // Test the large tooth

// Position the camera to view the shape
camera.position.z = 15;

// Animation loop to render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
