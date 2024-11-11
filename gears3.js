// Gear parameters
function createGearOutline(module, numTeeth, pressureAngleDeg, addCoeff = 1.0, dedCoeff = 1.25) {
    const pressureAngle = (Math.PI / 180) * pressureAngleDeg; // Convert to radians
    const Rref = (module * numTeeth) / 2; // Pitch circle radius
    const Rb = Rref * Math.cos(pressureAngle); // Base circle radius
    const Ro = Rref + addCoeff * module; // Outer circle (tip radius)
    const Ri = Rref - dedCoeff * module; // Root circle (root radius)

    // Number of points to define the involute curve
    const numInvolutePoints = 10;
    const angularPitch = (2 * Math.PI) / numTeeth; // Angle for one tooth
    const outlinePoints = [];

    // Generate involute for a single tooth
    const toothProfile = generateInvolute(Rb, Ro, numInvolutePoints);

    // Mirror and rotate the tooth profile to generate the full gear
    for (let i = 0; i < numTeeth; i++) {
        const theta = i * angularPitch;
        const rotatedTooth = rotateAndMirrorTooth(toothProfile, theta, Rref, Ri, numTeeth);
        outlinePoints.push(...rotatedTooth);
    }

    for (i=0; i<outlinePoints.length; i++)
    {
        console.log(outlinePoints[i][0]+","+outlinePoints[i][1]+",");
    }

    return outlinePoints;
}

// Generate involute curve points from the base to the outer circle
function generateInvolute(baseRadius, outerRadius, numPoints) {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const R = baseRadius * Math.sqrt(1 + t * t);
        const theta = t; // Approximate involute angle
        points.push([
            R * Math.cos(theta) - theta * baseRadius * Math.sin(theta),
            R * Math.sin(theta) + theta * baseRadius * Math.cos(theta)
        ]);
    }
    return points;
}

// Rotate and mirror a tooth profile to create all teeth
function rotateAndMirrorTooth(toothProfile, theta, pitchRadius, rootRadius, numTeeth) {
    const rotatedPoints = [];
    for (let point of toothProfile) {
        const x = point[0] * Math.cos(theta) - point[1] * Math.sin(theta);
        const y = point[0] * Math.sin(theta) + point[1] * Math.cos(theta);
        rotatedPoints.push([x, y]);
    }
    // Add mirrored side of the tooth and root circle segment
    rotatedPoints.push(...generateRootSegment(rotatedPoints[0], rootRadius, theta, numTeeth));
    return rotatedPoints;
}

// Generate root circle segment between teeth
function generateRootSegment(firstPoint, rootRadius, theta, numTeeth) {
    const segment = [];
    const endAngle = theta + (2 * Math.PI) / numTeeth;
    const step = (endAngle - theta) / 3;
    for (let angle = theta; angle <= endAngle; angle += step) {
        segment.push([rootRadius * Math.cos(angle), rootRadius * Math.sin(angle)]);
    }
    return segment;
}

// Example usage
const outline = createGearOutline(2, 20, 20); // Module 2, 20 teeth, 20° pressure angle
console.log(outline); // Array of points representing the 2D outline of the gear
