import { CUTSCENE_CONFIG } from '../../config/constants.js';
import { EASE, sampleKeys } from './timeline.js';

// Animacao de chegada em tres partes:
//   1. Pouso: a capsula entra na atmosfera, freia com o motor e pousa perto da base.
//   2. Passeio: a camera mostra cada lugar da base com o nome e uma frase curta, e depois a
//      rotina de cada viagem (gelo -> foguete -> base).
//   3. A missao, mostrada em vez de escrita: a tripulacao embarca e o foguete parte rumo a Terra.
//      E uma previa; quando a animacao acaba, o foguete esta de volta na plataforma, vazio.
// A crianca sai da animacao sabendo para que serve cada lugar, o que fazer e para que.
const CHASE_END = 4; // fim do plano de perseguicao, comeco do plano no chao
const TOUCHDOWN = 9.5;
const FADE_START = 12.5;
const TOUR_START = 13; // primeiro lugar do passeio, ja com a tela escura do corte
const CUT_FADE = 0.22; // meia duracao do escurecimento rapido entre dois planos
const END_FADE = 0.8;
const SOL_TITLE_SECONDS = 1.6;

// Lugares do passeio, na ordem. `cam` e `camEnd` sao deslocamentos da camera em relacao ao lugar
// (a camera desliza devagar de um para o outro); `look` sobe o ponto para onde ela olha.
const TOUR_STOPS = [
  { place: 'base', title: 'THE BASE', text: 'Air and safety inside.', cam: [16, 13, 30], camEnd: [12, 12, 27], look: 3 },
  { place: 'solar', title: 'SOLAR PANELS', text: 'The Sun charges the battery.', cam: [-10, 6, 6], camEnd: [-9, 5, 3], look: 1 },
  { place: 'greenhouse', title: 'GREENHOUSE', text: 'Grow your food here.', cam: [-20, 15, 24], camEnd: [-17, 14, 22], look: 4 },
  { place: 'ice', title: 'ICE CRATER', text: 'Ice makes rocket fuel.', cam: [-9.5, 11, 8.5], camEnd: [-8, 10, 7], look: 0 },
  { place: 'rocket', title: 'THE ROCKET', text: 'Your ride home. Empty tank!', cam: [10, 7, 13], camEnd: [9, 6.5, 11], look: 5 },
];
// A frase da rotina fica no foguete, com a camera subindo devagar
const ROUTINE_SHOT = { place: 'rocket', cam: [9, 6.5, 11], camEnd: [7, 10, 9], look: 6 };

// Previa da missao: a tripulacao anda ate o foguete, o motor acende e ele sobe rumo a Terra
const BOARD_SECONDS = 3.2;
const IGNITE_SECONDS = 0.7;
const TURN_SECONDS = 2.6; // tempo para o foguete sair da vertical e apontar para a Terra
const FINALE_CAM = [6.5, 2.4, 9.5]; // camera baixa, com a Terra no ceu atras do foguete
const CREW_SIDE = [-0.825, 0.565]; // direcao (x, z) de onde a tripulacao chega: a esquerda da tela
const CREW_HEADING = Math.atan2(-CREW_SIDE[0], -CREW_SIDE[1]); // andando para o foguete
const CREW_FIRST = 7; // distancia do primeiro tripulante ate o foguete, em blocos
const CREW_GAP = 1.4; // distancia entre um tripulante e o seguinte
const CREW_DOOR = 1.3; // a esta distancia (no casco) o tripulante entrou no foguete
const CREW_SPEED = 2.6; // blocos por segundo

const _lander = [0, 0, 0];
const _cam = [0, 0, 0];

// Monta os planos do passeio com o tempo de cada um: [{ from, to, target, cam, camEnd, look }]
function buildTour(places) {
  const shots = [];
  let t = TOUR_START;
  for (const stop of TOUR_STOPS) {
    shots.push({ ...stop, target: places[stop.place], from: t, to: t + CUTSCENE_CONFIG.TOUR_STOP_SECONDS });
    t += CUTSCENE_CONFIG.TOUR_STOP_SECONDS;
  }
  shots.push({ ...ROUTINE_SHOT, target: places[ROUTINE_SHOT.place], from: t, to: t + CUTSCENE_CONFIG.TOUR_ROUTINE_SECONDS });
  return shots;
}

// `millionKm`: distancia Terra-Marte de hoje, em milhoes de km (CommsLink).
// `places`: ponto do mundo de cada lugar do passeio ({ base, solar, greenhouse, ice, rocket }).
// `rocket`: o foguete da base (objeto com `position` e `rotation`); `rocketFlame`: a chama dele.
// `crew`: tripulantes que embarcam, cada um com `poseWalking(x, y, z, heading, dt)` e `hide()`.
// `earthDir`: direcao unitaria do foguete ate a Terra no ceu, ou null se ela estiver abaixo do
// horizonte (o foguete sobe reto).
// `onTouchdown`: chamado uma vez quando a capsula toca o chao (o som do motor para ali).
export function createArrivalCutscene({
  camera, lander, flame, dust, site, groundY, millionKm, places, rocket, rocketFlame, crew = [], earthDir = null,
  onTouchdown, onEnd,
}) {
  const landerKeys = [
    { t: 0, v: [site.x + 40, groundY + 150, site.z - 30] },
    { t: CHASE_END, v: [site.x + 6, groundY + 55, site.z - 5] },
    { t: TOUCHDOWN, v: [site.x, groundY, site.z], ease: EASE.out },
  ];
  // Camera no chao, ao sul do local de pouso, com a base ao fundo
  const groundCamKeys = [
    { t: TOUCHDOWN, v: [site.x + 5, groundY + 2.2, site.z + 8] },
    { t: FADE_START, v: [site.x + 3.5, groundY + 2.8, site.z + 6.5], ease: EASE.inOut },
  ];

  const tour = buildTour(places);
  const routineShot = tour[tour.length - 1];
  const finaleAt = routineShot.to;
  const finaleEnd = finaleAt + CUTSCENE_CONFIG.TOUR_MISSION_SECONDS;
  const solAt = finaleEnd + END_FADE;
  const duration = solAt + SOL_TITLE_SECONDS;

  // Onde o foguete descansa, e para onde ele voa
  const home = { x: rocket.position.x, y: rocket.position.y, z: rocket.position.z };
  const toEarth = earthDir ?? { x: 0, y: 1, z: 0 };
  const pad = places.rocket;
  // O ultimo da fila precisa entrar antes de o motor acender
  const lastWalk = CREW_FIRST + CREW_GAP * Math.max(0, crew.length - 1) - CREW_DOOR;
  const crewSpeed = Math.max(CREW_SPEED, lastWalk / (BOARD_SECONDS - 0.3));

  // Tela: abre do preto, escurece no corte para o passeio, pisca rapido a cada plano e fecha no fim
  const fade = [
    { t: 0, v: 1 },
    { t: 0.8, v: 0 },
    { t: FADE_START, v: 0 },
    { t: TOUR_START - 0.05, v: 1 },
    { t: TOUR_START + 0.05, v: 1 },
    { t: TOUR_START + 0.5, v: 0 },
  ];
  for (const cut of [...tour.slice(1).map((shot) => shot.from), finaleAt]) {
    fade.push({ t: cut - CUT_FADE, v: 0 }, { t: cut, v: 0.9 }, { t: cut + CUT_FADE, v: 0 });
  }
  fade.push({ t: finaleEnd, v: 0 }, { t: solAt, v: 1 }, { t: duration, v: 1 });

  const captions = [
    { from: 0.4, to: 3.9, text: 'After a 7-month trip from Earth, you reach Mars.' },
    { from: 4.2, to: 9.3, text: "Mars air is 100 times thinner than Earth's. The engines must slow you down." },
    { from: 9.7, to: 12.6, text: `Touchdown! You are ${millionKm} million km from home.` },
  ];
  for (const stop of tour.slice(0, -1)) {
    captions.push({ from: stop.from + 0.1, to: stop.to - 0.1, place: true, text: stop.title, sub: stop.text });
  }
  captions.push(
    { from: routineShot.from + 0.1, to: finaleAt - 0.1, place: true, text: 'EVERY TRIP', sub: 'Get ice. Load the rocket. Back to base.' },
    { from: finaleAt + 0.1, to: finaleEnd, place: true, text: 'YOUR MISSION', sub: 'Fill the rocket. Fly home.' },
    { from: solAt, to: duration, big: true, text: 'SOL 1', sub: '1 sol = 1 Mars day (24 h 39 min)' },
  );

  let touchedDown = false;
  let shotIndex = 0;

  // Previa da missao. `local` conta os segundos desde o comeco dela.
  function updateFinale(t, dt) {
    const local = t - finaleAt;

    // A fila anda ate o foguete; quem chega na porta entra (some)
    for (let i = 0; i < crew.length; i++) {
      const distance = CREW_FIRST + i * CREW_GAP - local * crewSpeed;
      if (distance <= CREW_DOOR) crew[i].hide();
      else crew[i].poseWalking(pad.x + CREW_SIDE[0] * distance, groundY, pad.z + CREW_SIDE[1] * distance, CREW_HEADING, dt);
    }

    const ignite = local - BOARD_SECONDS;
    const flight = Math.max(0, ignite - IGNITE_SECONDS);
    rocketFlame.setPower(ignite <= 0 ? 0 : flight > 0 ? 1 : (0.6 * ignite) / IGNITE_SECONDS, t);

    // Sobe na vertical e vai virando para a Terra
    const turn = 0.9 * EASE.inOut(Math.min(1, flight / TURN_SECONDS));
    const vx = toEarth.x * turn;
    const vy = 1 - turn + toEarth.y * turn;
    const vz = toEarth.z * turn;
    const distance = 0.5 * CUTSCENE_CONFIG.PREVIEW_LAUNCH_ACCEL * flight * flight;
    const rumble = ignite > 0 && flight === 0 ? 0.03 : 0;
    rocket.position.set(
      home.x + vx * distance + Math.sin(t * 61) * rumble,
      home.y + vy * distance,
      home.z + vz * distance + Math.sin(t * 47) * rumble,
    );
    // Inclina o foguete na direcao do voo (rotacao que leva o eixo Y ate o vetor v)
    rocket.rotation.set(Math.atan2(vz, vy), 0, -Math.asin(vx / Math.hypot(vx, vy, vz)));

    // Pouca poeira e so no comeco, para nao tapar o foguete subindo
    if (ignite > 0 && distance < 5) dust.emit(dt, 16, home.x, home.y + 0.3, home.z, 4, 1.2);

    // Camera baixa: primeiro a fila e o foguete, depois ela sobe atras dele ate a Terra
    const follow = EASE.inOut(Math.min(1, flight / 1.2));
    const shake = ignite > 0 ? Math.max(0, 0.12 - flight * 0.05) : 0;
    camera.position.set(
      pad.x + FINALE_CAM[0] + Math.sin(t * 39) * shake,
      groundY + FINALE_CAM[1] + Math.sin(t * 57 + 1) * shake,
      pad.z + FINALE_CAM[2],
    );
    const restX = pad.x + CREW_SIDE[0] * 2;
    const restY = groundY + 3.4;
    const restZ = pad.z + CREW_SIDE[1] * 2;
    camera.lookAt(
      restX + (rocket.position.x - restX) * follow,
      restY + (rocket.position.y + 3 - restY) * follow,
      restZ + (rocket.position.z - restZ) * follow,
    );
  }

  return {
    duration,
    fadeColor: '#000',
    fade,
    captions,

    update(t, dt) {
      if (t === 0) {
        touchedDown = false;
        shotIndex = 0;
      }

      sampleKeys(landerKeys, t, _lander);
      lander.position.set(_lander[0], _lander[1], _lander[2]);
      // Balanco leve na descida, que some ate o pouso
      const sway = Math.max(0, 1 - t / TOUCHDOWN);
      lander.rotation.set(0.06 * Math.cos(t * 1.3) * sway, 0, 0.08 * Math.sin(t * 1.7) * sway);

      const burn = t < CHASE_END ? 0.45 : t < TOUCHDOWN ? 1 : Math.max(0, 1 - (t - TOUCHDOWN) / 0.3);
      flame.setPower(burn, t);

      // Poeira: o jato levanta areia perto do chao e o toque abre um anel
      if (t >= 8.2 && t < TOUCHDOWN) dust.emit(dt, 30, site.x, groundY + 0.2, site.z, 5, 1.2);
      if (t >= TOUCHDOWN && !touchedDown) {
        touchedDown = true;
        dust.burstRing(site.x, groundY, site.z, 40, 7);
        onTouchdown?.();
      }

      if (t >= finaleAt) {
        updateFinale(t, dt);
        dust.update(dt);
        return;
      }
      dust.update(dt);

      // Ate a previa da missao, o foguete fica parado na plataforma
      rocket.position.set(home.x, home.y, home.z);
      rocket.rotation.set(0, 0, 0);
      rocketFlame.setPower(0, t);

      if (t >= TOUR_START) {
        // Passeio: um plano por lugar, com a camera deslizando devagar
        while (shotIndex < tour.length - 1 && t >= tour[shotIndex].to) shotIndex++;
        const shot = tour[shotIndex];
        const k = EASE.inOut(Math.max(0, Math.min(1, (t - shot.from) / (shot.to - shot.from))));
        const { target, cam, camEnd } = shot;
        camera.position.set(
          target.x + cam[0] + (camEnd[0] - cam[0]) * k,
          target.y + cam[1] + (camEnd[1] - cam[1]) * k,
          target.z + cam[2] + (camEnd[2] - cam[2]) * k,
        );
        camera.lookAt(target.x, target.y + shot.look, target.z);
        return;
      }

      let shake;
      if (t < CHASE_END) {
        // Plano 1: perseguicao, acima e atras da capsula, olhando para baixo
        camera.position.set(_lander[0] + 4, _lander[1] + 11, _lander[2] + 9);
        shake = 0.05;
      } else {
        // Planos 2 e 3: camera no chao seguindo a capsula ate o toque
        sampleKeys(groundCamKeys, t, _cam);
        camera.position.set(_cam[0], _cam[1], _cam[2]);
        shake = t < TOUCHDOWN ? 0.06 : Math.max(0, 0.22 - (t - TOUCHDOWN) * 0.45);
      }
      camera.position.x += Math.sin(t * 37) * shake;
      camera.position.y += Math.sin(t * 53 + 1) * shake;
      camera.lookAt(_lander[0], _lander[1] + (t < CHASE_END ? -2 : 2.6), _lander[2]);
    },

    onEnd,
  };
}
