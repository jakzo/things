
/*
 * RAY CAST
 */

var RayCast = {};

//Returns the first face that a line intersects with in a model
RayCast.check = function(model, origin, direction) {
    var intersections = RayCast.getIntersections(model, origin, direction);
    var closestDistance = Infinity, closestIntersection = null;
    for(var i = 0; i < intersections.length; i++) {
        var intersection = intersections[i];
        if(intersection.distance < closestDistance) {
            closestIntersection = intersection;
            closestDistance = intersection.distance;
        }
    }
    return closestIntersection;
};

//Returns the faces that a line intersects with in a model
RayCast.getIntersections = function(model, origin, direction, cullBackface) {
    var intersections = [];
    //Check the distance to the bounding box first
    var intersects = RayCast.checkBoundingBox(model, origin, direction);
    //if(!intersects) return intersections;
    //Check relative to the model's position
    var relativeOrigin = origin.clone().subtract(model.position);
    //Check for intersection with each face
    var indices = model.originalIndices, vertices = model.originalVertices;
    for(var i = 0, length = indices.length; i < length; i += 3) {
        var v0 = indices[i], v1 = indices[i + 1], v2 = indices[i + 2];
        var vertex0 = Vector.fromVertices(vertices, v0),
            vertex1 = Vector.fromVertices(vertices, v1),
            vertex2 = Vector.fromVertices(vertices, v2);
        var edge1 = vertex1.subtract(vertex0),
            edge2 = vertex2.subtract(vertex0);
        var normal = edge1.clone().crossMultiply(edge2);
        var dotDirectionNormal = direction.dot(normal), sign;
        if(dotDirectionNormal > 0) {
            if(cullBackface) continue;
            sign = 1;
        }
        else if(dotDirectionNormal < 0) {
            sign = -1;
            dotDirectionNormal = -dotDirectionNormal;
        }
        else continue;
        var difference = relativeOrigin.clone().subtract(vertex0);
        var t = -sign * difference.dot(normal);
        if(t < 0) continue;
        var b2 = sign * direction.dot(edge1.crossMultiply(difference));
        if(b2 < 0) continue;
        var b1 = sign * direction.dot(difference.crossMultiply(edge2));
        if(b1 < 0 || b1 + b2 > dotDirectionNormal) continue;
        var positionAlongLine = t / dotDirectionNormal;
        intersections.push({
            index: i,
            distance: positionAlongLine,
            point: direction.clone().scale(positionAlongLine).add(origin)
        });
    }
    return intersections;
};

//Returns whether a line intersects with a model's bounding box
RayCast.checkBoundingBox = function(model, origin, direction) {
    return null;
};

//Returns the closest distance from the raycast line to a specific point
RayCast.distanceToPoint = function(point, origin, direction) {

};
