// @ts-nocheck
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { RoverController } from './RoverController.ts';
import { ROVER_CONFIG as R, WATER_SYSTEM_CONFIG } from '../config/constants.ts';
import { Battery } from '../mission/energy.ts';

describe('RoverController', () => {
  it('inicializa com valores padrao de telemetria e estado inativo', () => {
    const roverGroup = new THREE.Group();
    roverGroup.position.set(7.5, 9, 10.5);

    const controller = new RoverController({ roverGroup, wheels: [] });

    expect(controller.isActive).toBe(false);
    expect(controller.pos.x).toBe(7.5);
    expect(controller.pos.z).toBe(10.5);

    const telemetry = controller.getTelemetry();
    expect(telemetry.speedKmh).toBe('0.0');
    expect(telemetry.battery).toBeGreaterThanOrEqual(90);
    expect(controller.cameraYaw).toBe(controller.yaw);
    expect(controller.cameraPitch).toBe(-0.22);
  });

  it('spawns facing the opposite direction from its previous heading', () => {
    const roverGroup = new THREE.Group();
    roverGroup.position.set(7.5, 9, 10.5);
    roverGroup.rotation.y = R.SPAWN_YAW;

    const controller = new RoverController({ roverGroup, wheels: [] });
    controller.activate();
    controller.update(0.5, { KeyW: true });

    expect(controller.yaw).toBe(R.SPAWN_YAW);
    expect(controller.pos.z).toBeLessThan(10.5);
  });

  it('ativa o rover e permite olhar ao redor sem ultrapassar os limites da câmera', () => {
    const roverGroup = new THREE.Group();
    const controller = new RoverController({ roverGroup, wheels: [] });

    controller.activate();
    expect(controller.isActive).toBe(true);

    const initialYaw = controller.cameraYaw;
    controller.look(50, 50);
    expect(controller.cameraYaw).toBeLessThan(initialYaw);
    expect(controller.cameraPitch).toBeLessThan(-0.22);

    controller.look(0, 100000);
    expect(controller.cameraPitch).toBe(-1.15);

    controller.deactivate();
    expect(controller.isActive).toBe(false);
  });

  it('is blocked by the solid outer rim terrain', () => {
    const roverGroup = new THREE.Group();
    const world = {
      sizeY: 48,
      getBlock(x, y, z) {
        return Math.hypot(x, z) > 50 && y === 24 ? 1 : 0;
      },
    };
    const controller = new RoverController({ roverGroup, wheels: [], world });

    expect(controller.isPositionBlocked(10, 10, 9)).toBe(false);
    expect(controller.isPositionBlocked(50, 50, 9)).toBe(true);
  });

  it('acelera e move o rover quando ativo e pressionando W', () => {
    const roverGroup = new THREE.Group();
    roverGroup.position.set(7.5, 9, 10.5);
    const dummyWheel = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

    const controller = new RoverController({
      roverGroup,
      wheels: [dummyWheel],
    });

    controller.activate();
    // Simula tecla W pressionada durante 0.5s
    controller.update(0.5, { KeyW: true });

    expect(controller.speed).toBeGreaterThan(0);
    // Frente é -Z para yaw = 0, então Z deve diminuir
    expect(controller.pos.z).toBeLessThan(10.5);
    expect(controller.distanceTraveled).toBeGreaterThan(0);
    expect(dummyWheel.rotation.x).not.toBe(0);
  });

  it('drills and offloads water ice correctly based on proximity to ice crater and habitat bay', () => {
    const roverGroup = new THREE.Group();
    // Inicia longe do gelo
    roverGroup.position.set(0, 9, 0);

    const controller = new RoverController({ roverGroup, wheels: [] });
    expect(controller.canCollectIce()).toBe(false);
    expect(controller.collectIce().success).toBe(false);

    // Move para a cratera de gelo
    controller.pos.set(30, 9, -22); // WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER
    expect(controller.canCollectIce()).toBe(true);

    const collectResult = controller.collectIce();
    expect(collectResult.success).toBe(true);
    expect(controller.iceCargo).toBe(10);
    expect(controller.drillCooldown).toBeGreaterThan(0);

    // Tenta descarregar na cratera (longe da doca da base)
    expect(controller.canUnloadIce()).toBe(false);

    // Move de volta para a doca de descarregamento da base (x: 5.5, z: 9.5)
    controller.pos.set(5.5, 9, 9.5);
    expect(controller.canUnloadIce()).toBe(true);

    const unloadResult = controller.unloadIce();
    expect(unloadResult.success).toBe(true);
    expect(unloadResult.amount).toBe(10);
    expect(controller.iceCargo).toBe(0);
  });

  it('animates the drill and reports collection progress to the HUD', () => {
    const roverGroup = new THREE.Group();
    const controller = new RoverController({ roverGroup, wheels: [] });
    controller.pos.set(22, 9, -22);
    controller.activate();

    expect(controller.rig).toBeDefined();

    controller.collectIce();
    // Avança a animação até a fase de perfuração e extração térmica
    controller.update(0.45, {});

    expect(controller.armDeploy).toBeGreaterThan(0.5);
    expect(controller.rig.armPivot.rotation.x).toBeLessThan(0);
    expect(controller.rig.drillBit.rotation.y).toBeGreaterThan(0);
    expect(controller.rig.iceCuttings.some((p) => p.visible)).toBe(true);
    expect(controller.getTelemetry().waterFillRatio).toBeGreaterThan(0);

    // Conclui o ciclo de perfuração e recolhimento do braço
    controller.update(1.5, {});
    expect(controller.getTelemetry().waterFillRatio).toBeCloseTo(0.2, 1);
  });
});

describe('rover battery (issue #111)', () => {
  const DEPOT = WATER_SYSTEM_CONFIG.ICE_DEPOT_POS;
  const CRATER = WATER_SYSTEM_CONFIG.ICE_CRATER_CENTER;

  function roverAt(x, z, options = {}) {
    const roverGroup = new THREE.Group();
    roverGroup.position.set(x, 9, z);
    return new RoverController({ roverGroup, wheels: [], ...options });
  }

  it('starts full and driving drains it, forward or in reverse', () => {
    const rover = roverAt(0, 0);
    expect(rover.battery).toBe(R.START_BATTERY);
    rover.activate();
    rover.update(2, { KeyW: true });
    expect(rover.battery).toBeCloseTo(R.START_BATTERY - 2 * R.DRIVE_DRAIN_PER_SECOND);
    rover.update(2, { KeyS: true });
    expect(rover.battery).toBeCloseTo(R.START_BATTERY - 4 * R.DRIVE_DRAIN_PER_SECOND);
    // Parado longe da base nao gasta, e tambem nao recarrega de graca
    const parked = rover.battery;
    rover.update(60, {});
    expect(rover.battery).toBe(parked);
  });

  it('each drill costs battery, and a low battery refuses to drill', () => {
    const rover = roverAt(CRATER.x, CRATER.z);
    expect(rover.collectIce().success).toBe(true);
    expect(rover.battery).toBe(R.START_BATTERY - R.DRILL_DRAIN);

    rover.battery = R.LOW_BATTERY - 1;
    const refused = rover.collectIce();
    expect(refused.success).toBe(false);
    expect(refused.reason).toMatch(/battery too low/i);
    expect(rover.iceCargo).toBe(WATER_SYSTEM_CONFIG.ICE_PER_DRILL);
    expect(rover.battery).toBe(R.LOW_BATTERY - 1);
    expect(rover.getTelemetry().lowBattery).toBe(true);
  });

  it('a low battery caps the speed, but the rover still crawls home at 0%', () => {
    const rover = roverAt(0, 0);
    rover.activate();
    rover.battery = R.LOW_BATTERY - 1;
    for (let i = 0; i < 20; i++) rover.update(0.2, { KeyW: true });
    expect(rover.speed).toBeCloseTo(rover.maxForwardSpeed * R.LOW_BATTERY_SPEED_FACTOR);

    rover.battery = 0;
    const z = rover.pos.z;
    for (let i = 0; i < 10; i++) rover.update(0.2, { KeyW: true });
    expect(rover.battery).toBe(0);
    expect(rover.speed).toBeGreaterThan(0);
    expect(rover.pos.z).toBeLessThan(z);
    expect(rover.getTelemetry().battery).toBe(0);
  });

  it('charges while parked at the base depot, and the base battery pays for it', () => {
    const base = new Battery(80);
    const rover = roverAt(DEPOT.x, DEPOT.z, { basePower: base });
    rover.battery = 50;

    rover.update(1, {}); // estacionado (inativo) tambem carrega
    expect(rover.battery).toBeCloseTo(50 + R.CHARGE_PER_SECOND);
    expect(base.charge).toBeCloseTo(80 - R.CHARGE_PER_SECOND * R.BASE_COST_PER_ROVER_PERCENT);
    expect(rover.getTelemetry().isCharging).toBe(true);

    for (let i = 0; i < 100; i++) rover.update(1, {});
    expect(rover.battery).toBe(100);
    // 50 % do rover custaram exatamente 50 x BASE_COST_PER_ROVER_PERCENT da base, nem mais
    expect(base.charge).toBeCloseTo(80 - 50 * R.BASE_COST_PER_ROVER_PERCENT);
    expect(rover.getTelemetry().isCharging).toBe(false);
  });

  it('does not charge while driving, away from the depot, or without base power', () => {
    const base = new Battery(80);
    const driving = roverAt(DEPOT.x, DEPOT.z, { basePower: base });
    driving.battery = 50;
    driving.activate();
    driving.update(0.1, { KeyW: true });
    expect(driving.battery).toBeLessThan(50);
    expect(base.charge).toBe(80);

    const away = roverAt(CRATER.x, CRATER.z, { basePower: base });
    away.battery = 50;
    away.update(5, {});
    expect(away.battery).toBe(50);
    expect(base.charge).toBe(80);

    const emptyBase = roverAt(DEPOT.x, DEPOT.z, { basePower: new Battery(0) });
    emptyBase.battery = 50;
    emptyBase.update(5, {});
    expect(emptyBase.battery).toBe(50);
    expect(emptyBase.getTelemetry().isCharging).toBe(false);

    const unplugged = roverAt(DEPOT.x, DEPOT.z);
    unplugged.battery = 50;
    unplugged.update(5, {});
    expect(unplugged.battery).toBe(50);
  });

  it('a base battery that runs out mid-charge only gives what it has', () => {
    const base = new Battery(0.2);
    const rover = roverAt(DEPOT.x, DEPOT.z, { basePower: base });
    rover.battery = 10;
    rover.update(1, {});
    expect(base.charge).toBeCloseTo(0);
    expect(rover.battery).toBeCloseTo(10 + 0.2 / R.BASE_COST_PER_ROVER_PERCENT);
  });

  it('a full ice trip (drive out, 5 drills, drive back) costs about a quarter to a third of the battery', () => {
    const distance = Math.hypot(CRATER.x - DEPOT.x, CRATER.z - DEPOT.z);
    const rover = roverAt(0, 0);
    const drivingSeconds = (2 * distance) / rover.maxForwardSpeed;
    const drills = WATER_SYSTEM_CONFIG.ICE_CARGO_MAX / WATER_SYSTEM_CONFIG.ICE_PER_DRILL;
    const trip = drivingSeconds * R.DRIVE_DRAIN_PER_SECOND + drills * R.DRILL_DRAIN;
    expect(trip).toBeGreaterThan(20);
    expect(trip).toBeLessThan(35);
    // Sobra carga para voltar: tres viagens cabem numa bateria cheia sem cair na faixa lenta
    expect(R.START_BATTERY - 3 * trip).toBeGreaterThan(0);
  });
});
