let sharedAudioContext: AudioContext | null = null;

const getBrowserAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextClass();
  }

  return sharedAudioContext;
};

const midiNoteToFrequency = (note: number): number => 440 * Math.pow(2, (note - 69) / 12);

export const playWhistleNote = async (
  note: number,
  velocity: number = 80,
  durationMs: number = 180
): Promise<void> => {
  try {
    const audioContext = getBrowserAudioContext();
    if (!audioContext) {
      return;
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const now = audioContext.currentTime;
    const durationSeconds = Math.max(0.08, durationMs / 1000);
    const attack = 0.012;
    const decay = 0.08;
    const release = 0.24;
    const sustainDuration = Math.max(0.02, durationSeconds - attack - decay);
    const stopTime = now + attack + decay + sustainDuration + release;

    const mainOscillator = audioContext.createOscillator();
    mainOscillator.type = 'triangle';
    mainOscillator.frequency.setValueAtTime(midiNoteToFrequency(note), now);

    const harmonicOscillator = audioContext.createOscillator();
    harmonicOscillator.type = 'sine';
    harmonicOscillator.frequency.setValueAtTime(midiNoteToFrequency(note) * 2, now);
    harmonicOscillator.detune.setValueAtTime(3, now);

    const harmonicGain = audioContext.createGain();
    harmonicGain.gain.setValueAtTime(0.12, now);

    const lowPassFilter = audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.setValueAtTime(3700, now);
    lowPassFilter.Q.setValueAtTime(2.8, now);

    const noteGain = audioContext.createGain();
    const normalizedVelocity = Math.max(0, Math.min(127, velocity)) / 127;
    const peakGain = 0.14 + normalizedVelocity * 0.1;
    const sustainGain = peakGain * 0.72;

    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(peakGain, now + attack);
    noteGain.gain.linearRampToValueAtTime(sustainGain, now + attack + decay);
    noteGain.gain.setValueAtTime(sustainGain, now + attack + decay + sustainDuration);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    harmonicOscillator.connect(harmonicGain);
    harmonicGain.connect(lowPassFilter);
    mainOscillator.connect(lowPassFilter);
    lowPassFilter.connect(noteGain);
    noteGain.connect(audioContext.destination);

    mainOscillator.start(now);
    harmonicOscillator.start(now);
    mainOscillator.stop(stopTime);
    harmonicOscillator.stop(stopTime);

    const cleanup = () => {
      mainOscillator.disconnect();
      harmonicOscillator.disconnect();
      harmonicGain.disconnect();
      lowPassFilter.disconnect();
      noteGain.disconnect();
    };

    mainOscillator.onended = cleanup;
  } catch (error) {
    console.warn('Simulated whistle synth unavailable:', error);
  }
};
