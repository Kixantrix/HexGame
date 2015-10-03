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
    globals.moves = 0;
    globals.unitsToPlace = 0;
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
      'count': 0
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
      ctx.fillText("Hexes to Place: " + globals.unitsToPlace + "  Moves: " + globals.moves, 0, 20);
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
          /*&& gridunitsToPlace > 0*/) {    
          currentHex.color = "blue";
          //unitsToPlace--;
        } else if(currentHex.cost != Infinity // Empty spot, something selected. Try to move.
          && globals.hexSelected != null 
          /*&& gridunitsToPlace > 0*/) { 
          // Find all adjacent Hexes
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