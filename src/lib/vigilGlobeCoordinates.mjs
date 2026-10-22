/**
 * Longitude/latitude alignment for an equirectangular Earth texture mapped on
 * THREE.SphereGeometry's default UVs.
 *
 * SphereGeometry places image u=0.5 (Greenwich) at local +X, not -Z.
 * An offset of 90 degrees rendered country markers over the wrong continents.
 * East-positive longitude is standard and latitude is clamped for numerical
 * robustness; these positions identify countries, not individual incidents.
 */
export const GLOBE_DEGREES = Math.PI / 180;

export function globePosition(lat, lon, radius) {
  const latitude = lat * GLOBE_DEGREES;
  const longitude = lon * GLOBE_DEGREES;
  const parallel = radius * Math.cos(latitude);
  return {
    x: parallel * Math.cos(longitude),
    y: radius * Math.sin(latitude),
    z: -parallel * Math.sin(longitude),
  };
}

/** Spin local country position to face Three's +Z camera. */
export function globeRotationForLongitude(lon) {
  return -Math.PI / 2 - lon * GLOBE_DEGREES;
}
