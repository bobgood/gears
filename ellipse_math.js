function ellipseArcLength(a, e) {
	// Calculate the semi-minor axis b using a and e
	const b = a * Math.sqrt(1 - e ** 2);
	// Calculate the approximate arc length
	return Math.PI * (3 * a + 3 * b - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

function ellipseArcLengthDerivative(a, e, delta = 1e-6) {
	// Numerical derivative of L(a, e) with respect to a
	return (ellipseArcLength(a + delta, e) - ellipseArcLength(a, e)) / delta;
}

function solveForSemiMajorAxis(L_target, e, initialGuess = 1.0, tolerance = 1e-6, maxIterations = 100) {
	let a = initialGuess;

	for (let i = 0; i < maxIterations; i++) {
		const L_current = ellipseArcLength(a, e);
		const error = L_current - L_target;

		if (Math.abs(error) < tolerance) {
			return a;  // Solution found
		}

		const L_prime = ellipseArcLengthDerivative(a, e);

		// Update a using Newton-Raphson step
		a -= error / L_prime;
	}

	throw new Error("Solution did not converge");
}

const G = 1000;
function ellipseArcDistance(e) {
	tot_dist = [];
	tot_dist.push(0);
	var L = ellipseArcLength(1, e);
	var a = 1;
	var b = a * Math.sqrt(1 - e ** 2);
	var dist = 0;
	
	for (var i = 0; i < G; i++) {
		var theta = Math.PI * 2 * i / G;
		var f = Math.sqrt(Math.pow(a * Math.sin(theta), 2) + Math.pow(b * Math.cos(theta), 2));
		dist+=f * Math.PI * 2 / L;
		tot_dist.push(dist * Math.PI * 2 / G);
	}

	return tot_dist;
}

function circleThetaToElipse(ctheta, tot_dist) {
	while (ctheta > 2 * Math.PI) {
		ctheta -= Math.PI;
	}
	while (ctheta <0) {
		ctheta += Math.PI;
	}

	var min = 0;
	var max = G;
	while (max - min > 1) {
        var mid = Math.floor((max + min) / 2);
        if (tot_dist[mid] < ctheta) {
            min = mid;
        } else {
            max = mid;
        }
	}
	var f = (ctheta - tot_dist[min]) / (tot_dist[max] - tot_dist[min]);
	var etheta = (min + f) * Math.PI * 2 / G;
	return etheta;
}
function normalVectorEllipse(a, b, theta) {
	// Calculate the components of the normal vector at angle theta
	const Nx = b * Math.cos(theta);
	const Ny = a * Math.sin(theta);

	// Calculate the magnitude of the normal vector
	const magnitude = Math.sqrt(Nx * Nx + Ny * Ny);

	// Normalize the normal vector to make it a unit vector
	const unitNormal = {
		x: Nx / magnitude,
		y: Ny / magnitude
	};

	return unitNormal;
}

function rotatePointAroundOriginWithNormal(point, normal) {
	// Step 1: Calculate the angle of the normal vector
	const phi = Math.atan2(normal.y, normal.x);

	// Step 2: Rotate the point by this angle
	const rotatedPoint = {
		x: point.x * Math.cos(phi) - point.y * Math.sin(phi),
		y: point.x * Math.sin(phi) + point.y * Math.cos(phi)
	};

	return rotatedPoint;
}

function rotate_point_to_ellipse(cen, pnt, theta, a, b, Rpitch) {
	// Step 1: Calculate the reference point on the circle (Rpitch, 0)
	const refCirclePoint = { x: Rpitch, y: 0 };

	// Translate the input point relative to this reference circle point
	const translatedPoint = {
		x: pnt.x - cen.x - refCirclePoint.x,
		y: pnt.y - cen.y - refCirclePoint.y,
	};

	// Step 2: Rotate the translated point by the normal vector direction
	const normal = normalVectorEllipse(a, b, theta);
	const rotatedPoint = rotatePointAroundOriginWithNormal(translatedPoint, normal);

	// Step 3: Calculate the ellipse point at angle theta
	const ellipsePoint = {
		x: a * Math.cos(theta),
		y: b * Math.sin(theta)
	};

	// Step 4: Translate the rotated point to the ellipse position at angle theta
	const finalPoint = {
		x: rotatedPoint.x + ellipsePoint.x + cen.x,
		y: rotatedPoint.y + ellipsePoint.y + cen.y
	};

	return finalPoint;
}

// Example usage:
const cen = { x: 0, y: 0 };     // Center of the ellipse and circle
const pnt = { x: 7, y: 0 };     // Point to transform
const theta = Math.PI / 2;      // Angle on the ellipse
const a = 4;                    // Semi-major axis of the ellipse
const b = 4;                    // Semi-minor axis of the ellipse
const Rpitch = 4;              // Radius of the reference circle

const resultPoint = rotate_point_to_ellipse(cen, pnt, theta, a, b, Rpitch);
console.log(resultPoint);  // Resulting rotated and scaled point on the ellipse

