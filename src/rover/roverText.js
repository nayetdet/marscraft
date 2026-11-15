// Linha da bateria do rover no HUD. A bateria e um recurso de verdade (issue #111): o texto diz
// o que ela esta limitando agora, ou de onde vem a carga.
export function roverBatteryText({ battery, lowBattery = false, isCharging = false }) {
  if (isCharging) return `Battery: ${battery}% (charging from the base)`;
  if (lowBattery) return `Battery: ${battery}% (LOW: slow, cannot drill)`;
  return `Battery: ${battery}%`;
}
