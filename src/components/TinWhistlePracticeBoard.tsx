import React from 'react';
import { midiNoteToName } from '../types/midi';
import { getTinWhistleFingering, TIN_WHISTLE_NOTES } from '../lib/tinWhistle';

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
    <div className={`mac-panel p-6 ${className}`}>
      <div className="flex">
        {/* Main note board - showing all notes */}
        <div className="flex-1">
          <div className="grid grid-cols-4 gap-3 mb-6">
            {TIN_WHISTLE_NOTES.map((midiNote) => {
              const fingering = getTinWhistleFingering(midiNote);
              const noteName = midiNoteToName(midiNote);
              
              // Determine the styling based on current state
              let noteStyle = 'bg-gray-800 border-gray-600'; // Default
              if (currentTargetNote === midiNote) {
                if (isCorrectNote === true) {
                  noteStyle = 'bg-green-500/40 border-green-300 animate-pulse'; // Correctly played with animation
                } else {
                  noteStyle = 'bg-amber-500/35 border-amber-300 animate-pulse'; // Current target with animation
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
                    <div className={`text-xl font-bold text-white ${midiNote >= 74 ? 'border-b-2 border-orange-400 inline-block' : ''}`}>
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
                    Filled = covered · Empty = open
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Side panel - current play feedback */}
        <div className="w-72 ml-6 mac-panel-soft p-4">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            Practice Feedback
          </h3>
          
          {currentTargetNote && (
            <div className="mb-6">
              <div className="text-sm text-yellow-300 mb-2 font-medium">Target Note</div>
              <div className="bg-amber-500/35 rounded-lg p-4 text-center border border-amber-300/45">
                <div className="text-2xl font-bold text-white mb-3">
                  {midiNoteToName(currentTargetNote)}
                </div>
                <LargeFingeringChart fingering={getTinWhistleFingering(currentTargetNote)} />
              </div>
            </div>
          )}
          
          {lastPlayedNote && (
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2 font-medium">
                Last Played:
                {isCorrectNote === true && <span className="ml-2 text-green-400">✓ Correct!</span>}
                {isCorrectNote === false && <span className="ml-2 text-red-400">✗ Try again</span>}
              </div>
              <div className={`rounded-lg p-4 text-center ${
                isCorrectNote === true 
                  ? 'bg-green-500/35 border border-green-300/40' 
                  : isCorrectNote === false 
                    ? 'bg-red-500/35 border border-red-300/40' 
                    : 'bg-gray-700'
              }`}>
                <div className="text-xl font-bold text-white mb-3">
                  {midiNoteToName(lastPlayedNote)}
                </div>
                <LargeFingeringChart fingering={getTinWhistleFingering(lastPlayedNote)} />
              </div>
            </div>
          )}
          
          {!currentTargetNote && !lastPlayedNote && (
            <div className="text-center text-gray-400 py-8">
              <div className="text-lg mb-2">Ready to Practice!</div>
              <div className="text-sm">
                Start a practice sequence to see target notes,<br/>
                or just play freely to see feedback here.
              </div>
            </div>
          )}
          
          {/* Debug info for troubleshooting */}
          <div className="mt-4 text-xs text-gray-500 border-t border-gray-700 pt-2">
            <div>Debug: Target={currentTargetNote}, Last={lastPlayedNote}, Correct={isCorrectNote?.toString()}</div>
          </div>
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
