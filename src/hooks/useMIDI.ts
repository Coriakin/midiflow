import { useEffect, useState, useCallback, useRef } from 'react';
import { MIDIManager } from '../lib/midi/MIDIManager';
import type { MIDIMessage, MIDIDeviceInfo } from '../types/midi';

/**
 * React hook for MIDI device management and message handling
 * Provides a simple interface for connecting to MIDI devices and receiving messages
 */
export function useMIDI() {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [devices, setDevices] = useState<MIDIDeviceInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const midiManagerRef = useRef<MIDIManager | null>(null);
  const messageListenersRef = useRef(new Set<(message: MIDIMessage) => void>());

  /**
   * Initialize MIDI manager on mount
   */
  useEffect(() => {
    const initializeMIDI = async () => {
      try {
        setError(null);
        
        // Check if WebMIDI is supported
        if (!navigator.requestMIDIAccess) {
          const errorMsg = 'WebMIDI API is not supported in this browser. Please use Chrome or a Chromium-based browser.';
          setError(errorMsg);
          console.error(errorMsg);
          return;
        }
        
        setIsSupported(true);
        console.log('WebMIDI API is supported, initializing...');
        
        const manager = new MIDIManager();
        const success = await manager.initialize();
        
        if (success) {
          console.log('MIDI Manager initialized successfully');
          midiManagerRef.current = manager;
          
          // Set up device listener
          manager.addDeviceListener(setDevices);
          
          // Set up message forwarding to all listeners
          manager.addMessageListener((message: MIDIMessage) => {
            messageListenersRef.current.forEach((listener: (message: MIDIMessage) => void) => {
              try {
                listener(message);
              } catch (error) {
                console.error('Error in MIDI message listener:', error);
              }
            });
          });
          
          setIsInitialized(true);
          console.log('MIDI system ready');
        } else {
          const errorMsg = 'Failed to initialize MIDI system. Please check console for details.';
          setError(errorMsg);
          console.error(errorMsg);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown MIDI initialization error';
        setError(errorMessage);
        console.error('MIDI initialization error:', err);
      }
    };

    initializeMIDI();

    // Cleanup on unmount
    return () => {
      if (midiManagerRef.current) {
        midiManagerRef.current.dispose();
        midiManagerRef.current = null;
      }
      messageListenersRef.current.clear();
    };
  }, []);

  /**
   * Connect to a MIDI device
   */
  const connectToDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    if (!midiManagerRef.current) {
      // Try to initialize if not already done
      if (!isInitialized) {
        setError('MIDI manager not initialized. Trying to initialize...');
        const manager = new MIDIManager();
        const success = await manager.initialize();
        if (success) {
          midiManagerRef.current = manager;
          setIsInitialized(true);
          setError(null);
        } else {
          setError('Failed to initialize MIDI manager');
          return false;
        }
      } else {
        setError('MIDI manager not available');
        return false;
      }
    }

    try {
      setIsConnecting(true);
      setError(null);
      
      const success = await midiManagerRef.current.connectToDevice(deviceId);
      
      if (!success) {
        setError(`Failed to connect to device ${deviceId}`);
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection error';
      setError(errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isInitialized]);

  /**
   * Disconnect from a MIDI device
   */
  const disconnectFromDevice = useCallback((deviceId: string): void => {
    if (!midiManagerRef.current) return;
    
    try {
      midiManagerRef.current.disconnectFromDevice(deviceId);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnection error';
      setError(errorMessage);
    }
  }, []);

  /**
   * Add a listener for MIDI messages
   */
  const addMessageListener = useCallback((listener: (message: MIDIMessage) => void): void => {
    messageListenersRef.current.add(listener);
  }, []);

  /**
   * Remove a listener for MIDI messages
   */
  const removeMessageListener = useCallback((listener: (message: MIDIMessage) => void): void => {
    messageListenersRef.current.delete(listener);
  }, []);

  /**
   * Get connected devices (devices with state 'connected')
   */
  const connectedDevices = devices.filter((device: MIDIDeviceInfo) => device.state === 'connected');

  return {
    // State
    isSupported,
    isInitialized,
    devices,
    connectedDevices,
    isConnecting,
    error,
    
    // Actions
    connectToDevice,
    disconnectFromDevice,
    addMessageListener,
    removeMessageListener,
    
    // Computed
    hasConnectedDevices: connectedDevices.length > 0,
    isReady: isSupported && isInitialized && !error
  };
}
