import React, { useEffect, useRef, useState } from 'react';
import { midiNoteToName } from '../types/midi';

/**
 * Tin whistle fingering patterns
 * Each pattern represents 6 holes: [hole1, hole2, hole3, hole4, hole5, hole6]
 * true = covered/closed, false = open
 */
const TIN_WHISTLE_FINGERINGS: Record<number, boolean[]> = {
  62: [true, true, true, true, true, true],   // D4 (low D)
  63: [true, true, true, true, true, false],  // D#4
  64: [true, true, true, true, true, false],  // E4
  65: [true, true, true, true, false, false], // F4
  66: [true, true, true, true, false, false], // F#4
  67: [true, true, true, false, false, false], // G4
  68: [true, true, false, true, false, false], // G#4
  69: [true, true, false, false, false, false], // A4
  70: [true, false, true, false, false, false], // A#4
  71: [true, false, false, false, false, false], // B4
  72: [false, false, false, false, false, false], // C5
  73: [true, false, true, false, false, false], // C#5
  74: [true, true, true, true, true, true],   // D5 (second octave)
  76: [true, true, true, true, true, false],  // E5
  77: [true, true, true, true, false, false], // F5
  78: [true, true, true, false, false, false], // F#5
  79: [true, true, true, false, false, false], // G5
  81: [true, true, false, false, false, false], // A5
  83: [true, false, false, false, false, false], // B5
  84: [false, false, false, false, false, false], // C6
};

const STAFF_LINE_SPACING = 8;
const STAFF_TOP_PADDING = 4;
const STAFF_NOTE_DIAMETER = 8;
const STAFF_REFERENCE_NOTE = 64; // E4 line
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
      {STAFF_LINE_INDICES.map(line => (
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
      ></span>
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
  startTime: number; // in beats relative to song start
  duration: number; // in beats
}

interface SequentialPracticeProps {
  sequence: NoteWithTiming[];
  currentNoteIndex: number;
  tempo: number; // BPM
  lastPlayedNote?: number | null;
  isCorrectNote?: boolean | null;
  loopModeActive?: boolean;
  loopRange?: { start: number; end: number } | null;
  loopNotesPreview?: string[];
  onApplyLoopRange?: (startIndex: number, endIndex: number) => void;
  onClearLoopRange?: () => void;
  className?: string;
}

/**
 * Sequential tin whistle practice with static note layout and timing feedback
 * Notes are displayed in a comfortable grid format for stress-free learning
 */
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
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [completedNotes, setCompletedNotes] = useState<Set<number>>(new Set());
  const [correctNoteFeedback, setCorrectNoteFeedback] = useState<Set<number>>(new Set());
  const [incorrectNoteFeedback, setIncorrectNoteFeedback] = useState<Set<number>>(new Set());
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectionAnchorIndex, setSelectionAnchorIndex] = useState<number | null>(null);
  const [previewRange, setPreviewRange] = useState<{ start: number; end: number } | null>(null);
  const [showHelpDetails, setShowHelpDetails] = useState(false);

  // Reset state when sequence changes
  useEffect(() => {
    setHasStarted(false);
    setIsCompleted(false);
    setCompletedNotes(new Set());
    setCorrectNoteFeedback(new Set());
    setIncorrectNoteFeedback(new Set());
    setSelectionAnchorIndex(null);
    setPreviewRange(null);
  }, [sequence]);

  // Auto-scroll to keep current note in view
  useEffect(() => {
    if (containerRef.current && sequence.length > 0) {
      // Add a small delay to ensure DOM has updated after note change
      const scrollTimeout = setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;
        
        // Find the current note element
        const currentNoteElement = container.querySelector(`[data-note-index="${currentNoteIndex}"]`) as HTMLElement;
        
        if (currentNoteElement) {
          const containerRect = container.getBoundingClientRect();
          const noteRect = currentNoteElement.getBoundingClientRect();
          
          // Calculate the position to center the current note
          const containerCenter = containerRect.width / 2;
          const noteCenter = noteRect.left - containerRect.left + noteRect.width / 2;
          const scrollOffset = noteCenter - containerCenter;
          
          // Add padding to show some context around the current note
          const finalScrollPosition = container.scrollLeft + scrollOffset;
          
          // Smooth scroll to center the current note
          container.scrollTo({
            left: Math.max(0, finalScrollPosition), // Prevent negative scroll
            behavior: 'smooth'
          });
        }
      }, 100); // Small delay to ensure DOM is ready
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [currentNoteIndex, sequence.length]);

  // Auto-scroll to keep current note centered
  useEffect(() => {
    if (containerRef.current && currentNoteIndex >= 0 && hasStarted) {
      const currentNoteElement = containerRef.current.querySelector(`[data-note-index="${currentNoteIndex}"]`) as HTMLElement;
      if (currentNoteElement) {
        currentNoteElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
      }
    }
  }, [currentNoteIndex, hasStarted]);

  // Handle correct/incorrect note feedback timing
  useEffect(() => {
    if (currentNoteIndex >= 0) {
      if (isCorrectNote === true) {
        // Start the practice if this is the first note
        if (!hasStarted) {
          setHasStarted(true);
        }

        // Add to completed notes
        setCompletedNotes(prev => new Set([...prev, currentNoteIndex]));
        
        // Show green feedback for 2 seconds
        setCorrectNoteFeedback(prev => new Set([...prev, currentNoteIndex]));
        
        setTimeout(() => {
          setCorrectNoteFeedback(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentNoteIndex);
            return newSet;
          });
        }, 2000);
      } else if (isCorrectNote === false) {
        // Show red feedback for incorrect note for 1 second (during auto-recovery period)
        setIncorrectNoteFeedback(prev => new Set([...prev, currentNoteIndex]));
        
        setTimeout(() => {
          setIncorrectNoteFeedback(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentNoteIndex);
            return newSet;
          });
        }, 1000);
      }
    }
  }, [isCorrectNote, currentNoteIndex, hasStarted]);

  // Render fingering chart for a note
  const renderFingeringChart = (note: number, size: 'small' | 'large' = 'small') => {
    const fingering = TIN_WHISTLE_FINGERINGS[note] || [false, false, false, false, false, false];
    const chartSize = size === 'large' ? 'w-16 h-24' : 'w-12 h-16';
    const holeSize = size === 'large' ? 'w-4 h-4' : 'w-3 h-3';

    return (
      <div className={`${chartSize} bg-amber-700 rounded-lg border-2 border-amber-600 flex flex-col justify-between p-1 relative shadow-lg`}>
        {fingering.map((isCovered, index) => (
          <div
            key={index}
            className={`${holeSize} rounded-full border-2 mx-auto ${
              isCovered
                ? 'bg-gray-800 border-gray-600' // Covered hole (dark)
                : 'bg-white border-gray-300'     // Open hole (light)
            }`}
          />
        ))}
      </div>
    );
  };

  // Calculate metronome pulse intensity (simplified without timeline)
  const getCurrentBeat = () => {
    // Use a simple beat counter based on practice progress
    return currentNoteIndex;
  };

  const currentBeat = getCurrentBeat();
  const metronomeIntensity = !hasStarted || isCompleted ? 0 : Math.abs(Math.sin((currentBeat % 1) * Math.PI));
  const loopRangeLabel = loopRange ? `${loopRange.start + 1}-${loopRange.end + 1}` : '';
  const remainingLoopNotes = Math.max(0, sequence.length - loopNotesPreview.length);
  const loopNotesText = loopNotesPreview.length > 0
    ? `${loopNotesPreview.join(' · ')}${remainingLoopNotes > 0 ? ` +${remainingLoopNotes} more` : ''}`
    : 'No notes available';

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

  return (
    <div className={`relative bg-gray-900 rounded-lg border border-gray-600 overflow-hidden ${className}`}>
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

      {/* Header with metronome */}
      <div className="bg-gray-800 p-4 border-b border-gray-600">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Sequential Practice
            {!hasStarted ? (
              <span className="text-blue-400 text-sm font-normal animate-pulse">
                🎵 Play the first note to start
              </span>
            ) : isCompleted ? (
              <span className="text-green-400 text-sm font-normal">
                ✅ Song Complete!
              </span>
            ) : null}
          </h3>
          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
            {/* Metronome */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">♩ = {tempo}</span>
              <div 
                className={`w-6 h-6 rounded-full transition-all duration-100 ${
                  !hasStarted
                    ? 'bg-blue-500 opacity-50'
                    : isCompleted
                      ? 'bg-green-500 opacity-70'
                      : metronomeIntensity > 0.8 ? 'bg-yellow-400 scale-125' : 'bg-yellow-600'
                }`}
                style={{
                  opacity: !hasStarted || isCompleted ? 0.5 : 0.3 + (metronomeIntensity * 0.7),
                  transform: !hasStarted || isCompleted ? 'scale(1)' : `scale(${1 + metronomeIntensity * 0.25})`
                }}
              />
              <span className="text-xs text-gray-500">
                Beat {Math.floor(currentBeat) + 1}
                {!hasStarted && <span className="text-blue-400 ml-1">(WAITING)</span>}
                {hasStarted && isCompleted && <span className="text-green-400 ml-1">(COMPLETE)</span>}
              </span>
            </div>
            
            {/* Progress */}
            <div className="text-sm text-gray-300 text-right min-w-[60px]">
              {currentNoteIndex + 1} / {sequence.length}
            </div>
          </div>
        </div>
      </div>

      {loopModeActive && (
        <div className="bg-indigo-950/40 border-b border-indigo-700/40 px-4 py-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs">
            <span className="text-indigo-100">
              Loop notes: {loopNotesText}
            </span>
            <span className="text-indigo-300">Change Selection: click a note, then Shift-click another</span>
          </div>
        </div>
      )}

      {/* Main practice area - Horizontally scrollable note layout */}
      <div 
        ref={containerRef}
        className="relative bg-gray-900 p-6 overflow-x-auto overflow-y-hidden"
        style={{ minHeight: '400px' }}
      >
        {/* Horizontally arranged practice notes */}
        <div className="flex gap-6 items-start" style={{ minWidth: 'max-content' }}>
          {sequence.map((noteItem, index) => {
            const isCurrentNote = index === currentNoteIndex;
            const isCompleted = completedNotes.has(index);
            const showGreenFeedback = correctNoteFeedback.has(index);
            const showRedFeedback = incorrectNoteFeedback.has(index);
            const isPastNote = index < currentNoteIndex;
            const isSelectionAnchor = selectionAnchorIndex === index;
            const isInPreviewRange = previewRange !== null && index >= previewRange.start && index <= previewRange.end;
            
            return (
              <div
                key={index}
                data-note-index={index}
                role="button"
                tabIndex={0}
                onClick={(event) => handleNoteClick(index, event)}
                onMouseEnter={(event) => handleNoteMouseEnter(index, event)}
                title="Click to set loop start. Shift-click another note to complete selection."
                className={`flex flex-col items-center transition-all duration-500 p-4 rounded-lg flex-shrink-0 ${
                  showRedFeedback
                    ? 'bg-red-600 ring-4 ring-red-400 shadow-lg scale-110'
                    : isCurrentNote
                      ? 'bg-blue-600 ring-4 ring-yellow-400 shadow-lg scale-110'
                      : isSelectionAnchor
                        ? 'bg-gray-800 ring-1 ring-indigo-300'
                        : isInPreviewRange
                          ? 'bg-indigo-900/45'
                      : isPastNote || isCompleted
                        ? 'bg-gray-700 opacity-60'
                        : 'bg-gray-800'
                } cursor-pointer`}
                style={{ minWidth: '140px' }}
              >
                <div className="flex flex-col items-center gap-2 mb-2">
                  {/* Note name */}
                  <div className={`text-sm font-medium px-3 py-1 rounded shadow-md ${
                    showRedFeedback
                      ? 'bg-red-500 text-white border-2 border-red-300'
                      : isCurrentNote 
                        ? 'bg-yellow-500 text-black border-2 border-yellow-300' 
                        : isPastNote || isCompleted
                          ? 'bg-gray-700 text-gray-400 border border-gray-600'
                          : 'bg-gray-600 text-white border border-gray-500'
                  }`}>
                    <span className={noteItem.note >= 74 ? 'border-b-2 border-orange-400' : ''}>
                      {midiNoteToName(noteItem.note)}
                    </span>
                  </div>

                  <StaffNoteDisplay note={noteItem.note} />
                </div>

                {/* Fingering chart */}
                <div className={`transition-all duration-500 ${
                  showGreenFeedback
                    ? 'bg-green-500 p-3 rounded-lg shadow-lg scale-110 border-2 border-green-300'
                    : showRedFeedback
                      ? 'bg-red-500 p-3 rounded-lg shadow-lg scale-110 border-2 border-red-300'
                      : isCurrentNote
                        ? 'bg-blue-600 p-3 rounded-lg shadow-lg'
                        : isPastNote || isCompleted
                          ? 'opacity-40 filter grayscale bg-gray-800 p-2 rounded'
                          : 'bg-gray-700 p-2 rounded border border-gray-600'
                }`}>
                  {renderFingeringChart(noteItem.note, isCurrentNote ? 'large' : 'small')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer with instructions */}
      <div className="bg-gray-800 p-3 border-t border-gray-600">
        <div className="text-sm text-gray-300 text-center">
          🎵 Play each note in sequence • Practice at your own pace
          <div className="mt-2 text-xs text-gray-400">
            Tip: Click a note, then Shift-click another note to loop a section.
            <button
              onClick={() => setShowHelpDetails(prev => !prev)}
              className="ml-2 text-blue-300 hover:text-blue-200 underline underline-offset-2"
            >
              {showHelpDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>
          {showHelpDetails && (
            <div className="mt-1 text-xs text-gray-500">
              Practice view keeps current note centered • Incorrect notes auto-recover after 1 second
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
