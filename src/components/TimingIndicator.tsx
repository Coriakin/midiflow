/**
 * TimingIndicator Component
 * 
 * Provides real-time timing feedback for rhythm practice without the stress of a moving timeline.
 * Shows whether the user is playing too early, on time, or too late relative to the expected beat.
 * 
 * Features:
 * - Visual indicator with color coding (early/perfect/late)
 * - Rolling 2-second window for timing calculations (prevents accumulating errors)
 * - Timing tolerance zones with adjustable sensitivity
 * - Smooth animations for feedback display
 * - Non-intrusive design that complements the metronome
 * - Encourages good timing without punishment - users can recover from early mistakes
 */

import React, { useState, useEffect, useRef } from 'react';
import type { NoteTimingAccuracy } from '../types/midi';

interface TimingWindow {
  early: number;   // seconds before expected time (negative)
  perfect: number; // seconds around expected time (±)
  late: number;    // seconds after expected time (positive)
}

interface TimingFeedback {
  accuracy: NoteTimingAccuracy;
  deviation: number; // seconds from expected time
  timestamp: number;
}

interface TimingMeasurement {
  deviation: number;
  timestamp: number;
}

interface TimingIndicatorProps {
  /** Current beat position in the song */
  currentBeat: number;
  /** Expected beat when user should play the current note */
  expectedBeat?: number;
  /** Tempo in BPM for timing calculations */
  tempo: number;
  /** Timestamp when the user last played a note */
  lastNoteTimestamp?: number | null;
  /** Whether practice has started */
  hasStarted: boolean;
  /** Whether practice is currently paused */
  isPaused: boolean;
  /** Whether practice is completed */
  isCompleted: boolean;
  /** Timing sensitivity: 'strict', 'normal', 'relaxed' */
  sensitivity?: 'strict' | 'normal' | 'relaxed';
  /** Custom CSS classes */
  className?: string;
}

/**
 * Timing windows for different sensitivity levels (in seconds)
 */
const TIMING_WINDOWS: Record<string, TimingWindow> = {
  strict: { early: 0.1, perfect: 0.05, late: 0.1 },
  normal: { early: 0.15, perfect: 0.075, late: 0.15 },
  relaxed: { early: 0.2, perfect: 0.1, late: 0.2 }
};

/**
 * Calculate timing accuracy based on when user played vs when they should have played
 */
const calculateTimingAccuracy = (
  playedTime: number,
  expectedTime: number,
  window: TimingWindow
): { accuracy: NoteTimingAccuracy; deviation: number } => {
  const deviation = playedTime - expectedTime;
  
  if (Math.abs(deviation) <= window.perfect) {
    return { accuracy: 'perfect', deviation };
  } else if (deviation < -window.perfect && Math.abs(deviation) <= window.early) {
    return { accuracy: 'early', deviation };
  } else if (deviation > window.perfect && Math.abs(deviation) <= window.late) {
    return { accuracy: 'late', deviation };
  } else if (deviation < 0) {
    return { accuracy: 'early', deviation };
  } else {
    return { accuracy: 'late', deviation };
  }
};

/**
 * Real-time timing feedback indicator for rhythm practice
 */
export const TimingIndicator: React.FC<TimingIndicatorProps> = ({
  currentBeat,
  expectedBeat,
  tempo,
  lastNoteTimestamp,
  hasStarted,
  isPaused,
  isCompleted,
  sensitivity = 'normal',
  className = ''
}) => {
  const [feedback, setFeedback] = useState<TimingFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timingMeasurements, setTimingMeasurements] = useState<TimingMeasurement[]>([]);
  const lastProcessedTimestamp = useRef<number>(0);
  
  const timingWindow = TIMING_WINDOWS[sensitivity];
  const beatsPerSecond = tempo / 60;
  const ROLLING_WINDOW_SECONDS = 2.0; // 2-second rolling window
  
  // Clean up old measurements from the rolling window
  const cleanupOldMeasurements = (measurements: TimingMeasurement[]): TimingMeasurement[] => {
    const now = performance.now();
    return measurements.filter(m => (now - m.timestamp) <= (ROLLING_WINDOW_SECONDS * 1000));
  };
  
  // Calculate average timing from rolling window
  const calculateRollingAverage = (measurements: TimingMeasurement[]): number => {
    if (measurements.length === 0) return 0;
    const sum = measurements.reduce((acc, m) => acc + m.deviation, 0);
    return sum / measurements.length;
  };
  
  // Reset timing measurements when practice starts/restarts
  useEffect(() => {
    if (!hasStarted || isCompleted) {
      setTimingMeasurements([]);
      setFeedback(null);
      setShowFeedback(false);
    }
  }, [hasStarted, isCompleted]);

  // Periodic cleanup of old measurements (every 500ms)
  useEffect(() => {
    if (!hasStarted || isCompleted) return;
    
    const cleanupInterval = setInterval(() => {
      setTimingMeasurements(prevMeasurements => {
        const cleanMeasurements = cleanupOldMeasurements(prevMeasurements);
        
        // Update feedback based on current rolling average if we have measurements
        if (cleanMeasurements.length > 0 && expectedBeat !== undefined) {
          const rollingAverage = calculateRollingAverage(cleanMeasurements);
          const expectedTimeSeconds = expectedBeat / beatsPerSecond;
          
          const { accuracy } = calculateTimingAccuracy(
            rollingAverage + expectedTimeSeconds,
            expectedTimeSeconds,
            timingWindow
          );
          
          setFeedback(prev => prev ? { ...prev, accuracy, deviation: rollingAverage } : null);
        }
        
        return cleanMeasurements;
      });
    }, 500);
    
    return () => clearInterval(cleanupInterval);
  }, [hasStarted, isCompleted, expectedBeat, beatsPerSecond, timingWindow, calculateRollingAverage]);

  // Process timing feedback when a note is played
  useEffect(() => {
    if (!hasStarted || isPaused || isCompleted || !lastNoteTimestamp || !expectedBeat) {
      return;
    }
    
    // Avoid processing the same timestamp multiple times
    if (lastNoteTimestamp === lastProcessedTimestamp.current) {
      return;
    }
    
    lastProcessedTimestamp.current = lastNoteTimestamp;
    
    // Calculate expected time in seconds from start
    const expectedTimeSeconds = expectedBeat / beatsPerSecond;
    
    // Calculate current time in seconds from start
    const currentTimeSeconds = currentBeat / beatsPerSecond;
    
    // Calculate the timing deviation for this note
    const playedTimeSeconds = currentTimeSeconds; // When they actually played
    const currentDeviation = playedTimeSeconds - expectedTimeSeconds;
    
    // Add new measurement to rolling window and calculate feedback
    setTimingMeasurements(prevMeasurements => {
      // Add new measurement with current time
      const newMeasurement: TimingMeasurement = {
        deviation: currentDeviation,
        timestamp: performance.now() // Use actual current time for rolling window
      };
      
      // Update measurements with new data and clean up old entries
      const updatedMeasurements = [...prevMeasurements, newMeasurement];
      const cleanMeasurements = cleanupOldMeasurements(updatedMeasurements);
      
      // Calculate timing feedback based on rolling average
      const rollingAverage = calculateRollingAverage(cleanMeasurements);
      
      // Debug logging for rolling window
      console.log(`🎯 Timing: Added measurement ${currentDeviation.toFixed(3)}s, Window size: ${cleanMeasurements.length}, Rolling avg: ${rollingAverage.toFixed(3)}s`);
      
      // Use rolling average for accuracy calculation instead of single note
      const { accuracy } = calculateTimingAccuracy(
        rollingAverage + expectedTimeSeconds, // Convert back to absolute time for calculation
        expectedTimeSeconds,
        timingWindow
      );
      
      const newFeedback: TimingFeedback = {
        accuracy,
        deviation: rollingAverage, // Show the rolling average deviation
        timestamp: lastNoteTimestamp
      };
      
      setFeedback(newFeedback);
      setShowFeedback(true);
      
      return cleanMeasurements;
    });
    
    // Hide feedback after 2 seconds
    const timeoutId = setTimeout(() => {
      setShowFeedback(false);
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [lastNoteTimestamp, currentBeat, expectedBeat, beatsPerSecond, hasStarted, isPaused, isCompleted, timingWindow, cleanupOldMeasurements, calculateRollingAverage]);
  
  // Don't show indicator if practice hasn't started
  if (!hasStarted) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-gray-600 opacity-50" />
        <span className="text-xs text-gray-500">Timing</span>
      </div>
    );
  }
  
  // Get indicator styling based on current feedback
  const getIndicatorStyle = () => {
    if (!feedback || !showFeedback) {
      return {
        bg: 'bg-gray-600',
        text: 'text-gray-400',
        label: 'Waiting...',
        icon: '⏱️'
      };
    }
    
    switch (feedback.accuracy) {
      case 'perfect':
        return {
          bg: 'bg-green-500',
          text: 'text-green-300',
          label: 'Perfect!',
          icon: '🎯'
        };
      case 'early':
        return {
          bg: 'bg-blue-500',
          text: 'text-blue-300',
          label: 'Too Early',
          icon: '⏩'
        };
      case 'late':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-300',
          label: 'Too Late',
          icon: '⏪'
        };
      default:
        return {
          bg: 'bg-gray-600',
          text: 'text-gray-400',
          label: 'Timing',
          icon: '⏱️'
        };
    }
  };
  
  const style = getIndicatorStyle();
  
  // Format deviation for display
  const formatDeviation = (deviation: number): string => {
    const ms = Math.abs(deviation * 1000);
    if (ms < 10) return '< 10ms';
    return `${Math.round(ms)}ms`;
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div 
        className={`w-4 h-4 rounded-full transition-all duration-300 ${style.bg} ${
          showFeedback && feedback ? 'scale-125 shadow-lg' : 'scale-100'
        }`}
        style={{
          opacity: showFeedback ? 1 : 0.5
        }}
      />
      <div className="flex flex-col">
        <span className={`text-xs font-medium transition-colors duration-300 ${style.text}`}>
          {style.icon} {style.label}
        </span>
        {feedback && showFeedback && (
          <span className="text-xs text-gray-500">
            {formatDeviation(feedback.deviation)} {feedback.accuracy === 'early' ? 'early' : feedback.accuracy === 'late' ? 'late' : ''}
          </span>
        )}
      </div>
    </div>
  );
};

export default TimingIndicator;
