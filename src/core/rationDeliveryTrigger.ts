/** Choose the crop to show when entering with harvested food or prepared rations. */
export function rationDeliveryCropOnEntry(
  wasInside: boolean,
  isInside: boolean,
  baskets: Record<string, number>,
  rationCount = 0,
  lastRationCrop: string | null = null,
): string | null {
  if (wasInside || !isInside) return null;
  return Object.keys(baskets).find((crop) => baskets[crop] > 0)
    ?? (rationCount > 0 ? lastRationCrop ?? 'potato' : null);
}
