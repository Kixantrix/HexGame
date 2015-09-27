"use strict";

/*
Hexagon object which has a place in the grid 
*/

var Point = require('./helpers').Point;
var LINEWIDTH = 1;

/* Constructor for hexagon object, passing in q and r location
along with size. 
*/
function Hex(centerQ, centerR, size) {
  this.q = centerQ;   // q index
  this.r = centerR;   // r index
  this.size = size;   // radius of hexagon
  this.color = "white";
  this.selected = false;

  // Fields for traversal
  this.cost = Infinity;
  this.tail = null;
  this.known = false;

  // Returns a Point = helpers.point; containing the center x and y coordinates of the hexagon
  Hex.prototype.getCenter = function() {
    var x = this.size * Math.sqrt(3) * (this.q + this.r/2);
    var y = this.size * 3.0 / 2 * this.r;
    return new Point(x,y);
  }

  this.center = this.getCenter();

  this.corners = []; // Initiate corner array which holds x and y locations of corners of hex
  // Generate corners of hexagon.
  for(var i = 0; i < 6; i++) {
    this.corners[i] = new HexCorner(this.size, i, this.center);
  }

  // Draws the hexagon at these coordinates
  Hex.prototype.draw = function(ctx, camera) {
    ctx.lineWidth = "" + LINEWIDTH;
    ctx.strokeStyle = "black";
    if(this.selected) {
      ctx.fillStyle = "black";
    } else {
      ctx.fillStyle = this.color;
    }
    ctx.beginPath();
    ctx.moveTo(this.corners[0].x, this.corners[0].y);
    for(var i = 1; i < 6; i++) {
      ctx.lineTo(this.corners[i].x, this.corners[i].y);
    }
    ctx.lineTo(this.corners[0].x, this.corners[0].y);

    ctx.stroke();
    if(this.cost != Infinity) {
      console.log("drawing path");
      ctx.beginPath();
      ctx.arc(this.center.x, this.center.y, this.cost, 0, 2 * Math.PI, false);
    }
    ctx.fill();
  }


};

// Creates a vertex of the hexagon with centerX and center Y position
function HexCorner(size, i, center) {
  var angleDeg = 60 * i + 90;
  var angle   = Math.PI * angleDeg / 180;
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  this.x = center.x + cos * size;
  this.y = center.y + sin * size;
}

module.exports = Hex;