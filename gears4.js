
function _create_involute_profile(
    wire_builder,
    module,
    number_of_teeth,
    pressure_angle = (20 * Math.PI) / 180, // Default 20 degrees to radians
    split_involute = true,
    rotation = 0,
    outer_height_coefficient = 1.0,
    inner_height_coefficient = 1.0,
    outer_fillet_coefficient = 0.0,
    inner_fillet_coefficient = 0.0,
    profile_shift_coefficient = 0.0
) {
    // Calculate profile shift, outer height, and inner height
    const profile_shift = profile_shift_coefficient * module;
    const outer_height = outer_height_coefficient * module + profile_shift;
    const inner_height = inner_height_coefficient * module - profile_shift;

    // Calculate radii
    const Rref = (number_of_teeth * module) / 2;  // Reference circle radius
    const Rb = Rref * Math.cos(pressure_angle);   // Base circle radius
    const Ro = Rref + outer_height;               // Outer circle radius
    const Ri = Rref - inner_height;               // Inner circle radius

    // Calculate fillet radii
    const fi = inner_fillet_coefficient * module;
    let Rci = Ri + fi;
    let Rfi = Rci;

    const fo = outer_fillet_coefficient * module;
    let Rco = Ro - fo;
    let Rfo = Ro;

    // Flags to check for involute flank and fillets
    const has_non_involute_flank = Rfi < Rb;
    const has_inner_fillet = fi > 0;
    const has_outer_fillet = fo > 0;

    // Find Rfi if inner fillet tangent to involute is required
    if (has_inner_fillet && !has_non_involute_flank) {
        const q = (r) => Math.sqrt(r ** 2 - Rb ** 2) / Rb - Math.asin((-(r ** 2) + fi ** 2 + Rci ** 2) / (2 * fi * Rci));
        const q_prime = (r) => r / (Math.sqrt(-(Rb ** 2) + r ** 2) * Rb) + r / (fi * Rci * Math.sqrt(1 - 0.25 * ((r ** 2 - fi ** 2 - Rci ** 2) ** 2) / (fi ** 2 * Rci ** 2)));
        Rfi = findRootNewton(q, q_prime, Math.max(Rb, Ri), Rci);
    }

    // Find Rfo if outer fillet tangent to involute is required
    if (has_outer_fillet) {
        const phi_corr = genInvolutePolar(Rb, Ro) + Math.atan(fo / Ro);
        const q = (r) => Math.sqrt(r ** 2 - Rb ** 2) / Rb - Math.asin((r ** 2 - fo ** 2 - Rco ** 2) / (2 * fo * Rco)) - phi_corr;
        const q_prime = (r) => r / (Math.sqrt(-(Rb ** 2) + r ** 2) * Rb) - r / (fo * Rco * Math.sqrt(1 - 0.25 * ((r ** 2 - fo ** 2 - Rco ** 2) ** 2) / (fo ** 2 * Rco ** 2)));
        Rfo = findRootNewton(q, q_prime, Math.max(Rb, Rco), Ro);
    }

    // Calculate angular properties
    const angular_pitch = (2 * Math.PI) / number_of_teeth;
    const base_to_ref = genInvolutePolar(Rb, Rref);
    const ref_to_stop = genInvolutePolar(Rb, Rfo) - base_to_ref;
    const start_to_ref = has_non_involute_flank ? base_to_ref : base_to_ref - genInvolutePolar(Rb, Rfi);

    // Calculate inner and outer fillet angles and widths
    const inner_fillet_width = Math.sqrt(fi ** 2 - (Rci - Rfi) ** 2);
    const inner_fillet_angle = Math.atan(inner_fillet_width / Rfi);
    const outer_fillet_width = Math.sqrt(fo ** 2 - (Rfo - Rco) ** 2);
    const outer_fillet_angle = Math.atan(outer_fillet_width / Rfo);

    // Generate the Higuchi involute approximation
    const fe = 1;
    let fs = 0.01;
    if (!has_non_involute_flank) {
        fs = (Rfi ** 2 - Rb ** 2) / (Rfo ** 2 - Rb ** 2);
    }

    let inv;
    if (split_involute) {
        const fm = fs + (fe - fs) / 4;
        const part1 = BezCoeffs(Rb, Rfo, 3, fs, fm);
        const part2 = BezCoeffs(Rb, Rfo, 3, fm, fe);
        inv = part1.concat(part2.slice(1));
    } else {
        inv = BezCoeffs(Rb, Rfo, 4, fs, fe);
    }

    // Calculate tooth thickness
    const enlargement_by_shift = (profile_shift * Math.tan(pressure_angle)) / Rref;
    const tooth_thickness_half_angle = angular_pitch / 4 + enlargement_by_shift;
    const psi = tooth_thickness_half_angle;

    // Rotate involute to make tooth symmetric on X axis
    inv = inv.map((pt) => rotate(pt, -base_to_ref - psi));
    const invR = inv.map(mirror);

    // Calculate junction points for profile sections
    const inner_fillet = toCartesian(Rfi, -psi - start_to_ref);
    const inner_fillet_back = mirror(inner_fillet);
    const inner_circle_back = toCartesian(Ri, psi + start_to_ref + inner_fillet_angle);
    const inner_circle_next = toCartesian(Ri, angular_pitch - psi - start_to_ref - inner_fillet_angle);
    const inner_fillet_next = rotate(inner_fillet, angular_pitch);
    const outer_fillet = toCartesian(Ro, -psi + ref_to_stop + outer_fillet_angle);
    const outer_circle = mirror(outer_fillet);

    // Define rotation angles for each tooth
    const thetas = Array.from({ length: number_of_teeth }, (_, i) => i * angular_pitch + rotation);

    // Begin shape at the correct starting point
    if (has_inner_fillet) {
        wire_builder.move(rotate(inner_fillet_next, thetas[thetas.length - 1]));
    } else {
        wire_builder.move(rotate(inner_circle_next, thetas[thetas.length - 1]));
    }

    // Add each tooth profile to wire builder
    for (const theta of thetas) {
        wire_builder.theta = theta;

        if (has_non_involute_flank) {
            wire_builder.line(inv[0]);
        }

        if (split_involute) {
            wire_builder.curve(inv[1], inv[2], inv[3]);
            wire_builder.curve(inv[4], inv[5], inv[6]);
        } else {
            wire_builder.curve(inv.slice(1));
        }

        if (outer_circle[1] > outer_fillet[1]) {
            if (has_outer_fillet) {
                wire_builder.arc(outer_fillet, fo, 1);
            }
            wire_builder.arc(outer_circle, Ro, 1);
        }

        if (has_outer_fillet) {
            wire_builder.arc(invR[invR.length - 1], fo, 1);
        }

        if (split_involute) {
            wire_builder.curve(invR[5], invR[4], invR[3]);
            wire_builder.curve(invR[2], invR[1], invR[0]);
        } else {
            wire_builder.curve(invR.slice(0, -1).reverse());
        }

        if (has_non_involute_flank) {
            wire_builder.line(inner_fillet_back);
        }

        if (inner_circle_next[1] > inner_circle_back[1]) {
            if (has_inner_fillet) {
                wire_buildfBeszer.arc(inner_circle_back, fi, 0);
            }
            wire_builder.arc(inner_circle_next, Ri, 1);
        }

        if (has_inner_fillet) {
            wire_builder.arc(inner_fillet_next, fi, 0);
        }
    }

    // Close the shape
    wire_builder.close();
}

function genInvolutePolar(Rb, R) {
    // Return the involute angle as a function of radius R
    // Rb = base circle radius
    return (Math.sqrt(R * R - Rb * Rb) / Rb) - Math.acos(Rb / R);
}

function rotate(pt, rads) {
    // Rotate pt by rads radians about the origin
    const sinA = Math.sin(rads);
    const cosA = Math.cos(rads);
    return [
        pt[0] * cosA - pt[1] * sinA,
        pt[0] * sinA + pt[1] * cosA
    ];
}

function mirror(pt) {
    // Mirror pt on the X axis, i.e., flip its Y coordinate
    return [pt[0], -pt[1]];
}

function toCartesian(radius, angle) {
    // Convert polar coordinates to Cartesian
    return [
        radius * Math.cos(angle),
        radius * Math.sin(angle)
    ];
}

function findRootNewton(f, f_prime, x_min, x_max) {
    // Apply Newton's Method to find the root of f within x_min and x_max
    // Assume that there is a root in that range and that f is strictly monotonic

    // Initial guess: take the midpoint of the input range
    let x = (x_min + x_max) / 2;

    const PRECISION_INTERSECTION = 1e-9; // Precision threshold

    // Perform up to 6 iterations to achieve convergence
    for (let i = 0; i < 6; i++) {
        const f_x = f(x);
        if (Math.abs(f_x) < PRECISION_INTERSECTION) {
            return x; // Converged to a root within the desired precision
        }
        x = x - f_x / f_prime(x); // Newton's iteration
    }

    throw new Error(`No convergence after 6 iterations.`);
}


// Helper function for binomial coefficient
function binom(n, k) {
    if (k > n) return 0;
    if (k === 0 || k === n) return 1;
    let coeff = 1;
    for (let i = 1; i <= k; i++) {
        coeff *= (n - i + 1) / i;
    }
    return coeff;
}

// Translate bezCoeff
function bezCoeff(i, p, polyCoeffs) {
    // Generate the polynomial coefficients in one go
    return Array.from({ length: i + 1 }, (_, j) => binom(i, j) * polyCoeffs[j] / binom(p, j)).reduce((a, b) => a + b, 0);
}

// Translate BezCoeffs
function BezCoeffs(baseRadius, limitRadius, order, fstart, fstop) {
    // Approximates an involute using a Bezier curve
    const Rb = baseRadius;
    const Ra = limitRadius;
    const ta = Math.sqrt(Ra * Ra - Rb * Rb) / Rb;  // involute angle at the limit radius
    const te = Math.sqrt(fstop) * ta;             // involute angle, theta, at end of approx
    const ts = Math.sqrt(fstart) * ta;            // involute angle, theta, at start of approx
    const p = order;                              // order of Bezier approximation

    function involuteXbez(t) {
        // Equation of involute using the Bezier parameter t as variable
        const x = t * 2 - 1;
        const theta = (x * (te - ts) / 2) + (ts + te) / 2;
        return Rb * (Math.cos(theta) + theta * Math.sin(theta));
    }

    function involuteYbez(t) {
        // Equation of involute using the Bezier parameter t as variable
        const x = t * 2 - 1;
        const theta = (x * (te - ts) / 2) + (ts + te) / 2;
        return Rb * (Math.sin(theta) - theta * Math.cos(theta));
    }

    // Calculate Bezier coefficients
    const bzCoeffs = [];
    const polyCoeffsX = chebyPolyCoeffs(p, involuteXbez);
    const polyCoeffsY = chebyPolyCoeffs(p, involuteYbez);

    for (let i = 0; i <= p; i++) {
        const bx = bezCoeff(i, p, polyCoeffsX);
        const by = bezCoeff(i, p, polyCoeffsY);
        bzCoeffs.push([bx, by]);
    }

    return bzCoeffs;
}

function chebyPolyCoeffs(p, func) {
    // Initialize the coefficients array
    const coeffs = Array(p + 1).fill(0);
    const fnCoeff = [];
    const T = Array.from({ length: p + 1 }, () => Array(p + 1).fill(0));

    // Set up initial values for the Chebyshev polynomials
    T[0][0] = 1;
    T[1][1] = 1;

    // Generate the Chebyshev polynomial coefficients using T(k+1) = 2xT(k) - T(k-1)
    for (let k = 1; k < p; k++) {
        for (let j = 0; j < T[k].length - 1; j++) {
            T[k + 1][j + 1] = 2 * T[k][j];
        }
        for (let j = 0; j < T[k - 1].length; j++) {
            T[k + 1][j] -= T[k - 1][j];
        }
    }

    // Compute function coefficients using chebyExpnCoeffs
    for (let k = 0; k <= p; k++) {
        fnCoeff.push(chebyExpnCoeffs(k, func));
    }

    // Convert the Chebyshev series to a simple polynomial and collect like terms
    for (let k = 0; k <= p; k++) {
        for (let pwr = 0; pwr <= p; pwr++) {
            coeffs[pwr] += fnCoeff[k] * T[k][pwr];
        }
    }

    // Fix the 0th coefficient
    coeffs[0] -= fnCoeff[0] / 2;
    return coeffs;
}

function chebyExpnCoeffs(j, func) {
    const N = 50; // A suitably large number N >> p
    let c = 0;

    for (let k = 1; k <= N; k++) {
        const angle = Math.PI * (k - 0.5) / N;
        c += func(Math.cos(angle)) * Math.cos(Math.PI * j * (k - 0.5) / N);
    }

    return (2 * c) / N;
}

function test2()
{
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


    const formattedPoints = wireBuilder.getPoints().map(point => `${point[0]}, ${point[1]}`).join('\n');
    console.log("Test case 6\n" +formattedPoints);
}
//test2();
