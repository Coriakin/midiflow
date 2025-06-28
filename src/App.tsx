import { useState, useEffect } from 'react';
import { useMIDI } from './hooks/useMIDI';
import { NoteVisualizer } from './components/NoteVisualizer';
import { TinWhistlePracticeBoard } from './components/TinWhistlePracticeBoard';
import { SongInput, type Song } from './components/SongInput';
import { PracticeMode, type PracticeSession } from './components/PracticeMode';
import type { MIDIMessage, PracticeNote, InstrumentType } from './types/midi';
import { midiNoteToName, INSTRUMENT_RANGES } from './types/midi';

function App() {
  const { 
    isSupported, 
    isInitialized, 
    devices, 
    connectedDevices,
    isConnecting,
    error,
    connectToDevice,
    disconnectFromDevice,
    addMessageListener,
    removeMessageListener,
    isReady 
  } = useMIDI();

  const [practiceNotes, setPracticeNotes] = useState<PracticeNote[]>([]);
  const [lastNote, setLastNote] = useState<MIDIMessage | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('tin-whistle');
  const [customRangeMin, setCustomRangeMin] = useState<number>(48);
  const [customRangeMax, setCustomRangeMax] = useState<number>(96);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [practiceMode, setPracticeMode] = useState<'free-play' | 'guided'>('free-play');
  
  // New states for practice board
  const [currentTargetNote, setCurrentTargetNote] = useState<number | null>(null);
  const [lastPlayedNote, setLastPlayedNote] = useState<number | null>(null);
  const [isCorrectNote, setIsCorrectNote] = useState<boolean | null>(null);
  const [practiceSequence, setPracticeSequence] = useState<number[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [showCompletionMessage, setShowCompletionMessage] = useState<boolean>(false);
  const [completionMessage, setCompletionMessage] = useState<string>('');

  // Built-in songs for quick testing
  const builtInSongs: Song[] = [
    {
      id: 'twinkle-twinkle',
      title: 'Twinkle Twinkle Little Star (Complete)',
      notes: [
        // Twinkle twinkle little star
        62, 62, 69, 69, 71, 71, 69,
        // How I wonder what you are
        67, 67, 66, 66, 64, 64, 62,
        // Up above the world so high
        69, 69, 67, 67, 66, 66, 64,
        // Like a diamond in the sky
        69, 69, 67, 67, 66, 66, 64,
        // Twinkle twinkle little star
        62, 62, 69, 69, 71, 71, 69,
        // How I wonder what you are
        67, 67, 66, 66, 64, 64, 62
      ], // Complete song: D D A A B B A G G F# F# E E D (repeated with verses)
      tempo: 120
    },
    {
      id: 'mary-had-a-little-lamb',
      title: 'Mary Had a Little Lamb (Complete)',
      notes: [
        // Mary had a little lamb
        66, 64, 62, 64, 66, 66, 66,
        // Little lamb, little lamb
        64, 64, 64, 66, 69, 69,
        // Mary had a little lamb
        66, 64, 62, 64, 66, 66, 66,
        // Its fleece was white as snow
        66, 64, 64, 66, 64, 62
      ], // F# E D E F# F# F# E E E F# A A F# E D E F# F# F# F# E E F# E D
      tempo: 110
    },
    {
      id: 'happy-birthday',
      title: 'Happy Birthday (Complete)',
      notes: [
        // Happy birthday to you
        62, 62, 64, 62, 67, 66,
        // Happy birthday to you  
        62, 62, 64, 62, 69, 67,
        // Happy birthday dear [name]
        62, 62, 74, 71, 67, 66, 64,
        // Happy birthday to you
        72, 72, 71, 67, 69, 67
      ], // D D E D G F# D D E D A G D D D(high) B G F# E C C B G A G
      tempo: 100
    },
    {
      id: 'd-major-scale',
      title: 'D Major Scale (Complete - Up & Down)',
      notes: [
        // Up the scale
        62, 64, 66, 67, 69, 71, 73, 74,
        // Down the scale
        74, 73, 71, 69, 67, 66, 64, 62
      ], // D E F# G A B C# D D C# B A G F# E D
      tempo: 100
    },
    {
      id: 'hot-cross-buns',
      title: 'Hot Cross Buns (Complete)',
      notes: [
        // Hot cross buns
        71, 69, 67,
        // Hot cross buns
        71, 69, 67,
        // One a penny, two a penny
        67, 67, 67, 67, 69, 69, 69, 69,
        // Hot cross buns
        71, 69, 67
      ], // B A G B A G G G G G A A A A B A G
      tempo: 120
    },
    {
      id: 'amazing-grace',
      title: 'Amazing Grace (First Verse)',
      notes: [
        // Amazing grace how sweet the sound
        67, 71, 74, 71, 74, 76, 74,
        // That saved a wretch like me
        71, 74, 71, 69, 67,
        // I once was lost but now am found
        67, 71, 74, 71, 74, 76, 74,
        // Was blind but now I see
        71, 69, 67, 62, 67
      ], // G B D B D E D B D B A G G B D B D E D B A G D G
      tempo: 90
    },
    {
      id: 'ode-to-joy',
      title: 'Ode to Joy (Beethoven - Opening)',
      notes: [
        // First phrase
        66, 66, 67, 69, 69, 67, 66, 64, 62, 62, 64, 66, 66, 64, 64,
        // Second phrase (repeat with variation)
        66, 66, 67, 69, 69, 67, 66, 64, 62, 62, 64, 66, 64, 62, 62
      ], // F# F# G A A G F# E D D E F# F# E E F# F# G A A G F# E D D E F# E D D
      tempo: 110
    }
  ];

  // Combine built-in songs with user-created songs
  const allSongs = [...builtInSongs, ...songs];

  // Manual MIDI test function
  const testMIDIAccess = async () => {
    try {
      console.log('Testing direct MIDI access...');
      if (!navigator.requestMIDIAccess) {
        console.error('navigator.requestMIDIAccess is not available');
        return;
      }
      
      const access = await navigator.requestMIDIAccess();
      console.log('Direct MIDI access successful:', access);
      console.log('Inputs:', Array.from(access.inputs.values()));
      console.log('Outputs:', Array.from(access.outputs.values()));
    } catch (err) {
      console.error('Direct MIDI access failed:', err);
    }
  };

  // Manual MIDI initialization (triggered by user interaction)
  const initializeMIDI = async () => {
    try {
      console.log('Manual MIDI initialization...');
      if (!navigator.requestMIDIAccess) {
        alert('WebMIDI API not supported in this browser');
        return;
      }
      
      const access = await navigator.requestMIDIAccess({ sysex: false });
      console.log('MIDI access granted:', access);
      alert('MIDI access granted! Check console for details.');
    } catch (err) {
      console.error('Manual MIDI initialization failed:', err);
      alert('MIDI initialization failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Clear all notes (for debugging)
  const clearAllNotes = () => {
    setPracticeNotes([]);
    console.log('All notes cleared');
  };

  // Handle note exit from visualizer
  const handleNoteExit = (noteId: string) => {
    console.log(`App: Removing note ${noteId} from practice notes`);
    setPracticeNotes(prev => {
      const filtered = prev.filter(note => note.id !== noteId);
      console.log(`Note ${noteId} removed, remaining: ${filtered.length}`);
      return filtered;
    });
  };

  // Get current instrument range (including custom range support)
  const getCurrentInstrumentRange = () => {
    if (selectedInstrument === 'custom') {
      return { MIN: customRangeMin, MAX: customRangeMax };
    }
    return INSTRUMENT_RANGES[selectedInstrument];
  };

  // Check if note is in current instrument range (including custom)
  const isInCurrentRange = (noteNumber: number) => {
    const range = getCurrentInstrumentRange();
    return noteNumber >= range.MIN && noteNumber <= range.MAX;
  };

  // Listen for MIDI messages and create falling notes
  useEffect(() => {
    const activeNoteStates = new Map<number, number>(); // Track active notes by MIDI note number -> timestamp
    
    const handleMIDIMessage = (message: MIDIMessage) => {
      setLastNote(message);
      
      console.log(`MIDI message: ${message.type}, note: ${message.note}, in range: ${isInCurrentRange(message.note)}`);
      
      if (message.type === 'noteoff' && activeNoteStates.has(message.note)) {
        // Note released - remove from active tracking
        console.log(`Note ${message.note} released, removing from active tracking`);
        activeNoteStates.delete(message.note);
        return;
      }
      
      if (message.type === 'noteon' && isInCurrentRange(message.note)) {
        // Check if this note is already active (within last 500ms)
        const lastNoteTime = activeNoteStates.get(message.note);
        const timeSinceLastNote = lastNoteTime ? message.timestamp - lastNoteTime : Infinity;
        
        if (timeSinceLastNote < 500) { // 500ms debounce for same note
          console.log(`Skipping duplicate note ${message.note} - only ${timeSinceLastNote.toFixed(1)}ms since last`);
          return;
        }
        
        // Update active note tracking
        activeNoteStates.set(message.note, message.timestamp);
        
        // Auto-cleanup old notes from tracking (in case note-off wasn't received)
        setTimeout(() => {
          if (activeNoteStates.get(message.note) === message.timestamp) {
            console.log(`Auto-removing note ${message.note} from tracking after timeout`);
            activeNoteStates.delete(message.note);
          }
        }, 1000);
        
        // Update practice board state for tin whistle
        if (selectedInstrument === 'tin-whistle') {
          setLastPlayedNote(message.note);
          
          // Check if this matches the current target note
          if (currentTargetNote !== null) {
            // Allow for slight MIDI note variations (±1 semitone) for tin whistles
            const isCorrect = Math.abs(message.note - currentTargetNote) <= 0; // Exact match for now, can adjust if needed
            console.log(`Note played: ${midiNoteToName(message.note)} (${message.note}), Target: ${midiNoteToName(currentTargetNote)} (${currentTargetNote}), Correct: ${isCorrect}`);
            setIsCorrectNote(isCorrect);
            
            if (isCorrect) {
              console.log(`Correct note! Current index: ${currentNoteIndex}, Sequence length: ${practiceSequence.length}`);
              
              // Move to next note in sequence immediately, but show green feedback briefly
              if (practiceSequence.length > 0 && currentNoteIndex < practiceSequence.length - 1) {
                const nextIndex = currentNoteIndex + 1;
                const nextNote = practiceSequence[nextIndex];
                
                console.log(`Advancing to next note: ${midiNoteToName(nextNote)} (${nextNote}) at index ${nextIndex}`);
                
                // Update state immediately to prevent getting stuck
                setCurrentNoteIndex(nextIndex);
                setCurrentTargetNote(nextNote);
                
                // Show green feedback briefly, then reset for next note
                setTimeout(() => {
                  setIsCorrectNote(null);
                }, 500);
              } else if (currentNoteIndex >= practiceSequence.length - 1) {
                console.log('Practice sequence completed!');
                
                // Determine sequence name for completion message
                let sequenceName = 'sequence';
                if (practiceSequence.length === 7 && practiceSequence[0] === 62) {
                  sequenceName = 'D Major Scale';
                } else if (practiceSequence.length === 42 && practiceSequence[0] === 62 && practiceSequence[1] === 62) {
                  sequenceName = 'Twinkle Twinkle Little Star (Complete)';
                } else if (selectedSong) {
                  sequenceName = selectedSong.title;
                }
                
                // Show completion notification
                showPracticeCompletion(sequenceName);
                
                // Sequence completed - reset after showing green feedback
                setTimeout(() => {
                  setIsCorrectNote(null);
                  setCurrentTargetNote(null);
                  setCurrentNoteIndex(0);
                  setPracticeSequence([]);
                }, 1000);
              }
            } else {
              console.log(`Incorrect note played. Expected: ${midiNoteToName(currentTargetNote)}, Got: ${midiNoteToName(message.note)}`);
            }
          } else {
            console.log(`Free play note: ${midiNoteToName(message.note)} (${message.note})`);
          }
        }
        
        // Create a new falling note (for non-tin-whistle instruments or free play)
        const newNote: PracticeNote = {
          id: `${message.note}-${message.timestamp}-${Math.random().toString(36).substr(2, 5)}`,
          note: message.note,
          startTime: message.timestamp,
          duration: 1000, // Default duration
          isTarget: false,
          isPlayed: true,
          isCorrect: null,
          timingAccuracy: null
        };

        console.log(`Creating new note: ${newNote.id} for MIDI note ${message.note}`);

        setPracticeNotes(prev => {
          // Force cleanup of any notes that might be stuck
          const now = performance.now();
          const recentNotes = prev.filter(note => now - note.startTime < 5000); // Reduced to 5 seconds
          
          const newNotes = [...recentNotes, newNote];
          
          // Strict limit to prevent accumulation
          if (newNotes.length > 15) { // Reduced limit
            console.warn(`Note limit exceeded! Keeping most recent ${10} notes, removing ${newNotes.length - 10} oldest notes`);
            return newNotes.slice(-10);
          }
          
          console.log(`Added note, total active notes: ${newNotes.length}`);
          return newNotes;
        });
      }
    };

    addMessageListener(handleMIDIMessage);
    return () => removeMessageListener(handleMIDIMessage);
  }, [addMessageListener, removeMessageListener, selectedInstrument, currentTargetNote, practiceSequence, currentNoteIndex]);

  // Cleanup old notes periodically (backup mechanism)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = performance.now();
      setPracticeNotes(prev => {
        const filtered = prev.filter(note => now - note.startTime < 6000); // Reduced to 6 seconds
        if (filtered.length !== prev.length) {
          console.log(`Periodic cleanup: removed ${prev.length - filtered.length} old notes, remaining: ${filtered.length}`);
        }
        return filtered;
      });
    }, 1000); // Check every second instead of 2

    return () => clearInterval(cleanupInterval);
  }, []);

  // Handle song creation
  const handleSongCreate = (song: Song) => {
    setSongs(prev => [...prev, song]);
    console.log('Song created:', song);
  };

  // Handle practice session completion
  const handleSessionComplete = (session: PracticeSession) => {
    console.log('Practice session completed:', session);
    // Here we could save session data to localStorage or send to a backend
  };

  // Start a practice sequence for tin whistle
  const startPracticeSequence = (notes: number[]) => {
    setPracticeSequence(notes);
    setCurrentNoteIndex(0);
    setCurrentTargetNote(notes[0]);
    setIsCorrectNote(null);
    setLastPlayedNote(null);
    console.log('Started practice sequence:', notes.map(n => midiNoteToName(n)).join(' -> '));
  };

  // Stop practice sequence
  const stopPracticeSequence = () => {
    setPracticeSequence([]);
    setCurrentNoteIndex(0);
    setCurrentTargetNote(null);
    setIsCorrectNote(null);
    setLastPlayedNote(null);
    console.log('Stopped practice sequence');
  };

  // Reset practice sequence to beginning
  const resetPracticeSequence = () => {
    if (practiceSequence.length > 0) {
      setCurrentNoteIndex(0);
      setCurrentTargetNote(practiceSequence[0]);
      setIsCorrectNote(null);
      setLastPlayedNote(null);
      console.log('Reset practice sequence to beginning');
    }
  };

  // Skip to next note (for debugging)
  const skipToNextNote = () => {
    if (practiceSequence.length > 0 && currentNoteIndex < practiceSequence.length - 1) {
      const nextIndex = currentNoteIndex + 1;
      const nextNote = practiceSequence[nextIndex];
      setCurrentNoteIndex(nextIndex);
      setCurrentTargetNote(nextNote);
      setIsCorrectNote(null);
      console.log(`Manually skipped to note: ${midiNoteToName(nextNote)} (${nextNote}) at index ${nextIndex}`);
    }
  };

  // Show practice completion notification
  const showPracticeCompletion = (sequenceName: string) => {
    const messages = [
      `🎉 Excellent! You completed the ${sequenceName}!`,
      `🌟 Well done! ${sequenceName} finished perfectly!`,
      `✨ Fantastic! You've mastered the ${sequenceName}!`,
      `🎵 Great job! ${sequenceName} complete!`,
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    setCompletionMessage(randomMessage);
    setShowCompletionMessage(true);
    
    // Optional: Play a completion sound (if Web Audio API is available)
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play a nice ascending chord progression
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      frequencies.forEach((freq, index) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
        gain.gain.setValueAtTime(0.1, audioContext.currentTime + index * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.3);
        
        osc.start(audioContext.currentTime + index * 0.1);
        osc.stop(audioContext.currentTime + index * 0.1 + 0.3);
      });
    } catch (error) {
      console.log('Audio feedback not available:', error);
    }
    
    // Hide the message after 3 seconds
    setTimeout(() => {
      setShowCompletionMessage(false);
    }, 3000);
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">MIDIFlow</h1>
          <p className="text-xl text-red-400 mb-4">WebMIDI not supported</p>
          <p className="text-gray-400">Please use Chrome or a Chromium-based browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4">
        <h1 className="text-3xl font-bold text-center">🎵 MIDIFlow</h1>
        <p className="text-center text-gray-400 mt-2">Real-time MIDI practice with visual feedback</p>
      </header>

      {/* Practice Completion Notification */}
      {showCompletionMessage && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-500 ease-in-out transform">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg shadow-xl border-2 border-green-400 max-w-sm animate-pulse relative">
            {/* Dismiss button */}
            <button
              onClick={() => setShowCompletionMessage(false)}
              className="absolute top-2 right-2 text-white hover:text-gray-200 text-xl leading-none"
              title="Dismiss"
            >
              ×
            </button>
            
            <div className="flex items-center space-x-3 pr-6">
              <div className="text-3xl animate-bounce">🎉</div>
              <div>
                <div className="font-bold text-lg">Practice Complete!</div>
                <div className="text-sm opacity-90">{completionMessage.replace(/^🎉|🌟|✨|🎵\s*/, '')}</div>
              </div>
            </div>
            
            {/* Progress bar animation */}
            <div className="mt-3 w-full bg-green-700 rounded-full h-1">
              <div className="bg-white h-1 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto p-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* MIDI Status */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">MIDI Status</h2>
          
          {/* Instrument Selection */}
          <div className="bg-gray-700 p-3 rounded mb-4">
            <h3 className="font-medium mb-2">Instrument Settings:</h3>
            <div className="flex flex-wrap gap-2">
              <label className="text-sm text-gray-300">Select your instrument:</label>
              <select
                value={selectedInstrument}
                onChange={(e) => setSelectedInstrument(e.target.value as InstrumentType)}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                <option value="tin-whistle">Tin Whistle</option>
                <option value="flute">Flute</option>
                <option value="violin">Violin</option>
                <option value="guitar">Guitar</option>
                <option value="saxophone">Saxophone</option>
                <option value="full-keyboard">Piano/Keyboard</option>
                <option value="custom">Custom Range</option>
              </select>
              <span className="text-xs text-gray-400 ml-2">
                Range: {getCurrentInstrumentRange().MIN}-{getCurrentInstrumentRange().MAX}
              </span>
            </div>
            
            {/* Custom Range Configuration */}
            {selectedInstrument === 'custom' && (
              <div className="mt-3 p-3 bg-gray-600 rounded">
                <h4 className="text-sm font-medium mb-2">Custom Range Configuration:</h4>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-300">Min Note:</label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={customRangeMin}
                      onChange={(e) => setCustomRangeMin(Number(e.target.value))}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-16"
                    />
                    <span className="text-xs text-gray-400">({midiNoteToName(customRangeMin)})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-300">Max Note:</label>
                    <input
                      type="number"
                      min="0"
                      max="127"
                      value={customRangeMax}
                      onChange={(e) => setCustomRangeMax(Number(e.target.value))}
                      className="bg-gray-700 text-white px-2 py-1 rounded text-sm w-16"
                    />
                    <span className="text-xs text-gray-400">({midiNoteToName(customRangeMax)})</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Enter MIDI note numbers (0-127). Middle C = 60, A4 = 69.
                </div>
              </div>
            )}
          </div>
          
          {/* Debug Information */}
          <div className="bg-gray-700 p-3 rounded mb-4 text-sm">
            <h3 className="font-medium mb-2">Debug Information:</h3>
            <div className="space-y-1">
              <div>Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome/Chromium' : 'Other'}</div>
              <div>WebMIDI API Available: {typeof navigator.requestMIDIAccess !== 'undefined' ? 'Yes' : 'No'}</div>
              <div>HTTPS: {window.location.protocol === 'https:' ? 'Yes' : 'No (localhost OK)'}</div>
              <div>Is Supported: {isSupported ? 'Yes' : 'No'}</div>
              <div>Is Initialized: {isInitialized ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'None'}</div>
              <div>Active Notes: {practiceNotes.length}</div>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={testMIDIAccess}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Test Direct MIDI Access
              </button>
              <button
                onClick={initializeMIDI}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                Manual MIDI Init
              </button>
              <button
                onClick={clearAllNotes}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Clear Notes
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>WebMIDI Support: {isSupported ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span>Initialized: {isInitialized ? 'Yes' : 'Initializing...'}</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${connectedDevices.length > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span>Connected Devices: {connectedDevices.length}</span>
            </div>
          </div>

          {/* Device List */}
          {devices.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Available Devices:</h3>
              <div className="space-y-2">
                {devices.map(device => (
                  <div key={device.id} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                    <div>
                      <span className="font-medium">{device.name}</span>
                      <span className="text-gray-400 ml-2">({device.manufacturer})</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${
                        device.state === 'connected' ? 'bg-green-600' : 'bg-gray-600'
                      }`}>
                        {device.state}
                      </span>
                    </div>
                    <div>
                      {device.state === 'connected' ? (
                        <button
                          onClick={() => disconnectFromDevice(device.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => connectToDevice(device.id)}
                          disabled={isConnecting}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
                        >
                          {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Notes Count */}
            <div className="p-3 bg-gray-700 rounded">
              <strong>Active Notes:</strong> <span className="text-blue-400">{practiceNotes.length}</span>
              <div className="text-sm text-gray-400 mt-1">
                Notes in animation
              </div>
              {practiceNotes.length > 0 && (
                <div className="text-xs text-gray-500 mt-2">
                  Last 3: {practiceNotes.slice(-3).map(n => `${midiNoteToName(n.note)}(${n.note})`).join(', ')}
                </div>
              )}
            </div>
            
            {/* Last Note Display */}
            {lastNote && (
              <div className="p-3 bg-gray-700 rounded">
                <strong>Last Note:</strong> {midiNoteToName(lastNote.note)} 
                (MIDI {lastNote.note}) - {lastNote.type} 
                <span className="text-gray-400 ml-2">
                  vel: {lastNote.velocity}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  In range: {isInCurrentRange(lastNote.note) ? 'Yes' : 'No'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Practice Mode Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3">Practice Mode</h2>
          
          {/* Mode Selector */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setPracticeMode('free-play')}
              className={`px-4 py-2 rounded font-medium ${
                practiceMode === 'free-play' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Free Play
            </button>
            <button
              onClick={() => setPracticeMode('guided')}
              className={`px-4 py-2 rounded font-medium ${
                practiceMode === 'guided' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Guided Practice
            </button>
          </div>

          {/* Song Management (only show in guided mode) */}
          {practiceMode === 'guided' && (
            <div className="space-y-4">
              {/* Song Input */}
              <SongInput onSongCreate={handleSongCreate} />

              {/* Song Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Select a song to practice:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {allSongs.map(song => (
                    <button
                      key={song.id}
                      onClick={() => setSelectedSong(song)}
                      className={`p-3 rounded border text-left ${
                        selectedSong?.id === song.id
                          ? 'bg-blue-700 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium">{song.title}</div>
                      <div className="text-xs text-gray-400">
                        {song.notes.length} notes • {song.tempo} BPM
                        {builtInSongs.find(b => b.id === song.id) && (
                          <span className="ml-2 text-green-400">• Built-in</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Practice Controls for Tin Whistle */}
              {selectedInstrument === 'tin-whistle' && selectedSong && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Practice Controls:</h4>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => startPracticeSequence(selectedSong.notes)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-500"
                    >
                      Start Practice
                    </button>
                    <button
                      onClick={resetPracticeSequence}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-500"
                      disabled={practiceSequence.length === 0}
                    >
                      Reset
                    </button>
                    <button
                      onClick={skipToNextNote}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
                      disabled={practiceSequence.length === 0 || currentNoteIndex >= practiceSequence.length - 1}
                      title="Skip to next note (for debugging)"
                    >
                      Skip Note
                    </button>
                    <button
                      onClick={stopPracticeSequence}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500"
                      disabled={practiceSequence.length === 0}
                    >
                      Stop
                    </button>
                  </div>
                  {practiceSequence.length > 0 && (
                    <div className="mt-2 text-sm text-gray-300">
                      Progress: {currentNoteIndex + 1} of {practiceSequence.length} notes
                      {currentTargetNote && (
                        <span className="ml-2 text-yellow-400">
                          • Current: {midiNoteToName(currentTargetNote)} (MIDI {currentTargetNote})
                        </span>
                      )}
                      <div className="mt-1 text-xs text-gray-400">
                        Sequence: {practiceSequence.map((note, idx) => 
                          `${midiNoteToName(note)}${idx === currentNoteIndex ? '←' : ''}`
                        ).join(' → ')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Free Play Controls for Tin Whistle */}
          {practiceMode === 'free-play' && selectedInstrument === 'tin-whistle' && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Quick Practice:</h4>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => startPracticeSequence([62, 64, 66, 67, 69, 71, 74])} // D major scale
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
                >
                  D Scale
                </button>
                <button
                  onClick={() => {
                    const twinkleSong = builtInSongs.find(song => song.id === 'twinkle-twinkle');
                    if (twinkleSong) {
                      startPracticeSequence(twinkleSong.notes);
                    }
                  }}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-500"
                >
                  Twinkle Twinkle (Full)
                </button>
                <button
                  onClick={skipToNextNote}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
                  disabled={practiceSequence.length === 0 || currentNoteIndex >= practiceSequence.length - 1}
                  title="Skip to next note (for debugging)"
                >
                  Skip Note
                </button>
                <button
                  onClick={stopPracticeSequence}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500"
                  disabled={practiceSequence.length === 0}
                >
                  Stop Practice
                </button>
              </div>
              {practiceSequence.length > 0 && (
                <div className="mt-2 text-sm text-gray-300">
                  Progress: {currentNoteIndex + 1} of {practiceSequence.length} notes
                  {currentTargetNote && (
                    <span className="ml-2 text-yellow-400">
                      • Current: {midiNoteToName(currentTargetNote)} (MIDI {currentTargetNote})
                    </span>
                  )}
                  <div className="mt-1 text-xs text-gray-400">
                    Sequence: {practiceSequence.map((note, idx) => 
                      `${midiNoteToName(note)}${idx === currentNoteIndex ? '←' : ''}`
                    ).join(' → ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Note Visualizer */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">
              {practiceMode === 'free-play' ? 'Free Play Area' : 'Practice Area'}
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Main practice area */}
              <div>
                {selectedInstrument === 'tin-whistle' ? (                <TinWhistlePracticeBoard
                  currentTargetNote={currentTargetNote}
                  lastPlayedNote={lastPlayedNote}
                  isCorrectNote={isCorrectNote}
                  className="h-auto"
                />
                ) : practiceMode === 'free-play' ? (
                  <NoteVisualizer 
                    notes={practiceNotes}
                    className="h-96 rounded border border-gray-600"
                    onNoteExit={handleNoteExit}
                    instrumentType={selectedInstrument}
                    customRange={selectedInstrument === 'custom' ? { MIN: customRangeMin, MAX: customRangeMax } : undefined}
                  />
                ) : (                <PracticeMode
                  song={selectedSong}
                  lastPlayedNote={lastNote?.note || null}
                  onSessionComplete={handleSessionComplete}
                  onExpectedNoteChange={() => {}} // No longer using this callback
                  className="h-96"
                />
                )}
              </div>
            </div>
            
            {isReady && connectedDevices.length === 0 && (
              <div className="text-center text-gray-400 mt-4">
                <p>Connect a MIDI device to start practicing!</p>
                <p className="text-sm">Make sure your MIDI controller or instrument is connected.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
