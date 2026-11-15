/** Keep a prepared delivery pending until the player can see it in the kitchen. */
export function rationDeliveryCropWhileInside(
  isInside: boolean,
  pendingCrop: string | null,
): string | null {
  return isInside ? pendingCrop : null;
}
