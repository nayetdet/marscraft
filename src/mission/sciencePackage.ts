// @ts-nocheck
import { SCIENCE_CONFIG } from '../config/constants.ts';

// Pacote de ciencia enviado para a Terra (issue #105). Logica pura, sem DOM: o MissionSystem
// guarda o que ja foi enviado e o GameEngine conta o que o jogador fez nesta partida
// (descobertas do scanner nesta missao + amostras de regolito analisadas).
//
// Envio: custo base (ligar o radio e falar com o orbitador) + um tanto por item. Cada envio leva
// no maximo MAX_ITEMS_PER_UPLOAD itens (uma passagem do orbitador carrega pouco dado). Pode enviar
// em partes, mas cada parte paga o custo base de novo. Todos os numeros sao escala de jogo.

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const discoveryWord = (n) => `${n} ${n === 1 ? 'discovery' : 'discoveries'}`;

// "3 discoveries, 1 sample": contagem para o painel e a tela de vitoria
export function scienceCountText(discoveries, samples) {
  return `${discoveryWord(discoveries)}, ${plural(samples, 'sample')}`;
}

// O pacote enviado ja conta para a vitoria?
export function scienceMinimumMet(sentDiscoveries = 0, sentSamples = 0, config = SCIENCE_CONFIG) {
  return sentDiscoveries >= config.MIN_DISCOVERIES || sentSamples >= config.MIN_SAMPLES;
}

// O que o proximo envio leva e quanto custa. Amostras vao primeiro: sao a ciencia mais rara.
export function sciencePackage({ discoveries = 0, samples = 0, sentDiscoveries = 0, sentSamples = 0 } = {}, config = SCIENCE_CONFIG) {
  const pendingDiscoveries = Math.max(0, discoveries - sentDiscoveries);
  const pendingSamples = Math.max(0, samples - sentSamples);
  const uploadSamples = Math.min(pendingSamples, config.MAX_ITEMS_PER_UPLOAD);
  const uploadDiscoveries = Math.min(pendingDiscoveries, config.MAX_ITEMS_PER_UPLOAD - uploadSamples);
  const items = uploadSamples + uploadDiscoveries;
  return {
    pendingDiscoveries,
    pendingSamples,
    uploadDiscoveries,
    uploadSamples,
    items,
    cost: items > 0 ? config.UPLOAD_BASE_COST + items * config.UPLOAD_COST_PER_ITEM : 0,
    leftAfter: pendingDiscoveries + pendingSamples - items,
    metNow: scienceMinimumMet(sentDiscoveries, sentSamples, config),
    metAfter: scienceMinimumMet(sentDiscoveries + uploadDiscoveries, sentSamples + uploadSamples, config),
  };
}

// Proximo passo da ciencia para o objetivo e a seta: null (minimo ja enviado) | 'send' (o pacote
// na mao ja basta) | 'analyze' (tem regolito coletado esperando a analise) | 'scan'.
// `rawSamples` = amostras coletadas la fora e ainda nao analisadas.
export function scienceStep({ discoveries = 0, samples = 0, sentDiscoveries = 0, sentSamples = 0, rawSamples = 0 } = {}, config = SCIENCE_CONFIG) {
  if (scienceMinimumMet(sentDiscoveries, sentSamples, config)) return null;
  if (scienceMinimumMet(discoveries, samples, config)) return 'send';
  if (rawSamples > 0) return 'analyze';
  return 'scan';
}

// Descobertas que ainda faltam escanear para fechar o minimo pelo scanner
export function scansStillNeeded({ discoveries = 0 } = {}, config = SCIENCE_CONFIG) {
  return Math.max(0, config.MIN_DISCOVERIES - discoveries);
}

// Texto curto do que falta para o pacote valer (painel de ciencia e painel do MAV)
export function scienceMissingText(state, config = SCIENCE_CONFIG) {
  const { discoveries = 0, samples = 0, sentDiscoveries = 0, sentSamples = 0 } = state;
  if (scienceMinimumMet(sentDiscoveries, sentSamples, config)) return 'Enough science is home. Extra uploads still count for your report.';
  const goal = `Earth needs ${discoveryWord(config.MIN_DISCOVERIES)} OR ${plural(config.MIN_SAMPLES, 'analyzed sample')}.`;
  if (scienceMinimumMet(discoveries, samples, config)) return `${goal} You have enough: send the package.`;
  const scans = Math.max(0, config.MIN_DISCOVERIES - discoveries);
  const rocks = Math.max(0, config.MIN_SAMPLES - samples);
  return `${goal} Still missing: scan ${scans} more thing${scans === 1 ? '' : 's'} with the scope, or analyze ${rocks} more regolith sample${rocks === 1 ? '' : 's'}.`;
}

// Frase do botao de envio: o custo muda com o tamanho do pacote
export function uploadButtonLabel(pkg) {
  if (pkg.items === 0) return 'Send science to Earth (nothing new to send)';
  return `Send ${pkg.items} item${pkg.items === 1 ? '' : 's'} to Earth (${pkg.cost}% power)`;
}

// Resposta de MissionSystem.sendData() em texto para a crianca
export function uploadResultText(result, config = SCIENCE_CONFIG) {
  if (result.status === 'empty') return 'Nothing new to send. Scan things with the scope or analyze regolith samples first.';
  if (result.status === 'no-energy') return `Not enough power: this upload needs ${result.cost}% of the battery. Wait for the Sun, or send a smaller package.`;
  const what = [
    result.discoveries ? discoveryWord(result.discoveries) : '',
    result.samples ? plural(result.samples, 'sample') : '',
  ].filter(Boolean).join(' and ');
  const later = result.leftAfter > 0 ? ` ${result.leftAfter} more item${result.leftAfter === 1 ? '' : 's'} wait for the next orbiter pass.` : '';
  const goal = result.dataSent
    ? ' Earth has enough of your science!'
    : ` Earth still needs ${discoveryWord(config.MIN_DISCOVERIES)} or ${plural(config.MIN_SAMPLES, 'sample')} in total.`;
  return `Sent ${what} to a Mars orbiter, which passes it on to Earth (-${result.cost}% power).${later}${goal}`;
}
