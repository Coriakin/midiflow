import { useState, useEffect } from 'react';
import { useMIDI } from './hooks/useMIDI';
import { NoteVisualizer } from './components/NoteVisualizer';
import type { MIDIMessage, PracticeNote } from './types/midi';
import { isInTinWhistleRange, midiNoteToName } from './types/midi';

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

  // Listen for MIDI messages and create falling notes
  useEffect(() => {
    const activeNoteStates = new Map<number, number>(); // Track active notes by MIDI note number -> timestamp
    
    const handleMIDIMessage = (message: MIDIMessage) => {
      setLastNote(message);
      
      console.log(`MIDI message: ${message.type}, note: ${message.note}, in range: ${isInTinWhistleRange(message.note)}`);
      
      if (message.type === 'noteoff' && activeNoteStates.has(message.note)) {
        // Note released - remove from active tracking
        console.log(`Note ${message.note} released, removing from active tracking`);
        activeNoteStates.delete(message.note);
        return;
      }
      
      if (message.type === 'noteon' && isInTinWhistleRange(message.note)) {
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
        
        // Create a new falling note
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
  }, [addMessageListener, removeMessageListener]);

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

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tooter</h1>
          <p className="text-xl text-red-400 mb-4">WebMIDI not supported</p>
          <p className="text-gray-400">Please use Chrome or a Chromium-based browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4">
        <h1 className="text-3xl font-bold text-center">🎵 Tooter - Tin Whistle Practice</h1>
      </header>

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
                  In range: {isInTinWhistleRange(lastNote.note) ? 'Yes' : 'No'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note Visualizer */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Practice Area</h2>
          <NoteVisualizer 
            notes={practiceNotes}
            className="h-96 rounded border border-gray-600"
            onNoteExit={handleNoteExit}
          />
          
          {isReady && connectedDevices.length === 0 && (
            <div className="text-center text-gray-400 mt-4">
              <p>Connect a MIDI device to start practicing!</p>
              <p className="text-sm">Make sure your Warbl or other MIDI controller is connected.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
