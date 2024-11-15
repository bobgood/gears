class Shape2D {
    constructor() {
        // outer outline
        this.Outlines = [];
        // edge between teeth and core
        this.Faces = [];
        // post processing holes and  otches
        this.Cuts = [];
    }
}
class Gear2D extends Shape2D {
    constructor(module, numberOfTeeth, pressureAngle, shift) {
        super();
        this.Module = module;
        this.NumberOfTeeth = numberOfTeeth;
        this.PressureAngle = pressureAngle;

        // shift the zero angle of the gear by shift teeth distances
        this.Shift = shift;
        if (module === undefined) throw new Error("module is undefined");
        if (shift === undefined) throw new Error("shift is undefined");
        if (numberOfTeeth === undefined) throw new Error("numberOfTeeth is undefined");
        if (numberOfTeeth < 4) throw new Error("numberOfTeeth is too small");
        if (this.PressureAngle === undefined) throw new Error("pressureAngle is undefined");

        // Rp aka r pitch
        this.Rpitch = this.pitch_diameter() / 2.0;
        if (this.Rpitch === undefined) throw new Error("Rpitch is undefined");

        // Rb aka r base
        this.Rbase = this.base_diameter() / 2.0;
        if (this.Rbase === undefined) throw new Error("Rbase is undefined");

        // Rd aka r dedendum aka r min
        this.Rdedendum = this.Rpitch - this.dedendum();
        if (this.Rdedendum === undefined) throw new Error("Rdedendum is undefined");

        // Ra aka r addendum aka r max
        this.Raddendum = this.Rpitch + this.addendum();
        if (this.Raddendum === undefined) throw new Error("Raddendum is undefined");

        // thickness of the tooth
        this.Ttooth = this.tooth_thickness();
        if (this.Ttooth === undefined) throw new Error("Ttooth is undefined");

        // smoothing points along the involute curve
        this.Smoothing = 20;
        if (this.Smoothing === undefined) throw new Error("Smoothing is undefined");

        // calculates the form of the involute curve
        this.Base_involute_curve = this.involute_curve();

        // calculates the coordinates of the involute curve
        this.Involute = this.create_involute_coordinates();

        // upside down for planetary
        this.InvertInvolute = this.create_invert_involute_coordinates();
    }


    slot(r, w = 0, r2 = 0, slot_shift=0, N = 200) {
        if (this.Outlines.length != 1) {
            throw "cannot "
        }

        var wangle = Math.asin(w / r / 2);
        var tshift = slot_shift * Math.PI * 2 / this.NumberOfTeeth;
        var r2a= Math.sqrt(r2*r2+w*w/4);
        var wangle2 = Math.asin(w / r2a / 2);
        var points = [];
        for (var i = 0; i <= N; i++) {
            var theta = i* (Math.PI * 2.0 - wangle * 2) / N + wangle + tshift;
            points.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
        }

        for (var i = N; i >= 0; i -= N) {
            var theta = i * (Math.PI * 2.0 - wangle2 * 2) / N + wangle2 + tshift;
            points.push({ x: r2a * Math.cos(theta), y: r2a * Math.sin(theta) });
        }

        this.Cuts.push(points);
    }

    point_radius(pnt) {
        return Math.sqrt(pnt.x * pnt.x + pnt.y * pnt.y);
    }

    lerp(val, v0, p0, v1, p1) {
        var w = (val - v0) / (v1 - v0);
        return {
            x: p1.x * w + p0.x * (1.0 - w),
            y: p1.y * w + p0.y * (1.0 - w)
        };
    }

    rotate_point(cen, pnt, theta) {
        var tpnt = {
            x: pnt.x - cen.x,
            y: pnt.y - cen.y
        };
        var rpnt = {
            x: Math.cos(theta) * tpnt.x + Math.sin(theta) * tpnt.y,
            y: -Math.sin(theta) * tpnt.x + Math.cos(theta) * tpnt.y
        };
        return { x: rpnt.x + cen.x, y: rpnt.y + cen.y };
    }

    involute_point(theta) {
        return {
            x: this.Rbase * (Math.cos(theta) + theta * Math.sin(theta)),
            y: -this.Rbase * (Math.sin(theta) - theta * Math.cos(theta))
        };
    }

    involute_bisect(r_target) {
        var theta_lo = 0.0;
        var r_lo = this.point_radius(this.involute_point(theta_lo));
        var theta_hi = Math.PI;
        var r_hi = this.point_radius(this.involute_point(theta_hi));
        // check if the target is achievable
        if (this.Raddendum < r_target)
            return -1.0;

        var theta_mi = (theta_lo + theta_hi) / 2.0;
        var r_mi;
        for (let i = 0; i < 20; i++) {
            theta_mi = (theta_lo + theta_hi) / 2.0;
            r_mi = this.point_radius(this.involute_point(theta_mi));
            if (r_mi <= r_target) {
                r_lo = r_mi;
                theta_lo = theta_mi;
            } else {
                r_hi = r_mi;
                theta_hi = theta_mi;
            }
        }
        return theta_mi;
    }

    involute_curve() {
        var theta_lo = 0.0;
        var theta_hi = this.involute_bisect(this.Raddendum);
        var curve = [];
        if (this.Rdedendum < this.Rbase) {
            curve.push({ x: this.Rdedendum, y: 0 });
        }
        var dtheta2 = (theta_hi - theta_lo) / (this.Smoothing - 1);
        for (var i = 0; i < this.Smoothing; i++) {
            curve.push(this.involute_point(i * dtheta2 + theta_lo));
        }
        return curve;
    }

    create_involute_coordinates() {
        if (this.Rpitch === undefined) throw new Error("Rpitch is undefined");

        // find the crossing point of the involute curve with the pitch circle
        this.p_cross = this.involute_point(this.involute_bisect(this.Rpitch));
        this.theta_cross = Math.atan2(this.p_cross.y, this.p_cross.x);
        this.dtheta = this.Ttooth / this.Rpitch;
        if (this.p_cross.y === undefined) throw new Error("p_cross.y is undefined");
        if (this.theta_cross === undefined) throw new Error("theta_cross.y is undefined");
        if (this.dtheta === undefined) throw new Error("dtheta.y is undefined");

        // compute whether the gear profile will self-intersect once patterned
        var involute_pts = [];
        for (var i = 0; i < this.Base_involute_curve.length; i++) {
            var tpnt = this.rotate_point({ x: 0, y: 0 }, this.Base_involute_curve[i], +this.theta_cross - this.dtheta / 2);
            var angle1 = Math.atan2(tpnt.y, tpnt.x);
            if (angle1 < Math.PI / this.NumberOfTeeth && tpnt.y > 0) {
                involute_pts.push(this.Base_involute_curve[i]);
            }
        }

        return involute_pts

    }

    create_invert_involute_coordinates() {
        var invert_pts = [];
        for (var i = 0; i < this.Involute.length; i++) {
            invert_pts.push({ x: this.Rpitch * 2 - this.Involute[i].x, y: this.Involute[i].y });
        }

        return invert_pts;
    }


    pitch_diameter() {
        return this.Module * this.NumberOfTeeth;
    }

    base_diameter() {

        return this.pitch_diameter() * Math.cos(this.PressureAngle);
    }

    dedendum() {
        return 1.2 * this.Module;
    }

    addendum() {
        return 1.0 * this.Module;
    }

    tooth_thickness() {
        return Math.PI * this.pitch_diameter() / (2.0 * this.NumberOfTeeth);
    }

}

class SimpleGear2D extends Gear2D {
    constructor(module, numberOfTeeth, pressureAngle, shift) {
        super(module, numberOfTeeth, pressureAngle, shift);
        if (pressureAngle === undefined) throw new Error("pressureAngle is undefined");
        this.generate_simple_gear();
    }

    

    generate_simple_gear() {
        let pt;
        var outline = [];
        for (var i = 0; i < this.NumberOfTeeth; i++) {
            var inline = [{ x: 0, y: 0 }];
            var theta = (i + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) + this.theta_cross - this.dtheta / 2;
            var theta2 = (i + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) - this.theta_cross + this.dtheta / 2;
            var theta3 = (i + 1 + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) + this.theta_cross - this.dtheta / 2;
            var tooth = [];

            for (var j = 0; j < this.Involute.length; j++) {
                pt = this.rotate_point({ x: 0, y: 0 }, { x: this.Involute[j].x, y: this.Involute[j].y }, theta);
                outline.push(pt);
                tooth.push(pt);
                if (j == 0) inline.push(pt);
            }

            for (var j = this.Involute.length - 1; j >= 0; j--) {
                pt = this.rotate_point({ x: 0, y: 0 }, { x: this.Involute[j].x, y: -this.Involute[j].y }, theta2);
                outline.push(pt);
                tooth.push(pt);
                if (j == 0) inline.push(pt);
            }

            var pt3 = this.rotate_point({ x: 0, y: 0 }, { x: this.Involute[0].x, y: this.Involute[0].y }, theta3);
            inline.push(pt3);

            this.Faces.push(inline);
            this.Faces.push(tooth);
        }

        this.Outlines.push(outline);
    }
}
class FrameGear2D extends Gear2D {
    constructor(module, numberOfTeeth, pressureAngle, shift, frameRadius, numSegments, frameShift, holeRadius, tolerance=0,N=20) { 
        super(module, Math.max(24,numberOfTeeth), pressureAngle, shift);
        this.FrameRadius = frameRadius;
        this.NumberOfSegments = Math.min(4,numSegments);
        this.FrameShift = frameShift;
        this.HoleRadius = holeRadius;
        this.Tolerance = tolerance;
        if (tolerance == 0) {
            this.Tolerance = holeRadius;
        }
        this.N = N;
        this.map_meetpoints();
        this.generate_frame_gear();
    }

    meet_distance(meet, tooth) {
        var omega = meet * Math.PI / this.NumberOfSegments + this.FrameShift * Math.PI * 2 / this.NumberOfTeeth;
        var theta = tooth * 2 * Math.PI / this.NumberOfTeeth + this.Shift * Math.PI * 2 / this.NumberOfTeeth
        var diff = omega - theta;
        while (diff <= -Math.PI) diff += 2 * Math.PI;
        while (diff >= Math.PI) diff -= 2 * Math.PI;
        return Math.abs(diff);        
    }

    map_meetpoints() 
    {
        this.meets = [];
        this.inner_meets = [];
        this.meets_angle = [];
        for (var i = 0; i < this.NumberOfSegments*2; i++) {
            var omega = i * Math.PI / this.NumberOfSegments + this.FrameShift * Math.PI * 2 / this.NumberOfTeeth;
            this.meets_angle.push(omega);
            this.meets.push(this.rotate_point({ x: 0, y: 0 }, { x: this.FrameRadius, y: 0 }, omega));
            if (i % 2 == 0) {
                this.inner_meets.push(this.rotate_point({ x: 0, y: 0 }, { x: this.FrameRadius - this.HoleRadius - this.Tolerance, y: 0 }, omega));
            }
        }

        this.meets_map = [];
        for (var i = 0; i < this.NumberOfTeeth; i++) {
            var max = 10;
            var max_j = -1;
            for (var j = 0; j < this.NumberOfSegments*2; j++) {
                var dist = this.meet_distance(j, i);
                if (dist < max) {
                    max = dist; max_j = j;
                }
            }
            this.meets_map.push([max_j, -1, max]);
        }

        // find the teeth that are furthest from a hole
        for (var i = 0; i < this.NumberOfTeeth; i++) {
            var i2 = (i + 1) % this.NumberOfTeeth;
            if (this.meets_map[i][0] != this.meets_map[i2][0])
            {
                if (this.meets_map[i][2] > this.meets_map[i2][2]) {
                    // set this as an alt triangle.
                    this.meets_map[i][1] = this.meets_map[i2][0];
                    this.meets_map[i2][1] = -2;
                } else {
                    this.meets_map[i2][1] = this.meets_map[i2][0];
                    this.meets_map[i2][0] = this.meets_map[i][0];
                    this.meets_map[i][1] = -3;
                }
            }
        }
    }

    generate_frame_gear() {

        let pt;
        var outline = [];
        for (var i = 0; i < this.NumberOfTeeth; i++) {
            var meet_pt = this.meets[this.meets_map[i][0]];
            var inline = [meet_pt];
            var theta = (i + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) + this.theta_cross - this.dtheta / 2;
            var theta2 = (i + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) - this.theta_cross + this.dtheta / 2;
            var theta3 = (i + 1 + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) + this.theta_cross - this.dtheta / 2;
            var tooth = [];

            for (var j = 0; j < this.Involute.length; j++) {
                pt = this.rotate_point({ x: 0, y: 0 }, { x: this.Involute[j].x, y: this.Involute[j].y }, theta);
                outline.push(pt);
                tooth.push(pt);
                if (j == 0) inline.push(pt);
            }

            for (var j = this.Involute.length - 1; j >= 0; j--) {
                pt = this.rotate_point({ x: 0, y: 0 }, { x: this.Involute[j].x, y: -this.Involute[j].y }, theta2);
                outline.push(pt);
                tooth.push(pt);
                if (j == 0) inline.push(pt);
            }

            var pt3 = this.rotate_point({ x: 0, y: 0 }, { x: this.Involute[0].x, y: this.Involute[0].y }, theta3);
            inline.push(pt3);

            this.Faces.push(inline);
            var alt = this.meets_map[i][1];
            if (alt >= 0) {
                var sideline = [meet_pt, this.meets[alt], pt3];
                this.Faces.push(sideline);

            }

            this.Faces.push(tooth);
        }

        var center = { x: 0, y: 0 };
        for (j = 0; j < this.NumberOfSegments * 2; j++) {
            var j2 = (j + 1) % (this.NumberOfSegments * 2);
            var inner = [center, this.meets[j], this.meets[j2]];
            this.Faces.push(inner);
        }

        for (j = 0; j < this.NumberOfSegments; j++) {
            var hole_center = this.meets[j * 2];

            var circle = [];

            for (var k = 0; k < this.N; k++) {
                var x1 = hole_center.x + this.HoleRadius * Math.cos(k * Math.PI * 2 / this.N);
                var y1 = hole_center.y + this.HoleRadius * Math.sin(k * Math.PI * 2 / this.N);

                pt = { x: x1, y:y1 };
                circle.push(pt);
            }
            this.Cuts.push(circle);
            var j2 = (j + 1) % this.NumberOfSegments;

            var r1 = this.FrameRadius + this.HoleRadius + this.Tolerance;
            var r2 = this.Rdedendum - this.Tolerance;
            var d_ang1 = Math.asin((this.HoleRadius / 2 + this.Tolerance) / r1);
            var d_ang2 = Math.asin((this.HoleRadius / 2 + this.Tolerance) / r2);
            var angA = this.meets_angle[j * 2];
            var angB = this.meets_angle[j2 * 2];

            var cutout = [];
            cutout.push(this.rotate_point({ x: 0, y: 0 }, { x: r1, y: 0 }, angB - d_ang1));
            cutout.push(this.rotate_point({ x: 0, y: 0 }, { x: r1, y: 0 }, angA + d_ang1));
            cutout.push(this.rotate_point({ x: 0, y: 0 }, { x: r2, y: 0 }, angA + d_ang2));
            cutout.push(this.rotate_point({ x: 0, y: 0 }, { x: r2, y: 0 }, angB - d_ang2));
            this.Cuts.push(cutout);

        }

        this.Cuts.push(this.inner_meets);
        this.Outlines.push(outline);
    }


}

class PlanetaryGear2D extends Gear2D {
    constructor(module, numberOfTeeth, pressureAngle, shift, outsideRadius = 0, N=200) {
        super(module, Math.max(20, numberOfTeeth), pressureAngle, shift);
        this.OutsideRadius = Math.max(outsideRadius, this.Raddendum + 1 * module)
        this.N = Math.round(N / numberOfTeeth);

        // these values were just used to build the teeth,
        // this.Rpitch 
        // this.Rbase 
        // this.Rdedendum 
        // this.Raddendum 
        this.generate_planet_gear();
    }

    generate_planet_gear() {

        let pt, pt3;

        var outline = [];
        var innerOutline = [];

        for (var i = 0; i < this.NumberOfTeeth; i++) {
            var theta = (i + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) + this.theta_cross - this.dtheta / 2;
            var theta2 = (i + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) - this.theta_cross + this.dtheta / 2;
            var theta3 = (i + this.Shift + 1) * Math.PI * 2.0 / (this.NumberOfTeeth) + this.theta_cross - this.dtheta / 2;
            var opt = this.rotate_point({ x: 0, y: 0 }, { x: this.OutsideRadius, y: 0 }, theta);
            var opt3 = this.rotate_point({ x: 0, y: 0 }, { x: this.OutsideRadius, y: 0 }, theta3);
            outline.push(opt);
            var tooth = [];
            var face = [];

            for (var j = 0; j < this.InvertInvolute.length; j++) {
                pt = this.rotate_point({ x: 0, y: 0 }, { x: this.InvertInvolute[j].x, y: this.InvertInvolute[j].y }, theta);
                innerOutline.push(pt);
                tooth.push(pt);
                if (j == 0) {
                    pt3 = this.rotate_point({ x: 0, y: 0 }, { x: this.InvertInvolute[j].x, y: this.InvertInvolute[j].y }, theta3);
                    face.push(pt);
                }
            }

            for (var j = this.InvertInvolute.length - 1; j >= 0; j--) {
                pt = this.rotate_point({ x: 0, y: 0 }, { x: this.InvertInvolute[j].x, y: -this.Involute[j].y }, theta2);
                innerOutline.push(pt);
                tooth.push(pt);
                if (j == 0) face.push(pt);
            }

            face.push(pt3);
            face.push(opt3);

            for (var j = 1; j < this.N; j++) {
                var theta1 = theta + j / this.N;
                var opt1 = this.rotate_point({ x: 0, y: 0 }, { x: this.OutsideRadius, y: 0 }, theta1);
                var theta1r = theta + 1-j / this.N;
                var opt1r = this.rotate_point({ x: 0, y: 0 }, { x: this.OutsideRadius, y: 0 }, theta1r);
                outline.push(opt1);
                face.push(opt1r);
            }

            face.push(opt);


            this.Faces.push(face);
            this.Faces.push(tooth);
            this.Outlines.push(outline);
            this.Outlines.push(innerOutline);
        }
    }
}

class EllipticalGear2D extends Gear2D {
    constructor(module, numberOfTeeth, pressureAngle, shift, eccentricity) {
        super(module, Math.max(4 * Math.floor(numberOfTeeth / 4, 8)), 0, pressureAngle);
        this.Shift = shift;
        this.Eccentricity = eccentricity;
        this.A = solveForSemiMajorAxis(Math.PI * 2 * this.Rpitch, this.Eccentricity, this.Rpitch);
        this.B = this.A * Math.sqrt(1 - this.Eccentricity ** 2);
        this.EllipseArcDistance = ellipseArcDistance(this.Eccentricity);
        // these values were just used to build the teeth,
        // this.Rpitch
        // this.Rbase
        // this.Rdedendum
        // this.Raddendum 
        this.generate_elliptical_gear();
    }

    normalVectorEllipse(a, b, theta) {
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

    rotatePointAroundOriginWithNormal(point, normal) {
        // Step 2: Rotate the point by this angle
        const rotatedPoint = {
            x: point.x * normal.x - point.y * normal.y,
            y: point.x * normal.y + point.y * normal.x
        };

        return rotatedPoint;
    }

    rotate_point_to_ellipse(cen, pnt, theta) {
        // Step 1: Calculate the reference point on the circle (Rpitch, 0)
        const refCirclePoint = { x: this.Rpitch, y: 0 };

        // Translate the input point relative to this reference circle point
        const translatedPoint = {
            x: pnt.x - cen.x - refCirclePoint.x,
            y: pnt.y - cen.y - refCirclePoint.y,
        };

        // Step 2: Rotate the translated point by the normal vector direction
        const normal = this.normalVectorEllipse(this.A, this.B, theta);
        const rotatedPoint = this.rotatePointAroundOriginWithNormal(translatedPoint, normal);

        // Step 3: Calculate the ellipse point at angle theta
        const ellipsePoint = {
            x: this.A * Math.cos(theta),
            y: this.B * Math.sin(theta)
        };

        // Step 4: Translate the rotated point to the ellipse position at angle theta
        const finalPoint = {
            x: rotatedPoint.x + ellipsePoint.x + cen.x,
            y: rotatedPoint.y + ellipsePoint.y + cen.y
        };

        return finalPoint;
    }

    // converts an 
    convert_angle_to_ellipse_pair(ctheta1) {
        var etheta1 = this.convert_circle_angle_to_ellipse(ctheta1);
        var etheta2 = Math.PI / 2 - etheta1;
        var ctheta2 = this.convert_ellipse_angle_to_circle(etheta2);
        return ctheta2;
    }

    convert_ellipse_angle_to_circle(ctheta) {
        var etheta = ellipseThetaToCircle(ctheta, this.EllipseArcDistance);
        return etheta;
    }

    convert_circle_angle_to_ellipse(theta) {
        return circleThetaToEllipse(theta, this.EllipseArcDistance);
    }

    generate_elliptical_gear() {

        let pt;
        var outline = [];
        for (var i = 0; i < this.NumberOfTeeth; i++) {
            var inline = [{ x: 0, y: 0 }];
            var ctheta = (i + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) + this.theta_cross - this.dtheta / 2;
            var theta = this.convert_circle_angle_to_ellipse(ctheta);
            var ctheta2 = (i + this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) - this.theta_cross + this.dtheta / 2;
            var theta2 = this.convert_circle_angle_to_ellipse(ctheta2);
            var ctheta3 = (i +1+ this.Shift) * Math.PI * 2.0 / (this.NumberOfTeeth) + this.theta_cross - this.dtheta / 2;
            var theta3 = this.convert_circle_angle_to_ellipse(ctheta3);
            var tooth = [];

            for (var j = 0; j < this.Involute.length; j++) {
                pt = this.rotate_point_to_ellipse({ x: 0, y: 0 }, { x: this.Involute[j].x, y: this.Involute[j].y }, -theta);
                outline.push(pt);
                tooth.push(pt);
                if (j == 0) inline.push(pt);
            }

            for (var j = this.Involute.length - 1; j >= 0; j--) {
                pt = this.rotate_point_to_ellipse({ x: 0, y: 0 }, { x: this.Involute[j].x, y: -this.Involute[j].y }, -theta2);
                outline.push(pt);
                tooth.push(pt);
                if (j == 0) inline.push(pt);
            }

            var pt3 = this.rotate_point_to_ellipse({ x: 0, y: 0 }, { x: this.Involute[0].x, y: this.Involute[0].y }, -theta3);
            inline.push(pt3);
            this.Faces.push(inline);
            this.Faces.push(tooth);
        }

        this.Outlines.push(outline);
    }
}

class Frame2D extends Shape2D {
    constructor(radius, width, segments,hole_radius, shift=0, N = 200) {
        super();
        this.Radius = radius;
        this.Width = width;
        this.HoleRadius = hole_radius;
        this.Segments = segments;
        this.N = Math.round(N / segments);
        this.Shift = shift;
        this.generate_frame();
        if (this.HoleRadius * 2 >= this.Width) {
            this.HoleRadius = this.Width / 3;
        }
    }

    Point(f0, f1) {
        var theta0 = (f0 + this.Shift) * Math.PI * 2 / this.Segments;
        var theta1 = f1 * Math.PI * 2 / this.Segments;
        var pt = { x: this.Radius * Math.cos(theta0) + this.Width / 2 * Math.cos(theta0 + theta1), y: this.Radius * Math.sin(theta0) + this.Width / 2 * Math.sin(theta0 + theta1) };
        return pt;
    }

    PointH(f0, f1, r2=this.HoleRadius) {
        var theta0 = (f0 + this.Shift) * Math.PI * 2 / this.Segments;
        var theta1 = f1 * Math.PI * 2 / this.Segments;
        var pt = { x: this.Radius * Math.cos(theta0) + r2 * Math.cos(theta0 + theta1), y: this.Radius * Math.sin(theta0) + r2 * Math.sin(theta0 + theta1) };
        return pt;
    }

    generate_frame() {
        var outline = [];
        var cutLine = [];
        var ptc ={ x:0, y: 0}
        for (var i = 0; i < this.Segments; i++) {
            for (var j = -this.N / 2; j <= this.N / 2; j++) {
                var face = [ptc];
                var pt = this.Point(i, j / this.N);
                face.push(pt);
                outline.push(pt);
                face.push(this.Point((i + 1) % this.Segments, -.5));

                this.Faces.push(face);
            }

            var pt1 = this.Point(i, this.Segments/2);
            cutLine.push(pt1);
            var hole=[]
            if (this.HoleRadius > 0) {
                for (j = 0; j <= this.N*this.Segments; j++) {
                    hole.push(this.PointH(i, j / this.N));
                }

                this.Cuts.push(hole);
            }
        }

        this.Outlines.push(outline);
        this.Cuts.push(cutLine);
    }
}
