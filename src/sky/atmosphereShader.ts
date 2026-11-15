// @ts-nocheck
import * as THREE from 'three';
import { SRGB_AUTHORED_OUTPUT } from '../graphics/srgbOutput.ts';

export const MARTIAN_SKY_VERTEX_SHADER = `
  varying vec3 vWorldDirection;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldDirection = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const MARTIAN_SKY_FRAGMENT_SHADER = `
  varying vec3 vWorldDirection;
  uniform vec3 uSunDir;
  uniform float uSunElevation;
  uniform float uDust; // tempestade de poeira (issue #103): 0 = ceu limpo, 1 = poeira no maximo
  uniform float uTime;

  float skyHash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float skyNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = skyHash(i);
    float b = skyHash(i + vec2(1.0, 0.0));
    float c = skyHash(i + vec2(0.0, 1.0));
    float d = skyHash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float skyFbm(vec2 p) {
    float v = 0.0;
    v += skyNoise(p) * 0.55;
    v += skyNoise(p * 2.13 + vec2(11.3, 4.7)) * 0.30;
    v += skyNoise(p * 4.41 + vec2(3.1, 19.2)) * 0.15;
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldDirection);
    float y = clamp(dir.y, 0.0, 1.0);
    float horizonFactor = pow(1.0 - y, 2.3);

    float dayFactor = smoothstep(-0.15, 0.25, uSunElevation);
    float twilightFactor = smoothstep(-0.22, 0.05, uSunElevation) * (1.0 - smoothstep(0.05, 0.36, uSunElevation));

    // Dia em Marte: ceu caramelo, mais claro e empoeirado perto do horizonte.
    // Bem mais palido que o chao, para o relevo nao se confundir com o ceu.
    vec3 dayZenith = vec3(0.70, 0.52, 0.36);
    vec3 dayHorizon = vec3(0.93, 0.82, 0.68);

    // Crepúsculo marciano claro
    vec3 duskZenith = vec3(0.28, 0.22, 0.30);
    vec3 duskHorizon = vec3(0.90, 0.56, 0.30);

    // Noite marciana mais visível
    vec3 nightZenith = vec3(0.05, 0.06, 0.10);
    vec3 nightHorizon = vec3(0.20, 0.12, 0.08);

    vec3 zenithCol = mix(nightZenith, dayZenith, dayFactor);
    zenithCol = mix(zenithCol, duskZenith, twilightFactor * 0.8);

    vec3 horizonCol = mix(nightHorizon, dayHorizon, dayFactor);
    horizonCol = mix(horizonCol, duskHorizon, twilightFactor * 0.8);

    vec3 skyColor = mix(zenithCol, horizonCol, horizonFactor);

    // Faixas finas de poeira no horizonte, movendo-se lentamente com o vento.
    // Sao mais visiveis em luz baixa e ganham contraste durante uma tempestade.
    float windBand = sin(dir.x * 8.0 + dir.z * 5.0 + uTime * 0.025 + sin(dir.z * 11.0 - uTime * 0.018));
    float bandHeight = 0.045 + windBand * 0.022;
    float horizonHaze = exp(-abs(dir.y - bandHeight) * 34.0) * (0.025 + uDust * 0.09);
    vec3 hazeTint = mix(vec3(0.90, 0.55, 0.31), vec3(0.62, 0.37, 0.23), uDust);
    skyColor = mix(skyColor, hazeTint, horizonHaze * (0.35 + 0.65 * horizonFactor));

    // Halo azulado real de Marte ao redor do Sol
    float sunCos = max(dot(dir, normalize(uSunDir)), 0.0);
    float blueMieCone = pow(sunCos, 8.0) * (0.35 + 0.65 * twilightFactor) * smoothstep(-0.18, 0.35, uSunElevation);
    vec3 martianBlueGlow = vec3(0.50, 0.76, 0.96);
    skyColor = mix(skyColor, martianBlueGlow, clamp(blueMieCone * 0.78, 0.0, 0.82));

    // Nuvens finas de gelo e faixas altas de poeira marciana (sutis, deslocadas pelo vento)
    if (dir.y > 0.01) {
      vec2 cloudUv = dir.xz / (dir.y + 0.24) * 1.45 + vec2(uTime * 0.0085, -uTime * 0.003);
      float wisp = skyFbm(cloudUv * vec2(1.0, 2.2));
      float wispsMask = smoothstep(0.54, 0.82, wisp) * smoothstep(0.02, 0.28, dir.y) * (1.0 - smoothstep(0.55, 0.95, dir.y));
      vec3 wispCol = mix(vec3(0.98, 0.88, 0.78), vec3(0.96, 0.72, 0.56), twilightFactor);
      skyColor = mix(skyColor, wispCol, wispsMask * (0.16 + 0.14 * twilightFactor) * dayFactor * (1.0 - 0.85 * uDust));

      // Banda baixa de poeira em suspensao perto do horizonte
      float band = skyFbm(vec2(atan(dir.z, dir.x) * 3.5 + uTime * 0.02, dir.y * 14.0));
      float horizonBand = exp(-dir.y * 13.0) * (0.35 + 0.65 * band);
      vec3 bandCol = mix(vec3(0.24, 0.14, 0.09), vec3(0.88, 0.70, 0.54), dayFactor);
      bandCol = mix(bandCol, vec3(0.92, 0.58, 0.34), twilightFactor * 0.6);
      skyColor = mix(skyColor, bandCol, horizonBand * 0.32 * (1.0 - 0.6 * uDust));
    }

    float sunCore = pow(sunCos, 160.0) * smoothstep(-0.12, 0.05, uSunElevation);
    skyColor += vec3(0.98, 0.98, 1.0) * sunCore * 0.9 * (1.0 - 0.85 * uDust);

    // Tempestade de poeira: o ceu passa de caramelo para marrom escuro, com um brilho fraco
    // onde o Sol esta escondido
    vec3 dustSky = vec3(0.34, 0.20, 0.11) * (0.2 + 0.8 * dayFactor) + vec3(0.30, 0.20, 0.10) * pow(sunCos, 6.0) * dayFactor;
    skyColor = mix(skyColor, dustSky, uDust * 0.9);

    if (vWorldDirection.y < 0.0) {
      vec3 groundCol = mix(vec3(0.18, 0.11, 0.06), vec3(0.60, 0.38, 0.26), dayFactor);
      skyColor = mix(skyColor, groundCol, clamp(-vWorldDirection.y * 4.0, 0.0, 1.0));
    }

    gl_FragColor = vec4(skyColor, 1.0);
${SRGB_AUTHORED_OUTPUT}  }
`;

export function createAtmosphereDome() {
  const uniforms = {
    uSunDir: { value: new THREE.Vector3(1, 0.4, 0) },
    uSunElevation: { value: 0.4 },
    uDust: { value: 0 },
    uTime: { value: 0 },
  };

  const skyGeo = new THREE.SphereGeometry(420, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: MARTIAN_SKY_VERTEX_SHADER,
    fragmentShader: MARTIAN_SKY_FRAGMENT_SHADER,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(skyGeo, skyMat);
  return { mesh, uniforms };
}
