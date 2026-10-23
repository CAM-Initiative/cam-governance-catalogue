export type GlobePoint = { x: number; y: number; z: number };
export declare const GLOBE_DEGREES: number;
export declare function globePosition(lat: number, lon: number, radius: number): GlobePoint;
export declare function globeRotationForLongitude(lon: number): number;
