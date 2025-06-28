# MIDIFlow - Real-time MIDI Practice Application

A web-based MIDI-driven practice app that provides real-time visual feedback for any MIDI-capable instrument. Features Guitar Hero-style falling notes with instrument-specific note ranges, timing feedback, and comprehensive song practice modes including MIDI file import.

## Phase 2 - Practice Interface ✅

### What's Implemented

#### 🎹 MIDI Integration
- ✅ WebMIDI API integration with TypeScript support
- ✅ Automatic MIDI device detection and connection
- ✅ Real-time MIDI message parsing (Note On/Off)
- ✅ Device hot-plugging support (connect/disconnect during use)
- ✅ Graceful error handling and fallbacks

#### 🎵 Complete Practice System
- ✅ **Manual Song Creation** - Create practice songs by entering note sequences
- ✅ **MIDI File Import** - Upload and parse MIDI files with track selection
- ✅ **Sequential Practice Mode** - Step-by-step note guidance with timing
- ✅ **Built-in Song Library** - Pre-loaded songs like "Twinkle Twinkle Little Star"
- ✅ **Smart Track Selection** - Analyze MIDI tracks to find the best practice content

#### 🎵 Tin Whistle Practice Interface  
- ✅ Complete note board showing all tin whistle notes with fingerings
- ✅ Visual practice guidance with highlighted target notes  
- ✅ Real-time feedback for correct/incorrect notes played
- ✅ Sequential practice with timeline visualization
- ✅ Practice completion animations and encouraging feedback

#### 🎵 Universal Instrument Support
- ✅ Falling notes display (Guitar Hero style) for non-tin whistle instruments
- ✅ Real-time note creation from MIDI input
- ✅ Multiple instrument presets with appropriate note ranges
- ✅ Adaptive note positioning based on instrument range
- ✅ Visual feedback with note names and colors

#### 🔧 Technical Foundation
- ✅ React + TypeScript + Vite setup
- ✅ Modular architecture following the rules file
- ✅ Custom React hooks for MIDI management
- ✅ Type-safe MIDI message handling
- ✅ Performance-optimized note animations with precise cleanup

### Current Features

1. **MIDI Device Management**
   - Automatic detection of connected MIDI devices
   - Connect/disconnect functionality
   - Real-time device status monitoring
   - Support for USB MIDI (primary) with BLE detection framework

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

## MIDI File Support

The app supports standard MIDI files (.mid/.midi) with:
- **Multi-track Analysis**: Automatically detects all tracks and their contents
- **Instrument Recognition**: Identifies instruments using General MIDI standards
- **Note Extraction**: Converts MIDI events to practice sequences with timing
- **Track Selection**: Choose specific tracks that match your instrument
- **Tempo Preservation**: Maintains original tempo and timing information

**Supported MIDI Features:**
- Note On/Off events
- Program Change (instrument selection)
- Tempo changes
- Multiple tracks and channels
- Standard MIDI File Format 0 and 1

## What's Next - Phase 3

- [ ] Bluetooth MIDI support (Web Bluetooth API integration)
- [ ] Advanced statistics and progress tracking
- [ ] Practice session recording and playback
- [ ] Tempo adjustment and loop functionality
- [ ] Advanced visualizations and themes
- [ ] Local storage for song persistence
- [ ] MIDI file editing and modification tools

## Dependencies

- `react` + `vite` + `typescript` - Core framework
- `midi-parser-js` - MIDI file parsing and analysis
- Standard web APIs: WebMIDI, Web Audio (planned)

---

**Phase 2 Status: Complete** ✅  
**Current Focus: Phase 3 - Enhanced Features**
