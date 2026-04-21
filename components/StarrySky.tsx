'use client';

import type { CSSProperties } from 'react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  CONSTELLATION_COLORS,
  ZODIACS,
  type FeaturedConstellation,
  type Placement,
  type PlacementZone,
} from './starry-sky/config';
import {
  buildConstellations,
  createStableClientSnapshot,
  getNullServerSnapshot,
  randomInt,
  subscribeStaticStore,
} from './starry-sky/random';
import { getVietnameseHourAnimal } from './starry-sky/vietnamese-hours';

interface ConstellationProps {
  className?: string;
  item: FeaturedConstellation;
  slot: number;
}

const DESKTOP_CONSTELLATION_ZONES = [
  { left: [4, 16], top: [13, 31], colorIdx: 1 },
  { left: [66, 78], top: [12, 30], colorIdx: 0 },
  { left: [3, 17], top: [55, 70], colorIdx: 2 },
  { left: [68, 80], top: [55, 70], colorIdx: 1 },
  { left: [18, 30], top: [10, 24], colorIdx: 0 },
] satisfies PlacementZone[];

const MOBILE_CONSTELLATION_BASE = {
  left: 0,
  top: 0,
  colorIdx: 1,
} satisfies Placement;

const getMobileConstellationSnapshot = createStableClientSnapshot<FeaturedConstellation>(() => ({
  ...MOBILE_CONSTELLATION_BASE,
  zodiacIdx: randomInt(ZODIACS.length),
}));

const getDesktopConstellationsSnapshot = createStableClientSnapshot<FeaturedConstellation[]>(() => (
  buildConstellations(DESKTOP_CONSTELLATION_ZONES, 3)
));

function useClientSnapshot<T>(getSnapshot: () => T) {
  return useSyncExternalStore(subscribeStaticStore, getSnapshot, getNullServerSnapshot);
}

function VietnameseHourBadge() {
  const [hourAnimal, setHourAnimal] = useState(getVietnameseHourAnimal);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHourAnimal(getVietnameseHourAnimal());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="starry__hour-animal"
      title={`Giờ ${hourAnimal.branch}`}
      suppressHydrationWarning
    >
      {hourAnimal.icon}
    </div>
  );
}

function MobileConstellation() {
  const constellation = useClientSnapshot(getMobileConstellationSnapshot);

  if (!constellation) return null;

  return (
    <Constellation
      className="starry__zodiac--mobile"
      item={constellation}
      slot={0}
    />
  );
}

function DesktopConstellations() {
  const constellations = useClientSnapshot(getDesktopConstellationsSnapshot);

  if (!constellations) return null;

  return constellations.map((item, slot) => (
    <Constellation
      key={`${slot}-${item.zodiacIdx}`}
      className="starry__zodiac--desktop"
      item={item}
      slot={slot}
    />
  ));
}

function Constellation({ className = '', item, slot }: ConstellationProps) {
  const zodiac = ZODIACS[item.zodiacIdx];
  const color = CONSTELLATION_COLORS[item.colorIdx];
  const driftVariant = ['a', 'b', 'c'][slot] ?? 'a';

  return (
    <div
      className={`starry__zodiac starry__zodiac--slot${slot} starry__drift-${driftVariant} ${className}`.trim()}
      style={{
        '--zd-left': `${item.left}%`,
        '--zd-top': `${item.top}%`,
      } as CSSProperties}
    >
      <svg viewBox="0 0 100 100" fill="none">
        <defs>
          <filter id={`glow-${slot}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {zodiac.lines.map(([a, b], index) => (
          <line
            key={`line-${index}`}
            x1={zodiac.stars[a].x}
            y1={zodiac.stars[a].y}
            x2={zodiac.stars[b].x}
            y2={zodiac.stars[b].y}
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            opacity={0.5}
          />
        ))}

        {zodiac.stars.map((star, index) => (
          <g key={`${zodiac.name}-star-${index}`} filter={`url(#glow-${slot})`}>
            <circle cx={star.x} cy={star.y} r={star.mag * 7} fill={color} opacity={0.1} />
            <circle cx={star.x} cy={star.y} r={star.mag * 3.5} fill={color} opacity={0.2} />
            <circle
              cx={star.x}
              cy={star.y}
              r={star.mag * 1.8}
              fill="white"
              opacity={star.mag * 0.95}
              className="starry__zodiac-star"
              style={{ animationDelay: `${index * 0.4}s` }}
            />
          </g>
        ))}

        <text x="50" y="96" className="starry__zodiac-symbol" fill={color}>
          {zodiac.symbol}
        </text>
      </svg>
    </div>
  );
}

export function StarrySky() {
  return (
    <div className="starry" aria-hidden="true">
      <div className="starry__bg" />
      <div className="starry__fade" />
      <VietnameseHourBadge />
      <MobileConstellation />
      <DesktopConstellations />
    </div>
  );
}
