import React, { useEffect, useMemo, useRef, useState } from 'react';
import { midiNoteToName } from '../types/midi';

const TIN_WHISTLE_FINGERINGS: Record<number, boolean[]> = {
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

const STAFF_LINE_SPACING = 8;
const STAFF_TOP_PADDING = 4;
const STAFF_NOTE_DIAMETER = 8;
const STAFF_REFERENCE_NOTE = 64;
const STAFF_LINE_INDICES = [0, 1, 2, 3, 4];

const StaffNoteDisplay: React.FC<{ note: number }> = ({ note }) => {
  const bottomLineY = STAFF_TOP_PADDING + STAFF_LINE_SPACING * 4;
  const semitoneOffset = note - STAFF_REFERENCE_NOTE;
  const stepSize = STAFF_LINE_SPACING / 2;
  const centerY = bottomLineY - semitoneOffset * stepSize;
  const noteTop = centerY - STAFF_NOTE_DIAMETER / 2;
  const needsLedgerBelow = centerY > bottomLineY + STAFF_LINE_SPACING / 2;
  const needsLedgerAbove = centerY < STAFF_TOP_PADDING - STAFF_LINE_SPACING / 2;

  return (
    <div className="relative w-24 h-20">
      {STAFF_LINE_INDICES.map((line) => (
        <span
          key={line}
          className="absolute left-0 right-0 h-[1px] bg-white/20"
          style={{ top: STAFF_TOP_PADDING + line * STAFF_LINE_SPACING }}
        />
      ))}
      <span
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white border border-white/30 shadow-sm"
        style={{
          width: STAFF_NOTE_DIAMETER,
          height: STAFF_NOTE_DIAMETER,
          top: noteTop
        }}
      />
      {needsLedgerBelow && (
        <span
          className="absolute left-1/2 -translate-x-1/2 h-[2px] bg-white/60"
          style={{ width: 32, top: bottomLineY + STAFF_LINE_SPACING / 2 }}
        />
      )}
      {needsLedgerAbove && (
        <span
          className="absolute left-1/2 -translate-x-1/2 h-[2px] bg-white/60"
          style={{ width: 32, top: STAFF_TOP_PADDING - STAFF_LINE_SPACING / 2 }}
        />
      )}
    </div>
  );
};

interface NoteWithTiming {
  note: number;
  startTime: number;
  duration: number;
}

interface SequentialPracticeProps {
  sequence: NoteWithTiming[];
  currentNoteIndex: number;
  tempo: number;
  lastPlayedNote?: number | null;
  isCorrectNote?: boolean | null;
  loopModeActive?: boolean;
  loopRange?: { start: number; end: number } | null;
  loopNotesPreview?: string[];
  onApplyLoopRange?: (startIndex: number, endIndex: number) => void;
  onClearLoopRange?: () => void;
  timingPreset: 'easy' | 'normal' | 'hard';
  timingWindowMs: number;
  lastTimingDeviationMs: number | null;
  flowStartTimestampMs: number | null;
  flowPausedAtTimestampMs: number | null;
  flowAccumulatedPauseMs: number;
  notesAheadTarget: number;
  className?: string;
}

export const TinWhistleSequentialPractice: React.FC<SequentialPracticeProps> = ({
  sequence,
  currentNoteIndex,
  tempo,
  isCorrectNote,
  loopModeActive = false,
  loopRange = null,
  loopNotesPreview = [],
  onApplyLoopRange,
  onClearLoopRange,
  timingPreset,
  timingWindowMs,
  lastTimingDeviationMs,
  flowStartTimestampMs,
  flowPausedAtTimestampMs,
  flowAccumulatedPauseMs,
  notesAheadTarget,
  className = ''
}) => {
  const laneRef = useRef<HTMLDivElement>(null);
  const [laneWidth, setLaneWidth] = useState(960);
  const [playheadBeat, setPlayheadBeat] = useState(0);
  const [selectionAnchorIndex, setSelectionAnchorIndex] = useState<number | null>(null);
  const [previewRange, setPreviewRange] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    const element = laneRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setLaneWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (flowStartTimestampMs === null) {
      setPlayheadBeat(0);
      return;
    }

    let frameId = 0;
    const tick = () => {
      const now = performance.now();
      const activePauseMs = flowPausedAtTimestampMs !== null ? Math.max(0, now - flowPausedAtTimestampMs) : 0;
      const elapsedMs = Math.max(0, now - flowStartTimestampMs - flowAccumulatedPauseMs - activePauseMs);
      const beats = elapsedMs / (60000 / Math.max(tempo, 1));
      setPlayheadBeat(beats);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [flowStartTimestampMs, flowPausedAtTimestampMs, flowAccumulatedPauseMs, tempo]);

  useEffect(() => {
    setSelectionAnchorIndex(null);
    setPreviewRange(null);
  }, [sequence]);

  const currentExpectedBeat = sequence[currentNoteIndex]?.startTime ?? 0;
  const isFlowStarted = flowStartTimestampMs !== null;
  const isFlowPaused = flowPausedAtTimestampMs !== null;

  const pixelsPerBeat = useMemo(() => {
    if (sequence.length === 0) {
      return 130;
    }

    const viewWidth = Math.max(320, laneWidth - 180);
    const lookAheadIndex = Math.min(sequence.length - 1, currentNoteIndex + Math.max(2, notesAheadTarget));
    const currentStartBeat = sequence[currentNoteIndex]?.startTime ?? 0;
    const lookAheadBeat = sequence[lookAheadIndex]?.startTime ?? currentStartBeat + 2;
    const lookAheadDuration = sequence[lookAheadIndex]?.duration ?? 1;
    const beatSpan = Math.max(1, lookAheadBeat - currentStartBeat + lookAheadDuration);
    return Math.min(260, Math.max(60, viewWidth / beatSpan));
  }, [sequence, laneWidth, currentNoteIndex, notesAheadTarget]);

  const loopRangeLabel = loopRange ? `${loopRange.start + 1}-${loopRange.end + 1}` : '';
  const remainingLoopNotes = Math.max(0, sequence.length - loopNotesPreview.length);
  const loopNotesText = loopNotesPreview.length > 0
    ? `${loopNotesPreview.join(' · ')}${remainingLoopNotes > 0 ? ` +${remainingLoopNotes} more` : ''}`
    : 'No notes available';

  const hitLineX = 116;
  const isTimingEarly = (lastTimingDeviationMs ?? 0) < 0;
  const timingText = lastTimingDeviationMs === null
    ? `Window ±${timingWindowMs}ms`
    : `${isTimingEarly ? 'Early' : 'Late'} ${Math.abs(lastTimingDeviationMs).toFixed(0)}ms`;

  const handleNoteClick = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (sequence.length === 0 || !onApplyLoopRange) {
      return;
    }

    if (event.shiftKey && selectionAnchorIndex !== null) {
      const start = Math.min(selectionAnchorIndex, index);
      const end = Math.max(selectionAnchorIndex, index);
      const selectedNotes = sequence.slice(start, end + 1);
      const noteSummary = selectedNotes
        .map((noteItem, selectedIndex) => `${start + selectedIndex + 1}. ${midiNoteToName(noteItem.note)}`)
        .join(', ');

      setPreviewRange({ start, end });

      const shouldEnableLoop = window.confirm(
        `Loop this note range?\n\nRange: ${start + 1} to ${end + 1}\nNotes (${selectedNotes.length}): ${noteSummary}`
      );

      if (shouldEnableLoop) {
        onApplyLoopRange(start, end);
        setSelectionAnchorIndex(null);
        setPreviewRange(null);
      }

      return;
    }

    setSelectionAnchorIndex(index);
    setPreviewRange(null);
  };

  const handleNoteMouseEnter = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    if (!event.shiftKey || selectionAnchorIndex === null) {
      return;
    }

    setPreviewRange({
      start: Math.min(selectionAnchorIndex, index),
      end: Math.max(selectionAnchorIndex, index)
    });
  };

  const renderFingeringChart = (note: number) => {
    const fingering = TIN_WHISTLE_FINGERINGS[note] || [false, false, false, false, false, false];

    return (
      <div className="w-12 h-16 bg-amber-700 rounded-lg border border-amber-500/65 flex flex-col justify-between p-1.5 shadow-md">
        {fingering.map((isCovered, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full border mx-auto ${
              isCovered
                ? 'bg-gray-800 border-gray-600'
                : 'bg-white border-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`relative mac-panel border border-gray-600 overflow-hidden ${className}`}>
      {loopModeActive && (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 border-b border-indigo-300/40 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-white">
              <span className="font-semibold">Looping selected section</span>
              <span className="text-indigo-100">
                Range {loopRangeLabel || 'N/A'} · {sequence.length} notes
              </span>
            </div>
            {onClearLoopRange && (
              <button
                onClick={onClearLoopRange}
                className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold rounded bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                Exit Loop
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mac-panel-soft p-4 border-b border-gray-600">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Rhythm Lane
            {!isFlowStarted ? (
              <span className="text-blue-300 text-sm font-normal animate-pulse">Play first note to start</span>
            ) : isFlowPaused ? (
              <span className="text-amber-300 text-sm font-normal">Paused: correct fingering to continue</span>
            ) : (
              <span className="text-green-300 text-sm font-normal">Running</span>
            )}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-300">Preset: {timingPreset}</span>
            <span className={`font-medium ${lastTimingDeviationMs === null ? 'text-gray-300' : isCorrectNote ? 'text-green-300' : 'text-red-300'}`}>
              {timingText}
            </span>
            <span className="text-gray-400">{currentNoteIndex + 1} / {sequence.length}</span>
          </div>
        </div>
      </div>

      {loopModeActive && (
        <div className="bg-indigo-950/40 border-b border-indigo-700/40 px-4 py-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs">
            <span className="text-indigo-100">Loop notes: {loopNotesText}</span>
            <span className="text-indigo-300">Change Selection: click a note, then Shift-click another</span>
          </div>
        </div>
      )}

      <div ref={laneRef} className="relative bg-gray-900/35 overflow-hidden" style={{ minHeight: '360px' }}>
        <div className="absolute inset-y-0 w-px bg-yellow-300/80" style={{ left: hitLineX }} />
        <div className="absolute top-0 bottom-0 w-28 bg-gradient-to-r from-gray-900/55 to-transparent pointer-events-none" />

        {sequence.map((noteItem, index) => {
          const isCurrentNote = index === currentNoteIndex;
          const isPastNote = index < currentNoteIndex;
          const isSelectionAnchor = selectionAnchorIndex === index;
          const isInPreviewRange = previewRange !== null && index >= previewRange.start && index <= previewRange.end;
          const noteLeft = hitLineX + (noteItem.startTime - playheadBeat) * pixelsPerBeat;
          const noteWidth = Math.max(68, noteItem.duration * pixelsPerBeat);

          if (noteLeft > laneWidth + 180 || noteLeft + noteWidth < -180) {
            return null;
          }

          return (
            <div
              key={`${index}-${noteItem.startTime}`}
              data-note-index={index}
              role="button"
              tabIndex={0}
              title="Click a note, then Shift-click another to loop a section"
              onClick={(event) => handleNoteClick(index, event)}
              onMouseEnter={(event) => handleNoteMouseEnter(index, event)}
              className={`absolute top-10 p-3 rounded-lg transition-colors cursor-pointer ${
                isCurrentNote
                  ? isCorrectNote === false
                    ? 'bg-red-600/90 ring-2 ring-red-300'
                    : 'bg-blue-600/90 ring-2 ring-yellow-300'
                  : isSelectionAnchor
                    ? 'bg-gray-800 ring-1 ring-indigo-300'
                    : isInPreviewRange
                      ? 'bg-indigo-900/60 ring-1 ring-indigo-500/50'
                      : isPastNote
                        ? 'bg-gray-700/50 opacity-60'
                        : 'bg-gray-800/90'
              }`}
              style={{ left: noteLeft, width: noteWidth }}
            >
              <div className="flex items-start gap-3">
                {renderFingeringChart(noteItem.note)}
                <div>
                  <div className={`text-sm font-semibold px-2 py-0.5 rounded inline-block ${
                    isCurrentNote ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-white'
                  }`}>
                    <span className={noteItem.note >= 74 ? 'border-b-2 border-orange-400' : ''}>
                      {midiNoteToName(noteItem.note)}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-300 mt-1">{noteItem.duration.toFixed(2)} beats</div>
                </div>
              </div>
              <div className="mt-2 opacity-80">
                <StaffNoteDisplay note={noteItem.note} />
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-4 left-4 text-xs text-gray-300 bg-gray-900/80 px-3 py-2 rounded border border-gray-700">
          Playhead: {playheadBeat.toFixed(2)} beats · Target beat: {currentExpectedBeat.toFixed(2)}
        </div>
      </div>

      <div className="mac-panel-soft p-3 border-t border-gray-600 text-center text-xs text-gray-400">
        Notes flow right to left by MIDI timing. Sustain length controls box width. Wrong fingering pauses flow.
      </div>
    </div>
  );
};
