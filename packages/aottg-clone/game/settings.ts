
/*
 * SETTINGS
 */

var Settings = {};


/*
 * Environment Constants
 *
 * 1 unit = 1 metre
 * m = metre
 * r = radian
 * px = pixel
 * s = second
 */

//The acceleration of gravity (m/s)
Settings.GRAVITY = 9.81;

//The velocity generated from jumping (m/s)
Settings.JUMP_VELOCITY = 10;

//The speed of the character (m/s)
Settings.SPEED = 5;

//The speed that the mouse moves the camera (px/(r/2pi))
Settings.MOUSE_SPEED_X = 0.0075;
Settings.MOUSE_SPEED_Y = 0.005;

//The default distance the camera sits behind the character (m)
Settings.CAMERA_RADIUS = 10;

//The zoom distance that activates FPS mode (m)
Settings.FPS_RADIUS = 0.1;


/* Graphics Settings */

//Sets the texture filters based on how high this number is (0 - 3)
Settings.TEXTURE_FILTER_QUALITY = 3;

//Enables directional lighting in the shaders
Settings.LIGHTING_DIRECTIONAL = true;

//Make the game variables global
for (var name in Settings) window[name] = Settings[name];
