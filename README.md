# MIDIFlow - Real-time MIDI Practice Application

A focused, pedagogical tin whistle practice tool with timeline-based sequential practice mode. Features real-time MIDI input, visual feedback, MIDI file import with advanced track preview, and persistent song storage.

## Phase 3 - Enhanced Features ✅

### What's Implemented

#### 🎹 MIDI Integration
- ✅ WebMIDI API integration with TypeScript support
- ✅ Automatic MIDI device detection and connection
- ✅ Real-time MIDI message parsing (Note On/Off)
- ✅ Device hot-plugging support (connect/disconnect during use)
- ✅ Graceful error handling and fallbacks

#### 🎵 Focused Practice System
- ✅ **Sequential Practice Mode Only** - Focused, step-by-step learning approach
- ✅ **Manual Song Creation** - Create practice songs by entering note sequences
- ✅ **Advanced MIDI File Import** - Upload and parse MIDI files with intelligent track selection
- ✅ **MIDI Preview System** - Preview and audition tracks before practicing
- ✅ **Built-in Song Library** - Pre-loaded songs with timing data
- ✅ **Persistent Song Storage** - Songs automatically saved and restored between sessions

#### 🎧 MIDI Preview & Track Management
- ✅ **Real-time MIDI Preview** - Play, pause, skip through MIDI tracks with audio
- ✅ **Quick Track Switching** - Switch between instruments/tracks during preview
- ✅ **Playback Controls** - Play/pause/stop with ±15 second skip functionality
- ✅ **Progress Visualization** - Timeline showing current playback position
- ✅ **Audio Synthesis** - Web Audio API for immediate track audition
- ✅ **Dual Access Points** - Preview available both during import and from song list

#### 🎵 Tin Whistle Practice Interface  
- ✅ Complete note board showing all tin whistle notes with fingerings
- ✅ Visual practice guidance with highlighted target notes  
- ✅ Real-time feedback for correct/incorrect notes played
- ✅ Timeline-based sequential practice with tempo control
- ✅ Practice status indicator showing current song and progress
- ✅ Completion animations and encouraging feedback

#### 💾 Persistent Storage System
- ✅ **Automatic Song Persistence** - MIDI and manual songs saved to localStorage
- ✅ **Cross-Session Availability** - Songs restored automatically on app restart
- ✅ **Binary Data Handling** - Efficient storage of MIDI file data
- ✅ **Development Tools** - Storage management utilities for testing
- ✅ **Error Recovery** - Graceful handling of storage limitations

#### 🔧 Advanced Song Management
- ✅ **Organized Song Lists** - Separate sections for built-in vs imported songs
- ✅ **Track Re-selection** - Change MIDI track selection after import
- ✅ **Real-time Note Extraction** - Dynamic song updates when changing tracks
- ✅ **Scalable Interface** - Compact, scrollable lists for many songs
- ✅ **Song State Management** - Clear practice status and song selection

### Current Features

1. **MIDI Device Management**
   - Automatic detection of connected MIDI devices
   - Connect/disconnect functionality
   - Real-time device status monitoring
   - Support for USB MIDI (primary) with BLE detection framework

2. **Advanced Song Import & Management**
   - Drag-and-drop MIDI file upload with instant parsing
   - Multi-track analysis with instrument detection
   - Real-time MIDI preview with playback controls
   - Quick track switching during preview
   - Automatic song persistence across sessions
   - Organized song lists (built-in vs imported)

3. **MIDI Preview System**
   - Play/pause/stop controls with ±15 second skip
   - Real-time track switching without reloading
   - Web Audio synthesis for immediate audition
   - Progress timeline with visual feedback
   - Available both during import and from song list

4. **Focused Practice Interface**
   - Sequential practice mode only (no free play distractions)
   - Timeline-based practice with metronome
   - Real-time feedback for correct/incorrect notes
   - Practice status indicator always visible
   - Clear song selection and deselection

5. **Tin Whistle Specialization**
   - Complete fingering chart for D-tuned tin whistle
   - Note range: D4 to C6 (MIDI 62-84)
   - Visual feedback with highlighted target notes
   - Practice progression tracking

6. **Persistent Storage**
   - Automatic saving of MIDI and manual songs
   - Cross-session song availability
   - Efficient binary data storage
   - Development tools for storage management

2. **Song Management System**
   - **Manual Song Creation**: Enter note sequences manually using MIDI numbers or note names
   - **MIDI File Import**: Upload .mid/.midi files with intelligent track analysis
   - **Track Selection**: Choose specific instruments/tracks from multi-track MIDI files
   - **Smart Recommendations**: Auto-select tracks with the most notes for practice
   - **Built-in Library**: Pre-loaded practice songs with timing data and expandable collection
   - **Compact Song Selection**: Scalable list interface for easy navigation of large song libraries

3. **Instrument Selection**
   - Tin Whistle, Flute, Violin, Guitar, Saxophone presets
   - Full Piano/Keyboard range (88 keys)
   - Custom range option for flexibility
   - Automatic note filtering based on selected instrument

4. **Advanced Practice Modes**
   - **Sequential Practice**: Step-by-step note guidance with visual feedback
   - **Timing Practice**: Use MIDI timing data for tempo-based practice
   - **Progress Tracking**: Visual indicators of practice completion
   - **Practice State Management**: Clear visual feedback of active practice sessions
   - **Error Recovery**: Encouraging feedback with unlimited retries

5. **Tin Whistle Practice Board**
   - Complete visual layout of all tin whistle notes with fingerings
   - Target note highlighting with pulse animations
   - Correct/incorrect note feedback with color coding
   - Sequential practice timeline with current note indication
   - Practice completion celebrations

6. **Real-time Note Display (Other Instruments)**
   - Live MIDI input creates falling notes (Guitar Hero style)
   - Notes display with proper naming (C4, D#5, etc.)
   - Instrument-specific note range filtering
   - Smooth CSS animations with precise cleanup
   - Perfect state synchronization (active notes = visible notes)

7. **Visual Interface**
   - Clean, dark theme optimized for practice
   - Device status indicators with real-time updates
   - Comprehensive song management UI
   - MIDI file upload with drag-and-drop support
   - Track analysis and selection interface
   - Error handling with user-friendly messages
   - Responsive design for various screen sizes

## Getting Started

### Prerequisites
- Chrome or Chromium-based browser (for WebMIDI support)
- MIDI-capable tin whistle (e.g., Warbl) or any MIDI controller for testing

### Installation
```bash
npm install
npm run dev
```

### Using the App
1. Open the app in Chrome
2. Connect your MIDI device (USB or Bluetooth)
3. Click "Connect" next to your device in the MIDI Status section
4. **Create or Import Songs:**
   - **Manual**: Use "Create Practice Song (Manual)" to enter note sequences
   - **MIDI Upload**: Use "Upload MIDI File" to import existing MIDI files
   - **Built-in**: Select from pre-loaded practice songs
5. **Select Your Song**: Choose a song from the list to start practicing
6. **Start Practice**: Click "Start Practice" to begin sequential note guidance
7. **Play Along**: Follow the visual cues and play the indicated notes on your instrument

## Architecture

### Key Components
- `MIDIManager` - Core MIDI device and message handling
- `useMIDI` - React hook for MIDI integration
- `TinWhistlePracticeBoard` - Complete tin whistle practice interface with fingerings
- `TinWhistleSequentialPractice` - Timeline-based practice with timing visualization
- `SongInput` - Manual song creation component
- `MIDIFileUploader` - MIDI file import and track selection
- `NoteVisualizer` - Falling notes display component for other instruments
- `App` - Main application with comprehensive practice management

### File Structure
```
src/
├── components/
│   ├── TinWhistlePracticeBoard.tsx      # Complete tin whistle practice interface
│   ├── TinWhistleSequentialPractice.tsx # Timeline-based practice visualization
│   ├── SongInput.tsx                    # Manual song creation
│   ├── MIDIFileUploader.tsx            # MIDI file import and track selection
│   └── NoteVisualizer.tsx              # Falling notes visualization
├── hooks/
│   └── useMIDI.ts                      # MIDI device management hook
├── lib/
│   └── midi/
│       ├── MIDIManager.ts              # Core MIDI functionality
│       └── midiFileParser.ts           # MIDI file parsing and analysis
├── types/
│   ├── midi.ts                         # MIDI type definitions including MIDI songs
│   ├── midi-parser-js.d.ts            # MIDI parser library types
│   └── webmidi.d.ts                   # WebMIDI API types
└── App.tsx                             # Main application
```

## Browser Compatibility

- ✅ Chrome/Chromium (recommended - full WebMIDI support)
- ⚠️ Firefox (limited WebMIDI, BLE fallback planned)
- ❌ Safari (WebMIDI not supported yet)

## Testing Without Hardware

For testing without a physical MIDI device, you can:
1. Use a virtual MIDI port (like loopMIDI on Windows)
2. Use a software MIDI controller
3. Some DAWs can send MIDI to browser applications

## MIDI File Support & Preview

The app supports standard MIDI files (.mid/.midi) with advanced preview capabilities:

### Import Features
- **Multi-track Analysis**: Automatically detects all tracks and their contents
- **Instrument Recognition**: Identifies instruments using General MIDI standards
- **Note Extraction**: Converts MIDI events to practice sequences with timing
- **Track Selection**: Choose specific tracks that match your instrument
- **Tempo Preservation**: Maintains original tempo and timing information

### MIDI Preview System
- **Real-time Playback**: Immediate audio preview of any track using Web Audio API
- **Navigation Controls**: Play, pause, stop, and skip ±15 seconds through tracks
- **Quick Track Switching**: Compare different instruments/tracks without reloading
- **Progress Visualization**: Timeline showing current position and total duration
- **Tempo Display**: Shows BPM and timing information for each track

### Supported MIDI Features
- Note On/Off events with velocity and timing
- Program Change (instrument selection)
- Tempo changes and time signatures
- Multiple tracks and channels
- Standard MIDI File Format 0 and 1
- Efficient binary data storage for persistence

## Persistent Storage

All songs are automatically saved and restored:

### What's Persisted
- **MIDI Files**: Complete binary data, track selections, and metadata
- **Manual Songs**: User-created note sequences and timing
- **Preferences**: Selected tracks, tempo settings, and practice state
- **Cross-Session**: All data survives browser restarts and refreshes

### Storage Management
- Automatic save/load with visual feedback
- Efficient storage using base64 encoding for binary data
- Development tools for storage inspection and cleanup
- Error handling for storage quotas and failures

## Project Structure

```
src/
├── components/
│   ├── MIDIFileUploader.tsx             # MIDI file import with preview integration
│   ├── MIDIPreview.tsx                  # Real-time MIDI track preview modal ✨
│   ├── SongInput.tsx                    # Manual song creation interface
│   ├── TinWhistleFingering.tsx          # Tin whistle fingering display
│   ├── TinWhistlePracticeBoard.tsx      # Main practice interface
│   └── TinWhistleSequentialPractice.tsx # Timeline-based practice mode
├── hooks/
│   └── useMIDI.ts                       # WebMIDI API management
├── lib/
│   └── midi/
│       ├── MIDIManager.ts               # Core MIDI device handling
│       └── midiFileParser.ts            # MIDI file parsing with track extraction
├── types/
│   ├── midi.ts                          # Core MIDI types and song interfaces
│   └── webmidi.d.ts                     # WebMIDI API types
├── utils/
│   └── storage.ts                       # localStorage persistence utilities ✨
└── App.tsx                              # Main application with state management
```

## What's Next - Phase 4

- [ ] Advanced practice modes (tempo adjustment, looping)
- [ ] Performance statistics and progress tracking  
- [ ] Practice session recording and analytics
- [ ] Bluetooth MIDI support (Web Bluetooth API integration)
- [ ] Advanced visualizations and themes
- [ ] MIDI file editing and modification tools
- [ ] Social features and sharing capabilities

## Dependencies

- `react` + `vite` + `typescript` - Core framework
- `midi-parser-js` - MIDI file parsing and analysis
- Standard web APIs: WebMIDI, Web Audio, localStorage

---

**Phase 3 Status: Complete** ✅  
**Current Focus: Phase 4 - Advanced Features**

### Key Achievements in Phase 3

🎧 **MIDI Preview System** - Real-time track audition with playback controls  
💾 **Persistent Storage** - Automatic song saving across browser sessions  
🎯 **Focused Practice** - Removed distractions, streamlined for learning  
🎵 **Enhanced UX** - Organized song lists, clear practice state, quick track switching  
⚡ **Performance** - Efficient storage, smooth playback, responsive interface

### Phase 3 Implementation Highlights

- **MIDI Preview Modal**: Complete playback system with Web Audio synthesis
- **Smart Storage**: Base64 binary encoding with automatic save/restore
- **Focused Interface**: Removed free play mode, emphasizes sequential practice
- **Track Management**: Real-time track switching with instant note re-extraction
- **Development Tools**: Storage inspection and management utilities
- **Cross-Session Persistence**: All songs and preferences survive browser restarts
