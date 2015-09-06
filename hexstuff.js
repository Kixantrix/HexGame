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
  var Point = helpers.Point;
  var HexPoint = helpers.HexPoint;
  var pixelToHex = helpers.pixelToHex;
  var hexDistance = helpers.hexDistance;

  // Initiate global constants
  globals.QDIM = 9;             // Number of elements along one side of q axis
  globals.RDIM = 9;             // Number of elements along one side of r axis
  var DEFAULT_DEPTH = 100;      // Default z position of camera
  
  // Offsets of each neighboring hex
  globals.SIDEQ = [1, 0, -1, -1, 0, 1]; 
  globals.SIDER = [0, 1, 1, 0, -1, -1]; 

  // Initiate global hexFactory for HexPoints
  globals.hexFactory = new HexFactory();

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

    // Generate grid 2 dim array based on globals.QDIM and globals.RDIM
    for(var q = -1 * globals.QDIM; q <= globals.QDIM; q++) {
      grid[q + globals.QDIM] = []; // Initiate array for q index
      for(var r = -1 * globals.RDIM; r <= globals.RDIM; r++) {
        // Add hex at axial coordinates
        if(Math.abs(q + r) <= globals.QDIM) {
          grid[q + globals.QDIM][r + globals.RDIM] = new Hex(q, r, HEXSIZE);
        }
      }
    }


    var frequency = 30;
    // Update Loop
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
    if(Math.abs(hexClicked.q) <= globals.QDIM 
      && Math.abs(hexClicked.r) <= globals.RDIM 
      && Math.abs(hexClicked.q + hexClicked.r) <= globals.QDIM) {
      gameCamera.moveX(canvas.width / 2 - mapCoord.x);
    gameCamera.moveY(canvas.height / 2 - mapCoord.y);

    } else {    // Outside minimap
      var gameCoord = gameCamera.antiTransform(mouse.x, mouse.y);
      hexClicked = pixelToHex(gameCoord.x, gameCoord.y, HEXSIZE);
      if(Math.abs(hexClicked.q) <= globals.QDIM    // Case inside grid
        && Math.abs(hexClicked.r) <= globals.RDIM 
        && Math.abs(hexClicked.q + hexClicked.r) <= globals.QDIM) {
        var currentHex = grid[hexClicked.q + globals.QDIM][hexClicked.r + globals.RDIM];
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
        } else if(grid[hexClicked.q + globals.QDIM][hexClicked.r + globals.RDIM].color == "blue") { // Add new hex
          hexSelected = globals.hexFactory.make(hexClicked.q + globals.QDIM, hexClicked.r + globals.RDIM);
        } else {

        }
        
      }
    }
  });

}

  // Calls draw function of all game assets
  function drawGrid(grid, ctx, camera) {
    for(var q = 0; q <= 2 * globals.QDIM; q++) {
      for(var r = 0; r <= 2* globals.RDIM; r++) {
        // Add hex at axial coordinates in array
        if(Math.abs(q - globals.QDIM + r - globals.RDIM) <= globals.QDIM) {
          grid[q][r].draw(ctx, camera);
        }
      }
    }
  }
}()); 