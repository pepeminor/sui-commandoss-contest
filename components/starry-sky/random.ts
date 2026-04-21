import type { FeaturedConstellation, Placement, PlacementZone } from './config';
import { ZODIACS } from './config';

export function createStableClientSnapshot<T>(createValue: () => T) {
  let snapshot: T | null = null;
  return () => {
    snapshot ??= createValue();
    return snapshot;
  };
}

export function subscribeStaticStore() {
  return () => {};
}

export function getNullServerSnapshot() {
  return null;
}

export function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function randomBetween([min, max]: [number, number]) {
  return min + Math.random() * (max - min);
}

function shuffled<T>(items: readonly T[]) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function pickUniqueZodiacIndices(count: number) {
  return shuffled(Array.from({ length: ZODIACS.length }, (_, index) => index)).slice(0, count);
}

function placementFromZone(zone: PlacementZone): Placement {
  return {
    left: randomBetween(zone.left),
    top: randomBetween(zone.top),
    colorIdx: zone.colorIdx,
  };
}

export function buildConstellations(zones: readonly PlacementZone[], count: number): FeaturedConstellation[] {
  const selectedZones = shuffled(zones).slice(0, count);

  return pickUniqueZodiacIndices(count).map((zodiacIdx, slotIndex) => ({
    zodiacIdx,
    ...placementFromZone(selectedZones[slotIndex]),
  }));
}
