//set up scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d0ff); // bg

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
console.log("added it!")
// Lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(100, 100, 100).normalize();
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

let terrainParams = {
  width: 200,
  height: 200,
  segments: 199,
  noiseScale: 50,
  noiseAmplitude: 25,
};

let terrain;

// Function to generate terrain
function generateTerrain() {
  if (terrain) {
    // rem if exxist
    scene.remove(terrain);
    terrain.geometry.dispose();
    terrain.material.dispose();
    terrain = undefined;
  }

  // Geometry and Material
  const geometry = new THREE.PlaneGeometry(
    terrainParams.width,
    terrainParams.height,
    terrainParams.segments,
    terrainParams.segments
  );
  geometry.rotateX(-Math.PI / 2);

  const colors = [];

  // Noise
  const simplex = new SimplexNoise();

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const y =
      simplex.noise2D(
        x / terrainParams.noiseScale,
        z / terrainParams.noiseScale
      ) * terrainParams.noiseAmplitude;
    position.setY(i, y);

    //  color based on height
    const color = new THREE.Color();
    if (y < terrainParams.noiseAmplitude * 0.3) {
      color.setHex(0x228b22); // ForestGreen
    } else if (y < terrainParams.noiseAmplitude * 0.6) {
      color.setHex(0x8b4513); // SaddleBrown
    } else {
      color.setHex(0xffffff); // White (snow)
    }
    colors.push(color.r, color.g, color.b);
  }

  //  color
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
  });

  terrain = new THREE.Mesh(geometry, material);
  scene.add(terrain);
}

generateTerrain();

// Camera Position
camera.position.set(0, 50, 100);
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

const gui = new dat.GUI();

gui.add(terrainParams, "width", 50, 300).step(1);
gui.add(terrainParams, "height", 50, 300).step(1);
gui.add(terrainParams, "segments", 10, 500).step(1);
gui.add(terrainParams, "noiseScale", 10, 100).step(1);
gui.add(terrainParams, "noiseAmplitude", 5, 50).step(1);
gui.add({ regenerate: generateTerrain }, "regenerate");
