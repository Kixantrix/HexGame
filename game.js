(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";  

var helpers = require('./helpers');

// Dynamically resizing factory with which we mage hexPoints
function HexFactory() {
  this.points = {};

  // Resizing points array as necessary
  HexFactory.prototype.make = function(q,r) {

    // create new point if it doesn't exist
    var property = q + " " + r;
    if(!this.points.hasOwnProperty(property)) {
      this.points[property] = new helpers.HexPoint(q, r);
      return this.points[property];
    }
    return this.points[property];
  }
}

module.exports = HexFactory;
},{"./helpers":4}],2:[function(require,module,exports){
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
},{"./helpers":4}],3:[function(require,module,exports){
"use strict";

// Contains globals of game in globals object

var globals = {};
module.exports = globals;
},{}],4:[function(require,module,exports){
"use strict";  

var globals = require('./globals');

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
  return globals.hexFactory.make(q, r);
}

// Returns the distance between two hexes
function hexDistance(a, b) {
  return (Math.abs(a.q - b.q) 
    + Math.abs(a.q + a.r - b.q - b.r)
    + Math.abs(a.r - b.r)) / 2;
}

module.exports = {
'Point': Point,
'HexPoint': HexPoint,
'pixelToHex': pixelToHex,
'hexDistance': hexDistance
};
},{"./globals":3}],5:[function(require,module,exports){
"use strict";

/*
Hexagon object which has a place in the grid 
*/

var Point = require('./helpers').Point;
var LINEWIDTH = 1;
var globals = require('./globals');

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
    ctx.fill();
    ctx.stroke();
    
    if(this.cost != Infinity && this.cost != 0 && this.cost < globals.player.moves) {
      ctx.fillStyle= globals.player.color;
      ctx.globalAlpha = (0.5);
      ctx.beginPath();
      ctx.moveTo(this.corners[0].x, this.corners[0].y);
      for(var i = 1; i < 6; i++) {
        ctx.lineTo(this.corners[i].x, this.corners[i].y);
      }
      ctx.lineTo(this.corners[0].x, this.corners[0].y);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'black';
    ctx.font = "10px Arial";
    ctx.fillText(this.cost,this.center.x,this.center.y);
  }

  // Recursively drars of hex if tail exists
  Hex.prototype.drawPath = function(ctx, camera) {
    if(this.tail && this.cost < globals.player.moves) {
      ctx.lineWidth = "10";
      ctx.strokeStyle = "black";
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(this.center.x, this.center.y, this.size / 3, 0, 2*Math.PI);
      ctx.moveTo(this.center.x, this.center.y);
      ctx.lineTo(this.tail.center.x, this.tail.center.y);
      ctx.fill();
      ctx.stroke();
      this.tail.drawPath(ctx, camera);
    }
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
},{"./globals":3,"./helpers":4}],6:[function(require,module,exports){
"use strict";
 (function() {

  // Requires and importing functions
  var Camera = require('./camera');
  var helpers = require('./helpers');
  var globals = require('./globals');
  var Hex = require('./hex')
  var HexFactory = require('./HexFactory');
  var moveHexes = require('./pathing').moveHexes;
  var findAdjacentHexes = require('./pathing').findAdjacentHexes;
  var getNeighbors = require('./pathing').getNeighbors;
  var getAttack = require('./pathing').getAttack;
  var Path = require('./pathing').Path;
  var findAllPaths = require('./pathing').findAllPaths;
  var Point = helpers.Point;
  var HexPoint = helpers.HexPoint;
  var pixelToHex = helpers.pixelToHex;
  var hexDistance = helpers.hexDistance;

  // Initiate global constants
  globals.QDIM = 9;             // Number of elements along one side of q axis
  globals.RDIM = 9;             // Number of elements along one side of r axis
  var DEFAULT_DEPTH = 1;        // Default z position of camera
  
  // Offsets of each neighboring hex
  globals.SIDEQ = [1, 0, -1, -1, 0, 1]; 
  globals.SIDER = [0, 1, 1, 0, -1, -1]; 

  // Initiate global hexFactory for HexPoints
  globals.hexFactory = new HexFactory();

  // Initialize game variables, loops and 
  window.onload = function() {
    // Initite canvas
    globals.hexSelected  = null;
    var canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerWidth;
    document.body.appendChild(canvas);

    // Generate context for 2d drawing
    var ctx = canvas.getContext("2d");
    
    globals.HEXSIZE = 50;  // Size in pixels of hexagon width.

    globals.player = {
      'color': 'blue',
      'count': 0,
      'moves': 0,
      'unitsToPlace': 4
    }

    // Set game camera 
    globals.gameCamera = new Camera(window.innerWidth / 2, window.innerHeight / 2, DEFAULT_DEPTH * 1, canvas);
    // Set Camera for mini map
    globals.mapCamera  = new Camera(200, 200, DEFAULT_DEPTH * 4, canvas);
    
    var grid = [];

    // Generate grid 2 dim array based on globals.QDIM and globals.RDIM
    for(var q = -1 * globals.QDIM; q <= globals.QDIM; q++) {
      grid[q + globals.QDIM] = []; // Initiate array for q index
      for(var r = -1 * globals.RDIM; r <= globals.RDIM; r++) {
        // Add hex at axial coordinates
        if(Math.abs(q + r) <= globals.QDIM) {
          grid[q + globals.QDIM][r + globals.RDIM] = new Hex(q, r, globals.HEXSIZE);
        }
      }
    }

    // Mouse information for use in drawing paths
    globals.cursorX = 0;
    globals.cursorY = 0;
    document.onmousemove = function(e){
      globals.cursorX = e.pageX;
      globals.cursorY = e.pageY;
    }


    var frequency = 30;
    // Update Loop
    setInterval(function() {
      //count = countUnits();
      //updateMoves(count)
      //updateUnitsToPlace(count);
    }, 1000 * frequency);


    var FPS = 30;
    // Draw Loop
    setInterval(function() {
      update();
      draw();
    }, 1000/FPS);

    // Updates things...
    function update() {
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight;
      globals.mapCamera.moveY(window.innerHeight - 200);
      countHexes(globals.player, grid);
      updateMoves(globals.player);
      updateUnitsToPlace(globals.player);
    }

    // Updates the global count of hexes
    function countHexes(player, grid) {
      var numHexes = 0;
      for(var i = 0; i < grid.length; i++) {
        for(var j = 0; j < grid[i].length; j++) {
          if(grid[i][j] && (grid[i][j].color == player.color)) {
            numHexes++;
          }
        }
      }
      player.numHexes = numHexes;
    }

    // Updates the total number of moves of the player
    function updateMoves(player) {
      if (player.moves < 200) {
        player.moves += Math.log(player.numHexes + 1) / 30;
      }
    }

    function updateUnitsToPlace(player) {
      if (player.unitsToPlace < 20) {
        player.unitsToPlace += Math.log(player.numHexes + 1) / 30;
      }
    }

    // Draw things
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(grid, ctx, globals.gameCamera);
      drawMiniMap();
      drawResources();
    }

    function drawResources() {
      ctx.fillStyle = 'black';
      ctx.font = "20px Arial";
      ctx.fillText("Hexes to Place: " + Math.floor(globals.player.unitsToPlace) 
        + "  Moves: " + Math.floor(globals.player.moves), 0, 20);
    }

    // Draws min map
    function drawMiniMap() {
      drawGrid(grid, ctx, globals.mapCamera);
      var boxCoords = globals.mapCamera.transform(-1 * globals.gameCamera.x, -1 * globals.gameCamera.y);
      ctx.lineWidth = "1";
      ctx.strokeStyle = "black";
      ctx.rect(boxCoords.x, boxCoords.y,
        canvas.width * globals.mapCamera.getZScale(),
        canvas.height * globals.mapCamera.getZScale());
      ctx.stroke();
    }

    canvas.addEventListener("click", function(e) {

    // use pageX and pageY to get the mouse position
    // relative to the browser window

    var mouse = {
      x: e.pageX,
      y: e.pageY
    };

    var mapCoord = globals.mapCamera.antiTransform(mouse.x, mouse.y);
    var hexClicked = pixelToHex(mapCoord.x, mapCoord.y, globals.HEXSIZE + 1);

    // Inside minimap
    if(Math.abs(hexClicked.q) <= globals.QDIM 
      && Math.abs(hexClicked.r) <= globals.RDIM 
      && Math.abs(hexClicked.q + hexClicked.r) <= globals.QDIM) {
      globals.gameCamera.moveX(canvas.width / 2 - mapCoord.x);
    globals.gameCamera.moveY(canvas.height / 2 - mapCoord.y);

    } else {    // Outside minimap
      var gameCoord = globals.gameCamera.antiTransform(mouse.x, mouse.y);
      hexClicked = pixelToHex(gameCoord.x, gameCoord.y, globals.HEXSIZE);
      if(Math.abs(hexClicked.q) <= globals.QDIM    // Case inside grid
        && Math.abs(hexClicked.r) <= globals.RDIM 
        && Math.abs(hexClicked.q + hexClicked.r) <= globals.QDIM) {
        var currentHex = grid[hexClicked.q + globals.QDIM][hexClicked.r + globals.RDIM];
        if(currentHex.color == "white"     // Empty spot, nothing selected
          && globals.hexSelected == null 
          && globals.player.unitsToPlace >= 1
          /*&& gridunitsToPlace > 0*/) {    
          currentHex.color = "blue";
          globals.player.unitsToPlace--;
          //unitsToPlace--;
        } else if(currentHex.cost <= globals.player.moves // Empty spot, something selected. Try to move.
          && globals.hexSelected != null 
          /*&& gridunitsToPlace > 0*/) { 
          // Find all adjacent Hexes
          globals.player.moves -= currentHex.cost;
          var adjacentHexes = findAdjacentHexes(globals.hexSelected.q, globals.hexSelected.r, grid);
          // Try to find a path.
          //var path =  new Path(globals.hexSelected, hexClicked, adjacentHexes, grid);
          //if(path.exists && path.cost <= moves) {
            var currentSelected = grid[globals.hexSelected.q][globals.hexSelected.r];
            moveHexes(globals.hexSelected.q, globals.hexSelected.r, hexClicked.q, hexClicked.r, grid, currentSelected.color, adjacentHexes);
            grid[globals.hexSelected.q][globals.hexSelected.r].selected = false;
            globals.hexSelected = null;
            // Prime grid
            for(var q = 0; q < grid.length; q++) {
              if(grid[q]) {
                for(var r = 0; r < grid[q].length; r++) {
                  if(grid[q][r]) {
                    grid[q][r].cost = Infinity;
                    grid[q][r].known = false;
                  }
                }
              } 
            }
          //}
        } else if(currentHex.color == "blue") { // Switch Selected
          if(globals.hexSelected) {
            grid[globals.hexSelected.q][globals.hexSelected.r].selected = false;
          }

          globals.hexSelected = globals.hexFactory.make(hexClicked.q + globals.QDIM, hexClicked.r + globals.RDIM);
          grid[globals.hexSelected.q][globals.hexSelected.r].selected = true;
        } else {

        }
        if(globals.hexSelected) {
          findAllPaths(globals.hexSelected, grid);
        } 
      }
    }
  });

}

  // Calls draw function of all game assets
  function drawGrid(grid, ctx, camera) {
    ctx.save();
    camera.applyTransform(ctx);
    for(var q = 0; q <= 2 * globals.QDIM; q++) {
      for(var r = 0; r <= 2* globals.RDIM; r++) {
        // Add hex at axial coordinates in array
        if(Math.abs(q - globals.QDIM + r - globals.RDIM) <= globals.QDIM) {
          grid[q][r].draw(ctx, camera);
        }
      }
    }
    if(globals.hexSelected) {
      var gameCoord = globals.gameCamera.antiTransform(globals.cursorX, globals.cursorY);
      var mouseOverHex = pixelToHex(gameCoord.x, gameCoord.y, globals.HEXSIZE);
      
      if(Math.abs(mouseOverHex.q) <= globals.QDIM    // Case inside grid
        && Math.abs(mouseOverHex.r) <= globals.RDIM 
        && Math.abs(mouseOverHex.q + mouseOverHex.r) <= globals.QDIM) {
        var currentHex = grid[mouseOverHex.q + globals.QDIM][mouseOverHex.r + globals.RDIM];
        currentHex.drawPath(ctx, camera);
      }
    }
    ctx.restore();
  }
}()); 
},{"./HexFactory":1,"./camera":2,"./globals":3,"./helpers":4,"./hex":5,"./pathing":7}],7:[function(require,module,exports){
"use strict";

var globals = require('./globals');
var HexPoint = require('./helpers').HexPoint;


  // Moves all hexes connected to old location to new location.
  function moveHexes(centerQ, centerR, newQ, newR, grid, color, adjacentHexes) {
    var rDif = newR - centerR;           // Amount of offset to add to each r coordinate.
    var qDif = newQ - centerQ;           // Amount of offset to add to each q coordinate.
    var newCoords = [];
    for(let coord of adjacentHexes) {
      // New position
      var movedCoord = globals.hexFactory.make(coord.q + qDif + globals.QDIM, coord.r + rDif + globals.RDIM);
      if(grid[movedCoord.q] && grid[movedCoord.q][movedCoord.r]) {
        newCoords.push(movedCoord);
        grid[coord.q][coord.r].color = "white";
      }
    }
    for(var index = 0; index < newCoords.length; index++) {
      grid[newCoords[index].q][newCoords[index].r].color = color;
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
    /*
    // Parameters, used in fields to retain information for re-examination.
    this.begin = begin;
    this.end = end;
    this.adjacentHexes = adjacentHexes;
    this.grid = grid;
    this.path = [];
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
        var place = currentHex;
        var backwardsPath = [];
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
      var qDisplacement = this.begin.q - newPosition.q;
      var rDisplacement = this.begin.r - newPosition.r;
      for(let item of this.adjacentHexes) {
        // Check space exists and is open
        if(!(this.grid[item.q + qDisplacement] && this.grid[item.q + qDisplacement][item.r + rDisplacement]
          && this.grid[item.q + qDisplacement][item.r + rDisplacement].color == "white")) {
          return false;
      }
      return true;
    }
  }
  */
}

// Explores all paths in grid to show where the player can go.
function findAllPaths(begin, grid) {
  // Prime grid
  for(var q = 0; q < grid.length; q++) {
    if(grid[q]) {
      for(var r = 0; r < grid[q].length; r++) {
        if(grid[q][r]) {
          grid[q][r].cost = Infinity;
          grid[q][r].known = false;
          grid[q][r].tail = null;
        }
      }
    } 
  }
  // Hexes to be moved
  var adjacentHexes = findAdjacentHexes(begin.q, begin.r, grid);
  // Set of all nodes to be examined
  var fringe = new Set();
  // Add beginning to known set and adjust it's cost
  grid[begin.q][begin.r].cost = 0;
  fringe.add(begin);
  // Iterate through fringe, removing items and marking them as known.
  while(fringe.size != 0) {
    for(let item of fringe) {
      var currentHex = grid[item.q][item.r];
      fringe.delete(item);
      currentHex.known = true;
      
      var neighbors = getNeighbors(item, grid);
      // Add each neighbors which is not already known.
      for(var i = 0; i < neighbors.length; i++) {
        var neighbor = grid[neighbors[i].q][neighbors[i].r];
        // Add unknown neighbors to fringe and update their costs
        if(!neighbor.known && canMoveTo(begin, neighbors[i], adjacentHexes, grid)) {
          fringe.add(neighbors[i]);
          // Update cost if better path
          var newCost = currentHex.cost + adjacentHexes.size;
          if(neighbor.cost > newCost) {
            neighbor.cost = newCost;
            neighbor.tail = currentHex;
          }
        }
      } 
    }
  }
}

// Returns true if the set of adjacentHexes can be moved to newPosition
// Without overlapping with other hexes.
function canMoveTo(begin, newPosition, adjacentHexes, grid) {
  var qDisplacement = begin.q - newPosition.q;
  var rDisplacement = begin.r - newPosition.r;
  var color = grid[begin.q][begin.r].color;
  for(let item of adjacentHexes) {
    // Check space exists and is open
    var positionExamined = globals.hexFactory.make(item.q - qDisplacement, item.r - rDisplacement);
    if(!(grid[positionExamined.q] && grid[positionExamined.q][positionExamined.r]
      && ((grid[positionExamined.q][positionExamined.r].color == "white")
      || adjacentHexes.has(positionExamined))
      )) {
      return false;
    }
  }
  return true;
}

module.exports = {
  'moveHexes': moveHexes,
  'findAdjacentHexes': findAdjacentHexes,
  'getNeighbors': getNeighbors,
  'getAttack': getAttack,
  'Path': Path,
  'findAllPaths': findAllPaths
};
},{"./globals":3,"./helpers":4}]},{},[6]);
