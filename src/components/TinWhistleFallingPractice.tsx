import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TIN_WHISTLE_LANE_LABELS, getTinWhistleLaneEvent } from '../lib/tinWhistle';
import type { PracticeViewModel } from '../types/practice';

interface TinWhistleFallingPracticeProps {
  viewModel: PracticeViewModel;
  className?: string;
}

export const TinWhistleFallingPractice: React.FC<TinWhistleFallingPracticeProps> = ({
  viewModel,
  className = ''
}) => {
  const {
    sequence,
    currentNoteIndex,
    isCorrectNote,
    tempo,
    timingPreset,
    timingWindowMs,
    lastTimingDeviationMs,
    flowStartTimestampMs,
    flowPausedAtTimestampMs,
    flowAccumulatedPauseMs,
    notesAheadTarget
  } = viewModel;
  const laneRef = useRef<HTMLDivElement>(null);
  const [laneSize, setLaneSize] = useState({ width: 960, height: 620 });
  const [playheadBeat, setPlayheadBeat] = useState(0);

  useEffect(() => {
    const element = laneRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setLaneSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (flowStartTimestampMs === null) {
      setPlayheadBeat(0);
      return;
    }

    let frameId = 0;
    const tick = () => {
      const now = performance.now();
      const activePauseMs = flowPausedAtTimestampMs !== null ? Math.max(0, now - flowPausedAtTimestampMs) : 0;
      const elapsedMs = Math.max(0, now - flowStartTimestampMs - flowAccumulatedPauseMs - activePauseMs);
      const beats = elapsedMs / (60000 / Math.max(tempo, 1));
      setPlayheadBeat(beats);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [flowStartTimestampMs, flowPausedAtTimestampMs, flowAccumulatedPauseMs, tempo]);

  const isFlowStarted = flowStartTimestampMs !== null;
  const isFlowPaused = flowPausedAtTimestampMs !== null;
  const currentExpectedBeat = sequence[currentNoteIndex]?.startTime ?? 0;
  const guideHeight = 114;
  const hitLineY = Math.max(280, laneSize.height - guideHeight - 26);
  const laneCount = TIN_WHISTLE_LANE_LABELS.length;
  const laneGap = 10;
  const laneWidth = (laneSize.width - laneGap * (laneCount - 1)) / laneCount;
  const visibleTopPadding = 28;
  const holeLaneCenters = Array.from({ length: 6 }, (_, laneIndex) => laneIndex * (laneWidth + laneGap) + laneWidth / 2);
  const breathLaneLeft = 6 * (laneWidth + laneGap);
  const whistleGuideTop = hitLineY + 24;
  const whistleBodyLeft = Math.max(16, holeLaneCenters[0] - laneWidth * 0.52);
  const whistleBodyRight = holeLaneCenters[5] + laneWidth * 0.52;
  const whistleBodyWidth = whistleBodyRight - whistleBodyLeft;
  const pixelsPerBeat = useMemo(() => {
    if (sequence.length === 0) {
      return 150;
    }

    const travelHeight = Math.max(280, hitLineY - visibleTopPadding);
    const lookAheadIndex = Math.min(sequence.length - 1, currentNoteIndex + Math.max(2, notesAheadTarget));
    const currentStartBeat = sequence[currentNoteIndex]?.startTime ?? 0;
    const lookAheadBeat = sequence[lookAheadIndex]?.startTime ?? currentStartBeat + 2;
    const lookAheadDuration = sequence[lookAheadIndex]?.duration ?? 1;
    const beatSpan = Math.max(1, lookAheadBeat - currentStartBeat + lookAheadDuration);
    return Math.min(220, Math.max(48, travelHeight / beatSpan));
  }, [sequence, hitLineY, visibleTopPadding, currentNoteIndex, notesAheadTarget]);

  const timingText = lastTimingDeviationMs === null
    ? `Window ±${timingWindowMs}ms`
    : `${lastTimingDeviationMs < 0 ? 'Early' : 'Late'} ${Math.abs(lastTimingDeviationMs).toFixed(0)}ms`;

  const noteGroups = useMemo(() => (
    sequence
      .map((noteItem, index) => {
        const laneEvent = getTinWhistleLaneEvent(noteItem.note);
        const noteHeight = Math.max(44, noteItem.duration * pixelsPerBeat);
        const distanceToHit = (noteItem.startTime - playheadBeat) * pixelsPerBeat;
        const top = hitLineY - distanceToHit - noteHeight;
        const bottom = top + noteHeight;

        return {
          index,
          top,
          bottom,
          noteHeight,
          noteItem,
          laneEvent
        };
      })
      .filter(({ top, bottom }) => bottom >= -120 && top <= hitLineY + 140)
  ), [sequence, pixelsPerBeat, playheadBeat, hitLineY]);

  const activeGuideEvent = useMemo(() => {
    const intersectingGroups = noteGroups.filter(({ top, bottom }) => top <= hitLineY && bottom >= hitLineY);
    const currentIntersecting = intersectingGroups.find(({ index }) => index === currentNoteIndex);
    if (currentIntersecting) {
      return currentIntersecting.laneEvent;
    }

    if (intersectingGroups.length > 0) {
      return intersectingGroups[0].laneEvent;
    }

    return null;
  }, [noteGroups, hitLineY, currentNoteIndex]);

  return (
    <div className={`relative mac-panel border border-gray-600 overflow-hidden ${className}`}>
      <div className="mac-panel-soft p-4 border-b border-gray-600">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Falling Fingering
            {!isFlowStarted ? (
              <span className="text-blue-300 text-sm font-normal animate-pulse">Play first note to start</span>
            ) : isFlowPaused ? (
              <span className="text-amber-300 text-sm font-normal">Paused: correct fingering to continue</span>
            ) : (
              <span className="text-green-300 text-sm font-normal">Running</span>
            )}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-300">Preset: {timingPreset}</span>
            <span className={`font-medium ${lastTimingDeviationMs === null ? 'text-gray-300' : isCorrectNote ? 'text-green-300' : 'text-red-300'}`}>
              {timingText}
            </span>
            <span className="text-gray-400">{currentNoteIndex + 1} / {sequence.length}</span>
          </div>
        </div>
      </div>

      <div
        ref={laneRef}
        className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(72,187,255,0.12),transparent_34%),linear-gradient(180deg,rgba(9,16,28,0.98),rgba(4,9,18,1))]"
        style={{ minHeight: 680 }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {TIN_WHISTLE_LANE_LABELS.map((label, laneIndex) => {
            const left = laneIndex * (laneWidth + laneGap);
            const isBreathLane = laneIndex === 6;
            return (
              <div key={label}>
                <div
                  className={`absolute top-0 bottom-0 rounded-t-xl border-x ${isBreathLane ? 'border-cyan-300/20 bg-cyan-300/[0.04]' : 'border-white/10 bg-white/[0.025]'}`}
                  style={{ left, width: laneWidth }}
                />
                <div
                  className={`absolute top-4 text-[11px] uppercase tracking-[0.2em] text-center ${isBreathLane ? 'text-cyan-200/70' : 'text-gray-400'}`}
                  style={{ left, width: laneWidth }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute left-0 right-0 h-[3px] bg-white/85 shadow-[0_0_18px_rgba(255,255,255,0.4)]" style={{ top: hitLineY }} />
        <div className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent to-emerald-400/12 pointer-events-none" style={{ top: hitLineY - 20 }} />

        {noteGroups.map(({ index, top, noteHeight, laneEvent }) => {
          const isCurrentNote = index === currentNoteIndex;
          const stateShadow = isCurrentNote
            ? isCorrectNote === false
              ? '0 0 0 2px rgba(248,113,113,0.95), 0 0 20px rgba(248,113,113,0.45)'
              : '0 0 0 2px rgba(250,204,21,0.95), 0 0 22px rgba(59,130,246,0.45)'
            : '0 8px 18px rgba(0,0,0,0.28)';

          const occupiedLeft = Math.min(...laneEvent.occupiedLaneIndices) * (laneWidth + laneGap);
          const occupiedRight =
            Math.max(...laneEvent.occupiedLaneIndices) * (laneWidth + laneGap) + laneWidth;

          return (
            <React.Fragment key={`${index}-${laneEvent.note}-${viewModel.sequence[index]?.startTime}`}>
              {laneEvent.occupiedLaneIndices.map((laneIndex) => {
                const left = laneIndex * (laneWidth + laneGap) + 8;
                const width = Math.max(18, laneWidth - 16);
                const isBreathLane = laneIndex === 6;
                const opacity = isBreathLane ? 0.75 : 0.96;
                const borderRadius = isBreathLane ? 14 : 10;

                return (
                  <div
                    key={`${laneEvent.note}-${laneIndex}-${index}`}
                    className="absolute border border-white/20"
                    style={{
                      left,
                      top,
                      width,
                      height: noteHeight,
                      borderRadius,
                      opacity,
                      background: isBreathLane
                        ? `linear-gradient(180deg, ${laneEvent.color}88, ${laneEvent.color}33)`
                        : `linear-gradient(180deg, ${laneEvent.color}, ${laneEvent.color}99)`,
                      boxShadow: stateShadow
                    }}
                  />
                );
              })}

              <div
                className={`absolute px-2 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${
                  isCurrentNote && isCorrectNote === false
                    ? 'text-red-50 border-red-300/70 bg-red-500/85'
                    : isCurrentNote
                      ? 'text-black border-yellow-300/80 bg-yellow-300'
                      : 'text-white border-white/20 bg-slate-900/75'
                }`}
                style={{
                  left: occupiedLeft + 6,
                  top: Math.max(12, top + 6),
                  width: Math.max(72, occupiedRight - occupiedLeft - 12),
                  textAlign: 'center'
                }}
              >
                {laneEvent.label}
              </div>
            </React.Fragment>
          );
        })}

        <div className="absolute left-4 top-4 text-xs text-gray-200 bg-gray-950/75 px-3 py-2 rounded border border-gray-700">
          Playhead: {playheadBeat.toFixed(2)} beats · Target beat: {currentExpectedBeat.toFixed(2)}
        </div>

        <div className="absolute inset-x-0 pointer-events-none" style={{ top: whistleGuideTop, height: guideHeight - 12 }}>
          <div
            className="absolute rounded-full border border-amber-300/35 bg-gradient-to-b from-amber-500/20 to-amber-900/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            style={{
              left: whistleBodyLeft,
              width: whistleBodyWidth,
              height: 42,
              top: 24
            }}
          />
          <div
            className="absolute rounded-l-full border border-amber-200/40 bg-gradient-to-r from-amber-100/25 to-amber-500/15"
            style={{
              left: Math.max(0, whistleBodyLeft - 54),
              width: 58,
              height: 28,
              top: 31
            }}
          />
          <div
            className="absolute rounded-r-full border border-amber-300/35 bg-gradient-to-l from-amber-100/15 to-amber-700/20"
            style={{
              left: whistleBodyRight - 4,
              width: 32,
              height: 34,
              top: 28
            }}
          />

          <div
            className="absolute text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/80"
            style={{ left: Math.max(0, whistleBodyLeft - 64), top: 0 }}
          >
            Mouthpiece
          </div>
          <div
            className="absolute text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/65"
            style={{ left: whistleBodyRight - 4, top: 0 }}
          >
            Bell
          </div>

          {holeLaneCenters.map((centerX, index) => (
            <div key={index}>
              <div
                className="absolute -translate-x-1/2 rounded-full border-2 shadow-[inset_0_1px_3px_rgba(255,255,255,0.15)]"
                style={{
                  left: centerX,
                  top: 33,
                  width: 15,
                  height: 15,
                  borderColor: activeGuideEvent?.coveredHoles[index] ? `${activeGuideEvent.color}` : 'rgba(15, 23, 42, 0.8)',
                  background: activeGuideEvent?.coveredHoles[index]
                    ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6), ${activeGuideEvent.color})`
                    : 'rgb(15 23 42)',
                  boxShadow: activeGuideEvent?.coveredHoles[index]
                    ? `0 0 0 2px ${activeGuideEvent.color}33, 0 0 18px ${activeGuideEvent.color}99`
                    : 'inset 0 1px 3px rgba(255,255,255,0.15)'
                }}
              />
              <div
                className="absolute -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ left: centerX, top: 62 }}
              >
                <span className={activeGuideEvent?.coveredHoles[index] ? 'text-white' : 'text-amber-100/80'}>
                  H{index + 1}
                </span>
              </div>
            </div>
          ))}

          <div
            className="absolute rounded-xl border"
            style={{
              left: breathLaneLeft + 10,
              width: Math.max(24, laneWidth - 20),
              top: 18,
              height: 56,
              borderColor: activeGuideEvent ? `${activeGuideEvent.color}88` : 'rgba(103, 232, 249, 0.25)',
              background: activeGuideEvent
                ? `linear-gradient(180deg, ${activeGuideEvent.color}55, ${activeGuideEvent.color}18)`
                : 'rgba(34, 211, 238, 0.06)',
              boxShadow: activeGuideEvent
                ? `0 0 0 1px ${activeGuideEvent.color}44, 0 0 22px ${activeGuideEvent.color}55`
                : 'none'
            }}
          />
          <div
            className="absolute text-[11px] font-semibold uppercase tracking-[0.16em] text-center"
            style={{
              left: breathLaneLeft,
              width: laneWidth,
              top: 79
            }}
          >
            <span className={activeGuideEvent ? 'text-white' : 'text-cyan-100/80'}>
              Air / Breath
            </span>
          </div>
        </div>
      </div>

      <div className="mac-panel-soft p-3 border-t border-gray-600 text-center text-xs text-gray-400">
        Covered holes and breath fall toward the hit line. Sustain length controls bar height. Wrong fingering freezes the scene.
      </div>
    </div>
  );
};
