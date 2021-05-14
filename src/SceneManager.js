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
  camera.position.set(50, 50, 50);
  camera.lookAt( 0, 0, 0 );
  controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Initialize geometry
  const vertices = [
    // front
    { pos: [-1, -1,  1], norm: [ 0,  0,  1], uv: [0, 0], },
    { pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 0], },
    { pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 1], },
   
    { pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 1], },
    { pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 0], },
    { pos: [ 1,  1,  1], norm: [ 0,  0,  1], uv: [1, 1], },
    // right
    { pos: [ 1, -1,  1], norm: [ 1,  0,  0], uv: [0, 0], },
    { pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 0], },
    { pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 1], },
   
    { pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 1], },
    { pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 0], },
    { pos: [ 1,  1, -1], norm: [ 1,  0,  0], uv: [1, 1], },
    // back
    { pos: [ 1, -1, -1], norm: [ 0,  0, -1], uv: [0, 0], },
    { pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 0], },
    { pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 1], },
   
    { pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 1], },
    { pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 0], },
    { pos: [-1,  1, -1], norm: [ 0,  0, -1], uv: [1, 1], },
    // left
    { pos: [-1, -1, -1], norm: [-1,  0,  0], uv: [0, 0], },
    { pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 0], },
    { pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 1], },
   
    { pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 1], },
    { pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 0], },
    { pos: [-1,  1,  1], norm: [-1,  0,  0], uv: [1, 1], },
    // top
    { pos: [ 1,  1, -1], norm: [ 0,  1,  0], uv: [0, 0], },
    { pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 0], },
    { pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 1], },
   
    { pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 1], },
    { pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 0], },
    { pos: [-1,  1,  1], norm: [ 0,  1,  0], uv: [1, 1], },
    // bottom
    { pos: [ 1, -1,  1], norm: [ 0, -1,  0], uv: [0, 0], },
    { pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 0], },
    { pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 1], },
   
    { pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 1], },
    { pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 0], },
    { pos: [-1, -1, -1], norm: [ 0, -1,  0], uv: [1, 1], },
  ];
  const positions = [];
  const normals = [];
  const uvs = [];
  for (const vertex of vertices) {
    positions.push(...vertex.pos);
    normals.push(...vertex.norm);
    uvs.push(...vertex.uv);
  }

  const geometry = new THREE.InstancedBufferGeometry();
  
  const positionNumComponents = 3;
  const normalNumComponents = 3;
  const uvNumComponents = 2;

  geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new THREE.Float32BufferAttribute(positions, positionNumComponents))); 
  geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new THREE.Float32BufferAttribute(normals, normalNumComponents)));
  geometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(new THREE.Float32BufferAttribute(uvs, uvNumComponents)));

 
  // Create an instance of a cube
  function makeInstance(geometry, color, x, y, z) {
    const material = new THREE.MeshPhongMaterial({color}); // set transparency here based on whether cube is active in golMatrix

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;

    return cube;
  }

  let cubes = [];
  // Initialize golMatrix to 3D matrix to represent entries
  // We will need an instanced material to change transparency
  golMatrix = [];
  for(let i=0; i < 10; i+=1) {
    golMatrix[i] = [];
    for(let j=0; j < 10; j+=1) {
      golMatrix[i][j] = [];
      for(let k=0; k < 10; k+=1) {
        golMatrix[i][j][k] = new Cell(true);

        // Create actual cells
        cubes.push(makeInstance(geometry, 0xffffff, i * 3, j * 3, k * 3));
      }
    }
  }

  scene.add( mesh );
  
  // Add lighting
  spotlight = new THREE.SpotLight(0xffffff, 1.5);
  spotlight.position.set(-50, 50, 50);
  spotlight.castShadow = true;
  scene.add(spotlight);

  // Add GUI
  gui = new dat.GUI({height: 5*32 - 1});
  gui.add(gui_props, "light_posX", 0, 10);

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

  let intersection = raycaster.intersectObject( mesh, true);

  console.dir(intersection);

  // if ( intersection.length > 0 ) {

  //   const instanceId = intersection[0].instanceId;

  //   mesh.setColorAt( instanceId, color.setHex(0x000000) );
  //   mesh.instanceColor.needsUpdate = true;

  // }
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
