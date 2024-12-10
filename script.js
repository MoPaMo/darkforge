// set up scene
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
console.log("added it!");
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

function generateTerrain() {
  if (terrain) {
    scene.remove(terrain);
    terrain.geometry.dispose();
    terrain.material.dispose();
    terrain = undefined;

    scene.traverse((child) => {
      if (child.isMesh && child.geometry.type === "TextGeometry") {
        scene.remove(child);
      }
    });
  }

  const geometry = new THREE.PlaneGeometry(
    terrainParams.width,
    terrainParams.height,
    terrainParams.segments,
    terrainParams.segments
  );
  geometry.rotateX(-Math.PI / 2);

  const colors = [];
  const simplex = new SimplexNoise();

  const position = geometry.attributes.position;

  const riverNoise = new SimplexNoise("river");

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    let y =
      simplex.noise2D(
        x / terrainParams.noiseScale,
        z / terrainParams.noiseScale
      ) * terrainParams.noiseAmplitude;

    const riverStrength = riverNoise.noise2D(
      x / terrainParams.noiseScale,
      z / terrainParams.noiseScale
    );
    if (riverStrength > 0.5) {
      y -= 10;
    }

    position.setY(i, y);

    const color = new THREE.Color();
    if (y < terrainParams.noiseAmplitude * 0.2) {
      color.setHex(0x228b22);
    } else if (y < terrainParams.noiseAmplitude * 0.4) {
      color.setHex(0x8b4513);
    } else if (y < terrainParams.noiseAmplitude * 0.5) {
      color.setHex(0xd2b48c);
    } else if (y < terrainParams.noiseAmplitude * 0.7) {
      color.setHex(0xdeb887);
    } else if (y < terrainParams.noiseAmplitude * 0.9) {
      color.setHex(0x808080);
    } else {
      color.setHex(0xffffff);
    }

    if (riverStrength > 0.5) {
      color.setHex(0x0000ff);
    }

    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
  });

  terrain = new THREE.Mesh(geometry, material);
  scene.add(terrain);

  const loader = new THREE.FontLoader();
  loader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    function (font) {
      const biomes = [
        {
          name: "Forest",
          position: { x: 0, y: terrainParams.noiseAmplitude * 0.2, z: 0 },
        },
        { 
          name: "Desert",
          position: { x: 50, y: terrainParams.noiseAmplitude * 0.5, z: 50 },
        },
        {
          name: "Mountain",
          position: { x: -50, y: terrainParams.noiseAmplitude * 0.8, z: -50 },
        },
        {
          name: "River",
          position: { x: 0, y: terrainParams.noiseAmplitude * -0.5, z: 0 },
        },
      ];

      biomes.forEach((biome) => {
        const textGeometry = new THREE.TextGeometry(biome.name, {
          font: font,
          size: 5,
          height: 1,
          curveSegments: 12,
          bevelEnabled: false,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(
          biome.position.x,
          biome.position.y,
          biome.position.z
        );
        scene.add(textMesh);
      });
    }
  );
}

camera.position.set(0, 50, 100);
camera.lookAt(0, 0, 0);

generateTerrain();

function animate() {
  requestAnimationFrame(animate);
  if (terrain) {
    terrain.rotation.y += 0.001;
  }
  renderer.render(scene, camera);
}
animate();

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