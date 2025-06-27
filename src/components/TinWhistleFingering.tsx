import React from 'react';
import { midiNoteToName } from '../types/midi';

/**
 * Tin whistle fingering patterns
 * Each pattern represents 6 holes: [hole1, hole2, hole3, hole4, hole5, hole6]
 * true = covered/closed, false = open
 * Based on standard D-tuned tin whistle fingering chart
 */
const TIN_WHISTLE_FINGERINGS: Record<number, boolean[]> = {
  // First octave - based on the reference chart
  62: [true, true, true, true, true, true],   // D5 (low D) - all holes covered
  64: [true, true, true, true, true, false],  // E5 - hole 6 open
  65: [true, true, true, true, false, false], // F5 - holes 5,6 open  
  66: [true, true, true, true, false, false], // F#5 - first 4 holes covered, last 2 open
  67: [true, true, true, false, false, false], // G5 - holes 4,5,6 open
  69: [true, true, false, false, false, false], // A5 - holes 3,4,5,6 open
  71: [true, false, false, false, false, false], // B5 - holes 2,3,4,5,6 open
  72: [false, false, false, false, false, false], // C6 - all holes open
  73: [true, false, true, false, false, false], // C#6 - cross-fingering (1,3 covered, 2,4,5,6 open)
  74: [true, true, true, true, true, true],   // D6 (second octave, requires harder blowing)
  
  // Second octave (higher notes with overblowing)
  76: [true, true, true, true, true, false],  // E6
  77: [true, true, true, true, false, false], // F6
  78: [true, true, true, false, false, false], // F#6 
  79: [true, true, true, false, false, false], // G6
  81: [true, true, false, false, false, false], // A6
  83: [true, false, false, false, false, false], // B6
  84: [false, false, false, false, false, false], // C7
};

interface TinWhistleFingeringProps {
  midiNote: number | null;
  className?: string;
}

/**
 * Visual representation of tin whistle fingering for a given MIDI note
 */
export const TinWhistleFingering: React.FC<TinWhistleFingeringProps> = ({ 
  midiNote, 
  className = '' 
}) => {
  if (!midiNote) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="text-sm text-gray-400 mb-2">Tin Whistle Fingering</div>
        <div className="text-xs text-gray-500">Play a note to see fingering</div>
      </div>
    );
  }

  const fingering = TIN_WHISTLE_FINGERINGS[midiNote];
  const noteName = midiNoteToName(midiNote);

  if (!fingering) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="text-sm text-gray-400 mb-2">Tin Whistle Fingering</div>
        <div className="text-xs text-red-400">
          {noteName} - Not in standard tin whistle range
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="text-sm font-medium text-gray-300 mb-2">
        Tin Whistle Fingering
      </div>
      
      {/* Note name */}
      <div className="text-lg font-bold text-yellow-400 mb-3">
        {noteName}
      </div>
      
      {/* Whistle body and holes */}
      <div className="relative">
        {/* Whistle body (vertical rectangle) */}
        <div className="w-8 h-48 bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg border-2 border-amber-600 relative">
          
          {/* Mouthpiece */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-amber-600 rounded-full border border-amber-500"></div>
          
          {/* Holes */}
          {fingering.map((isCovered, index) => (
            <div
              key={index}
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{ top: `${20 + index * 32}px` }}
            >
              {/* Hole */}
              <div 
                className={`w-6 h-6 rounded-full border-2 ${
                  isCovered 
                    ? 'bg-gray-800 border-gray-600' // Covered hole
                    : 'bg-white border-gray-300'    // Open hole
                }`}
              >
                {/* Finger indicator for covered holes */}
                {isCovered && (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-300 to-pink-400 opacity-80"></div>
                )}
              </div>
              
              {/* Hole number */}
              <div className="text-xs text-gray-400 text-center mt-1">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-800 border border-gray-600"></div>
          <span>= Covered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div>
          <span>= Open</span>
        </div>
      </div>
    </div>
  );
};
