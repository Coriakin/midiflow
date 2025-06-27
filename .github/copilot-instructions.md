# Tooter AI Assistant Rules File

## Application Purpose
Tooter is a web-based MIDI-driven educational app designed specifically to help beginners learn and practice songs on the tin whistle. Users play their actual tin whistle (equipped with MIDI capability via devices like Warbl) and receive real-time feedback on their performance. The app provides visual notation, tracks accuracy, and helps users improve their tin whistle playing skills through guided practice sessions.

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
- Real-time note detection and analysis should be seamless
- Visual feedback updates should be smooth and immediate
- Sheet music rendering should be optimized for readability
- Practice session data should be processed efficiently

## Feature Requirements

### MIDI Integration
- Support USB and Bluetooth (BLE) MIDI devices via WebMIDI and Web Bluetooth APIs.
- Prioritize low latency, with USB MIDI as primary recommendation.

### User-Friendly Song Input
- Allow users to easily add new songs:
  - Provide a drag-and-drop interface for uploading MIDI files.
  - Automatically parse MIDI files to visualize notes and identify song structures.
  - Allow basic metadata input (song title, difficulty, tempo adjustments).

### Visual and Real-time Feedback
- Display sheet music or simplified notation for the selected song
- Real-time MIDI input analysis provides immediate feedback:
  - Correct notes: Visual confirmation (green highlight, checkmark, etc.)
  - Incorrect notes: Clear indication of the mistake (red highlight, show expected vs. played note)
  - Timing feedback: Early, on-time, or late indicators
  - Pitch accuracy: Show if the note was sharp, flat, or correct
- Maintain an encouraging learning atmosphere with positive reinforcement

### Practice and Learning Modes
- Adjustable tempo for practicing challenging sections.
- Loop functionality enabling repeated practice of difficult segments.

### Performance Statistics
- Collect detailed accuracy metrics:
  - Track note correctness and timing accuracy (early, on-time, late).
  - Save statistics per song, per session.
- Visualize user progress clearly after each session:
  - Display historical accuracy comparisons.
  - Highlight areas of improvement or recurring mistakes.

### Technical Specifications
- Frontend: React.js (using functional components with TypeScript)
- MIDI: WebMIDI API (primary) + Web Bluetooth API (fallback)
- Visuals & Animation: SVG for sheet music notation, HTML Canvas for real-time visual feedback, Framer Motion for UI transitions
- Audio: Web Audio API for metronome and audio feedback
- Data Management: IndexedDB for song storage and statistics, LocalStorage for user preferences
- State Management: React Context + useReducer for game state, Zustand for global app state
- Deployment: Web-based (Vite build), ensuring cross-browser compatibility primarily with Chrome-based browsers
- Testing: Jest + React Testing Library for components, Web MIDI API mocking for MIDI tests

## MIDI-Specific Guidelines
- Always check for WebMIDI API support before initialization
- Implement graceful fallbacks when MIDI devices are unavailable
- Use consistent MIDI note numbering (Middle C = 60, tin whistle range typically 60-84)
- Handle MIDI device hot-plugging (connect/disconnect during gameplay)
- Implement MIDI input filtering to ignore irrelevant messages (e.g., aftertouch, pitch bend)
- Log MIDI events for debugging but avoid performance impact in production

## Practice Logic Standards
- Separate concerns: MIDI input → note detection → performance analysis → visual feedback
- Use consistent timing: all timestamps should be in milliseconds from performance.now()
- Implement configurable tolerance windows for note timing (early/perfect/late)
- Maintain practice session state immutability for reliable undo/redo functionality
- Use event-driven architecture for loose coupling between input and feedback systems

## File Organization Patterns
- `/src/components/` - Reusable UI components
- `/src/hooks/` - Custom React hooks (useMIDI, usePracticeSession, etc.)
- `/src/lib/midi/` - MIDI parsing, device management, and input handling
- `/src/lib/practice/` - Practice session logic, scoring, and performance analysis
- `/src/lib/audio/` - Audio context management and metronome
- `/src/lib/notation/` - Sheet music rendering and notation utilities
- `/src/types/` - TypeScript type definitions
- `/src/utils/` - Helper functions and utilities
- `/src/stores/` - State management (Zustand stores)

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
- Verify tin whistle note range and preferred octave handling

## Naming and Terminology Conventions
- Refer to the user consistently as "user"
- Use "note" for musical notes, "target" for expected notes in practice
- Use "accuracy" for timing precision, "correctness" for right/wrong notes
- Clearly label MIDI device states: "connected", "disconnected", "error"
- Use consistent practice terminology: "session", "song", "practice mode", "performance feedback"
- Avoid ambiguous terms or acronyms without explanations

**End of Tooter AI Assistant Rules File**
