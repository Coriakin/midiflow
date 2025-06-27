import type { 
  MIDIMessage, 
  MIDIDeviceInfo, 
  MIDIDeviceState,
  MIDINoteNumber,
  MIDIVelocity 
} from '../../types/midi';

/**
 * MIDI Manager for handling WebMIDI API operations
 * Provides device detection, connection management, and message parsing
 */
export class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private connectedInputs = new Map<string, MIDIInput>();
  private messageListeners = new Set<(message: MIDIMessage) => void>();
  private deviceListeners = new Set<(devices: MIDIDeviceInfo[]) => void>();

  /**
   * Initialize WebMIDI API and set up device monitoring
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if WebMIDI API is supported
      if (!navigator.requestMIDIAccess) {
        console.error('WebMIDI API not supported - navigator.requestMIDIAccess is undefined');
        return false;
      }

      console.log('Requesting MIDI access...');
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      console.log('MIDI access granted successfully');
      
      // Set up device change listeners
      this.midiAccess.onstatechange = this.handleDeviceStateChange.bind(this);
      
      // Connect to existing devices
      this.connectToAvailableDevices();
      
      console.log('MIDI Manager initialized successfully');
      console.log('Available inputs:', Array.from(this.midiAccess.inputs.values()).map(input => input.name));
      return true;
    } catch (error) {
      console.error('Failed to initialize MIDI:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Get list of available MIDI input devices
   */
  getAvailableDevices(): MIDIDeviceInfo[] {
    if (!this.midiAccess) return [];

    const devices: MIDIDeviceInfo[] = [];
    
    for (const input of this.midiAccess.inputs.values()) {
      devices.push({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        type: 'USB', // Default to USB, BLE detection would need additional logic
        state: this.mapDeviceState(input.state)
      });
    }

    return devices;
  }

  /**
   * Connect to a specific MIDI device
   */
  async connectToDevice(deviceId: string): Promise<boolean> {
    if (!this.midiAccess) return false;

    const input = this.midiAccess.inputs.get(deviceId);
    if (!input) {
      console.warn(`MIDI device ${deviceId} not found`);
      return false;
    }

    try {
      // Set up message handler
      input.onmidimessage = this.handleMIDIMessage.bind(this);
      
      this.connectedInputs.set(deviceId, input);
      console.log(`Connected to MIDI device: ${input.name}`);
      
      this.notifyDeviceListeners();
      return true;
    } catch (error) {
      console.error(`Failed to connect to MIDI device ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Disconnect from a specific MIDI device
   */
  disconnectFromDevice(deviceId: string): void {
    const input = this.connectedInputs.get(deviceId);
    if (input) {
      input.onmidimessage = null;
      this.connectedInputs.delete(deviceId);
      console.log(`Disconnected from MIDI device: ${input.name}`);
      this.notifyDeviceListeners();
    }
  }

  /**
   * Add listener for MIDI messages
   */
  addMessageListener(listener: (message: MIDIMessage) => void): void {
    this.messageListeners.add(listener);
  }

  /**
   * Remove listener for MIDI messages
   */
  removeMessageListener(listener: (message: MIDIMessage) => void): void {
    this.messageListeners.delete(listener);
  }

  /**
   * Add listener for device changes
   */
  addDeviceListener(listener: (devices: MIDIDeviceInfo[]) => void): void {
    this.deviceListeners.add(listener);
  }

  /**
   * Remove listener for device changes
   */
  removeDeviceListener(listener: (devices: MIDIDeviceInfo[]) => void): void {
    this.deviceListeners.delete(listener);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.connectedInputs.forEach((_, deviceId) => {
      this.disconnectFromDevice(deviceId);
    });
    
    this.messageListeners.clear();
    this.deviceListeners.clear();
    
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
    }
    
    this.midiAccess = null;
  }

  /**
   * Handle incoming MIDI messages
   */
  private handleMIDIMessage(event: MIDIMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 3) return;
    
    const [status, note, velocity] = Array.from(data);
    const timestamp = performance.now();

    // Parse note on/off messages (ignore other MIDI messages)
    let message: MIDIMessage | null = null;

    if ((status & 0xF0) === 0x90 && velocity > 0) {
      // Note On
      message = {
        type: 'noteon',
        note: note as MIDINoteNumber,
        velocity: velocity as MIDIVelocity,
        timestamp
      };
    } else if ((status & 0xF0) === 0x80 || ((status & 0xF0) === 0x90 && velocity === 0)) {
      // Note Off
      message = {
        type: 'noteoff',
        note: note as MIDINoteNumber,
        velocity: velocity as MIDIVelocity,
        timestamp
      };
    }

    if (message) {
      // Notify all listeners
      this.messageListeners.forEach(listener => {
        try {
          listener(message!);
        } catch (error) {
          console.error('Error in MIDI message listener:', error);
        }
      });
    }
  }

  /**
   * Handle device connection state changes
   */
  private handleDeviceStateChange(event: MIDIConnectionEvent): void {
    const port = event.port;
    if (!port) return;
    
    console.log(`MIDI device ${port.state}: ${port.name}`);
    
    if (port.type === 'input') {
      if (port.state === 'connected') {
        // Auto-connect to new devices (could be made configurable)
        this.connectToDevice(port.id);
      } else if (port.state === 'disconnected') {
        this.disconnectFromDevice(port.id);
      }
    }
    
    this.notifyDeviceListeners();
  }

  /**
   * Connect to all available devices on initialization
   */
  private connectToAvailableDevices(): void {
    if (!this.midiAccess) return;

    for (const input of this.midiAccess.inputs.values()) {
      if (input.state === 'connected') {
        this.connectToDevice(input.id);
      }
    }
  }

  /**
   * Map WebMIDI device state to our type
   */
  private mapDeviceState(state: MIDIPortDeviceState): MIDIDeviceState {
    switch (state) {
      case 'connected':
        return 'connected';
      case 'disconnected':
        return 'disconnected';
      default:
        return 'error';
    }
  }

  /**
   * Notify all device listeners of current device list
   */
  private notifyDeviceListeners(): void {
    const devices = this.getAvailableDevices();
    this.deviceListeners.forEach(listener => {
      try {
        listener(devices);
      } catch (error) {
        console.error('Error in device listener:', error);
      }
    });
  }
}
