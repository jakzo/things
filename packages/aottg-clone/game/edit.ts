//Allows editing the mesh of the character
var Edit = {
    editingCharacter: false,
    editingSubdivisions: 5,
    previousSubdivisions: 0,
    vertexColours: [],
    vertexColourBuffer: null
};

Edit.enable = function() {
    Edit.editingCharacter = true;
    //Set up character model
    Edit.previousSubdivisions = character.subdivisions;
    character.subdivide(0);
    character.wireframe = true;
    character.createWireframeBuffers();
    character.subdivide(Edit.editingSubdivisions);
    //Set up input
    Input.disable();
    Render.canvas.addEventListener('contextmenu', Edit.stopEvent, false);
    window.addEventListener('keydown', Edit.keyDown, false);
    window.addEventListener('keyup', Edit.keyUp, false);
    Render.canvas.addEventListener('mousedown', Edit.mouseDown, false);
    window.addEventListener('mousemove', Edit.mouseMove, false);
    window.addEventListener('mouseup', Edit.mouseUp, false);
    window.addEventListener('wheel', Edit.scroll, false);
    Edit.showControls();
    Edit.controls.mirrorToggle.checked = character.mirrored;
    //Set up rendering
    if(!gamePaused) pauseGame();
    Statistic.hide();
    Edit.createVertexColours();
    Edit.render();
    Edit.initialiseVertexScreenCoordinates();
    Edit.calculateVertexScreenCoordinates();
};

Edit.disable = function() {
    Edit.editingCharacter = false;
    cancelAnimationFrame(Edit.animationRequest);
    //Reset character model
    character.subdivide(Edit.previousSubdivisions);
    character.wireframe = false;
    //Reset input
    Render.canvas.removeEventListener('contextmenu', Edit.stopEvent, false);
    window.removeEventListener('keydown', Edit.keyDown, false);
    window.removeEventListener('keyup', Edit.keyUp, false);
    Render.canvas.removeEventListener('mousedown', Edit.mouseDown, false);
    window.removeEventListener('mousemove', Edit.mouseMove, false);
    window.removeEventListener('mouseup', Edit.mouseUp, false);
    window.removeEventListener('wheel', Edit.scroll, false);
    Input.enable();
    Edit.hideControls();
    //Reset rendering
    unpauseGame();
    Statistic.show();
};

Edit.stopEvent = function(e) { e.preventDefault(); };

Edit.controlIsDown = false;
Edit.shiftIsDown = false;
Edit.keyDown = function(e) {
    if(e.keyCode == 17) Edit.controlIsDown = true;      //CTRL
    else if(e.keyCode == 16) Edit.shiftIsDown = true;   //SHIFT
    else if(e.keyCode == 115) Edit.disable();           //F4
    else if(e.keyCode == 90 && e.ctrlKey) Edit.undo();  //CTRL-Z
    else if(e.keyCode == 89 && e.ctrlKey) Edit.redo();  //CTRL-Y
    else if(e.keyCode == 90) Edit.lockAxis("x", true);  //Z
    else if(e.keyCode == 88) Edit.lockAxis("y", true);  //X
    else if(e.keyCode == 67) Edit.lockAxis("z", true);  //C
    else if(e.keyCode == 65) Edit.newVertex();          //A
    else if(e.keyCode == 76) {                          //L
        var checkbox = Edit.controls.meshViewToggle;
        checkbox.checked = !checkbox.checked;
    }
    else if(e.keyCode == 77) {                          //M
        Edit.mirror(!Edit.controls.mirrorToggle.checked);
    }
};
Edit.keyUp = function(e) {
    if(e.keyCode == 17) Edit.controlIsDown = false;
    else if(e.keyCode == 16) Edit.shiftIsDown = false;
    else if(e.keyCode == 90) Edit.lockAxis("x", false);
    else if(e.keyCode == 88) Edit.lockAxis("y", false);
    else if(e.keyCode == 67 && !e.ctrlKey) Edit.lockAxis("z", false);
};

//Mouse input
Edit.cursorMode = "select";
Edit.selectionBox = document.createElement("DIV");
Edit.selectionBox.style.backgroundColor = "rgba(150, 150, 255, 0.25)";
Edit.selectionBox.style.border = "rgba(150, 150, 255, 0.5) 1px dashed";
Edit.selectionBox.style.position = "absolute";
Edit.selectedVertices = [];
Edit.selecting = false;
Edit.movingCamera = false;
Edit.movingVertices = false;
Edit.originalMousePosition = { x: 0, y: 0 };
Edit.previousMousePosition = { x: 0, y: 0 };
Edit.mouseDown = function(e) {
    e.preventDefault();
    Edit.originalMousePosition.x = e.pageX;
    Edit.originalMousePosition.y = e.pageY;
    Edit.previousMousePosition.x = e.pageX;
    Edit.previousMousePosition.y = e.pageY;
    if(e.button == 0) {
        if(Edit.cursorMode == "select") {
            Edit.selecting = true;
            //Make sure already selected vertices stay selected if shift is down
            if(Edit.shiftIsDown) {
                Edit.getSelectedVertices();
                for(var v = 0; v < Edit.selectedVertices.length; v++) {
                    var index = Edit.selectedVertices[v];
                    Edit.vertexScreenCoordinates[index].locked = true;
                }
            }
            Edit.mouseMove(e);
            document.body.appendChild(Edit.selectionBox);
        }
        else if(Edit.cursorMode == "add") {
            var result = Edit.getSelectedEdge();
            //TODO: Complete this...
        }
    }
    else if(e.button == 1) Edit.movingCamera = true;
    else if(e.button == 2) {
        Edit.movingVertices = true;
        Edit.getSelectedVertices();
    }
};
Edit.mouseMove = function(e) {
    if(Edit.movingCamera) {
        var deltaX = e.pageX - Edit.previousMousePosition.x,
            deltaY = e.pageY - Edit.previousMousePosition.y;
        if(Edit.controlIsDown) {
            var movement = Edit.mouseMovement3D(deltaX, deltaY);
            Edit.camera.lookAtPoint.x -= movement.x;
            Edit.camera.lookAtPoint.y -= movement.y;
            Edit.camera.lookAtPoint.z -= movement.z;
        }
        else {
            Edit.camera.yaw -= deltaX * 0.01;
            Edit.camera.pitch += deltaY * 0.01;
            var halfPI = Math.PI * 0.49;
            if(Edit.camera.pitch > halfPI) Edit.camera.pitch = halfPI;
            else if(Edit.camera.pitch < -halfPI) Edit.camera.pitch = -halfPI;
        }
        Edit.previousMousePosition.x = e.pageX;
        Edit.previousMousePosition.y = e.pageY;
    }
    else if(Edit.movingVertices) {
        var deltaX = e.pageX - Edit.previousMousePosition.x,
            deltaY = e.pageY - Edit.previousMousePosition.y;
        var vertexMovement = Edit.mouseMovement3D(deltaX, deltaY);
        var vertices = character.originalVertices;
        var length = Edit.selectedVertices.length;
        for(var v = 0; v < length; v++) {
            var index = Edit.selectedVertices[v] * 3;
            if(Edit.locked.x) vertices[index] += vertexMovement.x;
            if(Edit.locked.y) vertices[index + 1] += vertexMovement.y;
            if(Edit.locked.z) vertices[index + 2] += vertexMovement.z;
        }
        Edit.redrawBuffers = true;
        Edit.previousMousePosition.x = e.pageX;
        Edit.previousMousePosition.y = e.pageY;
    }
    else if(Edit.selecting) {
        var left = Math.min(e.pageX, Edit.previousMousePosition.x),
            top = Math.min(e.pageY, Edit.previousMousePosition.y);
        var width = Math.max(e.pageX, Edit.previousMousePosition.x) - left,
            height = Math.max(e.pageY, Edit.previousMousePosition.y) - top;
        Edit.selectionBox.style.left = left + "px";
        Edit.selectionBox.style.top = top + "px";
        Edit.selectionBox.style.width = width + "px";
        Edit.selectionBox.style.height = height + "px";
        Edit.setSelectedVertexColours(left, top, width, height);
    }
    else if(Edit.cursorMode == "add") {
    }
};
Edit.mouseUp = function(e) {
    if(Edit.movingCamera) {
        Edit.movingCamera = false;
        Edit.calculateVertexScreenCoordinates();
    }
    else if(Edit.movingVertices) {
        var deltaX = e.pageX - Edit.originalMousePosition.x,
            deltaY = e.pageY - Edit.originalMousePosition.y;
        var vertexMovement = Edit.mouseMovement3D(deltaX, deltaY);
        var x = Edit.locked.x ? vertexMovement.x : 0,
            y = Edit.locked.y ? vertexMovement.y : 0,
            z = Edit.locked.z ? vertexMovement.z : 0;
        if(x || y || z) Edit.meshChanged({
            type: "move",
            selectedVertices: Edit.selectedVertices,
            x: x, y: y, z: z
        }, true);
        Edit.movingVertices = false;
    }
    else if(Edit.selecting) {
        document.body.removeChild(Edit.selectionBox);
        Edit.selecting = false;
        //Unlock shift-locked vertices
        Edit.getSelectedVertices();
        for(var v = 0; v < Edit.selectedVertices.length; v++) {
            var index = Edit.selectedVertices[v];
            Edit.vertexScreenCoordinates[index].locked = false;
        }
    }
};
Edit.scroll = function(e) {
    e.preventDefault();
    Edit.camera.radius *= 1 - e.wheelDeltaY * 0.001;
};

//Returns 2D mouse movement as a 3D vector relative to the camera
Edit.mouseMovement3D = function(x, y) {
    var moveSpeed = 0.001 * Edit.camera.radius;
    return new Vector(
        y * moveSpeed *
            Math.sin(Edit.camera.yaw) * Math.sin(Edit.camera.pitch) +
            x * moveSpeed * Math.cos(Edit.camera.yaw),
        y * -moveSpeed * Math.cos(Edit.camera.pitch),
        x * -moveSpeed * Math.sin(Edit.camera.yaw) + y * moveSpeed *
            Math.cos(Edit.camera.yaw) * Math.sin(Edit.camera.pitch)
    );
};

//Sets the colours of each vertex within certain bounds
Edit.setSelectedVertexColours = function(x, y, width, height) {
    var vertexCount = Edit.vertexScreenCoordinates.length, changed = false;
    for(var v = 0; v < vertexCount; v++) {
        var vertexCoordinates = Edit.vertexScreenCoordinates[v];
        if(vertexCoordinates.y >= y && vertexCoordinates.y <= y + height &&
                vertexCoordinates.x >= x && vertexCoordinates.x <= x + width) {
            //Set the colour to green because it is in the selection bounds
            var c = v * 4;
            Edit.vertexColours[c] = Edit.vertexColours[c + 2] = 0;
            Edit.vertexColours[c + 1] = Edit.vertexColours[c + 3] = 1;
            vertexCoordinates.selected = true;
            changed = true;
        }
        else if(vertexCoordinates.selected && !vertexCoordinates.locked) {
            //Change back to red after leaving the selection bounds
            vertexCoordinates.selected = false;
            var c = v * 4;
            Edit.vertexColours[c + 1] = Edit.vertexColours[c + 2] = 0;
            Edit.vertexColours[c] = Edit.vertexColours[c + 3] = 1;
            changed = true;
        }
    }
    //Update the vertex colour buffer with the changed colours
    if(changed) {
        gl.bindBuffer(gl.ARRAY_BUFFER, Edit.vertexColourBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, Edit.vertexColours, gl.STATIC_DRAW);
    }
};

//Gets a list of the currently selected vertices
Edit.getSelectedVertices = function() {
    Edit.selectedVertices = [];
    var vertexCount = Edit.vertexScreenCoordinates.length;
    for(var v = 0; v < vertexCount; v++) {
        if(Edit.vertexScreenCoordinates[v].selected) {
            Edit.selectedVertices.push(v);
        }
    }
};

//Returns the edge currently selected by the mouse
Edit.getSelectedEdge = function() {
    var x = Edit.originalMousePosition.x, y = Edit.originalMousePosition.y;
    var position = Edit.camera.position.clone().add(character.position),
        direction = Edit.unproject(x, y, 0).subtract(Edit.camera.position);
    var intersection = RayCast.check(character, position, direction);
    //Find the closest edge
    //TODO: Finish this...
    //var angle0 = 
};

//Converts screen coordinates to world coordinates
// 'x' and 'y' are the 2D screen coordinates
// 'z' should be between 0 and 1, 0 being the near plane and 1 the far plane
Edit.unproject = function(x, y, z) {
    var pickerMatrix = new Matrix4(Render.perspectiveMatrix.value);
    pickerMatrix.multiply(Edit.camera.viewMatrix).invert();
    var coordinates = new Vector(
        x / screenWidth * 2 - 1,
        y / screenHeight * -2 + 1,
        z * 2 - 1
    );
    return pickerMatrix.multiplyVector(coordinates);
};

//Calculates the screen position of each vertex for use while selecting
Edit.vertexScreenCoordinates = [];
Edit.initialiseVertexScreenCoordinates = function() {
    Edit.vertexScreenCoordinates = [];
    var vertexCount = character.originalVertices.length / 3;
    for(var v = 0; v < vertexCount; v++) {
        Edit.vertexScreenCoordinates[v] = {
            x: 0,
            y: 0,
            selected: false,
            locked: false
        };
    }
};
Edit.calculateVertexScreenCoordinates = function() {
    var vertices = character.originalVertices,
        projectionModelViewMatrix = new Matrix4(Render.perspectiveMatrix.value);
    projectionModelViewMatrix.multiply(Edit.camera.viewMatrix);
    for(var v = 0, vertexLength = vertices.length; v < vertexLength; v += 3) {
        var point = new Vector(vertices[v], vertices[v + 1], vertices[v + 2]);
        projectionModelViewMatrix.multiplyVector(point);
        var coordinates = Edit.vertexScreenCoordinates[v / 3];
        coordinates.x = Math.round((point.x + 1) / 2 * screenWidth);
        coordinates.y = Math.round((1 - point.y) / 2 * screenHeight);
    }
};

//Undo/Redo mechanism
Edit.undoStackSize = 50;
Edit.undoStackPosition = 0;
Edit.undoStack = [];
Edit.meshChanged = function(change, doNotExecute) {
    Edit.undoStack[Edit.undoStackPosition++] = change;
    Edit.undoStack.splice(Edit.undoStackPosition, Edit.undoStackSize);
    if(Edit.undoStackPosition > Edit.undoStackSize) {
        Edit.undoStackPosition--;
        Edit.undoStack.splice(0, 1);
    }
    if(!doNotExecute) Edit.executeMeshChange(change);
    Edit.redrawMesh();
};
Edit.undo = function() {
    if(!Edit.undoStackPosition) return;
    var change = Edit.undoStack[--Edit.undoStackPosition];
    Edit.executeMeshChange(change, true);
    Edit.redrawMesh();
};
Edit.redo = function() {
    var change = Edit.undoStack[Edit.undoStackPosition];
    if(change) {
        Edit.undoStackPosition++;
        Edit.executeMeshChange(change);
        Edit.redrawMesh();
    }
};
Edit.executeMeshChange = function(change, invert) {
    if(change.type == "move") {
        var vertices = character.originalVertices,
            length = change.selectedVertices.length;
        for(var v = 0; v < length; v++) {
            var index = change.selectedVertices[v] * 3;
            vertices[index] += invert ? -change.x : change.x;
            vertices[index + 1] += invert ? -change.y : change.y;
            vertices[index + 2] += invert ? -change.z : change.z;
        }
    }
    Edit.redrawMesh();
};
Edit.redrawMesh = function(redrawWireframe) {
    var length = character.cachedSubdivisionData.length;
    character.cachedSubdivisionData = [ character.cachedSubdivisionData[0] ];
    if(redrawWireframe) {
        character.subdivide(0);
        character.createWireframeBuffers();
        Edit.createVertexColours();
    }
    character.subdivide(Edit.editingSubdivisions);
    Edit.calculateVertexScreenCoordinates();
    Edit.redrawBuffers = true;
};

//Rendering
Edit.redrawBuffers = false;
Edit.camera = {
    lookAtPoint: { x: 0, y: 0, z: 0 },
    viewMatrix: null,
    position: null,
    pitch: 0,
    yaw: 0,
    radius: 10
};
Edit.render = function() {

    //Request the next animation frame
    Edit.animationRequest = requestAnimationFrame(Edit.render);

    if(Edit.redrawBuffers) {
        var vertices = character.originalVertices;
        gl.bindBuffer(gl.ARRAY_BUFFER, character.wireframeVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        Edit.redrawBuffers = false;
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    //Calculate camera position and view matrix
    Edit.camera.position.x = Edit.camera.lookAtPoint.x + Edit.camera.radius *
        Math.sin(Edit.camera.yaw) * Math.cos(Edit.camera.pitch);
    Edit.camera.position.y = Edit.camera.lookAtPoint.y + Edit.camera.radius *
        Math.sin(Edit.camera.pitch);
    Edit.camera.position.z = Edit.camera.lookAtPoint.z + Edit.camera.radius *
        Math.cos(Edit.camera.yaw) * Math.cos(Edit.camera.pitch);
    Edit.camera.viewMatrix = Matrix4.lookAt(Edit.camera.position,
        Edit.camera.lookAtPoint);
    
    //Set up lighting
    var ambientLight = new AmbientLight(0.4, 0.4, 0.4);
    var sunlight = new DirectionalLight(0.5, 0.5, 0.5, 0.4, 0.4, 0.4);
    var pointLight = new PointLight(
        Edit.camera.position.x,
        Edit.camera.position.y,
        Edit.camera.position.z,
        0, 0, 0
    );

    //Select appropriate shader
    var model = character;
    var shader = Shaders.basic;
    if(model.texture) {
        if(Settings.LIGHTING_DIRECTIONAL) shader = Shaders.textureLighting;
        else shader = Shaders.basicTexture;
    }
    else if(model.colourBuffer) {
        if(Settings.LIGHTING_DIRECTIONAL) shader = Shaders.colourLighting;
        else shader = Shaders.basicColour;
    }
    Render.useShader(Shaders.colourLighting);


    /* Specify the location and matrices of the shader variables */

    //Set shader attributes
    if(shader.locations.aVertexPosition != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
        gl.vertexAttribPointer(shader.locations.aVertexPosition, 3,
            gl.FLOAT, false, 0, 0);
    }
    if(shader.locations.aVertexNormal != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
        gl.vertexAttribPointer(shader.locations.aVertexNormal, 3,
            gl.FLOAT, false, 0, 0);
    }
    if(shader.locations.aVertexColor != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, model.colourBuffer);
        gl.vertexAttribPointer(shader.locations.aVertexColor, 4, gl.FLOAT,
            false, 0, 0);
    }
    if(shader.locations.aTextureCoordinate != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, model.textureBuffer);
        gl.vertexAttribPointer(shader.locations.aTextureCoordinate, 2,
            gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, model.texture);
        gl.uniform1i(shader.locations.uSampler, 0);
    }

    //Set shader uniforms
    if(shader.locations.uAmbientColour) {
        gl.uniform3f(shader.locations.uAmbientColour,
            ambientLight.r, ambientLight.g, ambientLight.b);
    }
    if(shader.locations.uLightingDirection) {
        gl.uniform3f(shader.locations.uLightingDirection,
            sunlight.x, sunlight.y, sunlight.z);
        gl.uniform3f(shader.locations.uLightingDirectionColour,
            sunlight.r, sunlight.g, sunlight.b);
    }
    if(shader.locations.uPointLighting) {
        //Make the point relative to the camera
        //TODO: Figure out why this is a bit off...
        gl.uniform3f(shader.locations.uPointLighting,
            pointLight.x - Render.camera.position.x,
            pointLight.y - Render.camera.position.y,
            pointLight.z - Render.camera.position.z
        );
        gl.uniform3f(shader.locations.uPointLightingColour,
            pointLight.r, pointLight.g, pointLight.b);
    }
    if(shader.locations.uNormalMatrix) {
        var normalMatrix = Edit.camera.viewMatrix.invert3();
        normalMatrix.transpose();
        gl.uniformMatrix3fv(shader.locations.uNormalMatrix, false,
            normalMatrix.value);
    }
    if(shader.locations.uPerspectiveMatrix) {
        gl.uniformMatrix4fv(shader.locations.uPerspectiveMatrix, false,
            Render.perspectiveMatrix.value);
    }
    if(shader.locations.uModelViewMatrix) {
        gl.uniformMatrix4fv(shader.locations.uModelViewMatrix, false,
            Edit.camera.viewMatrix.value);
    }

    //Draw the model to the vertex buffer
    if(model.indexBuffer) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
        gl.drawElements(model.type, model.indices.length,
            gl.UNSIGNED_SHORT, 0);
    }
    else gl.drawArrays(model.type, 0, model.vertexCount);

    //Draw the wireframe
    if(model.wireframe) {
        Render.useShader(Shaders.wireframe);
        gl.bindBuffer(gl.ARRAY_BUFFER, model.wireframeVertexBuffer);
        gl.vertexAttribPointer(Shaders.wireframe.locations.aVertexPosition,
            3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(Shaders.wireframe.locations.uPerspectiveMatrix,
            false, Render.perspectiveMatrix.value);
        gl.uniformMatrix4fv(Shaders.wireframe.locations.uModelViewMatrix,
            false, Edit.camera.viewMatrix.value);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.wireframeIndexBuffer);
        gl.drawElements(gl.LINES, model.wireframeIndexCount,
            gl.UNSIGNED_SHORT, 0);

        //Draw the vertices
        Render.useShader(Shaders.points);
        gl.bindBuffer(gl.ARRAY_BUFFER, model.wireframeVertexBuffer);
        gl.vertexAttribPointer(Shaders.points.locations.aVertexPosition,
            3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, Edit.vertexColourBuffer);
        gl.vertexAttribPointer(Shaders.points.locations.aVertexColour,
            4, gl.FLOAT, false, 0, 0);
        gl.uniform1f(Shaders.points.locations.uPointSize, 8);
        gl.uniformMatrix4fv(Shaders.points.locations.uPerspectiveMatrix,
            false, Render.perspectiveMatrix.value);
        gl.uniformMatrix4fv(Shaders.points.locations.uModelViewMatrix,
            false, Edit.camera.viewMatrix.value);
        gl.drawArrays(gl.POINTS, 0, model.wireframeVertexCount);
    }
};

//Initialises vertex colours and creates the buffer
Edit.createVertexColours = function() {
    var vertexLength = character.originalVertices.length;
    var vertexCount = vertexLength / 3;
    Edit.vertexColours = new Float32Array(vertexCount * 4);
    for(var v = 0, c = 0; v < vertexLength; v += 3, c += 4) {
        Edit.vertexColours[c] = Edit.vertexColours[c + 3] = 1;
        //Edit.vertexColours[c + 1] = Edit.vertexColours[c + 2] = 0;
    }
    Edit.vertexColourBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, Edit.vertexColourBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, Edit.vertexColours, gl.STATIC_DRAW);
};

//Create editing control box
Edit.controls = {};
Edit.showControls = function() {
    document.body.appendChild(Edit.controls.box);
};
Edit.hideControls = function() {
    document.body.removeChild(Edit.controls.box);
};

//Axis locking
Edit.locked = { x: false, y: false, z: false };
Edit.lockAxis = function(axis, value) {
    Edit.controls.lockBoxes[axis].checked = value;
    Edit.locked[axis] = value;
};

//Vertex adding
Edit.newVertex = function() {
    
    /*

    Faces:
    0: [ 0, 1, 2 ]
    1: [ 0, 2, 3 ]
    2: [ 4, 1, 0 ]
    3: [ 4, 2, 1 ]
    4: [ 4, 3, 2 ]
    5: [ 4, 0, 3 ]

    Vertices:
    0: [ -1, 0,  2 ]
    1: [ -1, 0, -1 ]
    2: [  1, 0, -1 ]
    3: [  1, 0,  2 ]
    4: [  0, 1,  0 ]

    */

    //Get the edge we are adding the vertex to
    Edit.getSelectedVertices();
    if(Edit.selectedVertices.length != 2) return;
    var vertices = character.originalVertices,
        indices = character.originalIndices,
        va = Edit.selectedVertices[0], // selected vertex 1
        vb = Edit.selectedVertices[1], // selected vertex 2
        adjacentFaces = [];
    
    //Adds the vertex indices of a face to the list of adjacent faces
    function saveFace(index, offsetA, offsetB) {
        var offsetC = 3 - offsetA - offsetB;
        adjacentFaces.push({
            index: index,
            offsetA: offsetA,
            offsetB: offsetB,
            offsetC: offsetC,
            vc: indices[index + offsetC]
        });
    }

    //Get the adjacent faces
    for(var i = 0, indexCount = indices.length; i < indexCount; i += 3) {
        var v0 = indices[i], v1 = indices[i + 1], v2 = indices[i + 2];

        //Save the indices of adjacent faces
        if(v0 == va && v1 == vb) saveFace(i, 0, 1);
        else if(v0 == va && v2 == vb) saveFace(i, 0, 2);
        else if(v1 == va && v0 == vb) saveFace(i, 1, 0);
        else if(v1 == va && v2 == vb) saveFace(i, 1, 2);
        else if(v2 == va && v0 == vb) saveFace(i, 2, 0);
        else if(v2 == va && v1 == vb) saveFace(i, 2, 1);
        else continue;

        //Finish searching once we have two adjacent faces
        if(adjacentFaces.length >= 2) break;
    }

    //Add the new vertex halfway between vertex A and B
    var nv = vertices.length;
    var newVertices = new Float32Array(nv + 3),
        newVertex = nv / 3,
        ia = va * 3,
        ib = vb * 3;
    newVertices.set(vertices);
    newVertices[nv] = (vertices[ia] + vertices[ib]) / 2;
    newVertices[nv + 1] = (vertices[ia + 1] + vertices[ib + 1]) / 2;
    newVertices[nv + 2] = (vertices[ia + 2] + vertices[ib + 2]) / 2;
    character.originalVertices = newVertices;
    character.originalVertexCount++;

    //Update the old faces and add the new faces to the index array
    var originalIndicesLength = indices.length;
    var newIndexCount = originalIndicesLength + adjacentFaces.length * 3;
    character.originalIndices = new Uint16Array(newIndexCount);
    character.originalIndices.set(indices);
    for(var f = 0; f < adjacentFaces.length; f++) {
        var face = adjacentFaces[f];
        character.originalIndices[face.index + face.offsetA] = newVertex;
        var faceIndex = originalIndicesLength + f * 3;
        character.originalIndices[faceIndex + face.offsetA] = va;
        character.originalIndices[faceIndex + face.offsetB] = newVertex;
        character.originalIndices[faceIndex + face.offsetC] = face.vc;
    }

    //Redraw the model
    character.cachedSubdivisionData[0].vertices = character.originalVertices;
    character.cachedSubdivisionData[0].indices = character.originalIndices;
    Edit.initialiseVertexScreenCoordinates();
    Edit.redrawMesh(true);
};

//Mirroring
Edit.mirror = function(ismirrored) {
    Edit.controls.mirrorToggle.checked = ismirrored;
    character.mirrored = ismirrored;
    Edit.redrawMesh();
};

//Initialisation
Edit.initialise = function() {
    var box = Edit.controls.box = document.createElement("DIV");
    box.style.position = "absolute";
    box.style.right = Edit.controls.box.style.top = 0;
    box.style.color = "#fff";
    box.style.backgroundColor = "rgba(255, 150, 150, 0.5)";
    box.style.padding = "6px";
    box.style.borderBottomLeftRadius = "6px";
    box.style.boxShadow = "rgba(255, 255, 255, 0.5) 0 0 8px 4px";

    //View control
    var viewTitle = document.createElement("div");
    viewTitle.textContent = "View:";
    box.appendChild(viewTitle);

    //Mesh view toggle
    Edit.controls.meshViewToggle = document.createElement("INPUT");
    Edit.controls.meshViewToggle.type = "checkbox";
    Edit.controls.meshViewToggle.checked = true;
    var meshViewLabel = document.createElement("LABEL");
    Edit.controls.meshViewToggle.id = "mesh_view";
    meshViewLabel.setAttribute("for", "mesh_view");
    meshViewLabel.textContent = "Show Mesh (L)";
    var container = document.createElement("DIV");
    container.appendChild(Edit.controls.meshViewToggle);
    container.appendChild(meshViewLabel);
    box.appendChild(container);

    //Subdivisions
    var subdivisions = document.createElement("INPUT");
    subdivisions.type = "number";
    subdivisions.value = Edit.editingSubdivisions;
    subdivisions.style.width = "32px";
    subdivisions.addEventListener("change", function(e) {
        var subdivisions = parseInt(this.value);
        if(!subdivisions || subdivisions < 0) subdivisions = 0;
        this.value = subdivisions;
        Edit.editingSubdivisions = subdivisions;
        character.subdivide(Edit.editingSubdivisions);
    }, false);
    var subdivisionsLabel = document.createElement("LABEL");
    subdivisions.id = "subdivisions";
    subdivisionsLabel.setAttribute("for", "subdivisions");
    subdivisionsLabel.textContent = "Subdivisions";
    var container = document.createElement("DIV");
    container.appendChild(subdivisions);
    container.appendChild(subdivisionsLabel);
    box.appendChild(container);

    //Cursor mode control
    var cursorModeTitle = document.createElement("div");
    cursorModeTitle.textContent = "Cursor Mode:";
    box.appendChild(cursorModeTitle);

    //Vertex selection control
    var selectVertexBox = document.createElement("INPUT");
    selectVertexBox.type = "radio";
    selectVertexBox.checked = true;
    selectVertexBox.addEventListener("change", function(e) {
        Edit.cursorMode = "select";
    }, false);
    var selectVertexLabel = document.createElement("LABEL");
    selectVertexLabel.textContent = "Select vertices";
    var selectId = "select_vertex";
    selectVertexBox.id = selectId;
    selectVertexLabel.setAttribute("for", selectId);
    var selectVertexContainer = document.createElement("DIV");
    selectVertexContainer.appendChild(selectVertexBox);
    selectVertexContainer.appendChild(selectVertexLabel);
    box.appendChild(selectVertexContainer);

    //Vertex adding control
    var addVertexBox = document.createElement("INPUT");
    addVertexBox.type = "radio";
    addVertexBox.addEventListener("change", function(e) {
        Edit.cursorMode = "add";
    }, false);
    var addVertexLabel = document.createElement("LABEL");
    addVertexLabel.textContent = "Add vertex";
    var addId = "add_vertex";
    addVertexBox.id = addId;
    addVertexLabel.setAttribute("for", addId);
    var addVertexContainer = document.createElement("DIV");
    addVertexContainer.appendChild(addVertexBox);
    addVertexContainer.appendChild(addVertexLabel);
    box.appendChild(addVertexContainer);

    selectVertexBox.name = addVertexBox.name = "cursor_mode";

    //Create the axis locking DOM elements
    Edit.controls.lockBoxes = {};
    function axisLocked(e) {
        var axis;
        if(this == Edit.controls.lockBoxes.x) axis = "x";
        else if(this == Edit.controls.lockBoxes.y) axis = "y";
        else axis = "z";
        Edit.locked[axis] = this.checked;
    };
    for(var axis in Edit.locked) {
        var lockBox = Edit.controls.lockBoxes[axis] =
            document.createElement("INPUT");
        lockBox.type = "checkbox";
        lockBox.addEventListener("change", axisLocked, false);
        var label = document.createElement("LABEL");
        var id = "axis_lock_" + axis;
        lockBox.id = id;
        label.setAttribute("for", id);
        var hotkey = { x: "Z", y: "X", z: "C" }[axis];
        var axisUpper = axis.toUpperCase();
        label.textContent = "Lock to " + axisUpper + " axis (" + hotkey + ")";
        var container = document.createElement("DIV");
        container.appendChild(lockBox);
        container.appendChild(label);
        box.appendChild(container);
    }

    //Create the new vertex button
    var newVertex = document.createElement("BUTTON");
    newVertex.textContent = "Add New Vertex (A)";
    newVertex.addEventListener("click", Edit.newVertex, false);
    box.appendChild(newVertex);

    //Mesh control
    var viewTitle = document.createElement("div");
    viewTitle.textContent = "View:";
    box.appendChild(viewTitle);

    //Mirror toggle
    Edit.controls.mirrorToggle = document.createElement("INPUT");
    Edit.controls.mirrorToggle.type = "checkbox";
    Edit.controls.mirrorToggle.addEventListener("change", function(e) {
        Edit.mirror(this.checked);
    }, false);
    var mirrorLabel = document.createElement("LABEL");
    Edit.controls.mirrorToggle.id = "mirror";
    mirrorLabel.setAttribute("for", "mirror");
    mirrorLabel.textContent = "Mirror (M)";
    var container = document.createElement("DIV");
    container.appendChild(Edit.controls.mirrorToggle);
    container.appendChild(mirrorLabel);
    box.appendChild(container);

    Edit.camera.position = new Vector();
};
