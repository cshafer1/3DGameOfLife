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
  gui_props = { light_posX: 5}

  // Set background
  scene.background = new THREE.TextureLoader().load("../textures/space.jpeg");

  // Set camera
  camera.position.set(5, 15, 15);
  camera.lookAt( 0, 0, 0 );
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Initialize geometry and material
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshPhongMaterial(); //{opacity: 0.8, transparent: true});

  // Initialize golMatrix to 3D matrix to represent entries
  // We will need an instanced material to change transparency
  mesh = new THREE.InstancedMesh( geometry, material, 1000 );

  let inc = 0;
  const offset = -1.5;

  const matrix = new THREE.Matrix4();

  golMatrix = [];
  for(let i=0; i < 10; i+=1) {
    golMatrix[i] = [];
    for(let j=0; j < 10; j+=1) {
      golMatrix[i][j] = [];
      for(let k=0; k < 10; k+=1) {

        golMatrix[i][j][k] = new Cell(true);

        // Create actual cells
        matrix.setPosition( offset * i, offset * j, offset * k );
  
        mesh.setMatrixAt( inc, matrix );
        mesh.setColorAt( inc, color );
  
        inc++;
      }
    }
  }

  scene.add( mesh );
  
  // Add lighting
  //const light = new THREE.AmbientLight(0xffffff, 0.1);
  //scene.add(light);
  spotlight = new THREE.SpotLight(0xffffff, 1.5);
  spotlight.position.set(-10, 10, 10);
  spotlight.castShadow = true;
  scene.add(spotlight);
  gui = new dat.GUI({height: 5*32 - 1});
  gui.add(gui_props, "light_posX", 0, 10);

  // const light1 = new THREE.HemisphereLight( 0xffffff, 0x000088 );
  // light1.position.set( - 1, 1.5, 1 );
  // scene.add( light1 );

  // const light2 = new THREE.HemisphereLight( 0xffffff, 0x880000, 0.5 );
  // light2.position.set( - 1, - 1.5, - 1 );
  // scene.add( light2 );

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

  let intersection = raycaster.intersectObject( mesh, true);

  console.dir(intersection);

  if ( intersection.length > 0 ) {

    const instanceId = intersection[0].instanceId;

    mesh.setColorAt( instanceId, color.setHex(0x000000) );
    mesh.instanceColor.needsUpdate = true;

  }
}

function gameOfLife() {

}

function animate() {
	requestAnimationFrame( animate );

  // for(let i=0; i < 10; i+=1) {
  //   for(let j=0; j < 10; j+=1) {
  //     for(let k=0; k < 10; k+=1) {
  //
  //     }
  //   }
  // }

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
  constructor(alive) {
    this.alive = alive;
  }
}
