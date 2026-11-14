import * as THREE from 'three';

// Code-built voxel models; geometry and palette are shared by beds, hands and drops.
const cube = new THREE.BoxGeometry(1, 1, 1);
const colors = { stem: 0x477534, leaf: 0x4b9b42, light: 0x8ac956, dark: 0x286139, skin: 0xb78049, flesh: 0xdca568, eye: 0x715039, pod: 0x709e3d, bean: 0xc5d77c };
const palette = Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, new THREE.MeshLambertMaterial({ color })]));
function box(group, color, x, y, z, w, h, d, tilt = 0) {
  const mesh = new THREE.Mesh(cube, palette[color]);
  mesh.position.set(x, y, z); mesh.scale.set(w, h, d); mesh.rotation.z = tilt; group.add(mesh);
}
export function createCropItemModel(type) {
  const g = new THREE.Group(); g.name = `${type}-food`;
  if (type === 'potato') {
    box(g, 'skin', 0, 0, 0, .7, .42, .45);
    box(g, 'flesh', -.05, .06, .02, .58, .4, .43);
    for (const [x, y] of [[-.19, .04], [.11, .13], [.21, -.08]]) box(g, 'eye', x, y, .241, .055, .045, .015);
  } else if (type === 'lettuce') {
    box(g, 'dark', 0, -.08, 0, .7, .32, .65);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      box(g, i % 2 ? 'light' : 'leaf', Math.cos(angle) * .2, .05, Math.sin(angle) * .2, .3, .42, .3, Math.cos(angle) * .3);
    }
    box(g, 'light', 0, .12, 0, .32, .34, .32);
  } else if (type === 'soy') {
    for (let i = 0; i < 3; i++) {
      box(g, 'pod', (i - 1) * .19, (i - 1) * .06, 0, .24, .65, .22, -.35);
      for (let j = 0; j < 3; j++) box(g, 'bean', (i - 1) * .19 + (j - 1) * .055, (j - 1) * .19 + (i - 1) * .06, .115, .14, .14, .04);
    }
  } else throw new Error(`Unknown crop model: ${type}`);
  return g;
}
export function createCropPlantModel(type) {
  const g = new THREE.Group(); g.name = `${type}-plant`;
  if (type === 'lettuce') {
    const head = createCropItemModel(type); head.position.y = .25; g.add(head);
  } else {
    box(g, 'stem', 0, .42, 0, .07, .84, .07);
    const levels = type === 'soy' ? 3 : 2;
    for (let i = 0; i < levels; i++) {
      const y = .28 + i * .22;
      box(g, 'leaf', -.19, y, 0, .4, .09, .2, -.3);
      box(g, 'light', .19, y + .07, 0, .4, .09, .2, .3);
    }
    const food = createCropItemModel(type);
    food.scale.setScalar(type === 'soy' ? .5 : .65);
    food.position.set(type === 'soy' ? .17 : 0, type === 'soy' ? .38 : .16, .12);
    g.add(food);
  }
  return g;
}
