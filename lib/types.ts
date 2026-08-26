/**
 * Shared domain types for the Question <-> Answer extraction/mapping pipeline.
 * Used by both the client components and the API routes.
 */

/** A bounding box on a single page image, normalized to a 0-1 range. */
export interface BoundingBox {
  /** 0-based index into the answer sheet page images array. */
  page: number;
  x: number; // left, 0-1
  y: number; // top, 0-1
  width: number; // 0-1
  height: number; // 0-1
}

/** A single question as printed on the question paper. */
export interface ExtractedQuestion {
  id: string;
  /** Printed numbering, exactly as it appears, e.g. "11(a)", "3", "Q5". */
  number: string;
  text: string;
}

/**
 * A raw handwritten answer segment as returned directly by the vision model,
 * before we group/merge multi-page segments belonging to the same question.
 */
export interface RawAnswerSegment {
  questionNumberGuess: string | null;
  text: string;
  page: number;
  /** [ymin, xmin, ymax, xmax] normalized 0-1000, Gemini's bounding box convention. */
  box: [number, number, number, number];
}

/** A merged answer (one or more segments/pages) belonging to one question guess. */
export interface ExtractedAnswer {
  id: string;
  questionNumberGuess: string | null;
  text: string;
  boxes: BoundingBox[];
}

export type MatchType = 'exact' | 'fuzzy' | 'unanswered' | 'unmatched';

/** A single row in the final Question <-> Answer mapping table shown in the UI. */
export interface MappedEntry {
  id: string;
  question: ExtractedQuestion | null;
  answer: ExtractedAnswer | null;
  matchType: MatchType;
  grade?: GradeResult;
}

export interface GradeResult {
  score: number;
  maxScore: number;
  isCorrect: boolean | null;
  feedback: string;
}

export interface GradeSummaryTotals {
  totalScore: number;
  maxScore: number;
  answeredCount: number;
  unansweredCount: number;
  overallFeedback: string;
}
