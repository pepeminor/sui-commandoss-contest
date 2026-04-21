export const VIETNAMESE_HOUR_ANIMALS = [
  { branch: 'Tý', icon: '🐀' },
  { branch: 'Sửu', icon: '🐂' },
  { branch: 'Dần', icon: '🐅' },
  { branch: 'Mẹo', icon: '🐈' },
  { branch: 'Thìn', icon: '🐉' },
  { branch: 'Tỵ', icon: '🐍' },
  { branch: 'Ngọ', icon: '🐎' },
  { branch: 'Mùi', icon: '🐐' },
  { branch: 'Thân', icon: '🐒' },
  { branch: 'Dậu', icon: '🐓' },
  { branch: 'Tuất', icon: '🐕' },
  { branch: 'Hợi', icon: '🐖' },
];

const VIETNAM_HOUR_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Ho_Chi_Minh',
  hour: '2-digit',
  hour12: false,
});

export function getVietnameseHourAnimal() {
  const hourPart = VIETNAM_HOUR_FORMATTER
    .formatToParts(new Date())
    .find(part => part.type === 'hour');
  const hour = Number(hourPart?.value ?? 0) % 24;
  const branchIndex = Math.floor(((hour + 1) % 24) / 2);
  return VIETNAMESE_HOUR_ANIMALS[branchIndex];
}
