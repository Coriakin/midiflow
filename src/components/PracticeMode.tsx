import React, { useState, useEffect, useRef } from 'react';
import { midiNoteToName } from '../types/midi';
import type { Song } from './SongInput';

export interface PracticeSession {
  songId: string;
  startTime: number;
  currentNoteIndex: number;
  totalNotes: number;
  correctNotes: number;
  incorrectAttempts: number;
  isComplete: boolean;
}

export interface NoteFeedback {
  isCorrect: boolean;
  expectedNote: number;
  playedNote: number;
  timestamp: number;
}

interface PracticeModeProps {
  song: Song | null;
  lastPlayedNote: number | null;
  onSessionComplete: (session: PracticeSession) => void;
  onExpectedNoteChange?: (expectedNote: number | null) => void; // Callback for expected note
  className?: string;
}

/**
 * Practice mode component for guided note-by-note practice
 */
export const PracticeMode: React.FC<PracticeModeProps> = ({
  song,
  lastPlayedNote,
  onSessionComplete,
  onExpectedNoteChange,
  className = ''
}) => {
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [feedback, setFeedback] = useState<NoteFeedback | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout>();

  // Start new practice session
  const startSession = () => {
    if (!song) return;

    const newSession: PracticeSession = {
      songId: song.id,
      startTime: performance.now(),
      currentNoteIndex: 0,
      totalNotes: song.notes.length,
      correctNotes: 0,
      incorrectAttempts: 0,
      isComplete: false
    };

    setSession(newSession);
    setFeedback(null);
    
    // Notify parent of expected note
    if (onExpectedNoteChange && song.notes.length > 0) {
      onExpectedNoteChange(song.notes[0]);
    }
  };

  // Handle note input during practice
  useEffect(() => {
    if (!session || !song || lastPlayedNote === null || session.isComplete) {
      return;
    }

    const expectedNote = song.notes[session.currentNoteIndex];
    const isCorrect = lastPlayedNote === expectedNote;

    // Create feedback
    const newFeedback: NoteFeedback = {
      isCorrect,
      expectedNote,
      playedNote: lastPlayedNote,
      timestamp: performance.now()
    };

    setFeedback(newFeedback);

    // Clear previous timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    if (isCorrect) {
      // Correct note played
      const updatedSession = {
        ...session,
        currentNoteIndex: session.currentNoteIndex + 1,
        correctNotes: session.correctNotes + 1
      };

      // Check if song is complete
      if (updatedSession.currentNoteIndex >= song.notes.length) {
        updatedSession.isComplete = true;
        onSessionComplete(updatedSession);
        // Clear expected note when complete
        if (onExpectedNoteChange) {
          onExpectedNoteChange(null);
        }
      } else {
        // Update expected note for next note
        if (onExpectedNoteChange) {
          onExpectedNoteChange(song.notes[updatedSession.currentNoteIndex]);
        }
      }

      setSession(updatedSession);

      // Clear feedback after success
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, 1000);

    } else {
      // Wrong note played
      setSession({
        ...session,
        incorrectAttempts: session.incorrectAttempts + 1
      });

      // Clear feedback after error (but keep trying same note)
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, 1500);
    }
  }, [lastPlayedNote, session, song, onSessionComplete]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  if (!song) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-4">
          <div className="text-4xl mb-2">🎵</div>
          <div>No song selected</div>
        </div>
        <div className="text-sm text-gray-500">
          Create a song to start practicing!
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">{song.title}</h3>
          <div className="text-gray-300 mb-4">
            {song.notes.length} notes • {song.tempo} BPM
          </div>
          <button
            onClick={startSession}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium"
          >
            Start Practice
          </button>
        </div>
      </div>
    );
  }

  const currentNote = song.notes[session.currentNoteIndex];
  const progress = (session.correctNotes / session.totalNotes) * 100;
  const accuracy = session.correctNotes + session.incorrectAttempts > 0 
    ? (session.correctNotes / (session.correctNotes + session.incorrectAttempts)) * 100 
    : 100;

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">{song.title}</h3>
        <button
          onClick={() => {
            setSession(null);
            if (onExpectedNoteChange) {
              onExpectedNoteChange(null);
            }
          }}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm text-white"
        >
          Stop
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>Progress</span>
          <span>{session.correctNotes} / {session.totalNotes}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {session.isComplete ? (
        /* Completion Message */
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h4 className="text-2xl font-bold text-green-400 mb-2">Song Complete!</h4>
          <div className="text-gray-300 mb-4">
            Accuracy: {accuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400 space-y-1">
            <div>Correct notes: {session.correctNotes}</div>
            <div>Total attempts: {session.correctNotes + session.incorrectAttempts}</div>
          </div>
          <button
            onClick={startSession}
            className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
          >
            Practice Again
          </button>
        </div>
      ) : (
        /* Active Practice */
        <div className="text-center">
          {/* Current Target Note */}
          <div className="mb-6">
            <div className="text-sm text-gray-400 mb-2">Play this note:</div>
            <div className="text-6xl font-bold text-yellow-400 mb-2">
              {midiNoteToName(currentNote)}
            </div>
            <div className="text-sm text-gray-500">
              MIDI {currentNote}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`p-4 rounded-lg mb-4 ${
              feedback.isCorrect 
                ? 'bg-green-900 border border-green-600' 
                : 'bg-red-900 border border-red-600'
            }`}>
              {feedback.isCorrect ? (
                <div className="text-green-300">
                  <div className="text-2xl mb-1">✅</div>
                  <div>Correct!</div>
                </div>
              ) : (
                <div className="text-red-300">
                  <div className="text-2xl mb-1">❌</div>
                  <div>
                    Expected: {midiNoteToName(feedback.expectedNote)}
                  </div>
                  <div>
                    Played: {midiNoteToName(feedback.playedNote)}
                  </div>
                  <div className="text-sm mt-1">Try again!</div>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-gray-400">Accuracy</div>
              <div className="text-xl font-bold text-white">
                {accuracy.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-gray-400">Note</div>
              <div className="text-xl font-bold text-white">
                {session.currentNoteIndex + 1} / {session.totalNotes}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
