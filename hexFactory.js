"use strict";  

var helpers = require('./helpers');

// Dynamically resizing factory with which we mage hexPoints
function HexFactory() {
  this.points = {}

  // Resizing points array as necessary
  HexFactory.prototype.make = function(q,r) {

    // create new point if it doesn't exist
    var property = q + " " + r;
    if(!this.points.hasOwnProperty(property)) {
      this.points[property] = new helpers.HexPoint(q, r);
      return this.points[property];
    }
    return this.points[property]  
  }
}

module.exports = HexFactory;