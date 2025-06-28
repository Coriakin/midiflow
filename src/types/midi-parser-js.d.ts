declare module 'midi-parser-js' {
  interface MIDIEvent {
    type: number;
    metaType?: number;
    data?: number[] | Uint8Array;
    deltaTime: number;
    channel?: number;
  }

  interface MIDITrack {
    event: MIDIEvent[];
  }

  interface MIDIData {
    track: MIDITrack[];
    ticksPerBeat: number;
    formatType: number;
  }

  export function parse(data: Uint8Array): MIDIData;
  export default { parse };
}
