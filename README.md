# MIDIFlow
Real-time, timeline-based MIDI practice for tin whistle and other instruments. Practice, song creation, MIDI preview, and settings live in a clean three-tab UI with persistent song storage and responsive design.

## Why it exists
- **Focused practice only**: sequential timeline with smart note stacking, tempo controls (25–100%), and encouraging retry feedback.
- **Immediate MIDI feedback**: WebMIDI + Web Audio support real-time input, status bar indicators, live previews, and device hot-plugging.
- **Song authoring & storage**: manual song input or drag-and-drop MIDI import with per-track previews, automatic persistence, and easy management.
- **Instrument-ready UX**: tin whistle fingering board, range filtering for other instruments, and visual device/debug helpers.

## Quick start
1. **Prerequisites**: Chrome/Chromium and a MIDI source (hardware or virtual).
2. **Install & run**:
   ```bash
   npm install
   npm run dev
   ```
3. **Connect a device** from the Settings tab and confirm the green header indicator.
4. **Create/import songs** on the Practice Song tab (manual note entry or .mid drag-and-drop).
5. **Practice** using the Practice tab: select a song, adjust tempo, and follow the timeline.

## Browser support
- Chrome/Chromium: full WebMIDI/Web Audio support.
- Firefox: limited WebMIDI (Bluetooth/USB support varies).
- Safari: WebMIDI unavailable.

## Architecture overview
- `App.tsx`: tab navigation and practice/session state.
- `TinWhistlePracticeBoard` & `TinWhistleSequentialPractice`: timeline, fingerings, and visual feedback.
- `SongInput`, `MIDIFileUploader`, `MIDIPreview`: song creation, import, and preview controls.
- `useMIDI`, `MIDIManager`, `midiFileParser`: WebMIDI and MIDI file handling.
- `storage.ts`: localStorage persistence utilities.

## Status & roadmap
**Phase 3 complete**: focused practice core, MIDI preview, storage, and debug tools. **Phase 4 goals** include additional practice modes, analytics, Bluetooth MIDI, richer visuals, and sharing features.
