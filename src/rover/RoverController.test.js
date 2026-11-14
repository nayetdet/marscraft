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
    expect(telemetry.cameraMode).toBe('third_person');
  });

  it('ativa e desativa o modo rover corretamente', () => {
    const roverGroup = new THREE.Group();
    const controller = new RoverController({ roverGroup, wheels: [] });

    controller.activate();
    expect(controller.isActive).toBe(true);

    controller.toggleCameraMode();
    expect(controller.cameraMode).toBe('mastcam');
    controller.toggleCameraMode();
    expect(controller.cameraMode).toBe('third_person');

    controller.deactivate();
    expect(controller.isActive).toBe(false);
  });

  it('respeita os limites da cratera impedindo saida', () => {
    const roverGroup = new THREE.Group();
    const controller = new RoverController({ roverGroup, wheels: [] });

    // Perto do centro da cratera (x: 10, z: 10, dist ~14.1 < 47)
    expect(controller.isPositionBlocked(10, 10, 9)).toBe(false);

    // Fora do limite da cratera (x: 50, z: 50, dist ~70 > 46.8)
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
});
