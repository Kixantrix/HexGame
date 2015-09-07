"use strict";
// Requires
var Point = require('./helpers')['Point'];

var DEFAULT_DEPTH = 1;

// Camera for game, used to transform draw calls for different perspectives of the map
function Camera(x, y, z, canvas) {
	this.x = x;
	this.y = y;
	this.z = z;
    this.canvas = canvas;

    // Applies camera transformations from x y positions to camera
    // Positions
    Camera.prototype.transform = function(x, y) {
    	return [x * this.getZScale() + this.x, 
    		y * this.getZScale() + this.y];
    }

    // Retreives original coordinates before transformation 
    Camera.prototype.antiTransform = function(x, y) {
    	return new Point((x - this.x) / this.getZScale(), (y - this.y) / this.getZScale());
    }  

    Camera.prototype.applyTransform = function(ctx) {
        var scale = this.getZScale();
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);
    }

    // Returns a scaling factor for size of items on 2d plane based on z index.
    Camera.prototype.getZScale = function() {
    	return 1.0 * DEFAULT_DEPTH / this.z;
    }

    // Changes X position
    Camera.prototype.moveX = function(x) {
    	this.x = x;
    }

    // Changes Y position
    Camera.prototype.moveY = function(y) {
    	this.y = y;
    }

    // Changes Z position
    Camera.prototype.moveZ = function(z) {
    	this.z = z;
    }

    Camera.prototype.left = function() {
    	return -this.x / this.getZScale();
    }
    Camera.prototype.right = function() {
    	return -this.x / this.getZScale() + this.canvas.width / this.getZScale();
    }
    Camera.prototype.top = function() {
    	return -this.y / this.getZScale();
    }

    Camera.prototype.bottom = function() {
    	return -this.y / this.getZScale() + this.canvas.height / this.getZScale();
    }

    Camera.prototype.center = function() {
        if (arguments.length === 2) {
            this.x = -arguments[0] * this.getZScale() + this.canvas.width / 2;
            this.y = -arguments[1] * this.getZScale() + this.canvas.height / 2;
            return;
        }

        return {
            x: -this.x + this.canvas.width / this.getZScale() / 2,
            y: -this.y + this.canvas.height / this.getZScale() / 2
        }
    }
}

module.exports = Camera;