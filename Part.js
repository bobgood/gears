
root_object = null;

class Util {
    constructor() { }

    radians(degrees) { return degrees * Math.PI / 180; }
    rcos(r, a) { return r * Math.cos(a); }
    rsin(r, a) { return r * Math.sin(a); }
    dist(x, y) { return Math.sqrt(x * x + y * y); }
    mult(x, y) { return x * y; }
    ave(x, y) { return (x + y) / 2; }
    neg(x) { return -x; }
    max(a,b) { return Math.max(a,b); }
}

class Shape3D extends Util {
    constructor(initialization) {
        super();
        Object.assign(this, initialization);
        this.childrenmap = {};
        this.cache = {};
        this.Parent = null;
        this.object3D = null;
    }

    add(child) {
        this.childrenmap[child.Name] = child;
        if (child.Type != "Root") {
            child.Parent = this;
        }
    }

    connect(child) {
        if (child.Type == "Root") {
        }
        else if (child instanceof Camera3D) {
            this.camera = child.object3D;
        }
        else if (child instanceof Shape3D) {
            this.object3D.add(child.object3D);
        }
    }


    rebuild() {
        root_object.rebuild_all = true;
    }

    color(c) {
        let cs;
        if ((cs = preset_colors[c]) === undefined) {
            cs = c;
        }

        const colorHex = cs.replace("#", "");

        // Convert the hex string to an integer
        return parseInt(colorHex, 16);
    }

    // called if an object was rebuilt
    set(ob) {
        if (this.object3D !== null && this.object3D !==undefined) {
            this.Parent.object3D.remove(this.object3D);
        }

        this.object3D = ob;
        this.Parent.object3D.add(this.object3D);
        this.move1();
    }

    reset_cache() {
        this.cache = {};
        for (var child in this.childrenmap) {
            this.childrenmap[child].reset_cache();
        }
    }

    rebuild1() {
        for (var name in this.childrenmap) {
            var child=this.childrenmap[name];
            child.build();
            child.rebuild1();
        }
    }

    move1() {
        let v;
        if (v = this.getParameter("PositionX")) {
            this.object3D.position.x = v;
        }

        if (v = this.getParameter("Position")) {
            this.object3D.position.x = v[0];
            this.object3D.position.y = v[1];
            if (v.length > 2) {
                this.object3D.position.z = v[2];
            }
        }

        if (v = this.getParameter("PositionY")) {
            this.object3D.position.y = v;
        }

        if (v = this.getParameter("PositionZ")) {
            this.object3D.position.z = v;
        }

        if (v = this.getParameter("LookAtX")) {
            this.object3D.lookAt.x = v;
        }

        if (v = this.getParameter("LookAt")) {
            this.object3D.lookAt.x = v[0];
            this.object3D.lookAt.y = v[1];
            if (v.length > 2) {
                this.object3D.lookAt.z = v[2];
            }
        }

        if (v = this.getParameter("LookAtY")) {
            this.object3D.lookAt.y = v;
        }

        if (v = this.getParameter("LookAtZ")) {
            this.object3D.lookAt.z = v;
        }

        if (v = this.getParameter("RotationX")) {
            this.object3D.rotation.x = v;
        }

        if (v = this.getParameter("RotationY")) {
            this.object3D.rotation.y = v;
        }

        if (v = this.getParameter("RotationZ")) {
            this.object3D.rotation.z = v;
        }

        for (var name in this.childrenmap) {
            var child = this.childrenmap[name];
            child.move1();
        }

        if (this.update !== undefined) {
            this.update();
        }
    }

    lookupParameter(field, defaultValue = null) {
        let r;

        if (r = this.cache[field] === undefined) {
            r = this[field];
            if (typeof r === 'string') {
                if (r.startsWith('#')) {
                    return r;
                }

                r = this.getParameter(r, defaultValue);
                this.cache[field] = r;
                return r;
            }
            else {
                if (r === undefined) {
                    return defaultValue;
                }
                return r;
            }
        }

        return r;
    }

    resolveParams(params) {
        var args = [];
        let pp;
        for (pp of params) {
            args.push(this.getParameter(pp));
        }

        return args;

    }

    runFunction(name, args) {
        var x = this[name](...args);
        return x;
    }

    getParameterSub(sub, field, defaultValue = null) {
         
        if (sub === null || sub === undefined) {
            return defaultValue;
        }
        if (sub[field] === undefined) {
            return defaultValue;
        }

        return this.getParameter(sub[field], defaultValue);
    }

    getParameter(text, defaultValue = null) {
        var f = parseFloat(text);
        if (!isNaN(f)) {
            return f;
        }

        var left = text;
        var params = null;
        const parenIndex = text.indexOf('(', 1);
        if (parenIndex > 1 && text.charAt(text.length - 1) === ')')
        {
            left = text.substring(0, parenIndex);
            const right = text.substring(parenIndex + 1, text.length - 1);
            params = right.split(',');
        }
        var scopes = left.split('.');
        var scope = this;
        let f1;
        for (var i = 0; i < scopes.length; i++) {
            // order:  1) named child,
            if ((f1 = scope.childrenmap[scopes[i]]) !== undefined) {
                scope = f1;
                break;
            }

            // 2) ancestors named child(if first), 
            if (i == 0) {
                let parent=scope;
                while ((parent = parent.Parent) != null) {
                    if ((f1 = parent.childrenmap[scopes[i]]) !== undefined) {
                        scope = f1;
                        break;
                    }

                }
            }

            // 3) named parameter(if last and no parameters), 
            if (i == scopes.length - 1) {
                if (params === null) {
                    while (scope[scopes[i]] === scopes[i]
                    || (scope[scopes[i]]==undefined)) {
                        scope = scope.Parent;
                        if (scope === null) {
                            return defaultValue;
                        }
                    }

                    return scope.lookupParameter(scopes[i], defaultValue);
                }
                else {
                    // 4) function (last and has parameters)
                    return scope.runFunction(scopes[i], this.resolveParams(params));
                }

            } else {
                return defaultValue;
            }
        }

        return defaultValue;
    }
}

class Root3D extends Shape3D {
    constructor(json) {
        super(json);
        this.scene = new THREE.Scene();
        this.object3D = this.scene;
        root_object = this;
        this.rebuild_all = false;
        this.camera = null;
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
    }

    animate() {
        if (this.rebuild_all) {
            this.rebuild1();
        }

        this.reset_cache();
        this.move1();
        this.rebuild = false;
        this.renderer.render(this.object3D, this.camera);
    }
}

class ExtrudedGear3D extends Shape3D {
    constructor(json, shape) {
        super(json);
        this.Shape2D = null;
    }

    update() {
        if (this.Shape2D === null) {
            return;
        }

        let v;
        if (v = this.getParameter("Color")) {
            this.object3D.material.color.set(this.color(v));
        }

        if (v = this.getParameter("Opacity")) {
            if (v >= 1) {
                this.object3D.material.transparent = false;
            } else {
                this.object3D.material.opacity = v;
                this.object3D.material.transparent = true;
            }
        }
    }

    extrude() {
        const extruder = new Extrude(this.Shape2D, this.getParameter("Thickness"));
        const mesh = extruder.getMesh(this.getParameter("Color"));
        this.set(mesh);
    }
}


class SimpleGear3D extends ExtrudedGear3D {
    constructor(json) {
        super(json);
    }

    build() {
        this.Shape2D = new SimpleGear2D(
            this.getParameter("Module"),
            this.getParameter("NumberOfTeeth"),
            this.getParameter("PressureAngle"),
            this.getParameter("Shift"));
        var slot = this.getParameter("Slot");
        if (slot!=undefined && slot!=null) {
            this.Shape2D.slot(
                this.getParameterSub(slot,"HoleRadius"),
                this.getParameterSub(slot,"SlotWidth"),
                this.getParameterSub(slot,"SlotDepth"),
                this.getParameter("SlotShift"));
        }


        this.Rpitch = this.Shape2D.Rpitch;
        this.Rbase = this.Shape2D.Rbase;
        this.Rdedendum = this.Shape2D.Rdedendum;
        this.Raddendum = this.Shape2D.Raddendum;

        this.extrude();
    }
}

class FrameGear3D extends ExtrudedGear3D {
    constructor(json) {
        super(json);
    }

    build() {
        this.Shape2D = new FrameGear2D(
            this.getParameter("Module"),
            this.getParameter("NumberOfTeeth"),
            this.getParameter("PressureAngle"),
            this.getParameter("Shift"),
            this.getParameter("FrameRadius"),
            this.getParameter("NumberOfSegments"),
            this.getParameter("FrameShift"),
            this.getParameter("HoleRadius"),
            this.getParameter("Tolerance"),
            this.getParameter("N"),
        );


        this.Rpitch = this.Shape2D.Rpitch;
        this.Rbase = this.Shape2D.Rbase;
        this.Rdedendum = this.Shape2D.Rdedendum;
        this.Raddendum = this.Shape2D.Raddendum;


        this.extrude();
    }
}

class PlanetaryGear3D extends ExtrudedGear3D {
    constructor(json) {
        super(json);
    }


    build() {
        this.Shape2D = new PlanetaryGear3D(
            this.getParameter("Module"),
            this.getParameter("NumberOfTeeth"),
            this.getParameter("PressureAngle"),
            this.getParameter("Shift"),
            this.getParameter("OusideRadius"),
        );

        this.Rpitch = this.Shape2D.Rpitch;
        this.Rbase= this.Shape2D.Rbase;
        this.Rdedendum= this.Shape2D.Rdedendum;
        this.Raddendum = this.Shape2D.Raddendum;


        this.extrude();
    }
}

class EllipticalGear3D extends ExtrudedGear3D {
    constructor(json) {
        super(json);
    }

    build() {
        this.Shape2D = new EllipticalGear3D(
            this.getParameter("Module"),
            this.getParameter("NumberOfTeeth"),
            this.getParameter("PressureAngle"),
            this.getParameter("Shift"),
            this.getParameter("Eccentricity")
        );

        this.Rpitch = this.Shape2D.Rpitch;
        this.Rbase = this.Shape2D.Rbase;
        this.Rdedendum = this.Shape2D.Rdedendum;
        this.Raddendum = this.Shape2D.Raddendum;
        this.A = this.Shape2D.A;
        this.B = this.Shape2D.B;

        var slot = this.getParameter("Slot");
        if (slot != undefined && slot != null) {
            this.Shape2D.slot(
                this.getParameterSub(slot, "HoleRadius"),
                this.getParameterSub(slot, "SlotWidth"),
                this.getParameterSub(slot, "SlotDepth"),
                this.getParameter("SlotShift"));
        }

        this.extrude();
    }
}

class Epicyclic3D extends Shape3D {
    constructor(json) {
        super(json);
    }

    build() {

    }
}

class Camera3D extends Shape3D {
    constructor(json) {
        super(json);
        this.object3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    }

    build() {

    }
}
class AmbientLight3D extends Shape3D {
    constructor(json) {
        super(json);
        const ambientLight = new THREE.AmbientLight(0x404040, 1); // Color and intensity
        this.object3D = ambientLight;
    }

    build() {

    }
}

class DirectionalLight3D extends Shape3D {
    constructor(json) {
        super(json);
        this.object3D = new THREE.DirectionalLight(0xffffff, 1); // Color and intensity
    }

    build() {

    }
}

function ConfigureMechanism(data) {
    for (var partdef of data) {
        let parentPath;
        var part = CreatePart(partdef); 
        if (part.Type == "Root") { }
        else if ((parentPath = partdef.Parent) !== undefined) {
            var parent = root_object.getParameter(parentPath);
            parent.add(part);
            part.build();
            parent.connect(part);
        }
        else {
            root_object.add(part);
            part.build();
            root_object.connect(part);
        }
    }

    return root_object;
}

function CreatePart(json) {
    switch (json.Type) {
        case "Root":
            return new Root3D(json);
        case "Camera":
            return new Camera3D(json);
        case "AmbientLight":
            return new AmbientLight3D(json);
        case "DirectionalLight":
            return new DirectionalLight3D(json);
        case "FrameGear":
            return new FrameGear3D(json);
        case "SimpleGear":
            return new SimpleGear3D(json);
        case "PlanetaryGear":
            return new PlanetaryGear3D(json);
        case "EllipticalGear":
            return new EllipticalGear3D(json);
        case "Epicyclic":
            return new Epicyclic3D(json);
        default:
            console.error("Unknown part type: " + json.Type);
            return null;
    }
}

preset_colors = {
    "#black": "#000000",
    "#white": "#ffffff",
    "#red": "#ff0000",
    "#green": "#00ff00",
    "#blue": "#0000ff",
    "#yellow": "#ffff00",
    "#cyan": "#00ffff",
    "#magenta": "#ff00ff",
    "#orange": "#ffa500",
    "#purple": "#800080",
    "#pink": "#ffc0cb",
    "#brown": "#8b4513",
    "#grey": "#808080",
    "#lightGrey": "#d3d3d3",
    "#darkGrey": "#a9a9a9",
    "#lightBlue": "#add8e6",
    "#darkBlue": "#00008b",
    "#lightGreen": "#90ee90",
    "#darkGreen": "#006400",
    "#lightRed": "#ff7f7f",
    "#darkRed": "#8b0000",
    "#gold": "#ffd700",
    "#silver": "#c0c0c0",
    "#teal": "#008080",
    "#navy": "#000080",
    "#olive": "#808000",
    "#maroon": "#800000",
    "#lime": "#00ff00",
    "#indigo": "#4b0082",
    "#violet": "#ee82ee",
    "#black": "#000000",
    "#white": "#ffffff",
    "#red": "#ff0000",
    "#green": "#00ff00",
    "#blue": "#0000ff",
    "#yellow": "#ffff00",
    "#cyan": "#00ffff",
    "#magenta": "#ff00ff",
    "#orange": "#ffa500",
    "#purple": "#800080",
    "#pink": "#ffc0cb",
    "#brown": "#8b4513",
    "#grey": "#808080",
    "#lightGrey": "#d3d3d3",
    "#darkGrey": "#a9a9a9",
    "#lightBlue": "#add8e6",
    "#darkBlue": "#00008b",
    "#lightGreen": "#90ee90",
    "#darkGreen": "#006400",
    "#lightRed": "#ff7f7f",
    "#darkRed": "#8b0000",
    "#gold": "#ffd700",
    "#silver": "#c0c0c0",
    "#teal": "#008080",
    "#navy": "#000080",
    "#olive": "#808000",
    "#maroon": "#800000",
    "#lime": "#00ff00",
    "#indigo": "#4b0082",
    "#violet": "#ee82ee",
    "#turquoise": "#40e0d0",
    "#salmon": "#fa8072",
    "#khaki": "#f0e68c",
    "#coral": "#ff7f50",
    "#ivory": "#fffff0",
    "#lavender": "#e6e6fa",
    "#peachPuff": "#ffdab9",
    "#orchid": "#da70d6",
    "#plum": "#dda0dd",
    "#sienna": "#a0522d",
    "#skyBlue": "#87ceeb",
    "#seaGreen": "#2e8b57",
    "#slateBlue": "#6a5acd",
    "#springGreen": "#00ff7f",
    "#steelBlue": "#4682b4",
    "#tan": "#d2b48c",
    "#thistle": "#d8bfd8",
    "#wheat": "#f5deb3",
    "#mintCream": "#f5fffa",
    "#ghostWhite": "#f8f8ff",
    "#beige": "#f5f5dc",
    "#honeydew": "#f0fff0",
    "#aliceBlue": "#f0f8ff",
    "#antiqueWhite": "#faebd7",
    "#aquamarine": "#7fffd4",
    "#azure": "#f0ffff",
    "#blanchedAlmond": "#ffebcd",
    "#burlyWood": "#deb887",
    "#chartreuse": "#7fff00",
    "#chocolate": "#d2691e",
    "#crimson": "#dc143c",
    "#darkCyan": "#008b8b",
    "#darkGoldenrod": "#b8860b",
    "#darkKhaki": "#bdb76b",
    "#darkMagenta": "#8b008b",
    "#darkOliveGreen": "#556b2f",
    "#darkOrange": "#ff8c00",
    "#darkOrchid": "#9932cc",
    "#darkSalmon": "#e9967a",
    "#darkSeaGreen": "#8fbc8f",
    "#darkSlateBlue": "#483d8b",
    "#darkSlateGray": "#2f4f4f",
    "#dodgerBlue": "#1e90ff",
    "#firebrick": "#b22222",
    "#floralWhite": "#fffaf0",
    "#forestGreen": "#228b22",
    "#gainsboro": "#dcdcdc",
    "#hotPink": "#ff69b4",
    "#indianRed": "#cd5c5c",
    "#lightCoral": "#f08080",
    "#lightCyan": "#e0ffff",
    "#lightGoldenrodYellow": "#fafad2",
    "#lightPink": "#ffb6c1",
    "#lightSalmon": "#ffa07a",
    "#mediumAquamarine": "#66cdaa",
    "#mediumBlue": "#0000cd",
    "#mediumOrchid": "#ba55d3",
    "#mediumPurple": "#9370db",
    "#mediumSeaGreen": "#3cb371",
    "#mediumSlateBlue": "#7b68ee",
    "#mediumSpringGreen": "#00fa9a",
    "#mediumTurquoise": "#48d1cc",
    "#mediumVioletRed": "#c71585",
    "#mistyRose": "#ffe4e1",
    "#moccasin": "#ffe4b5",
    "#navajoWhite": "#ffdead",
    "#oldLace": "#fdf5e6",
    "#paleGoldenrod": "#eee8aa",
    "#paleGreen": "#98fb98",
    "#paleTurquoise": "#afeeee",
    "#paleVioletRed": "#db7093",
    "#papayaWhip": "#ffefd5",
    "#powderBlue": "#b0e0e6",
    "#rosyBrown": "#bc8f8f",
    "#royalBlue": "#4169e1",
    "#saddleBrown": "#8b4513",
    "#sandyBrown": "#f4a460",
    "#seaShell": "#fff5ee",
    "#snow": "#fffafa",
    "#tomato": "#ff6347",
    "#yellowGreen": "#9acd32"
};

