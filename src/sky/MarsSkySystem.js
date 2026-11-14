import * as THREE from 'three';
import { createAtmosphereDome } from './atmosphereShader.js';
import {
  createEarthAndMoonSystem,
  createMartianMoons,
  createMartianSun,
  createStarfield,
} from './celestialBodies.js';

export class MarsSkySystem {
  constructor(scene) {
    this.scene = scene;
    this.timeOfDay = 17.25; // Entardecer marciano inicial
    this.solCount = 1;
    this.autoAdvanceSpeed = 0.03;

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

    const { earthSystemGroup, earthMesh } = createEarthAndMoonSystem();
    this.earthSystemGroup = earthSystemGroup;
    this.earthMesh = earthMesh;
    this.celestialGroup.add(this.earthSystemGroup);

    const { phobosGroup, deimosGroup } = createMartianMoons();
    this.phobosGroup = phobosGroup;
    this.deimosGroup = deimosGroup;
    this.celestialGroup.add(this.phobosGroup, this.deimosGroup);

    this._initAtmosphericDust();
    this.update(0, new THREE.Vector3(0, 20, 0));
  }

  _initLights() {
    this.ambientLight = new THREE.HemisphereLight(0xffd2a6, 0x7c4a21, 0.8);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffeed6, 1.35);
    this.sunLight.position.set(120, 60, -80);
    this.scene.add(this.sunLight);

    this.scene.fog = new THREE.FogExp2(0xdc8e48, 0.0062);
  }

  _initAtmosphericDust() {
    const count = 450;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = Math.random() * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xf2aa68,
      size: 0.22,
      transparent: true,
      opacity: 0.45,
    });
    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
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
    const sunDir = new THREE.Vector3(Math.cos(sunAngle), Math.sin(sunAngle), -0.28).normalize();

    this.sunGroup.position.copy(sunDir.clone().multiplyScalar(360));
    this.skyUniforms.uSunDir.value.copy(sunDir);
    this.skyUniforms.uSunElevation.value = sunDir.y;

    const dayStrength = THREE.MathUtils.smoothstep(sunDir.y, -0.15, 0.35);
    const twilightStrength =
      THREE.MathUtils.smoothstep(sunDir.y, -0.22, 0.05) *
      (1.0 - THREE.MathUtils.smoothstep(sunDir.y, 0.05, 0.35));

    this.sunLight.position.copy(playerPos).add(sunDir.clone().multiplyScalar(120));
    this.sunLight.intensity = 0.18 + dayStrength * 1.3;

    const dayColor = new THREE.Color(0xffdfc4);
    const sunsetBlueColor = new THREE.Color(0x9bd1ff);
    const nightColor = new THREE.Color(0x334155);

    this.sunLight.color
      .copy(nightColor)
      .lerp(dayColor, dayStrength)
      .lerp(sunsetBlueColor, twilightStrength * 0.65);

    this.ambientLight.intensity = 0.28 + dayStrength * 0.62;

    const fogNight = new THREE.Color(0x181008);
    const fogSunset = new THREE.Color(0xb8682b);
    const fogDay = new THREE.Color(0xdc8e48);
    this.scene.fog.color
      .copy(fogNight)
      .lerp(fogDay, dayStrength)
      .lerp(fogSunset, twilightStrength);

    this.starMaterial.opacity = THREE.MathUtils.clamp(1.0 - dayStrength * 0.78, 0.18, 0.95);

    this.earthMesh.rotation.y += dt * 0.35;
    this.earthSystemGroup.lookAt(playerPos);

    const phobosAngle = this.timeOfDay * 0.65;
    this.phobosGroup.position.set(
      Math.cos(phobosAngle) * 280,
      Math.abs(Math.sin(phobosAngle)) * 195 + 45,
      Math.sin(phobosAngle) * 240
    );
    this.phobosGroup.rotation.y += dt * 0.2;

    const deimosAngle = this.timeOfDay * 0.18 + 1.9;
    this.deimosGroup.position.set(
      Math.cos(deimosAngle) * 320,
      Math.abs(Math.cos(deimosAngle * 0.7)) * 210 + 70,
      Math.sin(deimosAngle) * 320
    );

    if (this.dustParticles) {
      this.dustParticles.position.set(
        Math.floor(playerPos.x / 40) * 40,
        0,
        Math.floor(playerPos.z / 40) * 40
      );
      this.dustParticles.rotation.y += dt * 0.03;
    }
  }

  getEarthWorldPosition() {
    const pos = new THREE.Vector3();
    this.earthMesh.getWorldPosition(pos);
    return pos;
  }

  getPhobosWorldPosition() {
    const pos = new THREE.Vector3();
    this.phobosGroup.getWorldPosition(pos);
    return pos;
  }

  getDeimosWorldPosition() {
    const pos = new THREE.Vector3();
    this.deimosGroup.getWorldPosition(pos);
    return pos;
  }

  getSunWorldPosition() {
    const pos = new THREE.Vector3();
    this.sunMesh.getWorldPosition(pos);
    return pos;
  }

  getFormattedTime() {
    const hours = Math.floor(this.timeOfDay);
    const mins = Math.floor((this.timeOfDay - hours) * 60);
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const sol = String(this.solCount).padStart(3, '0');

    let phase = 'DIA MARCIANO (POEIRA DE ÓXIDO DE FERRO)';
    if (this.timeOfDay >= 16.5 && this.timeOfDay <= 19.2) {
      phase = 'PÔR DO SOL AZULADO DE MARTE (MIE SCATTERING)';
    } else if (this.timeOfDay >= 5.0 && this.timeOfDay <= 7.2) {
      phase = 'AMANHECER AZULADO MARCIANO';
    } else if (this.timeOfDay > 19.2 || this.timeOfDay < 5.0) {
      phase = 'NOITE ESTRELADA MARCIANA';
    }

    return {
      clockText: `SOL ${sol} - ${hh}:${mm} LMST`,
      phaseText: phase,
    };
  }
}
