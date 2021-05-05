const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer();
var cube;
window.onload = function init() {
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  scene.background = new THREE.Color(0.2, 0.1, 0.1);
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshPhongMaterial( { color: 0x2222FF, specular: 0xffffff, shininess: 10, flatShading: false }  );
  cube = new THREE.Mesh( geometry, material );
  cube.receiveShadow = true;
  camera.position.set(0, 0, 5);
  scene.add( cube );
  const light = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(light);
  const spotlight = new THREE.SpotLight(0xffffff, 1.5);
  spotlight.position.set(5,0,2);
  spotlight.castShadow = true;
  scene.add(spotlight);

  animate();
}


function animate() {
	requestAnimationFrame( animate );
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
	renderer.render( scene, camera );
}
