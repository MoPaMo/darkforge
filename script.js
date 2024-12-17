const config = {
  mapWidth: 800,
  mapHeight: 600,
  regionScale: 0.005,
  regionCount: 5,
  seed: Math.random(),
};

let palette = generatePalette(config.regionCount);

let simplex = new SimplexNoise(config.seed);

// initialize Scene
const scene = new THREE.Scene();

const width = window.innerWidth;
const height = window.innerHeight;
const camera = new THREE.OrthographicCamera(
  width / -2,
  width / 2,
  height / 2,
  height / -2,
  1,
  1000
);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
document.getElementById("canvas-container").appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.left = width / -2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = height / -2;
  camera.updateProjectionMatrix();
});

// generate color palette
function generatePalette(count) {
  const palette = [];
  for (let i = 0; i < count; i++) {
    const hue = ((i * 360) / count) % 360;
    const color = new THREE.Color(`hsl(${hue}, 70%, 50%)`);
    palette.push({ r: color.r * 255, g: color.g * 255, b: color.b * 255 });
  }
  return palette;
}

function shufflePalette() {
  console.log("shufflePalette", palette);
  for (let i = palette.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [palette[i], palette[j]] = [palette[j], palette[i]];
  }
  console.log("shufflePalette", palette);
}

// generate map with borders
function generateMapWithBorders() {
  const canvas = document.createElement("canvas");
  canvas.width = config.mapWidth;
  canvas.height = config.mapHeight;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.createImageData(config.mapWidth, config.mapHeight);
  const data = imageData.data;
  // Gen noise
  const noiseValues = [];
  for (let y = 0; y < config.mapHeight; y++) {
    noiseValues[y] = [];
    for (let x = 0; x < config.mapWidth; x++) {
      const nx = x * config.regionScale;
      const ny = y * config.regionScale;
      const noiseValue = simplex.noise2D(nx, ny);
      const normalized = (noiseValue + 1) / 2;
      const region = Math.floor(normalized * config.regionCount);
      noiseValues[y][x] = region;
    }
  }
  // palette of colors for regions
  const palette = generatePalette(config.regionCount);
  for (let y = 0; y < config.mapHeight; y++) {
    for (let x = 0; x < config.mapWidth; x++) {
      const currentRegion = noiseValues[y][x];
      let isBorder = false;
      // 4 neighbors
      const neighbors = [
        y > 0 ? noiseValues[y - 1][x] : currentRegion,
        y < config.mapHeight - 1 ? noiseValues[y + 1][x] : currentRegion,
        x > 0 ? noiseValues[y][x - 1] : currentRegion,
        x < config.mapWidth - 1 ? noiseValues[y][x + 1] : currentRegion,
      ];
      for (let neighbor of neighbors) {
        if (neighbor !== currentRegion) {
          isBorder = true;
          break;
        }
      }
      const index = (x + y * config.mapWidth) * 4;
      if (isBorder) {
        data[index] = 0;
        data[index + 1] = 0;
        data[index + 2] = 0;
      } else {
        const color = palette[currentRegion % palette.length];
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
      }
      data[index + 3] = 255; // Alpha
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

//plane with map texture
let mapTexture = generateMapWithBorders();
const geometry = new THREE.PlaneGeometry(config.mapWidth, config.mapHeight);
const material = new THREE.MeshBasicMaterial({ map: mapTexture });
const mapMesh = new THREE.Mesh(geometry, material);
scene.add(mapMesh);

function regenerateMap() {
  mapTexture = generateMapWithBorders();
  material.map = mapTexture;
  material.needsUpdate = true;
}

const canvas = renderer.domElement;

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const width = rect.width;
  const height = rect.height;

  // cursor X -> regionScale (0.001- 0.02)
  const newRegionScale = 0.001 + (x / width) * (0.02 - 0.001);

  // cursor height -> regionCount (2-10)
  const newRegionCount = Math.max(
    2,
    Math.min(10, Math.floor((y / height) * 10))
  );

  let shouldRegenerate = false;

  if (config.regionScale !== newRegionScale) {
    config.regionScale = newRegionScale;
    shouldRegenerate = true;
  }

  if (config.regionCount !== newRegionCount) {
    config.regionCount = newRegionCount;
    shouldRegenerate = true;
  }

  if (shouldRegenerate) {
    regenerateMap();
  }
});

canvas.addEventListener("click", () => {
  config.seed = Math.random();
  simplex = new SimplexNoise(config.seed);
  shufflePalette();
  regenerateMap();
});

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

canvas.addEventListener("contextmenu", function (e) {
  e.preventDefault();
  renderer.render(scene, camera);
  const canvasElement = document.querySelector("canvas");
  const image = canvasElement.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = image;
  link.download = "downloaded-image.png";
  link.click();
});
