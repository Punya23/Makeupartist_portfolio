/* ============================================
   DHRUVI SURANA — hero-scene.js
   Three.js: hero particle field + signature ring
   ============================================ */

import * as THREE from 'three';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GOLD = new THREE.Color('#c9a96e');
const GOLD_LIGHT = new THREE.Color('#f3e3bd');

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}
const WEBGL_OK = supportsWebGL();

/* Bridge other scripts (motion.js) talk to — always defined so callers
   can use optional chaining without caring whether WebGL initialized. */
let signatureProgress = 0;
let heroRevealed = false;
let applyHeroOpacity = () => {};
window.DhruviScene = {
  setSignatureProgress(p) { signatureProgress = p; },
  revealHero() { heroRevealed = true; applyHeroOpacity(); },
};

/* Shared additive gold point-sprite material */
function createGoldPointsMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uColorA: { value: GOLD },
      uColorB: { value: GOLD_LIGHT },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute float aSeed;
      attribute float aSpeed;
      attribute float aSize;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float t = uTime * aSpeed + aSeed;
        p.x += sin(t) * 0.4;
        p.y += cos(t * 0.85) * 0.5;
        p.z += sin(t * 0.6 + 1.5) * 0.35;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aSize * uPixelRatio * (8.0 / -mvPosition.z);
        vAlpha = 0.45 + 0.35 * sin(t * 1.3);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float falloff = smoothstep(0.5, 0.0, d);
        vec3 color = mix(uColorA, uColorB, clamp(vAlpha, 0.0, 1.0));
        gl_FragColor = vec4(color, falloff * clamp(vAlpha, 0.0, 1.0));
      }
    `,
  });
}

/* Visibility-gated render loop: pauses when off-screen or tab hidden */
function createLoop(renderFn) {
  let raf = null;
  let wanted = false;
  function tick() {
    renderFn();
    raf = requestAnimationFrame(tick);
  }
  return {
    start() {
      wanted = true;
      if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
    },
    stop() {
      wanted = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    },
    resume() {
      if (wanted && !raf && !document.hidden) raf = requestAnimationFrame(tick);
    },
  };
}

/* ---------------- HERO PARTICLE FIELD ---------------- */
function initHeroParticles() {
  const canvas = document.getElementById('hero-canvas');
  const host = document.getElementById('hero');
  if (!canvas || !host || !WEBGL_OK || reducedMotion) { if (canvas) canvas.remove(); return; }

  let width = host.clientWidth, height = host.clientHeight;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 12;

  const group = new THREE.Group();
  scene.add(group);

  function particleCountFor(w) { return w < 720 ? 260 : 620; }

  let points = null;
  let currentCount = 0;

  function buildParticles(count) {
    if (points) {
      group.remove(points);
      points.geometry.dispose();
      points.material.dispose();
    }
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 13;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      seeds[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.2 + Math.random() * 0.6;
      sizes[i] = 18 + Math.random() * 42;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    const material = createGoldPointsMaterial();
    points = new THREE.Points(geometry, material);
    group.add(points);
    currentCount = count;
  }
  buildParticles(particleCountFor(width));

  const clock = new THREE.Clock();
  let mouseX = 0, mouseY = 0, autoRot = 0;
  let scrollFade = 1;
  let targetOpacity = 0;
  let currentOpacity = 0;

  function onMouseMove(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener('mousemove', onMouseMove, { passive: true });

  applyHeroOpacity = () => {
    targetOpacity = heroRevealed ? scrollFade : 0;
  };

  function render() {
    const t = clock.getElapsedTime();
    points.material.uniforms.uTime.value = t;
    autoRot += 0.0009;
    group.rotation.y += ((mouseX * 0.18 + autoRot) - group.rotation.y) * 0.05;
    group.rotation.x += ((mouseY * 0.10) - group.rotation.x) * 0.05;

    // Folded into the (visibility-gated) render loop rather than a separate
    // native 'scroll' listener, so this only runs while the hero is on
    // screen and never fights ScrollTrigger's own scroll bookkeeping.
    const rect = host.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / (rect.height * 0.85), 0), 1);
    scrollFade = 1 - progress;
    applyHeroOpacity();
    currentOpacity += (targetOpacity - currentOpacity) * 0.06;
    canvas.style.opacity = currentOpacity.toFixed(3);

    renderer.render(scene, camera);
  }
  const loop = createLoop(render);

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) loop.start(); else loop.stop();
  }, { threshold: 0 });
  io.observe(host);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop(); else loop.resume();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      width = host.clientWidth; height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const desired = particleCountFor(width);
      if (desired !== currentCount) buildParticles(desired);
    }, 150);
  });

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); loop.stop(); });
  canvas.addEventListener('webglcontextrestored', () => { loop.start(); });
}

/* ---------------- SIGNATURE RING SCENE ---------------- */
function initSignatureScene() {
  const canvas = document.getElementById('signature-canvas');
  const host = document.getElementById('signature');
  if (!canvas || !host || !WEBGL_OK || reducedMotion) { if (canvas) canvas.remove(); return; }

  let width = host.clientWidth, height = host.clientHeight;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  const BASE_FOV = 38;
  const camera = new THREE.PerspectiveCamera(BASE_FOV, width / height, 0.1, 100);
  camera.position.set(0, 0, 9);

  // The ring/sparkles extend ~2.9 world units from center. A fixed vertical
  // FOV crops that horizontally on narrow/portrait viewports (and worsens
  // as the pinned scroll dollies the camera in) — widen FOV as needed so
  // the scene always stays framed, without narrowing it below the base
  // look on wide/landscape viewports.
  const RING_SAFE_RADIUS = 2.9;
  function fitCameraFov() {
    const aspect = width / height;
    const distance = camera.position.z;
    const neededTanHalfV = (RING_SAFE_RADIUS / distance) / Math.max(aspect, 0.0001);
    const neededVFovDeg = THREE.MathUtils.radToDeg(2 * Math.atan(neededTanHalfV));
    camera.fov = Math.max(BASE_FOV, Math.min(neededVFovDeg, 100));
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
  fitCameraFov();

  const key = new THREE.DirectionalLight(0xfff2d9, 2.4);
  key.position.set(4, 5, 6);
  scene.add(key);

  const rim = new THREE.PointLight(0x8a3f52, 8, 22);
  rim.position.set(-5, -2, -3);
  scene.add(rim);

  const amb = new THREE.AmbientLight(0x3a2c1a, 1.1);
  scene.add(amb);

  const ringGroup = new THREE.Group();
  ringGroup.rotation.x = 1.15;
  scene.add(ringGroup);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.15, 0.34, 64, 128),
    new THREE.MeshStandardMaterial({ color: 0xc9a96e, metalness: 1, roughness: 0.28 })
  );
  ringGroup.add(ring);

  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.75, 0),
    new THREE.MeshStandardMaterial({
      color: 0xf5eede, metalness: 0.15, roughness: 0.05,
      emissive: 0x2a1d10, emissiveIntensity: 0.3,
    })
  );
  gem.position.set(0, 2.1, 0);
  gem.scale.set(1, 1.35, 1);
  ringGroup.add(gem);

  const SPARKLE_COUNT = 140;
  const sp = new Float32Array(SPARKLE_COUNT * 3);
  const seeds = new Float32Array(SPARKLE_COUNT);
  const speeds = new Float32Array(SPARKLE_COUNT);
  const sizes = new Float32Array(SPARKLE_COUNT);
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 2.5 + Math.random() * 1.4;
    sp[i * 3 + 0] = Math.cos(angle) * r;
    sp[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
    sp[i * 3 + 2] = Math.sin(angle) * r;
    seeds[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.3 + Math.random() * 0.5;
    sizes[i] = 6 + Math.random() * 14;
  }
  const sparkleGeo = new THREE.BufferGeometry();
  sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sparkleGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  sparkleGeo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  sparkleGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const sparkleMaterial = createGoldPointsMaterial();
  ringGroup.add(new THREE.Points(sparkleGeo, sparkleMaterial));

  const clock = new THREE.Clock();
  let idleSpin = 0;

  function render() {
    const t = clock.getElapsedTime();
    sparkleMaterial.uniforms.uTime.value = t;
    idleSpin += 0.0018;
    ringGroup.rotation.y = idleSpin + signatureProgress * Math.PI * 4;
    ring.rotation.z += 0.0012;
    camera.position.z = 9 - signatureProgress * 1.4;
    camera.lookAt(0, 0, 0);
    fitCameraFov();
    renderer.render(scene, camera);
  }
  const loop = createLoop(render);

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) loop.start(); else loop.stop();
  }, { threshold: 0 });
  io.observe(host);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop(); else loop.resume();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      width = host.clientWidth; height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      fitCameraFov();
    }, 150);
  });

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); loop.stop(); });
  canvas.addEventListener('webglcontextrestored', () => { loop.start(); });

  render();
}

initHeroParticles();
initSignatureScene();
