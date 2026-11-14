import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { RoverController } from './RoverController.js';

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

    // Move para a cratera de gelo (x: 22, z: -22)
    controller.pos.set(22, 9, -22);
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
});
