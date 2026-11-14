import * as THREE from 'three';

// Bolha visual do escudo de radiação ativo (tecla R).
// Um campo magnético de verdade é invisível: a bolha só mostra ONDE ele protege. O desenho segue
// o conceito estudado pela NASA (NIAC, bobinas supercondutoras em volta do habitat): linhas de
// campo arqueando sobre a base e, durante a tempestade solar, faíscas onde as partículas
// carregadas batem no campo e são desviadas. A cor é o aqua da paleta do Minecraft.

const FADE_PER_SECOND = 2.5;

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uStorm;
  uniform float uRadius;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vLocal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorld);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.2);

    // Coordenadas na meia esfera: longitude (phi) e altura (0 no chão, 1 no topo).
    float phi = atan(vLocal.z, vLocal.x);
    float height = clamp(vLocal.y / uRadius, 0.0, 1.0);

    // Linhas de campo: meridianos que sobem do chão e arqueiam por cima da base.
    float meridian = abs(fract(phi * 16.0 / 6.2831853) - 0.5);
    float lines = 1.0 - smoothstep(0.0, 0.035, meridian);
    lines *= 0.55 + 0.45 * sin(height * 3.14159);

    // Pulso de energia subindo pelas linhas (o campo está ativo).
    float pulse = 1.0 - smoothstep(0.0, 0.08, abs(fract(height * 2.0 - uTime * 0.35) - 0.5));

    // Tempestade: faíscas em células aleatórias, onde partículas são desviadas pelo campo.
    vec2 cell = floor(vec2(phi * 18.0, height * 14.0));
    float flash = step(0.985, hash(cell + floor(uTime * 6.0)));
    vec2 inCell = fract(vec2(phi * 18.0, height * 14.0)) - 0.5;
    float spark = flash * (1.0 - smoothstep(0.1, 0.35, length(inCell))) * uStorm;

    // Some suavemente perto do chão para não marcar uma linha dura no terreno.
    float groundFade = smoothstep(0.0, 0.04, height);

    float alpha = 0.05 + 0.32 * fresnel + 0.22 * lines + 0.10 * pulse * lines + 0.85 * spark;
    vec3 color = mix(uColor, vec3(1.0), spark * 0.7 + pulse * lines * 0.25);
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0) * uOpacity * groundFade);
  }
`;

export class ShieldBubble {
  /** zone: {CENTER: {x,y,z}, RADIUS} (mesma de mission/shieldZone.js) */
  constructor(scene, zone) {
    const geometry = new THREE.SphereGeometry(zone.RADIUS, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x55ffff) },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
        uStorm: { value: 0 },
        uRadius: { value: zone.RADIUS },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(zone.CENTER.x, zone.CENTER.y, zone.CENTER.z);
    this.mesh.renderOrder = 997;
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.opacity = 0;
    this.storm = 0;
  }

  /** on: escudo ligado; storm: tempestade solar acontecendo agora. */
  update(dt, { on, storm }) {
    const step = FADE_PER_SECOND * dt;
    this.opacity = on ? Math.min(1, this.opacity + step) : Math.max(0, this.opacity - step);
    this.storm = storm ? Math.min(1, this.storm + step) : Math.max(0, this.storm - step);
    this.mesh.visible = this.opacity > 0.001;
    if (!this.mesh.visible) return;
    const u = this.material.uniforms;
    u.uOpacity.value = this.opacity;
    u.uStorm.value = this.storm;
    u.uTime.value += dt;
  }
}
