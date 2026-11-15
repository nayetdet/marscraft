// @ts-nocheck
import * as THREE from 'three';
import { DUST_WEATHER_CONFIG, MISSION_CONFIG } from '../config/constants.ts';
import { createAtmosphereDome } from './atmosphereShader.ts';
import { advanceSolClock } from './solClock.ts';
import {
  createEarthAndMoonSystem,
  createMartianMoons,
  createMartianSun,
  createStarfield,
} from './celestialBodies.ts';

// Cores fixas reaproveitadas a cada frame (evita alocar objetos no loop)
const SUN_DAY_COLOR = new THREE.Color(0xfff5e6);
const SUN_TWILIGHT_COLOR = new THREE.Color(0xbbe0ff);
const SUN_NIGHT_COLOR = new THREE.Color(0x64748b);
const FOG_NIGHT_COLOR = new THREE.Color(0x241914);
const FOG_SUNSET_COLOR = new THREE.Color(0xd98245);
const FOG_DAY_COLOR = new THREE.Color(0xe6cba6); // mesma cor do horizonte do ceu de dia
const _sunDir = new THREE.Vector3();

export class MarsSkySystem {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 9; // Manhã: mais tempo de luz no início da missão
    this.solCount = 1;
    this.autoAdvanceSpeed = MISSION_CONFIG.GAME_HOURS_PER_SECOND;
    // Tempestade de poeira do clima (issue #103): 0 = ceu limpo, 1 = poeira no maximo.
    // O GameEngine escreve aqui a cada frame (DustWeather.haze).
    this.dustHaze = 0;
    // Direcao do Sol e forca do dia/crepusculo (0 a 1) do ultimo update, para ShaderMode e neblina
    this.sunDirection = new THREE.Vector3(0, 1, 0);
    this.dayStrength = 1;
    this.twilightStrength = 0;

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

    const { earthSystemGroup, earthMesh, earthCloudMesh, moonMesh } = createEarthAndMoonSystem();
    this.earthSystemGroup = earthSystemGroup;
    this.earthMesh = earthMesh;
    this.earthCloudMesh = earthCloudMesh;
    this.moonMesh = moonMesh;
    this.celestialGroup.add(this.earthSystemGroup);

    const { phobosGroup, deimosGroup } = createMartianMoons();
    this.phobosGroup = phobosGroup;
    this.deimosGroup = deimosGroup;
    this.celestialGroup.add(this.phobosGroup, this.deimosGroup);

    this.update(0, new THREE.Vector3(0, 12, 0));
  }

  _initLights() {
    // Luz ambiente moderada e Sol mais forte: as faces de cima e de lado dos blocos ficam
    // diferentes, e o relevo aparece. A sombra de canto vem da cor por vertice (VoxelWorld).
    this.baseAmbient = new THREE.AmbientLight(0xfff4e6, 0.7);
    this.scene.add(this.baseAmbient);

    this.ambientLight = new THREE.HemisphereLight(0xffe4c4, 0xd6a27c, 0.85);
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
    const clock = advanceSolClock(this.timeOfDay, this.solCount, deltaHours);
    this.timeOfDay = clock.timeOfDay;
    this.solCount = clock.solCount;
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
    this.sunDirection.copy(sunDir);
    this.dayStrength = dayStrength;
    const twilightStrength =
      THREE.MathUtils.smoothstep(sunDir.y, -0.22, 0.05) *
      (1.0 - THREE.MathUtils.smoothstep(sunDir.y, 0.05, 0.35));
    this.twilightStrength = twilightStrength;
    if (this.skyUniforms.uTime) this.skyUniforms.uTime.value += dt;

    this.sunLight.position.copy(sunDir).multiplyScalar(120).add(playerPos);
    // A noite fica igual a antes; so o dia ganha mais Sol e menos luz ambiente
    // A poeira apaga a luz direta do Sol e encolhe o disco ate um ponto fraco
    const dust = this.dustHaze;
    this.sunLight.intensity = 0.45 + dayStrength * 1.15 * (1 - DUST_WEATHER_CONFIG.SUN_DIM * dust);
    this.sunGroup.scale.setScalar(1 - DUST_WEATHER_CONFIG.SUN_SHRINK * dust);
    this.skyUniforms.uDust.value = dust;

    this.sunLight.color
      .copy(SUN_NIGHT_COLOR)
      .lerp(SUN_DAY_COLOR, dayStrength)
      .lerp(SUN_TWILIGHT_COLOR, twilightStrength * 0.55);

    this.ambientLight.intensity = 0.55 + dayStrength * 0.45 * (1 - 0.5 * dust);
    this.baseAmbient.intensity = 0.5 + dayStrength * 0.2 * (1 - 0.5 * dust);

    this.scene.fog.color
      .copy(FOG_NIGHT_COLOR)
      .lerp(FOG_DAY_COLOR, dayStrength)
      .lerp(FOG_SUNSET_COLOR, twilightStrength);

    this.starMaterial.opacity = THREE.MathUtils.clamp(1.0 - dayStrength * 0.65, 0.28, 0.95);

    this.earthMesh.rotation.y += dt * 0.14;
    this.earthCloudMesh.rotation.y += dt * 0.18;
    this.moonMesh.rotation.y += dt * 0.015;
    this.earthSystemGroup.lookAt(playerPos);
    if (this.sunMesh.material.uniforms?.uTime) {
      this.sunMesh.material.uniforms.uTime.value += dt;
    }

    // Fobos e Deimos em altura fácil de observar no horizonte norte/leste/oeste
    const phobosAngle = this.timeOfDay * 0.55;
    this.phobosGroup.position.set(
      Math.cos(phobosAngle) * 290,
      Math.abs(Math.sin(phobosAngle)) * 95 + 55,
      -Math.abs(Math.sin(phobosAngle * 0.8)) * 240 - 60
    );
    this.phobosGroup.rotation.y += dt * 0.2;
    this.phobosGroup.rotation.z = 0.18;

    const deimosAngle = this.timeOfDay * 0.2 + 1.2;
    this.deimosGroup.position.set(
      Math.sin(deimosAngle) * 310,
      Math.abs(Math.cos(deimosAngle * 0.7)) * 105 + 65,
      -Math.abs(Math.cos(deimosAngle)) * 260 - 80
    );
    this.deimosGroup.rotation.y += dt * 0.14;
    this.deimosGroup.rotation.x += dt * 0.04;
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
