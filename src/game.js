
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

// ======================================
// AFTERHOURS | KALYUG
// BUILD 0.2 - DRIVING MECHANICS
// ======================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101214);
scene.fog = new THREE.Fog(0x101214, 45, 230);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, 0.1, 700
);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.getElementById('game').appendChild(renderer.domElement);

// LIGHTING
scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-15, 30, 15);
sun.castShadow = true;
scene.add(sun);

// ROAD
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 700),
  new THREE.MeshStandardMaterial({ color: 0x292929 })
);
road.rotation.x = -Math.PI / 2;
road.position.z = -300;
road.receiveShadow = true;
scene.add(road);

// ROAD LINES
const lines = new THREE.Group();

for (let z = 35; z > -650; z -= 12) {
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.025, 5),
    new THREE.MeshBasicMaterial({ color: 0xd6d6d6 })
  );

  line.position.set(0, 0.025, z);
  lines.add(line);
}

scene.add(lines);

// ROAD SIDES
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 900),
  new THREE.MeshStandardMaterial({ color: 0x171c1a })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.08, -300);
scene.add(ground);

// STREET LIGHTS
for (let z = 20; z > -600; z -= 45) {
  for (const x of [-11, 11]) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.13, 7, 8),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );

    pole.position.set(x, 3.5, z);
    scene.add(pole);

    const lamp = new THREE.PointLight(0xddeeff, 3, 20);
    lamp.position.set(x, 7, z);
    scene.add(lamp);
  }
}

// PLAYER CAR
const car = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.65, 4),
  new THREE.MeshStandardMaterial({
    color: 0x242424,
    metalness: 0.8,
    roughness: 0.25
  })
);

body.position.y = 0.85;
body.castShadow = true;
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

car.position.set(0, 0, 3);
scene.add(car);

// INITIAL CAMERA
camera.position.set(0, 5, 11);
camera.lookAt(car.position);

// ======================================
// DRIVING PHYSICS
// ======================================

const keys = {};

let speed = 0;
let steering = 0;
let maxSpeed = 65;

const acceleration = 24;
const braking = 48;
const friction = 9;
const steeringPower = 1.65;

const touch = {
  left: false,
  right: false,
  gas: false,
  brake: false,
  handbrake: false
};

addEventListener('keydown', e => {
  keys[e.code] = true;

  if ([
    'ArrowUp', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'Space'
  ].includes(e.code)) {
    e.preventDefault();
  }
});

addEventListener('keyup', e => {
  keys[e.code] = false;
});

function updatePhysics(dt) {
  const gas = keys.KeyW || keys.ArrowUp || touch.gas;
  const brake = keys.KeyS || keys.ArrowDown || touch.brake;
  const left = keys.KeyA || keys.ArrowLeft || touch.left;
  const right = keys.KeyD || keys.ArrowRight || touch.right;
  const handbrake = keys.Space || touch.handbrake;

  if (gas) speed += acceleration * dt;
  else speed -= friction * dt;

  if (brake) speed -= braking * dt;

  if (handbrake) speed -= 32 * dt;

  speed = THREE.MathUtils.clamp(speed, 0, maxSpeed);

  const steeringInput = (right ? 1 : 0) - (left ? 1 : 0);

  steering = THREE.MathUtils.damp(
    steering,
    steeringInput,
    5,
    dt
  );

  const movementFactor = 0.25 + speed / maxSpeed;

  car.position.x += steering * steeringPower *
    movementFactor * dt * Math.max(speed, 5);

  car.position.x = THREE.MathUtils.clamp(
    car.position.x, -6.5, 6.5
  );

  car.position.z -= speed * dt;

  car.rotation.y = THREE.MathUtils.damp(
    car.rotation.y,
    -steering * 0.22,
    5,
    dt
  );

  wheels.forEach(wheel => {
    wheel.rotation.x -= speed * dt;
  });
}

// ======================================
// MOBILE HUD
// ======================================

const style = document.createElement('style');

style.textContent = `
  #hud {
    position:fixed;
    inset:0;
    z-index:5;
    pointer-events:none;
    font-family:Arial,sans-serif;
    color:white;
  }

  #speedBox {
    position:absolute;
    top:22px;
    left:20px;
    background:#080808cc;
    border:1px solid #b7ff00;
    padding:12px 17px;
    border-radius:8px;
  }

  #speed {
    color:#b7ff00;
    font-size:30px;
    font-weight:900;
  }

  #unit {
    font-size:10px;
    color:#aaa;
    letter-spacing:2px;
  }

  .control {
    position:absolute;
    bottom:28px;
    width:68px;
    height:68px;
    border:1px solid #b7ff00;
    background:#111d;
    color:#b7ff00;
    border-radius:50%;
    font-size:24px;
    font-weight:bold;
    pointer-events:auto;
    touch-action:none;
    user-select:none;
  }

  #left { left:20px; }
  #right { left:100px; }
  #brake { right:100px; }
  #gas {
    right:20px;
    width:78px;
    height:78px;
    background:#b7ff00;
    color:#080808;
  }

  #hand {
    right:20px;
    bottom:120px;
    width:58px;
    height:58px;
    font-size:12px;
  }

  @media (min-width:800px) {
    .control { opacity:.75; }
  }
`;

document.head.appendChild(style);

const hud = document.createElement('div');
hud.id = 'hud';

hud.innerHTML = `
  <div id="speedBox">
    <div id="speed">000</div>
    <div id="unit">KM/H</div>
  </div>

  <button class="control" id="left">◀</button>
  <button class="control" id="right">▶</button>
  <button class="control" id="brake">▼</button>
  <button class="control" id="gas">▲</button>
  <button class="control" id="hand">DRIFT</button>
`;

document.body.appendChild(hud);

// TOUCH CONTROLS
function bindButton(id, property) {
  const button = document.getElementById(id);

  button.addEventListener('pointerdown', e => {
    e.preventDefault();
    touch[property] = true;
    button.setPointerCapture(e.pointerId);
  });

  const release = e => {
    e.preventDefault();
    touch[property] = false;
  };

  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', () => {
    touch[property] = false;
  });
}

bindButton('left', 'left');
bindButton('right', 'right');
bindButton('gas', 'gas');
bindButton('brake', 'brake');
bindButton('hand', 'handbrake');

// ======================================
// CHASE CAMERA
// ======================================

const cameraTarget = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();

function updateCamera(dt) {
  cameraTarget.set(
    car.position.x,
    1.5,
    car.position.z
  );

  cameraPosition.set(
    car.position.x * 0.65,
    5.5,
    car.position.z + 10
  );

  camera.position.lerp(
    cameraPosition,
    1 - Math.exp(-4 * dt)
  );

  camera.lookAt(
    cameraTarget.x,
    cameraTarget.y,
    cameraTarget.z - 3
  );
}

// ======================================
// GAME LOOP
// ======================================

const speedDisplay = document.getElementById('speed');

let previousTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min((now - previousTime) / 1000, 0.04);
  previousTime = now;

  updatePhysics(dt);
  updateCamera(dt);

  speedDisplay.textContent = String(
    Math.round(speed * 3.6)
  ).padStart(3, '0');

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);

// RESIZE
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
});
