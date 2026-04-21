export const CONSTELLATION_COLORS = [
  '#4DA2FF',
  '#D4A84B',
  '#5DCAA5',
] as const;

export interface Zodiac {
  name: string;
  symbol: string;
  stars: { x: number; y: number; mag: number }[];
  lines: [number, number][];
}

export interface FeaturedConstellation {
  zodiacIdx: number;
  left: number;
  top: number;
  colorIdx: number;
}

export type Placement = Omit<FeaturedConstellation, 'zodiacIdx'>;

export interface PlacementZone {
  colorIdx: number;
  left: [number, number];
  top: [number, number];
}

export const ZODIACS: Zodiac[] = [
  {
    name: 'Aries', symbol: '♈',
    stars: [
      { x: 18, y: 62, mag: 0.55 }, { x: 34, y: 54, mag: 0.8 },
      { x: 55, y: 43, mag: 1.0 }, { x: 76, y: 37, mag: 0.65 },
    ],
    lines: [[0, 1], [1, 2], [2, 3]],
  },
  {
    name: 'Taurus', symbol: '♉',
    stars: [
      { x: 48, y: 50, mag: 1.0 }, { x: 38, y: 42, mag: 0.7 },
      { x: 32, y: 31, mag: 0.65 }, { x: 24, y: 16, mag: 0.7 },
      { x: 58, y: 42, mag: 0.7 }, { x: 72, y: 26, mag: 0.65 },
      { x: 84, y: 13, mag: 0.85 }, { x: 36, y: 62, mag: 0.55 },
      { x: 61, y: 63, mag: 0.6 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [1, 7], [0, 8], [7, 8]],
  },
  {
    name: 'Gemini', symbol: '♊',
    stars: [
      { x: 35, y: 12, mag: 1.0 }, { x: 61, y: 15, mag: 1.0 },
      { x: 32, y: 31, mag: 0.65 }, { x: 59, y: 34, mag: 0.7 },
      { x: 29, y: 51, mag: 0.58 }, { x: 56, y: 54, mag: 0.6 },
      { x: 23, y: 72, mag: 0.75 }, { x: 54, y: 78, mag: 0.75 },
      { x: 44, y: 35, mag: 0.5 }, { x: 42, y: 58, mag: 0.5 },
    ],
    lines: [[0, 2], [2, 4], [4, 6], [1, 3], [3, 5], [5, 7], [2, 8], [8, 3], [4, 9], [9, 5]],
  },
  {
    name: 'Cancer', symbol: '♋',
    stars: [
      { x: 25, y: 25, mag: 0.7 }, { x: 43, y: 43, mag: 0.55 },
      { x: 57, y: 39, mag: 0.55 }, { x: 76, y: 25, mag: 0.7 },
      { x: 39, y: 67, mag: 0.75 }, { x: 63, y: 70, mag: 0.65 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [1, 4], [2, 5]],
  },
  {
    name: 'Leo', symbol: '♌',
    stars: [
      { x: 32, y: 73, mag: 1.0 }, { x: 43, y: 55, mag: 0.7 },
      { x: 37, y: 40, mag: 0.65 }, { x: 24, y: 36, mag: 0.65 },
      { x: 19, y: 22, mag: 0.7 }, { x: 33, y: 16, mag: 0.65 },
      { x: 54, y: 52, mag: 0.6 }, { x: 68, y: 62, mag: 0.75 },
      { x: 84, y: 52, mag: 0.85 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 8], [8, 6], [6, 7]],
  },
  {
    name: 'Virgo', symbol: '♍',
    stars: [
      { x: 23, y: 30, mag: 0.65 }, { x: 39, y: 36, mag: 0.6 },
      { x: 53, y: 48, mag: 0.7 }, { x: 66, y: 42, mag: 0.65 },
      { x: 77, y: 29, mag: 0.75 }, { x: 56, y: 66, mag: 1.0 },
      { x: 38, y: 72, mag: 0.6 }, { x: 72, y: 62, mag: 0.55 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [5, 7]],
  },
  {
    name: 'Libra', symbol: '♎',
    stars: [
      { x: 28, y: 66, mag: 0.9 }, { x: 72, y: 66, mag: 0.9 },
      { x: 36, y: 36, mag: 0.7 }, { x: 64, y: 34, mag: 0.7 },
      { x: 50, y: 20, mag: 0.6 }, { x: 50, y: 54, mag: 0.55 },
    ],
    lines: [[0, 1], [0, 2], [1, 3], [2, 4], [4, 3], [2, 5], [5, 3]],
  },
  {
    name: 'Scorpio', symbol: '♏',
    stars: [
      { x: 24, y: 18, mag: 0.75 }, { x: 34, y: 27, mag: 0.65 },
      { x: 44, y: 24, mag: 0.65 }, { x: 39, y: 39, mag: 1.0 },
      { x: 45, y: 52, mag: 0.7 }, { x: 55, y: 62, mag: 0.65 },
      { x: 66, y: 70, mag: 0.6 }, { x: 79, y: 72, mag: 0.65 },
      { x: 85, y: 61, mag: 0.8 }, { x: 74, y: 58, mag: 0.55 },
    ],
    lines: [[0, 1], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9]],
  },
  {
    name: 'Sagittarius', symbol: '♐',
    stars: [
      { x: 31, y: 33, mag: 0.7 }, { x: 48, y: 26, mag: 0.8 },
      { x: 63, y: 34, mag: 0.7 }, { x: 66, y: 51, mag: 0.85 },
      { x: 51, y: 62, mag: 0.9 }, { x: 36, y: 55, mag: 0.7 },
      { x: 27, y: 68, mag: 0.6 }, { x: 76, y: 68, mag: 0.65 },
      { x: 52, y: 43, mag: 0.65 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 8], [8, 4], [5, 6], [3, 7]],
  },
  {
    name: 'Capricorn', symbol: '♑',
    stars: [
      { x: 18, y: 34, mag: 0.8 }, { x: 30, y: 42, mag: 0.65 },
      { x: 45, y: 60, mag: 0.6 }, { x: 61, y: 69, mag: 0.7 },
      { x: 78, y: 58, mag: 0.85 }, { x: 72, y: 39, mag: 0.65 },
      { x: 53, y: 28, mag: 0.55 }, { x: 36, y: 28, mag: 0.55 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]],
  },
  {
    name: 'Aquarius', symbol: '♒',
    stars: [
      { x: 24, y: 25, mag: 0.65 }, { x: 36, y: 36, mag: 0.6 },
      { x: 49, y: 28, mag: 0.75 }, { x: 62, y: 38, mag: 0.7 },
      { x: 74, y: 30, mag: 0.65 }, { x: 50, y: 52, mag: 0.7 },
      { x: 39, y: 65, mag: 0.55 }, { x: 62, y: 68, mag: 0.55 },
      { x: 73, y: 82, mag: 0.7 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [5, 7], [7, 8]],
  },
  {
    name: 'Pisces', symbol: '♓',
    stars: [
      { x: 18, y: 38, mag: 0.6 }, { x: 27, y: 29, mag: 0.7 },
      { x: 39, y: 32, mag: 0.6 }, { x: 48, y: 45, mag: 0.55 },
      { x: 57, y: 57, mag: 0.7 }, { x: 68, y: 65, mag: 0.55 },
      { x: 82, y: 59, mag: 0.65 }, { x: 78, y: 43, mag: 0.7 },
      { x: 64, y: 36, mag: 0.55 }, { x: 50, y: 72, mag: 0.65 },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [4, 9]],
  },
];
