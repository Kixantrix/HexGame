/*
Hexagon object which has a place in the grid 
*/

var Point = require('./helpers').Point;

/* Constructor for hexagon object, passing in q and r location
along with size. 
*/
function Hex(centerQ, centerR, size) {
  this.q = centerQ;   // q index
  this.r = centerR;   // r index
  this.size = size;   // radius of hexagon
  this.color = "white";

  this.corners = []; // Initiate corner array which holds x and y locations of corners of hex
  // Generate corners of hexagon.
  for(var i = 0; i < 6; i++) {
    this.corners[i] = new HexCorner(size, i);
  }

  // Returns a Point = helpers.point; containing the center x and y coordinates of the hexagon
  Hex.prototype.getCenter = function() {
    var x = this.size * Math.sqrt(3) * (this.q + this.r/2);
    var y = this.size * 3.0 / 2 * this.r;
    return new Point(x,y);
  }

  // Draws the hexagon at these coordinates
  Hex.prototype.draw = function(ctx, camera) {
    ctx.lineWidth = "1";
    ctx.strokeStyle = "black";
    ctx.fillStyle = this.color;
    ctx.beginPath();
    var centerCoords = this.getCenter();
    var coords = camera.transform(centerCoords.x + this.corners[0].cos * this.size,
      centerCoords.y + this.corners[0].sin * this.size);
    ctx.moveTo(coords.x, coords.y);
    for(var i = 1; i < 6; i++) {
      coords = camera.transform(centerCoords.x + this.corners[i].cos * this.size,
        centerCoords.y + this.corners[i].sin * this.size);
      ctx.lineTo(coords.x, coords.y);
    }
    coords = camera.transform(centerCoords.x + this.corners[0].cos * this.size,
      centerCoords.y + this.corners[0].sin * this.size);
    ctx.lineTo(coords.x, coords.y);
    ctx.fill();
    ctx.stroke();
  }


};

// Creates a vertex of the hexagon with centerX and center Y position
function HexCorner(size, i) {
  var angleDeg = 60 * i + 90;
  this.angle   = Math.PI * angleDeg / 180;
  this.cos = Math.cos(this.angle);
  this.sin = Math.sin(this.angle);
}

module.exports = Hex;