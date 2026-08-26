'use client';

import { useState } from 'react';
import type { GradeSummaryTotals, MappedEntry } from '@/lib/types';
import QuestionList from './QuestionList';
import AnswerSheetViewer from './AnswerSheetViewer';
import GradeSummary from './GradeSummary';

interface MappingScreenProps {
  entries: MappedEntry[];
  answerPageImages: string[];
  onGradeAll: () => Promise<GradeSummaryTotals>;
  onReset: () => void;
}

export default function MappingScreen({
  entries,
  answerPageImages,
  onGradeAll,
  onReset,
}: MappingScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id ?? null);
  const [showSummary, setShowSummary] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [totals, setTotals] = useState<GradeSummaryTotals | null>(null);

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  async function handleGradeAll() {
    setShowSummary(true);
    setIsGrading(true);
    try {
      const result = await onGradeAll();
      setTotals(result);
    } finally {
      setIsGrading(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-surface-border bg-surface px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            Question &harr; Answer Mapping
          </p>
          <p className="text-xs text-ink-faint">
            {entries.length} question(s) extracted
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface-muted"
          >
            Start over
          </button>
          <button
            onClick={handleGradeAll}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
          >
            Grade all answers
          </button>
        </div>
      </header>

      {/* Body: question list | answer sheet viewer */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-full max-w-sm border-r border-surface-border bg-surface">
          <QuestionList entries={entries} selectedId={selectedId} onSelect={setSelectedId} />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedEntry?.question && (
            <div className="border-b border-surface-border bg-surface px-5 py-3">
              <p className="text-sm font-semibold text-ink">
                Q{selectedEntry.question.number}
              </p>
              <p className="mt-0.5 text-sm text-ink-soft">{selectedEntry.question.text}</p>
              {selectedEntry.grade && (
                <p className="mt-2 rounded-lg bg-primary-light/50 px-3 py-2 text-xs text-primary-dark">
                  <span className="font-semibold">
                    {selectedEntry.grade.score}/{selectedEntry.grade.maxScore}
                  </span>{' '}
                  — {selectedEntry.grade.feedback}
                </p>
              )}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <AnswerSheetViewer pageImages={answerPageImages} entry={selectedEntry} />
          </div>
        </div>
      </div>

      {showSummary && (
        <GradeSummary
          totals={totals}
          isGrading={isGrading}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
