// @ts-nocheck
import { COMMS_CONFIG as C } from '../config/constants.ts';

// Posicao de Marte e da Terra pela tabela 1 do JPL "Approximate Positions of the Planets"
// (elementos keplerianos validos de 1800 a 2050). Precisao de minutos de arco: sobra para
// o atraso do radio e para saber quando o Sol fica entre os dois planetas.
// [Ref] https://ssd.jpl.nasa.gov/planets/approx_pos.html
// Cada elemento: [valor em J2000, taxa por seculo]. a em UA, angulos em graus.
const ELEMENTS = {
  earth: {
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    I: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981],
    peri: [102.93768193, 0.32327364],
    node: [0.0, 0.0],
  },
  mars: {
    a: [1.52371034, 0.00001847],
    e: [0.0933941, 0.00007882],
    I: [1.84969142, -0.00813131],
    L: [-4.55343205, 19140.30268499],
    peri: [-23.94362959, 0.44441088],
    node: [49.55953891, -0.29257343],
  },
};

const RAD = Math.PI / 180;

function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Posicao heliocentrica na ecliptica J2000, em UA
export function planetPosition(name, date) {
  const el = ELEMENTS[name];
  const T = (julianDate(date) - 2451545.0) / 36525;
  const at = ([value, rate]) => value + rate * T;
  const a = at(el.a);
  const e = at(el.e);
  const I = at(el.I) * RAD;
  const L = at(el.L);
  const peri = at(el.peri);
  const node = at(el.node);
  const w = (peri - node) * RAD;
  const O = node * RAD;
  let M = ((L - peri) % 360 + 540) % 360 - 180; // -180..180
  M *= RAD;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 10; i++) {
    const dE = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
  return {
    x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    z: sw * sI * xp + cw * sI * yp,
  };
}

// Distancia Terra-Marte, minutos de luz (so ida) e angulo entre Marte e o Sol visto da Terra
export function earthMarsGeometry(date) {
  const earth = planetPosition('earth', date);
  const mars = planetPosition('mars', date);
  const dx = mars.x - earth.x, dy = mars.y - earth.y, dz = mars.z - earth.z;
  const distanceAu = Math.hypot(dx, dy, dz);
  const distanceKm = distanceAu * C.AU_KM;
  // Angulo entre a direcao do Sol (-earth) e a de Marte, visto da Terra
  const earthDist = Math.hypot(earth.x, earth.y, earth.z);
  const cos = (-earth.x * dx - earth.y * dy - earth.z * dz) / (earthDist * distanceAu);
  const sunAngleDeg = Math.acos(Math.max(-1, Math.min(1, cos))) / RAD;
  return { distanceKm, lightMinutes: distanceKm / C.SPEED_OF_LIGHT_KM_S / 60, sunAngleDeg };
}
