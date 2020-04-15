import { InputManager, ActionType } from './engine/input-manager';

export const initInputManager = () =>
  new InputManager({
    actions: {
      forward: ActionType.AMOUNT,
      backward: ActionType.AMOUNT,
      left: ActionType.AMOUNT,
      right: ActionType.AMOUNT,
      leftHook: ActionType.DOWN,
      rightHook: ActionType.DOWN,
      reload: ActionType.DOWN,
      jump: ActionType.DOWN,
      gas: ActionType.HOLD,
      reelIn: ActionType.DOWN,
      attackCharge: ActionType.HOLD,
      attack: ActionType.UP,
      reelOut: ActionType.HOLD,
      gasBurst: ActionType.DOWN,
    },
    defaultBindings: {
      keyboardMouse: {
        button: {
          87 /* W */: { forward: true },
          83 /* S */: { backward: true },
          65 /* A */: { left: true },
          68 /* D */: { right: true },
          81 /* Q */: { leftHook: true },
          69 /* E */: { rightHook: true },
          82 /* R */: { reload: true },
          16 /* Shift */: { jump: true, gas: true },
          32 /* Space */: { reelIn: true },
          1 /* Left Click */: { attackCharge: true, attack: true },
          3 /* Right Click */: { reelOut: true },
          2 /* Middle Click */: { gasBurst: true },
        },
        axis: {},
      },
      gamepad: {
        button: {},
        axis: {},
      },
    },
  });

// TODO: Implement extra features and touch controls from here
// var Input = {};

// Input.keys = {
//   //Stores the state of every controller button
//   up: 0,
//   down: 0,
//   left: 0,
//   right: 0,
//   jump: 0,
//   touch: 0,
//   fullscreen: 0,
//   pause: 0,
//   edit: 0,
// };
// Input.devices = {}; //Currently active input devices
// Input.stopEvent = function(e) {
//   e.preventDefault();
// };

// //Defines a type of input controller
// Input.controllers = {};
// Input.Controller = function(name, codes) {
//   Input.controllers[name] = this;
//   this.name = name;
//   //Set up controller keys
//   new Input.Key(this, 'up', codes.up);
//   new Input.Key(this, 'down', codes.down);
//   new Input.Key(this, 'left', codes.left);
//   new Input.Key(this, 'right', codes.right);
//   new Input.Key(this, 'jump', codes.jump);
//   new Input.Key(this, 'touch', codes.touch, Input.toggleTouchControls);
//   new Input.Key(this, 'fullscreen', codes.fullscreen, toggleFullScreen);
//   new Input.Key(this, 'pause', codes.pause, togglePause);
//   new Input.Key(this, 'edit', codes.edit, Edit.enable);
//   //Create a key map
//   this.keyMap = {};
//   for (var keyName in codes) this.keyMap[codes[keyName]] = this[keyName];
// };
// Input.Controller.prototype.set = function(code, value) {
//   if (!Input.devices[this.name]) Input.devices[this.name] = this;
//   var key = this.keyMap[code];
//   if (key) key.set(value);
// };
// //Defines controller keys
// Input.Key = function(controller, name, code, handler) {
//   this.controller = controller;
//   this.name = name;
//   this.code = code;
//   this.value = 0;
//   this.handler = handler;
//   controller[name] = this;
// };
// Input.Key.prototype.set = function(value) {
//   if (this.value == value) return;
//   this.value = value;
//   if (value >= Input.keys[this.name]) Input.keys[this.name] = value;
//   //Check other inputs for the maximum key value
//   else {
//     var maxValue = 0;
//     for (var name in Input.devices) {
//       var controller = Input.devices[name];
//       var controllerValue = controller ? controller[this.name].value : 0;
//       if (controllerValue > maxValue) {
//         maxValue = controller[this.name].value;
//       }
//     }
//     Input.keys[this.name] = maxValue;
//   }
//   if (this.handler && value) this.handler();
// };

// //Keyboard controls
// new Input.Controller('keyboard', {
//   up: 87, //W
//   down: 83, //S
//   left: 65, //A
//   right: 68, //D
//   jump: 32, //(Space)
//   touch: 112, //(F1)
//   fullscreen: 113, //(F2)
//   pause: 114, //(F3)
//   edit: 115, //(F4)
// });
// Input.keyDown = function(e) {
//   Input.stopEvent(e);
//   Input.controllers.keyboard.set(e.keyCode, 1);
// };
// Input.keyUp = function(e) {
//   Input.controllers.keyboard.set(e.keyCode, 0);
// };

// //Mouse controls
// Input.previousMouseX = 0; //X coordinate of the mouse last frame
// Input.previousMouseY = 0; //Y coordinate of the mouse last frame
// Input.mouseX = 0; //Current X coordinate of the mouse
// Input.mouseY = 0; //Current Y coordinate of the mouse
// Input.mouseIsDown = false;
// Input.mouseDown = function(e) {
//   Input.stopEvent(e);
//   if (e.button) return;
//   Input.mouseIsDown = true;
//   Input.previousMouseX = Input.mouseX = e.pageX;
//   Input.previousMouseY = Input.mouseY = e.pageY;
// };
// Input.mouseMoved = function(e) {
//   if (Input.mouseIsDown) {
//     Input.mouseX = e.pageX;
//     Input.mouseY = e.pageY;
//   }
// };
// Input.mouseUp = function(e) {
//   Input.stopEvent(e);
//   Input.mouseIsDown = false;
// };
// Input.mouseScrolled = function(e) {
//   Input.stopEvent(e);
//   var zoom = e.wheelDelta / 100;
//   Render.camera.radius = Math.max(Render.camera.radius - zoom, FPS_RADIUS);
//   character.visible = Render.camera.radius == FPS_RADIUS ? false : true;
// };

// //Touch controls
// new Input.Controller('touch', {
//   up: 'touchMoveUp',
//   down: 'touchMoveDown',
//   left: 'touchMoveLeft',
//   right: 'touchMoveRight',
//   jump: 'undefined',
// });

// Input.noTouch = false; //Stops a touch event from enabling touch controls
// Input.touches = []; //List of current ongoing touches
// Input.touchMove = {
//   //Current touch information for the move control
//   id: -1,
//   x: 0,
//   y: 0,
//   size: 0,
// };
// Input.touchCamera = {
//   //Current touch information for the camera control
//   id: -1,
//   x: 0,
//   y: 0,
//   size: 0,
//   deltaX: 0,
//   deltaY: 0,
// };
// Input.touchJump = {
//   //Current touch information for the jump control
//   id: -1,
//   x: 0,
//   y: 0,
//   width: 0,
//   height: 0,
// };

// //Enables and disables the touch interface
// Input.enableTouchControls = function() {
//   Input.devices.touch = Input.controllers.touch;
//   document.body.appendChild(Input.touchControls.container);
//   Input.mouseX = screenWidth * 0.5;
//   Input.mouseY = screenHeight * 0.5;
//   document.body.requestFullScreen();
// };
// Input.disableTouchControls = function() {
//   Input.devices.touch = null;
//   document.body.removeChild(Input.touchControls.container);
//   Input.mouseX = screenWidth * 0.5;
//   Input.mouseY = screenHeight * 0.5;
// };
// Input.toggleTouchControls = function() {
//   if (Input.devices.touch) Input.disableTouchControls();
//   else Input.enableTouchControls();
// };

// Input.calculateTouchCamera = function(touch) {
//   var halfSize = Input.touchCamera.size * 0.5;
//   var x = (Input.touchCamera.x + halfSize - touch.pageX) / halfSize;
//   var y = (Input.touchCamera.y + halfSize - touch.pageY) / halfSize;
//   Input.touchCamera.deltaX = Math.min(x, 1) * 800;
//   Input.touchCamera.deltaY = Math.min(y, 1) * 500;
// };

// Input.calculateTouchMove = function(touch) {
//   var size = Input.touchMove.size * 0.5;
//   var offset = Input.touchMove.y + size - touch.pageY;
//   Input.keys['touchMoveUp'] = offset > 0 ? offset / size : 0;
//   offset = touch.pageY - (Input.touchMove.y + size);
//   Input.keys['touchMoveDown'] = offset > 0 ? offset / size : 0;
//   offset = Input.touchMove.x + size - touch.pageX;
//   Input.keys['touchMoveLeft'] = offset > 0 ? offset / size : 0;
//   offset = touch.pageX - (Input.touchMove.x + size);
//   Input.keys['touchMoveRight'] = offset > 0 ? offset / size : 0;
// };

// Input.inTouchBounds = function(touch, bounds) {
//   var height,
//     width,
//     id = bounds.id;
//   if (!bounds.size) {
//     height = bounds.height;
//     width = bounds.width;
//   } else height = width = bounds.size;
//   return (
//     touch.pageX > bounds.x &&
//     touch.pageX < bounds.x + width &&
//     touch.pageY > bounds.y &&
//     touch.pageY < bounds.y + height &&
//     id < 0
//   );
// };

// Input.touchStarted = function(e) {
//   Input.stopEvent(e);
//   if (Input.noTouch) return;
//   for (var i in e.changedTouches) {
//     var touch = e.changedTouches[i];
//     if (!Input.devices.touch) {
//       Input.devices.touch = true;
//       Input.enableTouchControls();
//     } else if (Input.inTouchBounds(touch, Input.touchMove)) {
//       Input.touchMove.id = touch.identifier;
//       Input.calculateTouchMove(touch);
//     } else if (Input.inTouchBounds(touch, Input.touchCamera)) {
//       Input.touchCamera.id = touch.identifier;
//       Input.calculateTouchCamera(touch);
//     } else if (Input.inTouchBounds(touch, Input.touchJump)) {
//       Input.jump = true;
//     }
//   }
// };

// Input.touchMoved = function(e) {
//   Input.stopEvent(e);
//   for (var i in e.changedTouches) {
//     var touch = e.changedTouches[i];
//     if (touch.identifier == Input.touchMove.id) {
//       Input.calculateTouchMove(touch);
//     } else if (touch.identifier == Input.touchCamera.id) {
//       Input.calculateTouchCamera(touch);
//     }
//   }
// };

// Input.touchEnded = function(e) {
//   Input.stopEvent(e);
//   for (var i in e.changedTouches) {
//     var touch = e.changedTouches[i];
//     if (touch.identifier == Input.touchMove.id) {
//       Input.touchMove.id = -1;
//       Input.keys['touchMoveUp'] = Input.keys['touchMoveDown'] = 0;
//       Input.keys['touchMoveLeft'] = Input.keys['touchMoveRight'] = 0;
//     } else if (touch.identifier == Input.touchCamera.id) {
//       Input.touchCamera.id = -1;
//       Input.touchCamera.deltaX = Input.touchCamera.deltaY = 0;
//     }
//   }
// };

// Input.onAnimate = function(elapsed) {
//   //Rotate camera pitch
//   var touchDeltaY = Input.touchCamera.deltaY * elapsed;
//   var deltaY = Input.previousMouseY - Input.mouseY + touchDeltaY;
//   var maxRotationX = Math.PI * 0.49,
//     pitch = Render.camera.pitch - deltaY * MOUSE_SPEED_Y;
//   if (pitch > maxRotationX) Render.camera.pitch = maxRotationX;
//   else if (pitch < -maxRotationX) Render.camera.pitch = -maxRotationX;
//   else Render.camera.pitch = pitch;
//   //Rotate camera yaw
//   var touchDeltaX = Input.touchCamera.deltaX * elapsed;
//   var deltaX = Input.previousMouseX - Input.mouseX + touchDeltaX;
//   var yaw = Render.camera.yaw + deltaX * MOUSE_SPEED_X;
//   Render.camera.yaw = yaw % (Math.PI * 2);
//   //Reset input values
//   Input.previousMouseX = Input.mouseX;
//   Input.previousMouseY = Input.mouseY;
// };

// Input.repositionTouchControls = function() {
//   var screenSize = screenWidth < screenHeight ? screenWidth : screenHeight;
//   var div = Input.touchControls.container;
//   div.style.width = screenWidth + 'px';
//   div.style.height = screenHeight + 'px';
//   div.style.fontSize = screenSize * 0.08 + 'px';
//   var divMove = Input.touchControls.movement;
//   Input.touchMove.size = screenSize * 0.4;
//   Input.touchMove.x = 20;
//   Input.touchMove.y = screenHeight - Input.touchMove.size - screenSize * 0.025;
//   divMove.style.left = Input.touchMove.x + 'px';
//   divMove.style.top = Input.touchMove.y + 'px';
//   divMove.style.width = divMove.style.height = divMove.style.lineHeight =
//     Input.touchMove.size + 'px';
//   var divCamera = Input.touchControls.camera;
//   Input.touchCamera.size = Input.touchMove.size;
//   Input.touchCamera.x = screenWidth - Input.touchCamera.size - screenSize * 0.025;
//   Input.touchCamera.y = screenHeight - Input.touchCamera.size - screenSize * 0.025;
//   divCamera.style.left = Input.touchCamera.x + 'px';
//   divCamera.style.top = Input.touchCamera.y + 'px';
//   divCamera.style.width = divCamera.style.height = divCamera.style.lineHeight =
//     Input.touchCamera.size + 'px';
//   var divJump = Input.touchControls.jump;
//   Input.touchJump.width = Input.touchCamera.size;
//   Input.touchJump.height = Input.touchJump.width * 0.5;
//   Input.touchJump.x = Input.touchCamera.x;
//   Input.touchJump.y = Input.touchCamera.y - Input.touchJump.height - 20;
//   divJump.style.left = Input.touchJump.x + 'px';
//   divJump.style.top = Input.touchJump.y + 'px';
//   divJump.style.width = Input.touchJump.width + 'px';
//   divJump.style.height = divJump.style.lineHeight = Input.touchJump.height + 'px';
// };

// Input.initialise = function() {
//   //Add touch controls
//   var div = document.createElement('DIV');
//   div.id = 'TouchContainer';
//   div.style.position = 'absolute';
//   div.style.top = div.style.left = '0px';
//   div.style.fontFamily = 'Arial, Helvetica, sans-serif';
//   div.style.color = '#FFF';
//   div.style.textAlign = 'center';
//   div.style.cursor = 'default';
//   var divMove = document.createElement('DIV');
//   divMove.id = 'TouchMove';
//   divMove.style.position = 'absolute';
//   divMove.style.backgroundColor = '#CFC';
//   divMove.style.opacity = '0.5';
//   divMove.innerHTML = 'Movement';
//   div.appendChild(divMove);
//   var divCamera = document.createElement('DIV');
//   divCamera.id = 'TouchCamera';
//   divCamera.style.position = 'absolute';
//   divCamera.style.backgroundColor = '#CCF';
//   divCamera.style.opacity = '0.5';
//   divCamera.innerHTML = 'Camera';
//   div.appendChild(divCamera);
//   var divJump = document.createElement('DIV');
//   divJump.id = 'TouchJump';
//   divJump.style.position = 'absolute';
//   divJump.style.backgroundColor = '#FCC';
//   divJump.style.opacity = '0.5';
//   divJump.innerHTML = 'Jump';
//   div.appendChild(divJump);
//   Input.touchControls = {
//     container: div,
//     movement: divMove,
//     camera: divCamera,
//     jump: divJump,
//   };
//   Input.repositionTouchControls();

//   //Initialise controller buttons
//   for (var controller in Input.controllers) {
//     var device = Input.controllers[controller];
//     for (var key in device) Input.keys[device[key]] = 0;
//   }

//   Input.enable();
// };

// //Enables and disables the handling of input
// Input.enabled = false;
// Input.enable = function() {
//   if (Input.enabled) return;
//   //Register input events
//   window.addEventListener('mousedown', Input.mouseDown, false);
//   window.addEventListener('mouseup', Input.mouseUp, false);
//   window.addEventListener('contextmenu', Input.stopEvent, false);
//   window.addEventListener('mousemove', Input.mouseMoved, false);
//   window.addEventListener('wheel', Input.mouseScrolled, false);
//   window.addEventListener('keydown', Input.keyDown, false);
//   window.addEventListener('keyup', Input.keyUp, false);
//   window.addEventListener('touchstart', Input.touchStarted, false);
//   window.addEventListener('touchmove', Input.touchMoved, false);
//   window.addEventListener('touchend', Input.touchEnded, false);
//   window.addEventListener('touchcancel', Input.touchEnded, false);
//   window.addEventListener('touchleave', Input.touchEnded, false);
//   Input.enabled = true;
// };
// Input.disable = function() {
//   if (!Input.enabled) return;
//   //Unregister input events
//   window.removeEventListener('mousedown', Input.mouseDown, false);
//   window.removeEventListener('mouseup', Input.mouseUp, false);
//   window.removeEventListener('contextmenu', Input.stopEvent, false);
//   window.removeEventListener('mousemove', Input.mouseMoved, false);
//   window.removeEventListener('wheel', Input.mouseScrolled, false);
//   window.removeEventListener('keydown', Input.keyDown, false);
//   window.removeEventListener('keyup', Input.keyUp, false);
//   window.removeEventListener('touchstart', Input.touchStarted, false);
//   window.removeEventListener('touchmove', Input.touchMoved, false);
//   window.removeEventListener('touchend', Input.touchEnded, false);
//   window.removeEventListener('touchcancel', Input.touchEnded, false);
//   window.removeEventListener('touchleave', Input.touchEnded, false);
//   Input.enabled = false;
// };
