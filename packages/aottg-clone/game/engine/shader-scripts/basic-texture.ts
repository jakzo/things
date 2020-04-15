import { shader } from './shader-script';

export const basicTextureVertex = shader`
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoordinate;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uPerspectiveMatrix;

  uniform vec3 uAmbientColour;

  varying vec2 vTextureCoordinate;
  varying vec3 vLightWeighting;

  void main(void) {
    gl_Position = uPerspectiveMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoordinate = aTextureCoordinate;
    vLightWeighting = uAmbientColour;
  }
`;

export const basicTextureFragment = shader`
  #ifdef GL_ES
  precision highp float;
  #endif

  varying vec2 vTextureCoordinate;
  varying vec3 vLightWeighting;

  uniform sampler2D uSampler;

  void main(void) {
    vec4 textureColour = texture2D(uSampler, vec2(vTextureCoordinate.s, vTextureCoordinate.t));
    gl_FragColor = vec4(textureColour.rgb * vLightWeighting, textureColour.a);
  }
`;
