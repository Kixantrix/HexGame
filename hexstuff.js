 "use strict";
 (function() {

  var QDIM = 9;             // Number of elements along one side of q axis
  var RDIM = 9;             // Number of elements along one side of r axis
  var DEFAULT_DEPTH = 100;  // Default z position of camera
  
  var SIDEQ = [1, 0, -1, -1, 0, 1]; // Offsets of each neighboring hex
  var SIDER = [0, 1, 1, 0, -1, -1]; 

  var factory = new hexFactory();
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

    var FPS = 30;
    // Game Loop
    setInterval(function() {
      update();
      draw()
    }, 1000/FPS);

    // Updates things...
    function update() {
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight;    
      mapCamera.moveY(window.innerHeight - 200);
    }

    // Draw things
    function draw() {
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
          var path =  new Path(hexSelected, adjacentHexes);
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
    console.log(qDif + " " + rDif);
    for(let coord of adjacentHexes) {
      console.log(coord);
      grid[coord.q][coord.r].color = "white";
      grid[coord.q + qDif + QDIM][coord.r + rDif + RDIM].color = color;
    } 
  }

  // Returns a set of all points of same color provided connected to the hex
  function findAdjacentHexes(q, r, grid) {
    var fringe = {};
    var known  = {};
    var adjacentHexes = {};
    var firstPoint = new hexPoint(q,r);
    fringe[firstPoint.toString()] = firstPoint;

    /*
    var fringe = new Set();                   // Hexes to be examined
    var known  = new Set();                   // Hexes already examined
    var adjacentHexes = new Set();            // Contents of set
    
    console.log("current index" + q + " " + r);
    */
    var color = grid[q][r].color;             // Color we are looking for
    //fringe.add(factory.make(q,r));            // Start with node passed in.
    
    while(fringe.size != 0) {                 // While fringe is not empty
      for(let item of fringe) {               // Iterate through fringe
        var currentHex = grid[item.q][item.r];
        fringe.delete(item);                  // Remove item from fringe
        known.add(item);                      // Add item to known set
        //console.log(currentHex); 
        if(currentHex.color == color) {       // Add same color to adjacent set
          adjacentHexes.add(item);            
          //console.log(item);
          var neighbors = getNeighbors(item);
          // Add each neighbors which is not already known.
          for(var i = 0; i < neighbors.length; i++) {
            if(!known.has(neighbors[i])) {  
              console.log(known.size);
              fringe.add(neighbors[i]);
            }
          } 
        }
      }
    }  

    //console.log(adjacentHexes);
    return adjacentHexes;
  }

  // Returns an array of Hexpoints corresponding to all hexes which
  function getNeighbors(centerHex) {     
    var neighbors = [];
    //console.log(centerHex);     // /Iterate through all size potential neighbors and test if they are within grid.     
    for(var i = 0; i < 6; i++) {
      //console.log(centerHex.q + SIDEQ[i] + centerHex.r + SIDER[i]);
      if(Math.abs(centerHex.q + SIDEQ[i] + centerHex.r + SIDER[i]) <= 2 * QDIM) {
        neighbors.push(factory.make(centerHex.q + SIDEQ[i], centerHex.r + SIDER[i]));
      }  
    }
    console.log(neighbors);
    return neighbors;
    
  }

  // Returns attack of hex equal to nunmber of hexes fo the same color radiating from the first 
  // Hexpoint in the hexPoint direction passed in.
  function getAttack(q, r, direction, grid, color) {
    if((hex[q][r] && hex[q][r].color == color)) {
      return 1 + getAttack(q + direction.q , r + direction.r, direction, grid, color);  
    } else {
      return 0;
    }
  }


  function Path(hexSelected, adjacentHexes) {
    this.exists = true;
    this.cost = 0;
  }

  // Camera for game
  function camera(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;

    // Applies camera transformations from x y positions to camera
    // Positions
    this.transform = function(x, y) {
      return new point(x * this.getZScale() + this.x, 
        y * this.getZScale() + this.y);
    }

    // Retreives original coordinates before transformation 
    this.antiTransform = function(x, y) {
      return new point((x - this.x) / this.getZScale(), (y - this.y) / this.getZScale());
    }    

    // Returns a scaling factor for size of items on 2d plane based on z index.
    this.getZScale = function() {
      return 1.0 * DEFAULT_DEPTH / z;
    }

    // Changes X position
    this.moveX = function(x) {
      this.x = x;
    }

    // Changes Y position
    this.moveY = function(y) {
      this.y = y;
    }

    // Changes Z position
    this.moveZ = function(z) {
      this.z = z;
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
      this.corners[i] = new hexCorner(size, i);
    }

    // Returns a point containing the center x and y coordinates of the hexagon
    this.getCenter = function() {
      var x = this.size * Math.sqrt(3) * (this.q + this.r/2);
      var y = this.size * 3.0 / 2 * this.r;
      return new point(x,y);
    }

    // Draws the hexagon at these coordinates
    this.draw = function(ctx, camera) {
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
  function hexCorner(size, i) {
    var angleDeg = 60 * i + 90;
    this.angle   = Math.PI * angleDeg / 180;
    this.cos = Math.cos(this.angle);
    this.sin = Math.sin(this.angle);
  }

  // Creates a point
  function point(x, y) {
    this.x = x;
    this.y = y;
  }

  // Creates a point in hex coordinates
  function hexPoint(q, r) {
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

  // Dynamically resizing factory with which we mage hexPoints
  function hexFactory() {
    
    this.points = [];
    for(var i = 0; i < 4 * QDIM; i++) {
      this.points[i] = [];
    }

    // Resizing points array as necessary
    this.make = function(q,r) {
      /*
      // Resize to at least 1 passed in
      for(var i = this.points.length; i < q + this.points.length; i++) {
        this.points[i] = [];
      }
      */
      // create new point if it doesn't exist
      if(q <= 2 * QDIM && r <= 2 * RDIM && q > -2 * QDIM && r > -2 * RDIM ) {
        if(this.points[q +2 *  QDIM][r + 2 * RDIM] == null) {
          this.points[q + 2 * QDIM][r + 2 * RDIM] = new hexPoint(q, r);
        }
        return this.points[q + 2 * QDIM][r + 2 * RDIM];
      } else {
        return new hexPoint(q, r);
      }   
    }
    
  }
}()); 