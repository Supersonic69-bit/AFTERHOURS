
import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

// ==========================================
// AFTERHOURS — KALYUG
// BUILD 0.9.7 | UFO ASSAULT + V10 ENGINE AUDIO
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

  if (planetTextures[type]) material.map = planetTextures[type];

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
  roadsidePlanets.push(createRoadsidePlanet(side, z, i));
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

  planet.children[1].material.color.set(planetColors[nextType]);

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

const wheelMat = new THREE.MeshStandardMaterial({color:0x080808});

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

    model.rotation.y = -Math.PI / 2;

    model.traverse(object => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        object.frustumCulled = false;

        if (object.material) object.material.needsUpdate = true;
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
// SPACE CASH SYSTEM
// ==========================================

const CASH_MODEL_PATH =
  "../assets/planets/cash/model-5321cfcbeac1.glb";

const CASH_VALUE = 100;
const CASH_COUNT = 18;

const cashPickups = [];
let cashTotal = 0;
let cashTemplate = null;

function randomCashX() {
  const positions = [-4.2, 0, 4.2];
  return positions[Math.floor(Math.random() * positions.length)];
}

function createCashPickup(z, index) {
  const pickup = new THREE.Group();
  const model = cashTemplate.clone(true);

  pickup.add(model);

  pickup.position.set(
    randomCashX(),
    1.4 + Math.random() * 2.2,
    z
  );

  pickup.rotation.y = Math.random() * Math.PI * 2;

  pickup.userData = {
    baseY:pickup.position.y,
    floatOffset:Math.random() * Math.PI * 2,
    spinSpeed:0.35 + Math.random() * 0.5,
    index
  };

  scene.add(pickup);
  cashPickups.push(pickup);
}

function spawnCashField() {
  for (let i = 0; i < CASH_COUNT; i++) {
    createCashPickup(-25 - i * 19, i);
  }

  console.log("AFTERHOURS: Cash field created");
}

const cashLoader = new GLTFLoader();

cashLoader.load(
  CASH_MODEL_PATH,
  gltf => {
    const model = gltf.scene;

    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const longestDimension = Math.max(size.x, size.y, size.z);

    if (!longestDimension) {
      console.error("Invalid cash model dimensions");
      return;
    }

    const scale = 2.4 / longestDimension;

    model.scale.setScalar(scale);

    model.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );

    model.traverse(object => {
      if (object.isMesh) {
        object.frustumCulled = false;
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    cashTemplate = model;
    spawnCashField();

    console.log("AFTERHOURS: Cash model loaded!", size);
  },
  progress => {
    if (progress.total) {
      console.log(
        "Cash loading:",
        Math.round(progress.loaded / progress.total * 100) + "%"
      );
    }
  },
  error => console.error("Cash model failed to load:", error)
);

// ==========================================
// UFO ASSAULT SYSTEM
// ==========================================

const UFO_MODEL_PATH = "../assets/planets/ufo.glb";

let ufoTemplate = null;
let activeUFO = null;

const ufoBullets = [];

let nextUfoSpawn = 0;
let ufoSpawnTimer = 9;
let ufoAttackTimer = 0;
let ufoLifetime = 0;

let speedRecoveryTimer = 0;
let speedHitCooldown = 0;

const UFO_ACTIVE_TIME = 8;
const UFO_SPAWN_MIN = 10;
const UFO_SPAWN_MAX = 17;
const UFO_BULLET_SPEED = 55;
const UFO_SPEED_PENALTY = 0.45;
const UFO_PENALTY_TIME = 3;

const ufoLoader = new GLTFLoader();

ufoLoader.load(
  UFO_MODEL_PATH,

  gltf => {
    const model = gltf.scene;

    model.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const longestDimension = Math.max(size.x, size.y, size.z);

    if (!longestDimension) {
      console.error("Invalid UFO model dimensions");
      return;
    }

    const scale = 6 / longestDimension;

    model.scale.setScalar(scale);

    model.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );

    model.traverse(object => {
      if (object.isMesh) {
        object.frustumCulled = false;
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    ufoTemplate = model;

    console.log("AFTERHOURS: UFO model loaded!", size);
  },

  progress => {
    if (progress.total) {
      console.log(
        "UFO loading:",
        Math.round(progress.loaded / progress.total * 100) + "%"
      );
    }
  },

  error => {
    console.error("UFO model failed to load:", error);
  }
);

// ==========================================
// UFO ENERGY BULLET
// ==========================================

function createEnergyBullet(origin, target) {
  const bullet = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 16, 12),
    new THREE.MeshBasicMaterial({
      color:0x36eaff
    })
  );

  bullet.add(core);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 16, 12),
    new THREE.MeshBasicMaterial({
      color:0x773cff,
      transparent:true,
      opacity:0.32,
      depthWrite:false
    })
  );

  bullet.add(glow);

  const direction = new THREE.Vector3()
    .subVectors(target, origin)
    .normalize();

  bullet.position.copy(origin);

  bullet.userData = {
    velocity:direction.multiplyScalar(UFO_BULLET_SPEED),
    life:3.5
  };

  scene.add(bullet);
  ufoBullets.push(bullet);
}

function fireUFOBullet() {
  if (!activeUFO) return;

  const origin = activeUFO.position.clone();
  origin.y -= 0.5;

  const target = car.position.clone();
  target.y += 0.9;

  createEnergyBullet(origin, target);

  console.log("UFO fired energy bullet!");
}

// ==========================================
// UFO SPAWN
// ==========================================

function spawnUFO() {
  if (!ufoTemplate || activeUFO || !started) return;

  const ufo = new THREE.Group();

  const model = ufoTemplate.clone(true);
  ufo.add(model);

  ufo.position.set(
    car.position.x + (Math.random() < 0.5 ? -9 : 9),
    6 + Math.random() * 3,
    car.position.z - 38
  );

  ufo.rotation.y = Math.PI;

  ufo.userData = {
    targetX:car.position.x,
    drift:Math.random() * Math.PI * 2
  };

  scene.add(ufo);

  activeUFO = ufo;
  ufoLifetime = UFO_ACTIVE_TIME;
  ufoAttackTimer = 1.1;

  console.log("UFO ATTACK STARTED!");
}

// ==========================================
// UFO DISAPPEAR
// ==========================================

function removeUFO() {
  if (activeUFO) {
    scene.remove(activeUFO);
    activeUFO = null;
  }

  ufoSpawnTimer =
    UFO_SPAWN_MIN +
    Math.random() * (UFO_SPAWN_MAX - UFO_SPAWN_MIN);

  console.log("UFO disappeared");
}

// ==========================================
// BULLET CLEANUP
// ==========================================

function removeBullet(index) {
  const bullet = ufoBullets[index];

  scene.remove(bullet);

  bullet.traverse(object => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  });

  ufoBullets.splice(index, 1);
}

// ==========================================
// UFO SPEED DAMAGE
// ==========================================

function hitByUFO() {
  if (speedHitCooldown > 0) return;

  speedHitCooldown = 1.1;
  speedRecoveryTimer = UFO_PENALTY_TIME;

  speed *= UFO_SPEED_PENALTY;

  console.log("UFO HIT! Temporary speed reduction.");

  const cashDisplay = document.querySelector("#ah-cash");

  if (cashDisplay) {
    cashDisplay.textContent = "UFO HIT! SPEED REDUCED";
    cashDisplay.style.color = "#ff55dd";
  }
}

// ==========================================
// UFO UPDATE
// ==========================================

function updateUFO(delta, elapsedTime) {
  if (!started) return;

  if (speedHitCooldown > 0) {
    speedHitCooldown = Math.max(0, speedHitCooldown - delta);
  }

  if (speedRecoveryTimer > 0) {
    speedRecoveryTimer = Math.max(0, speedRecoveryTimer - delta);
  }

  if (!activeUFO) {
    ufoSpawnTimer -= delta;

    if (ufoSpawnTimer <= 0 && ufoTemplate) {
      spawnUFO();
    }
  }

  if (activeUFO) {
    ufoLifetime -= delta;

    const targetX = THREE.MathUtils.clamp(
      car.position.x + Math.sin(elapsedTime * 1.7) * 2.5,
      -8,
      8
    );

    activeUFO.position.x = THREE.MathUtils.lerp(
      activeUFO.position.x,
      targetX,
      Math.min(1, delta * 1.5)
    );

    activeUFO.position.z = THREE.MathUtils.lerp(
      activeUFO.position.z,
      car.position.z - 30,
      Math.min(1, delta * 1.1)
    );

    activeUFO.position.y =
      6 + Math.sin(elapsedTime * 2.3) * 0.65;

    activeUFO.rotation.z =
      Math.sin(elapsedTime * 1.8) * 0.07;

    activeUFO.rotation.y += delta * 0.25;

    ufoAttackTimer -= delta;

    if (ufoAttackTimer <= 0) {
      fireUFOBullet();
      ufoAttackTimer = 1.65 + Math.random() * 0.5;
    }

    if (ufoLifetime <= 0) {
      removeUFO();
    }
  }

  for (let i = ufoBullets.length - 1; i >= 0; i--) {
    const bullet = ufoBullets[i];

    bullet.position.addScaledVector(
      bullet.userData.velocity,
      delta
    );

    bullet.userData.life -= delta;

    bullet.rotation.x += delta * 5;
    bullet.rotation.y += delta * 7;

    const dx = bullet.position.x - car.position.x;
    const dy = bullet.position.y - (car.position.y + 0.9);
    const dz = bullet.position.z - car.position.z;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < 1.75) {
      hitByUFO();
      removeBullet(i);
      continue;
    }

    if (
      bullet.userData.life <= 0 ||
      bullet.position.z > car.position.z + 30 ||
      bullet.position.z < car.position.z - 100
    ) {
      removeBullet(i);
    }
  }
}

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
// LAMBORGHINI V10 ENGINE AUDIO
// ==========================================

const ENGINE_AUDIO_PATH =
  "../assets/planets/audio/u_logan-mean-lamborghinimp3-452474.mp3";

const engineAudio = new Audio(ENGINE_AUDIO_PATH);

engineAudio.loop = true;
engineAudio.preload = "auto";
engineAudio.volume = 0;
engineAudio.playbackRate = 0.85;

engineAudio.preservesPitch = false;
engineAudio.webkitPreservesPitch = false;

let engineAudioReady = false;

engineAudio.addEventListener("canplaythrough", () => {
  engineAudioReady = true;
  console.log("AFTERHOURS: V10 engine audio ready");
});

engineAudio.addEventListener("error", () => {
  console.error(
    "Engine audio failed to load. Check MP3 path:",
    ENGINE_AUDIO_PATH,
    engineAudio.error
  );
});

// Start audio directly from a real user interaction.
// This supports iPhone browser autoplay restrictions.
function startEngineAudio() {
  if (!started || !keys.gas || !engineAudio.paused) return;

  engineAudio.play().then(() => {
    console.log("V10 ENGINE STARTED");
  }).catch(error => {
    console.warn("Engine audio playback blocked:", error);
  });
}

// Dynamically change engine RPM pitch and volume.
function updateEngineAudio(delta) {
  if (!started) return;

  const accelerating = keys.gas;

  const normalizedSpeed = THREE.MathUtils.clamp(
    speed / MAX_SPEED,
    0,
    1
  );

  // Engine pitch rises with vehicle speed.
  const targetRate = 0.85 + normalizedSpeed * 0.75;

  // Louder when accelerating and faster.
  const targetVolume = accelerating
    ? 0.25 + normalizedSpeed * 0.40
    : 0;

  engineAudio.playbackRate = THREE.MathUtils.lerp(
    engineAudio.playbackRate,
    targetRate,
    Math.min(1, delta * 3.5)
  );

  engineAudio.volume = THREE.MathUtils.lerp(
    engineAudio.volume,
    targetVolume,
    Math.min(1, delta * 5)
  );

  // If audio has been paused, wait for the next direct
  // GAS-button or keyboard interaction to resume playback.
  if (!accelerating && engineAudio.volume < 0.015) {
    engineAudio.pause();
  }
}

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

  <div id="ah-cash"
       style="font-size:17px;font-weight:700;margin-top:14px;color:#66ff9a">
    CASH: $0
  </div>

  <div id="ah-ufo-status"
       style="font-size:11px;font-weight:700;margin-top:9px;color:#42eaff">
  </div>
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

    // Start the engine audio directly from the GAS touch.
    if (name === "gas") {
      startEngineAudio();
    }
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

  if (key === "arrowup" || key === "w") {
    keys.gas = true;
    startEngineAudio();
  }

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
// START GAME
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

  const speedMultiplier = speedRecoveryTimer > 0 ? 0.45 : 1;

  speed = THREE.MathUtils.clamp(
    speed,
    0,
    MAX_SPEED * speedMultiplier
  );

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

  const ufoStatus = document.querySelector("#ah-ufo-status");

  if (ufoStatus) {
    if (speedRecoveryTimer > 0) {
      ufoStatus.textContent = "⚡ SPEED RECOVERING";
      ufoStatus.style.color = "#ff55dd";
    } else {
      ufoStatus.textContent = "";
    }
  }
}

// ==========================================
// CASH COLLECTION & RECYCLING
// ==========================================

function updateCash(delta, elapsedTime) {
  for (const pickup of cashPickups) {
    pickup.rotation.y += pickup.userData.spinSpeed * delta;

    pickup.position.y =
      pickup.userData.baseY +
      Math.sin(
        elapsedTime * 1.5 + pickup.userData.floatOffset
      ) * 0.35;

    const distanceX = Math.abs(
      pickup.position.x - car.position.x
    );

    const distanceZ = Math.abs(
      pickup.position.z - car.position.z
    );

    if (distanceX < 2.3 && distanceZ < 2.8) {
      cashTotal += CASH_VALUE;

      const cashDisplay = document.querySelector("#ah-cash");

      if (cashDisplay) {
        cashDisplay.textContent =
          "CASH: $" + cashTotal.toLocaleString("en-US");

        cashDisplay.style.color = "#66ff9a";
      }

      console.log("Cash collected! Total:", cashTotal);

      const farthest = Math.min(
        ...cashPickups.map(item => item.position.z)
      );

      pickup.position.z =
        farthest - 22 - Math.random() * 18;

      pickup.position.x = randomCashX();
      pickup.userData.baseY = 1.4 + Math.random() * 2.2;
      pickup.position.y = pickup.userData.baseY;
      pickup.userData.floatOffset = Math.random() * Math.PI * 2;
    }

    else if (pickup.position.z > car.position.z + 20) {
      const farthest = Math.min(
        ...cashPickups.map(item => item.position.z)
      );

      pickup.position.z =
        farthest - 22 - Math.random() * 18;

      pickup.position.x = randomCashX();
      pickup.userData.baseY = 1.4 + Math.random() * 2.2;
      pickup.position.y = pickup.userData.baseY;
      pickup.userData.floatOffset = Math.random() * Math.PI * 2;
    }
  }
}

// ==========================================
// ENDLESS SPACE WORLD
// ==========================================

function updateEndlessWorld() {
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
  const elapsedTime = clock.elapsedTime;

  updateDriving(delta);
  updateEngineAudio(delta);
  updateEndlessWorld();
  updatePlanets(delta);
  updateCash(delta, elapsedTime);
  updateUFO(delta, elapsedTime);
  updateCamera(delta);

  renderer.render(scene, camera);
}

animate();

console.log("AFTERHOURS 0.9.7 V10 ENGINE AUDIO initialized");
