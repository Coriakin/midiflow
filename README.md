# MIDIFlow
MIDIFlow is a focused web-based tin whistle practice application that provides real-time visual feedback through MIDI input. Practice songs with step-by-step guidance and see your progress in real-time.
Initially focus is on tin whistle and uilleann pipes, but I do not see why this tool cannot also be a more generic one for other midi instruments.

![MIDIFlow screenshot](./screenshot1.jpg)

## Note from author
I have always wanted to improve my tooting, but seldom find time and always looking for structured ways to get some practice in with songs I like and find around the web. This project is an attempt to do something that I can use, and once it is mature enough I hope it will be of joy for others out there as well!

/Andreas

## Quick start
1. **Prerequisites**: Chrome/Chromium and a MIDI source (hardware or virtual).
2. **Install**:
   ```bash
   npm install
   ```
3. **Run in foreground (recommended for dev)**:
   ```bash
   ./run-dev.sh
   ```
   This script stops stale MIDIFlow dev server processes scoped to this repo, then starts the app in the foreground so you can use `Ctrl+C` to stop it. (Equivalent direct path: `./scripts/run-dev.sh`.)
4. **Alternative manual run**:
   ```bash
   npm run dev
   ```
5. **Connect a device** from the Settings tab and confirm the green header indicator.
6. **Create/import songs** on the Practice Song tab (manual note entry or .mid drag-and-drop).
7. **Practice** using the Practice tab: select a song, adjust tempo, and follow the timeline.

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
