# MIDIFlow AI Assistant Rules File

## Application Purpose
MIDIFlow is a focused web-based tin whistle practice application that provides real-time visual feedback through MIDI input. Users connect their MIDI controller and practice songs through timeline-based sequential learning with step-by-step guidance. The app features MIDI file import with track selection, MIDI preview playback, manual song creation, persistent song storage, and real-time visual feedback. It maintains an encouraging learning atmosphere with unlimited retries and clear progress indicators.

## Code Style & Standards
- Use TypeScript for all new files (prefer .ts/.tsx extensions)
- Use functional React components with hooks (no class components)
- Prefer const assertions and strict typing for MIDI-related data structures
- Use descriptive names for MIDI events, note states, and game mechanics
- Follow consistent naming: camelCase for variables/functions, PascalCase for components
- Add JSDoc comments for complex MIDI parsing and timing logic
- Use async/await instead of Promise chains for MIDI operations

## Performance Requirements
- MIDI input latency must be < 20ms for responsive feedback
- Visual feedback updates should be smooth and immediate
- Sheet music rendering should be optimized for readability
- Practice session data should be processed efficiently
- Falling note animations should be smooth and responsive to user input

## Feature Requirements

### MIDI Integration
- Support USB and Bluetooth (BLE) MIDI devices via WebMIDI and Web Bluetooth APIs.
- Prioritize low latency, with USB MIDI as primary recommendation.

### User-Friendly Song Input ✅ IMPLEMENTED
- ✅ Allow users to easily add new songs they want to practice:
  - ✅ Provide a drag-and-drop interface for uploading MIDI files
  - ✅ Support manual note entry for songs not available as MIDI
  - ✅ Simple melody input tools (note name parser, MIDI number input)
  - ✅ Automatically parse MIDI files to visualize notes and identify song structures
  - ✅ Allow basic metadata input (song title, tempo from MIDI)
  - ✅ Track selection from multi-track MIDI files with real-time re-extraction
  - ✅ Built-in song library for immediate practice
  - ✅ Save user-created songs to persistent localStorage storage
  - ✅ Separate built-in songs from imported/manual songs in organized UI
  - ✅ MIDI Preview functionality for track auditioning and selection

### Song Storage and Persistence ✅ IMPLEMENTED
- ✅ localStorage persistence for both MIDI and manual songs
- ✅ Base64 encoding for binary MIDI file data storage
- ✅ Automatic save on song creation/modification
- ✅ Automatic restore on app load
- ✅ Development tools for storage management and debugging
- ✅ Separate storage for built-in vs. user-created content

### MIDI Preview and Playback ✅ IMPLEMENTED
- ✅ Real-time MIDI file playback with Web Audio API
- ✅ Play, pause, stop, and time-seeking controls (±15s skip)
- ✅ Quick track switching during preview with immediate re-extraction
- ✅ Modal interface for focused preview experience
- ✅ Integration with both song list and import workflow

### Visual and Real-time Feedback
- Display notes visually as "falling notes" moving towards a target line (Guitar Hero style)
- Show upcoming notes clearly so users can prepare for what's coming next
- Real-time MIDI input analysis with immediate visual feedback:
  - Correct notes: Visual confirmation (green highlight, successful hit animation)
  - Wrong notes: Animation pauses, highlights incorrect note (red), shows expected vs. played
  - Quickly resume animation after error, encouraging retry without penalty
  - Allow multiple attempts at the same note until correct
- Maintain an encouraging, trial-and-error friendly learning atmosphere
- Provide clear visual cues for timing (early, perfect, late)

### Practice and Learning Modes ✅ IMPLEMENTED
- ✅ Timeline-based sequential practice with step-by-step guidance
- ✅ Single-note progression with unlimited retries per note
- ✅ Practice state persistence and clear visual indicators
- ✅ Focused practice mode (removed free play for clarity)
- [ ] Adjustable tempo for practicing challenging sections (planned)
- [ ] Loop functionality enabling repeated practice of difficult segments (planned)

### Performance Statistics
- Collect detailed accuracy metrics per song:
  - Track note correctness and timing accuracy (early, on-time, late)
  - Record attempts vs. successful hits for each note
  - Save statistics per song, per session with timestamps
- Visualize user progress clearly after each session:
  - Display current session performance vs. historical averages
  - Show improvement trends over time for each song
  - Highlight areas of consistent improvement or recurring mistakes
  - Per-song progress tracking to show mastery development

### Technical Specifications
- Frontend: React.js (using functional components with TypeScript) ✅
- MIDI: WebMIDI API (primary) + Web Bluetooth API (planned Phase 4) ✅
- MIDI Parsing: midi-parser-js library for MIDI file import and analysis ✅
- Visuals & Animation: CSS animations for real-time visual feedback ✅
- Audio: Web Audio API for metronome and audio feedback (planned Phase 3)
- Data Management: In-memory state (Phase 2), IndexedDB planned (Phase 3)
- State Management: React useState/useEffect (Phase 2), Zustand planned (Phase 3)
- Deployment: Web-based (Vite build), Chrome-based browser focus ✅
- Testing: Jest + React Testing Library for components (planned Phase 3)

## MIDI-Specific Guidelines
- Always check for WebMIDI API support before initialization
- Implement graceful fallbacks when MIDI devices are unavailable
- Use consistent MIDI note numbering (Middle C = 60, instrument ranges vary by type)
- Handle MIDI device hot-plugging (connect/disconnect during practice sessions)
- Implement MIDI input filtering to ignore irrelevant messages (e.g., aftertouch, pitch bend)
- Log MIDI events for debugging but avoid performance impact in production
- Support both USB and Bluetooth (BLE) MIDI connections for various MIDI devices

## Error Recovery and Learning Support
- When wrong notes are played, pause the falling note animation briefly
- Clearly highlight the incorrect note played vs. the expected note
- Resume animation quickly to maintain learning flow
- Allow unlimited retries on each note without penalty
- Provide encouraging feedback to promote trial-and-error learning
- Never punish mistakes - focus on positive reinforcement for correct notes

## Practice Logic Standards
- Separate concerns: MIDI input → note detection → performance analysis → visual feedback
- Use consistent timing: all timestamps should be in milliseconds from performance.now()
- Implement configurable tolerance windows for note timing (early/perfect/late)
- Maintain practice session state immutability for reliable undo/redo functionality
- Use event-driven architecture for loose coupling between input and feedback systems

## File Organization Patterns
- `/src/components/` - Reusable UI components ✅
  - `SongInput.tsx` - Manual song creation ✅
  - `MIDIFileUploader.tsx` - MIDI file import and track selection ✅
  - `MIDIPreview.tsx` - MIDI preview modal with playback controls ✅
  - `TinWhistlePracticeBoard.tsx` - Tin whistle practice interface ✅
  - `TinWhistleSequentialPractice.tsx` - Sequential practice with timing ✅
- `/src/hooks/` - Custom React hooks (useMIDI, usePracticeSession, etc.) ✅
- `/src/lib/midi/` - MIDI parsing, device management, and input handling ✅
  - `MIDIManager.ts` - Core MIDI device management ✅
  - `midiFileParser.ts` - MIDI file parsing and note extraction ✅
- `/src/lib/practice/` - Practice session logic, scoring, and performance analysis (planned Phase 3)
- `/src/lib/audio/` - Audio context management and metronome (planned Phase 3)
- `/src/lib/notation/` - Sheet music rendering and notation utilities (planned Phase 4)
- `/src/types/` - TypeScript type definitions ✅
  - `midi.ts` - Core MIDI types, song interfaces, and utilities ✅
  - `midi-parser-js.d.ts` - MIDI parser library type definitions ✅
- `/src/utils/` - Helper functions and utilities ✅
  - `storage.ts` - localStorage persistence for songs ✅
- `/src/stores/` - State management (Zustand stores, planned Phase 3)

## Error Handling Requirements
- Wrap all MIDI operations in try-catch blocks
- Provide user-friendly error messages for MIDI connection issues
- Implement automatic retry logic for transient MIDI failures
- Use error boundaries for component-level error recovery
- Log errors with sufficient context for debugging (device info, timing, etc.)
- Never let MIDI errors crash the entire application

## Testing Standards
- Mock WebMIDI API for unit tests
- Test MIDI input scenarios (correct notes, wrong notes, timing variations)
- Include performance tests for real-time feedback responsiveness
- Test practice session state transitions thoroughly
- Mock timing functions for deterministic test results

## Accessibility Requirements
- Provide visual feedback alternatives to audio cues
- Support keyboard navigation for all interactive elements
- Include ARIA labels for dynamic practice state changes
- Ensure color contrast meets WCAG standards for sheet music
- Support screen reader announcements for performance feedback

## Clarifications (Request from AI Assistant to User as needed)
- Confirm MIDI parsing format preferences (Standard MIDI File vs. real-time input)
- Confirm desired precision for performance metrics (e.g., ±50ms timing windows)
- Request preferred notation style or sheet music examples if unclear
- Clarify data persistence requirements (temporary vs. long-term statistics)
- Verify instrument note range and preferred octave handling

## Naming and Terminology Conventions
- Refer to the user consistently as "user"
- Use "note" for musical notes, "target" for expected notes in practice
- Use "accuracy" for timing precision, "correctness" for right/wrong notes
- Clearly label MIDI device states: "connected", "disconnected", "error"
- Use consistent practice terminology: "session", "song", "practice mode", "performance feedback"
- Avoid ambiguous terms or acronyms without explanations

## Development Priorities & Phases
### Phase 1 - Core MIDI Foundation ✅ COMPLETE
- ✅ Basic WebMIDI API integration and device detection
- ✅ Simple note input recognition and display
- ✅ Basic falling note visualization (single notes)

### Phase 2 - Practice Interface ✅ COMPLETE
- ✅ Song input mechanism (manual note entry + MIDI file import)
- ✅ Visual feedback system (correct/incorrect notes)
- ✅ Basic timing and accuracy tracking
- ✅ MIDI file parsing and import with track selection
- ✅ Sequential practice mode with step-by-step guidance
- ✅ Built-in song library with timing data

### Phase 3 - Enhanced Features (CURRENT)
- [ ] Statistics and progress tracking
- [ ] Advanced practice modes (tempo adjustment, looping)
- ✅ Local storage for song persistence
- [ ] Performance metrics and session recording
- [ ] Advanced error recovery and learning analytics

### Phase 4 - Polish & Optimization
- [ ] Bluetooth MIDI support
- [ ] Advanced visualizations and themes
- [ ] Performance optimizations
- [ ] MIDI file editing capabilities
- [ ] Social features and sharing

## Browser Support Priorities
- Primary: Chrome/Chromium-based browsers (best WebMIDI support)
- Secondary: Firefox (limited WebMIDI, may need Web Bluetooth fallback)
- Future: Safari (when WebMIDI support improves)

**End of MIDIFlow AI Assistant Rules File**
