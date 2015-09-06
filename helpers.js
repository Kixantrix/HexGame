"use strict";  

// Dynamically resizing factory with which we mage hexPoints
function HexFactory() {
  this.points = {}

  // Resizing points array as necessary
  this.make = function(q,r) {

    // create new point if it doesn't exist
    var property = q + " " + r;
    if(!this.points.hasOwnProperty(property)) {
      this.points[property] = new hexPoint(q, r)
      return this.points[property];
    }
    return this.points[property]  
  }
}

// Creates a point
function Point(x, y) {
  this.x = x;
  this.y = y;
}

// Creates a point in hex coordinates
function HexPoint(q, r) {
  this.q = q;
  this.r = r;

  this.toString = function() {
    return this.q + " " + this.r;
  }
}

// Returns hexPoint representing the q and r coordinates
// of hexagon.
function pixelToHex(x, y, size) {
  var q = Math.round((x * Math.sqrt(3)/3 - y / 3) / size);
  var r = Math.round(y * 2.0/3 / size);
  return factory.make(q, r);
}

module.exports = {'HexFactory': HexFactory,
                  'Point': Point,
                  'HexPoint': HexPoint,
                  'pixelToHex': pixelToHex
};