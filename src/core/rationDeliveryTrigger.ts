/** Choose a crop for the kitchen scene once harvested food is available during this visit. */
export function rationDeliveryCropWhileInside(
  isInside: boolean,
  waitingForCrop: boolean,
  baskets: Record<string, number>,
): string | null {
  if (!isInside || !waitingForCrop) return null;
  return Object.keys(baskets).find((crop) => baskets[crop] > 0) ?? null;
}
