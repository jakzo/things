/*
 * RENDER
 */

import { createProjection, Matrix4 } from './matrix';

var Render = {
  canvas: null, //Canvas DOM element
  scene: null, //Main scene
  camera: {
    //Main camera
    position: new Vector(0, 0, 0),
    lookAtPoint: new Vector(0, 0, 0),
    yaw: 0,
    pitch: 0,
    radius: CAMERA_RADIUS,
  },

  currentShader: null, //The shader program currently being used
  currentBlend: false, //Blend enabled
  currentDepth: false, //Depth test enabled

  perspectiveMatrix: null, //Provides perspective information

  touchControls: null, //Touch interface DOM elements
  models: [], //Every loaded model
  time: 0, //Time of last frame
  relevent: [], //Every object that is currently of importance
};

Render.render = function(elapsed) {
  Statistic.start('render');

  /* Render the scene */

  //Clear the colour and depth buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Create the model view matrix
  var lookAtCharacterY = 2;
  var offsetX = Render.camera.radius * Math.sin(Render.camera.yaw) * Math.cos(Render.camera.pitch);
  var offsetY = Render.camera.radius * Math.sin(Render.camera.pitch) + lookAtCharacterY;
  var offsetZ = Render.camera.radius * Math.cos(Render.camera.yaw) * Math.cos(Render.camera.pitch);
  Render.camera.position.x = character.position.x + offsetX;
  Render.camera.position.y = Math.max(character.position.y + offsetY, 0.1);
  Render.camera.position.z = character.position.z + offsetZ;
  Render.camera.lookAtPoint.x = character.position.x;
  Render.camera.lookAtPoint.y = character.position.y + lookAtCharacterY;
  Render.camera.lookAtPoint.z = character.position.z;
  var viewMatrix = Matrix4.lookAt(Render.camera.position, Render.camera.lookAtPoint);
  var modelViewMatrix = new Matrix4();

  //Set up lighting
  var ambientLight = new AmbientLight(0.4, 0.4, 0.4);
  var sunlight = new DirectionalLight(0.5, 0.5, 0.5, 0.4, 0.4, 0.4);
  var pointLight = new PointLight(
    Render.camera.position.x,
    Render.camera.position.y,
    Render.camera.position.z,
    0,
    0,
    0,
  );

  /* Render each model */

  //Add each mesh to the scene
  var models = Model.models;
  for (var i in models) {
    var model = models[i];

    //Check if the model is visible
    if (!model.visible) continue;

    /* Put the position of the object into the model view matrix */

    modelViewMatrix.push();
    modelViewMatrix.multiply(viewMatrix);
    var translationMatrix = new Matrix4();
    translationMatrix.translate(model.position);
    modelViewMatrix.multiply(translationMatrix);
    var rotationMatrix = new Matrix4();
    rotationMatrix.rotate(model.rotation);
    modelViewMatrix.multiply(rotationMatrix);
    //TODO: Full transformation matrix...

    //Select appropriate shader
    //TODO: Test performance of switching shaders...
    var shader = Shaders.basic;
    if (model.texture) {
      if (Settings.LIGHTING_DIRECTIONAL) shader = Shaders.textureLighting;
      else shader = Shaders.basicTexture;
    } else if (model.colourBuffer) {
      if (Settings.LIGHTING_DIRECTIONAL) shader = Shaders.colourLighting;
      else shader = Shaders.basicColour;
    }
    Render.useShader(shader);

    /* Specify the location and matrices of the shader variables */

    //Set shader attributes
    if (shader.locations.aVertexPosition != null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
      gl.vertexAttribPointer(shader.locations.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
    }
    if (shader.locations.aVertexNormal != null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
      gl.vertexAttribPointer(shader.locations.aVertexNormal, 3, gl.FLOAT, false, 0, 0);
    }
    if (shader.locations.aVertexColor != null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, model.colourBuffer);
      gl.vertexAttribPointer(shader.locations.aVertexColor, 4, gl.FLOAT, false, 0, 0);
    }
    if (shader.locations.aTextureCoordinate != null) {
      gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
      gl.vertexAttribPointer(shader.locations.aTextureCoordinate, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, model.texture);
      gl.uniform1i(shader.locations.uSampler, 0);
    }

    //Set shader uniforms
    /*
        if(shader.locations.uAlpha) {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.enable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
            gl.uniform1f(shader.locations.uAlpha, model.alpha);
        }
        else {
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
        }
        */
    if (shader.locations.uAmbientColour) {
      gl.uniform3f(shader.locations.uAmbientColour, ambientLight.r, ambientLight.g, ambientLight.b);
    }
    if (shader.locations.uLightingDirection) {
      gl.uniform3f(shader.locations.uLightingDirection, sunlight.x, sunlight.y, sunlight.z);
      gl.uniform3f(shader.locations.uLightingDirectionColour, sunlight.r, sunlight.g, sunlight.b);
    }
    if (shader.locations.uPointLighting) {
      //Make the point relative to the camera
      //TODO: Figure out why this is a bit off...
      gl.uniform3f(
        shader.locations.uPointLighting,
        pointLight.x - Render.camera.position.x,
        pointLight.y - Render.camera.position.y,
        pointLight.z - Render.camera.position.z,
      );
      gl.uniform3f(shader.locations.uPointLightingColour, pointLight.r, pointLight.g, pointLight.b);
    }
    if (shader.locations.uNormalMatrix) {
      var normalMatrix = modelViewMatrix.invert3();
      normalMatrix.transpose();
      gl.uniformMatrix3fv(shader.locations.uNormalMatrix, false, normalMatrix.value);
    }
    if (shader.locations.uPerspectiveMatrix) {
      gl.uniformMatrix4fv(
        shader.locations.uPerspectiveMatrix,
        false,
        Render.perspectiveMatrix.value,
      );
    }
    if (shader.locations.uModelViewMatrix) {
      gl.uniformMatrix4fv(shader.locations.uModelViewMatrix, false, modelViewMatrix.value);
    }

    //Draw the model to the vertex buffer
    if (model.indexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
      gl.drawElements(model.type, model.indices.length, gl.UNSIGNED_SHORT, 0);
    } else gl.drawArrays(model.type, 0, model.vertexCount);

    //Draw the wireframe
    if (model.wireframe) {
      Render.useShader(Shaders.wireframe);
      gl.bindBuffer(gl.ARRAY_BUFFER, model.wireframeVertexBuffer);
      gl.vertexAttribPointer(Shaders.wireframe.locations.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(
        Shaders.wireframe.locations.uPerspectiveMatrix,
        false,
        Render.perspectiveMatrix.value,
      );
      gl.uniformMatrix4fv(
        Shaders.wireframe.locations.uModelViewMatrix,
        false,
        modelViewMatrix.value,
      );
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.wireframeIndexBuffer);
      gl.drawElements(gl.LINES, model.wireframeIndexCount, gl.UNSIGNED_SHORT, 0);
    }
    modelViewMatrix.pop();
  }

  Statistic.end('render');

  //Display the statistics
  Statistic.update();
};

Render.useShader = function(shader) {
  if (Render.currentShader != shader) {
    gl.useProgram(shader.program);
    //Enable/disable extra attributes
    var newAttributeCount = shader.attributes.length,
      oldAttributeCount = Render.currentShader ? Render.currentShader.attributes.length : 0;
    for (var a = newAttributeCount; a < oldAttributeCount; a++) {
      gl.disableVertexAttribArray(a);
    }
    for (var a = oldAttributeCount; a < newAttributeCount; a++) {
      gl.enableVertexAttribArray(a);
    }
    Render.currentShader = shader;
  }
};

export interface RendererOpts {
  /**
   * Canvas element to render the game within.
   *
   * Cannot be updated.
   */
  canvas: HTMLCanvasElement;
  /**
   * Angle of the viewing frustum that defines the amount of visible space.
   *
   * Call `onResize()` after updating.
   */
  fieldOfView: number;
  /**
   * Minimum distance from the camera for an object to be rendered.
   *
   * Call `onResize()` after updating.
   */
  nearPlane: number;
  /**
   * Maximum distance from the camera for an object to be rendered.
   *
   * Call `onResize()` after updating.
   */
  farPlane: number;
  /**
   * Game screen width in pixels. You will probably want to set this to `canvas.clientWidth`.
   *
   * Call `onResize()` after updating.
   */
  width: number;
  /**
   * Game screen height in pixels. You will probably want to set this to `canvas.clientHeight`.
   *
   * Call `onResize()` after updating.
   */
  height: number;
}

export interface Renderer extends RendererOpts {}
export class Renderer {
  /** WebGL rendering context of the `canvas`. */
  gl: WebGLRenderingContext;
  /** Perspective matrix used by the camera. */
  perspectiveMatrix: Matrix4;

  constructor({
    canvas = document.createElement('canvas'),
    fieldOfView = Math.PI / 4,
    nearPlane = 0.01,
    farPlane = 500,
    width = 640,
    height = 360,
  }: Partial<RendererOpts>) {
    this.canvas = canvas;
    this.fieldOfView = fieldOfView;
    this.nearPlane = nearPlane;
    this.farPlane = farPlane;

    this.initWebGl();
    this.onResize(width, height);
  }

  private initWebGl() {
    const gl = this.canvas.getContext('webgl');
    if (!gl) throw new Error('Could not load WebGL');

    gl.clearColor(0, 0, 0, 1); // set background to black
    gl.enable(gl.DEPTH_TEST); // enable depth testing to decide what appears on top
    gl.enable(gl.CULL_FACE); // enable culling of back faces

    // These already default to correct values
    // gl.clearDepth(1); // default value for faces in depth buffer
    // gl.depthFunc(gl.LEQUAL); // comparison to decide closer face

    this.gl = gl;
  }

  getAspectRatio() {
    return this.width / this.height;
  }

  /** Call when changing the size of the canvas to render at new size. */
  onResize(width: number, height: number) {
    this.width = width;
    this.height = height;

    // Set the canvas dimensions
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.gl.viewport(0, 0, this.width, this.height);

    // Create the projection matrix
    this.perspectiveMatrix = createProjection(
      this.fieldOfView,
      this.getAspectRatio(),
      this.nearPlane,
      this.farPlane,
    );
  }
}
