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
 * Instrument-specific note ranges for practice filtering
 */
export const INSTRUMENT_RANGES = {
  'tin-whistle': { MIN: 60, MAX: 84 }, // C4 to C6 - typical tin whistle range
  'full-keyboard': { MIN: 21, MAX: 108 }, // A0 to C8 - full 88-key piano range  
  'guitar': { MIN: 40, MAX: 88 }, // E2 to E6 - standard guitar range
  'violin': { MIN: 55, MAX: 96 }, // G3 to C7 - violin range
  'flute': { MIN: 60, MAX: 96 }, // C4 to C7 - flute range
  'saxophone': { MIN: 46, MAX: 82 }, // Bb2 to Bb5 - alto sax range
  'custom': { MIN: 48, MAX: 96 } // C3 to C7 - flexible middle range
} as const;

export type InstrumentType = keyof typeof INSTRUMENT_RANGES;

/**
 * Tin whistle note range (backwards compatibility)
 */
export const TIN_WHISTLE_RANGE = INSTRUMENT_RANGES['tin-whistle'];

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
 * Check if a MIDI note is in the specified instrument's practice range
 */
export function isInPracticeRange(noteNumber: MIDINoteNumber, instrumentType: InstrumentType = 'tin-whistle'): boolean {
  const range = INSTRUMENT_RANGES[instrumentType];
  return noteNumber >= range.MIN && noteNumber <= range.MAX;
}

/**
 * Check if a MIDI note is in tin whistle range (backwards compatibility)
 */
export function isInTinWhistleRange(noteNumber: MIDINoteNumber): boolean {
  return isInPracticeRange(noteNumber, 'tin-whistle');
}
