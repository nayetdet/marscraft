// @ts-nocheck
import { MISSION_LOG_CONFIG as C } from '../config/constants.ts';
import { formatDose } from '../mission/missionText.ts';
import { solOf } from './missionLog.ts';

// Liga os sistemas do jogo ao diario de bordo (issue #106). Sem DOM: le campos simples dos
// sistemas (aquecedor, parede do abrigo, contadores da estufa e da academia...) e grava uma linha
// so quando algo muda. Chamado a cada frame, entao `observe` nao aloca nada se nada mudou.
//
// Fontes (`sources`): utility (UtilityModule), mission (MissionSystem), survival (agua da base),
// stations (StationSystem) e comms (CommsLink). Eventos que ja existem chegam por
// onMissionEvent (MissionSystem.drainEvents), onAirlockEvent e onCrewEvent.
export class MissionLogFeed {
  constructor({ log, reveals, sources }) {
    this.log = log;
    this.reveals = reveals;
    this.src = sources;
    this.cards = []; // cards para a tela: resumo do sol e estudo revelado (drainCards)
    this._started = false;
  }

  // Primeira leitura: guarda o estado sem gerar linhas
  _start(hours) {
    const { utility, mission, survival, stations, comms } = this.src;
    this._started = true;
    this._heaterOn = utility.heaterOn;
    this._lightsOn = utility.greenhouseLightsOn;
    this._cold = utility.cold;
    this._factoryOn = mission.factoryOn;
    this._shieldOn = mission.shieldOn;
    this._shelterL = mission.shelterWaterL;
    this._blackout = comms?.blackout ?? false;
    this._workouts = stations.workoutCount;
    this._treatments = stations.treatmentCount ?? 0;
    this._harvests = stations.harvestCount;
    this._crops = stations.plots.map((p) => p.crop?.type ?? null);
    this._water = survival.baseWater;
    this._stormDoseStart = null;
    this._startSol(solOf(hours));
  }

  _startSol(sol) {
    const { mission } = this.src;
    this._sol = sol;
    this._solarStart = mission.solarEnergyCollected;
    this._chargeStart = mission.battery.charge;
    this._doseStart = mission.totalDoseMsv;
    this._waterIn = 0;
    this._waterOut = 0;
  }

  observe(hours) {
    if (!this._started) {
      this._start(hours);
      return;
    }
    const { utility, mission, survival, stations, comms } = this.src;
    const log = this.log;
    log.lastHours = Math.max(log.lastHours, hours);

    // Agua do tanque da base: o que entrou e o que saiu neste sol
    const water = survival.baseWater;
    if (water > this._water) this._waterIn += water - this._water;
    else this._waterOut += this._water - water;
    this._water = water;

    if (utility.heaterOn !== this._heaterOn) {
      this._heaterOn = utility.heaterOn;
      if (utility.heaterOn) {
        log.closeDecision('heater');
        log.decision('You turned the heater back on. It uses power, more at night.', { hours, key: 'heater-on' });
      } else {
        log.decision('You turned the heater off to save power.', { hours, key: 'heater', weight: 3 });
      }
    }

    if (utility.cold !== this._cold) {
      this._cold = utility.cold;
      if (utility.cold) {
        if (!utility.heaterOn) log.consequence('The pipes froze: the water recycler and the greenhouse stopped.', { hours, causeKey: 'heater', weight: 3 });
        else log.add({ text: 'The battery ran out at night: the heater stopped and the pipes froze.', kind: 'event', hours, weight: 3 });
      } else if (utility.heaterOn && log.hasOpenDecision('heater-on')) {
        log.consequence('The pipes are warm again: water and plants work again.', { hours, causeKey: 'heater-on' });
        log.closeDecision('heater-on');
      } else {
        log.add({ text: utility.heaterOn
          ? 'The pipes are warm again: water and plants work again.'
          : 'The Sun came up and the pipes thawed: water and plants work again.', kind: 'event', hours });
      }
    }

    if (utility.greenhouseLightsOn !== this._lightsOn) {
      this._lightsOn = utility.greenhouseLightsOn;
      log.decision(utility.greenhouseLightsOn
        ? 'You turned the greenhouse lights on: the plants grow again.'
        : 'You turned the greenhouse lights off: more power, but the plants stop growing.', { hours, key: 'lights', weight: 2 });
    }

    if (mission.factoryOn !== this._factoryOn) {
      this._factoryOn = mission.factoryOn;
      log.decision(mission.factoryOn
        ? 'You turned the fuel factory on: it makes rocket fuel but uses a lot of power.'
        : 'You turned the fuel factory off to save power.', { hours, key: 'factory', weight: 2 });
    }

    if (mission.shieldOn !== this._shieldOn) {
      this._shieldOn = mission.shieldOn;
      log.decision(mission.shieldOn ? 'You turned the radiation shield on. It uses a lot of power.' : 'You turned the radiation shield off.', { hours, key: 'shield', weight: 2 });
    }

    if (mission.shelterWaterL !== this._shelterL) {
      const filling = mission.shelterWaterL > this._shelterL;
      this._shelterL = mission.shelterWaterL;
      const liters = Math.round(mission.shelterWaterL);
      log.decision(filling
        ? `You put water in the shelter wall: now ${liters} L. Less water to drink, more protection.`
        : `You took water out of the shelter wall: now ${liters} L. More water to drink, less protection.`,
      { hours, key: 'shelter', weight: 2, mergeHours: C.MERGE_HOURS });
    }

    if (comms && comms.blackout !== this._blackout) {
      this._blackout = comms.blackout;
      log.add({ text: comms.blackout
        ? 'Solar conjunction: the Sun is between Mars and Earth, so the radio went silent.'
        : 'The Sun moved away: radio contact with Earth is back.', kind: 'event', hours });
    }

    this._observeCrops(hours);

    if (stations.workoutCount !== this._workouts) {
      this._workouts = stations.workoutCount;
      const bike = stations.lastWorkoutMode === 'bike';
      log.add({ text: `You finished a workout on the ${bike ? 'exercise bike' : 'treadmill'}. It cost power, but kept your ${bike ? 'muscles' : 'bones'} strong.`, kind: 'event', hours });
      this._reveal(bike ? 'workout:bike' : 'workout:treadmill', hours);
    }

    const treatments = stations.treatmentCount ?? 0;
    if (treatments !== this._treatments) {
      this._treatments = treatments;
      log.add({ text: 'You got treated in the medbay. It costs power, and radiation dose cannot be erased.', kind: 'event', hours });
      this._reveal('treatment', hours);
    }

    const sol = solOf(hours);
    if (sol !== this._sol) this._endSol(sol);
  }

  // Plantar (decisao) e colher (consequencia ligada ao plantio)
  _observeCrops(hours) {
    const { stations } = this.src;
    const plots = stations.plots;
    for (let i = 0; i < plots.length; i++) {
      const type = plots[i].crop?.type ?? null;
      if (type === this._crops[i]) continue;
      if (type) this.log.decision(`You planted ${type}. It drinks water from the tank while it grows.`, { hours, key: 'plant' });
      this._crops[i] = type;
    }
    if (stations.harvestCount !== this._harvests) {
      this._harvests = stations.harvestCount;
      this.log.consequence('Harvest! The cook can turn each plant into a ration for the crew.', { hours, causeKey: 'plant', weight: 1 });
    }
  }

  _endSol(newSol) {
    const { mission } = this.src;
    const energyIn = mission.solarEnergyCollected - this._solarStart;
    const energyOut = energyIn - (mission.battery.charge - this._chargeStart);
    const entry = this.log.endSol(this._sol, {
      energyIn,
      energyOut,
      waterIn: this._waterIn,
      waterOut: this._waterOut,
      doseMsv: mission.totalDoseMsv - this._doseStart,
    });
    this.cards.push({ type: 'summary', entry });
    this._startSol(newSol);
  }

  _reveal(trigger, hours) {
    const study = this.reveals?.reveal(trigger);
    if (!study) return null;
    this.log.add({ text: `New real NASA study in your journal: ${study.id}. ${study.explanation}`, kind: 'study', hours, link: study.url });
    this.cards.push({ type: 'study', study });
    return study;
  }

  // Eventos do MissionSystem (tempestades, escudo sem energia, tanque do foguete cheio)
  onMissionEvent(event, hours) {
    const log = this.log;
    const { mission } = this.src;
    if (event.type === 'storm-warning') {
      log.add({ text: 'Warning: a real solar storm is on its way to Mars. Get the shelter ready!', kind: 'event', hours });
    } else if (event.type === 'storm-start') {
      this._stormDoseStart = mission.totalDoseMsv;
      log.add({ text: 'The solar storm arrived: radiation is high outside.', kind: 'event', hours, weight: 2 });
    } else if (event.type === 'storm-survived') {
      const dose = this._stormDoseStart === null ? null : mission.totalDoseMsv - this._stormDoseStart;
      const doseText = dose === null ? '' : ` It gave you ${formatDose(dose)}.`;
      if (log.hasOpenDecision('shelter') && mission.shelterWaterL > 0) {
        log.consequence(`You made it through the storm with ${Math.round(mission.shelterWaterL)} L in the shelter wall.${doseText}`, { hours, causeKey: 'shelter', weight: 3 });
      } else {
        log.add({ text: `You made it through the solar storm.${doseText}`, kind: 'event', hours, weight: 2 });
      }
      this._stormDoseStart = null;
      this._reveal('storm-survived', hours);
    } else if (event.type === 'storm-failed') {
      log.add({ text: 'The solar storm was too strong this time.', kind: 'event', hours, weight: 2 });
      this._stormDoseStart = null;
    } else if (event.type === 'storm-missed') {
      this._stormDoseStart = null;
    } else if (event.type === 'shield-off-no-energy') {
      this._shieldOn = false; // nao foi decisao do jogador
      log.consequence('The battery ran out, so the radiation shield turned off.', { hours, causeKey: 'shield', weight: 2 });
    } else if (event.type === 'propellant-full') {
      log.consequence('The rocket fuel tank is full!', { hours, causeKey: 'factory', weight: 2 });
    }
  }

  onAirlockEvent(type, hours) {
    if (type === 'clean-skipped') {
      this.log.add({ text: 'No power to clean your suit: Mars dust came inside with you.', kind: 'event', hours, weight: 2 });
    }
  }

  // Eventos do CrewManager (fraco, de cama, recuperado). Quem drena a fila chama aqui.
  onCrewEvent(event, hours) {
    const name = event.member?.name ?? 'A crew member';
    if (event.type === 'weak') this.log.add({ text: `${name} is weak: missing ${(event.lacking ?? []).join(' and ') || 'supplies'}.`, kind: 'event', hours, weight: 2 });
    else if (event.type === 'bedridden') this.log.add({ text: `${name} had to rest in the medbay.`, kind: 'event', hours, weight: 3 });
    else if (event.type === 'recovered') this.log.add({ text: `${name} feels better and is back to work.`, kind: 'event', hours });
  }

  drainCards() {
    if (!this.cards.length) return this.cards;
    const cards = this.cards;
    this.cards = [];
    return cards;
  }
}
