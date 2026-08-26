'use client';

import { useMemo, useState } from 'react';
import type { MappedEntry } from '@/lib/types';

interface AnswerSheetViewerProps {
  pageImages: string[]; // all answer sheet pages, in order
  entry: MappedEntry | null;
}

export default function AnswerSheetViewer({ pageImages, entry }: AnswerSheetViewerProps) {
  const boxes = entry?.answer?.boxes ?? [];
  const pagesWithBoxes = useMemo(
    () => Array.from(new Set(boxes.map((b) => b.page))).sort((a, b) => a - b),
    [boxes]
  );

  // Default to the first page that has a highlight for this entry, else page 0.
  const [activePage, setActivePage] = useState(pagesWithBoxes[0] ?? 0);
  const currentPage = pagesWithBoxes.includes(activePage) ? activePage : pagesWithBoxes[0] ?? 0;

  if (pageImages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-faint">
        No answer sheet pages to display.
      </div>
    );
  }

  const pageImage = pageImages[currentPage] ?? pageImages[0];
  const boxesOnPage = boxes.filter((b) => b.page === currentPage);

  return (
    <div className="flex h-full flex-col">
      {pagesWithBoxes.length > 1 && (
        <div className="flex gap-2 border-b border-surface-border px-4 py-2">
          {pagesWithBoxes.map((p) => (
            <button
              key={p}
              onClick={() => setActivePage(p)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                p === currentPage
                  ? 'bg-primary text-white'
                  : 'bg-surface-muted text-ink-soft hover:bg-primary-light'
              }`}
            >
              Page {p + 1}
            </button>
          ))}
        </div>
      )}

      <div className="thin-scrollbar flex-1 overflow-auto bg-surface-muted p-4">
        <div className="relative mx-auto w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pageImage}
            alt={`Answer sheet page ${currentPage + 1}`}
            className="max-w-full rounded-lg border border-surface-border shadow-card"
          />
          {boxesOnPage.map((box, i) => (
            <div
              key={i}
              className="absolute rounded-sm border-2 border-highlight bg-highlight/25 transition-all"
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.width * 100}%`,
                height: `${box.height * 100}%`,
              }}
            />
          ))}
        </div>
      </div>

      {entry?.matchType === 'unanswered' && (
        <div className="border-t border-surface-border bg-danger/5 px-4 py-2 text-center text-xs text-danger">
          This question was left unanswered on the sheet.
        </div>
      )}
    </div>
  );
}
