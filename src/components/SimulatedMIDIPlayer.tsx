/**
 * SimulatedMIDIPlayer Component
 * 
 * This development tool simulates MIDI input for debugging Sequential Practice functionality
 * without requiring a real MIDI controller. It appears above the Practice Area in development mode.
 * 
 * Features:
 * - Adjustable playback speed (0.25x to 2.0x)
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
  speed: number; // 1.0 = normal speed, 0.5 = half speed, etc.
  failureRate: number; // 0-100, percentage chance of playing wrong note
  sequence: number[];
  lastPlayedIndex: number; // Track the last index we played
}

interface SimulatedMIDIPlayerProps {
  onMIDIMessage: (message: MIDIMessage) => void;
  practiceSequence: number[];
  currentNoteIndex?: number; // Add this to sync with app state
  tempo?: number; // BPM for timing calculations
  isVisible?: boolean;
}

/**
 * Simulated MIDI player for debugging Sequential Practice
 * Injects fake MIDI messages into the application without requiring a real MIDI controller
 */
export const SimulatedMIDIPlayer: React.FC<SimulatedMIDIPlayerProps> = ({
  onMIDIMessage,
  practiceSequence,
  currentNoteIndex = 0,
  tempo = 120,
  isVisible = true
}) => {
  const [playerState, setPlayerState] = useState<SimulatedPlayerState>({
    isPlaying: false,
    isPaused: false,
    speed: 1.0,
    failureRate: 0,
    sequence: [],
    lastPlayedIndex: -1
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerStateRef = useRef(playerState);
  const [isExpanded, setIsExpanded] = useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  // Update sequence when practiceSequence changes
  useEffect(() => {
    if (practiceSequence.length > 0 && JSON.stringify(practiceSequence) !== JSON.stringify(playerState.sequence)) {
      console.log(`🎭 Simulator: Updating sequence from:`, playerState.sequence.slice(0, 10).map(note => `${midiNoteToName(note)}(${note})`));
      console.log(`🎭 Simulator: Updating sequence to:`, practiceSequence.slice(0, 10).map(note => `${midiNoteToName(note)}(${note})`));
      console.log(`🎭 Simulator: Full new sequence:`, practiceSequence.map(note => `${midiNoteToName(note)}(${note})`));
      setPlayerState(prev => ({
        ...prev,
        sequence: [...practiceSequence],
        lastPlayedIndex: -1 // Reset when sequence changes
      }));
    }
  }, [practiceSequence, playerState.sequence]);

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

  const getRandomWrongNote = useCallback((correctNote: number): number => {
    // Generate a random note that's not the correct one, within tin whistle range
    const tinWhistleNotes = [62, 64, 65, 66, 67, 69, 71, 72, 74, 76, 77, 78, 79, 81, 83, 84];
    const availableNotes = tinWhistleNotes.filter(note => note !== correctNote);
    const randomIndex = Math.floor(Math.random() * availableNotes.length);
    return availableNotes[randomIndex];
  }, []);

  const playCurrentNote = useCallback(() => {
    const currentState = playerStateRef.current;
    const sequence = currentState.sequence;
    
    console.log(`🎭 Simulator: playCurrentNote called - app index: ${currentNoteIndex}, last played: ${currentState.lastPlayedIndex}, sequence length: ${sequence.length}`);
    
    // Only play if the index has changed since last time
    if (currentNoteIndex === currentState.lastPlayedIndex) {
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
    sendMIDINote(noteToPlay);

    // Update the last played index
    setPlayerState(prev => ({ ...prev, lastPlayedIndex: currentNoteIndex }));
  }, [sendMIDINote, getRandomWrongNote, currentNoteIndex]);

  // Auto-play when currentNoteIndex changes (if simulator is active)
  useEffect(() => {
    if (playerState.isPlaying && currentNoteIndex !== playerState.lastPlayedIndex) {
      console.log(`🎭 Simulator: Index changed from ${playerState.lastPlayedIndex} to ${currentNoteIndex}, auto-playing note`);
      
      // For the first note (when starting), play immediately
      // For subsequent notes, add a small delay to simulate human timing
      if (playerState.lastPlayedIndex === -1) {
        // First note - play immediately
        playCurrentNote();
      } else {
        // Subsequent notes - add timing delay
        const quarterNoteMs = (60 * 1000) / tempo;
        const delayMs = (quarterNoteMs / playerState.speed) * 0.25; // Quarter of a beat delay
        
        console.log(`🎭 Simulator: Adding ${delayMs}ms delay for note timing`);
        
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
    }
  }, [currentNoteIndex, playerState.isPlaying, playerState.lastPlayedIndex, playerState.speed, tempo, playCurrentNote]);

  const startPlaying = useCallback(() => {
    const currentState = playerStateRef.current;
    if (currentState.sequence.length === 0) {
      console.warn('🎭 Simulator: No sequence to play');
      return;
    }

    console.log(`🎭 Simulator: Starting simulator at tempo ${tempo} BPM`);
    setPlayerState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      isPaused: false,
      lastPlayedIndex: -1 // Reset to trigger first note
    }));
    
    // The auto-play effect will handle playing notes when currentNoteIndex changes
  }, [tempo]);

  const stopPlaying = useCallback(() => {
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
  }, []);

  const pausePlaying = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    
    // Clear any pending timeout
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resumePlaying = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
  }, []);

  const restartPlaying = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      lastPlayedIndex: -1 // Reset to trigger first note
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`border-2 rounded-lg p-4 mb-4 ${
      playerState.isPlaying 
        ? 'bg-purple-900 border-purple-400 shadow-lg shadow-purple-500/20' 
        : 'bg-purple-900 border-purple-500'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className={`text-lg font-bold mr-2 ${
            playerState.isPlaying ? 'text-purple-200 animate-pulse' : 'text-purple-300'
          }`}>🎭</span>
          <h3 className="text-white font-semibold">Simulated MIDI Player</h3>
          <span className="ml-2 text-xs bg-purple-700 text-purple-200 px-2 py-1 rounded">
            DEBUG TOOL
          </span>
          {playerState.isPlaying && (
            <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded animate-pulse">
              ▶ ACTIVE
            </span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-purple-300 hover:text-white text-sm"
        >
          {isExpanded ? '▼ Collapse' : '▶ Expand'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Speed Control */}
            <div>
              <label className="block text-purple-300 text-sm mb-1">Speed</label>
              <select
                value={playerState.speed}
                onChange={(e) => setPlayerState(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                className="w-full bg-purple-800 text-white border border-purple-600 rounded px-2 py-1 text-sm"
                disabled={playerState.isPlaying}
              >
                <option value={0.25}>0.25x (Very Slow)</option>
                <option value={0.5}>0.5x (Slow)</option>
                <option value={1.0}>1.0x (Normal)</option>
                <option value={1.5}>1.5x (Fast)</option>
                <option value={2.0}>2.0x (Very Fast)</option>
              </select>
            </div>

            {/* Failure Rate Control */}
            <div>
              <label className="block text-purple-300 text-sm mb-1">
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
                disabled={playerState.isPlaying}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={startPlaying}
              disabled={playerState.isPlaying || playerState.sequence.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium"
            >
              ▶ Start
            </button>
            
            <button
              onClick={pausePlaying}
              disabled={!playerState.isPlaying}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium"
            >
              ⏸ Pause
            </button>
            
            <button
              onClick={resumePlaying}
              disabled={!playerState.isPaused}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium"
            >
              ⏵ Resume
            </button>
            
            <button
              onClick={stopPlaying}
              disabled={!playerState.isPlaying && !playerState.isPaused}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium"
            >
              ⏹ Stop
            </button>
            
            <button
              onClick={restartPlaying}
              disabled={playerState.sequence.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium"
            >
              🔄 Restart
            </button>
          </div>

          <div className="text-sm text-purple-200">
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
                Status: {playerState.isPlaying ? '▶ Playing' : playerState.isPaused ? '⏸ Paused' : '⏹ Stopped'}
              </span>
            </div>
          </div>

          {playerState.sequence.length === 0 && (
            <div className="text-yellow-300 text-sm mt-2">
              ⚠️ No practice sequence loaded. Start a practice session to enable simulation.
            </div>
          )}
        </>
      )}
    </div>
  );
};
