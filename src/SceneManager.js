// Global Constants
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 150, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
const cube_geometry = new THREE.BoxGeometry();

// Global Variables
var golMatrix;
var materials = [];
var controls;
var gui;
var gui_props;
var spotlight;

window.onload = function init() {
  // Set up renderer
  renderer.setSize(  2400, 1800 );
  document.body.appendChild( renderer.domElement );
  gui_props = {light_posX:5}
  // Set background
  scene.background = new THREE.TextureLoader().load("../textures/space.jpeg");

  // Set camera
  camera.position.set(0, 0, 5);
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  // Initialize materials
  colors = [
    0xffffff,
    0x8bedd9,
    0xa58bed,
    0xed8bb1,
    0xeddb8b
  ]
  for(color of colors) {
    materials.push(new THREE.MeshPhongMaterial( { color: color, specular: 0xffffff, shininess: 10, flatShading: false } ));
  }

  // Initialize golMatrix to 3D matrix to represent entries
  // 100 x 100 x 100
  // We can add more potentially as a buffer area where cells slowly fade (gliders and such)
  golMatrix = [];
  for(let i=0; i < 5; i+=1) {
    golMatrix[i] = [];
    for(let j=0; j < 5; j+=1) {
      golMatrix[i][j] = [];
      for(let k=0; k < 5; k+=1) {
        // we will need to change the way we grab materials upon scaling up size of matrix
        // using 5 x 5 x 5 for testing
        golMatrix[i][j][k] = new Cell(i, j, k, materials[k], true);
      }
    }
  }

  // Add lighting
  const light = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(light);
  spotlight = new THREE.SpotLight(0xffffff, 1.5);
  spotlight.position.set(5,0,2);
  spotlight.castShadow = true;
  scene.add(spotlight);
  gui = new dat.GUI({height: 5*32 - 1});
  gui.add(gui_props, "light_posX", 0, 10);
  animate();
}

function gameOfLife() {

}

function animate() {
	requestAnimationFrame( animate );

  for(let i=0; i < 5; i+=1) {
    for(let j=0; j < 5; j+=1) {
      for(let k=0; k < 5; k+=1) {
        golMatrix[i][j][k].draw();
      }
    }
  }
  spotlight.position.x = gui_props.light_posX;
  controls.update();
	renderer.render( scene, camera );
}

//
//  Cell Class
//  Represents a cell within the 3D grid
//  parameters:
//    int x, y, z
//    material material
//    boolean alive
//
class Cell {
  constructor(x, y, z, material, alive) {

    var geometry = cube_geometry;
    // TODO: fix geometry so cubes render in proper locations
    // use x, y, z to calculate proper position
    //geometry = geometry.translate( 0.0125 * x, 0.0125 * y, 0.0125 * z);
    var cube = new THREE.Mesh( geometry, material );
    cube.receiveShadow = true;

    this.cube = cube;
    this.alive = alive;
  }

  draw() {
    if( this.alive ) scene.add( this.cube );
  }
}
