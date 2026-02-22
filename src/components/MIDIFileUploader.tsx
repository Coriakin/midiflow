import React, { useState } from 'react';
import { MIDISong, ParsedMIDIFile, MIDITrackInfo } from '../types/midi';
import { parseMIDIFile, extractNotesFromArrayBuffer } from '../lib/midi/midiFileParser';
import { MIDIPreview } from './MIDIPreview';

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
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewSong, setPreviewSong] = useState<MIDISong | null>(null);

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
      // Read the file as ArrayBuffer
      const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(originalFile);
      });
      
      const { notes, tempo, notesWithTiming } = extractNotesFromArrayBuffer(fileData, selectedTrackIndex);
      
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
        availableTracks: parsedFile.tracks,
        fileData
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
    <div className={`mac-panel p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-200 mb-3">Upload MIDI File</h3>
      
      {error && (
        <div className="bg-red-800/50 border border-red-600 text-red-200 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {!parsedFile ? (
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            isDragOver
              ? 'border-blue-300 bg-blue-500/10'
              : 'border-gray-500/60 hover:border-gray-300'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
        >
          <div className="text-lg font-semibold mb-2 text-gray-200">MIDI Import</div>
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
            className="inline-block mac-button mac-button-primary cursor-pointer text-sm"
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
          <div className="mac-panel-soft p-3">
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
              className="mac-input text-sm"
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
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedTrackIndex === index
                      ? 'bg-blue-500/25 border border-blue-300/50'
                      : 'bg-gray-600/55 hover:bg-gray-500/60 border border-transparent'
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
              className="mac-button mac-button-success disabled:opacity-50 text-sm"
            >
              {isUploading ? 'Creating...' : 'Create Practice Song'}
            </button>
            
            {/* Preview Button */}
            <button
              onClick={async () => {
                if (!parsedFile || !originalFile) return;
                
                try {
                  // Create a temporary song for preview
                  const fileData = await originalFile.arrayBuffer();
                  const { notes, tempo, notesWithTiming } = extractNotesFromArrayBuffer(fileData, selectedTrackIndex);
                  
                  const tempSong: MIDISong = {
                    id: `temp-preview-${Date.now()}`,
                    title: songTitle || 'Preview',
                    notes,
                    tempo,
                    notesWithTiming,
                    source: 'midi-file',
                    fileName: originalFile.name,
                    selectedTrack: selectedTrackIndex,
                    originalMIDIData: parsedFile,
                    availableTracks: parsedFile.tracks,
                    fileData: fileData
                  };
                  
                  setPreviewSong(tempSong);
                  setShowPreview(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to create preview');
                }
              }}
              disabled={isUploading}
              className="mac-button disabled:opacity-50 text-sm flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Preview</span>
            </button>
            
            <button
              onClick={() => {
                setParsedFile(null);
                setOriginalFile(null);
                setSongTitle('');
                setSelectedTrackIndex(0);
                setError(null);
              }}
              className="mac-button text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MIDI Preview Modal */}
      {showPreview && previewSong && (
        <MIDIPreview
          song={previewSong}
          availableTracks={previewSong.availableTracks}
          onTrackChange={(trackIndex) => {
            if (!previewSong?.fileData) return;
            
            try {
              // Update the selected track index in the main component
              setSelectedTrackIndex(trackIndex);
              
              // Update the preview song with the new track
              const { notes, tempo, notesWithTiming } = extractNotesFromArrayBuffer(previewSong.fileData, trackIndex);
              const updatedSong = {
                ...previewSong,
                selectedTrack: trackIndex,
                notes,
                tempo,
                notesWithTiming
              };
              setPreviewSong(updatedSong);
            } catch (error) {
              console.error('Failed to switch track in preview:', error);
            }
          }}
          onClose={() => {
            setShowPreview(false);
            setPreviewSong(null);
          }}
        />
      )}
    </div>
  );
};
