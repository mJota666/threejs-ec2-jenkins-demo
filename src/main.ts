import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './styles.css';

const canvas = document.querySelector<HTMLCanvasElement>('#scene');
const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.mode-button'));
const velocityReadout = document.querySelector<HTMLElement>('#velocity-readout');
const modeReadout = document.querySelector<HTMLElement>('#mode-readout');

if (!canvas) {
  throw new Error('Scene canvas was not found.');
}

type SceneMode = 'launch' | 'scan' | 'storm';

type ModeConfig = {
  accent: number;
  core: number;
  fog: number;
  label: string;
  speed: number;
};

const modes: Record<SceneMode, ModeConfig> = {
  launch: {
    accent: 0x4dd6b8,
    core: 0xf4f0d8,
    fog: 0x061018,
    label: 'Launch',
    speed: 1,
  },
  scan: {
    accent: 0x77a7ff,
    core: 0xc8f2ff,
    fog: 0x071221,
    label: 'Scan',
    speed: 0.65,
  },
  storm: {
    accent: 0xff5f7e,
    core: 0xffe0a8,
    fog: 0x140814,
    label: 'Storm',
    speed: 1.75,
  },
};

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x061018, 0.055);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x061018, 1);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 1.35, 6.6);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = false;
controls.minDistance = 3.25;
controls.maxDistance = 11;
controls.maxPolarAngle = Math.PI * 0.78;
controls.target.set(0, -0.15, 0);

const group = new THREE.Group();
scene.add(group);

const coreMaterial = new THREE.MeshStandardMaterial({
  color: 0xf4f0d8,
  roughness: 0.28,
  metalness: 0.18,
});
const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 4), coreMaterial);
group.add(core);

const pulseMaterial = new THREE.MeshBasicMaterial({
  color: 0x4dd6b8,
  transparent: true,
  opacity: 0.08,
  wireframe: true,
});
const pulse = new THREE.Mesh(new THREE.IcosahedronGeometry(1.62, 2), pulseMaterial);
group.add(pulse);

const ringMaterial = new THREE.MeshStandardMaterial({
  color: 0x4dd6b8,
  emissive: 0x123f38,
  roughness: 0.18,
  metalness: 0.35,
  side: THREE.DoubleSide,
});

const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.025, 12, 140), ringMaterial);
ringA.rotation.x = Math.PI * 0.58;
group.add(ringA);

const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.018, 12, 140), ringMaterial);
ringB.rotation.x = Math.PI * 0.28;
ringB.rotation.y = Math.PI * 0.2;
group.add(ringB);

const satelliteMaterial = new THREE.MeshStandardMaterial({
  color: 0xdffcf7,
  emissive: 0x163f39,
  roughness: 0.35,
  metalness: 0.55,
});

const satellites = Array.from({ length: 12 }, (_, index) => {
  const satellite = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.44), satelliteMaterial);
  satellite.userData.phase = (index / 12) * Math.PI * 2;
  satellite.userData.radius = 2.9 + (index % 3) * 0.34;
  satellite.userData.height = -0.22 + (index % 4) * 0.18;
  group.add(satellite);
  return satellite;
});

const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(2.8, 3.25, 0.34, 96),
  new THREE.MeshStandardMaterial({
    color: 0x18252b,
    roughness: 0.62,
    metalness: 0.45,
  }),
);
platform.position.y = -1.85;
scene.add(platform);

const grid = new THREE.GridHelper(12, 36, 0x4dd6b8, 0x233940);
grid.position.y = -1.66;
scene.add(grid);

const scanLineMaterial = new THREE.MeshBasicMaterial({
  color: 0x4dd6b8,
  transparent: true,
  opacity: 0.42,
  side: THREE.DoubleSide,
});
const scanLine = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.76, 128), scanLineMaterial);
scanLine.rotation.x = Math.PI * -0.5;
scanLine.position.y = -1.48;
scene.add(scanLine);

const starGeometry = new THREE.BufferGeometry();
const starCount = 900;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i += 1) {
  const radius = THREE.MathUtils.randFloat(9, 28);
  const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const phi = THREE.MathUtils.randFloat(0.18, Math.PI - 0.18);

  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = radius * Math.cos(phi);
  starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xd8fff6,
    size: 0.045,
    transparent: true,
    opacity: 0.78,
  }),
);
scene.add(stars);

scene.add(new THREE.HemisphereLight(0xdffcf7, 0x071014, 2.2));

const keyLight = new THREE.DirectionalLight(0xffffff, 2.9);
keyLight.position.set(4, 5, 4);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x4dd6b8, 14, 18);
rimLight.position.set(-3.2, 1.8, 2.6);
scene.add(rimLight);

const pointer = new THREE.Vector2(0, 0);
const keys = new Set<string>();
const reusableColor = new THREE.Color();
let activeMode: SceneMode = 'launch';
let targetMode = modes.launch;
let cameraRigVelocity = new THREE.Vector3();
let boost = 1;

window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener('keydown', (event) => {
  keys.add(event.key.toLowerCase());
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

const setMode = (mode: SceneMode) => {
  activeMode = mode;
  targetMode = modes[mode];
  document.documentElement.dataset.mode = mode;
  modeReadout?.replaceChildren(targetMode.label);

  modeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.mode === mode);
  });
};

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const requestedMode = button.dataset.mode;

    if (requestedMode === 'launch' || requestedMode === 'scan' || requestedMode === 'storm') {
      setMode(requestedMode);
    }
  });
});

setMode(activeMode);

const resize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();

const updateCameraMovement = (delta: number) => {
  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  right.crossVectors(forward, camera.up).normalize();

  if (keys.has('w') || keys.has('arrowup')) {
    direction.add(forward);
  }

  if (keys.has('s') || keys.has('arrowdown')) {
    direction.sub(forward);
  }

  if (keys.has('d') || keys.has('arrowright')) {
    direction.add(right);
  }

  if (keys.has('a') || keys.has('arrowleft')) {
    direction.sub(right);
  }

  if (direction.lengthSq() > 0) {
    direction.normalize();
  }

  boost += (((keys.has('shift') ? 2.4 : 1) - boost) * 0.08);
  const desired = direction.multiplyScalar(delta * 2.75 * boost);
  cameraRigVelocity.lerp(desired, 0.22);

  camera.position.add(cameraRigVelocity);
  controls.target.add(cameraRigVelocity);
  controls.target.x = THREE.MathUtils.clamp(controls.target.x, -4.5, 4.5);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, -4.5, 4.5);
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -7, 7);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -1.5, 10);
  velocityReadout?.replaceChildren(`${boost.toFixed(1)}x`);
};

const animate = () => {
  const elapsed = clock.getElapsedTime();
  const delta = Math.min(clock.getDelta(), 0.033);
  const speed = targetMode.speed;

  updateCameraMovement(delta);

  const accentColor = new THREE.Color(targetMode.accent);
  const coreColor = new THREE.Color(targetMode.core);
  const fogColor = new THREE.Color(targetMode.fog);

  coreMaterial.color.lerp(coreColor, 0.045);
  ringMaterial.color.lerp(accentColor, 0.055);
  ringMaterial.emissive.lerp(accentColor.clone().multiplyScalar(0.28), 0.055);
  satelliteMaterial.emissive.lerp(accentColor.clone().multiplyScalar(0.22), 0.055);
  rimLight.color.lerp(accentColor, 0.055);
  scanLineMaterial.color.lerp(accentColor, 0.055);
  pulseMaterial.color.lerp(accentColor, 0.055);

  renderer.getClearColor(reusableColor);
  reusableColor.lerp(fogColor, 0.04);
  renderer.setClearColor(reusableColor, 1);

  if (scene.fog instanceof THREE.FogExp2) {
    scene.fog.color.lerp(fogColor, 0.04);
    scene.fog.density += ((activeMode === 'storm' ? 0.075 : 0.055) - scene.fog.density) * 0.035;
  }

  core.rotation.x = elapsed * 0.24 * speed;
  core.rotation.y = elapsed * 0.36 * speed;
  pulse.rotation.x = -elapsed * 0.18 * speed;
  pulse.rotation.y = elapsed * 0.28 * speed;
  pulse.scale.setScalar(1 + Math.sin(elapsed * 2.8 * speed) * 0.06);
  ringA.rotation.z = elapsed * 0.38 * speed;
  ringB.rotation.z = -elapsed * 0.24 * speed;
  stars.rotation.y = elapsed * 0.012 * speed;
  scanLine.scale.setScalar(1.15 + ((elapsed * 0.42 * speed) % 1) * 5.8);
  scanLineMaterial.opacity = THREE.MathUtils.clamp(0.5 - ((elapsed * 0.42 * speed) % 1) * 0.42, 0, 0.5);

  satellites.forEach((satellite) => {
    const phase = satellite.userData.phase as number;
    const radius = satellite.userData.radius as number;
    const height = satellite.userData.height as number;
    const orbit = elapsed * (0.45 + radius * 0.04) * speed + phase;

    satellite.position.set(Math.cos(orbit) * radius, height + Math.sin(orbit * 1.8) * 0.22, Math.sin(orbit) * radius);
    satellite.lookAt(core.position);
  });

  group.rotation.y += (pointer.x * 0.22 - group.rotation.y) * 0.035;
  group.rotation.x += (-pointer.y * 0.12 - group.rotation.x) * 0.035;
  group.position.y = Math.sin(elapsed * 1.2) * 0.08;

  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
