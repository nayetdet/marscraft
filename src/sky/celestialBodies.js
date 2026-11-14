import * as THREE from 'three';

export function createStarfield() {
  const starCount = 1600;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.95 + 0.02);
    const r = 390;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const tint = Math.random();
    if (tint > 0.8) {
      colors[i * 3] = 0.75;
      colors[i * 3 + 1] = 0.88;
      colors[i * 3 + 2] = 1.0;
    } else if (tint > 0.6) {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.86;
      colors[i * 3 + 2] = 0.72;
    } else {
      colors[i * 3] = 0.95;
      colors[i * 3 + 1] = 0.95;
      colors[i * 3 + 2] = 0.98;
    }
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.9,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });

  const points = new THREE.Points(starGeo, material);
  return { points, material };
}

export function createMartianSun() {
  const sunGroup = new THREE.Group();

  const sunGeo = new THREE.SphereGeometry(7.5, 24, 24);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xf4f9ff, fog: false });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunMesh);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.25, 'rgba(135, 206, 250, 0.55)');
  grad.addColorStop(0.6, 'rgba(70, 145, 215, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const glowTex = new THREE.CanvasTexture(canvas);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const sunSprite = new THREE.Sprite(glowMat);
  sunSprite.scale.set(55, 55, 1);
  sunGroup.add(sunSprite);

  return { sunGroup, sunMesh };
}

export function createEarthAndMoonSystem() {
  const earthSystemGroup = new THREE.Group();

  const earthCanvas = document.createElement('canvas');
  earthCanvas.width = 128;
  earthCanvas.height = 64;
  const ectx = earthCanvas.getContext('2d');

  ectx.fillStyle = '#0ea5e9';
  ectx.fillRect(0, 0, 128, 64);
  ectx.fillStyle = '#0369a1';
  ectx.fillRect(0, 8, 128, 48);

  // Calotas polares
  ectx.fillStyle = '#f8fafc';
  ectx.fillRect(0, 0, 128, 6);
  ectx.fillRect(0, 58, 128, 6);

  // Continentes (Américas, África, Eurásia, Austrália)
  ectx.fillStyle = '#22c55e';
  ectx.fillRect(26, 14, 14, 14);
  ectx.fillRect(34, 28, 12, 20);
  ectx.fillRect(62, 12, 14, 10);
  ectx.fillRect(64, 22, 16, 22);
  ectx.fillRect(82, 12, 24, 18);
  ectx.fillRect(98, 38, 10, 8);

  ectx.fillStyle = '#eab308';
  ectx.fillRect(64, 22, 14, 7);

  // Nuvens
  ectx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ectx.fillRect(18, 18, 22, 3);
  ectx.fillRect(58, 30, 26, 3);
  ectx.fillRect(85, 20, 20, 4);

  const earthTex = new THREE.CanvasTexture(earthCanvas);
  earthTex.magFilter = THREE.NearestFilter;
  earthTex.colorSpace = THREE.SRGBColorSpace;

  const earthGeo = new THREE.SphereGeometry(4.2, 24, 24);
  const earthMat = new THREE.MeshBasicMaterial({ map: earthTex, fog: false });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthSystemGroup.add(earthMesh);

  // Halo azul brilhante do "Pálido Ponto Azul"
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const hctx = haloCanvas.getContext('2d');
  const hgrad = hctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  hgrad.addColorStop(0, 'rgba(224, 242, 254, 1.0)');
  hgrad.addColorStop(0.18, 'rgba(56, 189, 248, 0.9)');
  hgrad.addColorStop(0.45, 'rgba(14, 165, 233, 0.35)');
  hgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  hctx.fillStyle = hgrad;
  hctx.fillRect(0, 0, 128, 128);

  const haloTex = new THREE.CanvasTexture(haloCanvas);
  const haloMat = new THREE.SpriteMaterial({
    map: haloTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const earthHalo = new THREE.Sprite(haloMat);
  earthHalo.scale.set(26, 26, 1);
  earthSystemGroup.add(earthHalo);

  // A Lua ao lado da Terra
  const moonGeo = new THREE.SphereGeometry(1.25, 16, 16);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xdbe4ee, fog: false });
  const terraMoonMesh = new THREE.Mesh(moonGeo, moonMat);
  terraMoonMesh.position.set(10.5, 2.8, 0);
  earthSystemGroup.add(terraMoonMesh);

  const moonHalo = new THREE.Sprite(haloMat.clone());
  moonHalo.scale.set(7.5, 7.5, 1);
  terraMoonMesh.add(moonHalo);

  const earthBaseDir = new THREE.Vector3(-0.42, 0.52, -0.74).normalize();
  earthSystemGroup.position.copy(earthBaseDir.multiplyScalar(340));

  return { earthSystemGroup, earthMesh };
}

export function createMartianMoons() {
  const phobosGroup = new THREE.Group();
  const phobosMat = new THREE.MeshStandardMaterial({
    color: 0x9c887e,
    roughness: 0.95,
    emissive: 0x3b2f2a,
    emissiveIntensity: 0.45,
    fog: false,
  });
  const pCore = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 6), phobosMat);
  const pLobe1 = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 5), phobosMat);
  pLobe1.position.set(3, 0.5, 0.5);
  const pLobe2 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), phobosMat);
  pLobe2.position.set(-3, -0.4, -0.5);
  phobosGroup.add(pCore, pLobe1, pLobe2);

  const deimosGroup = new THREE.Group();
  const deimosMat = new THREE.MeshBasicMaterial({ color: 0xdfd3c3, fog: false });
  const deimosMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 2.4), deimosMat);
  deimosGroup.add(deimosMesh);

  return { phobosGroup, deimosGroup };
}
