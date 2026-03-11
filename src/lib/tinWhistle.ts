import { midiNoteToName } from '../types/midi';

export const TIN_WHISTLE_FINGERINGS: Record<number, boolean[]> = {
  62: [true, true, true, true, true, true],
  63: [true, true, true, true, true, false],
  64: [true, true, true, true, true, false],
  65: [true, true, true, true, false, false],
  66: [true, true, true, true, false, false],
  67: [true, true, true, false, false, false],
  68: [true, true, false, true, false, false],
  69: [true, true, false, false, false, false],
  70: [true, false, true, false, false, false],
  71: [true, false, false, false, false, false],
  72: [false, false, false, false, false, false],
  73: [true, false, true, false, false, false],
  74: [true, true, true, true, true, true],
  76: [true, true, true, true, true, false],
  77: [true, true, true, true, false, false],
  78: [true, true, true, false, false, false],
  79: [true, true, true, false, false, false],
  81: [true, true, false, false, false, false],
  83: [true, false, false, false, false, false],
  84: [false, false, false, false, false, false]
};

export const TIN_WHISTLE_NOTES = [62, 64, 65, 66, 67, 69, 71, 72, 74, 76, 77, 78, 79, 81, 83, 84];
export const TIN_WHISTLE_LANE_LABELS = ['Hole 1', 'Hole 2', 'Hole 3', 'Hole 4', 'Hole 5', 'Hole 6', 'Breath'] as const;

const NOTE_COLOR_PALETTE = [
  '#ff7a59',
  '#ffb347',
  '#ffd166',
  '#72d6c9',
  '#4ea8de',
  '#7b9cff',
  '#c77dff',
  '#f15bb5'
] as const;

export interface TinWhistleLaneEvent {
  note: number;
  label: string;
  coveredHoles: boolean[];
  occupiedLaneIndices: number[];
  color: string;
}

export const getTinWhistleFingering = (note: number): boolean[] =>
  TIN_WHISTLE_FINGERINGS[note] ?? [false, false, false, false, false, false];

export const getTinWhistleNoteColor = (note: number): string =>
  NOTE_COLOR_PALETTE[Math.abs(note) % NOTE_COLOR_PALETTE.length];

export const getTinWhistleLaneEvent = (note: number): TinWhistleLaneEvent => {
  const coveredHoles = getTinWhistleFingering(note);
  const occupiedLaneIndices = coveredHoles
    .map((isCovered, index) => (isCovered ? index : -1))
    .filter((index) => index >= 0);

  occupiedLaneIndices.push(6);

  return {
    note,
    label: midiNoteToName(note),
    coveredHoles,
    occupiedLaneIndices,
    color: getTinWhistleNoteColor(note)
  };
};
