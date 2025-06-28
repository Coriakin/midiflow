import type { Song, MIDISong } from '../types/midi';

// Local storage keys
const MIDI_SONGS_STORAGE_KEY = 'midiflow-midi-songs';
const MANUAL_SONGS_STORAGE_KEY = 'midiflow-manual-songs';

// Utility functions for ArrayBuffer <-> base64 conversion
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// MIDI Songs persistence
export const saveMidiSongsToStorage = (songs: MIDISong[]): void => {
  try {
    // Convert ArrayBuffer to base64 for storage
    const songsForStorage = songs.map(song => ({
      ...song,
      fileData: song.fileData ? arrayBufferToBase64(song.fileData) : undefined
    }));
    localStorage.setItem(MIDI_SONGS_STORAGE_KEY, JSON.stringify(songsForStorage));
    console.log(`✅ Saved ${songs.length} MIDI songs to localStorage`);
  } catch (error) {
    console.error('❌ Failed to save MIDI songs to localStorage:', error);
  }
};

export const loadMidiSongsFromStorage = (): MIDISong[] => {
  try {
    const stored = localStorage.getItem(MIDI_SONGS_STORAGE_KEY);
    if (!stored) return [];
    
    const songsFromStorage = JSON.parse(stored);
    // Convert base64 back to ArrayBuffer
    const songs = songsFromStorage.map((song: any) => ({
      ...song,
      fileData: song.fileData ? base64ToArrayBuffer(song.fileData) : undefined
    }));
    console.log(`✅ Loaded ${songs.length} MIDI songs from localStorage`);
    return songs;
  } catch (error) {
    console.error('❌ Failed to load MIDI songs from localStorage:', error);
    return [];
  }
};

// Manual Songs persistence
export const saveManualSongsToStorage = (songs: Song[]): void => {
  try {
    localStorage.setItem(MANUAL_SONGS_STORAGE_KEY, JSON.stringify(songs));
    console.log(`✅ Saved ${songs.length} manual songs to localStorage`);
  } catch (error) {
    console.error('❌ Failed to save manual songs to localStorage:', error);
  }
};

export const loadManualSongsFromStorage = (): Song[] => {
  try {
    const stored = localStorage.getItem(MANUAL_SONGS_STORAGE_KEY);
    if (!stored) return [];
    
    const songs = JSON.parse(stored);
    console.log(`✅ Loaded ${songs.length} manual songs from localStorage`);
    return songs;
  } catch (error) {
    console.error('❌ Failed to load manual songs from localStorage:', error);
    return [];
  }
};

// Clear all stored songs (useful for development/testing)
export const clearAllStoredSongs = (): void => {
  try {
    localStorage.removeItem(MIDI_SONGS_STORAGE_KEY);
    localStorage.removeItem(MANUAL_SONGS_STORAGE_KEY);
    console.log('✅ Cleared all stored songs from localStorage');
  } catch (error) {
    console.error('❌ Failed to clear stored songs:', error);
  }
};

// Get storage usage info
export const getStorageInfo = (): { midiSongs: number; manualSongs: number; totalSize: string } => {
  try {
    const midiStored = localStorage.getItem(MIDI_SONGS_STORAGE_KEY);
    const manualStored = localStorage.getItem(MANUAL_SONGS_STORAGE_KEY);
    
    const midiSongs = midiStored ? JSON.parse(midiStored).length : 0;
    const manualSongs = manualStored ? JSON.parse(manualStored).length : 0;
    
    const totalSize = ((midiStored?.length || 0) + (manualStored?.length || 0)) / 1024;
    const totalSizeStr = totalSize > 1024 
      ? `${(totalSize / 1024).toFixed(1)} MB` 
      : `${totalSize.toFixed(1)} KB`;
    
    return { midiSongs, manualSongs, totalSize: totalSizeStr };
  } catch (error) {
    console.error('❌ Failed to get storage info:', error);
    return { midiSongs: 0, manualSongs: 0, totalSize: '0 KB' };
  }
};
