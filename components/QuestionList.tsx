'use client';

import type { MappedEntry } from '@/lib/types';

interface QuestionListProps {
  entries: MappedEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_STYLES: Record<MappedEntry['matchType'], string> = {
  exact: 'bg-success/10 text-success',
  fuzzy: 'bg-highlight/30 text-ink',
  unanswered: 'bg-danger/10 text-danger',
  unmatched: 'bg-ink-faint/20 text-ink-soft',
};

const STATUS_LABEL: Record<MappedEntry['matchType'], string> = {
  exact: 'Answered',
  fuzzy: 'Likely match',
  unanswered: 'Unanswered',
  unmatched: 'No matching question',
};

export default function QuestionList({ entries, selectedId, onSelect }: QuestionListProps) {
  return (
    <div className="thin-scrollbar h-full overflow-y-auto">
      <ul className="divide-y divide-surface-border">
        {entries.map((entry) => {
          const isSelected = entry.id === selectedId;
          const label = entry.question
            ? `Q${entry.question.number}`
            : `Unmatched answer`;
          const bodyText = entry.question?.text ?? entry.answer?.text ?? '';

          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelect(entry.id)}
                className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                  isSelected ? 'bg-primary-light/50' : 'hover:bg-surface-muted'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{label}</span>
                  <div className="flex items-center gap-2">
                    {entry.grade && (
                      <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary-dark">
                        {entry.grade.score}/{entry.grade.maxScore}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[entry.matchType]}`}
                    >
                      {STATUS_LABEL[entry.matchType]}
                    </span>
                  </div>
                </div>
                <p className="line-clamp-2 text-xs text-ink-soft">{bodyText}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
