"use strict";  

var HexPoint = require('./hexPoint')

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

module.exports = HexFactory;