
/*
 * LIGHTING
 */

var AmbientLight = function(r, g, b) {
    //Light colour
    this.r = r;
    this.g = g;
    this.b = b;
};

var DirectionalLight = function(x, y, z, r, g, b) {
    //Direction that the light is coming from (normalised to a length of 1)
    var length = Math.sqrt(x * x + y * y + z * z);
    this.x = x / length;
    this.y = y / length;
    this.z = z / length;
    //Light colour
    this.r = r;
    this.g = g;
    this.b = b;
};

var PointLight = function(x, y, z, r, g, b) {
    //Point the light is coming from
    this.x = x;
    this.y = y;
    this.z = z;
    //Light colour
    this.r = r;
    this.g = g;
    this.b = b;
};
