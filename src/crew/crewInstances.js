import * as THREE from 'three';

// Pecas (caixas) que cabem em cada lote. 10 trajes x ~50 pecas = ~500; sobra folga.
const CAPACITY = 1536;

// Desenha as caixas de todos os trajes da tripulacao juntas, com instancing. Cada traje tem
// ~55 caixinhas; como Mesh separado, cada uma era um desenho (draw call) por quadro, e a
// tripulacao inteira passava de 400 desenhos, mais que todo o resto da base. Aqui viram dois:
// um lote de caixas de cor lisa (a cor vai por instancia) e um das lampadas do traje (que brilham).
//
// As pecas continuam existindo como Object3D dentro do esqueleto de cada traje (e por isso a
// animacao nao muda): a escala do no guarda o tamanho da caixa, e sync() copia a matriz de mundo
// de cada no para o lote. Chamar sync() uma vez por quadro, depois de animar e antes de desenhar.
export class CrewInstances {
  // Um conjunto de lotes por cena, criado na primeira vez que alguem pede
  static for(scene) {
    if (!scene.userData.crewInstances) scene.userData.crewInstances = new CrewInstances(scene);
    return scene.userData.crewInstances;
  }

  constructor(scene) {
    const box = new THREE.BoxGeometry(1, 1, 1);
    this.plain = this._createBatch(box, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    this.lamp = this._createBatch(box, new THREE.MeshLambertMaterial({
      color: 0x7dd3fc,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
    }));
    // A cor por instancia precisa existir antes do primeiro desenho (o shader depende dela)
    this.plain.setColorAt(0, new THREE.Color(0xffffff));
    scene.add(this.plain, this.lamp);
    this.suits = new Set();
  }

  _createBatch(geometry, material) {
    const mesh = new THREE.InstancedMesh(geometry, material, CAPACITY);
    mesh.count = 0;
    // As pecas se espalham pela base inteira: sem teste de camera (e um desenho so)
    mesh.frustumCulled = false;
    // No modo Shaders quem faz a sombra do traje e a caixa de sombra do CrewAvatar
    mesh.userData.noShadowCast = true;
    return mesh;
  }

  // `suit` = { group, parts: [{ node, material, lamp }] }
  add(suit) {
    this.suits.add(suit);
  }

  remove(suit) {
    this.suits.delete(suit);
  }

  sync() {
    let plainCount = 0;
    let lampCount = 0;
    for (const suit of this.suits) {
      if (!suit.group.visible || !suit.group.parent) continue;
      suit.group.updateWorldMatrix(false, true);
      for (const part of suit.parts) {
        if (part.lamp) {
          if (lampCount < CAPACITY) this.lamp.setMatrixAt(lampCount++, part.node.matrixWorld);
        } else if (plainCount < CAPACITY) {
          this.plain.setMatrixAt(plainCount, part.node.matrixWorld);
          this.plain.setColorAt(plainCount, part.material.color);
          plainCount++;
        }
      }
    }
    this.plain.count = plainCount;
    this.lamp.count = lampCount;
    this.plain.instanceMatrix.needsUpdate = true;
    this.plain.instanceColor.needsUpdate = true;
    this.lamp.instanceMatrix.needsUpdate = true;
  }
}
