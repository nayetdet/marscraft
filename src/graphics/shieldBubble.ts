// @ts-nocheck
import * as THREE from 'three';
import { SRGB_AUTHORED_OUTPUT } from './srgbOutput.ts';

// Bolhas visuais do escudo de radiação ativo (item Shield Remote), uma por bobina (ver mission/shieldZone.js).
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
  uniform vec4 uOthers[OTHER_COUNT];
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vLocal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // Uniao das bolhas: o pedaco desta casca que fica dentro de outra bolha nao aparece.
    for (int i = 0; i < OTHER_COUNT; i++) {
      if (distance(vWorld, uOthers[i].xyz) < uOthers[i].w - 0.05) discard;
    }

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
${SRGB_AUTHORED_OUTPUT}
  }
`;

export class ShieldBubble {
  /** zone: {DOMES: [{CENTER: {x,y,z}, RADIUS}]} (mesma de mission/shieldZone.js) */
  constructor(scene, zone) {
    const domes = zone.DOMES;
    // Uniforms compartilhados: todas as bolhas acendem, pulsam e faiscam juntas.
    const shared = {
      uColor: { value: new THREE.Color(0x55ffff) },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uStorm: { value: 0 },
    };
    this.uniforms = shared;
    this.meshes = domes.map((dome, index) => {
      const others = domes
        .filter((_, i) => i !== index)
        .map((o) => new THREE.Vector4(o.CENTER.x, o.CENTER.y, o.CENTER.z, o.RADIUS));
      const geometry = new THREE.SphereGeometry(dome.RADIUS, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2);
      const material = new THREE.ShaderMaterial({
        defines: { OTHER_COUNT: Math.max(1, others.length) },
        uniforms: {
          ...shared,
          uRadius: { value: dome.RADIUS },
          // Sem outras bolhas, um vec4 de raio zero nunca descarta nada.
          uOthers: { value: others.length ? others : [new THREE.Vector4(0, 0, 0, 0)] },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(dome.CENTER.x, dome.CENTER.y, dome.CENTER.z);
      mesh.renderOrder = 997;
      mesh.visible = false;
      scene.add(mesh);
      return mesh;
    });
    this.opacity = 0;
    this.storm = 0;
  }

  /** on: escudo ligado; storm: tempestade solar acontecendo agora. */
  update(dt, { on, storm }) {
    const step = FADE_PER_SECOND * dt;
    this.opacity = on ? Math.min(1, this.opacity + step) : Math.max(0, this.opacity - step);
    this.storm = storm ? Math.min(1, this.storm + step) : Math.max(0, this.storm - step);
    const visible = this.opacity > 0.001;
    for (const mesh of this.meshes) mesh.visible = visible;
    if (!visible) return;
    const u = this.uniforms;
    u.uOpacity.value = this.opacity;
    u.uStorm.value = this.storm;
    u.uTime.value += dt;
  }
}
