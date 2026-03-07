import React, { useMemo, useState } from 'react';
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

  const parseNoteToken = (token: string): number | null => {
    const normalized = token.trim().toUpperCase();
    if (!normalized) {
      return null;
    }

    const midiNum = parseInt(normalized, 10);
    if (!Number.isNaN(midiNum) && midiNum >= 0 && midiNum <= 127) {
      return midiNum;
    }

    const noteMatch = normalized.match(/^([A-G])(#|B)?(\d+)$/);
    if (!noteMatch) {
      return null;
    }

    const [, noteName, accidental, octaveStr] = noteMatch;
    const octave = parseInt(octaveStr, 10);
    const noteValues: Record<string, number> = {
      C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11
    };

    let midiNote = noteValues[noteName] + (octave + 1) * 12;
    if (accidental === '#') midiNote += 1;
    if (accidental === 'B') midiNote -= 1;

    if (midiNote < 0 || midiNote > 127) {
      return null;
    }

    return midiNote;
  };

  const parseManualInput = (input: string): {
    notes: number[];
    notesWithTiming: Array<{ note: number; startTime: number; duration: number }>;
    ignoredTokens: string[];
  } => {
    const tokens = input.split(/[\s,]+/).filter((token) => token.trim());
    const notes: number[] = [];
    const notesWithTiming: Array<{ note: number; startTime: number; duration: number }> = [];
    const ignoredTokens: string[] = [];
    let currentBeat = 0;

    for (const token of tokens) {
      const normalized = token.trim().toUpperCase();
      if (!normalized) {
        continue;
      }

      let notePart = normalized;
      let duration = 1;

      if (normalized.includes('@')) {
        const [rawNote, rawDuration, ...restParts] = normalized.split('@');
        if (!rawNote || !rawDuration || restParts.length > 0) {
          ignoredTokens.push(token);
          continue;
        }
        notePart = rawNote.trim();
        duration = parseFloat(rawDuration.trim());
      }

      if (!Number.isFinite(duration) || duration <= 0) {
        ignoredTokens.push(token);
        continue;
      }

      if (notePart === 'R' || notePart === 'REST') {
        currentBeat += duration;
        continue;
      }

      const midiNote = parseNoteToken(notePart);
      if (midiNote === null) {
        ignoredTokens.push(token);
        continue;
      }

      notes.push(midiNote);
      notesWithTiming.push({ note: midiNote, startTime: currentBeat, duration });
      currentBeat += duration;
    }

    return { notes, notesWithTiming, ignoredTokens };
  };

  const handleCreate = () => {
    if (!title.trim()) {
      alert('Please enter a song title');
      return;
    }

    const parsedInput = parseManualInput(noteInput);
    if (parsedInput.notes.length === 0) {
      alert('Please enter at least one valid note');
      return;
    }

    const song: Song = {
      id: `song_${Date.now()}`,
      title: title.trim(),
      notes: parsedInput.notes,
      tempo,
      notesWithTiming: parsedInput.notesWithTiming
    };

    onSongCreate(song);
    
    // Reset form
    setTitle('');
    setNoteInput('');
    setTempo(120);
    setIsExpanded(false);
  };

  const parsedPreview = useMemo(() => parseManualInput(noteInput), [noteInput]);

  return (
    <div className={`mac-panel p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Create Practice Song (Manual)</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mac-button mac-button-primary text-sm"
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
              className="mac-input"
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
              placeholder="Examples: C4@1 D4@0.5 E4@2 R@0.5 67@1"
              rows={3}
              className="mac-textarea"
            />
            <div className="text-xs text-gray-400 mt-2 space-y-2">
              <p>
                Use note names (C4, F#5, Bb4) or MIDI numbers (60, 67). Timing format is app-specific:
                <span className="font-mono"> note@duration</span> in beats.
              </p>
              <div>
                <div className="text-gray-300 font-medium mb-1">How timing input works</div>
                <div className="font-mono text-[11px] bg-gray-900/70 border border-gray-700 rounded p-2 select-all">
                  C4@1 D4@0.5 E4@2
                </div>
                <div className="font-mono text-[11px] bg-gray-900/70 border border-gray-700 rounded p-2 mt-1 select-all">
                  C4@1 R@0.5 D4@1
                </div>
                <div className="font-mono text-[11px] bg-gray-900/70 border border-gray-700 rounded p-2 mt-1 select-all">
                  60@1 62@1 F#4@0.5 67@2
                </div>
              </div>
              <p>
                Beat legend: 1 = quarter note, 0.5 = eighth note, 2 = half note. Use
                <span className="font-mono"> R@duration</span> or
                <span className="font-mono"> REST@duration</span> for silence.
              </p>
              <a
                href="https://en.wikipedia.org/wiki/Note_value"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-blue-200 underline"
              >
                Reference: standard note values and rhythmic durations
              </a>
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
              className="mac-input w-20"
            />
          </div>

          {/* Note Preview */}
          {parsedPreview.notes.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-300 mb-2">Preview:</div>
              <div className="mac-panel-soft p-3">
                <div className="flex flex-wrap gap-2">
                  {parsedPreview.notesWithTiming.map((noteItem, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 rounded text-sm bg-blue-500/30 border border-blue-300/40 text-blue-100"
                    >
                      {midiNoteToName(noteItem.note)} ({noteItem.note}) @{noteItem.duration}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {parsedPreview.notes.length} notes at {tempo} BPM
                </div>
                {parsedPreview.ignoredTokens.length > 0 && (
                  <div className="text-xs text-amber-300 mt-2">
                    Ignored tokens: {parsedPreview.ignoredTokens.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!title.trim() || parsedPreview.notes.length === 0}
              className="mac-button mac-button-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Song
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="mac-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
