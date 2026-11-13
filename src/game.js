
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// ==========================================
// AFTERHOURS — KALYUG
// BUILD 0.5 | SEAMLESS ENDLESS ROAD
// ==========================================

const game = document.querySelector("#game");

if (!game) {
  throw new Error('Could not find the #game element in index.html');
}

game.innerHTML = "";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111820);
scene.fog = new THREE.Fog(0x111820, 90, 420);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 5.5, 11);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
game.appendChild(renderer.domElement);

// ==========================================
// LIGHTING
// ==========================================

scene.add(new THREE.HemisphereLight(0xb9c9d8, 0x252a2e, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2.2);
sunlight.position.set(-30, 60, 25);
sunlight.castShadow = true;
scene.add(sunlight);

// ==========================================
// MATERIALS
// ==========================================

const asphaltMat = new THREE.MeshStandardMaterial({
  color: 0x24292d,
  roughness: 0.95
});

const groundMat = new THREE.MeshStandardMaterial({
  color: 0x303b37,
  roughness: 1
});

const lineMat = new THREE.MeshStandardMaterial({
  color: 0xd8d8d2,
  roughness: 0.8
});

const curbMat = new THREE.MeshStandardMaterial({
  color: 0x777b7b,
  roughness: 0.9
});

const darkMat = new THREE.MeshStandardMaterial({
  color: 0x101316,
  roughness: 0.65,
  metalness: 0.2
});

// ==========================================
// WORLD
// ==========================================

const ROAD_WIDTH = 14;
const SEGMENT_LENGTH = 180;
const SEGMENT_COUNT = 7;

const roadSegments = [];

function createRoadSegment(z) {
  const group = new THREE.Group();
  group.position.z = z;

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(ROAD_WIDTH, 0.18, SEGMENT_LENGTH),
    asphaltMat
  );

  road.position.y = -0.12;
  road.receiveShadow = true;
  group.add(road);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(180, 0.1, SEGMENT_LENGTH),
    groundMat
  );

  ground.position.y = -0.28;
  group.add(ground);

  // Roadside curbs
  for (const side of [-1, 1]) {
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.25, SEGMENT_LENGTH),
      curbMat
    );

    curb.position.set(side * (ROAD_WIDTH / 2 + 0.2), 0, 0);
    group.add(curb);
  }

  scene.add(group);
  return group;
}

for (let i = 0; i < SEGMENT_COUNT; i++) {
  roadSegments.push(createRoadSegment(90 - i * SEGMENT_LENGTH));
}

// ==========================================
// CONTINUOUS ROAD MARKINGS
// These are independent from road segments.
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

function updateRoadMarkings() {
  const farthest = Math.min(...dashes.map(d => d.position.z));

  for (const dash of dashes) {
    if (dash.position.z > car.position.z + 25) {
      dash.position.z = Math.min(
        ...dashes.map(d => d.position.z)
      ) - DASH_SPACING;
    }
  }
}

// ==========================================
// ROAD EDGE DETAILS
// ==========================================

const roadsideObjects = [];
const roadsideMaterials = [
  new THREE.MeshStandardMaterial({ color: 0x35423b }),
  new THREE.MeshStandardMaterial({ color: 0x454a49 }),
  new THREE.MeshStandardMaterial({ color: 0x303a43 }),
  new THREE.MeshStandardMaterial({ color: 0x55534c })
];

function createRoadsideObject(side, z) {
  const group = new THREE.Group();
  group.position.set(side * (10 + Math.random() * 8), 0, z);

  const height = 3 + Math.random() * 9;
  const width = 2 + Math.random() * 4;

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, width),
    roadsideMaterials[
      Math.floor(Math.random() * roadsideMaterials.length)
    ]
  );

  building.position.y = height / 2 - 0.2;
  group.add(building);

  // Subtle windows
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x9b9b85,
    emissive: 0x29271c,
    emissiveIntensity: 0.35
  });

  for (let i = 0; i < 3; i++) {
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.5, 0.04),
      windowMat
    );

    windowMesh.position.set(
      0,
      1 + i * 1.5,
      width / 2 + 0.025
    );

    group.add(windowMesh);
  }

  scene.add(group);
  return group;
}

for (let i = 0; i < 42; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const z = 100 - Math.floor(i / 2) * 45;
  roadsideObjects.push(createRoadsideObject(side, z));
}

function updateRoadsideObjects() {
  for (const object of roadsideObjects) {
    if (object.position.z > car.position.z + 35) {
      const farthest = Math.min(
        ...roadsideObjects.map(o => o.position.z)
      );

      object.position.z = farthest - 40 - Math.random() * 35;
      object.position.x =
        (object.position.x < 0 ? -1 : 1) * (10 + Math.random() * 8);
    }
  }
}

// ==========================================
// PLAYER CAR
// ==========================================

const car = new THREE.Group();
scene.add(car);

const carBodyMat = new THREE.MeshStandardMaterial({
  color: 0x171a1d,
  metalness: 0.7,
  roughness: 0.28
});

const glassMat = new THREE.MeshStandardMaterial({
  color: 0x263b49,
  metalness: 0.5,
  roughness: 0.2
});

const body = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.65, 4.2),
  carBodyMat
);

body.position.y = 0.75;
body.castShadow = true;
car.add(body);

const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.55, 0.65, 1.9),
  glassMat
);

cabin.position.set(0, 1.35, -0.25);
car.add(cabin);

const wheelMat = new THREE.MeshStandardMaterial({
  color: 0x080808,
  roughness: 0.95
});

const wheels = [];

for (const x of [-1.05, 1.05]) {
  for (const z of [-1.35, 1.35]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.28, 20),
      wheelMat
    );

    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.43, z);
    car.add(wheel);
    wheels.push(wheel);
  }
}

const headlightMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 1.2
});

for (const x of [-0.65, 0.65]) {
  const light = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.16, 0.06),
    headlightMat
  );

  light.position.set(x, 0.85, -2.12);
  car.add(light);
}

car.position.set(0, 0, 3);

// ==========================================
// GAME STATE
// ==========================================

let speed = 0;
let steering = 0;
let started = false;
let gameTime = 0;

const MAX_SPEED = 2.1;
const keys = {
  left: false,
  right: false,
  gas: false,
  brake: false
};

// ==========================================
// HUD
// ==========================================

const hud = document.createElement("div");

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
  <div id="ah-speed" style="font-size:30px;font-weight:700;margin-top:5px">
    000
  </div>
  <div style="font-size:9px;opacity:.55">KM/H</div>
`;

document.body.appendChild(hud);

// ==========================================
// MOBILE CONTROLS
// ==========================================

const controls = document.createElement("div");

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
  pointer-events:none;
  user-select:none;
  -webkit-user-select:none;
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

const controlStyle = document.createElement("style");

controlStyle.textContent = `
  #game canvas {
    display:block;
    width:100%;
    height:100%;
    touch-action:none;
  }

  [data-control] {
    pointer-events:auto;
    min-width:58px;
    height:58px;
    border:1px solid rgba(255,255,255,.35);
    border-radius:12px;
    background:rgba(12,16,19,.72);
    color:white;
    font-size:14px;
    font-weight:700;
    touch-action:none;
    -webkit-user-select:none;
    user-select:none;
    -webkit-tap-highlight-color:transparent;
  }

  [data-control]:active {
    background:rgba(255,255,255,.25);
  }

  @media (min-width:800px) {
    [data-control] { opacity:.55; }
  }
`;

document.head.appendChild(controlStyle);

controls.querySelectorAll("button").forEach(button => {
  const name = button.dataset.control;

  const down = event => {
    event.preventDefault();
    keys[name] = true;
  };

  const up = event => {
    event.preventDefault();
    keys[name] = false;
  };

  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointerleave", up);
  button.addEventListener("pointercancel", up);
});

window.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = true;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = true;
  }

  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
    keys.gas = true;
  }

  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
    keys.brake = true;
  }
});

window.addEventListener("keyup", event => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = false;
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = false;
  }

  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
    keys.gas = false;
  }

  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
    keys.brake = false;
  }
});

// ==========================================
// START BUTTON
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

const startButton = [...document.querySelectorAll("button")]
  .find(button =>
    /start engine/i.test(button.textContent.trim())
  );

if (startButton) {
  startButton.addEventListener("click", startGame);
} else {
  const intro = document.querySelector("#intro");

  if (intro) {
    intro.addEventListener("click", startGame, { once: true });
  }
}

// ==========================================
// DRIVING PHYSICS
// ==========================================

function updateDriving(delta) {
  if (!started) return;

  const acceleration = keys.gas ? 1.2 : 0;
  const braking = keys.brake ? 2.5 : 0;

  speed += acceleration * delta;
  speed -= braking * delta;
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

  for (const wheel of wheels) {
    wheel.rotation.x -= speed * delta * 4;
  }

  const speedDisplay = document.querySelector("#ah-speed");

  if (speedDisplay) {
    speedDisplay.textContent =
      String(Math.round(speed * 160)).padStart(3, "0");
  }
}

// ==========================================
// ENDLESS WORLD RECYCLING
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

  updateRoadMarkings();
  updateRoadsideObjects();
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
});

// ==========================================
// MAIN LOOP
// ==========================================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);

  gameTime += delta;

  updateDriving(delta);
  updateEndlessWorld();
  updateCamera(delta);

  renderer.render(scene, camera);
}

animate();
