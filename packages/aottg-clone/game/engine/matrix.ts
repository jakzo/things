/**
 * @fileoverview Based on glMatrix.js
 * https://code.google.com/p/glmatrix/source/browse/glMatrix.js
 */

/** 4x4 matrix. */
export type Matrix4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

var Matrix4 = function(initialValue) {
  this.value = new Float32Array(initialValue || Matrix4.identity);
  this.stack = [];
};

//Translates the matrix
Matrix4.prototype.translate = function(vector) {
  this.value[12] += this.value[0] * vector.x + this.value[4] * vector.y + this.value[8] * vector.z;
  this.value[13] += this.value[1] * vector.x + this.value[5] * vector.y + this.value[9] * vector.z;
  this.value[14] += this.value[2] * vector.x + this.value[6] * vector.y + this.value[10] * vector.z;
  this.value[15] += this.value[3] * vector.x + this.value[7] * vector.y + this.value[11] * vector.z;
};

//Translates the inverse of a vector
Matrix4.prototype.translateInverse = function(vector) {
  this.translate(new Vector(-vector.x, -vector.y, -vector.z));
};

//Scales the matrix
Matrix4.prototype.scale = function(vector) {
  this.value[0] *= vector.x;
  this.value[1] *= vector.x;
  this.value[2] *= vector.x;
  this.value[3] *= vector.x;
  this.value[4] *= vector.y;
  this.value[5] *= vector.y;
  this.value[6] *= vector.y;
  this.value[7] *= vector.y;
  this.value[8] *= vector.z;
  this.value[9] *= vector.z;
  this.value[10] *= vector.z;
  this.value[11] *= vector.z;
};

//Multpilies two matrices together
Matrix4.prototype.multiply = function(matrix) {
  //Cache the matrix values
  var a00 = this.value[0],
    a01 = this.value[1],
    a02 = this.value[2],
    a03 = this.value[3],
    a10 = this.value[4],
    a11 = this.value[5],
    a12 = this.value[6],
    a13 = this.value[7],
    a20 = this.value[8],
    a21 = this.value[9],
    a22 = this.value[10],
    a23 = this.value[11],
    a30 = this.value[12],
    a31 = this.value[13],
    a32 = this.value[14],
    a33 = this.value[15],
    b00 = matrix.value[0],
    b01 = matrix.value[1],
    b02 = matrix.value[2],
    b03 = matrix.value[3],
    b10 = matrix.value[4],
    b11 = matrix.value[5],
    b12 = matrix.value[6],
    b13 = matrix.value[7],
    b20 = matrix.value[8],
    b21 = matrix.value[9],
    b22 = matrix.value[10],
    b23 = matrix.value[11],
    b30 = matrix.value[12],
    b31 = matrix.value[13],
    b32 = matrix.value[14],
    b33 = matrix.value[15];

  //Multiply the matrices
  this.value[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
  this.value[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
  this.value[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
  this.value[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
  this.value[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
  this.value[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
  this.value[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
  this.value[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
  this.value[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
  this.value[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
  this.value[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
  this.value[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
  this.value[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
  this.value[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
  this.value[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
  this.value[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
  return this;
};

//Rotates the matrix
Matrix4.prototype.rotate = function(vector) {
  var sineX = Math.sin(vector.x),
    cosineX = Math.cos(vector.x),
    sineY = Math.sin(vector.y),
    cosineY = Math.cos(vector.y),
    sineZ = Math.sin(vector.z),
    cosineZ = Math.cos(vector.z);

  var cosineXcosineZ = cosineX * cosineZ,
    cosineXsineZ = cosineX * sineZ,
    sineXcosineZ = sineX * cosineZ,
    sineXsineZ = sineX * sineZ;

  this.value[0] = cosineY * cosineZ;
  this.value[4] = -cosineY * sineZ;
  this.value[8] = sineY;

  this.value[1] = cosineXsineZ + sineXcosineZ * sineY;
  this.value[5] = cosineXcosineZ - sineXsineZ * sineY;
  this.value[9] = -sineX * cosineY;

  this.value[2] = sineXsineZ - cosineXcosineZ * sineY;
  this.value[6] = sineXcosineZ + cosineXsineZ * sineY;
  this.value[10] = cosineX * cosineY;
};

//Returns a 3x3 matrix of the inverse
Matrix4.prototype.invert3 = function() {
  var a00 = this.value[0],
    a01 = this.value[1],
    a02 = this.value[2],
    a10 = this.value[4],
    a11 = this.value[5],
    a12 = this.value[6],
    a20 = this.value[8],
    a21 = this.value[9],
    a22 = this.value[10];

  var b01 = a22 * a11 - a12 * a21,
    b11 = -a22 * a10 + a12 * a20,
    b21 = a21 * a10 - a11 * a20;
  var d = a00 * b01 + a01 * b11 + a02 * b21;
  var id = 1 / d;

  return new Matrix3([
    b01 * id,
    (-a22 * a01 + a02 * a21) * id,
    (a12 * a01 - a02 * a11) * id,
    b11 * id,
    (a22 * a00 - a02 * a20) * id,
    (-a12 * a00 + a02 * a10) * id,
    b21 * id,
    (-a21 * a00 + a01 * a20) * id,
    (a11 * a00 - a01 * a10) * id,
  ]);
};

//Inverts the matrix
Matrix4.prototype.invert = function() {
  var a00 = this.value[0],
    a01 = this.value[1],
    a02 = this.value[2],
    a03 = this.value[3],
    a10 = this.value[4],
    a11 = this.value[5],
    a12 = this.value[6],
    a13 = this.value[7],
    a20 = this.value[8],
    a21 = this.value[9],
    a22 = this.value[10],
    a23 = this.value[11],
    a30 = this.value[12],
    a31 = this.value[13],
    a32 = this.value[14],
    a33 = this.value[15];

  var b00 = a00 * a11 - a01 * a10,
    b01 = a00 * a12 - a02 * a10,
    b02 = a00 * a13 - a03 * a10,
    b03 = a01 * a12 - a02 * a11,
    b04 = a01 * a13 - a03 * a11,
    b05 = a02 * a13 - a03 * a12,
    b06 = a20 * a31 - a21 * a30,
    b07 = a20 * a32 - a22 * a30,
    b08 = a20 * a33 - a23 * a30,
    b09 = a21 * a32 - a22 * a31,
    b10 = a21 * a33 - a23 * a31,
    b11 = a22 * a33 - a23 * a32;

  var determinant = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);

  this.value[0] = (a11 * b11 - a12 * b10 + a13 * b09) * determinant;
  this.value[1] = (-a01 * b11 + a02 * b10 - a03 * b09) * determinant;
  this.value[2] = (a31 * b05 - a32 * b04 + a33 * b03) * determinant;
  this.value[3] = (-a21 * b05 + a22 * b04 - a23 * b03) * determinant;
  this.value[4] = (-a10 * b11 + a12 * b08 - a13 * b07) * determinant;
  this.value[5] = (a00 * b11 - a02 * b08 + a03 * b07) * determinant;
  this.value[6] = (-a30 * b05 + a32 * b02 - a33 * b01) * determinant;
  this.value[7] = (a20 * b05 - a22 * b02 + a23 * b01) * determinant;
  this.value[8] = (a10 * b10 - a11 * b08 + a13 * b06) * determinant;
  this.value[9] = (-a00 * b10 + a01 * b08 - a03 * b06) * determinant;
  this.value[10] = (a30 * b04 - a31 * b02 + a33 * b00) * determinant;
  this.value[11] = (-a20 * b04 + a21 * b02 - a23 * b00) * determinant;
  this.value[12] = (-a10 * b09 + a11 * b07 - a12 * b06) * determinant;
  this.value[13] = (a00 * b09 - a01 * b07 + a02 * b06) * determinant;
  this.value[14] = (-a30 * b03 + a31 * b01 - a32 * b00) * determinant;
  this.value[15] = (a20 * b03 - a21 * b01 + a22 * b00) * determinant;

  return this;
};

//Multpilies the matrix by a vector (and scales the 4th dimension to 1)
Matrix4.prototype.multiplyVector = function(vector) {
  var x = vector.x,
    y = vector.y,
    z = vector.z;
  var w = this.value[3] * x + this.value[7] * y + this.value[11] * z + this.value[15];
  vector.x = (this.value[0] * x + this.value[4] * y + this.value[8] * z + this.value[12]) / w;
  vector.y = (this.value[1] * x + this.value[5] * y + this.value[9] * z + this.value[13]) / w;
  vector.z = (this.value[2] * x + this.value[6] * y + this.value[10] * z + this.value[14]) / w;
  return vector;
};

// Creates a projection matrix based on the specified dimensions
export const createProjection = (
  fieldOfView: number,
  aspectRatio: number,
  nearPlane: number,
  farPlane: number,
): Matrix4 => {
  // Calculate the clipping planes of the viewing frustum at the near plane
  const top = nearPlane * Math.tan(fieldOfView / 2);
  const bottom = -top;
  const right = top * aspectRatio;
  const left = -right;

  // Calculate the values that make up the perspective matrix
  var a = (right + left) / (right - left);
  var b = (top + bottom) / (top - bottom);
  var c = -(farPlane + nearPlane) / (farPlane - nearPlane);
  var d = -(2 * farPlane * nearPlane) / (farPlane - nearPlane);
  var x = (2 * nearPlane) / (right - left);
  var y = (2 * nearPlane) / (top - bottom);

  //Return the perspective matrix
  return [x, 0, a, 0, 0, y, b, 0, 0, 0, c, -1, 0, 0, d, 0];
};

Matrix4.lookAt = function(eye, center, up) {
  //Get Z
  var zx = eye.x - center.x,
    zy = eye.y - center.y,
    zz = eye.z - center.z;

  //Normalise Z
  var zLength = Math.sqrt(zx * zx + zy * zy + zz * zz);
  if (!zLength) return new Matrix4();
  zx /= zLength;
  zy /= zLength;
  zz /= zLength;

  var xx, xy, xz;
  if (up) {
    //Cross multiply up and Z to get X
    xx = up.y * zz - up.z * zy;
    xy = up.z * zx - up.x * zz;
    xz = up.x * zy - up.y * zx;
  } else {
    xx = zz;
    xy = 0;
    xz = -zx;
  }

  //Normalise X
  var xLength = Math.sqrt(xx * xx + xy * xy + xz * xz);
  if (xLength) {
    xx /= xLength;
    xy /= xLength;
    xz /= xLength;
  }

  //Cross multiply Z and X to get Y
  var yx = zy * xz - zz * xy,
    yy = zz * xx - zx * xz,
    yz = zx * xy - zy * xx;

  //Get eye matrix values
  var eyeX = xx * eye.x + xy * eye.y + xz * eye.z;
  var eyeY = yx * eye.x + yy * eye.y + yz * eye.z;
  var eyeZ = zx * eye.x + zy * eye.y + zz * eye.z;

  //Return the view matrix
  return new Matrix4([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -eyeX, -eyeY, -eyeZ, 1]);
};

//Identity matrix template
Matrix4.identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

//3x3 Matrix
var Matrix3 = function(initialValue) {
  this.value = new Float32Array(initialValue || Matrix3.identity);
  this.stack = [];
};

//Flips the matrix diagonally
Matrix3.prototype.transpose = function() {
  var a01 = this.value[1],
    a02 = this.value[2],
    a12 = this.value[5];
  this.value[1] = this.value[3];
  this.value[2] = this.value[6];
  this.value[3] = a01;
  this.value[5] = this.value[7];
  this.value[6] = a02;
  this.value[7] = a12;
};

//Identity matrix template
Matrix3.identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];

//Pushes/pops the value of the matrix
Matrix3.prototype.push = Matrix4.prototype.push = function() {
  this.stack.push(new Float32Array(this.value));
};
Matrix3.prototype.pop = Matrix4.prototype.pop = function() {
  this.value = this.stack.splice(-1, 1)[0];
};

export abstract class Vec<D extends number> extends Array<number> {
  length: D;

  constructor(...args: number[]) {
    super(...args);
  }

  add(vec: Vec<D>) {
    for (let i = 0; i < this.length; i++) {
      this[i] += vec[i];
    }
    return this;
  }

  subtract(vec: Vec<D>) {
    for (let i = 0; i < this.length; i++) {
      this[i] -= vec[i];
    }
    return this;
  }

  scale(vec: Vec<D>) {
    for (let i = 0; i < this.length; i++) {
      this[i] *= vec[i];
    }
    return this;
  }

  dot(vec: Vec<D>) {
    let dot = 0;
    for (let i = 0; i < this.length; i++) {
      dot += this[i] * vec[i];
    }
    return dot;
  }

  clone() {
    return new (this.constructor as any)(...this);
  }
}

export class Vec2 extends Vec<2> {
  constructor(x: number, y: number) {
    super(x, y);
  }
}

export class Vec3 extends Vec<3> {
  constructor(x: number, y: number, z: number) {
    super(x, y, z);
  }

  crossMultiply(vec: Vec3) {
    this[0] = this[1] * vec[2] - this[2] * vec[1];
    this[1] = this[2] * vec[0] - this[0] * vec[2];
    this[2] = this[0] * vec[1] - this[1] * vec[0];
    for (let i = 0, len = Math.min(this.length, vec.length); i < len; i++) {
      this[i] += vec[i];
    }
    return this;
  }
}

export class Vec4 extends Vec<4> {
  constructor(x: number, y: number, z: number, w: number) {
    super(x, y, z, w);
  }
}

export abstract class VecArray<V extends Vec<number>> extends Array<V> {
  abstract emptyVec: V;

  toFloat32Array() {
    return new Float32Array(
      (function*() {
        for (const vec of this) {
          for (const x of vec) {
            yield x;
          }
        }
      })(),
    );
  }

  getBoundingBox(): [V, V] {
    const firstVec = this.length === 0 ? this.emptyVec : this[0];
    const min = firstVec.clone();
    const max = firstVec.clone();
    for (const v of this) {
      for (let i = 0; i < this.emptyVec.length; i++) {
        if (v[i] < min[i]) min[i] = v[i];
      }
      for (let i = 0; i < this.emptyVec.length; i++) {
        if (v[i] > max[i]) max[i] = v[i];
      }
    }
    return [min, max];
  }
}

export class Vec3Array extends VecArray<Vec3> {
  static fromTuples(...vecs: [number, number, number][]) {
    return new Vec3Array(...vecs.map(v => new Vec3(...v)));
  }

  emptyVec = new Vec3(0, 0, 0);
}

export class Vec4Array extends VecArray<Vec4> {
  static fromTuples(...vecs: [number, number, number, number][]) {
    return new Vec4Array(...vecs.map(v => new Vec4(...v)));
  }

  emptyVec = new Vec4(0, 0, 0, 0);
}
