"use strict";  

// Contains general helper functions for small data structures

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

// Returns the distance between two hexes
function hexDistance(a, b) {
  return (Math.abs(a.q - b.q) 
    + Math.abs(a.q + a.r - b.q - b.r)
    + Math.abs(a.r - b.r)) / 2;
}

module.exports = {'HexFactory': HexFactory,
'Point': Point,
'HexPoint': HexPoint,
'pixelToHex': pixelToHex,
'hexDistance': hexDistance
};