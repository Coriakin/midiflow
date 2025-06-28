# MIDIFlow - Real-time MIDI Practice Application

A focused, pedagogical tin whistle practice tool with timeline-based sequential practice mode. Features a clean tab-based interface, real-time MIDI input, visual feedback, MIDI file import with advanced track preview, and persistent song storage.

## Phase 3 - Enhanced Features ✅

### What's Implemented

#### � Tab-Based Interface Design
- ✅ **Clean Tab Navigation** - Three focused sections: Practice, Create Practice Song, MIDI Status
- ✅ **Compact Status Bar** - MIDI connection status always visible in header
- ✅ **Organized Content** - Each tab has specific functionality without clutter
- ✅ **Responsive Design** - Works well on different screen sizes
- ✅ **Visual Hierarchy** - Clear separation between different app functions

#### �🎹 MIDI Integration
- ✅ WebMIDI API integration with TypeScript support
- ✅ Automatic MIDI device detection and connection
- ✅ Real-time MIDI message parsing (Note On/Off)
- ✅ Device hot-plugging support (connect/disconnect during use)
- ✅ Graceful error handling and fallbacks
- ✅ Complete debugging interface in MIDI Status tab

#### 🎵 Focused Practice System
- ✅ **Sequential Practice Mode Only** - Focused, step-by-step learning approach
- ✅ **Timeline-Based Practice** - Visual timeline with moving progress indicator
- ✅ **Smart Note Stacking** - Overlapping notes are intelligently separated vertically
- ✅ **Tempo Control** - Practice at 25%, 50%, 75%, or 100% speed with button controls
- ✅ **Per-Song Tempo Persistence** - Speed settings saved individually for each song
- ✅ **Unlimited Retries** - Encouraging, trial-and-error friendly learning atmosphere

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
- ✅ Timeline-based sequential practice with smooth scrolling
- ✅ Practice status indicator showing current song and progress
- ✅ Completion animations and encouraging feedback
- ✅ Smart collision detection for overlapping notes

#### 💾 Persistent Storage System
- ✅ **Automatic Song Persistence** - MIDI and manual songs saved to localStorage
- ✅ **Cross-Session Availability** - Songs restored automatically on app restart
- ✅ **Binary Data Handling** - Efficient storage of MIDI file data
- ✅ **Development Tools** - Storage management utilities for testing
- ✅ **Error Recovery** - Graceful handling of storage limitations

#### 🔧 Advanced Song Management
- ✅ **Organized Song Lists** - Separate sections for built-in vs imported songs
- ✅ **Song Editing** - Delete and rename songs with inline editing
- ✅ **Track Re-selection** - Change MIDI track selection after import
- ✅ **Real-time Note Extraction** - Dynamic song updates when changing tracks
- ✅ **Scalable Interface** - Compact, scrollable lists for many songs
- ✅ **Song State Management** - Clear practice status and song selection

### Current Features

#### **Practice Tab**
1. **Song Selection & Management**
   - Built-in song library (Twinkle Twinkle, Mary Had a Little Lamb, etc.)
   - Imported MIDI songs with track information
   - Manual songs created with note input
   - Delete and rename functionality with confirmation dialogs
   - Visual indicators for custom tempo settings

2. **Practice Controls**
   - Tempo adjustment: 25%, 50%, 75%, 100% speed with button controls
   - Per-song tempo persistence (settings saved automatically)
   - Start Practice, Reset, Skip Note, Stop buttons
   - Real-time practice status indicator

3. **Sequential Practice Interface**
   - Timeline-based practice with moving progress line
   - Smart note stacking for overlapping notes (prevents visual confusion)
   - Tin whistle fingering charts with visual feedback
   - Real-time metronome with beat indicators
   - Encouraging retry system with unlimited attempts

#### **Create Practice Song Tab**
1. **Manual Song Creation**
   - Note name input (e.g., "D E F# G A B C")
   - Tempo setting with BPM input
   - Automatic timing generation for practice
   - Title customization and immediate saving

2. **MIDI File Import**
   - Drag-and-drop MIDI file upload
   - Multi-track analysis and selection
   - Real-time note extraction and visualization
   - Integration with MIDI preview system

3. **Development Tools** (Development Mode Only)
   - Storage management (clear all songs, view storage info)
   - Debugging utilities for localStorage
   - Song persistence verification

#### **MIDI Status Tab**
1. **Instrument Configuration**
   - Instrument selection (tin whistle, flute, violin, etc.)
   - Note range display and custom range setup
   - MIDI note number to name conversion

2. **Device Management**
   - Available MIDI device list with connection status
   - Connect/disconnect functionality per device
   - Real-time device state monitoring
   - Device manufacturer and name display

3. **Debug Information**
   - WebMIDI API availability and initialization status
   - Browser compatibility checking
   - HTTPS/localhost detection
   - Last played note display with timing
   - Manual MIDI initialization controls

#### **Header Status Bar**
- Compact MIDI connection indicators always visible
- WebMIDI Support, Initialization, and Connected Devices status
- Color-coded status dots (green/yellow/red) for quick reference

### Technical Features

1. **Persistent Storage System**
   - Automatic saving of MIDI and manual songs to localStorage
   - Cross-session song availability with automatic restore
   - Efficient binary data storage for MIDI files
   - Development tools for storage management and debugging

2. **Advanced MIDI Processing**
   - Real-time MIDI file parsing with midi-parser-js
   - Multi-track analysis and intelligent track selection
   - Web Audio API integration for MIDI preview playback
   - Smart note extraction with timing preservation

3. **Instrument Specialization**
   - Tin Whistle: Complete D-tuned fingering charts (D4-C6, MIDI 62-84)
   - Flute, Violin, Guitar, Saxophone: Appropriate note ranges
   - Full Piano/Keyboard: Complete 88-key range
   - Custom range option for any MIDI instrument

4. **Practice Intelligence**
   - Smart note collision detection and vertical stacking
   - Per-song tempo persistence with visual indicators
   - Encouraging retry system with unlimited attempts
   - Timeline-based practice with smooth scrolling
   - Real-time metronome with visual beat indicators
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

#### 1. **Initial Setup**
- Open the app in Chrome
- Check the header status bar for MIDI connection indicators
- Navigate to **MIDI Status** tab if you need device troubleshooting

#### 2. **Connect MIDI Device**
- Go to **MIDI Status** tab
- Your device should appear in the "Available Devices" list
- Click "Connect" next to your device
- Watch for the green "Connected Devices: 1" indicator in the header

#### 3. **Create or Import Songs** (Create Practice Song Tab)
- **Manual Creation**: Enter note sequences like "D E F# G A B C"
- **MIDI File Import**: Drag and drop .mid/.midi files
- **Track Selection**: Preview and choose the best track from multi-track files
- Songs are automatically saved and available across sessions

#### 4. **Practice** (Practice Tab)
- Select a song from Built-in Songs, Imported Songs, or Manual Songs
- Adjust tempo (25%, 50%, 75%, 100%) - settings are saved per song
- Click "Start Practice" to begin sequential practice
- Follow the timeline and play notes when highlighted
- Enjoy unlimited retries with encouraging feedback

## Architecture

### Tab-Based Interface
- **Practice Tab**: Song selection, tempo control, and sequential practice interface
- **Create Practice Song Tab**: Manual song creation and MIDI file import
- **MIDI Status Tab**: Complete device management and debugging information
- **Header Status Bar**: Always-visible MIDI connection indicators

### Key Components
- `App` - Main application with tab navigation and comprehensive practice management
- `TinWhistlePracticeBoard` - Complete tin whistle practice interface with fingerings
- `TinWhistleSequentialPractice` - Timeline-based practice with timing visualization and smart note stacking
- `SongInput` - Manual song creation component with note name parsing
- `MIDIFileUploader` - MIDI file import and track selection with preview integration
- `MIDIPreview` - Real-time MIDI playback with track switching capabilities
- `MIDIManager` - Core MIDI device and message handling
- `useMIDI` - React hook for MIDI integration

### File Structure
```
src/
├── components/
│   ├── TinWhistlePracticeBoard.tsx      # Complete tin whistle practice interface
│   ├── TinWhistleSequentialPractice.tsx # Timeline-based practice with smart stacking
│   ├── SongInput.tsx                    # Manual song creation
│   ├── MIDIFileUploader.tsx            # MIDI file import and track selection
│   ├── MIDIPreview.tsx                  # MIDI preview modal with playback
│   └── NoteVisualizer.tsx              # Falling notes visualization (legacy)
├── hooks/
│   └── useMIDI.ts                      # MIDI device management hook
├── lib/
│   └── midi/
│       ├── MIDIManager.ts              # Core MIDI functionality
│       └── midiFileParser.ts           # MIDI file parsing and analysis
├── types/
│   ├── midi.ts                         # MIDI type definitions including song types
│   └── webmidi.d.ts                    # WebMIDI API type definitions
├── utils/
│   └── storage.ts                      # localStorage persistence utilities
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
