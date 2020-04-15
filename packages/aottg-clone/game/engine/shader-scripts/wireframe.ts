import { shader } from './shader-script';

export const wireframeVertex = shader`
  attribute vec3 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uPerspectiveMatrix;

  void main(void) {
    gl_Position = uPerspectiveMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
  }
`;

export const wireframeFragment = shader`
  precision mediump float;

  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;
