/* 3D Game of Life
   CSE 40166 Final Project
*/
// Global Constants
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const color = new THREE.Color();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2( 1, 1 );

// Global Variables
var golMatrix;
var materials = [];
var controls;
var gui;
var gui_props;
var spotlight;
var mesh;
var time = 0;
var parameters;
var running = true;
var type = "donut";


window.onload = function init() {
  // Set up renderer
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0xffffff, 0);
  document.body.appendChild( renderer.domElement );
  gui_props = { light_posX: 85,
                generation_time: 1.0,
		}

  // Set background
  scene.background = new THREE.TextureLoader().load("../textures/space.jpeg");

  // Set camera
  camera.position.set(50, 50, 50);
  camera.lookAt( 0, 0, 0 );
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  //controls.autoRotate = true;
  // Initialize geometry sorted by x,y,z,w,u,v,s,t, normalized data not needed.
  const vertexBuffer = new THREE.InterleavedBuffer( new Float32Array( [
				// Front
				- 1, 1, 1, 0, 0, 0, 0, 0,
				1, 1, 1, 0, 1, 0, 0, 0,
				- 1, - 1, 1, 0, 0, 1, 0, 0,
				1, - 1, 1, 0, 1, 1, 0, 0,
				// Back
				1, 1, - 1, 0, 1, 0, 0, 0,
				- 1, 1, - 1, 0, 0, 0, 0, 0,
				1, - 1, - 1, 0, 1, 1, 0, 0,
				- 1, - 1, - 1, 0, 0, 1, 0, 0,
				// Left
				- 1, 1, - 1, 0, 1, 1, 0, 0,
				- 1, 1, 1, 0, 1, 0, 0, 0,
				- 1, - 1, - 1, 0, 0, 1, 0, 0,
				- 1, - 1, 1, 0, 0, 0, 0, 0,
				// Right
				1, 1, 1, 0, 1, 0, 0, 0,
				1, 1, - 1, 0, 1, 1, 0, 0,
				1, - 1, 1, 0, 0, 0, 0, 0,
				1, - 1, - 1, 0, 0, 1, 0, 0,
				// Top
				- 1, 1, 1, 0, 0, 0, 0, 0,
				1, 1, 1, 0, 1, 0, 0, 0,
				- 1, 1, - 1, 0, 0, 1, 0, 0,
				1, 1, - 1, 0, 1, 1, 0, 0,
				// Bottom
				1, - 1, 1, 0, 1, 0, 0, 0,
				- 1, - 1, 1, 0, 0, 0, 0, 0,
				1, - 1, - 1, 0, 1, 1, 0, 0,
				- 1, - 1, - 1, 0, 0, 1, 0, 0
			] ), 8 );

  const geometry = new THREE.InstancedBufferGeometry();
  
  //Positions for cubes loaded from vertexBuffer, 3 data points, starting at position 0.
  const positions = new THREE.InterleavedBufferAttribute(vertexBuffer, 3, 0);
  //UV coords for cubes, 2 data points, starting at position 4.
  const uvs = new THREE.InterleavedBufferAttribute(vertexBuffer, 2, 4);
  geometry.setAttribute('position', positions);
  geometry.setAttribute('uv', uvs);
  const indices = new Uint8Array( [
				0, 2, 1,
				2, 3, 1,
				4, 6, 5,
				6, 7, 5,
				8, 10, 9,
				10, 11, 9,
				12, 14, 13,
				14, 15, 13,
				16, 17, 18,
				18, 17, 19,
				20, 21, 22,
				22, 21, 23
			] );

	geometry.setIndex(new THREE.BufferAttribute(indices, 1));


  // // Initialize golMatrix to 3D matrix to represent entries
  // // We will need an instanced material to change transparency
  // // We create a border layer around the outside of the cube of transparent cubes (need for game rules)
  var cubeData = newDonutGame();
  var colors = cubeData[0];
  var offsets = cubeData[1];

  colorAttr = new THREE.InstancedBufferAttribute(new Float32Array(colors), 4);
  colorAttr.dynamic = true;
  //Send data to the shader.
  geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
  geometry.setAttribute('color', colorAttr);

  //Create a basic material
  const phongMaterial = new THREE.MeshPhongMaterial({
    flatShading: true,
    transparent: true
  });
  //Modify the shader of the basic material before it is compiled.
  phongMaterial.onBeforeCompile = function( shader ) {
    shader.vertexShader = `
      varying vec4 vColor;\n
      attribute vec3 offset;\n
      attribute vec4 color;\n
      ${shader.vertexShader}
    `.replace("#include <begin_vertex>",`
      vec3 transformed = vec3(position + offset);\n
      vColor = color;
    `)
    shader.fragmentShader = `
      varying vec4 vColor;\n
      ${shader.fragmentShader}
    `.replace("vec4 diffuseColor = vec4( diffuse, opacity );", `
        vec4 diffuseColor = vec4(mix(diffuse, vColor.rgb, vColor.a), vColor.a);
      `)
  }
  mesh = new THREE.Mesh(geometry, phongMaterial);
  scene.add(mesh);

  // Add lighting
  spotlight = new THREE.SpotLight(0xffffff, 1.5);
  spotlight.position.set(40,20,15);
  spotlight.castShadow = true;
  scene.add(spotlight);

  // Add GUI
  gui = new dat.GUI({height: 5*32 - 1});
  gui.add(gui_props, "light_posX", 0, 100);
  gui.add(gui_props, "generation_time", 0, 3);
  parameters = {
    is_cube: true,
    is_sphere: false,
    is_donut: false,
    stop: false
  }
  gui.add(parameters, "is_cube").name('Cube').listen().onChange(function(){
    setChecked("is_cube");
    type = "cube";
    running = true;
    cubeData = newCubeGame();
    colors = cubeData[0];
    offsets = cubeData[1];
    colorAttr = new THREE.InstancedBufferAttribute(new Float32Array(colors), 4);
    colorAttr.dynamic = true;
    //Send data to the shader.
    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    geometry.setAttribute('color', colorAttr);
    requestAnimationFrame(animate);
  });
  gui.add(parameters, "is_sphere").name('Sphere').listen().onChange(function(){
    setChecked("is_sphere");
    type = "sphere";
    running = true;
    cubeData = newSphereGame();
    colors = cubeData[0];
    offsets = cubeData[1];
    colorAttr = new THREE.InstancedBufferAttribute(new Float32Array(colors), 4);
    colorAttr.dynamic = true;
    //Send data to the shader.
    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    geometry.setAttribute('color', colorAttr);
    requestAnimationFrame(animate);
  });
  gui.add(parameters, "is_donut").name('Donut').listen().onChange(function(){
    setChecked("is_donut");
    type = "donut";
    running = true;
    cubeData = newDonutGame();
    colors = cubeData[0];
    offsets = cubeData[1];
    colorAttr = new THREE.InstancedBufferAttribute(new Float32Array(colors), 4);
    colorAttr.dynamic = true;
    //Send data to the shader.
    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    geometry.setAttribute('color', colorAttr);
    requestAnimationFrame(animate);
  }); 
  gui.add(parameters, "stop").name('Stop').listen().onChange(function(){
    running = !running;
    setChecked("stop");
  }); 

  
  function setChecked( prop ){
 
   for (let param in parameters){ 
	 parameters[param] = false;
  }
    parameters[prop] = true;
  }
  // Add event listeners
  window.addEventListener( 'resize', onWindowResize );
  document.addEventListener( 'mousemove', onMouseMove );
  document.addEventListener( 'click', onClick );

  animate();
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function onMouseMove( event ) {

  event.preventDefault();

  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
 
}

function onClick() {
  controls.update();
}

function newCubeGame() {
  var colors = [];
  var offsets = [];

  var tmpIndex = 0;
  golMatrix = [];
  for(let i=0; i < 12; i+=1) {
    golMatrix[i] = [];
    for(let j=0; j < 12; j+=1) {
      golMatrix[i][j] = [];
      for(let k=0; k < 12; k+=1) {
        offsets.push(i * 3, j * 3, k * 3);

        // Active game cubes
        if((i != 0 && i != 11) && (k != 0 && k != 11) && (j != 0 && j != 11)) {

          var rand_bool = Math.random() < 0.2;
          golMatrix[i][j][k] = new Cell(rand_bool, 0, tmpIndex);
          
          if(rand_bool)
            colors.push(1.0,0.0,0.0,0.8);
          else {
            colors.push(1.0,0.0,0.0,0.0); // transparent
          }
          tmpIndex += 4;
        }
        // Border layer
        else {
          golMatrix[i][j][k] = new Cell(false, 0, tmpIndex);
          tmpIndex += 4;
          colors.push(1.0,1.0,1.0,0.0); // transparent
        }
      }
    }
  }
  resetAllNeighbors(golMatrix);

  return [ colors, offsets ]
}

function newSphereGame() {
  var colors = [];
  var offsets = [];
  var icount = 0;
  var tmpIndex = 0;
  golMatrix = [];
  var jcount = 0;
  var kcount = 0;
  for(let i=0; i < 16; i+=1) {
	console.log("JCOUNT", jcount);
       if(jcount < 8){
   		icount++;
	}else{

		icount--;
	}
    golMatrix[i] = [];

    for(let j=0; j < 16; j+=1){

      golMatrix[i][j] = [];
      for(let k=0; k < 12; k+=1) {

	 	 if(jcount < 10){
                kcount++;
        }else{
                console.log(kcount);
                kcount--;
	}

       	 offsets.push(icount * 3 , -jcount * 3  , 3*k/icount);
	 offsets.push(-icount * 3 , jcount * 3  , -3*k/icount);
	  offsets.push(-icount * 3 , -jcount * 3  , -3*k/icount);
	  offsets.push(-icount * 3 , jcount * 3  ,-3*k/icount);
	  offsets.push(-icount * 3 , jcount * 3  ,-3*k/jcount);
	//offsets.push(icount * 3, icount * 3 , -jcount * (i));
	
	//offsets.push(i * 3, jcount *3 , icount * 3);
	//offsets.push(i * 3, jcount *3 , icount * 3);
        // Active game cubes
	
 	if((i != 0 && i != 11) && (k != 0 && k!= 11) && (j != 0 && j != 11)) {
          var rand_bool = Math.random() < 0.2;
          golMatrix[i][j][k] = new Cell(rand_bool, 0, tmpIndex);
          
          if(rand_bool){ 
 	  //  for(let m = 0; m<=icount; m+=1){
		console.log("adding");
                 colors.push(1.0,0.0,0.0,0.8);
		colors.push(1.0,0.0,0.0,0.8);
		 colors.push(1.0,0.0,0.0,0.8);
		
	  //}
        }  else {
            colors.push(1.0,0.0,0.0,0.0); // transparent
          }
          tmpIndex += 4;
        }
        // Border layer
        else {
          golMatrix[i][j][k] = new Cell(false, 0, tmpIndex);
          tmpIndex += 4;
          colors.push(1.0,1.0,1.0,0.0); // transparent
        }
      }

    }
 	jcount++;
  }


  resetAllNeighbors(golMatrix, "cube");

 // resetAllNeighbors(golMatrix);


  return [ colors, offsets ]
}

function newDonutGame() {
  var colors = [];
  var offsets = [];

  var x_scalar = -1
  var z_scalar = 1

  var tmpIndex = 0;
  golMatrix = [];
  for(let i=0; i < 12; i+=1) {
    golMatrix[i] = [];
    for(let j=0; j < 12; j+=1) {
      golMatrix[i][j] = [];

      x_scalar = 1
      z_scalar = 1


      for(let k=0; k < 25; k+=1) {
       	  offsets.push(i * 3, j * 3, Math.sqrt(625 - Math.pow(i*3, 2)));
        offsets.push(i * 3, j * 3, -1 * Math.sqrt(625 - Math.pow(i*3, 2)));
        offsets.push(-1 * i * 3, j * 3, Math.sqrt(625 - Math.pow(i*3, 2)));
        offsets.push(-1 * i * 3, j * 3, -1 * Math.sqrt(625 - Math.pow(i*3, 2)));

      for(let k=0; k < 48; k+=1) {

        if(k == 12) {
          x_scalar = 1
          z_scalar = -1
        } else if(k == 24) {
          x_scalar = -1
          z_scalar = 1
        } else if(k == 36) {
          x_scalar = -1
          z_scalar = -1
        }

        offsets.push(x_scalar * i * 3, j * 3, z_scalar * Math.sqrt(1089 - Math.pow(i*3, 2)));


        // Active game cubes
          var rand_bool = Math.random() < 0.2;
          golMatrix[i][j][k] = new Cell(rand_bool, 0, tmpIndex);
          
          if(rand_bool) {
            colors.push(0.8,0.0,0.0,0.8);
            colors.push(0.8,0.0,0.0,0.8);
            colors.push(0.8,0.0,0.0,0.8);
            colors.push(0.8,0.0,0.0,0.8);
          } else {
            colors.push(1.0,0.0,0.0,0.0); // transparent
            colors.push(1.0,0.0,0.0,0.0); // transparent
            colors.push(1.0,0.0,0.0,0.0); // transparent
            colors.push(1.0,0.0,0.0,0.0); // transparent
          }
          tmpIndex += 4;
      }
    }
  }
  resetAllNeighbors(golMatrix);

  return [ colors, offsets ]
}

function gameOfLife(ruleset) {
  
  var e_min, e_max;
  var f_min, f_max;

  // Set rules based on current ruleset
  if(ruleset == 4555) {
    e_min = 4;
    e_max = 5;
    f_min = 5;
    f_max = 5;
  } else if (ruleset == 5766) {
    e_min = 5;
    e_max = 7;
    f_min = 6;
    f_max = 6;
  }
  resetAllNeighbors(golMatrix);
  var tempGol = golMatrix;
  var old_cell;
  var index;
 //spotlight.position.x = gui_props.light_posX; 

  // For each cell, check conditions as defined by rules
  // Update if cell is alive and neighbors' neighbor count accordingly

  for(let i=1; i < 11; i+=1) {
    for(let j=1; j < 11; j+=1) {
      for(let k=1; k < 47; k+=1) {
        old_cell = golMatrix[i][j][k];
        // Death Condition
        if(old_cell.alive && (old_cell.neighbors < e_min || old_cell.neighbors > e_max)) {
          tempGol[i][j][k].die(tempGol, i, j, k);
          index = old_cell.index;
          scene.children[0].geometry.attributes.color.array[index + 3] = 0.0; // make cube transparent
        }
        // Acitvation Condition
        else if (!old_cell.alive && old_cell.neighbors >= f_min && old_cell.neighbors <= f_max) {
          tempGol[i][j][k].activate(tempGol, i, j, k);
          index = old_cell.index;
         	scene.children[0].geometry.attributes.color.array[index + 3] = 0.8; // make cube visible 
	      }
      }
    }
  }
  scene.children[0].geometry.attributes.color.needsUpdate = true;
  golMatrix = tempGol;
}

function resetAllNeighbors(golMatrix) {
  if(type == "cube") {
    for(let i=1; i < 11; i+=1) {
      for(let j=1; j < 11; j+=1) {
        for(let k=1; k < 11; k+=1) {
          updateNeighbors(golMatrix, i, j, k);
        }
      }
    }
  } else if (type == "donut") {
    // Update Neighbors
    for(let i=0; i < 11; i+=1) {
      for(let j=1; j < 11; j+=1) {
        for(let k=1; k < 46; k+=1) {
          if(i == 0 || i == 10)
            continue //updateDonutEdgeNeighbors(golMatrix, i, j, k);
          else
            updateNeighbors(golMatrix, i, j, k);
        }
      }
    }
  }
}

function updateNeighbors(tempGol, i, j, k) {
  // Update neighbor counts of new matrix
  var neighbors = 0;
  for(let x=-1; x <= 1; x+=1) {
    for(let y=-1; y <= 1; y+=1) {
      for(let z=-1; z <= 1; z+=1) {
        if(x == 0 && y == 0 && z == 0) continue;
        neighbors += tempGol[i+x][j+y][k+z].alive;
        tempGol[i][j][k].neighbors = neighbors;
      }
    }
  }
}

// function updateDonutEdgeNeighbors(tempGol, i, j, k) {
//   // Update neighbor counts of new matrix
//   var neighbors = 0;
//   for(let x=-1; x <= 1; x+=1) {
//     if(i == 0 && x == -1) x = 11;
//     if(i == 11 && x == 1) x = -11;

//     for(let y=-1; y <= 1; y+=1) {
//       for(let z=-1; z <= 1; z+=1) {
//         if(x == 0 && y == 0 && z == 0) continue;
//         neighbors += tempGol[i+x][j+y][k+z].alive;
//         tempGol[i][j][k].neighbors = neighbors;
//       }
//     }

//     if(i == 0 && x == 11) x = -1;
//     if(i == 11 && x == -11) x = 1;
//   }
// }

function animate(delta) {
	if(running) requestAnimationFrame( animate );
  delta_secs = delta * 0.001;
  if(delta_secs - time > gui_props.generation_time){
    gameOfLife(4555);
    time = delta_secs;
  }


  spotlight.position.x = gui_props.light_posX;
  controls.update();
	renderer.render( scene, camera );
}
/*Shape functions*/
//function to draw generic torus
function drawTorus(r, sr, num_fac, section_num_face) 
//radius, section radius, number of faces, number of faces on each section
{


  var vert = new Array();
 
  // Iterates along the big circle and then around a section
  for(var i=0;i<n;i++)               // Iterates over all strip rounds
   {
     for(var j=0;j<sn+1*(i==n-1);j++) // Iterates along the torus section
     {
        //angles
        var a =  2*Math.PI*(i+j/section_num_face+k)/n;
        var sa = 2*Math.PI*j/section_num_face;
        var x, y, z;
 
        // Coordinates on the surface of the torus
        vert.push(x = (r+sr*Math.cos(sa))*Math.cos(a)); // X
        vert.push(y = (r+sr*Math.cos(sa))*Math.sin(a)); // Y
        vert.push(z = sr*Math.sin(sa));                 // Z
      
       }
   }
  // Converts and returns array
  var obj = new Object();
  obj.vertices = new Float32Array(vert);
  obj.colors = new Float32Array(col);
  return obj;
}

function drawSphere(radius){
    var vertices = new Array();		
    var increment = Math.PI/36;

    for (var theta = 0.0; theta < Math.PI*2 - increment; theta += increment){
        if(theta == 0.0){
            vertices.push(vec2(Math.cos(theta)*radius, Math.sin(theta)*radius));
        }
        vertices.push(vec2(Math.cos(theta+increment)*radius, Math.sin(theta+increment)*radius));
    }
    //return array
    var obj = new Object();
    obj.vertices = new Float32Array(vertices);
    return obj;
}

//
//  Cell Class
//  Represents a cell within the 3D grid
//  parameters:
//    boolean alive
//
class Cell {
  constructor(alive, neighbors, index) {
    this.alive = alive;
    this.neighbors = neighbors;
    this.index = index;
    //this.outofbounds = outofbounds;
  }

  die(tempGol, i, j, k) {
    this.alive = false;
    updateNeighbors(tempGol, i, j, k);
  }

  activate(tempGol, i, j, k) {
    this.alive = true;
    updateNeighbors(tempGol, i, j, k);
  }
}
