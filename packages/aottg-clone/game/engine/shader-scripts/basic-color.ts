import { shader } from './shader-script';

export const basicColorVertex = shader`
  attribute vec3 aVertexPosition;
  attribute vec4 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uPerspectiveMatrix;

  uniform vec3 uAmbientColour;

  varying vec4 vColour;
  varying vec3 vLightWeighting;

  void main(void) {
    gl_Position = uPerspectiveMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vColour = aVertexColor;
    vLightWeighting = uAmbientColour;
  }
`;

export const basicColorFragment = shader`
  #ifdef GL_ES
  precision highp float;
  #endif

  varying vec4 vColour;
  varying vec3 vLightWeighting;

  void main(void) {
  gl_FragColor = vec4(vColour.rgb * vLightWeighting, vColour.a);
`;
