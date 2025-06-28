import React, { useEffect, useState, useRef } from 'react';
import type { PracticeNote } from '../types/midi';
import { midiNoteToName, INSTRUMENT_RANGES } from '../types/midi';

interface FallingNoteProps {
  note: PracticeNote;
  position: { x: number; y: number };
  onNoteExit: (noteId: string) => void;
}

/**
 * Individual falling note component with CSS animation
 */
const FallingNote: React.FC<FallingNoteProps> = ({ note, position, onNoteExit }) => {
  const animationDuration = 2500; // 2.5 seconds to fall through the container
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    console.log(`FallingNote ${note.id} starting CSS animation from position:`, position);
    
    // Listen for animation end event for precise cleanup
    const element = elementRef.current;
    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.animationName === 'fall') {
        console.log(`Note ${note.id} CSS animation completed, removing`);
        onNoteExit(note.id);
      }
    };
    
    if (element) {
      element.addEventListener('animationend', handleAnimationEnd);
    }
    
    // Backup timeout in case animation event doesn't fire
    const backupTimer = setTimeout(() => {
      console.log(`Note ${note.id} backup timer triggered, removing`);
      onNoteExit(note.id);
    }, animationDuration + 100);

    return () => {
      if (element) {
        element.removeEventListener('animationend', handleAnimationEnd);
      }
      clearTimeout(backupTimer);
    };
  }, [note.id, onNoteExit, animationDuration]);

  const noteColor = note.isTarget 
    ? '#3B82F6' // Blue for target note
    : note.isCorrect === true 
      ? '#10B981' // Green for correct
      : note.isCorrect === false 
        ? '#EF4444' // Red for incorrect
        : '#8B5CF6'; // Purple for normal notes

  console.log(`FallingNote ${note.id} RENDER: x=${position.x.toFixed(1)}, using CSS animation`);

  // Safety checks for positioning
  const safeX = Number.isFinite(position.x) ? position.x : 50;

  return (
    <div
      ref={elementRef}
      className="absolute w-16 h-10 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold z-10"
      style={{
        left: `${safeX}px`,
        top: '0px', // Start at top
        backgroundColor: noteColor,
        transform: note.isTarget ? 'scale(1.1)' : 'scale(1)',
        visibility: 'visible',
        opacity: 1,
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        // CSS animation to fall down
        animation: `fall ${animationDuration}ms linear forwards`,
      }}
      title={`${note.id}`}
    >
      {midiNoteToName(note.note)}
    </div>
  );
};

interface NoteVisualizerProps {
  notes: PracticeNote[];
  className?: string;
  onNoteExit?: (noteId: string) => void;
  instrumentType?: 'tin-whistle' | 'full-keyboard' | 'guitar' | 'violin' | 'flute' | 'saxophone' | 'custom';
  customRange?: { MIN: number; MAX: number };
}

/**
 * Main note visualizer component showing falling notes Guitar Hero style
 */
export const NoteVisualizer: React.FC<NoteVisualizerProps> = ({ 
  notes, 
  className = '', 
  onNoteExit,
  instrumentType = 'tin-whistle',
  customRange
}) => {
  const [activeNotes, setActiveNotes] = useState<PracticeNote[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const noteExitTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Update active notes when notes prop changes
  useEffect(() => {
    console.log(`NoteVisualizer received ${notes.length} notes:`, notes.map(n => `${n.id}(${n.note})`));
    
    // Filter out notes that are too old (shouldn't be rendered)
    const now = performance.now();
    const validNotes = notes.filter(note => now - note.startTime < 4000); // Reduced to 4 seconds
    
    if (validNotes.length !== notes.length) {
      console.log(`Filtered out ${notes.length - validNotes.length} old notes from incoming props`);
    }
    
    setActiveNotes(validNotes);
  }, [notes]);

  // Handle note exit (when it falls off screen)
  const handleNoteExit = (noteId: string) => {
    console.log(`Handling note exit: ${noteId}`);
    
    // Clear any existing timeout for this note
    const existingTimeout = noteExitTimeoutsRef.current.get(noteId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      noteExitTimeoutsRef.current.delete(noteId);
    }
    
    // Remove from local state immediately
    setActiveNotes(prev => {
      const filtered = prev.filter(note => note.id !== noteId);
      if (filtered.length !== prev.length) {
        console.log(`Removed note ${noteId} from visualizer, active notes: ${filtered.length}`);
      }
      return filtered;
    });

    // Notify parent component to remove from main state
    if (onNoteExit) {
      onNoteExit(noteId);
    }
  };

  // Auto-cleanup notes that are too old (backup mechanism)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = performance.now();
      setActiveNotes(prev => {
        const filtered = prev.filter(note => now - note.startTime < 4000); // Remove notes older than 4 seconds
        if (filtered.length !== prev.length) {
          const removedCount = prev.length - filtered.length;
          console.log(`Visualizer auto-cleanup: removed ${removedCount} old notes, remaining: ${filtered.length}`);
          // Notify parent about removed notes
          if (onNoteExit) {
            prev.filter(note => now - note.startTime >= 4000).forEach(note => {
              console.log(`Auto-removing note ${note.id} from parent`);
              onNoteExit(note.id);
            });
          }
        }
        return filtered;
      });
    }, 1000); // Check every second

    return () => clearInterval(cleanupInterval);
  }, [onNoteExit]);

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      noteExitTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      noteExitTimeoutsRef.current.clear();
    };
  }, []);

  // Calculate note position based on MIDI note number and instrument range
  const getNotePosition = (note: PracticeNote): { x: number; y: number } => {
    const containerWidth = containerRef.current?.clientWidth || 800;
    
    // Get the range for the selected instrument (use custom range if provided)
    const range = instrumentType === 'custom' && customRange ? customRange : INSTRUMENT_RANGES[instrumentType];
    const minNote = range.MIN;
    const maxNote = range.MAX;
    const noteRange = maxNote - minNote;
    
    // Calculate X position based on note pitch (left to right, low to high)
    const noteOffset = Math.max(0, Math.min(noteRange, note.note - minNote));
    const xPosition = (noteOffset / noteRange) * (containerWidth - 100) + 50;
    
    const position = {
      x: Math.max(10, Math.min(xPosition, containerWidth - 90)),
      y: 0 // Start at the top of the container
    };
    
    console.log(`Note ${note.id} (MIDI ${note.note}) positioned at:`, position, `noteOffset: ${noteOffset}, range: ${minNote}-${maxNote}, containerWidth: ${containerWidth}`);
    return position;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-900 overflow-hidden ${className}`}
      style={{ 
        minHeight: '400px',
        position: 'relative', // Ensure relative positioning for absolute children
        width: '100%',
        border: '1px solid #4B5563' // Add visible border for debugging
      }}
    >
      {/* Target line where notes should be hit */}
      <div 
        className="absolute w-full h-1 bg-yellow-400 shadow-lg"
        style={{ top: '80%' }}
      >
        <div className="absolute inset-0 bg-yellow-400 animate-pulse opacity-50"></div>
      </div>      {/* Falling notes */}
      {activeNotes.map(note => {
        const position = getNotePosition(note);
        console.log(`Rendering note ${note.id} at position:`, position);
        return (
          <FallingNote
            key={note.id}
            note={note}
            position={position}
            onNoteExit={handleNoteExit}
          />
        );
      })}

      {/* Debug info overlay */}
      {activeNotes.length > 0 && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-20">
          Rendering {activeNotes.length} notes
        </div>
      )}

      {/* Instructions overlay when no notes */}
      {activeNotes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-2xl mb-2">🎵</div>
            <div className="text-lg">Play your instrument to see notes appear</div>
            <div className="text-sm mt-2">Notes will fall towards the yellow target line</div>
          </div>
        </div>
      )}
    </div>
  );
};
