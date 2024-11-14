const pxscale = 100000;
// This class starts with a shape, and extrudes it and
// generates a mesh for Three.js to render
// the shape is defined by a set of outlines and faces.
// the first outline is the outer edge of the shape
// subsequent outlines are holes in the shape
// the faces are a set of concave polygons that in total
// make up the area in inside the outline excluding holes.
// the shape also has an additinal set of faces that are cut shapes
// these cut shapes do not intersect with any of the prior outlines.
// and so will be additional outlines, however the faces
// need to be cut using clipper library.  the resulting faces
// are triangulated using earcut library.

// internally all coordinates are scaled and rounded to
// integers, and then scaled back into the vertices3D array
class Extrude {
    constructor(shape, extrusionDepth) {

        this.vertices3D = []; // Array to store unique vertices
        this.vertexMap = {}; // Dictionary to map vertex strings to indices
        this.triangles3D = []; // Array to store side triangles

        this.extrusionDepth = extrusionDepth * pxscale;
        this.outlines = this.threeToClipperFaces(shape.Outlines);
        this.faces = this.threeToClipperFaces(shape.Faces);
        this.cuts = this.threeToClipperFaces(shape.Cuts);

        this.triangles2D = this.cutFaces();
        var n = 0;
        var n2 = 0;
        for(var triangle of this.triangles2D) {
            this.addFrontTriangle(triangle[0], triangle[1], triangle[2], 0);
            this.addBackTriangle(triangle[0], triangle[1], triangle[2], this.extrusionDepth);
        }

        for(var outline of this.outlines)
        {
            this.addEdges(outline, 0, this.extrusionDepth, outline != this.outlines[0]);
        }
        for (var cut of this.cuts)
        {
            this.addEdges(cut, 0, this.extrusionDepth, true);
        }
    }

    getMesh(col) {
        const geometry = new THREE.BufferGeometry();

        // Flatten vertices and triangles for Three.js
        const positionArray = this.vertices3D.flat();
        const indexArray = this.triangles3D.flat();

        // Set position and index attributes
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3));
        geometry.setIndex(indexArray);

        // Compute normals for lighting
        geometry.computeVertexNormals();

        // Create a material for the mesh
        const material = new THREE.MeshStandardMaterial({
            color: col,
            side: THREE.DoubleSide,
            flatShading: true, // Enforces per-face shading
        });

        // Create and return the mesh
        const extrudedMesh = new THREE.Mesh(geometry, material);
        return extrudedMesh;
    }


    cutFaces() {
        let triangles = [];

        if (this.cuts.length === 0) {
            // Directly triangulate `this.faces` with earcut
            for (let face of this.faces) {
                const earcutVertices = this.clipperToEarcut(face);
                const triangleIndices = window.earcut(earcutVertices);

                // Convert earcut output into actual triangles in (x, y) format
                for (let i = 0; i < triangleIndices.length; i += 3) {
                    const triangle = [
                        { X: earcutVertices[triangleIndices[i] * 2], Y: earcutVertices[triangleIndices[i] * 2 + 1] },
                        { X: earcutVertices[triangleIndices[i + 1] * 2], Y: earcutVertices[triangleIndices[i + 1] * 2 + 1] },
                        { X: earcutVertices[triangleIndices[i + 2] * 2], Y: earcutVertices[triangleIndices[i + 2] * 2 + 1] }
                    ];
                    triangles.push(triangle);
                }
            }
        } else {
            // Use ClipperLib for cutting if there are cut polygons
            for (var face of this.faces) {
                var clipper = new ClipperLib.Clipper();
                clipper.AddPaths([face], ClipperLib.PolyType.ptSubject, true);
                clipper.AddPaths(this.cuts, ClipperLib.PolyType.ptClip, true);

                let solution = new ClipperLib.Paths();
                clipper.Execute(ClipperLib.ClipType.ctDifference, solution, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);

                for (let clippedPolygon of solution) {
                    const earcutVertices = this.clipperToEarcut(clippedPolygon);
                    const triangleIndices = window.earcut(earcutVertices);

                    for (let i = 0; i < triangleIndices.length; i += 3) {
                        const triangle = [
                            { X: earcutVertices[triangleIndices[i] * 2], Y: earcutVertices[triangleIndices[i] * 2 + 1] },
                            { X: earcutVertices[triangleIndices[i + 1] * 2], Y: earcutVertices[triangleIndices[i + 1] * 2 + 1] },
                            { X: earcutVertices[triangleIndices[i + 2] * 2], Y: earcutVertices[triangleIndices[i + 2] * 2 + 1] }
                        ];
                        triangles.push(triangle);
                    }
                }
            }
        }

        return triangles;
    }

    // get a vertex id for a point, using scaled up coordiantes as inputs
    // and rescale it back for regular coordinates for three.js
    // to consume
    getVertexID(x0, y0, z0) {
        const key = `${x0},${y0},${z0}`;
        const x = x0 / pxscale;
        const y = y0 / pxscale;
        const z = z0 / pxscale;
        // Check if the vertex already exists
        if (this.vertexMap.hasOwnProperty(key)) {
            return this.vertexMap[key];
        }

        var index = this.vertices3D.length/3;
        // Add new vertex if it doesn't exist
        this.vertices3D.push(x, y, z);
        this.vertexMap[key] = index;

        return index;
    }

    buildFace(points, z) {
        const face = [];
        var aveX = 0;
        var aveY = 0;
        for (let i = 0; i < points.length; i++) {
            aveX += points[i].x / points.length;
            aveY += points[i].y / points.length;
        }
        const center = this.getVertexID(aveX, aveY, z);

        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const index = this.getVertexID(p.x, p.y, z);
            face.push(index);
        }

        // Triangulate face by connecting the vertices in a fan from the first point
        for (let i = 0; i < face.length; i++) {
            var i1 = (i + 1) % face.length;
            if (z === 0) { // Bottom face
                this.triangles3D.push([center, face[i], face[i1]]);
            } else { // Top face, reverse order for outward normals
                this.triangles3D.push([center, face[i1], face[i]]);
            }
        }
    }

    addEdges(outline, z1, z2, reverse) {
        for (let i = 0; i < outline.length; i++) {
            const i2 = (i + 1) % outline.length;
            if (!reverse) {
                this.addEdgeQuad(outline[i], outline[i2], z1, z2);
            }
            else {
                this.addEdgeQuad(outline[i2], outline[i], z1, z2);
            }
        }
    }

    addFrontTriangle(v1, v2, v3, z) {
        const i1 = this.getVertexID(v1.X, v1.Y, z);
        const i2 = this.getVertexID(v2.X, v2.Y, z);
        const i3 = this.getVertexID(v3.X, v3.Y, z);
        this.triangles3D.push([i1, i2, i3]);
    }

    addBackTriangle(v1, v2, v3, z) {
        const i1 = this.getVertexID(v1.X, v1.Y, z);
        const i2 = this.getVertexID(v2.X, v2.Y, z);
        const i3 = this.getVertexID(v3.X, v3.Y, z);
        this.triangles3D.push([i1, i3, i2]);
    }

    addEdgeQuad(v1, v2, z1, z2) {
        const i1 = this.getVertexID(v1.X, v1.Y, z1);
        const i2 = this.getVertexID(v2.X, v2.Y, z1);
        const i3 = this.getVertexID(v2.X, v2.Y, z2);
        const i4 = this.getVertexID(v1.X, v1.Y, z2);

        // Create two triangles for the quad
        this.triangles3D.push([i1, i2, i3]);
        this.triangles3D.push([i1, i3, i4]);
    }

    clipperToThreePt(point) {
        return { x: point.X / pxscale, y: point.Y / pxscale };
    }

    threeToClipperPt(point) {
        return { X: Math.round(point.x * pxscale), Y: Math.round(point.y * pxscale) };
    }

    threeToClipperFace(face) {
        const vertices = [];
        for(let point of face)
        {
            vertices.push(this.threeToClipperPt(point));
        }

        return vertices;
    }

    threeToClipperFaces(faces) {
        const f = [];
        for(var face of faces)
        {
            f.push(this.threeToClipperFace(face));
        }

        return f;
    }

    clipperToEarcut(polygon) {
        const vertices = [];
        polygon.forEach(point => {
            vertices.push(point.X, point.Y);
        });
        return vertices;
    }
}

