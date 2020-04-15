/*
 * GAME
 */

import { initRenderer, ContextRender, RendererOpts, Renderer } from './engine/render';
import { Shader } from './engine/shader';
import { basicColorVertex, basicColorFragment } from './shader-scripts/basic-color';
import { initInputManager } from './input';

/*
 * TODO:
 *
 * - GAME -
 * > Port to native WebGL
 * > Make hair transparency work
 * > Load COLLADA meshes
 * > Play animations
 * > Automatically generate meshes based on quadratic bezier curve vertices
 *
 * - PHYSICS -
 * > Form an equation that graphs the object's movement
 * > Find any intersects between object movement equations
 *   + Also find near intersects based on the dimensions of the objects
 * > Check if the objects intersect at the same time
 * > Do a thourough check to find exact collision points on the meshes
 * > Calculate the reactions to collisions
 *   + Types of reactions include:
 *     - (Elastic/Plastic)
 *     - Kinetic
 *     - Deformative
 *     - Destructive
 *   + Factors determining these reactions include:
 *     - Velocity
 *     - Mass
 *     - Angle
 *     - Restitution
 *     - Impact area
 *   + Energy
 *     - Potential Energy
 *       - Elastic
 *       - Chemical
 *       - Gravitational
 *       - Magnetic
 *     - Kinetic Energy
 *       - Heat
 *       - Movement
 *       - Pressure
 * > Calculate positions and angles to place character feet when running
 * > Advanced physics simulations (Atomic scale particles, fluid dynamics, etc.)
 *
 * - INPUT -
 * > Allow multiple devices to be used at once
 * > Allow multiple functions to be assigned to a single control
 */

var Game = {};

//Holds the WebGL context
var gl;

/*
 * PHYSICS
 */

function computePhysics(model, elapsed) {
  Statistic.start('physics');

  //Character movement
  if (model == character) {
    //Get the movement control values
    var movement = {
      straight: Input.keys.down - Input.keys.up,
      side: Input.keys.right - Input.keys.left,
    };

    //Check if we are moving
    if (movement.straight || movement.side) {
      //Find the direction of travel
      var rotation = Math.atan2(movement.side, movement.straight) + Render.camera.yaw;
      var distance = elapsed * SPEED;

      //Find the speed of travel
      var speed = Math.pow(movement.straight, 2) + Math.pow(movement.side, 2);
      if (speed < 1) distance *= Math.sqrt(speed);

      //Move the character
      model.position.x += Math.sin(rotation) * distance;
      model.position.z += Math.cos(rotation) * distance;
      model.rotation.y = rotation;
    }
  }

  //Calculate how far the object has fallen due to gravity
  var timeBefore = model.velocity.y / GRAVITY;
  var offset = GRAVITY * Math.pow(timeBefore, 2) * 0.5;
  var dropped = GRAVITY * Math.pow(timeBefore + elapsed, 2) * 0.5 - offset;
  model.velocity.y = (timeBefore + elapsed) * GRAVITY;

  //Check if the object is colliding with something else below it
  var fallDistance = model.position.y + model.min.y;
  if (fallDistance < dropped) {
    //Check if we need to jump
    if (model == character && Input.keys.jump) {
      character.velocity.y = -JUMP_VELOCITY * Input.keys.jump;
    } else model.velocity.y = 0;

    //Instead of dropping through things, stay at the fall distance
    model.position.y -= fallDistance;
  }

  //Let the object free fall
  else model.position.y -= dropped;

  Statistic.end('physics');
}

/*
 * RENDERING
 */

var character, screenWidth, screenHeight;
var male, female, ground;
var statsDiv;

Hud.container = document.body;

//requestAnimationFrame
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame =
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      setTimeout(callback, 1000 / 60);
    };
}

//requestFullScreen
if (!window.Element.prototype.requestFullScreen) {
  window.Element.prototype.requestFullScreen =
    window.Element.prototype.webkitRequestFullScreen ||
    window.Element.prototype.mozRequestFullScreen ||
    function() {
      return false;
    };
}

//cancelFullScreen
if (!window.Document.prototype.cancelFullScreen) {
  window.Document.prototype.cancelFullScreen =
    window.Document.prototype.webkitCancelFullScreen ||
    window.Document.prototype.mozCancelFullScreen ||
    function() {
      return false;
    };
}

//isFullScreen
if (!document.isFullScreen) {
  document.isFullScreen = function() {
    return document.webkitIsFullScreen || document.mozFullScreen || false;
  };
}

function toggleFullScreen() {
  if (document.isFullScreen()) document.cancelFullScreen();
  else document.body.requestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
}

//Pauses or unpauses the game animation cycle
var gamePaused = false;
function pauseGame() {
  cancelAnimationFrame(animationRequest);
  gamePaused = true;
}
function unpauseGame() {
  if (gamePaused) {
    gamePaused = pausedBecauseHidden = false;
    Render.time = new Date().getTime();
    animate();
  }
}
function togglePause() {
  gamePaused ? unpauseGame() : pauseGame();
}

//Automatically pause when the page loses visibility
var pausedBecauseHidden = false;
document.addEventListener(
  'visibilitychange',
  function(e) {
    if (document.hidden && !gamePaused) {
      pauseGame();
      pausedBecauseHidden = true;
    } else if (pausedBecauseHidden) unpauseGame();
  },
  false,
);

//Calculates and draws the next frame
var animationRequest = null;
function animate() {
  //Request the animation function to be called again for the next frame
  animationRequest = requestAnimationFrame(animate);

  Statistic.start('animate');

  //Calculate how much time has passed since the previous frame
  var now = new Date().getTime();
  var elapsed = (now - Render.time) / 1000;
  Render.time = now;

  Testing.onAnimate(elapsed);

  Input.onAnimate(elapsed);

  for (var model in Render.relevent) {
    model = Render.relevent[model];
    if (model.solid && model.mobile) computePhysics(model, elapsed);
  }

  /*
    //Camera movement
    Rendering.camera.yaw = Math.PI / 4 * -1;
    Rendering.camera.pitch = Math.PI / 2 + Math.PI;
    var sinCamY = Math.sin(Render.cameraY);
    var cosCamY = Math.cos(Render.cameraY);
    var sinCamX = Math.sin(Render.cameraX * 2 - halfPi);
    var cameraPos = Render.camera.position;
    cameraPos.x = character.position.x - sinCamY * Render.cameraRadius + sinCamX * sinCamY * Render.cameraRadius;
    cameraPos.y = character.position.y - (Math.sin(Render.cameraX) * Render.cameraRadius);
    cameraPos.z = character.position.z + cosCamY * Render.cameraRadius + sinCamX * cosCamY * Render.cameraRadius;
    
    //Camera rotation
    Render.camera.rotation.x = -Rendering.cameraX;
    Render.camera.rotation.y = Rendering.cameraY - Math.PI;
    Render.camera.rotation.z = -Math.PI / 4;
    */

  Statistic.end('animate');

  Render.render(elapsed);
}

/*
 * INITIALISATION
 */

var Mesh = {
  /*
   * Every mesh has the following properties:
   * solid    - Whether it physically interacts with the rest of the world
   * mobile   - Whether it can move
   * velocity - The current movement as a vertex in units/second
   * mass     - The mass in kilograms
   */

  //Gives the mesh the properties of a void
  makeVoid: function(mesh) {
    mesh.solid = false;
    mesh.mobile = false;
    mesh.velocity = { x: 0, y: 0, z: 0 };
    mesh.mass = 0;
    mesh.collision = -1;
  },

  //Gives the mesh the properties of an immobile solid
  makeImmobile: function(mesh) {
    mesh.solid = true;
    mesh.mobile = false;
    mesh.velocity = { x: 0, y: 0, z: 0 };
    mesh.mass = 0;
    mesh.collision = THREE.Collisions.colliders.length;
    THREE.Collisions.colliders.push(THREE.CollisionUtils.MeshOBB(mesh));
  },

  //Gives the mesh the properties of a solid
  makeSolid: function(mesh) {
    mesh.solid = true;
    mesh.mobile = true;
    mesh.velocity = { x: 0, y: 0, z: 0 };
    mesh.mass = 0;
    mesh.collision = THREE.Collisions.colliders.length;
    THREE.Collisions.colliders.push(THREE.CollisionUtils.MeshOBB(mesh));
  },
};

var options = {};

function windowResize() {
  Render.resize();
  Input.repositionTouchControls();
}
window.addEventListener('resize', windowResize, false);

function initGame() {
  //Get the passed options
  var optionStart = window.location.href.indexOf('?');
  if (optionStart >= 0) {
    var hashes = window.location.href.slice(optionStart + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
      var hash = hashes[i].split('=');
      if (Game[hash[0]] !== undefined) {
        if (typeof Game[hash[0]] == 'number') hash[1] = +hash[1];
        window[hash[0]] = hash[1];
      }
      Game[hash[0]] = hash[1];
    }
  }

  //Initialise the WebGL renderer
  if (!Render.initialise()) return;

  Shader.initialiseAll();

  Model.initialise();

  Input.initialise();

  Statistic.initialise();
  Statistic.show();

  Edit.initialise();
  Testing.initialise();

  //Start the animation process
  Render.time = new Date().getTime();
  animate();
}

export type GameOpts = RendererOpts;

export class Game {
  renderer: Renderer;
  shaders: {
    basicColor: Shader;
  };
  inputManager: ReturnType<typeof initInputManager>;

  animationRequest: number;
  timeAtLastFrame: number;

  constructor(opts: GameOpts) {
    this.renderer = new Renderer(opts);
    this.shaders = {
      basicColor: new Shader({
        renderer: this.renderer,
        vertexScript: basicColorVertex,
        fragmentScript: basicColorFragment,
      }),
    };
    this.inputManager = initInputManager();
  }

  start() {
    this.animate;
  }

  stop() {
    cancelAnimationFrame(this.animationRequest);
  }

  animate = () => {
    this.animationRequest = requestAnimationFrame(this.animate);

    Statistic.start('animate');

    // Calculate how much time has passed since the previous frame
    const now = window.performance.now();
    const elapsed = now - this.timeAtLastFrame;
    this.timeAtLastFrame = now;

    Testing.onAnimate(elapsed);

    Input.onAnimate(elapsed);

    for (var model in Render.relevent) {
      model = Render.relevent[model];
      if (model.solid && model.mobile) computePhysics(model, elapsed);
    }

    /*
    //Camera movement
    Rendering.camera.yaw = Math.PI / 4 * -1;
    Rendering.camera.pitch = Math.PI / 2 + Math.PI;
    var sinCamY = Math.sin(Render.cameraY);
    var cosCamY = Math.cos(Render.cameraY);
    var sinCamX = Math.sin(Render.cameraX * 2 - halfPi);
    var cameraPos = Render.camera.position;
    cameraPos.x = character.position.x - sinCamY * Render.cameraRadius + sinCamX * sinCamY * Render.cameraRadius;
    cameraPos.y = character.position.y - (Math.sin(Render.cameraX) * Render.cameraRadius);
    cameraPos.z = character.position.z + cosCamY * Render.cameraRadius + sinCamX * cosCamY * Render.cameraRadius;
    
    //Camera rotation
    Render.camera.rotation.x = -Rendering.cameraX;
    Render.camera.rotation.y = Rendering.cameraY - Math.PI;
    Render.camera.rotation.z = -Math.PI / 4;
    */

    Statistic.end('animate');

    Render.render(elapsed);
  };
}
