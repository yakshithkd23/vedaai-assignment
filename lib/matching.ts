import type {
  BoundingBox,
  ExtractedAnswer,
  ExtractedQuestion,
  MappedEntry,
  RawAnswerSegment,
} from './types';

/**
 * Normalizes a question-number label so that "11 (a)", "11(a)", "Q11a" and
 * "question 11 a" all compare equal. Returns null for empty/illegible input.
 */
export function normalizeQNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.toLowerCase().trim();
  if (!s) return null;
  // Strip a leading "q", "q.", "qn", "question" prefix.
  s = s.replace(/^(question|qn|q)\.?\s*/i, '');
  // Drop whitespace and common punctuation used around sub-part labels.
  s = s.replace(/[\s().\-]/g, '');
  return s || null;
}

/** Converts Gemini's [ymin,xmin,ymax,xmax] (0-1000) box into our 0-1 BoundingBox. */
function toBoundingBox(page: number, box: [number, number, number, number]): BoundingBox {
  const [ymin, xmin, ymax, xmax] = box;
  return {
    page,
    x: Math.max(0, Math.min(1, xmin / 1000)),
    y: Math.max(0, Math.min(1, ymin / 1000)),
    width: Math.max(0, Math.min(1, (xmax - xmin) / 1000)),
    height: Math.max(0, Math.min(1, (ymax - ymin) / 1000)),
  };
}

/**
 * Groups raw per-segment answer detections (one per handwritten region) into
 * ExtractedAnswer objects, merging segments that share the same question
 * number guess (this is how we support answers spanning multiple pages).
 * Segments with no question number guess (illegible/unlabelled) are kept as
 * individual answers so they can still be fuzzy-matched or shown as "unmatched".
 */
export function groupAnswerSegments(segments: RawAnswerSegment[]): ExtractedAnswer[] {
  const byLabel = new Map<string, RawAnswerSegment[]>();
  const unlabeled: RawAnswerSegment[] = [];

  for (const seg of segments) {
    const norm = normalizeQNumber(seg.questionNumberGuess);
    if (norm === null) {
      unlabeled.push(seg);
      continue;
    }
    const list = byLabel.get(norm) ?? [];
    list.push(seg);
    byLabel.set(norm, list);
  }

  const answers: ExtractedAnswer[] = [];

  for (const [norm, segs] of byLabel.entries()) {
    answers.push({
      id: `ans-${norm}`,
      questionNumberGuess: segs[0].questionNumberGuess,
      text: segs.map((s) => s.text).join(' '),
      boxes: segs.map((s) => toBoundingBox(s.page, s.box)),
    });
  }

  unlabeled.forEach((seg, i) => {
    answers.push({
      id: `ans-unlabeled-${i}`,
      questionNumberGuess: null,
      text: seg.text,
      boxes: [toBoundingBox(seg.page, seg.box)],
    });
  });

  return answers;
}

/** Simple token-overlap (Jaccard-style) similarity, used only as a fallback
 * for answers with no readable question number. */
function textSimilarity(a: string, b: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2)
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

const FUZZY_MATCH_THRESHOLD = 0.15;

/**
 * Core mapping algorithm:
 *  1. Exact-match answers to questions by normalized printed number.
 *  2. For any answer still unmatched (no number, or number didn't match any
 *     question), try a fuzzy text-similarity match against remaining
 *     unanswered questions.
 *  3. Any question still without an answer -> "unanswered".
 *  4. Any answer still without a question -> "unmatched" (answer that does
 *     not correspond to any question on the paper).
 */
export function mapAnswersToQuestions(
  questions: ExtractedQuestion[],
  answers: ExtractedAnswer[]
): MappedEntry[] {
  const entries: MappedEntry[] = [];
  const usedAnswerIds = new Set<string>();
  const questionByNorm = new Map<string, ExtractedQuestion>();
  for (const q of questions) {
    const norm = normalizeQNumber(q.number);
    if (norm) questionByNorm.set(norm, q);
  }

  // Pass 1: exact label matches.
  for (const q of questions) {
    const norm = normalizeQNumber(q.number);
    const match = answers.find(
      (a) => !usedAnswerIds.has(a.id) && normalizeQNumber(a.questionNumberGuess) === norm
    );
    if (match) {
      usedAnswerIds.add(match.id);
      entries.push({ id: `entry-${q.id}`, question: q, answer: match, matchType: 'exact' });
    } else {
      entries.push({ id: `entry-${q.id}`, question: q, answer: null, matchType: 'unanswered' });
    }
  }

  // Pass 2: fuzzy match remaining unlabeled/unresolved answers against
  // still-unanswered questions.
  const remainingAnswers = answers.filter((a) => !usedAnswerIds.has(a.id));
  for (const answer of remainingAnswers) {
    let bestEntry: MappedEntry | null = null;
    let bestScore = 0;
    for (const entry of entries) {
      if (entry.matchType !== 'unanswered' || !entry.question) continue;
      const score = textSimilarity(entry.question.text, answer.text);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }
    if (bestEntry && bestScore >= FUZZY_MATCH_THRESHOLD) {
      bestEntry.answer = answer;
      bestEntry.matchType = 'fuzzy';
      usedAnswerIds.add(answer.id);
    }
  }

  // Pass 3: whatever's left is a genuinely unmatched answer.
  for (const answer of answers) {
    if (!usedAnswerIds.has(answer.id)) {
      entries.push({
        id: `entry-unmatched-${answer.id}`,
        question: null,
        answer,
        matchType: 'unmatched',
      });
    }
  }

  return entries;
}
