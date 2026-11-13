
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// ==========================================
// AFTERHOURS BY KALYUG
// BUILD 0.4 - STABILITY UPDATE
// ==========================================

document.body.style.cssText += `
  margin:0;
  overflow:hidden;
  background:#080808;
  touch-action:none;
  user-select:none;
  -webkit-user-select:none;
  -webkit-touch-callout:none;
`;

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());

const game = document.getElementById('game');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101214);
scene.fog = new THREE.Fog(0x101214, 70, 420);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, 0.1, 1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
game.appendChild(renderer.domElement);

// ==========================================
// LIGHTING
// ==========================================

scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 1.8);
sunlight.position.set(-15, 30, 15);
scene.add(sunlight);

// ==========================================
// ENDLESS ROAD SYSTEM
// ==========================================

const SEGMENT_LENGTH = 180;
const SEGMENT_COUNT = 5;

const segments = [];

const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x303030,
  roughness: 0.95
});

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x171c1a
});

const lineMaterial = new THREE.MeshBasicMaterial({
  color: 0xe0e0e0
});

function createRoadSegment(z) {
  const group = new THREE.Group();

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(18, SEGMENT_LENGTH),
    roadMaterial
  );

  road.rotation.x = -Math.PI / 2;
  road.position.y = 0;
  group.add(road);

  // Ground around road
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, SEGMENT_LENGTH),
    groundMaterial
  );

  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.07;
  group.add(ground);

  // Centre lane markings
  for (let i = 0; i < 9; i++) {
    const mark = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.025, 5),
      lineMaterial
    );

    mark.position.set(
      0,
      0.025,
      -SEGMENT_LENGTH / 2 + 12 + i * 19
    );

    group.add(mark);
  }

  // Roadside lights
  for (const side of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const zPosition = -65 + i * 100;

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.11, 7, 8),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
      );

      pole.position.set(side * 11, 3.5, zPosition);
      group.add(pole);

      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xddeeff })
      );

      lamp.position.set(side * 11, 7, zPosition);
      group.add(lamp);
    }
  }

  group.position.z = z;
  scene.add(group);

  return group;
}

for (let i = 0; i < SEGMENT_COUNT; i++) {
  segments.push(createRoadSegment(-i * SEGMENT_LENGTH));
}

function updateEndlessRoad() {
  for (const segment of segments) {
    if (segment.position.z > car.position.z + SEGMENT_LENGTH / 2) {
      const farthest = Math.min(
        ...segments.map(s => s.position.z)
      );

      segment.position.z = farthest - SEGMENT_LENGTH;
    }
  }
}

// ==========================================
// PLAYER CAR
// ==========================================

const car = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.65, 4),
  new THREE.MeshStandardMaterial({
    color: 0x202020,
    metalness: 0.8,
    roughness: 0.25
  })
);

body.position.y = 0.85;
car.add(body);

const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.65, 1.8),
  new THREE.MeshStandardMaterial({
    color: 0x101820,
    metalness: 0.6,
    roughness: 0.2
  })
);

cabin.position.set(0, 1.4, -0.2);
car.add(cabin);

// Wheels

const wheels = [];

for (const x of [-1.05, 1.05]) {
  for (const z of [-1.3, 1.3]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.28, 24),
      new THREE.MeshStandardMaterial({ color: 0x080808 })
    );

    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.45, z);

    car.add(wheel);
    wheels.push(wheel);
  }
}

// Headlights

for (const x of [-0.65, 0.65]) {
  const light = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.15, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  light.position.set(x, 0.95, -2.02);
  car.add(light);
}

car.position.set(0, 0, 3);
scene.add(car);

// ==========================================
// CAMERA
// ==========================================

camera.position.set(0, 5.5, 13);
camera.lookAt(car.position);

// ==========================================
// CONTROLS
// ==========================================

const keys = {};

const touch = {
  left: false,
  right: false,
  gas: false,
  brake: false
};

window.addEventListener('keydown', e => {
  keys[e.code] = true;

  if (e.code.startsWith('Arrow')) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

window.addEventListener('blur', () => {
  Object.keys(keys).forEach(k => keys[k] = false);
  Object.keys(touch).forEach(k => touch[k] = false);
});

// ==========================================
// PHYSICS
// ==========================================

let speed = 0;
let steering = 0;
let lateralVelocity = 0;

const MAX_SPEED = 65;
const ACCELERATION = 22;
const BRAKING = 42;
const FRICTION = 7;

function updatePhysics(dt) {
  const gas =
    keys.KeyW || keys.ArrowUp || touch.gas;

  const brake =
    keys.KeyS || keys.ArrowDown || touch.brake;

  const left =
    keys.KeyA || keys.ArrowLeft || touch.left;

  const right =
    keys.KeyD || keys.ArrowRight || touch.right;

  if (gas) {
    speed += ACCELERATION * dt;
  } else {
    speed -= FRICTION * dt;
  }

  if (brake) {
    speed -= BRAKING * dt;
  }

  speed = THREE.MathUtils.clamp(speed, 0, MAX_SPEED);

  const input = (right ? 1 : 0) - (left ? 1 : 0);

  steering = THREE.MathUtils.damp(
    steering,
    input,
    7,
    dt
  );

  const speedFactor = 0.2 + speed / MAX_SPEED;

  lateralVelocity +=
    steering * 1.8 * speedFactor * (speed / 12) * dt;

  lateralVelocity *= Math.exp(-7 * dt);

  car.position.x += lateralVelocity * dt;

  car.position.x = THREE.MathUtils.clamp(
    car.position.x,
    -6.8,
    6.8
  );

  car.position.z -= speed * dt;

  car.rotation.y = THREE.MathUtils.damp(
    car.rotation.y,
    -steering * 0.16,
    5,
    dt
  );

  car.rotation.z = THREE.MathUtils.damp(
    car.rotation.z,
    -steering * 0.035,
    4,
    dt
  );

  wheels.forEach(wheel => {
    wheel.rotation.x -= speed * dt;
  });
}

// ==========================================
// HUD - GAMEPLAY ONLY
// ==========================================

const hudStyle = document.createElement('style');

hudStyle.textContent = `
  #hud {
    position:fixed;
    inset:0;
    z-index:20;
    pointer-events:none;
    font-family:Arial,sans-serif;
    color:white;
    display:none;
  }

  #speedBox {
    position:absolute;
    top:20px;
    left:18px;
    background:#080808ee;
    border:2px solid #b7ff00;
    border-radius:12px;
    padding:12px 17px;
  }

  #speed {
    color:#b7ff00;
    font-size:32px;
    font-weight:900;
  }

  #unit {
    font-size:10px;
    color:#aaa;
    letter-spacing:2px;
  }

  .control {
    position:absolute;
    bottom:25px;
    width:clamp(60px,18vw,82px);
    height:clamp(60px,18vw,82px);
    border:2px solid #b7ff00;
    background:#080808ee;
    color:#b7ff00;
    border-radius:50%;
    font-size:25px;
    font-weight:900;
    pointer-events:auto;
    touch-action:none;
    user-select:none;
    -webkit-user-select:none;
    -webkit-touch-callout:none;
    display:flex;
    justify-content:center;
    align-items:center;
  }

  .control.active {
    background:#b7ff00;
    color:#080808;
  }

  #left {
    left:18px;
  }

  #right {
    left:calc(18px + clamp(60px,18vw,82px) + 14px);
  }

  #brake {
    right:calc(18px + clamp(60px,18vw,82px) + 14px);
  }

  #gas {
    right:18px;
    background:#b7ff00;
    color:#080808;
  }

  @media (orientation:landscape) {
    .control { bottom:15px; }
  }
`;

document.head.appendChild(hudStyle);

const hud = document.createElement('div');
hud.id = 'hud';

hud.innerHTML = `
  <div id="speedBox">
    <div id="speed">000</div>
    <div id="unit">KM/H</div>
  </div>

  <button class="control" id="left" aria-label="Left">◀</button>
  <button class="control" id="right" aria-label="Right">▶</button>
  <button class="control" id="brake" aria-label="Brake">▼</button>
  <button class="control" id="gas" aria-label="Accelerate">▲</button>
`;

document.body.appendChild(hud);

// ==========================================
// SHOW CONTROLS ONLY AFTER START ENGINE
// ==========================================

const startButton = document.getElementById('start');
const intro = document.getElementById('intro');

hud.style.display = 'none';

if (startButton) {
  startButton.addEventListener('click', () => {
    setTimeout(() => {
      if (intro && intro.style.display !== 'none') return;
      hud.style.display = 'block';
    }, 1050);
  });
} else {
  hud.style.display = 'block';
}

// ==========================================
// MOBILE BUTTON HANDLING
// ==========================================

function bindButton(id, property) {
  const button = document.getElementById(id);

  function release() {
    touch[property] = false;
    button.classList.remove('active');
  }

  button.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    touch[property] = true;
    button.classList.add('active');

    try {
      button.setPointerCapture(e.pointerId);
    } catch (_) {}
  });

  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);

  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
}

bindButton('left', 'left');
bindButton('right', 'right');
bindButton('gas', 'gas');
bindButton('brake', 'brake');

// ==========================================
// CHASE CAMERA
// ==========================================

const cameraPosition = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();

function updateCamera(dt) {
  cameraPosition.set(
    car.position.x * 0.65,
    5.5,
    car.position.z + 11
  );

  camera.position.lerp(
    cameraPosition,
    1 - Math.exp(-4 * dt)
  );

  cameraTarget.set(
    car.position.x,
    1.3,
    car.position.z - 4
  );

  camera.lookAt(cameraTarget);
}

// ==========================================
// MAIN LOOP
// ==========================================

const speedDisplay = document.getElementById('speed');

let previousTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min(
    (now - previousTime) / 1000,
    0.035
  );

  previousTime = now;

  updatePhysics(dt);
  updateEndlessRoad();
  updateCamera(dt);

  speedDisplay.textContent = String(
    Math.round(speed * 3.6)
  ).padStart(3, '0');

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// ==========================================
// RESIZE
// ==========================================

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
});
