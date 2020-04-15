import { shader } from './shader-script';

export const basicVertex = shader`
  attribute vec3 aVertexPosition;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uPerspectiveMatrix;

  uniform vec3 uAmbientColour;

  varying vec3 vLightWeighting;

  void main(void) {
    gl_Position = uPerspectiveMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vLightWeighting = uAmbientColour;
  }
`;

export const basicFragment = shader`
  precision mediump float;

  varying vec3 vLightWeighting;

  void main(void) {
    vec4 colour = vec4(0.6, 0.0, 0.0, 1.0);
    gl_FragColor = vec4(colour.rgb * vLightWeighting, colour.a);
  }
`;
