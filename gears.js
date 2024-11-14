class Shape2D {
    constructor() {
        // outer outline
        this.Outlines = [];
        // edge between teeth and core
        this.Faces = [];
        // post processing holes and  otches
        this.Cuts = [];
    }

    drill(x, y, r, N = 100) {
        if (this.Outlines.length != 1) {
            throw "cannot "
        }
        var points = [];
        for (var i = 0; i < N; i++) {
            var theta = i * Math.PI * 2.0 / 20.0;
            points.push({ x: x + r * Math.cos(theta), y: y + r * Math.sin(theta) });
        }
        this.Cuts.push(points);
    }

    mill(w, r1, r2) {
        if (this.Outlines.length != 1) {
            throw "cannot drill into hollow gear"
        }

        var points = [];
        points.push({ x: r1, y: w / 2 });
        points.push({ x: r2, y: w / 2 });
        points.push({ x: r2, y: -w / 2 });
        points.push({ x: r1, y: -w / 2 });
    }
}
class Gear extends Shape2D {
    constructor(module, numTeeth, pressureAngle, shift) {
        super();
        this.Module = module;
        this.NumTeeth = numTeeth;
        this.PressureAngle = pressureAngle;
        this.Shift = shift;

        // Rp aka r pitch
        this.Rpitch = this.pitch_diameter() / 2.0;

        // Rb aka r base
        this.Rbase = this.base_diameter() / 2.0;

        // Rd aka r dedendum aka r min
        this.Rdedendum = this.Rpitch - this.dedendum();

        // Ra aka r addendum aka r max
        this.Raddendum = this.Rpitch + this.addendum();

        // thickness of the tooth
        this.Ttooth = this.tooth_thickness();

        // smoothing points along the involute curve
        this.Smoothing = 20;

        // calculates the form of the involute curve
        this.Base_involute_curve = this.involute_curve();

        // calculates the coordinates of the involute curve
        this.Involute = this.create_involute_coordinates();

        // upside down for planetary
        this.InvertInvolute = this.create_invert_involute_coordinates();
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
        // find the crossing point of the involute curve with the pitch circle
        this.p_cross = this.involute_point(this.involute_bisect(this.Rpitch));
        this.theta_cross = Math.atan2(this.p_cross.y, this.p_cross.x);
        this.dtheta = this.Ttooth / this.Rpitch;


        // compute whether the gear profile will self-intersect once patterned
        var involute_pts = [];
        for (var i = 0; i < this.Base_involute_curve.length; i++) {
            var tpnt = this.rotate_point({ x: 0, y: 0 }, this.Base_involute_curve[i], +this.theta_cross - this.dtheta / 2);
            var angle1 = Math.atan2(tpnt.y, tpnt.x);
            if (angle1 < Math.PI / this.NumTeeth && tpnt.y > 0) {
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
        return this.Module * this.NumTeeth;
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
        return Math.PI * this.pitch_diameter() / (2.0 * this.NumTeeth);
    }

}

class SimpleGear extends Gear {
    constructor(module, numTeeth, pressureAngle, shift) {
        super(module, numTeeth, pressureAngle, shift);
        this.generate_simple_gear();

    }

    generate_simple_gear() {

        let pt;
        var inline = [];
        var outline = [];
        for (var i = 0; i < this.NumTeeth; i++) {
            var theta = (i + this.Shift) * Math.PI * 2.0 / (this.NumTeeth) + this.theta_cross - this.dtheta / 2;
            var theta2 = (i + this.Shift) * Math.PI * 2.0 / (this.NumTeeth) - this.theta_cross + this.dtheta / 2;
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

            this.Faces.push(tooth);
        }

        this.Faces.push(inline);
        this.Outlines.push(outline);
    }
}

class PlanetaryGear extends Gear {
    constructor(module, numTeeth, pressureAngle, shift, outsideRadius = 0) {
        super(module, Math.max(20, numTeeth), pressureAngle, shift);
        this.OutsideRadius = Math.max(outsideRadius, this.Raddendum + 1 * module)

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

        for (var i = 0; i < this.NumTeeth; i++) {
            var theta = (i + this.Shift) * Math.PI * 2.0 / (this.NumTeeth) + this.theta_cross - this.dtheta / 2;
            var theta2 = (i + this.Shift) * Math.PI * 2.0 / (this.NumTeeth) - this.theta_cross + this.dtheta / 2;
            var theta3 = (i + this.Shift + 1) * Math.PI * 2.0 / (this.NumTeeth) + this.theta_cross - this.dtheta / 2;
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
            face.push(opt);
            this.Faces.push(face);
            this.Faces.push(tooth);
            this.Outlines.push(outline);
            this.Outlines.push(innerOutline);
        }
    }
}

class EllipticalGear extends Gear {
    constructor(module, numTeeth, pressureAngle, shift, eccentricity) {
        super(module, Math.max(4 * Math.floor(numTeeth / 4, 8)), 0, pressureAngle);
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
        var inline = [];
        var outline = [];
        for (var i = 0; i < this.NumTeeth; i++) {
            var ctheta = (i + this.Shift) * Math.PI * 2.0 / (this.NumTeeth) + this.theta_cross - this.dtheta / 2;
            var theta = this.convert_circle_angle_to_ellipse(ctheta);
            var ctheta2 = (i + this.Shift) * Math.PI * 2.0 / (this.NumTeeth) - this.theta_cross + this.dtheta / 2;
            var theta2 = this.convert_circle_angle_to_ellipse(ctheta2);
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

            this.Faces.push(tooth);
        }

        this.Faces.push(inline);
        this.Outlines.push(outline);
    }
}

class FrameGear extends Shape2D {
    constructor(radius, width, segments, shift=0, N = 7) {
        super();
        this.Radius = radius;
        this.Width = width;
        this.Segments = segments;
        this.N = Math.round(N / segments);
        this.Shift = shift;
        this.generate_frame_gear();
    }

    Point(f0, f1) {
        var theta0 = (f0 + this.Shift) * Math.PI * 2 / this.Segments;
        var theta1 = f1 * Math.PI * 2 / this.Segments;
        var pt = { x: this.Radius * Math.cos(theta0) + this.Width / 2 * Math.cos(theta0 + theta1), y: this.Radius * Math.sin(theta0) + this.Width / 2 * Math.sin(theta0 + theta1) };
        return pt;
    }

    generate_frame_gear() {
        var outline = [];
        var cutLine = [];
        var ptc ={ x:0, y: 0}
        for (var i = 0; i < this.Segments; i++) {
            var face = [ptc];
            for (var j = -this.N / 2; j <= this.N / 2; j++) {
                var pt = this.Point(i, j / this.N);
                face.push(pt);
                outline.push(pt);
            }

            face.push(this.Point((i + 1) % this.Segments, -.5));

            this.Faces.push(face);
            var pt1 = this.Point(i, this.Segments/2);
            cutLine.push(pt1);
        }

        this.Outlines.push(outline);
        this.Cuts.push(cutLine);
    }
}
