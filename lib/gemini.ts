import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ExtractedQuestion, RawAnswerSegment } from './types';

/**
 * Thin wrapper around the Gemini API. Kept in one place so the model name,
 * JSON-parsing/cleanup logic, and error handling are consistent across
 * every route that needs the LLM.
 */

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your .env.local file (see .env.example).'
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

function getModel() {
  const client = getClient();
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
}

/** Strips ```json fences etc. in case the model ignores responseMimeType. */
function safeJsonParse<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `Model did not return valid JSON. Raw response: ${raw.slice(0, 500)}`
    );
  }
}

/** Converts a base64 data-URL (e.g. "data:image/png;base64,...") into the
 * inline data format the Gemini SDK expects. */
function toInlinePart(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Expected a base64 data URL for each page image.');
  }
  const [, mimeType, data] = match;
  return { inlineData: { mimeType, data } };
}

const QUESTION_EXTRACTION_PROMPT = `You are an expert OCR and document-parsing assistant.
You will be given one or more images, in order, representing consecutive pages of a printed
question paper.

Extract every question in the exact order they are printed on the page. If a question has
labelled sub-parts (e.g. "11(a)" and "11(b)", or "Q3 i" and "Q3 ii"), treat EACH sub-part as a
separate entry. Preserve the original printed numbering exactly (do not renumber, do not merge
sub-parts into one entry).

Return ONLY a valid JSON array, no markdown fences, no commentary, matching this schema:
[{ "number": string, "text": string }]

"number" must be the printed label exactly as shown (e.g. "1", "11(a)", "Q5").
"text" must be the full question text, excluding the printed number/label itself.`;

export async function extractQuestions(
  pageImages: string[]
): Promise<ExtractedQuestion[]> {
  const model = getModel();
  const parts = pageImages.map(toInlinePart);
  const result = await model.generateContent([
    QUESTION_EXTRACTION_PROMPT,
    ...parts,
  ]);
  const text = result.response.text();
  const parsed = safeJsonParse<{ number: string; text: string }[]>(text);
  return parsed.map((q, i) => ({
    id: `q-${i}-${q.number}`,
    number: q.number,
    text: q.text,
  }));
}

const ANSWER_EXTRACTION_PROMPT = `You are an expert OCR assistant specialized in reading messy
student handwriting. You will be given one or more images, in order (0-indexed), representing
consecutive pages of a single student's handwritten answer sheet.

For every distinct answer written on the sheet, identify:
1. "questionNumberGuess": the question number the student has written, or that you can
   confidently infer from context/order (e.g. "11(a)", "3", "Q5"). If it is illegible, missing,
   or you are not reasonably confident, use null. Do NOT guess wildly.
2. "text": a best-effort transcription of the handwritten answer content.
3. "page": the 0-based index of the image this segment appears on, matching the order the
   images were given to you in.
4. "box": the tight bounding box around the handwritten answer region on that page image, as
   [ymin, xmin, ymax, xmax], normalized to a 0-1000 scale relative to that page image's full
   width and height.

If a single answer's handwriting continues onto a later page or a separate region, output it as
a SEPARATE segment that shares the same "questionNumberGuess" — do not try to merge them
yourself, downstream code will merge segments that share a question number.

Return ONLY a valid JSON array, no markdown fences, no commentary, matching this schema:
[{ "questionNumberGuess": string | null, "text": string, "page": number, "box": [number, number, number, number] }]`;

export async function extractAnswers(
  pageImages: string[]
): Promise<RawAnswerSegment[]> {
  const model = getModel();
  const parts = pageImages.map(toInlinePart);
  const result = await model.generateContent([
    ANSWER_EXTRACTION_PROMPT,
    ...parts,
  ]);
  const text = result.response.text();
  return safeJsonParse<RawAnswerSegment[]>(text);
}

export interface GradeInput {
  id: string;
  questionText: string;
  answerText: string;
}

export interface GradeOutput {
  id: string;
  score: number;
  maxScore: number;
  isCorrect: boolean | null;
  feedback: string;
}

const GRADING_PROMPT_HEADER = `You are an experienced teacher grading short-answer exam
responses. You will be given a JSON array of { "id", "questionText", "answerText" } objects.
No official marking scheme/answer key was provided, so use your own subject-matter judgement.

For each item, return an assessment out of a maximum of 10 marks. Be fair but rigorous: a fully
correct, complete answer should score close to 10; a partially correct answer should score
proportionally; a wrong or irrelevant answer should score low (0-2); an empty answer scores 0.

Return ONLY a valid JSON array, no markdown fences, no commentary, matching this schema:
[{ "id": string, "score": number, "maxScore": 10, "isCorrect": boolean, "feedback": string }]
"feedback" must be at most two short sentences, specific and constructive.

Items to grade:
`;

export async function gradeAnswers(items: GradeInput[]): Promise<GradeOutput[]> {
  if (items.length === 0) return [];
  const client = getClient();
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const prompt = GRADING_PROMPT_HEADER + JSON.stringify(items, null, 2);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return safeJsonParse<GradeOutput[]>(text);
}
