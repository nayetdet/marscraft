import * as THREE from 'three';
import { createAtmosphereDome } from './atmosphereShader.js';
import {
  createEarthAndMoonSystem,
  createMartianMoons,
  createMartianSun,
  createStarfield,
} from './celestialBodies.js';

// Cores fixas reaproveitadas a cada frame (evita alocar objetos no loop)
const SUN_DAY_COLOR = new THREE.Color(0xfff5e6);
const SUN_TWILIGHT_COLOR = new THREE.Color(0xbbe0ff);
const SUN_NIGHT_COLOR = new THREE.Color(0x64748b);
const FOG_NIGHT_COLOR = new THREE.Color(0x241914);
const FOG_SUNSET_COLOR = new THREE.Color(0xd98245);
const FOG_DAY_COLOR = new THREE.Color(0xf2a65e);
const _sunDir = new THREE.Vector3();

export class MarsSkySystem {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 15.2; // Tarde ensolarada e clara em Marte
    this.solCount = 1;
    this.autoAdvanceSpeed = 0.02;

    this.celestialGroup = new THREE.Group();
    this.scene.add(this.celestialGroup);

    this._initLights();

    const { mesh: skyDome, uniforms } = createAtmosphereDome();
    this.skyDome = skyDome;
    this.skyUniforms = uniforms;
    this.celestialGroup.add(this.skyDome);

    const { points: stars, material: starMat } = createStarfield();
    this.stars = stars;
    this.starMaterial = starMat;
    this.celestialGroup.add(this.stars);

    const { sunGroup, sunMesh } = createMartianSun();
    this.sunGroup = sunGroup;
    this.sunMesh = sunMesh;
    this.celestialGroup.add(this.sunGroup);

    const { earthSystemGroup, earthMesh, moonMesh } = createEarthAndMoonSystem();
    this.earthSystemGroup = earthSystemGroup;
    this.earthMesh = earthMesh;
    this.moonMesh = moonMesh;
    this.celestialGroup.add(this.earthSystemGroup);

    const { phobosGroup, deimosGroup } = createMartianMoons();
    this.phobosGroup = phobosGroup;
    this.deimosGroup = deimosGroup;
    this.celestialGroup.add(this.phobosGroup, this.deimosGroup);

    this.update(0, new THREE.Vector3(0, 12, 0));
  }

  _initLights() {
    // Iluminação fosca, clara e uniforme para que nada fique escuro
    this.baseAmbient = new THREE.AmbientLight(0xfff4e6, 0.72);
    this.scene.add(this.baseAmbient);

    this.ambientLight = new THREE.HemisphereLight(0xffe4c4, 0xc87d44, 0.85);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7eb, 1.15);
    this.sunLight.position.set(120, 90, -80);
    this.scene.add(this.sunLight);

    // Neblina bem leve e clara para ver todo o horizonte e os planetas
    this.scene.fog = new THREE.FogExp2(0xf0a25a, 0.0024);
  }

  setTimeOfDay(hour) {
    this.timeOfDay = ((hour % 24) + 24) % 24;
  }

  advanceTime(deltaHours) {
    this.timeOfDay += deltaHours;
    if (this.timeOfDay >= 24) {
      this.timeOfDay -= 24;
      this.solCount++;
    }
  }

  update(dt, playerPos) {
    this.advanceTime(dt * this.autoAdvanceSpeed);
    this.celestialGroup.position.copy(playerPos);

    const sunAngle = ((this.timeOfDay - 6) / 24) * Math.PI * 2;
    const sunDir = _sunDir.set(Math.cos(sunAngle), Math.sin(sunAngle), -0.35).normalize();

    this.sunGroup.position.copy(sunDir).multiplyScalar(360);
    this.skyUniforms.uSunDir.value.copy(sunDir);
    this.skyUniforms.uSunElevation.value = sunDir.y;

    const dayStrength = THREE.MathUtils.smoothstep(sunDir.y, -0.15, 0.3);
    const twilightStrength =
      THREE.MathUtils.smoothstep(sunDir.y, -0.22, 0.05) *
      (1.0 - THREE.MathUtils.smoothstep(sunDir.y, 0.05, 0.35));

    this.sunLight.position.copy(sunDir).multiplyScalar(120).add(playerPos);
    this.sunLight.intensity = 0.45 + dayStrength * 0.95;

    this.sunLight.color
      .copy(SUN_NIGHT_COLOR)
      .lerp(SUN_DAY_COLOR, dayStrength)
      .lerp(SUN_TWILIGHT_COLOR, twilightStrength * 0.55);

    this.ambientLight.intensity = 0.55 + dayStrength * 0.55;
    this.baseAmbient.intensity = 0.5 + dayStrength * 0.35;

    this.scene.fog.color
      .copy(FOG_NIGHT_COLOR)
      .lerp(FOG_DAY_COLOR, dayStrength)
      .lerp(FOG_SUNSET_COLOR, twilightStrength);

    this.starMaterial.opacity = THREE.MathUtils.clamp(1.0 - dayStrength * 0.65, 0.28, 0.95);

    this.earthMesh.rotation.y += dt * 0.35;
    this.earthSystemGroup.lookAt(playerPos);

    // Fobos e Deimos em altura fácil de observar no horizonte norte/leste/oeste
    const phobosAngle = this.timeOfDay * 0.55;
    this.phobosGroup.position.set(
      Math.cos(phobosAngle) * 290,
      Math.abs(Math.sin(phobosAngle)) * 95 + 55,
      -Math.abs(Math.sin(phobosAngle * 0.8)) * 240 - 60
    );
    this.phobosGroup.rotation.y += dt * 0.2;

    const deimosAngle = this.timeOfDay * 0.2 + 1.2;
    this.deimosGroup.position.set(
      Math.sin(deimosAngle) * 310,
      Math.abs(Math.cos(deimosAngle * 0.7)) * 105 + 65,
      -Math.abs(Math.cos(deimosAngle)) * 260 - 80
    );
  }

  getEarthWorldPosition(target = new THREE.Vector3()) {
    return this.earthMesh.getWorldPosition(target);
  }

  getMoonWorldPosition(target = new THREE.Vector3()) {
    return this.moonMesh.getWorldPosition(target);
  }

  getPhobosWorldPosition(target = new THREE.Vector3()) {
    return this.phobosGroup.getWorldPosition(target);
  }

  getDeimosWorldPosition(target = new THREE.Vector3()) {
    return this.deimosGroup.getWorldPosition(target);
  }

  getSunWorldPosition(target = new THREE.Vector3()) {
    return this.sunMesh.getWorldPosition(target);
  }

  getFormattedTime() {
    const hours = Math.floor(this.timeOfDay);
    const mins = Math.floor((this.timeOfDay - hours) * 60);
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    return {
      clockText: `Sol ${this.solCount} — ${hh}:${mm}`,
    };
  }
}
