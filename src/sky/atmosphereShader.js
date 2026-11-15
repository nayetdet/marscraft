import * as THREE from 'three';

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

    // Halo azulado real de Marte ao redor do Sol
    float sunCos = max(dot(dir, normalize(uSunDir)), 0.0);
    float blueMieCone = pow(sunCos, 8.0) * (0.35 + 0.65 * twilightFactor) * smoothstep(-0.18, 0.35, uSunElevation);
    vec3 martianBlueGlow = vec3(0.50, 0.76, 0.96);
    skyColor = mix(skyColor, martianBlueGlow, clamp(blueMieCone * 0.78, 0.0, 0.82));

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
  }
`;

export function createAtmosphereDome() {
  const uniforms = {
    uSunDir: { value: new THREE.Vector3(1, 0.4, 0) },
    uSunElevation: { value: 0.4 },
    uDust: { value: 0 },
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
