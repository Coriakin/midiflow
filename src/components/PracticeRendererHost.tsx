import React from 'react';
import { TinWhistleFallingPractice } from './TinWhistleFallingPractice';
import { TinWhistleSequentialPractice } from './TinWhistleSequentialPractice';
import type { PracticeLoopRange, PracticeRendererMode, PracticeViewModel } from '../types/practice';

interface PracticeRendererHostProps {
  mode: PracticeRendererMode;
  viewModel: PracticeViewModel;
  loopModeActive?: boolean;
  loopRange?: PracticeLoopRange | null;
  loopNotesPreview?: string[];
  onApplyLoopRange?: (startIndex: number, endIndex: number) => void;
  onClearLoopRange?: () => void;
  className?: string;
}

export const PracticeRendererHost: React.FC<PracticeRendererHostProps> = ({
  mode,
  viewModel,
  loopModeActive = false,
  loopRange = null,
  loopNotesPreview = [],
  onApplyLoopRange,
  onClearLoopRange,
  className = ''
}) => {
  if (mode === 'fingering-fall') {
    return <TinWhistleFallingPractice viewModel={viewModel} className={className} />;
  }

  return (
    <TinWhistleSequentialPractice
      viewModel={viewModel}
      loopModeActive={loopModeActive}
      loopRange={loopRange}
      loopNotesPreview={loopNotesPreview}
      onApplyLoopRange={onApplyLoopRange}
      onClearLoopRange={onClearLoopRange}
      className={className}
    />
  );
};
