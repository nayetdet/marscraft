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

  void main() {
    vec3 dir = normalize(vWorldDirection);
    float y = clamp(dir.y, 0.0, 1.0);
    float horizonFactor = pow(1.0 - y, 2.5);

    float dayFactor = smoothstep(-0.12, 0.28, uSunElevation);
    float twilightFactor = smoothstep(-0.22, 0.05, uSunElevation) * (1.0 - smoothstep(0.05, 0.36, uSunElevation));

    // Cores diurnas reais de Marte (Alaranjado ocre/caramelo suave no zênite e dourado poeirento no horizonte)
    vec3 dayZenith = vec3(0.74, 0.46, 0.22);
    vec3 dayHorizon = vec3(0.94, 0.70, 0.42);

    // Cores do crepúsculo marciano (Alaranjado âmbar no horizonte)
    vec3 duskZenith = vec3(0.22, 0.16, 0.22);
    vec3 duskHorizon = vec3(0.84, 0.49, 0.24);

    // Cores noturnas marcianas
    vec3 nightZenith = vec3(0.02, 0.025, 0.045);
    vec3 nightHorizon = vec3(0.14, 0.08, 0.04);

    vec3 zenithCol = mix(nightZenith, dayZenith, dayFactor);
    zenithCol = mix(zenithCol, duskZenith, twilightFactor * 0.85);

    vec3 horizonCol = mix(nightHorizon, dayHorizon, dayFactor);
    horizonCol = mix(horizonCol, duskHorizon, twilightFactor * 0.85);

    vec3 skyColor = mix(zenithCol, horizonCol, horizonFactor);

    // Espalhamento frontal Mie da poeira marciana (Halo azulado real de Marte ao redor do Sol)
    float sunCos = max(dot(dir, normalize(uSunDir)), 0.0);
    float blueMieCone = pow(sunCos, 9.0) * (0.35 + 0.65 * twilightFactor) * smoothstep(-0.18, 0.35, uSunElevation);
    vec3 martianBlueGlow = vec3(0.42, 0.68, 0.90);
    skyColor = mix(skyColor, martianBlueGlow, clamp(blueMieCone * 0.78, 0.0, 0.82));

    float sunCore = pow(sunCos, 180.0) * smoothstep(-0.12, 0.05, uSunElevation);
    skyColor += vec3(0.95, 0.96, 1.0) * sunCore * 0.9;

    if (vWorldDirection.y < 0.0) {
      vec3 groundCol = mix(vec3(0.10, 0.06, 0.03), vec3(0.68, 0.41, 0.19), dayFactor);
      skyColor = mix(skyColor, groundCol, clamp(-vWorldDirection.y * 4.0, 0.0, 1.0));
    }

    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

export function createAtmosphereDome() {
  const uniforms = {
    uSunDir: { value: new THREE.Vector3(1, 0.2, 0) },
    uSunElevation: { value: 0.2 },
  };

  const skyGeo = new THREE.SphereGeometry(420, 40, 28);
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
