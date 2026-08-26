'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

interface UploadScreenProps {
  onSubmit: (questionFile: File, answerFile: File) => void;
  errorMessage: string | null;
}

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
      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center transition hover:border-blue-500 hover:bg-blue-50/40"
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
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600">
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
          <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
          <p className="text-xs text-slate-400">Tap to replace</p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="text-xs text-slate-400">PDF or image</p>
        </div>
      )}
    </button>
  );
}

export function UploadScreen({ onSubmit, errorMessage }: UploadScreenProps) {
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const canContinue = Boolean(questionFile && answerFile);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      {/* Top Header with Logo */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="VedaAI Logo"
            width={120}
            height={36}
            className="object-contain"
            priority
          />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col items-center text-center">
          
          {/* Front Banner Illustration */}
          <div className="relative w-full h-36 mb-4">
            <Image
              src="/images/frontimages.png"
              alt="Upload Banner"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">Upload</p>
            <h1 className="text-lg font-semibold text-slate-800">
              Question Paper &amp; Answer Sheets
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Upload both to get started
            </p>
          </div>

          <div className="flex w-full gap-3">
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
            <p className="mt-4 w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            disabled={!canContinue}
            onClick={() => questionFile && answerFile && onSubmit(questionFile, answerFile)}
            className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Continue &rarr;
          </button>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            Your files are processed in-memory for this session only.
          </p>
        </div>
      </div>
    </div>
  );
}

export default UploadScreen;