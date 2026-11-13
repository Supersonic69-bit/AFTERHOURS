
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// ==========================================
// AFTERHOURS BY KALYUG
// BUILD 0.3 - MOBILE CONTROL + DRIFT FIX
// ==========================================

const game = document.getElementById('game');

document.body.style.cssText += `
  margin:0; overflow:hidden; background:#080808;
  touch-action:none; user-select:none;
  -webkit-user-select:none; -webkit-touch-callout:none;
`;

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101214);
scene.fog = new THREE.Fog(0x101214, 50, 260);

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

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-15, 30, 15);
scene.add(sun);

// ==========================================
// WORLD
// ==========================================

const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x292929,
  roughness: 0.95
});

const road = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 5000),
  roadMaterial
);

road.rotation.x = -Math.PI / 2;
road.position.z = -2400;
scene.add(road);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 5500),
  new THREE.MeshStandardMaterial({ color: 0x171c1a })
);

ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.08, -2400);
scene.add(ground);

// ROAD MARKINGS

const markings = new THREE.Group();

for (let z = 35; z > -5000; z -= 12) {
  const mark = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.025, 5),
    new THREE.MeshBasicMaterial({ color: 0xe5e5e5 })
  );

  mark.position.set(0, 0.025, z);
  markings.add(mark);
}

scene.add(markings);

// STREET LIGHTS

for (let z = 20; z > -4800; z -= 50) {
  for (const x of [-11, 11]) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 7, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );

    pole.position.set(x, 3.5, z);
    scene.add(pole);

    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xddeeff })
    );

    lamp.position.set(x, 7, z);
    scene.add(lamp);
  }
}

// ==========================================
// PLAYER CAR
// ==========================================

const car = new THREE.Group();

const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0x202020,
  metalness: 0.85,
  roughness: 0.22
});

const body = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.65, 4),
  bodyMaterial
);

body.position.y = 0.85;
car.add(body);

const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.65, 1.8),
  new THREE.MeshStandardMaterial({
    color: 0x101820,
    metalness: 0.7,
    roughness: 0.2
  })
);

cabin.position.set(0, 1.4, -0.2);
car.add(cabin);

// WHEELS

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

// HEADLIGHTS

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
// DRIVING PHYSICS
// ==========================================

const keys = {};

const touch = {
  left: false,
  right: false,
  gas: false,
  brake: false,
  handbrake: false
};

let speed = 0;
let lateralVelocity = 0;
let steering = 0;
let driftAmount = 0;

const MAX_SPEED = 65;
const ACCELERATION = 22;
const BRAKING = 42;
const FRICTION = 7;
const STEERING_POWER = 2.2;
const NORMAL_GRIP = 5.5;
const DRIFT_GRIP = 1.15;

window.addEventListener('keydown', e => {
  keys[e.code] = true;

  if ([
    'ArrowUp', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'Space'
  ].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

window.addEventListener('blur', () => {
  Object.keys(keys).forEach(key => keys[key] = false);
  Object.keys(touch).forEach(key => touch[key] = false);
});

function updatePhysics(dt) {
  const gas = keys.KeyW || keys.ArrowUp || touch.gas;
  const brake = keys.KeyS || keys.ArrowDown || touch.brake;
  const left = keys.KeyA || keys.ArrowLeft || touch.left;
  const right = keys.KeyD || keys.ArrowRight || touch.right;
  const handbrake = keys.Space || touch.handbrake;

  // ACCELERATION AND BRAKING

  if (gas) {
    speed += ACCELERATION * dt;
  } else {
    speed -= FRICTION * dt;
  }

  if (brake) speed -= BRAKING * dt;
  if (handbrake) speed -= 8 * dt;

  speed = THREE.MathUtils.clamp(speed, 0, MAX_SPEED);

  // STEERING

  const steeringInput =
    (right ? 1 : 0) - (left ? 1 : 0);

  steering = THREE.MathUtils.damp(
    steering,
    steeringInput,
    7,
    dt
  );

  const speedFactor = 0.2 + speed / MAX_SPEED;

  // DRIFT PHYSICS

  const grip = handbrake ? DRIFT_GRIP : NORMAL_GRIP;

  const steeringForce =
    steering * STEERING_POWER * speedFactor * (speed / 12);

  lateralVelocity += steeringForce * dt;

  if (handbrake && speed > 8) {
    lateralVelocity += steering * 2.5 * dt;
  }

  lateralVelocity *= Math.exp(-grip * dt);

  lateralVelocity = THREE.MathUtils.clamp(
    lateralVelocity, -12, 12
  );

  driftAmount = THREE.MathUtils.clamp(
    Math.abs(lateralVelocity) / 12, 0, 1
  );

  car.position.x += lateralVelocity * dt;

  car.position.x = THREE.MathUtils.clamp(
    car.position.x, -6.8, 6.8
  );

  // FORWARD MOVEMENT

  car.position.z -= speed * dt;

  // BODY LEAN AND SLIDE

  const targetRotation =
    -steering * 0.16 - lateralVelocity * 0.025;

  car.rotation.y = THREE.MathUtils.damp(
    car.rotation.y,
    targetRotation,
    handbrake ? 2.5 : 5,
    dt
  );

  car.rotation.z = THREE.MathUtils.damp(
    car.rotation.z,
    -steering * 0.045,
    4,
    dt
  );

  // WHEEL ANIMATION

  wheels.forEach(wheel => {
    wheel.rotation.x -= speed * dt;
  });

  // VISUAL DRIFT INDICATOR

  driftLabel.style.opacity = driftAmount > 0.12 ? '1' : '0';
}

// ==========================================
// MOBILE HUD
// ==========================================

const hudStyle = document.createElement('style');

hudStyle.textContent = `
  * {
    -webkit-user-select:none !important;
    user-select:none !important;
    -webkit-touch-callout:none !important;
    -webkit-tap-highlight-color:transparent !important;
  }

  #hud {
    position:fixed;
    inset:0;
    z-index:20;
    pointer-events:none;
    font-family:Arial,sans-serif;
    color:white;
  }

  #speedBox {
    position:absolute;
    top:20px;
    left:18px;
    background:#080808ee;
    border:1px solid #b7ff00;
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
    width:clamp(58px, 18vw, 82px);
    height:clamp(58px, 18vw, 82px);
    border:2px solid #b7ff00;
    background:#080808ee;
    color:#b7ff00;
    border-radius:50%;
    font-size:25px;
    font-weight:900;
    pointer-events:auto;
    touch-action:none;
    -webkit-user-select:none;
    user-select:none;
    -webkit-touch-callout:none;
    display:flex;
    align-items:center;
    justify-content:center;
    outline:none;
    transition:background .08s, transform .08s;
  }

  .control.active {
    background:#b7ff00;
    color:#080808;
    transform:scale(.92);
  }

  #left {
    left:18px;
    bottom:30px;
  }

  #right {
    left:calc(18px + clamp(58px, 18vw, 82px) + 14px);
    bottom:30px;
  }

  #brake {
    right:calc(18px + clamp(58px, 18vw, 82px) + 14px);
    bottom:30px;
  }

  #gas {
    right:18px;
    bottom:30px;
    background:#b7ff00;
    color:#080808;
  }

  #hand {
    right:18px;
    bottom:125px;
    width:60px;
    height:60px;
    font-size:11px;
    letter-spacing:1px;
  }

  #driftLabel {
    position:absolute;
    top:95px;
    left:20px;
    color:#b7ff00;
    font-size:14px;
    font-weight:900;
    letter-spacing:3px;
    opacity:0;
    transition:opacity .15s;
  }

  @media (orientation:landscape) {
    #left,#right,#brake,#gas { bottom:18px; }
    #hand { bottom:110px; }
  }

  @media (min-width:900px) {
    .control { opacity:.8; }
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

  <div id="driftLabel">DRIFT MODE</div>

  <button class="control" id="left" aria-label="Steer left">◀</button>
  <button class="control" id="right" aria-label="Steer right">▶</button>
  <button class="control" id="brake" aria-label="Brake">▼</button>
  <button class="control" id="gas" aria-label="Accelerate">▲</button>
  <button class="control" id="hand" aria-label="Handbrake">DRIFT</button>
`;

document.body.appendChild(hud);

const driftLabel = document.getElementById('driftLabel');

// ==========================================
// ROBUST MOBILE TOUCH CONTROLS
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

  button.addEventListener('pointerup', e => {
    e.preventDefault();
    release();
  });

  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);

  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  button.addEventListener('contextmenu', e => e.preventDefault());
}

bindButton('left', 'left');
bindButton('right', 'right');
bindButton('gas', 'gas');
bindButton('brake', 'brake');
bindButton('hand', 'handbrake');

// ==========================================
// CHASE CAMERA
// ==========================================

const cameraPosition = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();

function updateCamera(dt) {
  cameraPosition.set(
    car.position.x * 0.65,
    5.5,
    car.position.z + 10
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
// GAME LOOP
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
