'use client';

import type { GradeSummaryTotals } from '@/lib/types';

interface GradeSummaryProps {
  totals: GradeSummaryTotals | null;
  isGrading: boolean;
  onClose: () => void;
}

export default function GradeSummary({ totals, isGrading, onClose }: GradeSummaryProps) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Grading Summary</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        {isGrading && (
          <p className="text-sm text-ink-soft">Grading answers, please wait…</p>
        )}

        {!isGrading && totals && (
          <div className="space-y-3">
            <div className="rounded-xl bg-primary-light/50 p-4 text-center">
              <p className="text-3xl font-bold text-primary-dark">
                {totals.totalScore}/{totals.maxScore}
              </p>
              <p className="mt-1 text-xs text-ink-soft">Overall score</p>
            </div>
            <div className="flex justify-between text-sm text-ink-soft">
              <span>Answered</span>
              <span className="font-medium text-ink">{totals.answeredCount}</span>
            </div>
            <div className="flex justify-between text-sm text-ink-soft">
              <span>Unanswered</span>
              <span className="font-medium text-danger">{totals.unansweredCount}</span>
            </div>
            <div className="border-t border-surface-border pt-3 text-sm text-ink-soft">
              {totals.overallFeedback}
            </div>
          </div>
        )}

        {!isGrading && !totals && (
          <p className="text-sm text-ink-soft">No grading data available yet.</p>
        )}
      </div>
    </div>
  );
}
