import * as THREE from 'three';

export function createStarfield() {
  const starCount = 1200;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.92 + 0.04);
    const r = 390;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    colors[i * 3] = 0.96;
    colors[i * 3 + 1] = 0.97;
    colors[i * 3 + 2] = 1.0;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.0,
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

  const sunGeo = new THREE.SphereGeometry(8.5, 16, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunMesh);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.28, 'rgba(147, 210, 255, 0.65)');
  grad.addColorStop(0.65, 'rgba(80, 160, 230, 0.25)');
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
  sunSprite.scale.set(60, 60, 1);
  sunGroup.add(sunSprite);

  return { sunGroup, sunMesh };
}

export function createEarthAndMoonSystem() {
  const earthSystemGroup = new THREE.Group();

  const earthCanvas = document.createElement('canvas');
  earthCanvas.width = 128;
  earthCanvas.height = 64;
  const ectx = earthCanvas.getContext('2d');

  // Oceanos azuis vivos
  ectx.fillStyle = '#0284c7';
  ectx.fillRect(0, 0, 128, 64);
  ectx.fillStyle = '#38bdf8';
  ectx.fillRect(0, 10, 128, 44);

  // Calotas polares brancas
  ectx.fillStyle = '#ffffff';
  ectx.fillRect(0, 0, 128, 6);
  ectx.fillRect(0, 58, 128, 6);

  // Continentes verdes bem visíveis
  ectx.fillStyle = '#22c55e';
  ectx.fillRect(24, 12, 16, 16);
  ectx.fillRect(32, 28, 14, 22);
  ectx.fillRect(60, 12, 16, 12);
  ectx.fillRect(62, 24, 18, 22);
  ectx.fillRect(82, 12, 26, 18);
  ectx.fillRect(98, 38, 12, 10);

  // Nuvens brancas
  ectx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ectx.fillRect(18, 18, 24, 3);
  ectx.fillRect(58, 30, 28, 4);
  ectx.fillRect(85, 20, 22, 4);

  const earthTex = new THREE.CanvasTexture(earthCanvas);
  earthTex.magFilter = THREE.NearestFilter;
  earthTex.colorSpace = THREE.SRGBColorSpace;

  // Terra bem visível no céu marciano
  const earthGeo = new THREE.SphereGeometry(7.2, 20, 20);
  const earthMat = new THREE.MeshBasicMaterial({ map: earthTex, fog: false });
  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  earthSystemGroup.add(earthMesh);

  // Brilho azul celeste em volta da Terra
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const hctx = haloCanvas.getContext('2d');
  const hgrad = hctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  hgrad.addColorStop(0, 'rgba(224, 242, 254, 1.0)');
  hgrad.addColorStop(0.25, 'rgba(56, 189, 248, 0.95)');
  hgrad.addColorStop(0.55, 'rgba(14, 165, 233, 0.45)');
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
  earthHalo.scale.set(36, 36, 1);
  earthSystemGroup.add(earthHalo);

  // Lua da Terra ao lado
  const moonGeo = new THREE.SphereGeometry(2.2, 12, 12);
  const moonMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, fog: false });
  const terraMoonMesh = new THREE.Mesh(moonGeo, moonMat);
  terraMoonMesh.position.set(15.0, 3.5, 0);
  earthSystemGroup.add(terraMoonMesh);

  const moonHalo = new THREE.Sprite(haloMat.clone());
  moonHalo.scale.set(10, 10, 1);
  terraMoonMesh.add(moonHalo);

  // Posição baixa-média no céu a Norte-Noroeste (bem fácil de enxergar logo acima da base!)
  const earthBaseDir = new THREE.Vector3(-0.28, 0.32, -0.90).normalize();
  earthSystemGroup.position.copy(earthBaseDir.multiplyScalar(320));

  return { earthSystemGroup, earthMesh };
}

export function createMartianMoons() {
  const phobosGroup = new THREE.Group();
  const phobosMat = new THREE.MeshLambertMaterial({
    color: 0xd6c7bc,
    emissive: 0x6e5d53,
    emissiveIntensity: 0.5,
    fog: false,
  });
  const pCore = new THREE.Mesh(new THREE.BoxGeometry(9, 6.5, 7.5), phobosMat);
  const pLobe1 = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 6), phobosMat);
  pLobe1.position.set(4, 0.5, 0.5);
  const pLobe2 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), phobosMat);
  pLobe2.position.set(-4, -0.4, -0.5);
  phobosGroup.add(pCore, pLobe1, pLobe2);

  const deimosGroup = new THREE.Group();
  const deimosMat = new THREE.MeshBasicMaterial({ color: 0xf5ebe0, fog: false });
  const deimosMesh = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.5, 3.8), deimosMat);
  deimosGroup.add(deimosMesh);

  return { phobosGroup, deimosGroup };
}
