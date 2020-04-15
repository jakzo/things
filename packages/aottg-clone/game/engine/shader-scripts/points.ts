import { shader } from './shader-script';

export const pointsVertex = shader`
  attribute vec3 aVertexPosition;
  attribute vec4 aVertexColour;

  uniform float uPointSize;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uPerspectiveMatrix;

  varying vec4 vColour;

  void main(void) {
    vColour = aVertexColour;
    gl_PointSize = uPointSize;
    gl_Position = uPerspectiveMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
  }
`;

export const pointsFragment = shader`
  precision mediump float;

  varying vec4 vColour;

  void main(void) {
    gl_FragColor = vColour;
  }
`;
