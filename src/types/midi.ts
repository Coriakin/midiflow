/**
 * MIDI note number type (0-127)
 */
export type MIDINoteNumber = number;

/**
 * MIDI velocity type (0-127)
 */
export type MIDIVelocity = number;

/**
 * MIDI device connection state
 */
export type MIDIDeviceState = 'connected' | 'disconnected' | 'error';

/**
 * MIDI message types we care about for tin whistle practice
 */
export interface MIDINoteOnMessage {
  type: 'noteon';
  note: MIDINoteNumber;
  velocity: MIDIVelocity;
  timestamp: number;
}

export interface MIDINoteOffMessage {
  type: 'noteoff';
  note: MIDINoteNumber;
  velocity: MIDIVelocity;
  timestamp: number;
}

export type MIDIMessage = MIDINoteOnMessage | MIDINoteOffMessage;

/**
 * MIDI device information
 */
export interface MIDIDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  type: 'USB' | 'BLE';
  state: MIDIDeviceState;
}

/**
 * Note timing accuracy for practice feedback
 */
export type NoteTimingAccuracy = 'early' | 'perfect' | 'late';

/**
 * Practice note state for visual feedback
 */
export interface PracticeNote {
  id: string;
  note: MIDINoteNumber;
  startTime: number;
  duration: number;
  isTarget: boolean; // Currently expected note
  isPlayed: boolean;
  isCorrect: boolean | null;
  timingAccuracy: NoteTimingAccuracy | null;
}

/**
 * Tin whistle note range (typical range D5 to D7)
 * MIDI note numbers: D5=74, D7=98
 * Expanded for testing to include more notes
 */
export const TIN_WHISTLE_RANGE = {
  MIN: 60, // C4 - Expanded for testing
  MAX: 96  // C7 - Expanded for testing
} as const;

/**
 * MIDI note number to note name conversion
 */
export const MIDI_NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
] as const;

/**
 * Convert MIDI note number to note name with octave
 */
export function midiNoteToName(noteNumber: MIDINoteNumber): string {
  const noteName = MIDI_NOTE_NAMES[noteNumber % 12];
  const octave = Math.floor(noteNumber / 12) - 1;
  return `${noteName}${octave}`;
}

/**
 * Check if a MIDI note is in tin whistle range
 */
export function isInTinWhistleRange(noteNumber: MIDINoteNumber): boolean {
  return noteNumber >= TIN_WHISTLE_RANGE.MIN && noteNumber <= TIN_WHISTLE_RANGE.MAX;
}
