// @ts-nocheck
// Normaliza respostas do NASA DONKI para o formato que o jogo usa. Puro (sem rede nem DOM):
// serve ao script de coleta (scripts/fetch-donki-cme.ts) e ao fetch ao vivo (spaceWeather.ts),
// para o JSON embutido e o dado ao vivo terem sempre o mesmo formato (issues #99 e #100).

// Impacto previsto em Marte para uma CME: a rodada mais recente do WSA-ENLIL que lista Marte,
// de preferência na análise marcada como a mais precisa. Devolve null se a CME não ia para Marte.
export function marsImpact(item) {
  const analyses = item.cmeAnalyses ?? [];
  const ordered = [...analyses].sort((a, b) => Number(Boolean(b.isMostAccurate)) - Number(Boolean(a.isMostAccurate)));
  for (const analysis of ordered) {
    const runs = [...(analysis.enlilList ?? [])].sort((a, b) =>
      String(b.modelCompletionTime ?? '').localeCompare(String(a.modelCompletionTime ?? '')));
    for (const run of runs) {
      const impact = (run.impactList ?? []).find((i) => i.location === 'Mars' && i.arrivalTime);
      if (impact) return { analysis, impact };
    }
  }
  return null;
}

// Resumo que o jogo usa: só CMEs com chegada prevista em Marte depois da saída do Sol
export function summarizeCme(item) {
  const hit = marsImpact(item);
  if (!hit?.analysis.speed) return null;
  if (Date.parse(hit.impact.arrivalTime) <= Date.parse(item.startTime)) return null;
  return {
    id: item.activityID,
    startTime: item.startTime,
    speedKmS: hit.analysis.speed,
    type: hit.analysis.type,
    headedToMars: true,
    marsArrivalTime: hit.impact.arrivalTime,
    isGlancingBlow: Boolean(hit.impact.isGlancingBlow),
    link: item.link,
  };
}

// Lista de CMEs cruas -> só as que vão para Marte, sem repetidas, em ordem cronológica
export function summarizeCmes(items) {
  const unique = [...new Map(items.map((item) => [item.activityID, item])).values()];
  return unique
    .map(summarizeCme)
    .filter(Boolean)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// "STEREO A: IMPACT 13-100 MeV" -> "STEREO A" (a nave que mediu, sem o nome técnico do sensor)
function spacecraftName(displayName) {
  return String(displayName ?? '').split(':')[0].trim();
}

// SEP (partículas solares energéticas): o evento que de fato traz radiação para astronautas.
// O DONKI não dá a força da SEP em Marte, só quando e onde ela foi medida.
export function summarizeSep(item) {
  if (!item?.sepID || !item.eventTime || Number.isNaN(Date.parse(item.eventTime))) return null;
  const seenBy = [...new Set((item.instruments ?? []).map((i) => spacecraftName(i.displayName)).filter(Boolean))];
  return {
    id: item.sepID,
    eventTime: item.eventTime,
    seenBy,
    link: item.link,
  };
}

export function summarizeSeps(items) {
  return items
    .map(summarizeSep)
    .filter(Boolean)
    .sort((a, b) => a.eventTime.localeCompare(b.eventTime));
}

// Boletim do Controle da Missão: só o tipo, a data e o link. O `messageBody` é longo e técnico.
export function latestBulletin(items) {
  let latest = null;
  for (const item of items) {
    if (!item?.messageType || !item.messageIssueTime || !item.messageURL) continue;
    if (Number.isNaN(Date.parse(item.messageIssueTime))) continue;
    if (!latest || item.messageIssueTime > latest.issueTime) {
      latest = { type: item.messageType, issueTime: item.messageIssueTime, url: item.messageURL };
    }
  }
  return latest;
}
