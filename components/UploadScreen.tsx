'use client';

import { useRef, useState } from 'react';

interface UploadScreenProps {
  onSubmit: (questionFile: File, answerFile: File) => void;
  errorMessage: string | null;
}

/** A single "Upload Question Paper" / "Upload Answer Sheet" drop target. */
function UploadSlot({
  label,
  file,
  onPick,
}: {
  label: string;
  file: File | null;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-surface-border bg-surface px-4 py-8 text-center transition hover:border-primary hover:bg-primary-light/40"
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary">
        {/* simple upload glyph, no external icon dependency */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 16V4M12 4L7 9M12 4l5 5M5 20h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {file ? (
        <div className="max-w-[180px]">
          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
          <p className="text-xs text-ink-faint">Tap to replace</p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-ink">{label}</p>
          <p className="text-xs text-ink-faint">PDF or image</p>
        </div>
      )}
    </button>
  );
}

export default function UploadScreen({ onSubmit, errorMessage }: UploadScreenProps) {
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);

  const canContinue = Boolean(questionFile && answerFile);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md rounded-2xl border border-primary bg-surface p-8 shadow-card">
        <div className="mb-6 text-center">
          <p className="text-sm font-medium text-ink-soft">Upload</p>
          <h1 className="text-lg font-semibold text-primary">
            Question Paper &amp; Answer Sheets
          </h1>
          <p className="mt-1 text-xs text-ink-faint">
            Upload both to get started
          </p>
        </div>

        <div className="flex gap-3">
          <UploadSlot
            label="Upload Question Paper"
            file={questionFile}
            onPick={setQuestionFile}
          />
          <UploadSlot
            label="Upload Answer Sheet"
            file={answerFile}
            onPick={setAnswerFile}
          />
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => questionFile && answerFile && onSubmit(questionFile, answerFile)}
          className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-ink-faint"
        >
          Continue &rarr;
        </button>

        <p className="mt-3 text-center text-[11px] text-ink-faint">
          Your files are processed in-memory for this session only.
        </p>
      </div>
    </div>
  );
}
