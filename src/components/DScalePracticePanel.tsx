import React, { useMemo } from 'react';
import { TinWhistlePracticeBoard } from './TinWhistlePracticeBoard';
import { TinWhistleSequentialPractice } from './TinWhistleSequentialPractice';
import { midiNoteToName } from '../types/midi';

export const D_SCALE_SEQUENCE = [62, 64, 66, 67, 69, 71, 74];

interface DScalePracticePanelProps {
  isActive: boolean;
  practiceSequence: number[];
  currentNoteIndex: number;
  currentTargetNote: number | null;
  lastPlayedNote: number | null;
  isCorrectNote: boolean | null;
  startPracticeSequence: () => void;
  stopPracticeSequence: () => void;
  resetPracticeSequence: () => void;
}

export const DScalePracticePanel: React.FC<DScalePracticePanelProps> = ({
  isActive,
  practiceSequence,
  currentNoteIndex,
  currentTargetNote,
  lastPlayedNote,
  isCorrectNote,
  startPracticeSequence,
  stopPracticeSequence,
  resetPracticeSequence,
}) => {
  const progressIndex = practiceSequence.length > 0 ? Math.min(currentNoteIndex + 1, D_SCALE_SEQUENCE.length) : 0;
  const progressPercent =
    D_SCALE_SEQUENCE.length > 0 ? Math.round((progressIndex / D_SCALE_SEQUENCE.length) * 100) : 0;

  const heroBorderClass = isActive ? 'border-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.35)]' : 'border-gray-700';

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
      <div className={`bg-gray-800 rounded-lg p-6 space-y-4 border ${heroBorderClass}`}>
        <div>
          <h2 className="text-2xl font-bold">D Scale Practice</h2>
          <p className="text-gray-300 mt-1">
            Focused practice for the D major scale. Walk through the seven core notes with larger
            fingering maps and live feedback.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {D_SCALE_SEQUENCE.map((note) => (
            <div
              key={note}
              className={`p-4 rounded-xl border transition-colors ${
                currentTargetNote === note
                  ? 'bg-blue-600 border-blue-400'
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
          >
            Start D Scale
          </button>
          <button
            onClick={resetPracticeSequence}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500"
            disabled={practiceSequence.length === 0}
          >
            Reset
          </button>
          <button
            onClick={stopPracticeSequence}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
            disabled={practiceSequence.length === 0}
          >
            Stop Practice
          </button>
          <div className="text-sm text-gray-300">
            Progress: {progressIndex}/{D_SCALE_SEQUENCE.length} notes · {progressPercent}%
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
        {practiceSequence.length > 0 ? (
          <TinWhistleSequentialPractice
            sequence={timedSequence}
            currentNoteIndex={currentNoteIndex}
            tempo={120}
            lastPlayedNote={lastPlayedNote}
            isCorrectNote={isCorrectNote}
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
