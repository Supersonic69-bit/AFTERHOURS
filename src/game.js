
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101214);
scene.fog = new THREE.Fog(0x101214, 35, 180);

export const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

camera.position.set(0, 5, 11);

export const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

document.getElementById('game').appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 2));

const sunlight = new THREE.DirectionalLight(0xffffff, 2);
sunlight.position.set(-10, 20, 10);
scene.add(sunlight);

// Road
const road = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 400),
  new THREE.MeshStandardMaterial({ color: 0x292929 })
);

road.rotation.x = -Math.PI / 2;
road.position.z = -180;
scene.add(road);

// Player car
export const car = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.65, 4),
  new THREE.MeshStandardMaterial({
    color: 0x242424,
    metalness: 0.8,
    roughness: 0.25
  })
);

body.position.y = 0.85;
car.add(body);

const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.65, 1.8),
  new THREE.MeshStandardMaterial({ color: 0x101820 })
);

cabin.position.set(0, 1.4, -0.2);
car.add(cabin);

for (const x of [-1.05, 1.05]) {
  for (const z of [-1.3, 1.3]) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.28, 24),
      new THREE.MeshStandardMaterial({ color: 0x080808 })
    );

    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.45, z);
    car.add(wheel);
  }
}

car.position.set(0, 0, 3);
scene.add(car);

camera.lookAt(car.position);

// Render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
