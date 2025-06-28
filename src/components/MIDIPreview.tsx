import React, { useState, useEffect, useRef } from 'react';
import { MIDISong, MIDITrackInfo } from '../types/midi';
import { extractNotesFromArrayBuffer } from '../lib/midi/midiFileParser';

interface MIDIPreviewProps {
  song: MIDISong;
  availableTracks: MIDITrackInfo[];
  onTrackChange: (trackIndex: number) => void;
  onClose: () => void;
  className?: string;
}

interface NoteEvent {
  note: number;
  startTime: number;
  duration: number;
  velocity?: number;
}

/**
 * MIDI Preview component for listening to and switching between tracks
 */
export const MIDIPreview: React.FC<MIDIPreviewProps> = ({ 
  song, 
  availableTracks, 
  onTrackChange, 
  onClose, 
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(song.selectedTrack);
  const [trackData, setTrackData] = useState<NoteEvent[]>([]);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const scheduledNotesRef = useRef<Set<string>>(new Set());
  const isPlayingRef = useRef<boolean>(false); // Use ref for immediate state tracking

  // Initialize audio context immediately
  useEffect(() => {
    if (!audioContext) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
    }
  }, []);

  // Load track data when track changes
  useEffect(() => {
    if (song.fileData) {
      try {
        console.log(`Loading track ${currentTrack} data...`);
        const { notesWithTiming } = extractNotesFromArrayBuffer(song.fileData, currentTrack);
        if (notesWithTiming && notesWithTiming.length > 0) {
          // Convert from beats to seconds using tempo
          const secondsPerBeat = 60 / song.tempo;
          
          const noteEvents: NoteEvent[] = notesWithTiming.map((note) => ({
            note: note.note,
            startTime: note.startTime * secondsPerBeat, // Convert beats to seconds
            duration: Math.max(0.1, note.duration * secondsPerBeat), // Convert beats to seconds, minimum 100ms
            velocity: 80
          }));
          
          // Sort by start time
          noteEvents.sort((a, b) => a.startTime - b.startTime);
          
          console.log(`Loaded ${noteEvents.length} note events, tempo: ${song.tempo} BPM (${secondsPerBeat.toFixed(3)}s per beat)`);
          console.log('First few notes:', noteEvents.slice(0, 5).map(n => `Note ${n.note} at ${n.startTime.toFixed(2)}s`));
          setTrackData(noteEvents);
          
          // Calculate total duration
          const maxEndTime = Math.max(...noteEvents.map(n => n.startTime + n.duration));
          setTotalDuration(maxEndTime);
          console.log(`Total duration: ${maxEndTime.toFixed(2)} seconds`);
        } else {
          console.log('No timing data available for this track');
          setTrackData([]);
          setTotalDuration(0);
        }
      } catch (error) {
        console.error('Failed to load track data:', error);
        setTrackData([]);
        setTotalDuration(0);
      }
    }
  }, [currentTrack, song.fileData, song.tempo]);

  // Audio playback using Web Audio API
  const playNote = (noteNumber: number, duration: number, velocity: number = 80) => {
    if (!audioContext) {
      console.log('No audio context for note:', noteNumber);
      return;
    }

    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Convert MIDI note to frequency
      const frequency = 440 * Math.pow(2, (noteNumber - 69) / 12);
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // Use a simple sine wave
      oscillator.type = 'sine';
      
      // Set volume based on velocity
      const volume = (velocity / 127) * 0.2; // Increase volume slightly
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + Math.min(duration, 1.0));
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + Math.min(duration, 1.0)); // Limit note duration
      
      console.log(`Playing note ${noteNumber} (${frequency.toFixed(1)}Hz) for ${duration.toFixed(2)}s`);
    } catch (error) {
      console.error('Error playing note:', error);
    }
  };

  // Animation loop for playback
  const animate = () => {
    if (!isPlayingRef.current) {
      console.log('Animation stopped - not playing (ref check)');
      return;
    }

    const now = performance.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    const newCurrentTime = pausedTimeRef.current + elapsed;
    
    setCurrentTime(newCurrentTime);
    
    // Log every second for debugging
    if (Math.floor(newCurrentTime) !== Math.floor(currentTime)) {
      console.log(`Playback time: ${newCurrentTime.toFixed(2)}s / ${totalDuration.toFixed(2)}s, Notes to check: ${trackData.length}`);
    }

    // Find notes that should be triggered at the current time
    const currentNotes = trackData.filter(noteEvent => {
      const noteId = `${noteEvent.note}-${noteEvent.startTime}`;
      const isTimeToPlay = noteEvent.startTime <= newCurrentTime && 
                          noteEvent.startTime > (newCurrentTime - 0.05); // 50ms window
      const notAlreadyScheduled = !scheduledNotesRef.current.has(noteId);
      
      if (isTimeToPlay && notAlreadyScheduled) {
        console.log(`Triggering note ${noteEvent.note} at time ${newCurrentTime.toFixed(2)}s (scheduled for ${noteEvent.startTime.toFixed(2)}s)`);
        return true;
      }
      return false;
    });

    // Play all notes that should start now
    currentNotes.forEach(noteEvent => {
      const noteId = `${noteEvent.note}-${noteEvent.startTime}`;
      scheduledNotesRef.current.add(noteId);
      playNote(noteEvent.note, noteEvent.duration, noteEvent.velocity);
      
      // Remove from scheduled notes after the note duration
      setTimeout(() => {
        scheduledNotesRef.current.delete(noteId);
      }, (noteEvent.duration + 0.1) * 1000);
    });

    // Stop if we've reached the end
    if (newCurrentTime >= totalDuration) {
      console.log('Reached end of track');
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentTime(totalDuration);
      pausedTimeRef.current = totalDuration;
      scheduledNotesRef.current.clear();
      return;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Playback controls
  const togglePlayback = async () => {
    if (!audioContext) {
      console.log('No audio context available');
      return;
    }

    try {
      // Resume audio context if suspended (required by browser policies)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('Audio context resumed');
      }

      if (isPlayingRef.current) {
        // Pause
        console.log('Pausing playback');
        isPlayingRef.current = false;
        setIsPlaying(false);
        pausedTimeRef.current = currentTime;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = undefined;
        }
      } else {
        // Play
        console.log('Starting playback at time:', currentTime);
        pausedTimeRef.current = currentTime;
        startTimeRef.current = performance.now();
        scheduledNotesRef.current.clear();
        
        // Set both state and ref
        isPlayingRef.current = true;
        setIsPlaying(true);
        
        // Start animation immediately
        console.log('Starting animation loop...');
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    } catch (error) {
      console.error('Error with audio context:', error);
    }
  };

  const skipTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(totalDuration, currentTime + seconds));
    console.log(`Skipping from ${currentTime.toFixed(2)}s to ${newTime.toFixed(2)}s`);
    setCurrentTime(newTime);
    pausedTimeRef.current = newTime;
    scheduledNotesRef.current.clear(); // Clear scheduled notes
    
    if (isPlaying) {
      startTimeRef.current = performance.now();
    }
  };

  const stopPlayback = () => {
    console.log('Stopping playback');
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);
    pausedTimeRef.current = 0;
    scheduledNotesRef.current.clear();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  };

  const handleTrackChange = (newTrackIndex: number) => {
    console.log(`Changing to track ${newTrackIndex}`);
    isPlayingRef.current = false; // Stop current playback immediately
    setIsPlaying(false);
    setCurrentTime(0);
    pausedTimeRef.current = 0;
    scheduledNotesRef.current.clear();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    
    setCurrentTrack(newTrackIndex);
    onTrackChange(newTrackIndex);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">MIDI Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Song Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-white mb-2">{song.title}</h4>
          <div className="text-sm text-gray-300">
            {song.fileName} • {trackData.length} note events
          </div>
        </div>

        {/* Track Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Track to Preview:
          </label>
          <select
            value={currentTrack}
            onChange={(e) => handleTrackChange(parseInt(e.target.value))}
            className="w-full bg-gray-600 text-white px-3 py-2 rounded"
          >
            {availableTracks.map((track, index) => (
              <option key={index} value={index}>
                Track {index + 1}: {track.trackName || 'Unnamed'} ({track.noteCount} notes)
                {track.instrumentName && ` - ${track.instrumentName}`}
              </option>
            ))}
          </select>
        </div>

        {/* Playback Controls */}
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-300">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </div>
            <div className="text-sm text-gray-300">
              Tempo: {song.tempo} BPM
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-600 rounded-full h-2 mb-4">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
            ></div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => skipTime(-15)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
              title="Skip back 15 seconds"
            >
              ⏪ -15s
            </button>
            
            <button
              onClick={togglePlayback}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            
            <button
              onClick={() => skipTime(15)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
              title="Skip forward 15 seconds"
            >
              ⏩ +15s
            </button>
            
            <button
              onClick={stopPlayback}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              ⏹️ Stop
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-400 text-center">
          Use the controls above to preview different tracks and find the right instrument for practice.
          <br />
          Note: Audio uses simple tones for preview purposes.
        </div>
      </div>
    </div>
  );
};
