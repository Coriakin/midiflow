import MidiParser from 'midi-parser-js';
import { ParsedMIDIFile, MIDITrackInfo, GM_INSTRUMENT_NAMES, MIDISong } from '../../types/midi';

/**
 * Parse a MIDI file and extract track information
 */
export function parseMIDIFile(file: File): Promise<ParsedMIDIFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Parse the MIDI file
        const midiData = MidiParser.parse(uint8Array);
        
        // Extract track information
        const tracks: MIDITrackInfo[] = midiData.track.map((track: any, index: number) => {
          const channelNumbers = new Set<number>();
          const instrumentNumbers = new Set<number>();
          const notes: number[] = [];
          let trackName: string | undefined;
          
          // Analyze track events
          track.event.forEach((event: any) => {
            // Get track name from meta events
            if (event.type === 255 && event.metaType === 3) {
              trackName = event.data ? new TextDecoder().decode(new Uint8Array(event.data)) : undefined;
            }
            
            // Get program changes (instrument changes)
            if (event.type === 12) { // Program Change
              instrumentNumbers.add(event.data);
            }
            
            // Get note events
            if (event.type === 9 && event.data && event.data.length >= 2) { // Note On
              const noteNumber = event.data[0];
              const velocity = event.data[1];
              if (velocity > 0) { // Velocity 0 is actually note off
                notes.push(noteNumber);
                channelNumbers.add(event.channel || 0);
              }
            }
          });
          
          // Calculate note range
          const noteRange = notes.length > 0 
            ? { min: Math.min(...notes), max: Math.max(...notes) }
            : { min: 0, max: 0 };
          
          // Get primary instrument name
          const primaryInstrument = Array.from(instrumentNumbers)[0];
          const instrumentName = primaryInstrument !== undefined 
            ? GM_INSTRUMENT_NAMES[primaryInstrument] || `Instrument ${primaryInstrument}`
            : undefined;
          
          return {
            trackIndex: index,
            trackName,
            channelNumbers: Array.from(channelNumbers),
            instrumentNumbers: Array.from(instrumentNumbers),
            noteCount: notes.length,
            noteRange,
            instrumentName
          };
        });
        
        // Calculate tempo changes
        const tempoChanges: Array<{ tick: number; bpm: number }> = [];
        let defaultTempo = 120; // Default BPM
        
        // Look for tempo changes in all tracks
        midiData.track.forEach((track: any) => {
          track.event.forEach((event: any) => {
            if (event.type === 255 && event.metaType === 81) { // Set Tempo
              const microsecondsPerBeat = (event.data[0] << 16) | (event.data[1] << 8) | event.data[2];
              const bpm = Math.round(60000000 / microsecondsPerBeat);
              tempoChanges.push({ tick: event.deltaTime, bpm });
              if (tempoChanges.length === 1) {
                defaultTempo = bpm;
              }
            }
          });
        });
        
        // If no tempo changes found, use default
        if (tempoChanges.length === 0) {
          tempoChanges.push({ tick: 0, bpm: defaultTempo });
        }
        
        // Calculate total duration (simplified)
        const totalTicks = Math.max(...midiData.track.map((track: any) => 
          track.event.reduce((max: number, event: any) => Math.max(max, event.deltaTime), 0)
        ));
        
        const ticksPerBeat = midiData.ticksPerBeat || 480;
        const durationInSeconds = (totalTicks / ticksPerBeat) * (60 / defaultTempo);
        
        const result: ParsedMIDIFile = {
          fileName: file.name,
          tracks,
          ticksPerBeat,
          tempoChanges,
          totalTicks,
          durationInSeconds
        };
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse MIDI file: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read MIDI file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract notes from a specific track in a MIDI file
 */
export function extractNotesFromTrack(file: File, trackIndex: number): Promise<{ notes: number[]; tempo: number; notesWithTiming?: Array<{ note: number; startTime: number; duration: number }> }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        const midiData = MidiParser.parse(uint8Array);
        
        if (trackIndex >= midiData.track.length) {
          reject(new Error(`Track index ${trackIndex} not found`));
          return;
        }
        
        const track = midiData.track[trackIndex];
        const notes: number[] = [];
        const notesWithTiming: Array<{ note: number; startTime: number; duration: number }> = [];
        const noteOnEvents: Map<number, { tick: number; velocity: number }> = new Map();
        
        let currentTick = 0;
        let tempo = 120; // Default BPM
        
        // First pass: find tempo
        midiData.track.forEach((t: any) => {
          t.event.forEach((event: any) => {
            if (event.type === 255 && event.metaType === 81) { // Set Tempo
              const microsecondsPerBeat = (event.data[0] << 16) | (event.data[1] << 8) | event.data[2];
              tempo = Math.round(60000000 / microsecondsPerBeat);
            }
          });
        });
        
        const ticksPerBeat = midiData.ticksPerBeat || 480;
        
        // Second pass: extract notes from selected track
        track.event.forEach((event: any) => {
          currentTick += event.deltaTime;
          
          if (event.type === 9 && event.data && event.data.length >= 2) { // Note On
            const noteNumber = event.data[0];
            const velocity = event.data[1];
            
            if (velocity > 0) {
              notes.push(noteNumber);
              noteOnEvents.set(noteNumber, { tick: currentTick, velocity });
            } else {
              // Velocity 0 is note off
              const noteOn = noteOnEvents.get(noteNumber);
              if (noteOn) {
                const startTime = noteOn.tick / ticksPerBeat; // in beats
                const duration = (currentTick - noteOn.tick) / ticksPerBeat; // in beats
                notesWithTiming.push({ note: noteNumber, startTime, duration });
                noteOnEvents.delete(noteNumber);
              }
            }
          } else if (event.type === 8 && event.data && event.data.length >= 2) { // Note Off
            const noteNumber = event.data[0];
            const noteOn = noteOnEvents.get(noteNumber);
            if (noteOn) {
              const startTime = noteOn.tick / ticksPerBeat; // in beats
              const duration = (currentTick - noteOn.tick) / ticksPerBeat; // in beats
              notesWithTiming.push({ note: noteNumber, startTime, duration });
              noteOnEvents.delete(noteNumber);
            }
          }
        });
        
        // Handle any remaining note-on events (notes that never got note-off)
        noteOnEvents.forEach((noteOn, noteNumber) => {
          const startTime = noteOn.tick / ticksPerBeat;
          const duration = 0.5; // Default duration for hanging notes
          notesWithTiming.push({ note: noteNumber, startTime, duration });
        });
        
        // Sort notes with timing by start time
        notesWithTiming.sort((a, b) => a.startTime - b.startTime);
        
        resolve({
          notes: notes.length > 0 ? notes : notesWithTiming.map(n => n.note),
          tempo,
          notesWithTiming: notesWithTiming.length > 0 ? notesWithTiming : undefined
        });
      } catch (error) {
        reject(new Error(`Failed to extract notes from track: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read MIDI file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert a parsed MIDI file to a MIDISong
 */
export function createMIDISongFromFile(
  parsedFile: ParsedMIDIFile, 
  selectedTrack: number, 
  title?: string
): Promise<MIDISong> {
  // Create a File object from the parsed data (we'll need the original file for this)
  // For now, we'll create a simplified version
  const track = parsedFile.tracks[selectedTrack];
  if (!track) {
    return Promise.reject(new Error(`Track ${selectedTrack} not found`));
  }
  
  // This is a simplified version - in practice, we'd need the original file
  // to extract the actual notes
  const song: MIDISong = {
    id: `midi-${Date.now()}-${selectedTrack}`,
    title: title || `${parsedFile.fileName} - Track ${selectedTrack + 1}`,
    notes: [], // This would be populated by extractNotesFromTrack
    tempo: parsedFile.tempoChanges[0]?.bpm || 120,
    source: 'midi-file',
    fileName: parsedFile.fileName,
    selectedTrack,
    originalMIDIData: parsedFile,
    availableTracks: parsedFile.tracks
  };
  
  return Promise.resolve(song);
}

/**
 * Extract notes from a specific track using ArrayBuffer data
 */
export function extractNotesFromArrayBuffer(fileData: ArrayBuffer, trackIndex: number): { notes: number[]; tempo: number; notesWithTiming?: Array<{ note: number; startTime: number; duration: number }> } {
  const uint8Array = new Uint8Array(fileData);
  const midiData = MidiParser.parse(uint8Array);
  
  if (trackIndex >= midiData.track.length) {
    throw new Error(`Track index ${trackIndex} not found`);
  }
  
  const track = midiData.track[trackIndex];
  const notes: number[] = [];
  const notesWithTiming: Array<{ note: number; startTime: number; duration: number }> = [];
  const noteOnEvents: Map<number, { tick: number; velocity: number }> = new Map();
  
  let currentTick = 0;
  let tempo = 120; // Default BPM
  
  // First pass: find tempo and extract basic info
  track.event.forEach((event: any) => {
    currentTick += event.deltaTime;
    
    if (event.type === 255 && event.metaType === 81 && event.data) { // Set Tempo
      const microsecondsPerBeat = (event.data[0] << 16) | (event.data[1] << 8) | event.data[2];
      tempo = Math.round(60000000 / microsecondsPerBeat);
    }
  });
  
  const ticksPerBeat = midiData.ticksPerBeat || 480;
  currentTick = 0; // Reset for second pass
  
  // Second pass: extract notes
  track.event.forEach((event: any) => {
    currentTick += event.deltaTime;
    
    if (event.type === 9 && event.data && event.data.length >= 2) { // Note On
      const noteNumber = event.data[0];
      const velocity = event.data[1];
      
      if (velocity > 0) {
        notes.push(noteNumber);
        noteOnEvents.set(noteNumber, { tick: currentTick, velocity });
      } else {
        // Velocity 0 is note off
        const noteOn = noteOnEvents.get(noteNumber);
        if (noteOn) {
          const startTime = noteOn.tick / ticksPerBeat; // in beats
          const duration = (currentTick - noteOn.tick) / ticksPerBeat; // in beats
          notesWithTiming.push({ note: noteNumber, startTime, duration });
          noteOnEvents.delete(noteNumber);
        }
      }
    } else if (event.type === 8 && event.data && event.data.length >= 2) { // Note Off
      const noteNumber = event.data[0];
      const noteOn = noteOnEvents.get(noteNumber);
      if (noteOn) {
        const startTime = noteOn.tick / ticksPerBeat; // in beats
        const duration = (currentTick - noteOn.tick) / ticksPerBeat; // in beats
        notesWithTiming.push({ note: noteNumber, startTime, duration });
        noteOnEvents.delete(noteNumber);
      }
    }
  });
  
  // Handle any remaining note-on events (notes that never had note-off)
  noteOnEvents.forEach((noteOn, noteNumber) => {
    const startTime = noteOn.tick / ticksPerBeat;
    const duration = 0.5; // Default half-beat duration
    notesWithTiming.push({ note: noteNumber, startTime, duration });
  });
  
  // Sort notes by timing
  notesWithTiming.sort((a, b) => a.startTime - b.startTime);
  
  return { notes, tempo, notesWithTiming };
}
