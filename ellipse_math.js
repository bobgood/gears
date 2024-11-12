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
	var diff = 0;
	while (ctheta-diff > 2 * Math.PI) {
		diff+= 2*Math.PI;
	}
	while (ctheta-diff <0) {
		diff -= 2*Math.PI;
	}

	ctheta -= diff;
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
