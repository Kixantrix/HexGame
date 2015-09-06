 "use strict";
 (function() {

  var Camera = require('./camera');
  var helpers = require('./helpers');
  var globals = require('./globals');
  var Hex = require('./hex')
  var HexFactory = helpers.HexFactory;
  var Point = helpers.Point;
  var HexPoint = helpers.HexPoint;
  var pixelToHex = helpers.pixelToHex;


  var QDIM = 9;             // Number of elements along one side of q axis
  var RDIM = 9;             // Number of elements along one side of r axis
  var DEFAULT_DEPTH = 100;  // Default z position of camera
  
  var SIDEQ = [1, 0, -1, -1, 0, 1]; // Offsets of each neighboring hex
  var SIDER = [0, 1, 1, 0, -1, -1]; 

  var factory = new HexFactory();
  // Initialize game variables, loops and 
  window.onload = function() {
    // Initite canvas
    var moves = 0;
    var unitsToPlace = 0;
    var hexSelected  = null;
    var canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerWidth;
    document.body.appendChild(canvas);

    // Generate context for 2d drawing
    var ctx = canvas.getContext("2d");
    
    var HEXSIZE = 50;  // Size in pixels of hexagon width.

    // Set game camera 
    var gameCamera = new camera(window.innerWidth / 2, window.innerHeight / 2, DEFAULT_DEPTH * 1);
    // Set Camera for mini map
    var mapCamera  = new camera(200, 200, DEFAULT_DEPTH * 4);
    
    var grid = [];

    // Generate grid 2 dim array based on QDIM and RDIM
    for(var q = -1 * QDIM; q <= QDIM; q++) {
      grid[q + QDIM] = []; // Initiate array for q index
      for(var r = -1 * RDIM; r <= RDIM; r++) {
        // Add hex at axial coordinates
        if(Math.abs(q + r) <= QDIM) {
          grid[q + QDIM][r + RDIM] = new Hex(q, r, HEXSIZE);
        }
      }
    }


    var frequency = 5;
    // Draw Loop
    setInterval(function() {
      count = countUnits();
      updateMoves(count)
      updateUnitsToPlace(count);
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
      mapCamera.moveY(window.innerHeight - 200);
      unitsToPlace ++
    }

    // Draw things
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGrid(grid, ctx, gameCamera);
      drawMiniMap();
    }

    // Draws min map
    function drawMiniMap() {
      drawGrid(grid, ctx, mapCamera);
      var boxCoords = mapCamera.transform(-1 * gameCamera.x, -1 * gameCamera.y);
      ctx.lineWidth = "1";
      ctx.strokeStyle = "black";
      ctx.rect(boxCoords.x, boxCoords.y,
        canvas.width * mapCamera.getZScale(),
        canvas.height * mapCamera.getZScale());
      ctx.stroke();
    }

    canvas.addEventListener("click", function(e) {

    // use pageX and pageY to get the mouse position
    // relative to the browser window

    var mouse = {
      x: e.pageX,
      y: e.pageY
    }

    var mapCoord = mapCamera.antiTransform(mouse.x, mouse.y);
    var hexClicked = pixelToHex(mapCoord.x, mapCoord.y, HEXSIZE);

    // Inside minimap
    if(Math.abs(hexClicked.q) <= QDIM 
      && Math.abs(hexClicked.r) <= RDIM 
      && Math.abs(hexClicked.q + hexClicked.r) <= QDIM) {
      gameCamera.moveX(canvas.width / 2 - mapCoord.x);
    gameCamera.moveY(canvas.height / 2 - mapCoord.y);

    } else {    // Outside minimap
      var gameCoord = gameCamera.antiTransform(mouse.x, mouse.y);
      hexClicked = pixelToHex(gameCoord.x, gameCoord.y, HEXSIZE);
      if(Math.abs(hexClicked.q) <= QDIM    // Case inside grid
        && Math.abs(hexClicked.r) <= RDIM 
        && Math.abs(hexClicked.q + hexClicked.r) <= QDIM) {
        var currentHex = grid[hexClicked.q + QDIM][hexClicked.r + RDIM];
        if(currentHex.color == "white"     // Empty spot, nothing selected
          && hexSelected == null 
          /*&& gridunitsToPlace > 0*/) {    
          currentHex.color = "blue";
          //unitsToPlace--;
        } else if(currentHex.color == "white" // Empty spot, something selected. Try to move.
          && hexSelected != null 
          /*&& gridunitsToPlace > 0*/) { 
          // Find all adjacent Hexes
          var adjacentHexes = findAdjacentHexes(hexSelected.q, hexSelected.r, grid);
          // Try to find a path.
          var path =  new Path(hexSelected, hexClicked, adjacentHexes, grid);
          if(path.exists && path.cost <= moves) {
            var currentSelected = grid[hexSelected.q][hexSelected.r];
            moveHexes(hexSelected.q, hexSelected.r, hexClicked.q, hexClicked.r, grid, currentSelected.color, adjacentHexes);
            hexSelected = null;
          }
        } else if(grid[hexClicked.q + QDIM][hexClicked.r + RDIM].color == "blue") { // Add new hex
          hexSelected = factory.make(hexClicked.q + QDIM, hexClicked.r + RDIM);
        } else {

        }
        
      }
    }
  });

}

  // Moves all hexes connected to old location to new location.
  function moveHexes(centerQ, centerR, newQ, newR, grid, color, adjacentHexes) {
    var rDif = newR - centerR;           // Amount of offset to add to each r coordinate.
    var qDif = newQ - centerQ;           // Amount of offset to add to each q coordinate.
    for(let coord of adjacentHexes) {
      if(grid[coord.q + qDif + QDIM] && grid[coord.q + qDif + QDIM][coord.r + rDif + RDIM]) {
        grid[coord.q + qDif + QDIM][coord.r + rDif + RDIM].color = color;
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
    fringe.add(factory.make(q,r));            // Start with node passed in.
    
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
      //console.log(centerHex.q + SIDEQ[i] + centerHex.r + SIDER[i]);
      if(grid[centerHex.q + SIDEQ[i]] && grid[centerHex.q + SIDEQ[i]][centerHex.r + SIDER[i]]) {
        neighbors.push(factory.make(centerHex.q + SIDEQ[i], centerHex.r + SIDER[i]));
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

  // Returns the distance between two hexes
  function hexDistance(a, b) {
    return (Math.abs(a.q - b.q) 
      + Math.abs(a.q + a.r - b.q - b.r)
      + Math.abs(a.r - b.r)) / 2;
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
    this.findPath = function() {
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
    this.findLowest = function(fringe, costMap) {
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
    this.canMoveTo = function(newPosition) {
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


  // Calls draw function of all game assets
  function drawGrid(grid, ctx, camera) {
    for(var q = 0; q <= 2 * QDIM; q++) {
      for(var r = 0; r <= 2* RDIM; r++) {
        // Add hex at axial coordinates in array
        if(Math.abs(q - QDIM + r - RDIM) <= QDIM) {
          grid[q][r].draw(ctx, camera);
        }
      }
    }
  }
}()); 