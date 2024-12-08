//set up scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
console.log("Hello World!");

const width = 200;
const height = 200;
const segments = 199;
const maxHeight = 10;

// Geometry and Material
const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
geometry.rotateX(-Math.PI / 2);
const material = new THREE.MeshStandardMaterial({
  color: 0x556b2f,
  wireframe: false,
  flatShading: true,
});
const terrain = new THREE.Mesh(geometry, material);
scene.add(terrain);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(100, 100, 100).normalize();
scene.add(light);
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Noise
const simplex = new SimplexNoise();
const vertices = geometry.attributes.position.array;
for (let i = 0; i < vertices.length; i += 3) {
  const x = vertices[i];
  const z = vertices[i + 2];
  const y = simplex.noise2D(x / 50, z / 50) * maxHeight;
  vertices[i + 1] = y;
}
geometry.computeVertexNormals();

// Camera Position
camera.position.set(0, 20, 50);
camera.lookAt(0, 0, 0);

// Render Loop
function animate() {
  requestAnimationFrame(animate);
  terrain.rotation.y += 0.001;
  renderer.render(scene, camera);
}
animate();


//handle resizes
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
