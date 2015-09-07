"use strict";

var globals = require('./globals');


  // Moves all hexes connected to old location to new location.
  function moveHexes(centerQ, centerR, newQ, newR, grid, color, adjacentHexes) {
    var rDif = newR - centerR;           // Amount of offset to add to each r coordinate.
    var qDif = newQ - centerQ;           // Amount of offset to add to each q coordinate.
    for(let coord of adjacentHexes) {
      if(grid[coord.q + qDif + globals.QDIM] && grid[coord.q + qDif + globals.QDIM][coord.r + rDif + globals.RDIM]) {
        grid[coord.q + qDif + globals.QDIM][coord.r + rDif + globals.RDIM].color = color;
        grid[coord.q][coord.r].color = "white";
      }
    } 
  }

  // Returns a set of all Point = helpers.point;s of same color provided connected to the hex
  function findAdjacentHexes(q, r, grid) {
    var fringe = new Set();                   // Hexes to be examined
    var known  = new Set();                   // Hexes already examined
    var adjacentHexes = new Set();            // Contents of set
    
    var color = grid[q][r].color;             // Color we are looking for
    fringe.add(globals.hexFactory.make(q,r));         // Start with node passed in.
    
    while(fringe.size != 0) {                 // While fringe is not empty
      for(let item of fringe) {               // Iterate through fringe
        var currentHex = grid[item.q][item.r];
        fringe.delete(item);                  // Remove item from fringe
        known.add(item);                      // Add item to known set
        if(currentHex.color == color) {       // Add same color to adjacent set
          adjacentHexes.add(item);            
          var neighbors = getNeighbors(item, grid);
          // Add each neighbors which is not already known.
          for(var i = 0; i < neighbors.length; i++) {
            if(!known.has(neighbors[i])) {  
              fringe.add(neighbors[i]);
            }
          } 
        }
      }
    }  

    //console.log(adjacentHexes);
    return adjacentHexes;
  }

  // Returns an array of HexPoints corresponding to all hexes which
  function getNeighbors(centerHex, grid) {     
    var neighbors = [];
    //console.log(centerHex);     // /Iterate through all size potential neighbors and test if they are within grid.     
    for(var i = 0; i < 6; i++) {
      //console.log(centerHex.q + globals.SIDEQ[i] + centerHex.r + globals.SIDER[i]);
      if(grid[centerHex.q + globals.SIDEQ[i]] && grid[centerHex.q + globals.SIDEQ[i]][centerHex.r + globals.SIDER[i]]) {
        neighbors.push(globals.hexFactory.make(centerHex.q + globals.SIDEQ[i], centerHex.r + globals.SIDER[i]));
      }  
    }
    return neighbors;
    
  }

  // Returns attack of hex equal to nunmber of hexes fo the same color radiating from the first 
  // HexPoint in the HexPoint direction passed in.
  function getAttack(q, r, direction, grid, color) {
    if((hex[q] && hex[q][r] && hex[q][r].color == color)) {
      return 1 + getAttack(q + direction.q , r + direction.r, direction, grid, color);  
    } else {
      return 0;
    }
  }

  // An object representing a path from an original spot to a new spot
  function Path(begin, end, adjacentHexes, grid) {
    // Parameters, used in fields to retain information for re-examination.
    this.begin = begin;
    this.end = end;
    this.adjacentHexes = adjacentHexes;
    this.grid = grid;
    this.path = []
    this.cost = 0;
    this.exists = false;

    this.findPath();

    // Find path using distance between start and end as heuristic
    Path.prototype.findPath = function() {
      // Coordinates already examined
      var known = new Set();
      // Coordinates to be examined
      var fringe = new Set();
      // Map of all Point = helpers.point;s by cost
      var costMap = {};
      // First Item is 0 cost
      costMap[this.begin.toString()] = 0;
      // Start is start.
      var cameFrom = {};
      fringe.add(this.begin);
      var currentHex = null;
      // Keep going while we haven't found end and there are more in fringe
      while(fringe.size > 0 &&  currentHex != this.end) {
        currentHex = findLowest(fringe, costMap);
        fringe.remove(currentHex);
        known.add(currentHex);
        var neighbors = getNeighbors(currentHex, this.grid)
        // Add neighbors to fringe
        for(let neighbor in neighbors) {
          // Checked if neighbor seen and if we can move there
          if(!known.has(neightbor) && canMoveTo(neighbor)) {
            fringe.add(neighbor);
            cameFrom[neighbor.toString()] = currentHex;
            costMap[neighbor.toString()] = costMap[currentHex.toString()] + 1;
          }
        }

      }
      if(currentHex == this.end) {
        this.cost = costMap[currentHex.toString()];
        this.exists = true;
        place = currentHex
        backwardsPath = []
        while(cameFrom.hasOwnProperty(place.toString())) {
          this.Backwardspath.add(place)
          place = cameFrom(place.toString());
          // Store and flip
          this.path = backwardsPath.reverse();
        }
      }
    }

    // Returns lowest in fringe
    Path.prototype.findLowest = function(fringe, costMap) {
      var lowest = null;
      for(let item in fringe) {
        if(!lowest || costMap[item.toString()] + hexDistance(item, this.end) 
          < costMap[lowest.toString()] + hexDistance(hex, this.end)) {
          lowest = item;
      }
    }
    return map[lowest];
  }

    // Returns true if the hexes can move to the new position from their original position
    Path.prototype.canMoveTo = function(newPosition) {
      qDisplacement = this.begin.q - newPosition.q;
      rDisplacement = this.begin.r - newPosition.r;
      for(let item of this.adjacentHexes) {
        // Check space exists and is open
        if(!(this.grid[item.q + qDisplacement] && this.grid[item.q + qDisplacement][item.r + rDisplacement]
          && this.grid[item.q + qDisplacement][item.r + rDisplacement].color == "white")) {
          return false;
      }
      return true;
    }
  }
}

module.exports = {
  'moveHexes': moveHexes,
  'findAdjacentHexes': findAdjacentHexes,
  'getNeighbors': getNeighbors,
  'getAttack': getAttack,
  'Path': Path
}