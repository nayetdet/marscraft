// @ts-nocheck
import { BLOCK_IDS, CROP_ITEM_IDS } from '../config/blockTypes.ts';
import { CREW_CONFIG, ENERGY_CONFIG, MISSION_CONFIG, STATION_CONFIG, UTILITY_CONFIG as U } from '../config/constants.ts';
import { OXYGEN_MODE_INFO } from '../mission/oxygenPlant.ts';
import { coldFraction, outsideTemperatureC } from '../data/marsWeather.ts';

// Plantas que a crianca pode entregar ao cozinheiro: as 3 culturas colhidas na estufa. A cenoura
// de Marte que ja vem na mochila nao conta: ela e o lanche de emergencia, comido direto.
const PLAYER_CROPS = Object.entries(CROP_ITEM_IDS);

// Regras do modulo norte (issue #56, parte B). Sem DOM nem Three.js, para testar com Vitest.
// Nenhuma acao e de graca: tudo cobra energia, agua, comida da despensa ou regolito.
//   B1/B2 energia e aquecimento: aquecedor, luz da estufa e corte de carga
//   B3 cozinha: racao (acaba, e a tripulacao come da mesma despensa); a planta colhida vira racao
//      com o cozinheiro, sem painel (ato 3, #409)
//   B4 reciclador de agua: a agua cinza (cozinha, plantas, beber) volta limpa sozinha, gastando
//      bateria. Sem bateria ou com os canos congelados ele para. (O banheiro e a oficina sairam
//      no corte de escopo de 15/11/2026.)
export class UtilityModule {
  constructor({ mission, survival, stations, base }) {
    this.mission = mission; // MissionSystem (bateria, escudo, fabrica)
    this.survival = survival; // jogador, agua da base, inventario
    this.stations = stations; // StationSystem (filtro de CO2, cestos da colheita)
    this.base = base; // estoque da tripulacao (racoes, agua cinza)
    this.heaterOn = true;
    this.greenhouseLightsOn = true;
    // % de bateria por hora de jogo que o reciclador de agua gasta agora (painel de energia)
    this.recyclerDrawPerHour = 0;
    this.waterRecycledL = 0; // litros devolvidos ao tanque nesta partida (boletim)
    this.cold = false; // aquecedor desligado de noite: canos e estufa congelam
    this.heaterDrawPerHour = 0;
    // Ritmo (issue #81): fracao do consumo passivo normal (src/mission/pacing.js)
    this.demandFactor = 1;
    this.rationPrepTimer = 0;
    this.lastRationCrop = null;
    this.rationIngredients = [];
    this.eatenRationCrop = null;
    // Racao que o cozinheiro esta preparando com a planta da crianca: { crop, timer } ou null
    this.playerRation = null;
    this.playerRationsMade = 0; // racoes feitas com planta entregue pela crianca (ato 3)
  }

  // One harvested item becomes one ration. Processing consumes battery power.
  updateRations(dt, cookPresent) {
    if (!cookPresent || this.base.food >= this.base.maxFood) { this.rationPrepTimer = 0; return; }
    const baskets = this.stations.harvestBaskets;
    if (!baskets || !Object.values(baskets).some(count => count > 0)) { this.rationPrepTimer = 0; return; }
    this.rationPrepTimer = Math.min(U.RATION_PREP_SECONDS, this.rationPrepTimer + dt);
    if (this.rationPrepTimer < U.RATION_PREP_SECONDS) return;
    const type = Object.keys(baskets).find(key => baskets[key] > 0);
    if (!type || !this.mission.battery.spend(U.RATION_PREP_POWER)) return;
    baskets[type]--;
    this.base.food++;
    this.rationIngredients.push(type);
    this.lastRationCrop = type;
    this.rationPrepTimer = 0;
  }

  get isNight() {
    return this.mission.chargeRate <= 0;
  }

  // Temperatura la fora agora (C), pelo clima real do InSight no relogio da missao (issue #108).
  // null se a missao nao tem relogio (testes antigos): o aquecedor volta ao dia/noite.
  get outsideTempC() {
    const hours = this.mission.lastHours;
    return Number.isFinite(hours) ? outsideTemperatureC(hours) : null;
  }

  // % de bateria por hora de jogo que o aquecedor gasta agora. Cresce com o frio la fora: do
  // HEATER_DAY_PER_HOUR no ar mais quente do InSight ate o HEATER_NIGHT_PER_HOUR no mais frio.
  get heaterRatePerHour() {
    return this.heaterRateAt(this.mission.lastHours);
  }

  // O mesmo gasto na hora `hours` do relogio da missao (previsao da noite, issue #420)
  heaterRateAt(hours) {
    const temp = Number.isFinite(hours) ? outsideTemperatureC(hours) : null;
    const rate = temp === null
      ? (this.isNight ? U.HEATER_NIGHT_PER_HOUR : U.HEATER_DAY_PER_HOUR)
      : U.HEATER_DAY_PER_HOUR + (U.HEATER_NIGHT_PER_HOUR - U.HEATER_DAY_PER_HOUR) * coldFraction(temp);
    return rate * this.demandFactor;
  }

  // Fracao da agua cinza que volta limpa. [Ref] a Estacao Espacial recupera ~98 %.
  get waterRecovery() {
    return STATION_CONFIG.WATER_RECOVERY;
  }

  update(hours) {
    if (hours <= 0) return;
    this.heaterDrawPerHour = 0;
    if (this.heaterOn) {
      const rate = this.heaterRatePerHour;
      const need = rate * hours;
      const got = this.mission.battery.drain(need);
      this.heaterDrawPerHour = rate;
      // Bateria vazia: o aquecedor para mesmo ligado
      this.cold = this.isNight && got + 1e-9 < need;
    } else {
      this.cold = this.isNight;
    }
    this._recycleWater(hours);
  }

  // Reciclador de agua: limpa a agua cinza e devolve ao tanque da base. Roda sozinho, mas nada e
  // de graca: cada litro limpo gasta bateria, e ele para com a bateria vazia ou os canos
  // congelados. Chamado pelo `update`, depois do aquecedor (que decide se esta frio).
  _recycleWater(hours) {
    this.recyclerDrawPerHour = 0;
    const base = this.base;
    if (!base || this.cold || !(base.graywater > 0)) return;
    const room = Math.max(0, base.maxWater - base.water) / this.waterRecovery;
    const wanted = Math.min(base.graywater, STATION_CONFIG.WATER_RECYCLE_L_PER_HOUR * hours, room);
    if (wanted <= 0) return;
    const need = wanted * U.RECYCLER_POWER_PER_L;
    const got = this.mission.battery.drain(need);
    const treated = need > 0 ? wanted * Math.min(1, got / need) : wanted;
    if (treated <= 0) return;
    base.graywater -= treated;
    const back = treated * this.waterRecovery;
    base.water = Math.min(base.maxWater, base.water + back);
    this.waterRecycledL += back;
    this.recyclerDrawPerHour = (treated * U.RECYCLER_POWER_PER_L) / hours;
  }

  toggle(system) {
    if (system === 'heater') {
      this.heaterOn = !this.heaterOn;
      return this.heaterOn ? 'Heater ON: pipes and plants stay warm. Uses power, more when it is colder outside.' : 'Heater OFF: saves power, but at night the water pipes and the greenhouse freeze.';
    }
    if (system === 'lights') {
      this.greenhouseLightsOn = !this.greenhouseLightsOn;
      return this.greenhouseLightsOn ? 'Greenhouse lights ON: plants grow again.' : 'Greenhouse lights OFF: saves power, but the plants stop growing.';
    }
    if (system === 'factory') {
      this.mission.factoryOn = !this.mission.factoryOn;
      return this.mission.factoryOn ? 'Fuel factory ON: turns ice into rocket fuel. Uses a lot of power.' : 'Fuel factory OFF: saves power, but the rocket stops filling.';
    }
    if (system === 'reactor') {
      return this.mission.toggleReactor()
        ? `Fission reactor ON: +${ENERGY_CONFIG.REACTOR_CHARGE_PER_HOUR}%/h day and night. Your radiation dose climbs faster while it runs.`
        : 'Fission reactor OFF: no extra radiation, but no power at night.';
    }
    if (system === 'shield') {
      if (!this.mission.toggleShield()) return 'The battery is empty: the shield cannot turn on.';
      return this.mission.shieldOn ? 'Radiation shield ON.' : 'Radiation shield OFF.';
    }
    return '';
  }

  // % de bateria que a luz da estufa gasta em `seconds` segundos reais. E o unico lugar que
  // converte a taxa por hora de jogo para o relogio real (MISSION_CONFIG.GAME_HOURS_PER_SECOND).
  greenhouseLightsCost(seconds) {
    return U.GREENHOUSE_LIGHTS_PER_HOUR * this.demandFactor * seconds * MISSION_CONFIG.GAME_HOURS_PER_SECOND;
  }

  // Lista de consumidores em % de bateria por hora de jogo, para o painel de distribuicao
  loads({ crewSize = 0, operatingStations = 0 } = {}) {
    const m = this.mission;
    const factoryRunning = m.factoryOn && m.iceStock > 0 && m.propellant < 100;
    const f = this.demandFactor; // o painel mostra o que a base gasta de verdade agora
    // Modo do gerador de O2 (issue #102): o MOXIE gasta mais energia por tripulante
    const air = OXYGEN_MODE_INFO[m.oxygenPlant?.mode ?? 'electrolysis'];
    return [
      // [nome, % por hora, ligado, id do interruptor em toggle() ou null se nao desliga]
      [air.powerLabel, crewSize * CREW_CONFIG.OXYGEN_ENERGY_PER_HOUR * air.energyFactor * f, true, null],
      ['Crew at work', operatingStations * STATION_CONFIG.WORK_ENERGY_PER_HOUR * f, true, null],
      ['Greenhouse lights', U.GREENHOUSE_LIGHTS_PER_HOUR * f, this.greenhouseLightsOn, 'lights'],
      ['Heater', this.heaterRatePerHour, this.heaterOn, 'heater'],
      ['Water recycler', this.recyclerDrawPerHour, true, null],
      ['Radiation shield', ENERGY_CONFIG.SHIELD_DRAIN_PER_HOUR, m.shieldOn, 'shield'],
      ['Fuel factory', factoryRunning ? ENERGY_CONFIG.ISRU_DRAIN_PER_HOUR : 0, m.factoryOn, 'factory'],
    ];
  }

  // Previsao da noite (issue #420): % de bateria por hora de jogo que a base gasta com tudo como
  // esta agora, SEM a luz da estufa e SEM o aquecedor (ele muda com o frio: `heaterRateAt`). O ar
  // da tripulacao (primeira linha de `loads`) sai primeiro do RTG (issue #85): so o que passar
  // dele pesa na bateria.
  steadyDrainPerHour(counts) {
    const rows = this.loads(counts);
    let total = 0;
    for (let i = 0; i < rows.length; i++) {
      const [, rate, on, id] = rows[i];
      if (!on || id === 'lights' || id === 'heater') continue;
      total += i === 0 ? Math.max(0, rate - ENERGY_CONFIG.RTG_LIFE_SUPPORT_PER_HOUR) : rate;
    }
    return total;
  }

  eatRation() {
    const s = this.survival;
    if (this.base.food < 1) return 'The pantry is empty! Grow food in the greenhouse.';
    if (s.food >= s.maxStat - 0.5) return 'You are not hungry.';
    this.base.food -= 1;
    this.eatenRationCrop = this.rationIngredients.shift() ?? null;
    s.food = Math.min(s.maxStat, s.food + U.RATION_FOOD);
    return `Ate a packaged ration. ${Math.floor(this.base.food)} left for the whole crew.`;
  }

  // Retira 1 racao da despensa para o inventario do jogador (entregue pelo cozinheiro)
  takeRation() {
    const s = this.survival;
    if (this.base.food < 1) {
      return {
        ok: false,
        reason: 'empty',
        message: 'The pantry is empty! Grow and harvest crops in the greenhouse first.',
      };
    }
    if (!s.addBlockToInventory?.(BLOCK_IDS.RATION)) {
      return {
        ok: false,
        reason: 'full',
        message: 'Your inventory is full! Make room before taking a ration.',
      };
    }
    this.base.food -= 1;
    const crop = this.rationIngredients.shift() ?? null;
    this.eatenRationCrop = crop;
    const remaining = Math.floor(this.base.food);
    return {
      ok: true,
      crop,
      remaining,
      message: `Got a Space Ration! (${remaining} left in the pantry)`,
    };
  }

  // Ato 3 (#409): a crianca entrega 1 planta colhida ao cozinheiro com [F], sem painel. Ele gasta
  // a planta e bateria (RATION_PREP_POWER) e a racao fica pronta em RATION_PREP_SECONDS
  // (`updatePlayerRation`). Uma racao por vez. Devolve { ok, reason, crop, message }.
  startPlayerRation() {
    const s = this.survival;
    if (this.playerRation) return { ok: false, reason: 'busy', message: 'Your ration is still cooking.' };
    const crop = PLAYER_CROPS.find((entry) => entry[0] === this.playerCrop());
    if (!crop) return { ok: false, reason: 'no-plant', message: 'You have no harvested plant to cook.' };
    if (!this.mission.battery.spend(U.RATION_PREP_POWER)) {
      return { ok: false, reason: 'power', message: 'Not enough power to cook a ration.' };
    }
    s.removeItems(crop[1], 1);
    this.playerRation = { crop: crop[0], timer: 0 };
    return { ok: true, crop: crop[0], message: `Cooking your ${crop[0]}: ready in ${U.RATION_PREP_SECONDS} seconds.` };
  }

  // Planta colhida que a crianca tem na mochila para entregar (nome da cultura) ou null
  playerCrop() {
    for (const crop of PLAYER_CROPS) if (this.survival.countItem(crop[1]) > 0) return crop[0];
    return null;
  }

  // Segundos que faltam para a racao da crianca ficar pronta (0 = nada cozinhando ou pronta)
  get playerRationSecondsLeft() {
    return this.playerRation ? Math.max(0, U.RATION_PREP_SECONDS - this.playerRation.timer) : 0;
  }

  // Anda o preparo da racao da crianca. Quando fica pronta, a racao vai para a mochila e a funcao
  // devolve a cultura usada (uma vez); com a mochila cheia ela espera pronta ate caber.
  updatePlayerRation(dt) {
    const cooking = this.playerRation;
    if (!cooking) return null;
    cooking.timer = Math.min(U.RATION_PREP_SECONDS, cooking.timer + dt);
    if (cooking.timer < U.RATION_PREP_SECONDS) return null;
    if (!this.survival.addBlockToInventory?.(BLOCK_IDS.RATION)) return null;
    this.playerRation = null;
    this.playerRationsMade++;
    this.eatenRationCrop = cooking.crop;
    return cooking.crop;
  }
}
