// Presentation geometry only: dashboard severity totals and filters are unchanged.
export function donutSegmentAppearance(start, count, total, isSelected, hasSelection) {
  const midpointAngle = total > 0
    ? -Math.PI / 2 + ((start + count / 2) / total) * 2 * Math.PI
    : -Math.PI / 2;
  const separation = isSelected ? 10 : 0;
  return {
    offsetX: Number((Math.cos(midpointAngle) * separation).toFixed(2)),
    offsetY: Number((Math.sin(midpointAngle) * separation).toFixed(2)),
    radius: isSelected ? 78 : 75,
    strokeWidth: isSelected ? 35 : 25,
    opacity: hasSelection && !isSelected ? 0.58 : 1,
  };
}
