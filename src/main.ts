import * as THREE from 'three';
import './styles.css';

const canvas = document.querySelector<HTMLCanvasElement>('#scene');

if (!canvas) {
  throw new Error('Scene canvas was not found.');
}

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

const group = new THREE.Group();
scene.add(group);

const coreGeometry = new THREE.IcosahedronGeometry(1.25, 4);
const coreMaterial = new THREE.MeshStandardMaterial({
  color: 0xf4f0d8,
  roughness: 0.28,
  metalness: 0.18,
});
const core = new THREE.Mesh(coreGeometry, coreMaterial);
group.add(core);

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

const starGeometry = new THREE.BufferGeometry();
const starCount = 650;
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

window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
});

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

const animate = () => {
  const elapsed = clock.getElapsedTime();

  core.rotation.x = elapsed * 0.24;
  core.rotation.y = elapsed * 0.36;
  ringA.rotation.z = elapsed * 0.38;
  ringB.rotation.z = -elapsed * 0.24;
  stars.rotation.y = elapsed * 0.012;

  group.rotation.y += (pointer.x * 0.22 - group.rotation.y) * 0.035;
  group.rotation.x += (-pointer.y * 0.12 - group.rotation.x) * 0.035;
  group.position.y = Math.sin(elapsed * 1.2) * 0.08;

  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
};

animate();
