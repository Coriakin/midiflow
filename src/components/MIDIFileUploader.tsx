import React, { useState } from 'react';
import { MIDISong, ParsedMIDIFile, MIDITrackInfo } from '../types/midi';
import { parseMIDIFile, extractNotesFromTrack } from '../lib/midi/midiFileParser';

interface MIDIFileUploaderProps {
  onMIDISongCreate: (song: MIDISong) => void;
  className?: string;
}

/**
 * Component for uploading and configuring MIDI files for practice
 */
export const MIDIFileUploader: React.FC<MIDIFileUploaderProps> = ({ 
  onMIDISongCreate, 
  className = '' 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedMIDIFile | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number>(0);
  const [songTitle, setSongTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.mid') && !file.name.toLowerCase().endsWith('.midi')) {
      setError('Please upload a MIDI file (.mid or .midi)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const parsed = await parseMIDIFile(file);
      setParsedFile(parsed);
      setOriginalFile(file); // Store original file for later use
      setSongTitle(file.name.replace(/\.(mid|midi)$/i, ''));
      
      // Auto-select the track with the most notes
      const bestTrack = parsed.tracks.reduce((best, track, index) => 
        track.noteCount > parsed.tracks[best].noteCount ? index : best, 0
      );
      setSelectedTrackIndex(bestTrack);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse MIDI file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleCreateSong = async () => {
    if (!parsedFile || !originalFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const { notes, tempo, notesWithTiming } = await extractNotesFromTrack(originalFile, selectedTrackIndex);
      
      const midiSong: MIDISong = {
        id: `midi-${Date.now()}-${selectedTrackIndex}`,
        title: songTitle || `${parsedFile.fileName} - Track ${selectedTrackIndex + 1}`,
        notes,
        tempo,
        notesWithTiming,
        source: 'midi-file',
        fileName: parsedFile.fileName,
        selectedTrack: selectedTrackIndex,
        originalMIDIData: parsedFile,
        availableTracks: parsedFile.tracks
      };

      onMIDISongCreate(midiSong);
      
      // Reset form
      setParsedFile(null);
      setOriginalFile(null);
      setSongTitle('');
      setSelectedTrackIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create song from MIDI file');
    } finally {
      setIsUploading(false);
    }
  };

  const renderTrackInfo = (track: MIDITrackInfo) => (
    <div className="text-sm">
      <div className="font-medium">
        {track.trackName || `Track ${track.trackIndex + 1}`}
        {track.instrumentName && ` (${track.instrumentName})`}
      </div>
      <div className="text-gray-400 text-xs">
        {track.noteCount} notes • Range: {track.noteRange.min}-{track.noteRange.max}
        {track.channelNumbers.length > 0 && ` • Channels: ${track.channelNumbers.join(', ')}`}
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-700 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-200 mb-3">Upload MIDI File</h3>
      
      {error && (
        <div className="bg-red-800/50 border border-red-600 text-red-200 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {!parsedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-900/20'
              : 'border-gray-500 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <div className="text-4xl mb-2">🎵</div>
          <div className="text-gray-300 mb-2">
            {isUploading ? 'Parsing MIDI file...' : 'Drop a MIDI file here or click to browse'}
          </div>
          <input
            type="file"
            accept=".mid,.midi"
            onChange={handleFileInputChange}
            className="hidden"
            id="midi-file-input"
            disabled={isUploading}
          />
          <label
            htmlFor="midi-file-input"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded cursor-pointer text-sm"
          >
            {isUploading ? 'Processing...' : 'Browse Files'}
          </label>
          <div className="text-xs text-gray-500 mt-2">
            Supports .mid and .midi files
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="bg-gray-600 rounded p-3">
            <h4 className="font-medium text-gray-200 mb-2">File: {parsedFile.fileName}</h4>
            <div className="text-sm text-gray-400 grid grid-cols-2 gap-2">
              <div>Duration: {Math.round(parsedFile.durationInSeconds)}s</div>
              <div>Tracks: {parsedFile.tracks.length}</div>
              <div>Tempo: {parsedFile.tempoChanges[0]?.bpm || 120} BPM</div>
              <div>Total Ticks: {parsedFile.totalTicks}</div>
            </div>
          </div>

          {/* Song Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Song Title
            </label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="Enter song title..."
            />
          </div>

          {/* Track Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Track for Practice
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {parsedFile.tracks.map((track, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedTrackIndex(index)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedTrackIndex === index
                      ? 'bg-blue-600 border border-blue-400'
                      : 'bg-gray-600 hover:bg-gray-500 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      selectedTrackIndex === index
                        ? 'bg-white border-white'
                        : 'border-gray-400'
                    }`}></div>
                    {renderTrackInfo(track)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCreateSong}
              disabled={isUploading || !songTitle.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm"
            >
              {isUploading ? 'Creating...' : 'Create Practice Song'}
            </button>
            <button
              onClick={() => {
                setParsedFile(null);
                setOriginalFile(null);
                setSongTitle('');
                setSelectedTrackIndex(0);
                setError(null);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
