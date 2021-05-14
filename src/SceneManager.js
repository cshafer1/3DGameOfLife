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
  gui_props = { light_posX: 55}

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

  var colors = []
  var offsets = []
  golMatrix = [];
  var index = 0;
  for(let i=0; i < 10; i+=1) {
    golMatrix[i] = [];
    for(let j=0; j < 10; j+=1) {
      golMatrix[i][j] = [];
      for(let k=0; k < 10; k+=1) {
        golMatrix[i][j][k] = new Cell(true);
        offsets.push(i * 3, j * 3, k * 3);
        colors.push(1.0,0.0,0.0,0.8);
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
  const mesh = new THREE.Mesh(geometry, phongMaterial);
  scene.add(mesh);
  let cubes = [];
  // Initialize golMatrix to 3D matrix to represent entries
  // We will need an instanced material to change transparency




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

  //console.dir(intersection);

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
