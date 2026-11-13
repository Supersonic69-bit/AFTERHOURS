
import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// ==========================================
// AFTERHOURS — KALYUG
// BUILD 0.9.2 | SILENT SUPERCAR EDITION
// ==========================================

const game = document.querySelector("#game");
if (!game) throw new Error("Missing #game element");
game.innerHTML = "";

// ==========================================
// IPHONE PROTECTION
// ==========================================

document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("selectstart", e => e.preventDefault());
document.addEventListener("dragstart", e => e.preventDefault());

const style = document.createElement("style");
style.textContent = `
* {
  -webkit-user-select:none!important;
  user-select:none!important;
  -webkit-touch-callout:none!important;
  -webkit-tap-highlight-color:transparent!important;
}
html,body {
  margin:0;
  padding:0;
  overflow:hidden;
  background:#03050b;
  touch-action:manipulation;
}
#game {
  position:fixed;
  inset:0;
  overflow:hidden;
  touch-action:none;
  z-index:1;
}
#game canvas {
  position:absolute;
  inset:0;
  display:block;
  width:100%;
  height:100%;
  touch-action:none;
  z-index:1;
}
#intro {z-index:10;}
#ah-hud,#ah-hud * {
  pointer-events:none!important;
  user-select:none!important;
}
#ah-controls {pointer-events:none;}
#ah-controls button {
  pointer-events:auto;
  min-width:58px;
  height:58px;
  border:1px solid rgba(255,255,255,.35);
  border-radius:12px;
  background:rgba(8,12,20,.78);
  color:white;
  font-size:14px;
  font-weight:700;
  touch-action:none;
}
#ah-controls button:active {
  background:rgba(255,255,255,.25);
}
`;
document.head.appendChild(style);

// ==========================================
// SCENE
// ==========================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03050b);
scene.fog = new THREE.Fog(0x111820, 100, 520);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1400
);

camera.position.set(0, 5.5, 14);

const renderer = new THREE.WebGLRenderer({
  antialias:true,
  alpha:false,
  powerPreference:"high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

game.appendChild(renderer.domElement);

// ==========================================
// SPACE BACKGROUND
// ==========================================

const textureLoader = new THREE.TextureLoader();

textureLoader.load(
  "../deep_space_combined_2k.png",
  texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    console.log("Space background loaded");
  },
  undefined,
  error => console.error("Space background failed:", error)
);

// ==========================================
// LIGHTING
// ==========================================

scene.add(
  new THREE.HemisphereLight(0xb9c9d8, 0x252a35, 1.8)
);

const sunlight = new THREE.DirectionalLight(0xffffff, 2.2);
sunlight.position.set(-30, 60, 25);
scene.add(sunlight);

const frontLight = new THREE.DirectionalLight(0x9abaff, 1.3);
frontLight.position.set(20, 12, 40);
scene.add(frontLight);

const planetLight = new THREE.PointLight(0x8aaaff, 35, 180);
planetLight.position.set(0, 35, -100);
scene.add(planetLight);

// ==========================================
// PLANET TEXTURES
// ==========================================

const roadsidePlanets = [];
const planetTextures = {};

const planetFiles = {
  earth: "../assets/planets/2k_earth_daymap.jpg",
  jupiter: "../assets/planets/2k_jupiter.jpg",
  moon: "../assets/planets/2k_moon.jpg",
  venus: "../assets/planets/2k_venus_surface.jpg"
};

const planetTypes = ["earth", "jupiter", "moon", "venus"];

const planetColors = {
  earth: 0x4b91cf,
  jupiter: 0xc99b68,
  moon: 0xb9b9b9,
  venus: 0xd99a48
};

for (const [name, path] of Object.entries(planetFiles)) {
  textureLoader.load(
    path,
    texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        renderer.capabilities.getMaxAnisotropy(),
        8
      );

      planetTextures[name] = texture;

      for (const planet of roadsidePlanets) {
        if (planet.userData.type === name) {
          planet.userData.surface.material.map = texture;
          planet.userData.surface.material.needsUpdate = true;
        }
      }

      console.log("Planet texture loaded:", name);
    },
    undefined,
    error => console.error("Planet texture failed:", name, error)
  );
}

// ==========================================
// ROAD MATERIALS
// ==========================================

const asphaltMat = new THREE.MeshStandardMaterial({
  color:0x24292d,
  roughness:0.95
});

const groundMat = new THREE.MeshStandardMaterial({
  color:0x303b37,
  roughness:1
});

const lineMat = new THREE.MeshStandardMaterial({
  color:0xd8d8d2,
  roughness:0.8
});

const curbMat = new THREE.MeshStandardMaterial({
  color:0x777b7b,
  roughness:0.9
});

// ==========================================
// ROAD
// ==========================================

const ROAD_WIDTH = 14;
const SEGMENT_LENGTH = 180;
const SEGMENT_COUNT = 7;

const roadSegments = [];

function createRoadSegment(z) {
  const group = new THREE.Group();
  group.position.z = z;

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(
      ROAD_WIDTH,
      0.18,
      SEGMENT_LENGTH
    ),
    asphaltMat
  );

  road.position.y = -0.12;
  group.add(road);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(180, 0.1, SEGMENT_LENGTH),
    groundMat
  );

  ground.position.y = -0.28;
  group.add(ground);

  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, SEGMENT_LENGTH),
      curbMat
    );

    curb.position.set(
      side * (ROAD_WIDTH / 2 + 0.2),
      0,
      0
    );

    group.add(curb);
  }

  scene.add(group);
  return group;
}

for (let i = 0; i < SEGMENT_COUNT; i++) {
  roadSegments.push(
    createRoadSegment(90 - i * SEGMENT_LENGTH)
  );
}

// ==========================================
// ROAD MARKINGS
// ==========================================

const DASH_SPACING = 18;
const DASH_COUNT = 100;
const dashes = [];

const dashGeometry = new THREE.BoxGeometry(0.13, 0.025, 7);

for (let i = 0; i < DASH_COUNT; i++) {
  const dash = new THREE.Mesh(dashGeometry, lineMat);
  dash.position.set(0, 0.015, 100 - i * DASH_SPACING);
  scene.add(dash);
  dashes.push(dash);
}

// ==========================================
// PLANETS
// ==========================================

function createRoadsidePlanet(side, z, index) {
  const group = new THREE.Group();

  const radius = 5.5 + Math.random() * 5.5;
  const type = planetTypes[index % planetTypes.length];

  const material = new THREE.MeshStandardMaterial({
    color:0xffffff,
    roughness:0.95
  });

  if (planetTextures[type]) {
    material.map = planetTextures[type];
  }

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 32),
    material
  );

  sphere.scale.setScalar(radius);
  sphere.rotation.z = Math.random() * Math.PI;
  group.add(sphere);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.045, 32, 24),
    new THREE.MeshBasicMaterial({
      color:planetColors[type],
      transparent:true,
      opacity:0.10,
      side:THREE.BackSide,
      depthWrite:false
    })
  );

  glow.scale.setScalar(radius);
  group.add(glow);

  group.position.set(
    side * (23 + Math.random() * 10),
    8 + Math.random() * 12,
    z
  );

  group.userData = {
    type,
    surface:sphere,
    rotationSpeed:0.025 + Math.random() * 0.035,
    side
  };

  scene.add(group);
  return group;
}

for (let i = 0; i < 24; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const z = 100 - Math.floor(i / 2) * 55;

  roadsidePlanets.push(
    createRoadsidePlanet(side, z, i)
  );
}

// ==========================================
// CHANGE PLANET TYPE
// ==========================================

function changePlanetType(planet) {
  const nextType = planetTypes[
    Math.floor(Math.random() * planetTypes.length)
  ];

  planet.userData.type = nextType;

  const material = planet.userData.surface.material;
  material.map = planetTextures[nextType] || null;
  material.color.set(0xffffff);
  material.needsUpdate = true;

  planet.children[1].material.color.set(
    planetColors[nextType]
  );

  const radius = 5.5 + Math.random() * 5.5;

  planet.userData.surface.scale.setScalar(radius);
  planet.children[1].scale.setScalar(radius * 1.045);
}

// ==========================================
// PLAYER CAR
// ==========================================

const car = new THREE.Group();
scene.add(car);
car.position.set(0, 0, 3);

// Temporary fallback while the GLB loads
const fallback = new THREE.Group();
car.add(fallback);

const fallbackBody = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.65, 4.2),
  new THREE.MeshStandardMaterial({
    color:0x171a1d,
    metalness:0.7,
    roughness:0.28
  })
);

fallbackBody.position.y = 0.75;
fallback.add(fallbackBody);

const fallbackCabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.55, 0.65, 1.9),
  new THREE.MeshStandardMaterial({
    color:0x263b49,
    metalness:0.5,
    roughness:0.2
  })
);

fallbackCabin.position.set(0, 1.35, -0.25);
fallback.add(fallbackCabin);

const fallbackWheels = [];

const wheelMat = new THREE.MeshStandardMaterial({
  color:0x080808
});

for (const x of [-1.05, 1.05]) {
  for (const z of [-1.35, 1.35]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.28, 20),
      wheelMat
    );

    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.43, z);
    fallback.add(wheel);
    fallbackWheels.push(wheel);
  }
}

// ==========================================
// REAL SUPERCAR GLB
// ==========================================

const CAR_MODEL_PATH =
  "../assets/planets/cars/generic-mid-engine-supercar.glb";

const gltfLoader = new GLTFLoader();

let supercarModel = null;

gltfLoader.load(
  CAR_MODEL_PATH,

  gltf => {
    const model = gltf.scene;

    model.updateMatrixWorld(true);

    const originalBox = new THREE.Box3().setFromObject(model);
    const originalSize = new THREE.Vector3();
    const originalCenter = new THREE.Vector3();

    originalBox.getSize(originalSize);
    originalBox.getCenter(originalCenter);

    const longestDimension = Math.max(
      originalSize.x,
      originalSize.y,
      originalSize.z
    );

    if (!longestDimension || !originalSize.y) {
      console.error("Invalid supercar dimensions");
      return;
    }

    const scale = 4.6 / longestDimension;

    model.scale.setScalar(scale);

    model.position.set(
      -originalCenter.x * scale,
      -originalBox.min.y * scale,
      -originalCenter.z * scale
    );

    // Rotate the car 90 degrees to align with the road.
    model.rotation.y = Math.PI / 2;

    model.traverse(object => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        object.frustumCulled = false;

        if (object.material) {
          object.material.needsUpdate = true;
        }
      }
    });

    car.add(model);
    supercarModel = model;
    fallback.visible = false;

    console.log("AFTERHOURS: Supercar loaded!", originalSize);
  },

  progress => {
    if (progress.total) {
      console.log(
        "Supercar loading:",
        Math.round(progress.loaded / progress.total * 100) + "%"
      );
    }
  },

  error => {
    console.error("Supercar failed to load:", error);
    fallback.visible = true;
  }
);

// ==========================================
// GAME STATE
// ==========================================

let speed = 0;
let steering = 0;
let started = false;

const MAX_SPEED = 2.1;

const keys = {
  left:false,
  right:false,
  gas:false,
  brake:false
};

// ==========================================
// HUD
// ==========================================

const hud = document.createElement("div");
hud.id = "ah-hud";

hud.style.cssText = `
  position:fixed;
  top:18px;
  left:18px;
  z-index:20;
  color:white;
  font-family:Arial,sans-serif;
  font-size:14px;
  letter-spacing:2px;
  display:none;
  pointer-events:none;
`;

hud.innerHTML = `
  <div style="opacity:.65;font-size:10px">AFTERHOURS</div>
  <div id="ah-speed"
       style="font-size:30px;font-weight:700;margin-top:5px">
    000
  </div>
  <div style="font-size:9px;opacity:.55">KM/H</div>
`;

document.body.appendChild(hud);

// ==========================================
// MOBILE CONTROLS
// ==========================================

const controls = document.createElement("div");
controls.id = "ah-controls";

controls.style.cssText = `
  position:fixed;
  bottom:25px;
  left:0;
  width:100%;
  display:none;
  justify-content:space-between;
  padding:0 22px;
  box-sizing:border-box;
  z-index:30;
`;

controls.innerHTML = `
  <div style="display:flex;gap:12px">
    <button data-control="left">◀</button>
    <button data-control="right">▶</button>
  </div>
  <div style="display:flex;gap:12px">
    <button data-control="brake">BRAKE</button>
    <button data-control="gas">GAS</button>
  </div>
`;

document.body.appendChild(controls);

controls.querySelectorAll("button").forEach(button => {
  const name = button.dataset.control;

  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    keys[name] = true;
  });

  const release = event => {
    event.preventDefault();
    keys[name] = false;
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
});

// ==========================================
// KEYBOARD CONTROLS
// ==========================================

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (key === "arrowleft" || key === "a") keys.left = true;
  if (key === "arrowright" || key === "d") keys.right = true;
  if (key === "arrowup" || key === "w") keys.gas = true;
  if (key === "arrowdown" || key === "s") keys.brake = true;
});

window.addEventListener("keyup", event => {
  const key = event.key.toLowerCase();

  if (key === "arrowleft" || key === "a") keys.left = false;
  if (key === "arrowright" || key === "d") keys.right = false;
  if (key === "arrowup" || key === "w") keys.gas = false;
  if (key === "arrowdown" || key === "s") keys.brake = false;
});

// ==========================================
// START GAME — NO AUDIO
// ==========================================

function startGame() {
  if (started) return;

  started = true;

  hud.style.display = "block";
  controls.style.display = "flex";

  const intro = document.querySelector("#intro");

  if (intro) {
    intro.style.transition = "opacity 1s ease";
    intro.style.opacity = "0";

    setTimeout(() => {
      intro.style.display = "none";
    }, 1000);
  }
}

const startButton = [
  ...document.querySelectorAll("button")
].find(button =>
  /start engine/i.test(button.textContent.trim())
);

if (startButton) {
  startButton.addEventListener("click", startGame);
} else {
  const intro = document.querySelector("#intro");

  if (intro) {
    intro.addEventListener("click", startGame, {once:true});
  }
}

// ==========================================
// DRIVING PHYSICS
// ==========================================

function updateDriving(delta) {
  if (!started) return;

  if (keys.gas) speed += 1.2 * delta;
  if (keys.brake) speed -= 2.5 * delta;

  speed -= 0.16 * delta;

  speed = THREE.MathUtils.clamp(speed, 0, MAX_SPEED);

  let direction = 0;

  if (keys.left) direction -= 1;
  if (keys.right) direction += 1;

  steering = THREE.MathUtils.lerp(
    steering,
    direction,
    Math.min(1, delta * 5)
  );

  car.position.x += steering * (0.08 + speed * 0.11);

  car.position.x = THREE.MathUtils.clamp(
    car.position.x,
    -5.1,
    5.1
  );

  car.position.z -= speed * 28 * delta;

  car.rotation.z = THREE.MathUtils.lerp(
    car.rotation.z,
    -steering * 0.09,
    delta * 4
  );

  for (const wheel of fallbackWheels) {
    wheel.rotation.x -= speed * delta * 4;
  }

  const speedDisplay = document.querySelector("#ah-speed");

  if (speedDisplay) {
    speedDisplay.textContent = String(
      Math.round(speed * 160)
    ).padStart(3, "0");
  }
}

// ==========================================
// ENDLESS WORLD
// ==========================================

function updateEndlessWorld() {
  for (const segment of roadSegments) {
    if (segment.position.z > car.position.z + SEGMENT_LENGTH) {
      const farthest = Math.min(
        ...roadSegments.map(s => s.position.z)
      );

      segment.position.z = farthest - SEGMENT_LENGTH;
    }
  }

  for (const dash of dashes) {
    if (dash.position.z > car.position.z + 25) {
      const farthest = Math.min(
        ...dashes.map(d => d.position.z)
      );

      dash.position.z = farthest - DASH_SPACING;
    }
  }

  for (const planet of roadsidePlanets) {
    if (planet.position.z > car.position.z + 35) {
      const farthest = Math.min(
        ...roadsidePlanets.map(p => p.position.z)
      );

      planet.position.z =
        farthest - 55 - Math.random() * 25;

      planet.position.x =
        planet.userData.side * (23 + Math.random() * 10);

      planet.position.y = 8 + Math.random() * 12;

      changePlanetType(planet);
    }
  }
}

// ==========================================
// PLANET ROTATION
// ==========================================

function updatePlanets(delta) {
  for (const planet of roadsidePlanets) {
    planet.userData.surface.rotation.y +=
      planet.userData.rotationSpeed * delta;
  }
}

// ==========================================
// CAMERA
// ==========================================

function updateCamera(delta) {
  const targetPosition = new THREE.Vector3(
    car.position.x * 0.45,
    5.5,
    car.position.z + 11
  );

  camera.position.lerp(
    targetPosition,
    Math.min(1, delta * 3)
  );

  camera.lookAt(
    car.position.x * 0.35,
    1.1,
    car.position.z - 13
  );
}

// ==========================================
// RESIZE
// ==========================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.7)
  );
});

// ==========================================
// ERROR LOGGING
// ==========================================

window.addEventListener("error", event => {
  console.error("AFTERHOURS runtime error:", event.message);
});

window.addEventListener("unhandledrejection", event => {
  console.error("AFTERHOURS promise error:", event.reason);
});

// ==========================================
// MAIN LOOP
// ==========================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);

  updateDriving(delta);
  updateEndlessWorld();
  updatePlanets(delta);
  updateCamera(delta);

  renderer.render(scene, camera);
}

animate();

console.log("AFTERHOURS 0.9.2 initialized");
