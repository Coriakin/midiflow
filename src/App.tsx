import { useState, useEffect } from 'react';
import { useMIDI } from './hooks/useMIDI';
import { TinWhistlePracticeBoard } from './components/TinWhistlePracticeBoard';
import { TinWhistleSequentialPractice } from './components/TinWhistleSequentialPractice';
import { SongInput } from './components/SongInput';
import { MIDIFileUploader } from './components/MIDIFileUploader';
import { MIDIPreview } from './components/MIDIPreview';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { SimulatedMIDIPlayer } from './components/SimulatedMIDIPlayer';
import type { MIDIMessage, InstrumentType, Song, MIDISong, AnySong } from './types/midi';
import { midiNoteToName, INSTRUMENT_RANGES } from './types/midi';
import { extractNotesFromArrayBuffer } from './lib/midi/midiFileParser';
import { 
  saveMidiSongsToStorage, 
  loadMidiSongsFromStorage, 
  saveManualSongsToStorage, 
  loadManualSongsFromStorage,
  clearAllStoredSongs,
  getStorageInfo
} from './utils/storage';
import { loadMarkdownFile } from './utils/markdown';

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

  const [lastNote, setLastNote] = useState<MIDIMessage | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('tin-whistle');
  const [customRangeMin, setCustomRangeMin] = useState<number>(48);
  const [customRangeMax, setCustomRangeMax] = useState<number>(96);
  const [songs, setSongs] = useState<Song[]>([]);
  const [midiSongs, setMidiSongs] = useState<MIDISong[]>([]);
  const [selectedSong, setSelectedSong] = useState<AnySong | null>(null);
  
  // Load songs from localStorage on component mount
  useEffect(() => {
    console.log('🔄 Loading songs from localStorage...');
    const savedMidiSongs = loadMidiSongsFromStorage();
    const savedManualSongs = loadManualSongsFromStorage();
    
    if (savedMidiSongs.length > 0) {
      setMidiSongs(savedMidiSongs);
    }
    
    if (savedManualSongs.length > 0) {
      setSongs(savedManualSongs);
    }
  }, []);
  
  // Save MIDI songs to localStorage whenever they change
  useEffect(() => {
    if (midiSongs.length > 0) {
      saveMidiSongsToStorage(midiSongs);
    }
  }, [midiSongs]);
  
  // Save manual songs to localStorage whenever they change
  useEffect(() => {
    if (songs.length > 0) {
      saveManualSongsToStorage(songs);
    }
  }, [songs]);

  // Load About content from markdown file
  useEffect(() => {
    const loadAboutContent = async () => {
      try {
        const content = await loadMarkdownFile('/about.md');
        setAboutContent(content);
        setAboutError(null);
      } catch (error) {
        console.error('Failed to load About content:', error);
        setAboutError('Failed to load About content');
      }
    };
    
    loadAboutContent();
  }, []);
  
  // MIDI Preview state
  const [previewSong, setPreviewSong] = useState<MIDISong | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // Sequential practice states
  const [currentTargetNote, setCurrentTargetNote] = useState<number | null>(null);
  const [lastPlayedNote, setLastPlayedNote] = useState<number | null>(null);
  const [isCorrectNote, setIsCorrectNote] = useState<boolean | null>(null);
  const [practiceSequence, setPracticeSequence] = useState<number[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [showCompletionMessage, setShowCompletionMessage] = useState<boolean>(false);
  const [completionMessage, setCompletionMessage] = useState<string>('');

  // Song editing state
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'practice' | 'create' | 'midi-status' | 'about'>('practice');

  // About content state
  const [aboutContent, setAboutContent] = useState<string>('');
  const [aboutError, setAboutError] = useState<string | null>(null);

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
      tempo: 120,
      notesWithTiming: [
        // Twinkle twinkle little star (each note is a quarter note)
        { note: 62, startTime: 0, duration: 1 },    // Twin-
        { note: 62, startTime: 1, duration: 1 },    // -kle
        { note: 69, startTime: 2, duration: 1 },    // twin-
        { note: 69, startTime: 3, duration: 1 },    // -kle
        { note: 71, startTime: 4, duration: 1 },    // lit-
        { note: 71, startTime: 5, duration: 1 },    // -tle
        { note: 69, startTime: 6, duration: 2 },    // star (half note)
        
        // How I wonder what you are
        { note: 67, startTime: 8, duration: 1 },    // How
        { note: 67, startTime: 9, duration: 1 },    // I
        { note: 66, startTime: 10, duration: 1 },   // won-
        { note: 66, startTime: 11, duration: 1 },   // -der
        { note: 64, startTime: 12, duration: 1 },   // what
        { note: 64, startTime: 13, duration: 1 },   // you
        { note: 62, startTime: 14, duration: 2 },   // are (half note)
        
        // Up above the world so high
        { note: 69, startTime: 16, duration: 1 },   // Up
        { note: 69, startTime: 17, duration: 1 },   // a-
        { note: 67, startTime: 18, duration: 1 },   // -bove
        { note: 67, startTime: 19, duration: 1 },   // the
        { note: 66, startTime: 20, duration: 1 },   // world
        { note: 66, startTime: 21, duration: 1 },   // so
        { note: 64, startTime: 22, duration: 2 },   // high (half note)
        
        // Like a diamond in the sky
        { note: 69, startTime: 24, duration: 1 },   // Like
        { note: 69, startTime: 25, duration: 1 },   // a
        { note: 67, startTime: 26, duration: 1 },   // dia-
        { note: 67, startTime: 27, duration: 1 },   // -mond
        { note: 66, startTime: 28, duration: 1 },   // in
        { note: 66, startTime: 29, duration: 1 },   // the
        { note: 64, startTime: 30, duration: 2 },   // sky (half note)
        
        // Twinkle twinkle little star (repeat)
        { note: 62, startTime: 32, duration: 1 },   // Twin-
        { note: 62, startTime: 33, duration: 1 },   // -kle
        { note: 69, startTime: 34, duration: 1 },   // twin-
        { note: 69, startTime: 35, duration: 1 },   // -kle
        { note: 71, startTime: 36, duration: 1 },   // lit-
        { note: 71, startTime: 37, duration: 1 },   // -tle
        { note: 69, startTime: 38, duration: 2 },   // star (half note)
        
        // How I wonder what you are (repeat)
        { note: 67, startTime: 40, duration: 1 },   // How
        { note: 67, startTime: 41, duration: 1 },   // I
        { note: 66, startTime: 42, duration: 1 },   // won-
        { note: 66, startTime: 43, duration: 1 },   // -der
        { note: 64, startTime: 44, duration: 1 },   // what
        { note: 64, startTime: 45, duration: 1 },   // you
        { note: 62, startTime: 46, duration: 2 },   // are (half note)
      ]
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
      tempo: 110,
      notesWithTiming: [
        // Mary had a little lamb
        { note: 66, startTime: 0, duration: 1 },    // Ma-
        { note: 64, startTime: 1, duration: 1 },    // -ry
        { note: 62, startTime: 2, duration: 1 },    // had
        { note: 64, startTime: 3, duration: 1 },    // a
        { note: 66, startTime: 4, duration: 1 },    // lit-
        { note: 66, startTime: 5, duration: 1 },    // -tle
        { note: 66, startTime: 6, duration: 2 },    // lamb (half note)
        
        // Little lamb, little lamb
        { note: 64, startTime: 8, duration: 1 },    // Lit-
        { note: 64, startTime: 9, duration: 1 },    // -tle
        { note: 64, startTime: 10, duration: 2 },   // lamb (half note)
        { note: 66, startTime: 12, duration: 1 },   // lit-
        { note: 69, startTime: 13, duration: 1 },   // -tle
        { note: 69, startTime: 14, duration: 2 },   // lamb (half note)
        
        // Mary had a little lamb
        { note: 66, startTime: 16, duration: 1 },   // Ma-
        { note: 64, startTime: 17, duration: 1 },   // -ry
        { note: 62, startTime: 18, duration: 1 },   // had
        { note: 64, startTime: 19, duration: 1 },   // a
        { note: 66, startTime: 20, duration: 1 },   // lit-
        { note: 66, startTime: 21, duration: 1 },   // -tle
        { note: 66, startTime: 22, duration: 2 },   // lamb (half note)
        
        // Its fleece was white as snow
        { note: 66, startTime: 24, duration: 1 },   // Its
        { note: 64, startTime: 25, duration: 1 },   // fleece
        { note: 64, startTime: 26, duration: 1 },   // was
        { note: 66, startTime: 27, duration: 1 },   // white
        { note: 64, startTime: 28, duration: 1 },   // as
        { note: 62, startTime: 29, duration: 3 },   // snow (dotted half note)
      ]
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
      tempo: 100,
      notesWithTiming: [
        // Happy birthday to you
        { note: 62, startTime: 0, duration: 0.75 },   // Hap-
        { note: 62, startTime: 0.75, duration: 0.25 }, // -py
        { note: 64, startTime: 1, duration: 1 },      // birth-
        { note: 62, startTime: 2, duration: 1 },      // -day
        { note: 67, startTime: 3, duration: 1 },      // to
        { note: 66, startTime: 4, duration: 2 },      // you (half note)
        
        // Happy birthday to you
        { note: 62, startTime: 6, duration: 0.75 },   // Hap-
        { note: 62, startTime: 6.75, duration: 0.25 }, // -py
        { note: 64, startTime: 7, duration: 1 },      // birth-
        { note: 62, startTime: 8, duration: 1 },      // -day
        { note: 69, startTime: 9, duration: 1 },      // to
        { note: 67, startTime: 10, duration: 2 },     // you (half note)
        
        // Happy birthday dear [name]
        { note: 62, startTime: 12, duration: 0.75 },  // Hap-
        { note: 62, startTime: 12.75, duration: 0.25 }, // -py
        { note: 74, startTime: 13, duration: 1 },     // birth-
        { note: 71, startTime: 14, duration: 1 },     // -day
        { note: 67, startTime: 15, duration: 1 },     // dear
        { note: 66, startTime: 16, duration: 1 },     // [name]
        { note: 64, startTime: 17, duration: 2 },     // (pause, half note)
        
        // Happy birthday to you
        { note: 72, startTime: 19, duration: 0.75 },  // Hap-
        { note: 72, startTime: 19.75, duration: 0.25 }, // -py
        { note: 71, startTime: 20, duration: 1 },     // birth-
        { note: 67, startTime: 21, duration: 1 },     // -day
        { note: 69, startTime: 22, duration: 1 },     // to
        { note: 67, startTime: 23, duration: 3 },     // you (dotted half note)
      ]
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
      tempo: 100,
      notesWithTiming: [
        // Up the scale
        { note: 62, startTime: 0, duration: 1 },    // D
        { note: 64, startTime: 1, duration: 1 },    // E
        { note: 66, startTime: 2, duration: 1 },    // F#
        { note: 67, startTime: 3, duration: 1 },    // G
        { note: 69, startTime: 4, duration: 1 },    // A
        { note: 71, startTime: 5, duration: 1 },    // B
        { note: 73, startTime: 6, duration: 1 },    // C#
        { note: 74, startTime: 7, duration: 1 },    // D (high)
        
        // Down the scale
        { note: 74, startTime: 8, duration: 1 },    // D (high)
        { note: 73, startTime: 9, duration: 1 },    // C#
        { note: 71, startTime: 10, duration: 1 },   // B
        { note: 69, startTime: 11, duration: 1 },   // A
        { note: 67, startTime: 12, duration: 1 },   // G
        { note: 66, startTime: 13, duration: 1 },   // F#
        { note: 64, startTime: 14, duration: 1 },   // E
        { note: 62, startTime: 15, duration: 2 },   // D (final, half note)
      ]
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
      tempo: 120,
      notesWithTiming: [
        // Hot cross buns
        { note: 71, startTime: 0, duration: 1 },    // Hot
        { note: 69, startTime: 1, duration: 1 },    // cross
        { note: 67, startTime: 2, duration: 2 },    // buns (half note)
        
        // Hot cross buns
        { note: 71, startTime: 4, duration: 1 },    // Hot
        { note: 69, startTime: 5, duration: 1 },    // cross
        { note: 67, startTime: 6, duration: 2 },    // buns (half note)
        
        // One a penny, two a penny
        { note: 67, startTime: 8, duration: 0.5 },  // One
        { note: 67, startTime: 8.5, duration: 0.5 }, // a
        { note: 67, startTime: 9, duration: 0.5 },  // pen-
        { note: 67, startTime: 9.5, duration: 0.5 }, // -ny
        { note: 69, startTime: 10, duration: 0.5 }, // two
        { note: 69, startTime: 10.5, duration: 0.5 }, // a
        { note: 69, startTime: 11, duration: 0.5 }, // pen-
        { note: 69, startTime: 11.5, duration: 0.5 }, // -ny
        
        // Hot cross buns
        { note: 71, startTime: 12, duration: 1 },   // Hot
        { note: 69, startTime: 13, duration: 1 },   // cross
        { note: 67, startTime: 14, duration: 2 },   // buns (half note)
      ]
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
      tempo: 90,
      notesWithTiming: [
        // Amazing grace how sweet the sound
        { note: 67, startTime: 0, duration: 1.5 },    // A-
        { note: 71, startTime: 1.5, duration: 0.5 },  // -ma-
        { note: 74, startTime: 2, duration: 1 },      // -zing
        { note: 71, startTime: 3, duration: 1.5 },    // grace
        { note: 74, startTime: 4.5, duration: 0.5 },  // how
        { note: 76, startTime: 5, duration: 1 },      // sweet
        { note: 74, startTime: 6, duration: 2 },      // the (half note)
        
        // That saved a wretch like me
        { note: 71, startTime: 8, duration: 1.5 },    // sound
        { note: 74, startTime: 9.5, duration: 0.5 },  // that
        { note: 71, startTime: 10, duration: 1 },     // saved
        { note: 69, startTime: 11, duration: 1 },     // a
        { note: 67, startTime: 12, duration: 4 },     // wretch (whole note)
        
        // I once was lost but now am found
        { note: 67, startTime: 16, duration: 1.5 },   // like
        { note: 71, startTime: 17.5, duration: 0.5 }, // me
        { note: 74, startTime: 18, duration: 1 },     // I
        { note: 71, startTime: 19, duration: 1.5 },   // once
        { note: 74, startTime: 20.5, duration: 0.5 }, // was
        { note: 76, startTime: 21, duration: 1 },     // lost
        { note: 74, startTime: 22, duration: 2 },     // but (half note)
        
        // Was blind but now I see
        { note: 71, startTime: 24, duration: 1.5 },   // now
        { note: 69, startTime: 25.5, duration: 0.5 }, // am
        { note: 67, startTime: 26, duration: 1 },     // found
        { note: 62, startTime: 27, duration: 1 },     // was
        { note: 67, startTime: 28, duration: 4 },     // blind (whole note)
      ]
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
      tempo: 110,
      notesWithTiming: [
        // First phrase
        { note: 66, startTime: 0, duration: 1 },     // Joy-
        { note: 66, startTime: 1, duration: 1 },     // -ful
        { note: 67, startTime: 2, duration: 1 },     // joy-
        { note: 69, startTime: 3, duration: 1 },     // -ful
        { note: 69, startTime: 4, duration: 1 },     // we
        { note: 67, startTime: 5, duration: 1 },     // a-
        { note: 66, startTime: 6, duration: 1 },     // -dore
        { note: 64, startTime: 7, duration: 1 },     // thee
        { note: 62, startTime: 8, duration: 1 },     // God
        { note: 62, startTime: 9, duration: 1 },     // of
        { note: 64, startTime: 10, duration: 1 },    // glo-
        { note: 66, startTime: 11, duration: 1 },    // -ry
        { note: 66, startTime: 12, duration: 1.5 },  // Lord
        { note: 64, startTime: 13.5, duration: 0.5 }, // of
        { note: 64, startTime: 14, duration: 2 },    // love (half note)
        
        // Second phrase (repeat with variation)
        { note: 66, startTime: 16, duration: 1 },    // Joy-
        { note: 66, startTime: 17, duration: 1 },    // -ful
        { note: 67, startTime: 18, duration: 1 },    // joy-
        { note: 69, startTime: 19, duration: 1 },    // -ful
        { note: 69, startTime: 20, duration: 1 },    // we
        { note: 67, startTime: 21, duration: 1 },    // a-
        { note: 66, startTime: 22, duration: 1 },    // -dore
        { note: 64, startTime: 23, duration: 1 },    // thee
        { note: 62, startTime: 24, duration: 1 },    // Hearts
        { note: 62, startTime: 25, duration: 1 },    // un-
        { note: 64, startTime: 26, duration: 1 },    // -fold
        { note: 66, startTime: 27, duration: 1 },    // like
        { note: 64, startTime: 28, duration: 1.5 },  // flow-
        { note: 62, startTime: 29.5, duration: 0.5 }, // -ers
        { note: 62, startTime: 30, duration: 2 },    // before (half note)
      ]
    }
  ];

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

  // Unified MIDI message handler for both real and simulated MIDI
  const handleMIDIMessage = (message: MIDIMessage) => {
    setLastNote(message);
    
    // Only handle note on messages in the current instrument range
    if (message.type === 'noteon' && isInCurrentRange(message.note)) {
      console.log(`MIDI note: ${midiNoteToName(message.note)} (${message.note})`);
      
      setLastPlayedNote(message.note);
      
      // For tin whistle, handle sequential practice logic
      if (selectedInstrument === 'tin-whistle' && currentTargetNote !== null) {
        const isCorrect = message.note === currentTargetNote;
        console.log(`🎯 App: Note played: ${midiNoteToName(message.note)} (${message.note}), Target: ${midiNoteToName(currentTargetNote)} (${currentTargetNote}), Index: ${currentNoteIndex}, Correct: ${isCorrect}`);
        setIsCorrectNote(isCorrect);
        
        if (isCorrect) {
          console.log(`✅ Correct note! Current index: ${currentNoteIndex}, Sequence length: ${practiceSequence.length}`);
          
          // Move to next note in sequence immediately, but show green feedback briefly
          if (practiceSequence.length > 0 && currentNoteIndex < practiceSequence.length - 1) {
            const nextIndex = currentNoteIndex + 1;
            const nextNote = practiceSequence[nextIndex];
            
            console.log(`⏭️ Advancing to next note: ${midiNoteToName(nextNote)} (${nextNote}) at index ${nextIndex}`);
            
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
            if (selectedSong) {
              sequenceName = selectedSong.title;
            } else if (practiceSequence.length === 7 && practiceSequence[0] === 62) {
              sequenceName = 'D Major Scale';
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
          console.log(`❌ Incorrect note played. Expected: ${midiNoteToName(currentTargetNote)}, Got: ${midiNoteToName(message.note)}`);
          
          // Auto-recovery: After 1 second, simulate playing the correct note to keep simulation progressing
          setTimeout(() => {
            console.log(`🔧 Auto-recovery: Simulating correct note ${midiNoteToName(currentTargetNote)} after incorrect input`);
            
            // Simulate the correct note being played
            const correctMessage: MIDIMessage = {
              type: 'noteon',
              note: currentTargetNote,
              velocity: 64,
              timestamp: performance.now()
            };
            
            // Process the simulated correct note
            setLastPlayedNote(correctMessage.note);
            setIsCorrectNote(true);
            
            console.log(`✅ Auto-recovery: Correct note simulated! Current index: ${currentNoteIndex}, Sequence length: ${practiceSequence.length}`);
            
            // Move to next note in sequence
            if (practiceSequence.length > 0 && currentNoteIndex < practiceSequence.length - 1) {
              const nextIndex = currentNoteIndex + 1;
              const nextNote = practiceSequence[nextIndex];
              
              console.log(`⏭️ Auto-recovery: Advancing to next note: ${midiNoteToName(nextNote)} (${nextNote}) at index ${nextIndex}`);
              
              // Update state immediately to prevent getting stuck
              setCurrentNoteIndex(nextIndex);
              setCurrentTargetNote(nextNote);
              
              // Show green feedback briefly, then reset for next note
              setTimeout(() => {
                setIsCorrectNote(null);
              }, 500);
            } else if (currentNoteIndex >= practiceSequence.length - 1) {
              console.log('Auto-recovery: Practice sequence completed!');
              
              // Determine sequence name for completion message
              let sequenceName = 'sequence';
              if (selectedSong) {
                sequenceName = selectedSong.title;
              } else if (practiceSequence.length === 7 && practiceSequence[0] === 62) {
                sequenceName = 'D Major Scale';
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
          }, 1000); // 1 second delay before auto-recovery
        }
      }
    }
  };

  // Listen for real MIDI messages for sequential practice
  useEffect(() => {
    addMessageListener(handleMIDIMessage);
    return () => removeMessageListener(handleMIDIMessage);
  }, [addMessageListener, removeMessageListener, selectedInstrument, currentTargetNote, practiceSequence, currentNoteIndex, selectedSong]);

  // Handle song creation
  const handleSongCreate = (song: Song) => {
    setSongs(prev => [...prev, song]);
    console.log('Song created:', song);
  };

  // Handle MIDI song creation
  const handleMIDISongCreate = (midiSong: MIDISong) => {
    setMidiSongs(prev => [...prev, midiSong]);
    console.log('MIDI song created:', midiSong);
  };

  // Song management functions
  const deleteMidiSong = (songId: string) => {
    setMidiSongs(prev => prev.filter(song => song.id !== songId));
    // If the deleted song was selected, clear selection and stop practice
    if (selectedSong?.id === songId) {
      setSelectedSong(null);
      setPracticeSequence([]);
      setCurrentNoteIndex(0);
      setCurrentTargetNote(null);
      setIsCorrectNote(null);
      setLastPlayedNote(null);
    }
  };

  const deleteManualSong = (songId: string) => {
    setSongs(prev => prev.filter(song => song.id !== songId));
    // If the deleted song was selected, clear selection and stop practice
    if (selectedSong?.id === songId) {
      setSelectedSong(null);
      setPracticeSequence([]);
      setCurrentNoteIndex(0);
      setCurrentTargetNote(null);
      setIsCorrectNote(null);
      setLastPlayedNote(null);
    }
  };

  const renameMidiSong = (songId: string, newTitle: string) => {
    if (newTitle.trim() === '') return;
    
    setMidiSongs(prev => prev.map(song => 
      song.id === songId 
        ? { ...song, title: newTitle.trim() }
        : song
    ));
    
    // Update selected song if it's the one being renamed
    if (selectedSong?.id === songId) {
      setSelectedSong(prev => prev ? { ...prev, title: newTitle.trim() } : null);
    }
  };

  const renameManualSong = (songId: string, newTitle: string) => {
    if (newTitle.trim() === '') return;
    
    setSongs(prev => prev.map(song => 
      song.id === songId 
        ? { ...song, title: newTitle.trim() }
        : song
    ));
    
    // Update selected song if it's the one being renamed
    if (selectedSong?.id === songId) {
      setSelectedSong(prev => prev ? { ...prev, title: newTitle.trim() } : null);
    }
  };

  // Editing functions
  const startEditing = (songId: string, currentTitle: string) => {
    setEditingSongId(songId);
    setEditingTitle(currentTitle);
  };

  const cancelEditing = () => {
    setEditingSongId(null);
    setEditingTitle('');
  };

  const saveEditing = (songId: string, isMidiSong: boolean) => {
    if (editingTitle.trim() === '') {
      cancelEditing();
      return;
    }
    
    if (isMidiSong) {
      renameMidiSong(songId, editingTitle);
    } else {
      renameManualSong(songId, editingTitle);
    }
    
    cancelEditing();
  };

  // Start a practice sequence for tin whistle
  const startPracticeSequence = (notes: number[]) => {
    setPracticeSequence(notes);
    setCurrentNoteIndex(0);
    setCurrentTargetNote(notes[0]);
    setIsCorrectNote(null);
    setLastPlayedNote(null);
    console.log('🎯 App: Started practice sequence:', notes.map((n, i) => `${i}:${midiNoteToName(n)}(${n})`).join(' '));
    console.log('🎯 App: First note target:', midiNoteToName(notes[0]), `(${notes[0]})`);
  };

  // Stop practice sequence
  const stopPracticeSequence = () => {
    setPracticeSequence([]);
    setCurrentNoteIndex(0);
    setCurrentTargetNote(null);
    setIsCorrectNote(null);
    setLastPlayedNote(null);
    setSelectedSong(null); // Clear selected song to make it clear practice has stopped
    console.log('Stopped practice sequence and cleared selected song');
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
      <style>
        {`
          /* Custom slider styles */
          .slider::-webkit-slider-thumb {
            appearance: none;
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: #3B82F6;
            border: 2px solid #1E40AF;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .slider::-webkit-slider-thumb:hover {
            background: #2563EB;
            transform: scale(1.1);
          }
          
          .slider::-moz-range-thumb {
            height: 18px;
            width: 18px;
            border-radius: 50%;
            background: #3B82F6;
            border: 2px solid #1E40AF;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .slider::-moz-range-thumb:hover {
            background: #2563EB;
            transform: scale(1.1);
          }
          
          .slider::-webkit-slider-track {
            height: 8px;
            border-radius: 4px;
          }
          
          .slider::-moz-range-track {
            height: 8px;
            border-radius: 4px;
            background: #4B5563;
          }
        `}
      </style>
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-center">🎵 MIDIFlow</h1>
          <p className="text-center text-gray-400 mt-2">Real-time MIDI practice with visual feedback</p>
          
          {/* MIDI Connection Status - Compact at top */}
          <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isSupported && isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-300">WebMIDI Support: {isSupported && isInitialized ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-gray-300">Initialized: {isInitialized ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connectedDevices.length > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-gray-300">Connected Devices: {connectedDevices.length}</span>
            </div>
          </div>
        </div>
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

        {/* Tab Navigation */}
        <div className="bg-gray-800 rounded-lg mb-6">
          <div className="flex border-b border-gray-600">
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'practice'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Practice
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'create'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Create Practice Song
            </button>
            <button
              onClick={() => setActiveTab('midi-status')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'midi-status'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              MIDI Status
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'about'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              About
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'midi-status' && (
          <div className="space-y-6">
            {/* MIDI Status */}
            <div className="bg-gray-800 rounded-lg p-4">
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
                  <div>Selected Instrument: {selectedInstrument}</div>
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
              <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-4">
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
          </div>
        )}

        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Create Practice Song */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Create Practice Song (Manual)</h2>
              <SongInput onSongCreate={handleSongCreate} />
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-3">Import MIDI File</h2>
              <MIDIFileUploader onMIDISongCreate={handleMIDISongCreate} />
            </div>

            {/* Storage Management (Development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-3">Development Tools</h2>
                <div className="bg-gray-700 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Storage Management</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const info = getStorageInfo();
                        if (confirm(`Clear all stored songs?\n\nCurrent storage: ${info.midiSongs} MIDI songs, ${info.manualSongs} manual songs (${info.totalSize})`)) {
                          clearAllStoredSongs();
                          setMidiSongs([]);
                          setSongs([]);
                          setSelectedSong(null);
                          alert('✅ All stored songs cleared!');
                        }
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      🗑️ Clear Storage
                    </button>
                    <button
                      onClick={() => {
                        const info = getStorageInfo();
                        alert(`Storage Info:\n\n📁 MIDI Songs: ${info.midiSongs}\n📝 Manual Songs: ${info.manualSongs}\n💾 Total Size: ${info.totalSize}`);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      📊 Storage Info
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="space-y-6">
            {/* Song Selection */}
            <div className="bg-gray-800 rounded-lg p-4">
              {/* Song Selection */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Select a song to practice:</h4>
              
              {/* Built-in Songs Section */}
              {builtInSongs.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-green-400 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Built-in Songs ({builtInSongs.length})
                  </h5>
                  <div className="bg-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="space-y-1">
                      {builtInSongs.map(song => (
                        <div
                          key={song.id}
                          onClick={() => setSelectedSong(song)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                            selectedSong?.id === song.id
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              selectedSong?.id === song.id ? 'bg-white' : 'bg-gray-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{song.title}</div>
                              <div className="text-xs text-gray-400 flex items-center space-x-2">
                                <span>{song.notes.length} notes</span>
                                <span>•</span>
                                <span>{song.tempo} BPM</span>
                              </div>
                            </div>
                          </div>
                          {selectedSong?.id === song.id && (
                            <div className="flex-shrink-0 ml-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* MIDI Songs Section */}
              {(midiSongs.length > 0 || songs.length > 0) && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-blue-400 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Imported Songs ({midiSongs.length + songs.length})
                  </h5>
                  <div className="bg-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="space-y-1">
                      {/* MIDI Songs */}
                      {midiSongs.map(song => (
                        <div
                          key={song.id}
                          className={`flex items-center justify-between p-2 rounded transition-colors ${
                            selectedSong?.id === song.id
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              selectedSong?.id === song.id ? 'bg-white' : 'bg-gray-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              {editingSongId === song.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditing(song.id, true);
                                      if (e.key === 'Escape') cancelEditing();
                                    }}
                                    className="bg-gray-600 text-white px-2 py-1 rounded text-sm flex-1"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      saveEditing(song.id, true);
                                    }}
                                    className="text-green-400 hover:text-green-300 p-1"
                                    title="Save"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelEditing();
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1"
                                    title="Cancel"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  className="font-medium truncate cursor-pointer"
                                  onClick={() => setSelectedSong(song)}
                                >
                                  {song.title}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 flex items-center space-x-2">
                                <span>{song.notes.length} notes</span>
                                <span>•</span>
                                <span>{song.tempo} BPM</span>
                                <span>•</span>
                                <span className="text-purple-400">Track {song.selectedTrack + 1}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Track Selection Dropdown */}
                            <select
                              value={song.selectedTrack}
                              onChange={(e) => {
                                const newTrack = parseInt(e.target.value);
                                try {
                                  // Extract notes from the new track
                                  const { notes, tempo, notesWithTiming } = extractNotesFromArrayBuffer(song.fileData!, newTrack);
                                  const updatedSong = { 
                                    ...song, 
                                    selectedTrack: newTrack,
                                    notes,
                                    tempo,
                                    notesWithTiming
                                  };
                                  // Update the song in the midiSongs array
                                  setMidiSongs(prev => prev.map(s => s.id === song.id ? updatedSong : s));
                                  // If this song is currently selected, update the selected song too
                                  if (selectedSong?.id === song.id) {
                                    setSelectedSong(updatedSong);
                                  }
                                } catch (error) {
                                  console.error('Failed to extract notes from track:', error);
                                }
                              }}
                              className="bg-gray-600 text-white px-2 py-1 rounded text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {song.availableTracks.map((track, index) => (
                                <option key={index} value={index}>
                                  Track {index + 1}: {track.trackName || 'Unnamed'} ({track.noteCount} notes)
                                </option>
                              ))}
                            </select>
                            
                            {/* MIDI Preview Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewSong(song);
                                setShowPreview(true);
                              }}
                              className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 rounded text-xs flex items-center space-x-1"
                              title="Preview MIDI track"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              <span>Preview</span>
                            </button>
                            
                            {/* Rename button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(song.id, song.title);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
                              title="Rename song"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            
                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete "${song.title}"?`)) {
                                  deleteMidiSong(song.id);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
                              title="Delete song"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l2.293 2.293a1 1 0 001.414-1.414L11.414 12l1.293-1.293z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {selectedSong?.id === song.id && (
                              <div className="flex-shrink-0">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Manual Songs */}
                      {songs.map(song => (
                        <div
                          key={song.id}
                          className={`flex items-center justify-between p-2 rounded transition-colors ${
                            selectedSong?.id === song.id
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              selectedSong?.id === song.id ? 'bg-white' : 'bg-gray-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              {editingSongId === song.id ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEditing(song.id, false);
                                      if (e.key === 'Escape') cancelEditing();
                                    }}
                                    className="bg-gray-600 text-white px-2 py-1 rounded text-sm flex-1"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      saveEditing(song.id, false);
                                    }}
                                    className="text-green-400 hover:text-green-300 p-1"
                                    title="Save"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelEditing();
                                    }}
                                    className="text-red-400 hover:text-red-300 p-1"
                                    title="Cancel"
                                  >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  className="font-medium truncate cursor-pointer"
                                  onClick={() => setSelectedSong(song)}
                                >
                                  {song.title}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 flex items-center space-x-2">
                                <span>{song.notes.length} notes</span>
                                <span>•</span>
                                <span>{song.tempo} BPM</span>
                                <span>•</span>
                                <span className="text-yellow-400">Manual</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* Rename button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(song.id, song.title);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs"
                              title="Rename song"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            
                            {/* Delete button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete "${song.title}"?`)) {
                                  deleteManualSong(song.id);
                                }
                              }}
                              className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
                              title="Delete song"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L7.586 12l-1.293 1.293a1 1 0 101.414 1.414L9 13.414l2.293 2.293a1 1 0 001.414-1.414L11.414 12l1.293-1.293z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {selectedSong?.id === song.id && (
                              <div className="flex-shrink-0">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(builtInSongs.length === 0 && midiSongs.length === 0 && songs.length === 0) && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="text-center text-gray-500 py-4">
                    No songs available. Create a song or upload a MIDI file above to get started.
                  </div>
                </div>
              )}
            </div>

            {/* Practice Controls for Tin Whistle */}
            {selectedInstrument === 'tin-whistle' && selectedSong && (
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Practice Controls:</h4>

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

            {/* Quick Practice Controls for Tin Whistle - only show when no song is selected */}
            {selectedInstrument === 'tin-whistle' && !selectedSong && (
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
                        setSelectedSong(twinkleSong); // Set selected song for timing data
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
          </div>

          {/* Simulated MIDI Player - Development Tool */}
          {process.env.NODE_ENV === 'development' && (
            <SimulatedMIDIPlayer
              onMIDIMessage={handleMIDIMessage}
              practiceSequence={practiceSequence}
              currentNoteIndex={currentNoteIndex}
              tempo={selectedSong?.tempo || 120}
              isVisible={true}
            />
          )}

          {/* Practice Area */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Practice Area</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Main practice area */}
              <div>
                {selectedInstrument === 'tin-whistle' ? (
                  // Tin whistle practice area
                  practiceSequence.length > 0 && selectedSong?.notesWithTiming ? (
                    // Sequential practice with timeline (when timing data is available)
                    <TinWhistleSequentialPractice
                      sequence={selectedSong.notesWithTiming}
                      currentNoteIndex={currentNoteIndex}
                      tempo={selectedSong.tempo || 120}
                      lastPlayedNote={lastPlayedNote}
                      isCorrectNote={isCorrectNote}
                      className="h-auto"
                    />
                  ) : (
                    // Fallback static practice board (when no timing data)
                    <TinWhistlePracticeBoard
                      currentTargetNote={currentTargetNote}
                      lastPlayedNote={lastPlayedNote}
                      isCorrectNote={isCorrectNote}
                      className="h-auto"
                    />
                  )
                ) : (
                  // Simple note display for other instruments
                  <div className="bg-gray-700 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-300 mb-4">
                      {selectedInstrument.charAt(0).toUpperCase() + selectedInstrument.slice(1).replace('-', ' ')} Practice
                    </h3>
                    {lastPlayedNote ? (
                      <div className="text-4xl font-bold text-blue-400 mb-2">
                        {midiNoteToName(lastPlayedNote)}
                      </div>
                    ) : (
                      <div className="text-2xl text-gray-500 mb-2">
                        Play a note
                      </div>
                    )}
                    <div className="text-sm text-gray-400">
                      Range: {getCurrentInstrumentRange().MIN}-{getCurrentInstrumentRange().MAX}
                      {lastPlayedNote && (
                        <span className="ml-2">
                          (MIDI {lastPlayedNote})
                        </span>
                      )}
                    </div>
                  </div>
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
        )}

        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* About */}
            <div className="bg-gray-800 rounded-lg p-6">
              {aboutError ? (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-2">Error loading About content</div>
                  <div className="text-gray-500 text-sm">{aboutError}</div>
                </div>
              ) : aboutContent ? (
                <MarkdownRenderer content={aboutContent} />
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400">Loading...</div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MIDI Preview Modal */}
      {showPreview && previewSong && (
        <MIDIPreview
          song={previewSong}
          availableTracks={previewSong.availableTracks}
          onTrackChange={(trackIndex) => {
            try {
              // Extract notes from the new track
              const { notes, tempo, notesWithTiming } = extractNotesFromArrayBuffer(previewSong.fileData!, trackIndex);
              const updatedSong = { 
                ...previewSong, 
                selectedTrack: trackIndex,
                notes,
                tempo,
                notesWithTiming
              };
              
              // Update the preview song
              setPreviewSong(updatedSong);
              
              // Update the song in the midiSongs array
              setMidiSongs(prev => prev.map(s => s.id === previewSong.id ? updatedSong : s));
              
              // If this song is currently selected, update the selected song too
              if (selectedSong?.id === previewSong.id) {
                setSelectedSong(updatedSong);
              }
            } catch (error) {
              console.error('Failed to extract notes from track in preview:', error);
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
}

export default App;
