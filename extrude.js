class Extrude {
    constructor() {
        this.vertices = []; // Array to store unique vertices
        this.vertexMap = {}; // Dictionary to map vertex strings to indices
        this.sideTriangles = []; // Array to store side triangles
    }

    getVertexID(x, y, z) {
        const key = `${x},${y},${z}`;
        
        // Check if the vertex already exists
        if (this.vertexMap.hasOwnProperty(key)) {
            return this.vertexMap[key];
        }
        
        // Add new vertex if it doesn't exist
        const index = this.vertices.length;
        this.vertices.push([x, y, z]);
        this.vertexMap[key] = index;
        
        return index;
    }

    getMesh(col) {
        const geometry = new THREE.BufferGeometry();

        // Flatten vertices and triangles for Three.js
        const positionArray = this.vertices.flat();
        const indexArray = this.sideTriangles.flat();

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

    extrudeShape(shape, depth) {
        // Extrude the sides based on the outline shape
        for (let j = 0; j < shape.Outlines.length; j++) {
            var outline = shape.Outlines[j];
            for (let i = 0; i < outline.length; i++) {
                const i2 = (i + 1) % outline.length;
                if (j == 0) {
                    this.addEdgeQuad(outline[i], outline[i2], depth);
                }
                else {
                    this.addEdgeQuad(outline[i2], outline[i], depth);
                }
            }
        }

        for (let i = 0; i < shape.Faces.length; i++) {
            const face = shape.Faces[i];
            this.buildFace(face, 0);       // Bottom face of each tooth
            this.buildFace(face, depth);   // Top face of each tooth
        }
    }

    addEdgeQuad(v1, v2, depth) {
        const i1 = this.getVertexID(v1.x, v1.y, 0);
        const i2 = this.getVertexID(v2.x, v2.y, 0);
        const i3 = this.getVertexID(v2.x, v2.y, depth);
        const i4 = this.getVertexID(v1.x, v1.y, depth);
        
        // Create two triangles for the quad
        this.sideTriangles.push([i1, i2, i3]);
        this.sideTriangles.push([i1, i3, i4]);
    }

    buildFace(points, z) {
        const face = [];
        var aveX = 0;
        var aveY = 0;
        for (let i = 0; i < points.length; i++) {
            aveX += points[i].x/points.length;
            aveY += points[i].y/points.length;
        }
        const center = this.getVertexID(aveX, aveY, z);

        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const index = this.getVertexID(p.x, p.y, z);
            face.push(index);
        }
        
        // Triangulate face by connecting the vertices in a fan from the first point
        for (let i = 0; i < face.length; i++) {
            var i1 = (i+1) % face.length;
            if (z === 0) { // Bottom face
                this.sideTriangles.push([center, face[i], face[i1]]);
            } else { // Top face, reverse order for outward normals
                this.sideTriangles.push([center, face[i1], face[i]]);
            }
        }
    }
}
