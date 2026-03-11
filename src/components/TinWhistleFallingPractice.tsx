import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TIN_WHISTLE_LANE_LABELS, getTinWhistleLaneEvent } from '../lib/tinWhistle';
import type { PracticeFingeringDirection, PracticeViewModel } from '../types/practice';

interface TinWhistleFallingPracticeProps {
  viewModel: PracticeViewModel;
  direction?: PracticeFingeringDirection;
  className?: string;
}

type PositionedNoteGroup = {
  index: number;
  laneEvent: ReturnType<typeof getTinWhistleLaneEvent>;
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
};

export const TinWhistleFallingPractice: React.FC<TinWhistleFallingPracticeProps> = ({
  viewModel,
  direction = 'top-to-bottom',
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
  const sceneRef = useRef<HTMLDivElement>(null);
  const [sceneSize, setSceneSize] = useState({ width: 960, height: 680 });
  const [playheadBeat, setPlayheadBeat] = useState(0);

  useEffect(() => {
    const element = sceneRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setSceneSize({
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
  const isRightToLeft = direction === 'right-to-left';
  const laneCount = TIN_WHISTLE_LANE_LABELS.length;
  const laneGap = 10;
  const guideExtent = isRightToLeft ? 150 : 114;
  const minSceneWidth = isRightToLeft ? 920 : 960;
  const minSceneHeight = isRightToLeft ? 620 : 680;

  const sceneWidth = Math.max(minSceneWidth, sceneSize.width);
  const sceneHeight = Math.max(minSceneHeight, sceneSize.height);
  const hitLineX = isRightToLeft ? guideExtent + 26 : 0;
  const hitLineY = isRightToLeft ? 0 : Math.max(280, sceneHeight - guideExtent - 26);
  const laneLengthPrimary = isRightToLeft ? Math.max(320, sceneWidth - hitLineX - 32) : Math.max(280, hitLineY - 28);
  const laneThickness = isRightToLeft
    ? (sceneHeight - laneGap * (laneCount - 1)) / laneCount
    : (sceneWidth - laneGap * (laneCount - 1)) / laneCount;

  const laneCenters = Array.from({ length: laneCount }, (_, laneIndex) => laneIndex * (laneThickness + laneGap) + laneThickness / 2);
  const holeLaneCenters = laneCenters.slice(0, 6);
  const breathLaneStart = 6 * (laneThickness + laneGap);

  const pixelsPerBeat = useMemo(() => {
    if (sequence.length === 0) {
      return 150;
    }

    const lookAheadIndex = Math.min(sequence.length - 1, currentNoteIndex + Math.max(2, notesAheadTarget));
    const currentStartBeat = sequence[currentNoteIndex]?.startTime ?? 0;
    const lookAheadBeat = sequence[lookAheadIndex]?.startTime ?? currentStartBeat + 2;
    const lookAheadDuration = sequence[lookAheadIndex]?.duration ?? 1;
    const beatSpan = Math.max(1, lookAheadBeat - currentStartBeat + lookAheadDuration);
    return Math.min(220, Math.max(48, laneLengthPrimary / beatSpan));
  }, [sequence, currentNoteIndex, notesAheadTarget, laneLengthPrimary]);

  const timingText = lastTimingDeviationMs === null
    ? `Window ±${timingWindowMs}ms`
    : `${lastTimingDeviationMs < 0 ? 'Early' : 'Late'} ${Math.abs(lastTimingDeviationMs).toFixed(0)}ms`;

  const noteGroups = useMemo((): PositionedNoteGroup[] => (
    sequence
      .map((noteItem, index) => {
        const laneEvent = getTinWhistleLaneEvent(noteItem.note);

        if (isRightToLeft) {
          const noteWidth = Math.max(44, noteItem.duration * pixelsPerBeat);
          const distanceToHit = (noteItem.startTime - playheadBeat) * pixelsPerBeat;
          const left = hitLineX + distanceToHit;
          const top = 0;

          return {
            index,
            laneEvent,
            top,
            left,
            width: noteWidth,
            height: laneThickness - 16,
            right: left + noteWidth,
            bottom: top + laneThickness - 16
          };
        }

        const noteHeight = Math.max(44, noteItem.duration * pixelsPerBeat);
        const distanceToHit = (noteItem.startTime - playheadBeat) * pixelsPerBeat;
        const top = hitLineY - distanceToHit - noteHeight;
        const left = 0;

        return {
          index,
          laneEvent,
          top,
          left,
          width: laneThickness - 16,
          height: noteHeight,
          right: left + laneThickness - 16,
          bottom: top + noteHeight
        };
      })
      .filter((group) => {
        if (isRightToLeft) {
          return group.right >= hitLineX - 120 && group.left <= sceneWidth + 140;
        }
        return group.bottom >= -120 && group.top <= hitLineY + 140;
      })
  ), [sequence, isRightToLeft, pixelsPerBeat, playheadBeat, hitLineX, hitLineY, laneThickness, sceneWidth]);

  const activeGuideEvent = useMemo(() => {
    const intersectingGroups = noteGroups.filter((group) => (
      isRightToLeft
        ? group.left <= hitLineX && group.right >= hitLineX
        : group.top <= hitLineY && group.bottom >= hitLineY
    ));
    const currentIntersecting = intersectingGroups.find((group) => group.index === currentNoteIndex);
    return currentIntersecting?.laneEvent ?? intersectingGroups[0]?.laneEvent ?? null;
  }, [noteGroups, currentNoteIndex, isRightToLeft, hitLineX, hitLineY]);

  const sceneTitle = isRightToLeft ? 'Sideways Fingering' : 'Falling Fingering';
  const sceneHint = isRightToLeft
    ? 'Covered holes and breath slide into the whistle from the right. Sustain length controls bar length.'
    : 'Covered holes and breath fall toward the hit line. Sustain length controls bar height.';

  return (
    <div className={`relative mac-panel border border-gray-600 overflow-hidden ${className}`}>
      <div className="mac-panel-soft p-4 border-b border-gray-600">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {sceneTitle}
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
        ref={sceneRef}
        className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(72,187,255,0.12),transparent_34%),linear-gradient(180deg,rgba(9,16,28,0.98),rgba(4,9,18,1))]"
        style={{ minHeight: minSceneHeight }}
      >
        <div className="absolute inset-0 pointer-events-none">
          {TIN_WHISTLE_LANE_LABELS.map((label, laneIndex) => {
            const offset = laneIndex * (laneThickness + laneGap);
            const isBreathLane = laneIndex === 6;

            if (isRightToLeft) {
              return (
                <div key={label}>
                  <div
                    className={`absolute left-0 right-0 rounded-r-xl border-y ${isBreathLane ? 'border-cyan-300/20 bg-cyan-300/[0.04]' : 'border-white/10 bg-white/[0.025]'}`}
                    style={{ top: offset, height: laneThickness }}
                  />
                  <div
                    className={`absolute right-4 text-[11px] uppercase tracking-[0.2em] ${isBreathLane ? 'text-cyan-200/70' : 'text-gray-400'}`}
                    style={{ top: offset + 8 }}
                  >
                    {label}
                  </div>
                </div>
              );
            }

            return (
              <div key={label}>
                <div
                  className={`absolute top-0 bottom-0 rounded-t-xl border-x ${isBreathLane ? 'border-cyan-300/20 bg-cyan-300/[0.04]' : 'border-white/10 bg-white/[0.025]'}`}
                  style={{ left: offset, width: laneThickness }}
                />
                <div
                  className={`absolute top-4 text-[11px] uppercase tracking-[0.2em] text-center ${isBreathLane ? 'text-cyan-200/70' : 'text-gray-400'}`}
                  style={{ left: offset, width: laneThickness }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {isRightToLeft ? (
          <>
            <div className="absolute top-0 bottom-0 w-[3px] bg-white/85 shadow-[0_0_18px_rgba(255,255,255,0.4)]" style={{ left: hitLineX }} />
            <div className="absolute top-0 bottom-0 w-20 bg-gradient-to-r from-emerald-400/12 to-transparent pointer-events-none" style={{ left: hitLineX - 20 }} />
          </>
        ) : (
          <>
            <div className="absolute left-0 right-0 h-[3px] bg-white/85 shadow-[0_0_18px_rgba(255,255,255,0.4)]" style={{ top: hitLineY }} />
            <div className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent to-emerald-400/12 pointer-events-none" style={{ top: hitLineY - 20 }} />
          </>
        )}

        {noteGroups.map((group) => {
          const isCurrentNote = group.index === currentNoteIndex;
          const stateShadow = isCurrentNote
            ? isCorrectNote === false
              ? '0 0 0 2px rgba(248,113,113,0.95), 0 0 20px rgba(248,113,113,0.45)'
              : '0 0 0 2px rgba(250,204,21,0.95), 0 0 22px rgba(59,130,246,0.45)'
            : '0 8px 18px rgba(0,0,0,0.28)';

          const occupiedOffsets = group.laneEvent.occupiedLaneIndices.map((laneIndex) => laneIndex * (laneThickness + laneGap));
          const occupiedStart = Math.min(...occupiedOffsets);
          const occupiedEnd = Math.max(...occupiedOffsets) + laneThickness;

          return (
            <React.Fragment key={`${group.index}-${group.laneEvent.note}-${sequence[group.index]?.startTime}`}>
              {group.laneEvent.occupiedLaneIndices.map((laneIndex) => {
                const laneOffset = laneIndex * (laneThickness + laneGap);
                const isBreathLane = laneIndex === 6;

                if (isRightToLeft) {
                  return (
                    <div
                      key={`${group.laneEvent.note}-${laneIndex}-${group.index}`}
                      className="absolute border border-white/20"
                      style={{
                        left: group.left,
                        top: laneOffset + 8,
                        width: group.width,
                        height: Math.max(18, laneThickness - 16),
                        borderRadius: isBreathLane ? 14 : 10,
                        opacity: isBreathLane ? 0.75 : 0.96,
                        background: isBreathLane
                          ? `linear-gradient(90deg, ${group.laneEvent.color}88, ${group.laneEvent.color}33)`
                          : `linear-gradient(90deg, ${group.laneEvent.color}, ${group.laneEvent.color}99)`,
                        boxShadow: stateShadow
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={`${group.laneEvent.note}-${laneIndex}-${group.index}`}
                    className="absolute border border-white/20"
                    style={{
                      left: laneOffset + 8,
                      top: group.top,
                      width: Math.max(18, laneThickness - 16),
                      height: group.height,
                      borderRadius: isBreathLane ? 14 : 10,
                      opacity: isBreathLane ? 0.75 : 0.96,
                      background: isBreathLane
                        ? `linear-gradient(180deg, ${group.laneEvent.color}88, ${group.laneEvent.color}33)`
                        : `linear-gradient(180deg, ${group.laneEvent.color}, ${group.laneEvent.color}99)`,
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
                style={isRightToLeft
                  ? {
                      left: Math.max(hitLineX + 6, group.left + 6),
                      top: occupiedStart + 8,
                      width: Math.max(76, group.width - 12),
                      textAlign: 'center'
                    }
                  : {
                      left: occupiedStart + 6,
                      top: Math.max(12, group.top + 6),
                      width: Math.max(72, occupiedEnd - occupiedStart - 12),
                      textAlign: 'center'
                    }}
              >
                {group.laneEvent.label}
              </div>
            </React.Fragment>
          );
        })}

        <div className="absolute left-4 top-4 text-xs text-gray-200 bg-gray-950/75 px-3 py-2 rounded border border-gray-700">
          Playhead: {playheadBeat.toFixed(2)} beats · Target beat: {currentExpectedBeat.toFixed(2)}
        </div>

        {isRightToLeft ? (
          <div className="absolute inset-y-0 left-0 pointer-events-none" style={{ width: guideExtent }}>
            <div
              className="absolute rounded-full border border-amber-300/35 bg-gradient-to-r from-amber-500/20 to-amber-900/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              style={{ left: 56, top: holeLaneCenters[0] - 22, width: 42, height: holeLaneCenters[5] - holeLaneCenters[0] + 44 }}
            />
            <div
              className="absolute rounded-t-full border border-amber-200/40 bg-gradient-to-b from-amber-100/25 to-amber-500/15"
              style={{ left: 63, top: Math.max(10, holeLaneCenters[0] - 56), width: 28, height: 58 }}
            />
            <div
              className="absolute rounded-b-full border border-amber-300/35 bg-gradient-to-t from-amber-100/15 to-amber-700/20"
              style={{ left: 60, top: holeLaneCenters[5] + 22, width: 34, height: 32 }}
            />
            <div className="absolute text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/80" style={{ left: 34, top: 10 }}>
              Mouthpiece
            </div>
            <div className="absolute text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/65" style={{ left: 58, top: holeLaneCenters[5] + 60 }}>
              Bell
            </div>

            {holeLaneCenters.map((centerY, index) => (
              <div key={index}>
                <div
                  className="absolute -translate-y-1/2 rounded-full border-2 shadow-[inset_0_1px_3px_rgba(255,255,255,0.15)]"
                  style={{
                    left: 69,
                    top: centerY,
                    width: 15,
                    height: 15,
                    borderColor: activeGuideEvent?.coveredHoles[index] ? activeGuideEvent.color : 'rgba(15, 23, 42, 0.8)',
                    background: activeGuideEvent?.coveredHoles[index]
                      ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6), ${activeGuideEvent.color})`
                      : 'rgb(15 23 42)',
                    boxShadow: activeGuideEvent?.coveredHoles[index]
                      ? `0 0 0 2px ${activeGuideEvent.color}33, 0 0 18px ${activeGuideEvent.color}99`
                      : 'inset 0 1px 3px rgba(255,255,255,0.15)'
                  }}
                />
                <div
                  className="absolute -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ left: 101, top: centerY }}
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
                left: 22,
                top: breathLaneStart + 8,
                width: 28,
                height: Math.max(24, laneThickness - 16),
                borderColor: activeGuideEvent ? `${activeGuideEvent.color}88` : 'rgba(103, 232, 249, 0.25)',
                background: activeGuideEvent
                  ? `linear-gradient(180deg, ${activeGuideEvent.color}55, ${activeGuideEvent.color}18)`
                  : 'rgba(34, 211, 238, 0.06)',
                boxShadow: activeGuideEvent
                  ? `0 0 0 1px ${activeGuideEvent.color}44, 0 0 22px ${activeGuideEvent.color}55`
                  : 'none'
              }}
            />
            <div className="absolute text-[11px] font-semibold uppercase tracking-[0.16em] text-center" style={{ left: 8, top: breathLaneStart + laneThickness + 12, width: 58 }}>
              <span className={activeGuideEvent ? 'text-white' : 'text-cyan-100/80'}>
                Air
              </span>
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 pointer-events-none" style={{ top: hitLineY + 24, height: guideExtent - 12 }}>
            <div
              className="absolute rounded-full border border-amber-300/35 bg-gradient-to-b from-amber-500/20 to-amber-900/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              style={{
                left: Math.max(16, holeLaneCenters[0] - laneThickness * 0.52),
                width: holeLaneCenters[5] - holeLaneCenters[0] + laneThickness * 1.04,
                height: 42,
                top: 24
              }}
            />
            <div
              className="absolute rounded-l-full border border-amber-200/40 bg-gradient-to-r from-amber-100/25 to-amber-500/15"
              style={{
                left: Math.max(0, holeLaneCenters[0] - laneThickness * 0.52 - 54),
                width: 58,
                height: 28,
                top: 31
              }}
            />
            <div
              className="absolute rounded-r-full border border-amber-300/35 bg-gradient-to-l from-amber-100/15 to-amber-700/20"
              style={{
                left: holeLaneCenters[5] + laneThickness * 0.52 - 4,
                width: 32,
                height: 34,
                top: 28
              }}
            />

            <div className="absolute text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/80" style={{ left: Math.max(0, holeLaneCenters[0] - laneThickness * 0.52 - 64), top: 0 }}>
              Mouthpiece
            </div>
            <div className="absolute text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-100/65" style={{ left: holeLaneCenters[5] + laneThickness * 0.52 - 4, top: 0 }}>
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
                    borderColor: activeGuideEvent?.coveredHoles[index] ? activeGuideEvent.color : 'rgba(15, 23, 42, 0.8)',
                    background: activeGuideEvent?.coveredHoles[index]
                      ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.6), ${activeGuideEvent.color})`
                      : 'rgb(15 23 42)',
                    boxShadow: activeGuideEvent?.coveredHoles[index]
                      ? `0 0 0 2px ${activeGuideEvent.color}33, 0 0 18px ${activeGuideEvent.color}99`
                      : 'inset 0 1px 3px rgba(255,255,255,0.15)'
                  }}
                />
                <div className="absolute -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ left: centerX, top: 62 }}>
                  <span className={activeGuideEvent?.coveredHoles[index] ? 'text-white' : 'text-amber-100/80'}>
                    H{index + 1}
                  </span>
                </div>
              </div>
            ))}

            <div
              className="absolute rounded-xl border"
              style={{
                left: breathLaneStart + 10,
                width: Math.max(24, laneThickness - 20),
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
            <div className="absolute text-[11px] font-semibold uppercase tracking-[0.16em] text-center" style={{ left: breathLaneStart, width: laneThickness, top: 79 }}>
              <span className={activeGuideEvent ? 'text-white' : 'text-cyan-100/80'}>
                Air / Breath
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mac-panel-soft p-3 border-t border-gray-600 text-center text-xs text-gray-400">
        {sceneHint} Wrong fingering freezes the scene.
      </div>
    </div>
  );
};
