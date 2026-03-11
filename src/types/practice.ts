export type TimingPreset = 'easy' | 'normal' | 'hard';

export type PracticeRendererMode = 'timeline-horizontal' | 'fingering-fall';
export type PracticeFingeringDirection = 'top-to-bottom' | 'right-to-left';

export interface TimedPracticeNote {
  note: number;
  startTime: number;
  duration: number;
}

export interface PracticeLoopRange {
  start: number;
  end: number;
}

export interface PracticeViewModel {
  sequence: TimedPracticeNote[];
  currentNoteIndex: number;
  currentTargetNote: number | null;
  lastPlayedNote: number | null;
  isCorrectNote: boolean | null;
  tempo: number;
  timingPreset: TimingPreset;
  timingWindowMs: number;
  lastTimingDeviationMs: number | null;
  flowStartTimestampMs: number | null;
  flowPausedAtTimestampMs: number | null;
  flowAccumulatedPauseMs: number;
  notesAheadTarget: number;
}
