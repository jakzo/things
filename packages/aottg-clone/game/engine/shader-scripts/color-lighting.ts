import { shader } from './shader-script';

export const colourLightingVertex = shader`
  attribute vec3 aVertexPosition;
  attribute vec3 aVertexNormal;
  attribute vec4 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uPerspectiveMatrix;
  uniform mat3 uNormalMatrix;

  uniform vec3 uAmbientColour;
  uniform vec3 uLightingDirection;
  uniform vec3 uLightingDirectionColour;
  uniform vec3 uPointLighting;
  uniform vec3 uPointLightingColour;

  varying vec4 vColour;
  varying vec3 vLightWeighting;

  void main(void) {
    vec4 modelViewPosition = uModelViewMatrix * vec4(aVertexPosition, 1.0);
    gl_Position = uPerspectiveMatrix * modelViewPosition;
    vColour = aVertexColor;

    # Calculate light weighting
    vec3 transformedNormal = uNormalMatrix * aVertexNormal;
    float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
    vec3 pointLightDirection = normalize(uPointLighting - modelViewPosition.xyz);
    float pointLightWeighting = max(dot(transformedNormal, pointLightDirection), 0.0);
    vLightWeighting =
      uAmbientColour + uLightingDirectionColour * directionalLightWeighting +
      uPointLightingColour * pointLightWeighting;
  }
`;

export const colourLightingFragment = shader`
  #ifdef GL_ES
  precision highp float;
  #endif

  varying vec4 vColour;
  varying vec3 vLightWeighting;

  void main(void) {
    gl_FragColor = vec4(vColour.rgb * vLightWeighting, vColour.a);
  }
`;
