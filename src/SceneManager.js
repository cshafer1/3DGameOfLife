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

window.onload = function init() {
  // Set up renderer
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setClearColor( 0xffffff, 0);
  document.body.appendChild( renderer.domElement );
  gui_props = { light_posX: 85}

  // Set background
  scene.background = new THREE.TextureLoader().load("../textures/space.jpeg");

  // Set camera
  camera.position.set(50, 50, 50);
  camera.lookAt( 0, 0, 0 );
  controls = new THREE.OrbitControls(camera, renderer.domElement);

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

  // Initialize golMatrix to 3D matrix to represent entries
  // We will need an instanced material to change transparency
  // We create a border layer around the outside of the cube of transparent cubes (need for game rules)
  var colors = []
  var offsets = []
  golMatrix = [];
  for(let i=0; i < 12; i+=1) {
    golMatrix[i] = [];
    for(let j=0; j < 12; j+=1) {
      golMatrix[i][j] = [];
      for(let k=0; k < 12; k+=1) {
        offsets.push(i * 3, j * 3, k * 3);

        // Active game cubes
        if((i != 0 && i != 11) && (k != 0 && k != 11) && (j != 0 && j != 11)) {
          golMatrix[i][j][k] = new Cell(true, 0); // this isn't quite right - need to put # of neighbors in
          colors.push(1.0,0.0,0.0,0.8);
        } 
      
        
        // Border layer
        else {
          golMatrix[i][j][k] = new Cell(false, 0);
          colors.push(1.0,1.0,1.0,0.0); // transparent
        }
      }
    }
  }
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
  const spotLightHelper = new THREE.SpotLightHelper(spotlight);
  scene.add(spotLightHelper)
  scene.add(spotlight);

  // Add GUI
  gui = new dat.GUI({height: 5*32 - 1});
  gui.add(gui_props, "light_posX", 0, 100);

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
  raycaster.setFromCamera( mouse, camera );
  //Dirty for loop to change colors and transparency dynamically, 4000 is the limit
  //Because we made 1000 cubes, and theres 4 color variables per cube.
  for (let i = 0; i < 4000; i += 4) {
    r = Math.random()
    g = Math.random()
    b = Math.random()
    a = Math.random()
    scene.children[0].geometry.attributes.color.array[i] = r;
    scene.children[0].geometry.attributes.color.array[i+1] = g;
    scene.children[0].geometry.attributes.color.array[i+2] = b;
    scene.children[0].geometry.attributes.color.array[i+3] = a;
  }
  scene.children[0].geometry.attributes.color.needsUpdate = true;
  //let intersection = raycaster.intersectObject( mesh, true);

  // console.dir(intersection);

  // if ( intersection.length > 0 ) {

  //   const instanceId = 1; //(interection[0]) ? intersection[0].id : 1000;

  //   const transparentIndex = (instanceId * 4) - 1;

  //   colors[transparentIndex] = (colors[transparentIndex] == 0) ? 1 : 0;
  // }
  // scene.children[0].geometry.attributes.color.needsUpdate = true;

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

  var tempGol = golMatrix;
  var old_cell;
  var index = 1;

  // For each cell, check conditions as defined by rules
  // Update if cell is alive and neighbors' neighbor count accordingly
  for(let i=1; i < 11; i+=1) {
    for(let j=1; j < 11; j+=1) {
      for(let k=1; k < 11; k+=1) {
        old_cell = golMatrix[i][j][k];
        
        // Death Condition
        if(old_cell.alive && (old_cell.neighbors < e_min || old_cell.neighbors > e_max)) {
          tempGol[i][j][k].die(tempGol, i, j, k);
          scene.children[0].geometry.attributes.color.array[(index * 4) - 1] = 0.0; // make cube transparent

        } 
        // Acitvation Condition
        else if (!old_cell.alive && old_cell.neighbors >= f_min && old_cell.neighbors <= f_max) {
          tempGol[i][j][k].activate(tempGol, i, j, k);
          scene.children[0].geometry.attributes.color.array[(index * 4) - 1] = 1.0; // make cube visible

        }
        index += 1;
     }
   }
 }

  scene.children[0].geometry.attributes.color.needsUpdate = true;
  golMatrix = tempGol;
}

function updateNeighbors(tempGol, i, j, k) {
  // Update neighbor counts of new matrix
  for(let x=-1; x <= 1; x+=1) {
    for(let y=-1; y <= 1; y+=1) {
      for(let z=-1; z <= 1; z+=1) {
        if(x == 0 && y == 0 && z == 0) continue;
        tempGol[i+x][j+y][k+z].neighbors += tempGol[i][j][k].alive ? 1 : -1;
      }
    }
  }
}

function animate() {
	requestAnimationFrame( animate );

  gameOfLife(4555);
  spotlight.position.x = gui_props.light_posX;
  controls.update();
	renderer.render( scene, camera );
}

//
//  Cell Class
//  Represents a cell within the 3D grid
//  parameters:
//    boolean alive
//
class Cell {
  constructor(alive, neighbors) {
    this.alive = alive;
    this.neighbors = neighbors;
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
