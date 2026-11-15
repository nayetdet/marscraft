// @ts-nocheck
import * as THREE from 'three';

// Seta do objetivo na tela. Com o lugar a vista, ela fica em cima dele (com nome e distancia);
// com o lugar fora da tela ou atras do jogador, ela encosta na borda e aponta para o lado certo.
const EDGE_X = 0.84; // limites da area util da tela, em coordenadas de -1 a 1
const EDGE_TOP = 0.72;
const EDGE_BOTTOM = 0.5; // deixa livre a parte de baixo (hotbar e barras)

const _point = new THREE.Vector3();

export function waypointEdgeDirection(nx, ny, behind) {
  // An exactly-behind target projects to the screen center. Place it at the bottom edge rather
  // than inventing a direction to the right.
  if (behind && Math.abs(nx) < 0.05 && Math.abs(ny) < 0.05) return { nx: 0, ny: -1, angle: 0 };
  if (behind) { nx = -nx; ny = -ny; }
  const limitY = ny >= 0 ? EDGE_TOP : EDGE_BOTTOM;
  const shrink = Math.min(EDGE_X / Math.max(Math.abs(nx), 1e-4), limitY / Math.max(Math.abs(ny), 1e-4));
  nx *= shrink;
  ny *= shrink;
  return { nx, ny, angle: Math.round((Math.atan2(-ny, nx) * 180) / Math.PI - 90) };
}

export class WaypointHud {
  constructor() {
    this.el = document.getElementById('waypoint');
    this.arrowEl = document.getElementById('waypoint-arrow');
    this.nameEl = document.getElementById('waypoint-name');
    this.distEl = document.getElementById('waypoint-dist');
    this._visible = false;
    this._name = '';
    this._dist = -1;
    this._x = -1;
    this._y = -1;
    this._angle = NaN;
    this._edge = false;
  }

  // target: { x, y, z, label } ou null
  update(camera, target) {
    if (!target) {
      this._show(false);
      return;
    }
    camera.updateMatrixWorld();

    // Distancia ate a camera e posicao no espaco da camera (z > 0 = atras do jogador)
    _point.set(target.x, target.y, target.z).applyMatrix4(camera.matrixWorldInverse);
    const behind = _point.z > 0;
    const distance = Math.round(_point.length());

    _point.set(target.x, target.y, target.z).project(camera);
    let nx = _point.x;
    let ny = _point.y;
    if (behind) {
      // A projecao de um ponto atras da camera vem espelhada
      nx = -nx;
      ny = -ny;
    }

    const onScreen = !behind && Math.abs(nx) <= EDGE_X && ny <= EDGE_TOP && ny >= -EDGE_BOTTOM;
    let angle = 0; // graus; 0 = seta para baixo, em cima do lugar
    if (!onScreen) {
      // Leva o ponto ate a borda, na direcao do lugar, e gira a seta para fora
      const edge = waypointEdgeDirection(nx, ny, behind);
      nx = edge.nx;
      ny = edge.ny;
      angle = edge.angle;
    }

    const x = Math.round((nx * 0.5 + 0.5) * window.innerWidth);
    const y = Math.round((-ny * 0.5 + 0.5) * window.innerHeight);
    if (x !== this._x || y !== this._y) {
      this._x = x;
      this._y = y;
      this.el.style.transform = `translate(${x}px, ${y}px)`;
    }
    if (angle !== this._angle) {
      this._angle = angle;
      this.arrowEl.style.transform = `rotate(${angle}deg)`;
    }
    if (onScreen === this._edge) {
      this._edge = !onScreen;
      this.el.classList.toggle('is-edge', !onScreen);
    }
    if (target.label !== this._name) {
      this._name = target.label;
      this.nameEl.textContent = target.label;
    }
    if (distance !== this._dist) {
      this._dist = distance;
      this.distEl.textContent = `${distance} m`;
    }
    this._show(true);
  }

  _show(visible) {
    if (visible === this._visible) return;
    this._visible = visible;
    this.el.classList.toggle('hidden', !visible);
  }
}
