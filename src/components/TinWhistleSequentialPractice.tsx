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
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [completedNotes, setCompletedNotes] = useState<Set<number>>(new Set());
  const [correctNoteFeedback, setCorrectNoteFeedback] = useState<Set<number>>(new Set());
  const [incorrectNoteFeedback, setIncorrectNoteFeedback] = useState<Set<number>>(new Set());
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);  // Calculate vertical offsets for overlapping notes to prevent stacking (removed - no longer needed)
  // We'll use a simple grid layout instead

  // Reset state when sequence changes
  useEffect(() => {
    setHasStarted(false);
    setIsCompleted(false);
    setCompletedNotes(new Set());
    setCorrectNoteFeedback(new Set());
    setIncorrectNoteFeedback(new Set());
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

  return (
    <div className={`relative bg-gray-900 rounded-lg border border-gray-600 overflow-hidden ${className}`}>
      {/* Header with metronome */}
      <div className="bg-gray-800 p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center space-x-6">
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
            <div className="text-sm text-gray-300">
              {currentNoteIndex + 1} / {sequence.length}
            </div>
          </div>
        </div>
      </div>

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
            
            return (
              <div
                key={index}
                data-note-index={index}
                className={`flex flex-col items-center transition-all duration-500 p-4 rounded-lg flex-shrink-0 ${
                  showRedFeedback
                    ? 'bg-red-600 ring-4 ring-red-400 shadow-lg scale-110'
                    : isCurrentNote
                      ? 'bg-blue-600 ring-4 ring-yellow-400 shadow-lg scale-110'
                      : isPastNote || isCompleted
                        ? 'bg-gray-700 opacity-60'
                        : 'bg-gray-800'
                }`}
                style={{ minWidth: '140px' }}
              >
                {/* Note name */}
                <div className={`text-sm font-medium mb-2 px-3 py-1 rounded shadow-md ${
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

                {/* Note sequence position */}
                <div className="text-xs text-gray-400 mt-2">
                  {index + 1} / {sequence.length}
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
          <br />
          <span className="text-xs text-gray-400">
            Practice view automatically scrolls to keep current note centered • Incorrect notes auto-recover after 1 second
          </span>
        </div>
      </div>
    </div>
  );
};
