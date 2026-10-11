/**
 * AR Placement Engine
 * Pure helpers used by ViewInYourSpaceAR: real-world plant sizing, device-orientation → camera
 * pose, compass bearings, Vastu zone detection inside a garden, spacing conflicts and
 * automatic free-spot search. No React, so it is easy to test and reuse.
 */
import * as THREE from 'three';
import { Plant } from '../types';
import { createProceduralPlantMesh } from './botanical3DModels';
import { isPlantVastuCompatible } from './vastuRules';

export const FT_TO_M = 0.3048;
export const M_TO_FT = 3.28084;

export const DIRECTIONS = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'] as const;
export const DIRECTION_DEG: Record<string, number> = {
  North: 0, 'North-East': 45, East: 90, 'South-East': 135, South: 180, 'South-West': 225, West: 270, 'North-West': 315,
};

export const normDeg = (d: number) => ((d % 360) + 360) % 360;
export const headingToDirection = (deg: number) => DIRECTIONS[Math.round(normDeg(deg) / 45) % 8];

/** Shortest signed angle a→b in degrees (-180..180). */
export const angleDelta = (a: number, b: number) => {
  const d = normDeg(b - a);
  return d > 180 ? d - 360 : d;
};

// ---------------------------------------------------------------------------
// Real-world plant dimensions (metres) parsed from the plant database text
// ---------------------------------------------------------------------------
export function estimatePlantHeightM(plant: Plant): number {
  const txt = (plant.height || '').toLowerCase();
  const m = txt.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(\d+(?:\.\d+)?)?\s*(cm|m)\b/);
  let h = 0.6;
  if (m) {
    const a = parseFloat(m[1]);
    const b = m[2] ? parseFloat(m[2]) : a;
    h = ((a + b) / 2) * (m[3] === 'cm' ? 0.01 : 1);
  } else if (/small/i.test(plant.spaceRequired)) h = 0.4;
  else if (/large/i.test(plant.spaceRequired)) h = 1.1;
  // Container-grown display height: keep potted trees/vines believable in a room.
  return THREE.MathUtils.clamp(h, 0.25, 1.4);
}

export function estimateFootprintFt(plant: Plant): number {
  const m = (plant.spaceRequired || '').match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*ft/i);
  if (m) return Math.max(parseFloat(m[1]), parseFloat(m[2]));
  return /small/i.test(plant.spaceRequired) ? 1 : /large/i.test(plant.spaceRequired) ? 2.5 : 1.5;
}

export function spacingFt(plant: Plant): number {
  return plant.spacingRequiredFt || plant.minSpacingFt || Math.max(1.2, estimateFootprintFt(plant));
}

// ---------------------------------------------------------------------------
// Model cache: one procedural mesh per plant, cloned for each placement
// (clones share geometry + materials → cheap to add many plants, no rebuilds).
// ---------------------------------------------------------------------------
export class PlantModelCache {
  private protos = new Map<string, THREE.Group>();

  get(plant: Plant): THREE.Group {
    let proto = this.protos.get(plant._id);
    if (!proto) {
      const raw = createProceduralPlantMesh(plant, { scale: 1, quality: 'hq', includePot: true });
      const box = new THREE.Box3().setFromObject(raw);
      const size = box.getSize(new THREE.Vector3());
      const factor = estimatePlantHeightM(plant) / Math.max(size.y, 0.001);
      raw.scale.setScalar(factor);
      raw.position.y = -box.min.y * factor; // sit exactly on the floor
      raw.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      proto = new THREE.Group();
      proto.add(raw);
      this.protos.set(plant._id, proto);
    }
    return proto.clone(true);
  }

  dispose() {
    const seen = new Set<unknown>();
    this.protos.forEach((g) =>
      g.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (!seen.has(mesh.geometry)) { seen.add(mesh.geometry); mesh.geometry.dispose(); }
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => { if (!seen.has(m)) { seen.add(m); m.dispose(); } });
      })
    );
    this.protos.clear();
  }
}

// ---------------------------------------------------------------------------
// Device orientation → camera quaternion (3-DoF rotation tracking in camera mode)
// ---------------------------------------------------------------------------
const _zee = new THREE.Vector3(0, 0, 1);
const _euler = new THREE.Euler();
const _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90° about X: camera looks out the back

export function orientationToQuaternion(
  target: THREE.Quaternion,
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number,
  screenAngleDeg: number
) {
  const d = THREE.MathUtils.DEG2RAD;
  _euler.set(betaDeg * d, alphaDeg * d, -gammaDeg * d, 'YXZ');
  target.setFromEuler(_euler);
  target.multiply(_q1);
  target.multiply(_q0.setFromAxisAngle(_zee, -screenAngleDeg * d));
  return target;
}

/** Compass bearing of the camera's viewing direction, in world space where -Z = `northOffsetDeg`. */
export function cameraBearing(camera: THREE.Camera, northOffsetDeg: number): number {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  // bearing measured clockwise from world -Z
  const yaw = Math.atan2(dir.x, -dir.z) * THREE.MathUtils.RAD2DEG;
  return normDeg(northOffsetDeg + yaw);
}

/** Compass bearing of a world point as seen from the garden centre. */
export function bearingFrom(center: THREE.Vector3, p: { x: number; z: number }, northOffsetDeg: number) {
  const yaw = Math.atan2(p.x - center.x, -(p.z - center.z)) * THREE.MathUtils.RAD2DEG;
  return normDeg(northOffsetDeg + yaw);
}

// ---------------------------------------------------------------------------
// Garden layout geometry
// ---------------------------------------------------------------------------
export interface PlacedItem {
  id: string;
  plant: Plant;
  x: number; // world metres
  y: number; // floor height (WebXR floors are not at 0)
  z: number;
  rotation: number; // degrees
  scale: number;
  placedVia: 'ar-webxr' | 'ar-camera' | '3d';
}

export interface GardenFrame {
  center: THREE.Vector3;
  widthM: number; // along world X
  lengthM: number; // along world Z
  northOffsetDeg: number; // compass bearing of world -Z
}

/** Which Vastu zone of the garden a point lies in ('Center' near the Brahmasthan). */
export function zoneOf(frame: GardenFrame, p: { x: number; z: number }): string {
  const dx = (p.x - frame.center.x) / (frame.widthM / 2 || 1);
  const dz = (p.z - frame.center.z) / (frame.lengthM / 2 || 1);
  if (Math.hypot(dx, dz) < 0.25) return 'Center';
  return headingToDirection(bearingFrom(frame.center, p, frame.northOffsetDeg));
}

export function isInsideGarden(frame: GardenFrame, p: { x: number; z: number }, marginM = 0) {
  return (
    Math.abs(p.x - frame.center.x) <= frame.widthM / 2 - marginM &&
    Math.abs(p.z - frame.center.z) <= frame.lengthM / 2 - marginM
  );
}

/** Convert world position → 0..100 % layout coordinates used by the 2D planner & DB. */
export function toLayoutPercent(frame: GardenFrame, p: { x: number; z: number }) {
  const px = ((p.x - frame.center.x) / frame.widthM + 0.5) * 100;
  const py = ((p.z - frame.center.z) / frame.lengthM + 0.5) * 100;
  return { x: Math.round(THREE.MathUtils.clamp(px, 0, 100) * 10) / 10, y: Math.round(THREE.MathUtils.clamp(py, 0, 100) * 10) / 10 };
}

export function requiredGapM(a: Plant, b: Plant, scaleA = 1, scaleB = 1) {
  return ((spacingFt(a) * scaleA + spacingFt(b) * scaleB) / 2) * FT_TO_M;
}

/** IDs of placed plants that are closer than their combined spacing requirement. */
export function findSpacingConflicts(items: PlacedItem[]): Set<string> {
  const bad = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (Math.hypot(a.x - b.x, a.z - b.z) < requiredGapM(a.plant, b.plant, a.scale, b.scale) * 0.98) {
        bad.add(a.id);
        bad.add(b.id);
      }
    }
  }
  return bad;
}

/** Nearest placed plant that would crowd a new plant at p (or null). */
export function crowdingAt(items: PlacedItem[], plant: Plant, p: { x: number; z: number }, ignoreId?: string) {
  let worst: { item: PlacedItem; dist: number; need: number } | null = null;
  for (const it of items) {
    if (it.id === ignoreId) continue;
    const dist = Math.hypot(it.x - p.x, it.z - p.z);
    const need = requiredGapM(plant, it.plant, 1, it.scale);
    if (dist < need && (!worst || dist - need < worst.dist - worst.need)) worst = { item: it, dist, need };
  }
  return worst;
}

/**
 * Smart spot finder: scans the garden on a grid and returns the best free spot for `plant`:
 *  1. must respect spacing to every placed plant and stay inside the garden,
 *  2. prefers the plant's auspicious Vastu zones,
 *  3. then prefers spots close to `near` (where the user is pointing).
 */
export function findBestSpot(
  frame: GardenFrame,
  items: PlacedItem[],
  plant: Plant,
  near: { x: number; z: number } | null,
  floorY = 0
): { x: number; y: number; z: number; zone: string; vastuMatch: boolean } | null {
  const step = 0.15;
  const margin = Math.min((spacingFt(plant) * FT_TO_M) / 2, Math.min(frame.widthM, frame.lengthM) / 4);
  let best: { x: number; z: number; score: number; zone: string; vastu: boolean } | null = null;

  for (let x = -frame.widthM / 2 + margin; x <= frame.widthM / 2 - margin + 1e-6; x += step) {
    for (let z = -frame.lengthM / 2 + margin; z <= frame.lengthM / 2 - margin + 1e-6; z += step) {
      const p = { x: frame.center.x + x, z: frame.center.z + z };
      if (crowdingAt(items, plant, p)) continue;
      const zone = zoneOf(frame, p);
      const vastu = zone !== 'Center' && isPlantVastuCompatible(plant, zone);
      const dist = near ? Math.hypot(p.x - near.x, p.z - near.z) : Math.hypot(x, z) * 0.2;
      // Vastu match dominates; the Brahmasthan (centre) is traditionally kept open.
      const score = (vastu ? 0 : 100) + (zone === 'Center' ? 50 : 0) + dist;
      if (!best || score < best.score) best = { x: p.x, z: p.z, score, zone, vastu };
    }
  }
  return best ? { x: best.x, y: floorY, z: best.z, zone: best.zone, vastuMatch: best.vastu } : null;
}

// ---------------------------------------------------------------------------
// Camera frame analysis: brightness + motion (used to decide when a spot is "locked")
// ---------------------------------------------------------------------------
export class FrameAnalyzer {
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  private prev: Float32Array | null = null;

  constructor(private size = 24) {
    this.canvas.width = size;
    this.canvas.height = size;
  }

  /** Returns mean luma (0–255) and motion (mean abs luma change since last sample). */
  sample(video: HTMLVideoElement | null): { luma: number; motion: number } | null {
    if (!this.ctx || !video || video.readyState < 2 || !video.videoWidth) return null;
    try {
      const n = this.size;
      this.ctx.drawImage(video, 0, 0, n, n);
      const d = this.ctx.getImageData(0, 0, n, n).data;
      const cur = new Float32Array(n * n);
      let sum = 0, motion = 0;
      for (let i = 0, k = 0; i < d.length; i += 4, k++) {
        const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        cur[k] = l;
        sum += l;
        if (this.prev) motion += Math.abs(l - this.prev[k]);
      }
      const hadPrev = !!this.prev;
      this.prev = cur;
      return { luma: Math.round(sum / cur.length), motion: hadPrev ? motion / cur.length : 99 };
    } catch {
      return null;
    }
  }
}
