import React, { useMemo } from 'react';
import { TinWhistlePracticeBoard } from './TinWhistlePracticeBoard';
import { TinWhistleSequentialPractice } from './TinWhistleSequentialPractice';
import { midiNoteToName } from '../types/midi';

interface DScalePracticePanelProps {
  isActive: boolean;
  scaleName: string;
  displaySequence: number[];
  practiceSequence: number[];
  currentNoteIndex: number;
  currentTargetNote: number | null;
  lastPlayedNote: number | null;
  isCorrectNote: boolean | null;
  timingPreset: 'easy' | 'normal' | 'hard';
  timingWindowMs: number;
  lastTimingDeviationMs: number | null;
  flowStartTimestampMs: number | null;
  flowPausedAtTimestampMs: number | null;
  flowAccumulatedPauseMs: number;
  notesAheadTarget: number;
  startPracticeSequence: () => void;
  stopPracticeSequence: () => void;
  resetPracticeSequence: () => void;
}

export const DScalePracticePanel: React.FC<DScalePracticePanelProps> = ({
  isActive,
  scaleName,
  displaySequence,
  practiceSequence,
  currentNoteIndex,
  currentTargetNote,
  lastPlayedNote,
  isCorrectNote,
  timingPreset,
  timingWindowMs,
  lastTimingDeviationMs,
  flowStartTimestampMs,
  flowPausedAtTimestampMs,
  flowAccumulatedPauseMs,
  notesAheadTarget,
  startPracticeSequence,
  stopPracticeSequence,
  resetPracticeSequence,
}) => {
  const progressIndex = practiceSequence.length > 0 ? Math.min(currentNoteIndex + 1, displaySequence.length) : 0;
  const progressPercent =
    displaySequence.length > 0 ? Math.round((progressIndex / displaySequence.length) * 100) : 0;

  const heroBorderClass = isActive ? 'border-blue-400/60 shadow-[0_0_30px_rgba(95,156,255,0.22)]' : 'border-gray-700';

  const timedSequence = useMemo(
    () =>
      practiceSequence.map((note, index) => ({
        note,
        startTime: index,
        duration: 1
      })),
    [practiceSequence]
  );

  return (
    <div className="space-y-6">
      <div className={`mac-panel p-6 space-y-4 border ${heroBorderClass}`}>
        <div>
          <h2 className="text-2xl font-bold">{scaleName} Scale Practice</h2>
          <p className="text-gray-300 mt-1">
            Focused practice for the {scaleName} major scale. Walk through the seven core notes with larger
            fingering maps and live feedback.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {displaySequence.map((note, index) => (
            <div
              key={`${note}-${index}`}
              className={`p-4 rounded-xl border transition-colors ${
                currentTargetNote === note
                  ? 'bg-blue-500/25 border-blue-300/55'
                  : 'bg-gray-700 border-gray-600'
              }`}
            >
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{note}</span>
                <span>{midiNoteToName(note)}</span>
              </div>
              <div className="text-3xl font-semibold text-white text-center">{midiNoteToName(note)}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={startPracticeSequence}
            className="mac-button mac-button-primary"
          >
            Start {scaleName} Scale
          </button>
          <button
            onClick={resetPracticeSequence}
            className="mac-button"
            disabled={practiceSequence.length === 0}
          >
            Reset
          </button>
          <button
            onClick={stopPracticeSequence}
            className="mac-button mac-button-danger"
            disabled={practiceSequence.length === 0}
          >
            Stop Practice
          </button>
          <div className="text-sm text-gray-300">
            Progress: {progressIndex}/{displaySequence.length} notes · {progressPercent}%
          </div>
        </div>
      </div>

      <div className="mac-panel-soft p-6 border border-gray-700">
        {practiceSequence.length > 0 ? (
          <TinWhistleSequentialPractice
            sequence={timedSequence}
            currentNoteIndex={currentNoteIndex}
            tempo={120}
            lastPlayedNote={lastPlayedNote}
            isCorrectNote={isCorrectNote}
            timingPreset={timingPreset}
            timingWindowMs={timingWindowMs}
            lastTimingDeviationMs={lastTimingDeviationMs}
            flowStartTimestampMs={flowStartTimestampMs}
            flowPausedAtTimestampMs={flowPausedAtTimestampMs}
            flowAccumulatedPauseMs={flowAccumulatedPauseMs}
            notesAheadTarget={notesAheadTarget}
            className="h-auto"
          />
        ) : (
          <TinWhistlePracticeBoard
            currentTargetNote={currentTargetNote}
            lastPlayedNote={lastPlayedNote}
            isCorrectNote={isCorrectNote}
            className="h-auto"
          />
        )}
      </div>
    </div>
  );
};
