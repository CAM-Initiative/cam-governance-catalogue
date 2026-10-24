// Stable two-sided SVG label layout for VIGIL's severity donut.
// The geometry is in viewBox units, independent of CSS/card size. By fixing
// minimum label spacing and constraining endpoints within the SVG, selecting a
// narrow S4/S5 segment can never push its caption over a neighbouring label.
export const CALLOUT_GEOMETRY = Object.freeze({
  centerX: 220, centerY: 152, minY: 36, maxY: 270, minGap: 48,
  labelLeftX: 100, labelRightX: 340,
});

export function layoutSeverityCallouts(entries, total) {
  if (!total) return [];
  const { centerY, minY, maxY, minGap } = CALLOUT_GEOMETRY;
  let elapsed = 0;
  const labels = [];
  for (const item of entries) {
    const count = Number(item.count) || 0;
    if (count <= 0) continue;
    const midpoint = elapsed + count / 2;
    elapsed += count;
    const midAngle = -Math.PI / 2 + midpoint / total * 2 * Math.PI;
    const side = Math.cos(midAngle) < 0 ? "left" : "right";
    labels.push({
      ...item, midAngle, side,
      idealY: centerY + Math.sin(midAngle) * 100,
      y: 0,
    });
  }
  for (const side of ["left", "right"]) {
    const group = labels.filter(item => item.side === side)
      .sort((a, b) => a.idealY - b.idealY);
    if (!group.length) continue;
    const gap = Math.min(minGap, (maxY - minY) / Math.max(1, group.length - 1));
    for (let index = 0; index < group.length; index++) {
      const item = group[index];
      item.y = Math.max(
        minY + index * gap,
        Math.min(maxY, item.idealY),
        index ? group[index - 1].y + gap : minY,
      );
    }
    const overflow = group[group.length - 1].y - maxY;
    if (overflow > 0) for (const item of group) item.y -= overflow;
    if (group[0].y < minY) {
      const underflow = minY - group[0].y;
      for (const item of group) item.y += underflow;
    }
  }
  return labels;
}
