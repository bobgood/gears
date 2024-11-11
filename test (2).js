// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const segmentsPerDegree = 1; // Controls smoothness

// Helper function to visualize an involute curve
function testInvoluteCurve() {
    const stack = [];
    const pitchRadius = 5;
    const baseRadius = 4;
    const startAngle = 0;
    const endAngle = Math.PI / 4; // 45 degrees

    // Generate involute curve points
    addInvoluteCurve(stack, pitchRadius, baseRadius, startAngle, endAngle, segmentsPerDegree);

    // Convert stack points to Vector2 for Three.js
    const points = stack.map(p => new THREE.Vector2(p.x, p.y));

    // Create geometry and material
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

    // Create the line and add it to the scene
    const line = new THREE.Line(geometry, lineMaterial);
    scene.add(line);
}

// Helper function to visualize an arc
function testArc() {
    const stack = [];
    const start = { x: 5, y: 0 };
    const intermediate = { x: 0, y: 5 };
    const end = { x: -5, y: 0 };

    // Generate arc points
    addArc(stack, start, intermediate, end, segmentsPerDegree);

    // Convert stack points to Vector2 for Three.js
    const points = stack.map(p => new THREE.Vector2(p.x, p.y));

    // Create geometry and material
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });

    // Create the line and add it to the scene
    const line = new THREE.Line(geometry, lineMaterial);
    scene.add(line);
}

// Uncomment one of the following lines to test
// testInvoluteCurve();
testArc();

// Position the camera to view the shape
camera.position.z = 15;

// Animation loop to render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start the animation loop
animate();
