export class TestScene {
  constructor() {
    // Create the texture image
    var testTextureCanvas = document.createElement('canvas');
    testTextureCanvas.width = testTextureCanvas.height = 128;
    var context = testTextureCanvas.getContext('2d');
    context.fillStyle = '#089';
    context.fillRect(0, 0, 128, 128);
    context.beginPath();
    context.arc(64, 64, 10, 0, 2 * Math.PI);
    context.strokeStyle = '#050';
    context.stroke();
    context.fillStyle = '#005';
    context.fillRect(10, 10, 30, 30);

    //Point light indicator
    Testing.pointLightIndicator = new Model({
      name: 'pointLightIndicator',
      vertices: [-0.1, -0.1, -0.1, 0.1, -0.1, -0.1, 0, -0.1, 0.1, 0, 0.1, 0],
      colours: [1, 0, 0, 1],
      indices: [0, 1, 2, 0, 3, 1, 0, 2, 3, 1, 3, 2],
      position: new Vector(0, 1, 5),
    });

    //Add the triangle model
    Testing.triangle = new Model({
      name: 'triangle',
      vertices: [0, 1, 0, -1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1],
      colours: [1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1],
      indices: [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1, 1, 3, 2, 1, 4, 3],
      position: new Vector(-1.5, 0, 0),
      rotation: new Vector(0.5, 0, 0),
    });

    //Add the square model
    Testing.square = new Model({
      name: 'square',
      vertices: [
        // Front face
        -1.0,
        -1.0,
        1.0,
        1.0,
        -1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        -1.0,
        1.0,
        1.0,

        // Back face
        -1.0,
        -1.0,
        -1.0,
        -1.0,
        1.0,
        -1.0,
        1.0,
        1.0,
        -1.0,
        1.0,
        -1.0,
        -1.0,

        // Top face
        -1.0,
        1.0,
        -1.0,
        -1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        -1.0,

        // Bottom face
        -1.0,
        -1.0,
        -1.0,
        1.0,
        -1.0,
        -1.0,
        1.0,
        -1.0,
        1.0,
        -1.0,
        -1.0,
        1.0,

        // Right face
        1.0,
        -1.0,
        -1.0,
        1.0,
        1.0,
        -1.0,
        1.0,
        1.0,
        1.0,
        1.0,
        -1.0,
        1.0,

        // Left face
        -1.0,
        -1.0,
        -1.0,
        -1.0,
        -1.0,
        1.0,
        -1.0,
        1.0,
        1.0,
        -1.0,
        1.0,
        -1.0,
      ],
      texture: testTextureCanvas,
      textureCoordinates: [
        // Front
        0.0,
        0.0,
        1.0,
        0.0,
        1.0,
        1.0,
        0.0,
        1.0,
        // Back
        0.0,
        0.0,
        1.0,
        0.0,
        1.0,
        1.0,
        0.0,
        1.0,
        // Top
        0.0,
        0.0,
        1.0,
        0.0,
        1.0,
        1.0,
        0.0,
        1.0,
        // Bottom
        0.0,
        0.0,
        1.0,
        0.0,
        1.0,
        1.0,
        0.0,
        1.0,
        // Right
        0.0,
        0.0,
        1.0,
        0.0,
        1.0,
        1.0,
        0.0,
        1.0,
        // Left
        0.0,
        0.0,
        1.0,
        0.0,
        1.0,
        1.0,
        0.0,
        1.0,
      ],
      indices: [
        0,
        1,
        2,
        0,
        2,
        3, // front
        4,
        5,
        6,
        4,
        6,
        7, // back
        8,
        9,
        10,
        8,
        10,
        11, // top
        12,
        13,
        14,
        12,
        14,
        15, // bottom
        16,
        17,
        18,
        16,
        18,
        19, // right
        20,
        21,
        22,
        20,
        22,
        23, // left
      ],
      position: new Vector(1.5, 0, 0),
      rotation: new Vector(0, 1, 0),
    });

    //Add the terrain
    Testing.terrain = new Model({
      name: 'terrain',
      vertices: [-100, 0, -100, -100, 0, 100, 100, 0, -100, 100, 0, 100],
      colours: [0, 1, 0, 1],
      type: Model.types.TRIANGLE_STRIP,
    });

    //Create the character
    character = new Model({
      name: 'character',
      vertices: [
        //Foot base [0 - 3]
        0.1,
        0,
        0.1,
        0.3,
        0,
        0.1,
        0.3,
        0,
        -0.1,
        0.1,
        0,
        -0.1,

        //Leg top [4 - 7]
        0.1,
        0.7,
        0.1,
        0.3,
        0.7,
        0.1,
        0.3,
        0.7,
        -0.1,
        0.1,
        0.7,
        -0.1,

        //Armpit [8 - 9]
        0.3,
        1.3,
        0.1,
        0.3,
        1.3,
        -0.1,

        //Hand [10 - 13]
        0.8,
        1.3,
        0.1,
        0.8,
        1.5,
        0.1,
        0.8,
        1.5,
        -0.1,
        0.8,
        1.3,
        -0.1,

        //Shoulder [14 - 15]
        0.4,
        1.5,
        0.1,
        0.4,
        1.5,
        -0.1,

        //Neck [16 - 17]
        0.1,
        1.5,
        0.1,
        0.1,
        1.5,
        -0.1,

        //Head top [18 - 19]
        0.1,
        1.8,
        0.1,
        0.1,
        1.8,
        -0.1,
      ],
      colours: [0.9, 0.5, 0, 1],
      indices: [
        //Foot base
        2,
        1,
        0,
        0,
        3,
        2,

        //Leg front, right, back, left
        1,
        4,
        0,
        1,
        5,
        4,
        2,
        5,
        1,
        2,
        6,
        5,
        3,
        6,
        2,
        3,
        7,
        6,
        0,
        7,
        3,
        0,
        4,
        7,

        //Crotch
        7,
        4,
        24,
        24,
        27,
        7,

        //Torso side
        5,
        6,
        8,
        9,
        8,
        6,

        //Torso front
        5,
        8,
        4,
        4,
        8,
        28,
        4,
        28,
        24,

        //Torso back
        7,
        9,
        6,
        9,
        7,
        29,
        7,
        27,
        29,

        //Chest front
        8,
        14,
        16,
        8,
        16,
        28,
        16,
        36,
        28,

        //Chest back
        9,
        17,
        15,
        9,
        29,
        17,
        17,
        29,
        37,

        //Arm front, top, back, bottom
        10,
        14,
        8,
        11,
        14,
        10,
        14,
        11,
        12,
        15,
        14,
        12,
        15,
        12,
        13,
        15,
        13,
        9,
        9,
        13,
        10,
        9,
        10,
        8,

        //Hand
        11,
        10,
        12,
        12,
        10,
        13,

        //Shoulder
        14,
        15,
        16,
        15,
        17,
        16,

        //Head side
        16,
        17,
        18,
        17,
        19,
        18,

        //Head front, back, top
        16,
        18,
        36,
        18,
        38,
        36,
        19,
        17,
        37,
        19,
        37,
        39,
        18,
        19,
        38,
        19,
        39,
        38,
      ],
      position: new Vector(0, 0, 5),
      rotation: new Vector(0, Math.PI, 0),
      wireframe: false,
      subdivisions: 3,
      symmetrical: true,
    });
  }

  onAnimate(elapsedSecs: number) {
    // Rotate test objects
    this.square.rotate(0, elapsedSecs, elapsedSecs / 10);
    this.triangle.rotate(0, 0, elapsedSecs);
    // this.square.position.z += elapsedSecs / 10;
  }
}
