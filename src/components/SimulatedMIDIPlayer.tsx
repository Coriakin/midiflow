/**
 * SimulatedMIDIPlayer Component
 * 
 * This development tool simulates MIDI input for debugging Sequential Practice functionality
 * without requiring a real MIDI controller. It appears above the Practice Area in development mode.
 * 
 * Features:
 * - Adjustable playback speed (0.25x to 2.0x, with 0.25x as normal)
 * - Configurable failure rate (0-100%) to simulate wrong notes
 * - Start, Stop, Pause, Resume, and Restart controls
 * - Automatic sequence detection from current practice session
 * - Real-time progress tracking with next note preview
 * 
 * Usage:
 * 1. Start a practice session by selecting a song
 * 2. Expand the simulator controls if collapsed
 * 3. Adjust speed and failure rate as needed
 * 4. Click "Start" to begin automatic note playback
 * 5. The simulator will inject MIDI events just like a real controller
 * 
 * The simulator is completely isolated and only communicates through the standard
 * MIDI message handler, making it a drop-in replacement for real MIDI input.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { MIDIMessage } from '../types/midi';
import { midiNoteToName } from '../types/midi';

interface SimulatedPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  speedMultiplier: number; // 1.0 = normal speed, 0.5 = half speed, etc.
  failureRate: number; // 0-100, percentage chance of playing wrong note
  sequence: number[];
  lastPlayedIndex: number; // Track the last index we played
}

type TimedNote = {
  note: number;
  startTime: number;
  duration: number;
};

interface SimulatedMIDIPlayerProps {
  onMIDIMessage: (message: MIDIMessage) => void;
  practiceSequence: number[];
  timedSequence?: TimedNote[];
  currentNoteIndex?: number; // Add this to sync with app state
  tempo?: number; // BPM for timing calculations
  isVisible?: boolean;
  playSound: boolean;
  onPlaySoundChange: (enabled: boolean) => void;
  onSimulatedNotePlayed?: (note: number, velocity?: number) => void;
  onRestartFromBeginning?: () => void;
  onTransportStateChange?: (state: 'playing' | 'paused' | 'stopped') => void;
  onSpeedMultiplierChange?: (multiplier: number) => void;
}

/**
 * Simulated MIDI player for debugging Sequential Practice
 * Injects fake MIDI messages into the application without requiring a real MIDI controller
 */
export const SimulatedMIDIPlayer: React.FC<SimulatedMIDIPlayerProps> = ({
  onMIDIMessage,
  practiceSequence,
  timedSequence = [],
  currentNoteIndex = 0,
  tempo = 120,
  isVisible = true,
  playSound,
  onPlaySoundChange,
  onSimulatedNotePlayed,
  onRestartFromBeginning,
  onTransportStateChange,
  onSpeedMultiplierChange
}) => {
  const [playerState, setPlayerState] = useState<SimulatedPlayerState>({
    isPlaying: false,
    isPaused: false,
    speedMultiplier: 1,
    failureRate: 0,
    sequence: [],
    lastPlayedIndex: -1
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const playerStateRef = useRef(playerState);
  const transportStartMsRef = useRef<number | null>(null);
  const transportPausedAtMsRef = useRef<number | null>(null);
  const transportAccumulatedPauseMsRef = useRef<number>(0);
  const correctionStallActiveRef = useRef<boolean>(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  useEffect(() => {
    if (!onTransportStateChange) {
      return;
    }

    if (playerState.isPlaying) {
      onTransportStateChange('playing');
      return;
    }

    onTransportStateChange(playerState.isPaused ? 'paused' : 'stopped');
  }, [playerState.isPlaying, playerState.isPaused, onTransportStateChange]);

  useEffect(() => {
    onSpeedMultiplierChange?.(playerState.speedMultiplier);
  }, [playerState.speedMultiplier, onSpeedMultiplierChange]);

  const sendMIDINote = useCallback((midiNote: number, velocity: number = 80) => {
    const timestamp = performance.now();
    
    // Send note on
    const noteOnMessage: MIDIMessage = {
      type: 'noteon',
      note: midiNote,
      velocity,
      timestamp
    };
    
    onMIDIMessage(noteOnMessage);
    
    // Send note off after a short duration (150ms)
    setTimeout(() => {
      const noteOffMessage: MIDIMessage = {
        type: 'noteoff',
        note: midiNote,
        velocity: 0,
        timestamp: performance.now()
      };
      onMIDIMessage(noteOffMessage);
    }, 150);
  }, [onMIDIMessage]);

  const resetTransportClock = useCallback(() => {
    transportStartMsRef.current = null;
    transportPausedAtMsRef.current = null;
    transportAccumulatedPauseMsRef.current = 0;
    correctionStallActiveRef.current = false;
  }, []);

  const startTransportClock = useCallback(() => {
    transportStartMsRef.current = performance.now();
    transportPausedAtMsRef.current = null;
    transportAccumulatedPauseMsRef.current = 0;
  }, []);

  const pauseTransportClock = useCallback(() => {
    if (transportStartMsRef.current === null || transportPausedAtMsRef.current !== null) {
      return;
    }
    transportPausedAtMsRef.current = performance.now();
  }, []);

  const resumeTransportClock = useCallback(() => {
    if (transportPausedAtMsRef.current === null) {
      return;
    }
    const now = performance.now();
    transportAccumulatedPauseMsRef.current += Math.max(0, now - transportPausedAtMsRef.current);
    transportPausedAtMsRef.current = null;
  }, []);

  const getTransportElapsedMs = useCallback((now: number) => {
    if (transportStartMsRef.current === null) {
      return 0;
    }
    const activePauseMs = transportPausedAtMsRef.current !== null
      ? Math.max(0, now - transportPausedAtMsRef.current)
      : 0;
    return Math.max(
      0,
      now - transportStartMsRef.current - transportAccumulatedPauseMsRef.current - activePauseMs
    );
  }, []);

  // Update sequence when practiceSequence changes
  useEffect(() => {
    const sequenceChanged = JSON.stringify(practiceSequence) !== JSON.stringify(playerState.sequence);
    if (!sequenceChanged) {
      return;
    }

    console.log(`🎭 Simulator: Updating sequence from:`, playerState.sequence.slice(0, 10).map(note => `${midiNoteToName(note)}(${note})`));
    console.log(`🎭 Simulator: Updating sequence to:`, practiceSequence.slice(0, 10).map(note => `${midiNoteToName(note)}(${note})`));
    console.log(`🎭 Simulator: Full new sequence:`, practiceSequence.map(note => `${midiNoteToName(note)}(${note})`));

    if (practiceSequence.length === 0) {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      resetTransportClock();
    }

    setPlayerState(prev => ({
      ...prev,
      sequence: [...practiceSequence],
      lastPlayedIndex: -1,
      ...(practiceSequence.length === 0 ? { isPlaying: false, isPaused: false } : {})
    }));
  }, [practiceSequence, playerState.sequence, resetTransportClock]);

  const getRandomWrongNote = useCallback((correctNote: number): number => {
    // Generate a random note that's not the correct one, within tin whistle range
    const tinWhistleNotes = [62, 64, 65, 66, 67, 69, 71, 72, 74, 76, 77, 78, 79, 81, 83, 84];
    const availableNotes = tinWhistleNotes.filter(note => note !== correctNote);
    const randomIndex = Math.floor(Math.random() * availableNotes.length);
    return availableNotes[randomIndex];
  }, []);

  const playCurrentNote = useCallback((forceReplay: boolean = false) => {
    const currentState = playerStateRef.current;
    const sequence = currentState.sequence;
    
    console.log(`🎭 Simulator: playCurrentNote called - app index: ${currentNoteIndex}, last played: ${currentState.lastPlayedIndex}, sequence length: ${sequence.length}`);
    
    // Only play if the index has changed since last time
    if (!forceReplay && currentNoteIndex === currentState.lastPlayedIndex) {
      console.log(`🎭 Simulator: Skipping - already played index ${currentNoteIndex}`);
      return;
    }
    
    if (sequence.length === 0 || currentNoteIndex >= sequence.length) {
      // End of sequence, stop playing
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      console.log('🎭 Simulator: Sequence completed, stopping');
      return;
    }

    const targetNote = sequence[currentNoteIndex];
    let noteToPlay = targetNote;
    
    console.log(`🎭 Simulator: At app index ${currentNoteIndex}, sequence says play ${midiNoteToName(targetNote)} (${targetNote})`);

    // Apply failure rate - chance to play wrong note
    if (currentState.failureRate > 0) {
      const randomChance = Math.random() * 100;
      if (randomChance < currentState.failureRate) {
        noteToPlay = getRandomWrongNote(targetNote);
        console.log(`🎭 Simulator: Playing wrong note ${midiNoteToName(noteToPlay)} instead of ${midiNoteToName(targetNote)} (${currentState.failureRate}% failure rate)`);
      }
    }

    console.log(`🎭 Simulator: Playing note ${midiNoteToName(noteToPlay)} (${noteToPlay}) at app index ${currentNoteIndex}${noteToPlay !== targetNote ? ` [WRONG: expected ${midiNoteToName(targetNote)}]` : ''}`);

    // Wrong-note retries should not advance transport time for future notes.
    if (noteToPlay !== targetNote) {
      pauseTransportClock();
      correctionStallActiveRef.current = true;
    } else if (correctionStallActiveRef.current) {
      resumeTransportClock();
      correctionStallActiveRef.current = false;
    }

    const velocity = 80;
    sendMIDINote(noteToPlay, velocity);
    onSimulatedNotePlayed?.(noteToPlay, velocity);

    // Update the last played index
    setPlayerState(prev => ({ ...prev, lastPlayedIndex: currentNoteIndex }));
  }, [sendMIDINote, getRandomWrongNote, currentNoteIndex, onSimulatedNotePlayed, pauseTransportClock, resumeTransportClock]);

  // Auto-play when currentNoteIndex changes (if simulator is active)
  useEffect(() => {
    if (playerState.isPlaying && currentNoteIndex !== playerState.lastPlayedIndex) {
      console.log(`🎭 Simulator: Index changed from ${playerState.lastPlayedIndex} to ${currentNoteIndex}, auto-playing note`);
      
      // Delay is computed from absolute transport time to prevent cumulative drift.
      const quarterNoteMs = (60 * 1000) / Math.max(tempo, 1);
      const expectedStartBeat = timedSequence[currentNoteIndex]?.startTime ?? currentNoteIndex;
      const expectedElapsedMs = (expectedStartBeat * quarterNoteMs) / Math.max(playerState.speedMultiplier, 0.05);
      const elapsedMs = getTransportElapsedMs(performance.now());
      const delayMs = Math.max(0, expectedElapsedMs - elapsedMs);

      console.log(`🎭 Simulator: Scheduling in ${delayMs}ms (expected=${expectedElapsedMs}ms elapsed=${elapsedMs}ms)`);

      const timeoutId = setTimeout(() => {
        if (playerStateRef.current.isPlaying) {
          playCurrentNote();
        }
      }, delayMs);

      intervalRef.current = timeoutId;

      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [currentNoteIndex, playerState.isPlaying, playerState.lastPlayedIndex, playerState.speedMultiplier, tempo, timedSequence, playCurrentNote, getTransportElapsedMs]);

  // Retry the same note when the index does not advance (e.g., wrong fingering at non-zero failure rate).
  useEffect(() => {
    if (!playerState.isPlaying) {
      return;
    }

    if (currentNoteIndex !== playerState.lastPlayedIndex) {
      return;
    }

    const quarterNoteMs = (60 * 1000) / Math.max(tempo, 1);
    const retryDelayMs = Math.max(120, Math.min(900, (quarterNoteMs * 0.5) / Math.max(playerState.speedMultiplier, 0.05)));

      const timeoutId = setTimeout(() => {
        if (playerStateRef.current.isPlaying && currentNoteIndex === playerStateRef.current.lastPlayedIndex) {
          playCurrentNote(true);
        }
      }, retryDelayMs);

    retryTimerRef.current = timeoutId;

    return () => {
      clearTimeout(timeoutId);
      if (retryTimerRef.current === timeoutId) {
        retryTimerRef.current = null;
      }
    };
  }, [playerState.isPlaying, playerState.lastPlayedIndex, currentNoteIndex, tempo, playerState.speedMultiplier, playCurrentNote]);

  const startPlaying = useCallback(() => {
    const currentState = playerStateRef.current;
    if (currentState.sequence.length === 0) {
      console.warn('🎭 Simulator: No sequence to play');
      return;
    }

    console.log(`🎭 Simulator: Starting simulator at tempo ${tempo} BPM`);
    startTransportClock();
    setPlayerState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      isPaused: false,
      lastPlayedIndex: -1 // Reset to trigger first note
    }));
    
    // The auto-play effect will handle playing notes when currentNoteIndex changes
  }, [tempo, startTransportClock]);

  const stopPlaying = useCallback(() => {
    resetTransportClock();
    setPlayerState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false,
      lastPlayedIndex: -1 // Reset for next time
    }));
    
    // Clear any pending timeout
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [resetTransportClock]);

  const pausePlaying = useCallback(() => {
    pauseTransportClock();
    correctionStallActiveRef.current = false;
    setPlayerState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    
    // Clear any pending timeout
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [pauseTransportClock]);

  const resumePlaying = useCallback(() => {
    resumeTransportClock();
    correctionStallActiveRef.current = false;
    setPlayerState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
  }, [resumeTransportClock]);

  const restartPlaying = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    // Stop immediately, reset app sequence index, then start from beginning.
    setPlayerState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      lastPlayedIndex: -1
    }));
    resetTransportClock();

    onRestartFromBeginning?.();

    restartTimerRef.current = setTimeout(() => {
      startTransportClock();
      setPlayerState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
        lastPlayedIndex: -1
      }));
      restartTimerRef.current = null;
    }, 0);
  }, [onRestartFromBeginning, resetTransportClock, startTransportClock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`mac-panel p-4 mb-4 ${
      playerState.isPlaying 
        ? 'border-blue-400/50 shadow-lg shadow-blue-500/20' 
        : 'border-gray-600'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
            <span className={`text-lg font-bold mr-2 ${
            playerState.isPlaying ? 'text-blue-200 animate-pulse' : 'text-blue-300'
          }`}>Dev</span>
          <h3 className="text-white font-semibold">Simulated MIDI Player</h3>
          <span className="ml-2 text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded">
            DEBUG TOOL
          </span>
          {playerState.isPlaying && (
            <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded animate-pulse">
              ACTIVE
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-300 hover:text-white text-sm"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Speed Control */}
            <div>
              <label className="block text-gray-300 text-sm mb-1">Speed</label>
              <select
                value={playerState.speedMultiplier}
                onChange={(e) => setPlayerState(prev => ({ ...prev, speedMultiplier: parseFloat(e.target.value) }))}
                className="mac-select text-sm"
                disabled={playerState.isPlaying}
              >
                <option value={0.5}>0.5x (Very Slow)</option>
                <option value={0.75}>0.75x (Slow)</option>
                <option value={1}>1x (Normal)</option>
                <option value={1.5}>1.5x (Slightly Fast)</option>
                <option value={2}>2x (Fast)</option>
                <option value={4}>4x (Very Fast)</option>
                <option value={6}>6x (Extremely Fast)</option>
              </select>
            </div>

            {/* Failure Rate Control */}
            <div>
              <label className="block text-gray-300 text-sm mb-1">
                Failure Rate: {playerState.failureRate}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={playerState.failureRate}
                onChange={(e) => setPlayerState(prev => ({ ...prev, failureRate: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={playSound}
                onChange={(e) => onPlaySoundChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-400"
              />
              Play sound
            </label>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={startPlaying}
              disabled={playerState.isPlaying || playerState.sequence.length === 0}
              className="mac-button mac-button-success disabled:opacity-60 text-sm font-medium"
            >
              Start
            </button>
            
            <button
              onClick={pausePlaying}
              disabled={!playerState.isPlaying}
              className="mac-button disabled:opacity-60 text-sm font-medium"
            >
              Pause
            </button>
            
            <button
              onClick={resumePlaying}
              disabled={!playerState.isPaused}
              className="mac-button mac-button-primary disabled:opacity-60 text-sm font-medium"
            >
              Resume
            </button>
            
            <button
              onClick={stopPlaying}
              disabled={!playerState.isPlaying && !playerState.isPaused}
              className="mac-button mac-button-danger disabled:opacity-60 text-sm font-medium"
            >
              Stop
            </button>
            
            <button
              onClick={restartPlaying}
              disabled={playerState.sequence.length === 0}
              className="mac-button disabled:opacity-60 text-sm font-medium"
            >
              Restart
            </button>
          </div>

          <div className="text-sm text-gray-200">
            <div className="flex justify-between items-center">
              <span>
                Progress: {currentNoteIndex} / {playerState.sequence.length}
                {playerState.sequence.length > 0 && (
                  <span className="ml-2">
                    (Next: {currentNoteIndex < playerState.sequence.length 
                      ? midiNoteToName(playerState.sequence[currentNoteIndex])
                      : 'Complete'})
                  </span>
                )}
              </span>
              <span className="text-xs">
                Status: {playerState.isPlaying ? 'Playing' : playerState.isPaused ? 'Paused' : 'Stopped'}
              </span>
            </div>
          </div>

          {playerState.sequence.length === 0 && (
            <div className="text-yellow-300 text-sm mt-2">
              No practice sequence loaded. Start a practice session to enable simulation.
            </div>
          )}
        </>
      )}
    </div>
  );
};
