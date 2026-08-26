'use client';

import { useState } from 'react';
import { fileToPageImages } from '@/lib/pdfToImages';
import { mapAnswersToQuestions } from '@/lib/matching';
import type {
  ExtractedAnswer,
  ExtractedQuestion,
  GradeSummaryTotals,
  MappedEntry,
} from '@/lib/types';
import UploadScreen from '@/components/UploadScreen';
import LoadingScreen from '@/components/LoadingScreen';
import MappingScreen from '@/components/MappingScreen';

type AppState = 'upload' | 'loading' | 'mapping';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [loadingMessage, setLoadingMessage] = useState('Extracting…');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [answerPageImages, setAnswerPageImages] = useState<string[]>([]);
  const [entries, setEntries] = useState<MappedEntry[]>([]);

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Request to ${url} failed (${res.status})`);
    }
    return data as T;
  }

  async function handleSubmit(questionFile: File, answerFile: File) {
    setErrorMessage(null);
    setAppState('loading');
    try {
      setLoadingMessage('Reading question paper…');
      const questionImages = await fileToPageImages(questionFile);

      setLoadingMessage('Reading answer sheet…');
      const answerImages = await fileToPageImages(answerFile);
      setAnswerPageImages(answerImages);

      setLoadingMessage('Extracting questions…');
      const { questions } = await postJson<{ questions: ExtractedQuestion[] }>(
        '/api/extract-questions',
        { images: questionImages }
      );

      setLoadingMessage('Extracting handwritten answers…');
      const { answers } = await postJson<{ answers: ExtractedAnswer[] }>(
        '/api/extract-answers',
        { images: answerImages }
      );

      setLoadingMessage('Mapping answers to questions…');
      const mapped = mapAnswersToQuestions(questions, answers);

      setEntries(mapped);
      setAppState('mapping');
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
      setAppState('upload');
    }
  }

  async function handleGradeAll(): Promise<GradeSummaryTotals> {
    const gradable = entries.filter((e) => e.question && e.answer);
    const items = gradable.map((e) => ({
      id: e.id,
      questionText: e.question!.text,
      answerText: e.answer!.text,
    }));

    const { grades } = await postJson<{
      grades: { id: string; score: number; maxScore: number; isCorrect: boolean | null; feedback: string }[];
    }>('/api/grade', { items });

    const gradeById = new Map(grades.map((g) => [g.id, g]));
    const updatedEntries = entries.map((e) => {
      const g = gradeById.get(e.id);
      return g
        ? {
            ...e,
            grade: {
              score: g.score,
              maxScore: g.maxScore,
              isCorrect: g.isCorrect,
              feedback: g.feedback,
            },
          }
        : e;
    });
    setEntries(updatedEntries);

    const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
    const maxScore = grades.reduce((sum, g) => sum + g.maxScore, 0);
    const unansweredCount = entries.filter((e) => e.matchType === 'unanswered').length;

    return {
      totalScore,
      maxScore,
      answeredCount: gradable.length,
      unansweredCount,
      overallFeedback:
        maxScore > 0
          ? `Scored ${totalScore}/${maxScore} across ${gradable.length} answered question(s). ${unansweredCount} question(s) were left unanswered.`
          : 'No answered questions were available to grade.',
    };
  }

  function handleReset() {
    setAppState('upload');
    setEntries([]);
    setAnswerPageImages([]);
    setErrorMessage(null);
  }

  if (appState === 'upload') {
    return <UploadScreen onSubmit={handleSubmit} errorMessage={errorMessage} />;
  }

  if (appState === 'loading') {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <MappingScreen
      entries={entries}
      answerPageImages={answerPageImages}
      onGradeAll={handleGradeAll}
      onReset={handleReset}
    />
  );
}
