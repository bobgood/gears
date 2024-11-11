/**
 * Creates a single tooth profile by adding two involute curves and two arcs to the stack.
 * 
 * @param {Array} stack - The stack (array) to which the tooth points will be added.
 * @param {number} pitchRadius - The pitch radius of the gear.
 * @param {number} addendum - The height above the pitch radius for the tooth tip.
 * @param {number} dedendum - The depth below the pitch radius for the root fillet.
 * @param {number} baseRadius - The base radius from which the involute curves start.
 * @param {number} toothAngle - The angle covered by each tooth in radians.
 * @param {number} segmentsPerDegree - The number of segments per degree for smoothness.
 */
function addTooth(stack, pitchRadius, addendum, dedendum, baseRadius, toothAngle, segmentsPerDegree) {

    // Calculate key points for the tooth geometry
    const tipRadius = pitchRadius + addendum;
    const rootRadius = pitchRadius - dedendum;
    const halfToothAngle = toothAngle / 2;

    // Calculate angles for the start of each involute curve
    const leftInvoluteStartAngle = -halfToothAngle;
    const rightInvoluteStartAngle = halfToothAngle;

    // 1. Add the left involute curve
    addInvoluteCurve(stack, pitchRadius, baseRadius, leftInvoluteStartAngle, 0, segmentsPerDegree);
    console.log("addInvoluteCurve: ", pitchRadius, baseRadius, leftInvoluteStartAngle, 0, segmentsPerDegree);

    // 2. Add the tooth tip arc
    const leftTipPoint = stack[stack.length - 1];  // Last point from the left involute
    const rightTipPoint = {
        x: tipRadius * Math.cos(rightInvoluteStartAngle),
        y: tipRadius * Math.sin(rightInvoluteStartAngle),
    };
    const middleTipPoint = { x: tipRadius * Math.cos(0), y: tipRadius * Math.sin(0) };

    addArc(stack, leftTipPoint, middleTipPoint, rightTipPoint, segmentsPerDegree);
    console.log("addArc: ", leftTipPoint, middleTipPoint, rightTipPoint, segmentsPerDegree);

    // 3. Add the right involute curve
    addInvoluteCurve(stack, pitchRadius, baseRadius, 0, rightInvoluteStartAngle, segmentsPerDegree);
     console.log("addInvoluteCurve: ",  pitchRadius, baseRadius, 0, rightInvoluteStartAngle, segmentsPerDegree);

    // 4. Add the root fillet arc
    const rightRootPoint = stack[stack.length - 1];  // Last point from the right involute
    const leftRootPoint = {
        x: rootRadius * Math.cos(leftInvoluteStartAngle),
        y: rootRadius * Math.sin(leftInvoluteStartAngle),
    };
    const middleRootPoint = { x: rootRadius * Math.cos(-halfToothAngle), y: rootRadius * Math.sin(-halfToothAngle) };

    addArc(stack, rightRootPoint, middleRootPoint, leftRootPoint, segmentsPerDegree);
    console.log("addArc: ", rightRootPoint, middleRootPoint, leftRootPoint, segmentsPerDegree);
    console.log("stack: ", stack);
}
    /**
 * Generates the full 2D outline of a gear by adding multiple teeth to the stack.
 * 
 * @param {number} pitchRadius - The pitch radius of the gear.
 * @param {number} toothCount - The number of teeth on the gear.
 * @param {number} pressureAngle - The pressure angle of the teeth in degrees.
 * @param {number} segmentsPerDegree - Number of segments per degree for smoothness.
 * @returns {Array<Object>} gearOutline - An array of 2D points representing the gear's profile.
 */
function generateGearOutline(pitchRadius, toothCount, pressureAngle, segmentsPerDegree) {
    const gearOutline = []; // Stack to hold the full gear outline points

    const module = (2 * pitchRadius) / toothCount;    // Calculate module based on pitch radius and tooth count
    const addendum = module;                          // Addendum: height above the pitch circle
    const dedendum = 1.25 * module;                   // Dedendum: depth below the pitch circle
    const baseRadius = pitchRadius * Math.cos(pressureAngle * Math.PI / 180); // Base circle radius for involute curve
    const toothAngle = (2 * Math.PI) / toothCount;    // Angle covered by each tooth

    // Generate each tooth and add it to the gear outline
    for (let i = 0; i < toothCount; i++) {
        // Calculate the rotation angle for this tooth
        const rotationAngle = i * toothAngle;

        // Temporary stack to hold this tooth's points
        const toothStack = [];

        // Add a single tooth to the toothStack
        addTooth(toothStack, pitchRadius, addendum, dedendum, baseRadius, toothAngle, segmentsPerDegree);

        // Rotate each point in the toothStack by the rotationAngle and add to gearOutline
        toothStack.forEach(point => {
            const rotatedX = point.x * Math.cos(rotationAngle) - point.y * Math.sin(rotationAngle);
            const rotatedY = point.x * Math.sin(rotationAngle) + point.y * Math.cos(rotationAngle);
            gearOutline.push({ x: rotatedX, y: rotatedY });
        });
    }

    // Ensure the outline is closed by connecting the last point to the first
    gearOutline.push({ x: gearOutline[0].x, y: gearOutline[0].y });

    return gearOutline;
}

        /**
 * Adds an arc to a stack of points, given three points and segments per degree.
 *
 * @param {Array} stack - The stack (array) to which the arc points will be added.
 * @param {Object} start - The starting point of the arc, an object with x and y properties.
 * @param {Object} intermediate - A point on the arc between start and end, an object with x and y properties.
 * @param {Object} end - The ending point of the arc, an object with x and y properties.
 * @param {number} segmentsPerDegree - The number of segments per degree for smoothness.
 */
function addArc(stack, start, intermediate, end, segmentsPerDegree) {
    // Calculate the center of the circle that passes through the three points
    const center = calculateCircleCenter(start, intermediate, end);
    const radius = Math.sqrt((start.x - center.x) ** 2 + (start.y - center.y) ** 2);

    // Calculate the start and end angles of the arc
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
    const endAngle = Math.atan2(end.y - center.y, end.x - center.x);

    // Determine the angular distance and direction
    let angleDifference = endAngle - startAngle;
    if (angleDifference < 0) angleDifference += 2 * Math.PI;

    // Calculate the number of segments
    const totalDegrees = angleDifference * (180 / Math.PI);
    const numSegments = Math.max(1,Math.round(totalDegrees * segmentsPerDegree));
    // Generate points along the arc
    for (let i = 0; i <= numSegments; i++) {
        const angle = startAngle + (i / numSegments) * angleDifference;
        const x = center.x + radius * Math.cos(angle);
        const y = center.y + radius * Math.sin(angle);
        stack.push( x, y, numSegments);
        console.log(x,y);
    }
}

/**
 * Helper function to calculate the center of a circle given three points.
 * 
 * @param {Object} p1 - The first point, an object with x and y properties.
 * @param {Object} p2 - The second point, an object with x and y properties.
 * @param {Object} p3 - The third point, an object with x and y properties.
 * @returns {Object} The center of the circle, an object with x and y properties.
 */
function calculateCircleCenter(p1, p2, p3) {
    const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

    const slope1 = -(p2.x - p1.x) / (p2.y - p1.y);
    const slope2 = -(p3.x - p2.x) / (p3.y - p2.y);

    const centerX = (slope1 * mid1.x - slope2 * mid2.x + mid2.y - mid1.y) / (slope1 - slope2);
    const centerY = mid1.y + slope1 * (centerX - mid1.x);

    return { x: centerX, y: centerY };
}


 /**
 * Adds an involute curve to a stack of points, starting from a base circle and extending outward.
 *
 * @param {Array} stack - The stack (array) to which the involute points will be added.
 * @param {number} pitchRadius - The pitch radius where the involute curve ends.
 * @param {number} baseRadius - The radius of the base circle from which the involute starts.
 * @param {number} startAngle - The starting angle of the involute curve in radians.
 * @param {number} endAngle - The ending angle of the involute curve in radians.
 * @param {number} segmentsPerDegree - The number of segments per degree for smoothness.
 */
function addInvoluteCurve(stack, pitchRadius, baseRadius, startAngle, endAngle, segmentsPerDegree) {
    // Calculate the number of segments based on the angular span and segments per degree
    const angleDifference = Math.abs(endAngle - startAngle);
    const totalDegrees = angleDifference * (180 / Math.PI);
    const numSegments = Math.max(1,Math.round(totalDegrees * segmentsPerDegree));

    // Generate points along the involute curve
    for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments; // Interpolation factor (0 to 1)
        const theta = startAngle + t * angleDifference;

        // Calculate the radial distance at this point on the involute curve
        const r = baseRadius * Math.sqrt(1 + (theta ** 2));

        // Calculate the coordinates of the involute point using the parametric equations
        const x = baseRadius * (Math.cos(theta) + theta * Math.sin(theta));
        const y = baseRadius * (Math.sin(theta) - theta * Math.cos(theta));

        // Append the calculated point to the stack
        stack.push({ x, y });
        console.log(x,y,numSegments, i, t);
    }

}
