import { Vec3, Vec3Array, Vec4Array } from './matrix';

export enum VertexDataType {
  POINTS,
  LINES,
  LINE_LOOP,
  LINE_STRIP,
  TRIANGLES,
  TRIANGLE_STRIP,
  TRIANGLE_FAN,
}

const mapVertexDataTypeToGl = (gl: WebGLRenderingContext, vertexDataType: VertexDataType) => {
  switch (vertexDataType) {
    case VertexDataType.POINTS:
      return gl.POINTS;
    case VertexDataType.LINES:
      return gl.LINES;
    case VertexDataType.LINE_LOOP:
      return gl.LINE_LOOP;
    case VertexDataType.LINE_STRIP:
      return gl.LINE_STRIP;
    case VertexDataType.TRIANGLES:
      return gl.TRIANGLES;
    case VertexDataType.TRIANGLE_STRIP:
      return gl.TRIANGLE_STRIP;
    case VertexDataType.TRIANGLE_FAN:
      return gl.TRIANGLE_FAN;
    default:
      return -1;
  }
};

export interface ModelOpts {
  name: string;
  type?: VertexDataType;
  vertices: Vec3Array;
  /** If true, copies all vertices and flips them from one side to the other then appends. */
  shouldMakeSymmetrical?: boolean;
  /** Array of colours that correspond to the vertices of the model. */
  colors?: Vec4Array;
}
/** Represents a physical object */
export class Model {
  name: string;
  type: VertexDataType;
  vertices: Vec3Array;
  boundingBox: [Vec3, Vec3];
  size: Vec3;
  vertexBuffer: WebGLBuffer;
  colors?: Vec4Array;
  colorBuffer?: WebGLBuffer;

  constructor({
    name,
    type = VertexDataType.TRIANGLES,
    vertices,
    shouldMakeSymmetrical,
    colors,
  }: ModelOpts) {
    this.name = name;
    this.type = type;
    this.colors = colors;

    if (shouldMakeSymmetrical) {
      this.vertices = new Vec3Array(
        ...vertices,
        ...vertices.map(v => new Vec3(v[0] * -1, v[1], v[2])),
      );
    } else {
      this.vertices = vertices;
    }
    this.boundingBox = this.vertices.getBoundingBox();
    this.size = this.boundingBox[1].clone().subtract(this.boundingBox[0]);
  }

  initBuffers(gl: WebGLRenderingContext) {
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices.toFloat32Array(), gl.STATIC_DRAW);

    if (this.colors) {
      this.colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.colors.toFloat32Array(), gl.STATIC_DRAW);
    }

    //Load texture image
    if (options.texture) {
      var textureImage;
      function createTexture() {
        self.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, self.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage);
        //Set texture filter quality
        var filter = {
          0: { mag: gl.NEAREST, min: gl.NEAREST },
          1: { mag: gl.LINEAR, min: gl.NEAREST },
          2: { mag: gl.LINEAR, min: gl.LINEAR },
          3: { mag: gl.LINEAR, min: gl.LINEAR_MIPMAP_NEAREST },
        }[Settings.TEXTURE_FILTER_QUALITY];
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter.mag);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter.min);
        if (Settings.TEXTURE_FILTER_QUALITY == 3) {
          gl.generateMipmap(gl.TEXTURE_2D);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
      //The texture image can also be passed as a URI string
      if (typeof options.texture == 'string') {
        textureImage = new Image();
        textureImage.onload = createTexture;
        textureImage.src = options.texture;
      } else {
        textureImage = options.texture;
        createTexture();
      }
    }

    //Texture coordinates buffer
    if (options.textureCoordinates) {
      this.textureBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
      this.textureCoordinates = new Float32Array(options.textureCoordinates);
      gl.bufferData(gl.ARRAY_BUFFER, this.textureCoordinates, gl.STATIC_DRAW);
    }

    //The vertex index buffer and normals
    if (options.indices) {
      //Copy every face for the opposite side if symmetrical
      if (options.symmetrical) {
        var length = options.indices.length,
          vertexCount = this.vertexCount / 2;
        for (var i = 0; i < length; i += 3) {
          var face = options.indices.slice(i, i + 3);
          for (var f = 0; f < 3; f++) {
            if (face[f] >= vertexCount) {
              face = null;
              break;
            }
            face[f] += vertexCount;
          }
          if (face) options.indices.push(face[2], face[1], face[0]);
        }
      }

      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      this.indices = this.originalIndices = new Uint16Array(options.indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    }
    //Calculate normals
    this.normals = this.calculateNormals(this.vertices, this.indices);
    this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    //Store wireframe data
    this.wireframe = d(options.wireframe, false);
    if (this.wireframe) this.createWireframeBuffers();

    //Whether the model is visible or not
    this.visible = d(options.visible, true);

    //Stores the matrix data of the model (position, rotation and scale)
    this.position = d(options.position, new Vector(0, 0, 0));
    this.rotation = d(options.rotation, new Vector(0, 0, 0));

    //Other model information
    this.solid = d(options.solid, true);
    this.mobile = d(options.mobile, true);
    this.velocity = d(options.velocity, new Vector(0, 0, 0));
    this.mass = d(options.mass, 0);
    this.alpha = d(options.alpha, 1);

    //Subdivided meshes
    this.cachedSubdivisionData = [
      {
        vertices: this.vertices,
        indices: this.indices,
        normals: this.normals,
      },
    ];
    this.subdivisions = d(options.subdivisions, 0);
    if (this.subdivisions) this.subdivide(this.subdivisions);

    //Add this model to the list of models
    Render.relevent.push(this);
    Model.models.push(this);
  }
}

//Wrapper for rotating the model's rotation
Model.prototype.rotate = function(x, y, z) {
  var fullRotation = 2 * Math.PI;
  this.rotation.x = (this.rotation.x + x) % fullRotation;
  this.rotation.y = (this.rotation.y + y) % fullRotation;
  this.rotation.z = (this.rotation.z + z) % fullRotation;
};

//Calculates the normals of every vertex in the model
Model.prototype.calculateNormals = function(vertices, indices) {
  var vertexLength = vertices.length;
  var normals = new Float32Array(vertexLength);
  if (indices) {
    var normalLength = vertexLength / 3;
    var newNormals = [];
    for (var n = 0; n < normalLength; n++) newNormals[n] = new Vector();
    for (var i = 0, length = indices.length; i < length; i += 3) {
      var i1 = indices[i],
        i2 = indices[i + 1],
        i3 = indices[i + 2];
      var normal = this.calculateNormal(vertices, i1 * 3, i2 * 3, i3 * 3);
      newNormals[i1].add(normal);
      newNormals[i2].add(normal);
      newNormals[i3].add(normal);
    }
    for (var n = 0, v = 0; n < normalLength; n++, v += 3) {
      var normal = newNormals[n];
      normals[v] = normal.x;
      normals[v + 1] = normal.y;
      normals[v + 2] = normal.z;
    }
  } else {
    for (var i = 0; i < vertexLength; i += 6) {
      var normal = this.calculateNormal(vertices, i, i + 3, i + 6);
      normals[i] = normals[i + 3] = normal.x;
      normals[i + 1] = normals[i + 4] = normal.y;
      normals[i + 2] = normals[i + 5] = normal.z;
    }
    normals[vertexLength - 3] = normals[vertexLength - 6];
    normals[vertexLength - 2] = normals[vertexLength - 5];
    normals[vertexLength - 1] = normals[vertexLength - 4];
  }
  return normals;
};

//Calculates a normal based on three vertices
Model.prototype.calculateNormal = function(vertices, i1, i2, i3) {
  var p1 = new Vector(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]),
    p2 = new Vector(vertices[i2], vertices[i2 + 1], vertices[i2 + 2]),
    p3 = new Vector(vertices[i3], vertices[i3 + 1], vertices[i3 + 2]);
  var u = new Vector(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z),
    v = new Vector(p3.x - p1.x, p3.y - p1.y, p3.z - p1.z);
  var x = u.y * v.z - u.z * v.y,
    y = u.z * v.x - u.x * v.z,
    z = u.x * v.y - u.y * v.x;
  //Scale to a length of 1
  var length = Math.sqrt(x * x + y * y + z * z);
  x /= length;
  y /= length;
  z /= length;
  return new Vector(x, y, z);
};

//Saves a subdivided mesh of the model (Works on triangles only!)
Model.prototype.subdivide = function(iterations) {
  //Subdivide mesh
  if (iterations >= this.cachedSubdivisionData.length) {
    var singleEdgeVertexWeight = 0.5,
      doubleEdgeVertexWeight = 3 / 8,
      adjacentVertexWeight = 1 / 8;
    for (var s = this.cachedSubdivisionData.length; s <= iterations; s++) {
      var mesh = this.cachedSubdivisionData[s - 1],
        indexMap = {};
      var originalIndexCount = mesh.indices.length,
        originalVertexCount = mesh.vertices.length / 3;
      var subdividedVertices = [],
        neighbouringVerticies = [],
        subdividedIndices = new Uint16Array(originalIndexCount * 4);
      //Copy original verticies
      for (var i = 0; i < originalVertexCount; i++) {
        neighbouringVerticies[i] = {};
        var v = i * 3;
        subdividedVertices[v] = mesh.vertices[v];
        subdividedVertices[v + 1] = mesh.vertices[v + 1];
        subdividedVertices[v + 2] = mesh.vertices[v + 2];
      }
      //Save neighbouring verticies
      for (var i = 0; i < originalIndexCount; i += 3) {
        var i0 = mesh.indices[i],
          i1 = mesh.indices[i + 1],
          i2 = mesh.indices[i + 2];
        var vertex0Neighbours = neighbouringVerticies[i0],
          vertex1Neighbours = neighbouringVerticies[i1],
          vertex2Neighbours = neighbouringVerticies[i2];
        vertex0Neighbours[i1] = vertex0Neighbours[i2] = vertex1Neighbours[i0] = vertex1Neighbours[
          i2
        ] = vertex2Neighbours[i0] = vertex2Neighbours[i1] = true;
      }
      for (var i = 0; i < originalIndexCount; i += 3) {
        var i0 = mesh.indices[i],
          i1 = mesh.indices[i + 1],
          i2 = mesh.indices[i + 2];
        var vertex0Neighbours = neighbouringVerticies[i0],
          vertex1Neighbours = neighbouringVerticies[i1],
          vertex2Neighbours = neighbouringVerticies[i2];
        var i30 = i0 * 3,
          i31 = i1 * 3,
          i32 = i2 * 3;
        var v0x = mesh.vertices[i30],
          v0y = mesh.vertices[i30 + 1],
          v0z = mesh.vertices[i30 + 2],
          v1x = mesh.vertices[i31],
          v1y = mesh.vertices[i31 + 1],
          v1z = mesh.vertices[i31 + 2],
          v2x = mesh.vertices[i32],
          v2y = mesh.vertices[i32 + 1],
          v2z = mesh.vertices[i32 + 2];
        //Add subdivided vertices
        var vertex0Name = i0 < i1 ? i0 + '_' + i1 : i1 + '_' + i0,
          vertex1Name = i1 < i2 ? i1 + '_' + i2 : i2 + '_' + i1,
          vertex2Name = i2 < i0 ? i2 + '_' + i0 : i0 + '_' + i2;
        var v0 = indexMap[vertex0Name],
          v1 = indexMap[vertex1Name],
          v2 = indexMap[vertex2Name];
        //If the vertex is already in the map it has already been added
        if (!v0) {
          indexMap[vertex0Name] = v0 = subdividedVertices.length / 3;
          //Find adjacent vertex
          var adjacent, x, y, z;
          for (var key in vertex0Neighbours) {
            if (key != i2 && vertex1Neighbours[key]) {
              adjacent = key * 3;
              break;
            }
          }
          if (adjacent != null) {
            x =
              (v0x + v1x) * doubleEdgeVertexWeight +
              (mesh.vertices[adjacent] + v2x) * adjacentVertexWeight;
            y =
              (v0y + v1y) * doubleEdgeVertexWeight +
              (mesh.vertices[adjacent + 1] + v2y) * adjacentVertexWeight;
            z =
              (v0z + v1z) * doubleEdgeVertexWeight +
              (mesh.vertices[adjacent + 2] + v2z) * adjacentVertexWeight;
          } else {
            x = (v0x + v1x) * singleEdgeVertexWeight;
            y = (v0y + v1y) * singleEdgeVertexWeight;
            z = (v0z + v1z) * singleEdgeVertexWeight;
          }
          subdividedVertices.push(x, y, z);
        }
        if (!v1) {
          indexMap[vertex1Name] = v1 = subdividedVertices.length / 3;
          //Find adjacent vertex
          var adjacent, x, y, z;
          for (var key in vertex1Neighbours) {
            if (key != i0 && vertex2Neighbours[key]) {
              adjacent = key * 3;
              break;
            }
          }
          if (adjacent != null) {
            x =
              (v1x + v2x) * doubleEdgeVertexWeight +
              (mesh.vertices[adjacent] + v0x) * adjacentVertexWeight;
            y =
              (v1y + v2y) * doubleEdgeVertexWeight +
              (mesh.vertices[adjacent + 1] + v0y) * adjacentVertexWeight;
            z =
              (v1z + v2z) * doubleEdgeVertexWeight +
              (mesh.vertices[adjacent + 2] + v0z) * adjacentVertexWeight;
          } else {
            x = (v1x + v2x) * singleEdgeVertexWeight;
            y = (v1y + v2y) * singleEdgeVertexWeight;
            z = (v1z + v2z) * singleEdgeVertexWeight;
          }
          subdividedVertices.push(x, y, z);
        }
        if (!v2) {
          indexMap[vertex2Name] = v2 = subdividedVertices.length / 3;
          //Find adjacent vertex
          var adjacent, x, y, z;
          for (var key in vertex2Neighbours) {
            if (key != i1 && vertex0Neighbours[key]) {
              adjacent = key * 3;
              break;
            }
          }
          if (adjacent != null) {
            x =
              (v2x + v0x) * doubleEdgeVertexWeight +
              (mesh.vertices[adjacent] + v1x) * adjacentVertexWeight;
            y =
              (v2y + v0y) * doubleEdgeVertexWeight +
              (mesh.vertices[adjacent + 1] + v1y) * adjacentVertexWeight;
            z =
              (v2z + v0z) * doubleEdgeVertexWeight +
              (mesh.vertices[adjacent + 2] + v1z) * adjacentVertexWeight;
          } else {
            x = (v2x + v0x) * singleEdgeVertexWeight;
            y = (v2y + v0y) * singleEdgeVertexWeight;
            z = (v2z + v0z) * singleEdgeVertexWeight;
          }
          subdividedVertices.push(x, y, z);
        }
        //Add subdivided indices
        var a = i * 4;
        subdividedIndices[a] = i0;
        subdividedIndices[a + 1] = v0;
        subdividedIndices[a + 2] = v2;
        subdividedIndices[a + 3] = v0;
        subdividedIndices[a + 4] = i1;
        subdividedIndices[a + 5] = v1;
        subdividedIndices[a + 6] = v2;
        subdividedIndices[a + 7] = v1;
        subdividedIndices[a + 8] = i2;
        subdividedIndices[a + 9] = v0;
        subdividedIndices[a + 10] = v1;
        subdividedIndices[a + 11] = v2;
      }
      //Reposition the original vertices to smooth the model
      for (var v = 0; v < originalVertexCount; v++) {
        var neighbours = neighbouringVerticies[v],
          count = 0,
          otherX = 0,
          otherY = 0,
          otherZ = 0;
        for (var key in neighbours) {
          var index = key * 3;
          otherX += mesh.vertices[index];
          otherY += mesh.vertices[index + 1];
          otherZ += mesh.vertices[index + 2];
          count++;
        }
        //Get vertex weights
        var sourceVertexWeight, connectingVertexWeight;
        if (count == 2) {
          //Not sure what's going on here (was count == 3)...
          //connectingVertexWeight = 0.1875;
          //sourceVertexWeight = 0.4375;
          sourceVertexWeight = 0.75;
          connectingVertexWeight = 0.125;
        } else {
          connectingVertexWeight = 3 / (8 * count);
          sourceVertexWeight = 0.625;
        }
        var i = v * 3;
        subdividedVertices[i] =
          subdividedVertices[i] * sourceVertexWeight + otherX * connectingVertexWeight;
        subdividedVertices[i + 1] =
          subdividedVertices[i + 1] * sourceVertexWeight + otherY * connectingVertexWeight;
        subdividedVertices[i + 2] =
          subdividedVertices[i + 2] * sourceVertexWeight + otherZ * connectingVertexWeight;
      }
      //Store the subdivisions
      var vertices = new Float32Array(subdividedVertices);
      this.cachedSubdivisionData[s] = {
        vertices: vertices,
        indices: subdividedIndices,
        normals: this.calculateNormals(vertices, subdividedIndices),
      };
    }
  }
  //Apply subdivision
  var subdivision = this.cachedSubdivisionData[iterations];
  this.subdivisions = iterations;
  this.vertices = subdivision.vertices;
  this.vertexCount = this.vertices.length / 3;
  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
  this.indices = subdivision.indices;
  this.indexCount = this.indices.length;
  this.indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
  this.normals = subdivision.normals;
  this.normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
  //if(this.wireframe) this.createWireframeBuffers();
  //Colours
  var oldColours = this.colours;
  this.colours = new Float32Array(this.vertexCount * 4);
  for (var i = 0, length = this.vertexCount * 4; i < length; i++) {
    this.colours[i] = oldColours[i % 4];
  }
  this.colourBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.colours, gl.STATIC_DRAW);
};

//Creates the buffers containing the wireframe mesh (only works for triangles!)
Model.prototype.createWireframeBuffers = function() {
  this.wireframeVertexBuffer = this.vertexBuffer;
  this.wireframeVertexCount = this.vertexCount;
  if (this.indexBuffer) {
    var indexLength = this.indices.length;
    this.wireframeIndexCount = indexLength * 2;
    this.wireframeIndices = new Uint16Array(this.wireframeIndexCount);
    for (var i = 0, w = 0; i < indexLength; i += 3, w += 6) {
      this.wireframeIndices[w] = this.wireframeIndices[w + 5] = this.indices[i];
      this.wireframeIndices[w + 1] = this.wireframeIndices[w + 2] = this.indices[i + 1];
      this.wireframeIndices[w + 3] = this.wireframeIndices[w + 4] = this.indices[i + 2];
    }
  } else {
    this.wireframeIndexCount = this.vertexCount * 2;
    this.wireframeIndices = new Uint16Array(this.wireframeIndexCount);
    for (var i = 0, w = 0; i < this.vertexCount; i += 3, w += 6) {
      this.wireframeIndices[w] = this.wireframeIndices[w + 5] = i;
      this.wireframeIndices[w + 1] = this.wireframeIndices[w + 2] = i + 1;
      this.wireframeIndices[w + 3] = this.wireframeIndices[w + 4] = i + 2;
    }
  }
  this.wireframeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireframeIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.wireframeIndices, gl.STATIC_DRAW);
};
