import React, { useEffect, useState, useRef } from 'react';
import type { PracticeNote } from '../types/midi';
import { midiNoteToName } from '../types/midi';

interface FallingNoteProps {
  note: PracticeNote;
  position: { x: number; y: number };
  speed: number;
  onNoteExit: (noteId: string) => void;
}

/**
 * Individual falling note component with animation
 */
const FallingNote: React.FC<FallingNoteProps> = ({ note, position, speed, onNoteExit }) => {
  const [currentY, setCurrentY] = useState(position.y);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      setCurrentY(prev => {
        const newY = prev + speed;
        
        // Check if note has exited the screen
        if (newY > window.innerHeight + 50) {
          onNoteExit(note.id);
          return prev;
        }
        
        return newY;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, note.id, onNoteExit]);

  const noteColor = note.isTarget 
    ? '#3B82F6' // Blue for target note
    : note.isCorrect === true 
      ? '#10B981' // Green for correct
      : note.isCorrect === false 
        ? '#EF4444' // Red for incorrect
        : '#6B7280'; // Gray for neutral

  return (
    <div
      className="absolute w-12 h-8 rounded-lg border-2 border-white shadow-lg transition-colors duration-200 flex items-center justify-center text-white text-xs font-bold"
      style={{
        left: position.x,
        top: currentY,
        backgroundColor: noteColor,
        transform: note.isTarget ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      {midiNoteToName(note.note)}
    </div>
  );
};

interface NoteVisualizerProps {
  notes: PracticeNote[];
  className?: string;
}

/**
 * Main note visualizer component showing falling notes Guitar Hero style
 */
export const NoteVisualizer: React.FC<NoteVisualizerProps> = ({ notes, className = '' }) => {
  const [activeNotes, setActiveNotes] = useState<PracticeNote[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update active notes when notes prop changes
  useEffect(() => {
    setActiveNotes(notes);
  }, [notes]);

  // Handle note exit (when it falls off screen)
  const handleNoteExit = (noteId: string) => {
    setActiveNotes(prev => prev.filter(note => note.id !== noteId));
  };

  // Calculate note position based on MIDI note number
  const getNotePosition = (note: PracticeNote): { x: number; y: number } => {
    const containerWidth = containerRef.current?.clientWidth || 800;
    const noteRange = 24; // Range of notes to display (2 octaves)
    const minNote = 60; // Middle C
    
    // Calculate X position based on note pitch
    const noteOffset = note.note - minNote;
    const xPosition = (noteOffset / noteRange) * (containerWidth - 60) + 30;
    
    return {
      x: Math.max(30, Math.min(xPosition, containerWidth - 90)),
      y: -50 // Start above the visible area
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-900 overflow-hidden ${className}`}
      style={{ minHeight: '400px' }}
    >
      {/* Target line where notes should be hit */}
      <div 
        className="absolute w-full h-1 bg-yellow-400 shadow-lg"
        style={{ top: '80%' }}
      >
        <div className="absolute inset-0 bg-yellow-400 animate-pulse opacity-50"></div>
      </div>

      {/* Falling notes */}
      {activeNotes.map(note => (
        <FallingNote
          key={note.id}
          note={note}
          position={getNotePosition(note)}
          speed={2} // pixels per frame
          onNoteExit={handleNoteExit}
        />
      ))}

      {/* Instructions overlay when no notes */}
      {activeNotes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-2">🎵</div>
            <div className="text-lg">Play your tin whistle to see notes appear</div>
            <div className="text-sm mt-2">Notes will fall towards the yellow line</div>
          </div>
        </div>
      )}
    </div>
  );
};
