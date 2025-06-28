import React from 'react';
import { midiNoteToName } from '../types/midi';

/**
 * Tin whistle fingering patterns
 * Each pattern represents 6 holes: [hole1, hole2, hole3, hole4, hole5, hole6]
 * true = covered/closed, false = open
 * Based on standard D-tuned tin whistle fingering chart
 */
const TIN_WHISTLE_FINGERINGS: Record<number, boolean[]> = {
  // First octave - based on standard D-tuned tin whistle
  62: [true, true, true, true, true, true],   // D4 (low D) - all holes covered - LOWEST NOTE
  63: [true, true, true, true, true, false],  // D#4 - hole 6 open
  64: [true, true, true, true, true, false],  // E4 - hole 6 open
  65: [true, true, true, true, false, false], // F4 - holes 5,6 open  
  66: [true, true, true, true, false, false], // F#4 - first 4 holes covered, last 2 open
  67: [true, true, true, false, false, false], // G4 - holes 4,5,6 open
  68: [true, true, false, true, false, false], // G#4 - cross-fingering (1,2,4 covered)
  69: [true, true, false, false, false, false], // A4 - holes 3,4,5,6 open
  70: [true, false, true, false, false, false], // A#4 - cross-fingering (1,3 covered)
  71: [true, false, false, false, false, false], // B4 - holes 2,3,4,5,6 open
  72: [false, false, false, false, false, false], // C5 - all holes open
  73: [true, false, true, false, false, false], // C#5 - cross-fingering (1,3 covered, 2,4,5,6 open)
  74: [true, true, true, true, true, true],   // D5 (second octave, requires harder blowing)
  76: [true, true, true, true, true, false],  // E5
  77: [true, true, true, true, false, false], // F5
  78: [true, true, true, false, false, false], // F#5 
  79: [true, true, true, false, false, false], // G5
  81: [true, true, false, false, false, false], // A5
  83: [true, false, false, false, false, false], // B5
  84: [false, false, false, false, false, false], // C6
};

// Standard tin whistle note range in order
const TIN_WHISTLE_NOTES = [62, 64, 65, 66, 67, 69, 71, 72, 74, 76, 77, 78, 79, 81, 83, 84];

interface TinWhistlePracticeBoardProps {
  currentTargetNote?: number | null;
  lastPlayedNote?: number | null;
  isCorrectNote?: boolean | null;
  className?: string;
}

/**
 * Complete tin whistle practice board showing all notes with fingerings
 * Highlights current target note and provides visual feedback
 */
export const TinWhistlePracticeBoard: React.FC<TinWhistlePracticeBoardProps> = ({
  currentTargetNote,
  lastPlayedNote,
  isCorrectNote,
  className = ''
}) => {
  return (
    <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
      <h2 className="text-xl font-bold text-white mb-4 text-center">
        Tin Whistle Practice Board
      </h2>
      
      <div className="flex">
        {/* Main note board - showing all notes */}
        <div className="flex-1">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {TIN_WHISTLE_NOTES.map((midiNote) => {
              const fingering = TIN_WHISTLE_FINGERINGS[midiNote];
              const noteName = midiNoteToName(midiNote);
              
              // Determine the styling based on current state
              let noteStyle = 'bg-gray-800 border-gray-600'; // Default
              if (currentTargetNote === midiNote) {
                if (isCorrectNote === true) {
                  noteStyle = 'bg-green-600 border-green-400 animate-pulse'; // Correctly played with animation
                } else {
                  noteStyle = 'bg-yellow-600 border-yellow-400 animate-pulse'; // Current target with animation
                }
              }
              
              return (
                <div
                  key={midiNote}
                  className={`${noteStyle} border-2 rounded-lg p-4 transition-all duration-200 hover:bg-gray-700 cursor-pointer`}
                  title={`${noteName} - Click to see fingering details`}
                >
                  {/* Note name */}
                  <div className="text-center mb-3">
                    <div className="text-xl font-bold text-white">
                      {noteName}
                    </div>
                  </div>
                  
                  {/* Simple dot pattern showing hole state */}
                  <div className="flex justify-center">
                    <div className="grid grid-cols-6 gap-1.5">
                      {fingering.map((isCovered, index) => (
                        <div
                          key={index}
                          className={`w-4 h-4 rounded-full border-2 transition-all ${
                            isCovered 
                              ? 'bg-red-400 border-red-300 shadow-sm' // Covered hole - red for visibility
                              : 'bg-gray-200 border-gray-300'         // Open hole - light gray
                          }`}
                          title={`Hole ${index + 1}: ${isCovered ? 'Covered (●)' : 'Open (○)'}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Helper text */}
                  <div className="text-center mt-3 text-xs text-gray-400">
                    🔴=covered  ⚪=open
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Side panel - current play feedback */}
        <div className="w-72 ml-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            Practice Feedback
          </h3>
          
          {currentTargetNote && (
            <div className="mb-6">
              <div className="text-sm text-yellow-400 mb-2 font-medium">🎯 Target Note:</div>
              <div className="bg-yellow-600 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white mb-3">
                  {midiNoteToName(currentTargetNote)}
                </div>
                <LargeFingeringChart fingering={TIN_WHISTLE_FINGERINGS[currentTargetNote]} />
              </div>
            </div>
          )}
          
          {lastPlayedNote && (
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2 font-medium">
                🎵 Last Played:
                {isCorrectNote === true && <span className="ml-2 text-green-400">✓ Correct!</span>}
                {isCorrectNote === false && <span className="ml-2 text-red-400">✗ Try again</span>}
              </div>
              <div className={`rounded-lg p-4 text-center ${
                isCorrectNote === true 
                  ? 'bg-green-600' 
                  : isCorrectNote === false 
                    ? 'bg-red-600' 
                    : 'bg-gray-700'
              }`}>
                <div className="text-xl font-bold text-white mb-3">
                  {midiNoteToName(lastPlayedNote)}
                </div>
                <LargeFingeringChart fingering={TIN_WHISTLE_FINGERINGS[lastPlayedNote]} />
              </div>
            </div>
          )}
          
          {!currentTargetNote && !lastPlayedNote && (
            <div className="text-center text-gray-400 py-8">
              <div className="text-5xl mb-4">🎵</div>
              <div className="text-lg mb-2">Ready to Practice!</div>
              <div className="text-sm">
                Start a practice sequence to see target notes,<br/>
                or just play freely to see feedback here.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Large fingering chart for the side panel with proper hole spacing
 */
const LargeFingeringChart: React.FC<{ fingering: boolean[] }> = ({ fingering }) => {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center">
        {/* Whistle body */}
        <div className="w-8 h-40 bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg border-2 border-amber-600 relative">
          
          {/* Mouthpiece */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-amber-600 rounded-full border border-amber-500"></div>
          
          {/* Holes - properly spaced vertically */}
          {fingering.map((isCovered, index) => (
            <div
              key={index}
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{ top: `${8 + index * 20}px` }} // Better spacing
            >
              {/* Hole */}
              <div 
                className={`w-5 h-5 rounded-full border-2 ${
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
              
              {/* Hole number label */}
              <div className="text-xs text-gray-400 text-center mt-1">
                {index + 1}
              </div>
            </div>
          ))}
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
    </div>
  );
};
