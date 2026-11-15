import * as THREE from 'three';

const TEXTURE_BASE = `${import.meta.env.BASE_URL}textures/`;

export function createStarfield() {
  const starCount = 1200;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  const palette = [
    [0.95, 0.97, 1.0],
    [0.82, 0.90, 1.0],
    [1.0, 0.96, 0.88],
    [1.0, 0.88, 0.75],
  ];

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.92 + 0.04);
    const r = 390;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const tint = palette[i % palette.length];
    colors[i * 3] = tint[0];
    colors[i * 3 + 1] = tint[1];
    colors[i * 3 + 2] = tint[2];
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

// Shader esferico para planetas e luas: iluminacao 3D luminosa, conversao correta para sRGB
// (#include <colorspace_fragment> evita escurecer 2x!) e brilho Fresnel de atmosfera.
function createPlanetShaderMaterial(texture, {
  rimColor = new THREE.Color(0x38bdf8),
  rimStrength = 0.65,
  rimPower = 2.4,
  minLight = 0.85,
  maxLight = 1.25,
  lightDir = new THREE.Vector3(-0.55, 0.45, 0.70).normalize(),
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uRimColor: { value: rimColor },
      uRimStrength: { value: rimStrength },
      uRimPower: { value: rimPower },
      uMinLight: { value: minLight },
      uMaxLight: { value: maxLight },
      uLightDir: { value: lightDir },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uRimColor;
      uniform float uRimStrength;
      uniform float uRimPower;
      uniform float uMinLight;
      uniform float uMaxLight;
      uniform vec3 uLightDir;

      varying vec2 vUv;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        vec3 texColor = texture2D(uMap, vUv).rgb;
        vec3 N = normalize(vViewNormal);
        vec3 V = normalize(vViewDir);
        vec3 L = normalize(uLightDir);

        float ndotl = dot(N, L) * 0.5 + 0.5;
        float shade = mix(uMinLight, uMaxLight, smoothstep(0.05, 0.92, ndotl));

        float ndotv = clamp(dot(N, V), 0.0, 1.0);
        float limb = mix(0.88, 1.0, pow(ndotv, 0.35));
        float fresnel = pow(1.0 - ndotv, uRimPower) * uRimStrength;

        vec3 color = texColor * shade * limb + uRimColor * fresnel;
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    fog: false,
  });
}

// Shader do Sol: nucleo branco-dourado incandescente com plasma suave na borda (sem manchas tipo "queijo").
function createSunMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      // Brilho extra do disco no modo Shaders (HDR, para o bloom); 1 = visual normal
      uBoost: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormalDir;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        vNormalDir = normalize(position);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uBoost;
      varying vec3 vNormalDir;
      varying vec3 vViewNormal;
      varying vec3 vViewDir;

      void main() {
        vec3 N = normalize(vViewNormal);
        vec3 V = normalize(vViewDir);
        float ndotv = clamp(dot(N, V), 0.0, 1.0);

        // Turbulencia suave de plasma estelar sem pontos escuros
        vec3 p = vNormalDir * 6.0;
        float wave =
          sin(p.x * 2.1 + uTime * 0.6) *
          cos(p.y * 2.3 - uTime * 0.5) *
          sin(p.z * 2.0 + uTime * 0.4);
        float plasma = wave * 0.5 + 0.5;

        vec3 coreWhite = vec3(1.0, 0.99, 0.94);
        vec3 midGold = vec3(1.0, 0.88, 0.38);
        vec3 limbAmber = vec3(1.0, 0.52, 0.14);

        vec3 col = mix(limbAmber, midGold, smoothstep(0.0, 0.55, ndotv));
        col = mix(col, coreWhite, smoothstep(0.32, 0.95, ndotv));
        col += vec3(0.08, 0.04, 0.0) * plasma * (1.0 - ndotv * 0.4);

        gl_FragColor = vec4(col * 1.15 * uBoost, 1.0);
        #include <colorspace_fragment>
      }
    `,
    fog: false,
  });
}

export function createMartianSun() {
  const sunGroup = new THREE.Group();

  const sunGeo = new THREE.SphereGeometry(8.5, 32, 32);
  const sunMat = createSunMaterial();
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunMesh);

  // Coroa solar luminosa + dispersao azul marciana sutil ao redor do Sol
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const cx = 128;
  const cy = 128;

  const grad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 126);
  grad.addColorStop(0, 'rgba(255, 252, 235, 0.98)');
  grad.addColorStop(0.22, 'rgba(254, 240, 138, 0.78)');
  grad.addColorStop(0.42, 'rgba(251, 191, 36, 0.35)');
  grad.addColorStop(0.62, 'rgba(147, 210, 255, 0.30)');
  grad.addColorStop(0.84, 'rgba(80, 165, 235, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Raios suaves da coroa solar em gradiente radial limpo
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    const rayGrad = ctx.createRadialGradient(0, 0, 18, 0, 0, 118);
    rayGrad.addColorStop(0, 'rgba(255, 250, 220, 0.25)');
    rayGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.12)');
    rayGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(0, -118);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 118);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const glowTex = new THREE.CanvasTexture(canvas);
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const sunSprite = new THREE.Sprite(glowMat);
  sunSprite.scale.set(64, 64, 1);
  sunGroup.add(sunSprite);

  return { sunGroup, sunMesh };
}

function createEarthFallbackTexture() {
  const W = 256;
  const H = 128;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#072463');
  grad.addColorStop(0.5, '#0284c7');
  grad.addColorStop(1, '#072463');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, W, 10);
  ctx.fillRect(0, H - 10, W, 10);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Camada translucida e animada de nuvens da Terra (sem esconder os continentes reais!)
function createEarthCloudTexture() {
  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Nuvens em faixas tropicais (ZCIT) e ciclones de latitudes medias, com transparência suave
  const swirls = [
    [62, 74, 34, 8, -0.18],
    [138, 124, 42, 7, 0.05],
    [186, 66, 36, 9, -0.22],
    [224, 152, 44, 8, 0.14],
    [276, 86, 38, 8, -0.15],
    [328, 128, 46, 7, 0.06],
    [392, 68, 42, 9, -0.2],
    [438, 174, 48, 8, 0.12],
    [102, 184, 52, 8, 0.1],
    [310, 192, 46, 8, -0.08],
  ];

  ctx.save();
  ctx.filter = 'blur(5px)';
  for (const [cx, cy, rx, ry, rot] of swirls) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    for (const dx of [0, -W, W]) {
      ctx.beginPath();
      ctx.ellipse(cx + dx, cy, rx, ry, rot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMoonFallbackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 128, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function loadRealPlanetTexture(filename, material) {
  const loader = new THREE.TextureLoader();
  loader.load(`${TEXTURE_BASE}${filename}`, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 4;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    material.uniforms.uMap.value = tex;
    material.needsUpdate = true;
  });
}

export function createEarthAndMoonSystem() {
  const earthSystemGroup = new THREE.Group();

  // Terra com mosaico real NASA Blue Marble Bathymetry + shader oceano/atmosfera
  const earthGeo = new THREE.SphereGeometry(7.2, 40, 40);
  const earthMat = createPlanetShaderMaterial(createEarthFallbackTexture(), {
    rimColor: new THREE.Color(0x38bdf8),
    rimStrength: 0.65,
    rimPower: 2.3,
    minLight: 0.90,
    maxLight: 1.32,
  });
  loadRealPlanetTexture('earth.jpg', earthMat);

  const earthMesh = new THREE.Mesh(earthGeo, earthMat);
  // Comeca mostrando Americas, Atlantico, Europa e Africa bem nitidos!
  earthMesh.rotation.y = -0.35;
  earthSystemGroup.add(earthMesh);

  // Esfera de nuvens translucidas levemente acima da superficie
  const cloudGeo = new THREE.SphereGeometry(7.34, 36, 36);
  const cloudMat = new THREE.MeshBasicMaterial({
    map: createEarthCloudTexture(),
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    fog: false,
  });
  const earthCloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
  earthSystemGroup.add(earthCloudMesh);

  // Atmosfera azul celeste fina no limbo
  const atmoGeo = new THREE.SphereGeometry(7.68, 32, 32);
  const atmoMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.24,
    side: THREE.BackSide,
    fog: false,
  });
  earthSystemGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

  // Halo externo suave (transparente no centro para nao lavar os continentes!)
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = 128;
  haloCanvas.height = 128;
  const hctx = haloCanvas.getContext('2d');
  const hgrad = hctx.createRadialGradient(64, 64, 24, 64, 64, 62);
  hgrad.addColorStop(0, 'rgba(56, 189, 248, 0.0)');
  hgrad.addColorStop(0.36, 'rgba(56, 189, 248, 0.34)');
  hgrad.addColorStop(0.65, 'rgba(14, 165, 233, 0.14)');
  hgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  hctx.fillStyle = hgrad;
  hctx.fillRect(0, 0, 128, 128);

  const earthHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(haloCanvas),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  earthHalo.scale.set(28, 28, 1);
  earthSystemGroup.add(earthHalo);

  // Lua da Terra com mosaico real NASA LRO WAC (Near Side voltada para o jogador!)
  const moonGeo = new THREE.SphereGeometry(2.45, 32, 32);
  const moonMat = createPlanetShaderMaterial(createMoonFallbackTexture(), {
    rimColor: new THREE.Color(0xf8fafc),
    rimStrength: 0.38,
    rimPower: 2.6,
    minLight: 0.88,
    maxLight: 1.30,
  });
  loadRealPlanetTexture('moon.jpg', moonMat);

  const terraMoonMesh = new THREE.Mesh(moonGeo, moonMat);
  terraMoonMesh.position.set(15.2, 3.6, 0);
  // Gira +X (centro lon=0 da face visivel da Lua) para +Z (de frente para o jogador!)
  terraMoonMesh.rotation.y = -Math.PI / 2;
  earthSystemGroup.add(terraMoonMesh);

  // Halo prateado suave no limbo da Lua
  const moonHaloCanvas = document.createElement('canvas');
  moonHaloCanvas.width = 64;
  moonHaloCanvas.height = 64;
  const mctx = moonHaloCanvas.getContext('2d');
  const mgrad = mctx.createRadialGradient(32, 32, 11, 32, 32, 30);
  mgrad.addColorStop(0, 'rgba(241, 245, 249, 0.0)');
  mgrad.addColorStop(0.42, 'rgba(226, 232, 240, 0.28)');
  mgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  mctx.fillStyle = mgrad;
  mctx.fillRect(0, 0, 64, 64);

  const moonHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(moonHaloCanvas),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  moonHalo.scale.set(8.2, 8.2, 1);
  terraMoonMesh.add(moonHalo);

  // Posição baixa-média no céu a Norte-Noroeste (bem fácil de enxergar logo acima da base!)
  const earthBaseDir = new THREE.Vector3(-0.28, 0.32, -0.90).normalize();
  earthSystemGroup.position.copy(earthBaseDir.multiplyScalar(320));

  return { earthSystemGroup, earthMesh, earthCloudMesh, moonMesh: terraMoonMesh };
}

// Geometria baseada em SphereGeometry para manter UVs perfeitamente continuos sem costura rasgada,
// esculpida no formato triaxial e com depressoes reais de crateras alinhadas a textura.
function createAsteroidGeometry(rx, ry, rz, craters, roughness = 0.11) {
  const geo = new THREE.SphereGeometry(1, 48, 36);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const cDir = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();

    const n1 = Math.sin(v.x * 2.8 + 0.5) * Math.cos(v.y * 2.4 - 0.3) * Math.sin(v.z * 3.1 + 0.8);
    const n2 = Math.cos(v.x * 5.6 - v.z * 4.4) * Math.sin(v.y * 5.0 + 1.1);
    let r = 1.0 + n1 * roughness + n2 * (roughness * 0.4);

    for (const [lon, lat, radius, depth] of craters) {
      const phi = (lat * Math.PI) / 180;
      const theta = ((lon + 180) * Math.PI) / 180;
      cDir.set(
        -Math.cos(theta) * Math.cos(phi),
        Math.sin(phi),
        Math.sin(theta) * Math.cos(phi)
      ).normalize();

      const dist = v.distanceTo(cDir);
      if (dist < radius) {
        const t = dist / radius;
        if (t < 0.78) {
          const bowl = Math.cos((t / 0.78) * (Math.PI * 0.5));
          r -= depth * bowl;
        } else {
          const rim = Math.sin(((t - 0.78) / 0.22) * Math.PI);
          r += depth * 0.22 * rim;
        }
      }
    }

    pos.setXYZ(i, v.x * rx * r, v.y * ry * r, v.z * rz * r);
  }

  geo.computeVertexNormals();
  return geo;
}

function createAsteroidTexture({
  baseColor,
  darkColor,
  lightColor,
  craters,
  grooves = false,
}) {
  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, W, H);

  // Manchas de regolito com wrapping horizontal perfeito (x, x-W, x+W)
  for (let i = 0; i < 140; i++) {
    const x = (i * 79) % W;
    const y = 16 + ((i * 47) % (H - 32));
    const rx = 10 + (i % 22);
    const ry = 6 + (i % 14);
    ctx.fillStyle = i % 2 === 0 ? darkColor : lightColor;
    ctx.globalAlpha = 0.2;
    for (const dx of [0, -W, W]) {
      ctx.beginPath();
      ctx.ellipse(x + dx, y, rx, ry, (i % 5) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1.0;

  // Sulcos paralelos de mare gravitacional (caracteristica marcante de Fobos!)
  if (grooves) {
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.42;
    for (let y = 38; y < H - 38; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(W * 0.35, y + 10, W * 0.65, y - 10, W, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  // Crateras pintadas exatamente nas mesmas coordenadas (lon, lat) da geometria 3D
  for (const [lon, lat, angRadius] of craters) {
    const cx = ((lon + 180) / 360) * W;
    const cy = ((90 - lat) / 180) * H;
    const r = angRadius * (W / 6.2);

    for (const dx of [0, -W, W]) {
      // Halos de ejecao + borda elevada
      ctx.fillStyle = lightColor;
      ctx.beginPath();
      ctx.arc(cx + dx - 2, cy - 2, r + 3, 0, Math.PI * 2);
      ctx.fill();

      // Fundo sombreado da cratera
      ctx.fillStyle = darkColor;
      ctx.beginPath();
      ctx.arc(cx + dx + 1, cy + 1, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(cx + dx + 2.5, cy + 2.5, r * 0.58, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMartianMoons() {
  // Fobos: formato triaxial real (27 x 22 x 18 km), regolito escuro + gigante Cratera Stickney (-49 lon)
  const phobosCraters = [
    [-49, -6, 0.56, 0.25],   // Stickney (9 km)
    [-145, 22, 0.32, 0.13],  // Hall
    [45, -28, 0.30, 0.12],   // Roche
    [115, 25, 0.26, 0.10],   // Grildrig
    [-10, 42, 0.24, 0.09],
  ];
  const phobosGroup = new THREE.Group();
  const phobosGeo = createAsteroidGeometry(7.8, 5.4, 6.2, phobosCraters, 0.11);
  const phobosTex = createAsteroidTexture({
    baseColor: '#9c8879',
    darkColor: '#4e4036',
    lightColor: '#d6c4b4',
    grooves: true,
    craters: phobosCraters,
  });
  const phobosMat = createPlanetShaderMaterial(phobosTex, {
    rimColor: new THREE.Color(0xfb923c),
    rimStrength: 0.18,
    rimPower: 3.2,
    minLight: 0.45,
  });
  phobosGroup.add(new THREE.Mesh(phobosGeo, phobosMat));

  // Deimos: menor e mais suave (15 x 12 x 11 km), coberto por poeira fina ocre-palha (Swift & Voltaire)
  const deimosCraters = [
    [-65, 18, 0.38, 0.12],   // Voltaire
    [35, -14, 0.32, 0.10],   // Swift
    [130, 24, 0.26, 0.08],
  ];
  const deimosGroup = new THREE.Group();
  const deimosGeo = createAsteroidGeometry(3.9, 3.0, 3.2, deimosCraters, 0.07);
  const deimosTex = createAsteroidTexture({
    baseColor: '#e2d4c4',
    darkColor: '#9c8b7a',
    lightColor: '#faf4ed',
    grooves: false,
    craters: deimosCraters,
  });
  const deimosMat = createPlanetShaderMaterial(deimosTex, {
    rimColor: new THREE.Color(0xfdba74),
    rimStrength: 0.2,
    rimPower: 3.2,
    minLight: 0.55,
  });
  deimosGroup.add(new THREE.Mesh(deimosGeo, deimosMat));

  return { phobosGroup, deimosGroup };
}
