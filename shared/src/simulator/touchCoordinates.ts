/**
 * Calculates unrotated display touch coordinates (touchX, touchY)
 * from rotated canvas pixel coordinates (canvasX, canvasY).
 */
export function calculateDisplayTouchCoordinates(
  canvasX: number,
  canvasY: number,
  displayWidth: number,
  displayHeight: number,
  rotation: number
): { touchX: number; touchY: number } {
  const effectiveRotation = (rotation % 360 + 360) % 360;
  let tX = canvasX;
  let tY = canvasY;

  if (effectiveRotation === 90) {
    tX = canvasY;
    tY = displayHeight - canvasX;
  } else if (effectiveRotation === 180) {
    tX = displayWidth - canvasX;
    tY = displayHeight - canvasY;
  } else if (effectiveRotation === 270) {
    tX = displayWidth - canvasY;
    tY = canvasX;
  }

  return {
    touchX: Math.round(tX),
    touchY: Math.round(tY)
  };
}
