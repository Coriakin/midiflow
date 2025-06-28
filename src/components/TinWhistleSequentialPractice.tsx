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
 * Sequential tin whistle practice with timeline and metronome
 * Notes are spaced according to musical timing with smooth scrolling
 */
export const TinWhistleSequentialPractice: React.FC<SequentialPracticeProps> = ({
  sequence,
  currentNoteIndex,
  tempo,
  isCorrectNote,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [metronomePosition, setMetronomePosition] = useState(0);
  const [completedNotes, setCompletedNotes] = useState<Set<number>>(new Set());
  const [correctNoteFeedback, setCorrectNoteFeedback] = useState<Set<number>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate pixels per beat based on tempo
  const beatsPerSecond = tempo / 60;
  const pixelsPerBeat = 120; // Adjust this to control note spacing
  const pixelsPerSecond = pixelsPerBeat * beatsPerSecond;

  // Calculate song end time (last note start + duration)
  const songEndTime = sequence.length > 0 
    ? sequence[sequence.length - 1].startTime + sequence[sequence.length - 1].duration 
    : 0;
  const maxTimelinePosition = songEndTime * pixelsPerBeat;

  // Calculate vertical offsets for overlapping notes to prevent stacking
  const calculateNotePositions = (sequence: NoteWithTiming[]) => {
    const positions: Array<{ horizontalPos: number; verticalOffset: number }> = [];
    const stackHeight = 140; // pixels between stacked notes for better separation
    const noteVisualWidth = 120; // actual visual width of a note (fingering chart + padding)
    const minOverlapThreshold = 40; // minimum overlap in pixels to trigger stacking
    
    sequence.forEach((noteItem, index) => {
      const horizontalPos = noteItem.startTime * pixelsPerBeat;
      let verticalOffset = 0;
      
      // Check for visual collisions with previous notes
      for (let i = 0; i < index; i++) {
        const prevNote = sequence[i];
        const prevHorizontalPos = prevNote.startTime * pixelsPerBeat;
        
        // Calculate the visual overlap between note centers
        const distance = Math.abs(horizontalPos - prevHorizontalPos);
        
        // Only stack if notes are visually too close (would overlap significantly)
        if (distance < noteVisualWidth && distance < minOverlapThreshold) {
          // Check if this position would conflict with the previous note's vertical position
          if (positions[i].verticalOffset === verticalOffset) {
            verticalOffset = positions[i].verticalOffset + stackHeight;
          }
        }
      }
      
      positions.push({ horizontalPos, verticalOffset });
    });
    
    return positions;
  };

  const notePositions = calculateNotePositions(sequence);

  // Timeline animation
  useEffect(() => {
    let animationFrame: number;
    let startTime: number | null = null;
    let accumulatedTime = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      // Only animate if we've started, are not paused, and haven't completed
      if (hasStarted && !isPaused && !isCompleted) {
        const elapsed = (timestamp - startTime) / 1000; // seconds
        const totalElapsed = accumulatedTime + elapsed;

        // Calculate current timeline position
        const newPosition = Math.min(totalElapsed * pixelsPerSecond, maxTimelinePosition);
        setTimelinePosition(newPosition);

        // Calculate metronome position
        setMetronomePosition(newPosition);

        // Check if we've reached the end
        if (newPosition >= maxTimelinePosition) {
          setIsCompleted(true);
        }
      } else if (isPaused) {
        // When paused, update accumulated time and reset start time
        accumulatedTime = pausedTime;
        startTime = timestamp;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      // Clean up any existing pause timeout
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, [tempo, pixelsPerSecond, beatsPerSecond, isPaused, pausedTime, hasStarted, isCompleted, maxTimelinePosition]);

  // Reset state when sequence changes
  useEffect(() => {
    setHasStarted(false);
    setIsPaused(false);
    setIsCompleted(false);
    setPausedTime(0);
    setTimelinePosition(0);
    setMetronomePosition(0);
    setCompletedNotes(new Set());
    setCorrectNoteFeedback(new Set());
  }, [sequence]);
  useEffect(() => {
    if (currentNoteIndex < sequence.length && containerRef.current) {
      const currentNote = sequence[currentNoteIndex];
      const notePosition = currentNote.startTime * pixelsPerBeat;
      const containerWidth = containerRef.current.clientWidth;
      const scrollTarget = Math.max(0, notePosition - containerWidth / 3); // Keep note in left third

      containerRef.current.scrollTo({
        left: scrollTarget,
        behavior: 'smooth'
      });
    }
  }, [currentNoteIndex, sequence, pixelsPerBeat]);

  // Handle correct note feedback timing
  useEffect(() => {
    if (isCorrectNote === true && currentNoteIndex >= 0) {
      // Start the timeline if this is the first note
      if (!hasStarted) {
        setHasStarted(true);
      }

      // Clear any existing pause timeout
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }

      // Resume timeline if it was paused
      if (isPaused) {
        setIsPaused(false);
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
      // Incorrect note played - only pause if we've already started
      if (hasStarted && !isPaused) {
        setPausedTime(timelinePosition / pixelsPerSecond);
        setIsPaused(true);
      }

      // Set a timeout to auto-resume after 3 seconds if no correct note is played
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      
      pauseTimeoutRef.current = setTimeout(() => {
        setIsPaused(false);
        pauseTimeoutRef.current = null;
      }, 3000);
    }
  }, [isCorrectNote, currentNoteIndex, isPaused, timelinePosition, pixelsPerSecond, hasStarted]);

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

  // Calculate metronome pulse intensity
  const getCurrentBeat = () => {
    if (!hasStarted || isPaused || isCompleted) {
      return pausedTime * beatsPerSecond;
    }
    const currentTime = timelinePosition / pixelsPerSecond;
    return currentTime * beatsPerSecond;
  };

  const currentBeat = getCurrentBeat();
  const metronomeIntensity = (!hasStarted || isPaused || isCompleted) ? 0 : Math.abs(Math.sin((currentBeat % 1) * Math.PI));

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
            ) : isPaused ? (
              <span className="text-red-400 text-sm font-normal animate-pulse">
                ⏸️ PAUSED - Play correct note to continue
              </span>
            ) : null}
          </h3>
          <div className="flex items-center space-x-4">
            {/* Metronome */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-300">♩ = {tempo}</span>
              <div 
                className={`w-6 h-6 rounded-full transition-all duration-100 ${
                  !hasStarted
                    ? 'bg-blue-500 opacity-50'
                    : isCompleted
                      ? 'bg-green-500 opacity-70'
                      : isPaused 
                        ? 'bg-red-500 opacity-50'
                        : metronomeIntensity > 0.8 ? 'bg-yellow-400 scale-125' : 'bg-yellow-600'
                }`}
                style={{
                  opacity: !hasStarted || isPaused || isCompleted ? 0.5 : 0.3 + (metronomeIntensity * 0.7),
                  transform: !hasStarted || isPaused || isCompleted ? 'scale(1)' : `scale(${1 + metronomeIntensity * 0.25})`
                }}
              />
              <span className="text-xs text-gray-500">
                Beat {Math.floor(currentBeat) + 1}
                {!hasStarted && <span className="text-blue-400 ml-1">(WAITING)</span>}
                {hasStarted && isCompleted && <span className="text-green-400 ml-1">(COMPLETE)</span>}
                {hasStarted && isPaused && !isCompleted && <span className="text-red-400 ml-1">(PAUSED)</span>}
              </span>
            </div>
            {/* Progress */}
            <div className="text-sm text-gray-300">
              {currentNoteIndex + 1} / {sequence.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main practice area */}
      <div 
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-auto bg-gray-900"
        style={{ height: '500px', scrollBehavior: 'smooth' }}
      >
        {/* Timeline background */}
        <div className="absolute top-0 left-0 h-full bg-gray-800 border-b border-gray-600" 
             style={{ width: `${maxTimelinePosition + 200}px`, minHeight: '500px' }}>
          
          {/* Beat markers */}
          {Array.from({ length: Math.ceil(songEndTime) + 2 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 border-l border-gray-600 opacity-30"
              style={{ left: `${i * pixelsPerBeat}px`, height: '100%' }}
            >
              <div className="text-xs text-gray-500 mt-1 ml-1">{i + 1}</div>
            </div>
          ))}

          {/* Timeline progress line */}
          <div
            className={`absolute top-0 w-1 shadow-lg transition-colors duration-300 ${
              !hasStarted 
                ? 'bg-blue-500' 
                : isCompleted
                  ? 'bg-green-500'
                  : isPaused 
                    ? 'bg-red-500' 
                    : 'bg-cyan-400'
            }`}
            style={{
              left: `${timelinePosition}px`,
              height: '100%',
              boxShadow: !hasStarted
                ? '0 0 10px rgba(59, 130, 246, 0.6)'
                : isCompleted
                  ? '0 0 10px rgba(34, 197, 94, 0.6)'
                  : isPaused 
                    ? '0 0 10px rgba(239, 68, 68, 0.6)' 
                    : '0 0 10px rgba(34, 211, 238, 0.6)'
            }}
          />

          {/* Notes */}
          <div className="absolute top-12 left-0 right-0" style={{ minHeight: '450px' }}>
            {sequence.map((noteItem, index) => {
              const isCurrentNote = index === currentNoteIndex;
              const isCompleted = completedNotes.has(index);
              const showGreenFeedback = correctNoteFeedback.has(index);
              const isPastNote = index < currentNoteIndex;
              const position = notePositions[index];
              const isStacked = position.verticalOffset > 0;
              
              return (
                <div
                  key={index}
                  className={`absolute flex flex-col items-center transition-all duration-300 ${
                    isStacked ? 'border-l-2 border-blue-400 pl-1' : ''
                  }`}
                  style={{ 
                    left: `${position.horizontalPos}px`,
                    top: `${position.verticalOffset}px`
                  }}
                >
                  {/* Stack indicator only for actually stacked notes */}
                  {isStacked && (
                    <div className="text-xs text-blue-300 mb-1 bg-blue-900 bg-opacity-50 px-1 py-0.5 rounded text-center">
                      ↕ {Math.floor(position.verticalOffset / 140) + 1}
                    </div>
                  )}

                  {/* Note name */}
                  <div className={`text-sm font-medium mb-2 px-3 py-1 rounded shadow-md ${
                    isCurrentNote 
                      ? 'bg-yellow-500 text-black border-2 border-yellow-300' 
                      : isPastNote || isCompleted
                        ? 'bg-gray-700 text-gray-400 border border-gray-600'
                        : 'bg-gray-600 text-white border border-gray-500'
                  }`}>
                    {midiNoteToName(noteItem.note)}
                  </div>

                  {/* Fingering chart */}
                  <div className={`transition-all duration-500 ${
                    showGreenFeedback
                      ? 'bg-green-500 p-3 rounded-lg shadow-lg scale-110 border-2 border-green-300'
                      : isCurrentNote
                        ? 'bg-blue-600 p-3 rounded-lg shadow-lg ring-4 ring-yellow-400'
                        : isPastNote || isCompleted
                          ? 'opacity-40 filter grayscale bg-gray-800 p-2 rounded'
                          : 'bg-gray-700 p-2 rounded border border-gray-600'
                  }`}>
                    {renderFingeringChart(noteItem.note, isCurrentNote ? 'large' : 'small')}
                  </div>

                  {/* Duration indicator */}
                  <div 
                    className={`mt-3 h-2 rounded shadow-sm ${
                      isPastNote || isCompleted ? 'bg-gray-600' : 'bg-blue-400'
                    }`}
                    style={{ width: `${Math.max(noteItem.duration * pixelsPerBeat, 80)}px` }}
                  />

                  {/* Note timing info - only show for stacked or current notes to reduce clutter */}
                  {(isStacked || isCurrentNote) && (
                    <div className="text-xs text-gray-400 mt-1">
                      {noteItem.startTime.toFixed(1)}s
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current metronome beat indicator */}
          <div
            className="absolute top-2 w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              left: `${metronomePosition}px`,
              opacity: metronomeIntensity,
              transform: `scale(${1 + metronomeIntensity})`
            }}
          />
        </div>
      </div>

      {/* Footer with instructions */}
      <div className="bg-gray-800 p-3 border-t border-gray-600">
        <div className="text-sm text-gray-300 text-center">
          🎵 Play the first note to start the timeline • ⏱️ Timeline pauses on wrong notes
          <br />
          <span className="text-xs text-gray-400">
            Follow the moving timeline and play when it reaches each note • Metronome helps you keep time
          </span>
        </div>
      </div>
    </div>
  );
};
