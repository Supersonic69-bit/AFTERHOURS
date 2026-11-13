
// ==========================================
// AFTERHOURS HIGHWAY — ROAD MATERIALS
// ==========================================

const asphaltMat = new THREE.MeshStandardMaterial({
  color: 0x20252b,
  roughness: 0.82,
  metalness: 0.08
});

const shoulderMat = new THREE.MeshStandardMaterial({
  color: 0x343b40,
  roughness: 0.95
});

const lineMat = new THREE.MeshStandardMaterial({
  color: 0xf3f3ed,
  roughness: 0.65,
  emissive: 0x222222
});

const curbMat = new THREE.MeshStandardMaterial({
  color: 0x858d91,
  metalness: 0.75,
  roughness: 0.35
});

const poleMat = new THREE.MeshStandardMaterial({
  color: 0x343a40,
  metalness: 0.8,
  roughness: 0.35
});

const lampMat = new THREE.MeshStandardMaterial({
  color: 0xffedc2,
  emissive: 0xffd28a,
  emissiveIntensity: 2.2
});

// ==========================================
// LUXURY MIDNIGHT HIGHWAY
// ==========================================

const ROAD_WIDTH = 14;
const SEGMENT_LENGTH = 180;
const SEGMENT_COUNT = 7;

const roadSegments = [];

function createRoadSegment(z) {
  const group = new THREE.Group();
  group.position.z = z;

  // Main asphalt road
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

  // Roadside structures
  for (const side of [-1, 1]) {

    // Road shoulder
    const shoulder = new THREE.Mesh(
      new THREE.BoxGeometry(
        3.5,
        0.12,
        SEGMENT_LENGTH
      ),
      shoulderMat
    );

    shoulder.position.set(
      side * 8.75,
      -0.20,
      0
    );

    group.add(shoulder);

    // White road edge line
    const edgeLine = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.14,
        0.025,
        SEGMENT_LENGTH
      ),
      lineMat
    );

    edgeLine.position.set(
      side * 6.65,
      0.005,
      0
    );

    group.add(edgeLine);

    // Guardrail support posts
    for (let i = 0; i < 10; i++) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.16,
          1.1,
          0.18
        ),
        poleMat
      );

      post.position.set(
        side * 10.2,
        0.48,
        -SEGMENT_LENGTH / 2 + i * 18
      );

      group.add(post);
    }

    // Metallic guardrail
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.22,
        0.28,
        SEGMENT_LENGTH
      ),
      curbMat
    );

    rail.position.set(
      side * 10.2,
      0.85,
      0
    );

    group.add(rail);

    // Streetlights — lightweight version
    for (let i = 0; i < 5; i++) {

      const lightZ =
        -SEGMENT_LENGTH / 2 + 18 + i * 36;

      // Light pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.09,
          0.13,
          7,
          8
        ),
        poleMat
      );

      pole.position.set(
        side * 11.5,
        3.5,
        lightZ
      );

      group.add(pole);

      // Light arm
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(
          1.2,
          0.10,
          0.10
        ),
        poleMat
      );

      arm.position.set(
        side * 10.95,
        6.9,
        lightZ
      );

      group.add(arm);

      // Glowing lamp — no PointLight
      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.8,
          0.13,
          0.38
        ),
        lampMat
      );

      lamp.position.set(
        side * 10.35,
        6.85,
        lightZ
      );

      group.add(lamp);
    }
  }

  scene.add(group);
  return group;
}

// Create road segments
for (let i = 0; i < SEGMENT_COUNT; i++) {
  roadSegments.push(
    createRoadSegment(
      90 - i * SEGMENT_LENGTH
    )
  );
}

// ==========================================
// HIGHWAY LANE MARKINGS
// ==========================================

const DASH_SPACING = 18;
const DASH_COUNT = 100;

const dashes = [];

const dashGeometry = new THREE.BoxGeometry(
  0.13,
  0.025,
  7
);

for (let i = 0; i < DASH_COUNT; i++) {

  const dash = new THREE.Mesh(
    dashGeometry,
    lineMat
  );

  dash.position.set(
    0,
    0.015,
    100 - i * DASH_SPACING
  );

  scene.add(dash);
  dashes.push(dash);
}
