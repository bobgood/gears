class WireBuilder {
    /**
     * A helper class to prepare a Wire object.
     */
    constructor() {
        this.pos = null; // Current position as THREE.Vector2
        this.theta = 0.0; // Current angle in radians
        this.wire = new THREE.Path(); // Path object to store segments
        this.cmd = "";
    }

    move(p) {
        /**
         * Set the current position without drawing.
         * @param {Array} p - Array containing x, y coordinates.
         */
        this.pos = new THREE.Vector2(p[0], p[1]);
        this.wire.moveTo(this.pos.x, this.pos.y);
    }

    line(p) {
        /**
         * Add a line segment from the current position to p.
         * @param {Array} p - Array containing x, y coordinates.
         */
        const end = new THREE.Vector2(...rotate(p, this.theta));
        this.wire.lineTo(end.x, end.y);
        this.pos = end; // Update current position
    }

    arc(p, r, sweep) {
        /**
         * Add an arc from the current position to the point p with radius r.
         * @param {Array} p - End position as [x, y].
         * @param {number} r - Radius of the arc.
         * @param {number} sweep - Orientation of the arc, 0 or 1.
         */
        const end = new THREE.Vector2(...rotate(p, this.theta));

        // Calculate the vector from current position to end point
        const dx = end.x - this.pos.x;
        const dy = end.y - this.pos.y;
        const dist = Math.sqrt(dx ** 2 + dy ** 2);

        // Ensure that the radius is sufficient to create an arc between pos and end
        if (dist > 2 * r) {
            console.error("Radius too small for given arc endpoints.");
            return;
        }

        // Calculate the midpoint and center of the arc
        const midpoints = calculateMidpoints(this.pos, end, r);
        const center = new THREE.Vector2(...midpoints[sweep]);

        // Calculate start and end angles relative to the center
        const startAngle = Math.atan2(this.pos.y - center.y, this.pos.x - center.x);
        const endAngle = Math.atan2(end.y - center.y, end.x - center.x);

        // Determine the clockwise direction based on sweep parameter
        const clockwise = sweep === 1;

        // Create an ArcCurve for the arc segment
        const arcCurve = new THREE.ArcCurve(
            center.x,
            center.y,
            r,
            startAngle,
            endAngle,
            clockwise
        );

        // Add the arc to the wire's path
        this.wire.curves.push(arcCurve);
    
        // Update the current position to the end of the arc
        this.pos = end;
    }

    curve(...points) {
        /**
         * Add a Bezier curve from the current position through control points.
         * If there are more than 3 control points, splits the curve into smaller cubic segments.
         * @param {Array} points - Control points as [x, y] arrays.
         */
        let controlPoints = points.map((p) => new THREE.Vector2(...rotate(p, this.theta)));

        // If more than three control points, split into cubic segments iteratively
        if (controlPoints.length > 3) {
            console.log("too many control points:" +controlPoints);
//            const [left, right] = deCasteljauSplit(controlPoints, 0.5); // Split at t = 0.5
//        
//            // Add the left segment as a cubic Bezier curve
//            if (left.length === 3) {
//                // Quadratic case, two control points
//                this.wire.curves.push(new THREE.QuadraticBezierCurve(this.pos, left[1], left[2]));
//            } else if (left.length === 4) {
//                // Cubic case, three control points
//                this.wire.curves.push(new THREE.CubicBezierCurve(this.pos, left[1], left[2], left[3]));
//            }
//
//            // Update the current position to the last point of the left segment
//            this.pos = left[left.length - 1];
//        
//            // Set controlPoints to the right segment for the next iteration
//            controlPoints = right;
        }

         // Handle cases based on the remaining control points (up to 3)
        let bezierCurve;
        if (controlPoints.length === 1) {
            // Degenerate quadratic Bezier with one control point
            bezierCurve = new THREE.QuadraticBezierCurve(this.pos, controlPoints[0], controlPoints[0]);
        } else if (controlPoints.length === 2) {
            // Quadratic Bezier with one control point
            bezierCurve = new THREE.QuadraticBezierCurve(this.pos, controlPoints[0], controlPoints[1]);
        } else if (controlPoints.length === 3) {
            // Cubic Bezier with two control points
            bezierCurve = new THREE.CubicBezierCurve(this.pos, controlPoints[0], controlPoints[1], controlPoints[2]);
        }

        if (bezierCurve) {
            this.wire.curves.push(bezierCurve);
            this.pos = controlPoints[controlPoints.length - 1]; // Update current position
        }
    }

    close() {
        /**
         * Close the path if it’s not closed already.
         */
        this.wire.closePath();
    }

    getPoints() {
        /**
         * Get points in the wire path as an array of [x, y] arrays.
         * @returns {Array} - Array of points in [x, y] format.
         */
        return this.wire.getPoints().map((point) => [point.x, point.y]);
    }

}

// Helper function to calculate midpoints for arc
function calculateMidpoints(p1, p2, r) {
    // Logic to calculate the two possible midpoint solutions
    // similar to the original 'midpoints' function

    let vx = p2.x - p1.x;
    let vy = p2.y - p1.y;
    let b = Math.sqrt(vx ** 2 + vy ** 2);
    let v = [vx / b, vy / b];
    let cosA = (b ** 2) / (2 * b * r);
    let A = Math.acos(cosA);

    // Rotate vector v by angle A
    let [rotVx1, rotVy1] = rotate(v, A);
    let c1 = [p1.x + r * rotVx1, p1.y + r * rotVy1];
    let m1x = (p1.x + p2.x) / 2 - c1[0];
    let m1y = (p1.y + p2.y) / 2 - c1[1];
    let dm1 = Math.sqrt(m1x ** 2 + m1y ** 2);
    let m1 = [c1[0] + r * m1x / dm1, c1[1] + r * m1y / dm1];

    // Rotate vector v by angle -A
    let [rotVx2, rotVy2] = rotate(v, -A);
    let c2 = [p1.x + r * rotVx2, p1.y + r * rotVy2];
    let m2x = (p1.x + p2.x) / 2 - c2[0];
    let m2y = (p1.y + p2.y) / 2 - c2[1];
    let dm2 = Math.sqrt(m2x ** 2 + m2y ** 2);
    let m2 = [c2[0] + r * m2x / dm2, c2[1] + r * m2y / dm2];

    return [m1, m2];
}

    // Helper function to rotate a point around the origin
function rotate(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = point[0] * cos - point[1] * sin;
    const y = point[0] * sin + point[1] * cos;
    return [x, y];
}

function deCasteljauSplit(controlPoints, t = 0.5) {
    const left = [];
    const right = [];
    // Convert THREE.Vector2 control points to array format for easier manipulation
    let points = controlPoints.map(p => [p.x, p.y]);

    // Perform De Casteljau's algorithm
    while (points.length > 1) {
        left.push(points[0]); // Add the first point to left
        right.unshift(points[points.length - 1]); // Add the last point to right

        // Calculate new points for the next level of interpolation
        const newPoints = [];
        for (let i = 0; i < points.length - 1; i++) {
            const x = (1 - t) * points[i][0] + t * points[i + 1][0];
            const y = (1 - t) * points[i][1] + t * points[i + 1][1];
            newPoints.push([x, y]);
        }
        points = newPoints;
    }

    // Add the final shared midpoint, ensuring continuity
    left.push(points[0]);
    right.unshift(points[0]);

    // Convert the points back to THREE.Vector2 format before returning
    return [
        left.map(p => new THREE.Vector2(p[0], p[1])),
        right.map(p => new THREE.Vector2(p[0], p[1]))
    ];
}

function tests() {
    var wireBuilder = new WireBuilder();
    wireBuilder.move([0, 0]);
    wireBuilder.line([10, 10]);

    var formattedPoints = wireBuilder.getPoints().map(point => `${point[0]}, ${point[1]}`).join('\n');
    console.log("Test Case 1: Simple Line Segment\n" + formattedPoints);

     wireBuilder = new WireBuilder();
    wireBuilder.move([0, 0]);
    wireBuilder.curve([5, 10], [10, 0]);

     formattedPoints = wireBuilder.getPoints().map(point => `${point[0]}, ${point[1]}`).join('\n');
    console.log("Test Case 2: Quadratic Bezier Curve\n" + formattedPoints);

     wireBuilder = new WireBuilder();
    wireBuilder.move([0, 0]);
    wireBuilder.curve([5, 15], [10, 10], [15, 0]);

     formattedPoints = wireBuilder.getPoints().map(point => `${point[0]}, ${point[1]}`).join('\n');
    console.log("Test Case 3: Cubic Bezier Curve\n" + formattedPoints);

     wireBuilder = new WireBuilder();
    wireBuilder.move([10, 0]);
    wireBuilder.arc([10, 10], 10, 1); // Arc with radius 10, clockwise

     formattedPoints = wireBuilder.getPoints().map(point => `${point[0]}, ${point[1]}`).join('\n');
    console.log("Test Case 4: Arc Segment\n" + formattedPoints);

     wireBuilder = new WireBuilder();
    wireBuilder.move([0, 0]);

    // Define control points for a 4th-degree Bezier curve
    const controlPoints = [[2, 10], [4, 15], [8, 15], [10, 10], [12, 0]];

    // Add the higher-order curve to `wireBuilder`, which will automatically split it
    wireBuilder.curve(...controlPoints);

     formattedPoints = wireBuilder.getPoints().map(point => `${point[0]}, ${point[1]}`).join('\n');
    console.log("Test Case 5: Higher-Order Bezier Curve (Order 4 with 5 Control Points, Split into Cubic Segments)\n" + formattedPoints);

    console.log();
}
//`tests();