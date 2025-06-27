# Tooter - Tin Whistle Practice App

A web-based MIDI-driven educational app to help beginners learn and practice songs on the tin whistle using devices like Warbl.

## Phase 1 - Core MIDI Foundation ✅

### What's Implemented

#### 🎹 MIDI Integration
- ✅ WebMIDI API integration with TypeScript support
- ✅ Automatic MIDI device detection and connection
- ✅ Real-time MIDI message parsing (Note On/Off)
- ✅ Device hot-plugging support (connect/disconnect during use)
- ✅ Graceful error handling and fallbacks

#### 🎵 Basic Note Visualization
- ✅ Falling notes display (Guitar Hero style)
- ✅ Real-time note creation from MIDI input
- ✅ Note filtering for tin whistle range (D5-D7, MIDI 74-98)
- ✅ Visual feedback with note names and colors
- ✅ Target line for timing reference

#### 🔧 Technical Foundation
- ✅ React + TypeScript + Vite setup
- ✅ Modular architecture following the rules file
- ✅ Custom React hooks for MIDI management
- ✅ Type-safe MIDI message handling
- ✅ Performance-optimized note animations

### Current Features

1. **MIDI Device Management**
   - Automatic detection of connected MIDI devices
   - Connect/disconnect functionality
   - Real-time device status monitoring
   - Support for USB MIDI (primary) with BLE detection framework

2. **Real-time Note Display**
   - Live MIDI input creates falling notes
   - Notes display with proper naming (C4, D#5, etc.)
   - Automatic filtering for tin whistle range
   - Smooth animations with cleanup to prevent memory leaks

3. **Visual Interface**
   - Clean, dark theme optimized for practice
   - Device status indicators
   - Real-time MIDI message display
   - Error handling with user-friendly messages

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
4. Play your tin whistle - notes will appear as falling objects!

## Architecture

### Key Components
- `MIDIManager` - Core MIDI device and message handling
- `useMIDI` - React hook for MIDI integration
- `NoteVisualizer` - Falling notes display component
- `App` - Main application with device management UI

### File Structure
```
src/
├── components/
│   └── NoteVisualizer.tsx    # Falling notes visualization
├── hooks/
│   └── useMIDI.ts           # MIDI device management hook
├── lib/
│   └── midi/
│       └── MIDIManager.ts   # Core MIDI functionality
├── types/
│   ├── midi.ts              # MIDI type definitions
│   └── webmidi.d.ts        # WebMIDI API types
└── App.tsx                  # Main application
```

## What's Next - Phase 2

- [ ] Song input mechanism (manual note entry)
- [ ] Practice target notes (what to play next)
- [ ] Visual feedback for correct/incorrect notes
- [ ] Basic timing and accuracy tracking
- [ ] Simple practice session management

## Browser Compatibility

- ✅ Chrome/Chromium (recommended - full WebMIDI support)
- ⚠️ Firefox (limited WebMIDI, BLE fallback planned)
- ❌ Safari (WebMIDI not supported yet)

## Testing Without Hardware

For testing without a physical MIDI device, you can:
1. Use a virtual MIDI port (like loopMIDI on Windows)
2. Use a software MIDI controller
3. Some DAWs can send MIDI to browser applications

---

**Phase 1 Status: Complete** ✅  
Ready to move to Phase 2 - Practice Interface!
