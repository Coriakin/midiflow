import React, { useState } from 'react';
import { midiNoteToName, Song } from '../types/midi';

interface SongInputProps {
  onSongCreate: (song: Song) => void;
  className?: string;
}

/**
 * Component for manually creating practice songs by entering notes
 */
export const SongInput: React.FC<SongInputProps> = ({ onSongCreate, className = '' }) => {
  const [title, setTitle] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [tempo, setTempo] = useState(120);
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse note input (supports both note names and MIDI numbers)
  const parseNotes = (input: string): number[] => {
    const tokens = input.split(/[\s,]+/).filter(token => token.trim());
    const notes: number[] = [];

    for (const token of tokens) {
      const trimmed = token.trim().toUpperCase();
      
      // Try parsing as MIDI number first
      const midiNum = parseInt(trimmed);
      if (!isNaN(midiNum) && midiNum >= 0 && midiNum <= 127) {
        notes.push(midiNum);
        continue;
      }

      // Try parsing as note name (C4, F#5, etc.)
      const noteMatch = trimmed.match(/^([A-G])(#|B)?(\d+)$/);
      if (noteMatch) {
        const [, noteName, accidental, octaveStr] = noteMatch;
        const octave = parseInt(octaveStr);
        
        // Convert note name to MIDI number
        const noteValues: Record<string, number> = {
          'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
        };
        
        let midiNote = noteValues[noteName] + (octave + 1) * 12;
        
        if (accidental === '#') midiNote += 1;
        else if (accidental === 'B') midiNote -= 1;
        
        if (midiNote >= 0 && midiNote <= 127) {
          notes.push(midiNote);
        }
      }
    }

    return notes;
  };

  const handleCreate = () => {
    if (!title.trim()) {
      alert('Please enter a song title');
      return;
    }

    const notes = parseNotes(noteInput);
    if (notes.length === 0) {
      alert('Please enter at least one valid note');
      return;
    }

    const song: Song = {
      id: `song_${Date.now()}`,
      title: title.trim(),
      notes,
      tempo
    };

    onSongCreate(song);
    
    // Reset form
    setTitle('');
    setNoteInput('');
    setTempo(120);
    setIsExpanded(false);
  };

  const previewNotes = parseNotes(noteInput);

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Create Practice Song (Manual)</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
        >
          {isExpanded ? 'Collapse' : 'Add Song'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Song Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Song Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes:
            </label>
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Enter notes (e.g., C4 D4 E4 F4 G4 or 60 62 64 65 67)"
              rows={3}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <div className="text-xs text-gray-400 mt-1">
              You can use note names (C4, F#5) or MIDI numbers (60, 67). Separate with spaces or commas.
            </div>
          </div>

          {/* Tempo */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-300">
              Tempo (BPM):
            </label>
            <input
              type="number"
              min="60"
              max="200"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none w-20"
            />
          </div>

          {/* Note Preview */}
          {previewNotes.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-300 mb-2">Preview:</div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="flex flex-wrap gap-2">
                  {previewNotes.map((note, index) => (
                    <span
                      key={index}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                    >
                      {midiNoteToName(note)} ({note})
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {previewNotes.length} notes at {tempo} BPM
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!title.trim() || previewNotes.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white"
            >
              Create Song
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
