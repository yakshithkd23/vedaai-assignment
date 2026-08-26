# VedaAI — AI Assessment Extraction & Answer Mapping

A web app that lets a teacher upload a **question paper** and a student's **handwritten answer
sheet**, then automatically:

1. Extracts every question (in printed order, sub-parts like `11(a)`/`11(b)` kept separate).
2. Extracts every handwritten answer segment, with its position on the page.
3. Maps each answer to the question it belongs to (handling out-of-order answers, unanswered
   questions, and answers that don't match any question).
4. Highlights the **exact region** of the answer sheet for the currently selected question.
5. Optionally grades every answered question with AI feedback and an overall score.

---

## 1. Tech stack

| Concern                  | Choice                                                                 |
|---------------------------|------------------------------------------------------------------------|
| Framework                 | Next.js 14 (App Router) + TypeScript                                   |
| Styling                   | Tailwind CSS                                                            |
| AI model                  | Google **Gemini** (`gemini-1.5-flash` by default) — generous free tier, native multi-image vision input, and reliable structured JSON output |
| PDF → image conversion    | `pdfjs-dist`, rendered **client-side** on a `<canvas>` (no server-side binaries like poppler/ghostscript needed → deploys anywhere) |
| Storage                   | None — everything is processed in-memory for the lifetime of the browser session, per the assignment's constraints |

### Why Gemini?

- It has a genuinely free tier suitable for a take-home assignment.
- It accepts multiple images in one call, which lets us send every page of the question paper /
  answer sheet together so the model has full context (needed to correctly split sub-parts,
  infer question numbers from handwriting, and detect answers spanning multiple pages).
- It supports normalized bounding-box detection out of the box, which we use to highlight the
  exact answer region.

---

## 2. Project structure

```
vedaai-assignment/
├── app/
│   ├── page.tsx                 # Top-level state machine: upload → loading → mapping
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── extract-questions/route.ts   # POST: question paper images -> ExtractedQuestion[]
│       ├── extract-answers/route.ts     # POST: answer sheet images -> ExtractedAnswer[]
│       └── grade/route.ts               # POST: {question,answer} pairs -> AI grade + feedback
├── components/
│   ├── UploadScreen.tsx          # Upload Question Paper / Answer Sheet (empty + filled states)
│   ├── LoadingScreen.tsx         # "Extracting…" state
│   ├── MappingScreen.tsx         # Main screen: question list + answer sheet viewer
│   ├── QuestionList.tsx          # Left panel: question list with status badges
│   ├── AnswerSheetViewer.tsx     # Right panel: answer sheet image + highlight overlay
│   └── GradeSummary.tsx          # Overall score modal
├── lib/
│   ├── types.ts                  # Shared TypeScript types
│   ├── gemini.ts                 # Gemini API wrapper + prompts (single source of truth)
│   ├── matching.ts               # Question <-> Answer mapping algorithm (pure functions, unit-testable)
│   └── pdfToImages.ts            # Client-side PDF page rendering (pdfjs-dist)
├── .env.example
├── package.json
└── README.md   ← you are here
```

This separation keeps **prompting/AI logic** (`lib/gemini.ts`), **business logic**
(`lib/matching.ts`), and **UI** (`components/`) independent of each other — the matching
algorithm, for instance, is pure and has zero dependency on React or Next.js, so it can be unit
tested in isolation.

---

## 3. How the core pipeline works

```
Upload (question paper + answer sheet)
        │
        ▼
Render every PDF page to a PNG in the browser (pdfjs-dist)  ── lib/pdfToImages.ts
        │
        ├── POST /api/extract-questions  → [{ number, text }, ...]           (printed order preserved)
        │
        └── POST /api/extract-answers    → raw handwritten segments:
                [{ questionNumberGuess, text, page, box }, ...]
                        │
                        ▼
        groupAnswerSegments()  — merges segments sharing the same question
        number guess into one ExtractedAnswer with multiple boxes
        (this is how multi-page answers are supported)
                        │
                        ▼
        mapAnswersToQuestions()  — lib/matching.ts
          1. Exact match by normalized printed number ("11 (a)" == "11(a)" == "Q11a")
          2. Fallback fuzzy text-similarity match for illegible/unlabeled answers
          3. Anything left over on the question side  → "unanswered"
          4. Anything left over on the answer side     → "unmatched" (doesn't belong
             to any question on the paper)
                        │
                        ▼
        MappingScreen: click a question → AnswerSheetViewer jumps to the right
        page and draws the highlighted bounding box(es) for that answer.
                        │
                        ▼
        "Grade all answers" → POST /api/grade → per-question score /10 + feedback
        + an aggregate score in GradeSummary.
```

### Edge cases explicitly handled

- **Sub-parts as separate questions** — the extraction prompt instructs the model to treat
  `11(a)` / `11(b)` as independent entries, never merged.
- **Out-of-order answers** — matching is done by normalized question label, not by position, so
  answer order on the sheet never matters.
- **Unanswered questions** — any question with no matching answer segment is flagged
  `Unanswered` in the UI (red badge) and the viewer shows an explicit notice.
- **Answers that don't match any question** — surfaced as a separate `Unmatched` row so nothing
  silently disappears.
- **Multi-page answers** — segments sharing a question-number guess are merged into one answer
  with multiple bounding boxes across pages; the viewer shows page tabs ("Page 1", "Page 2"...)
  when an answer spans more than one page.

---

## 4. Running locally

### Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- A free Gemini API key from **[Google AI Studio](https://aistudio.google.com/app/apikey)**

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure your API key
cp .env.example .env.local
# then open .env.local and paste your key:
#   GEMINI_API_KEY=AI...
#   GEMINI_MODEL=gemini-1.5-flash   (optional override)

# 3. Run the dev server
npm run dev

# 4. Open the app
# http://localhost:3000
```

Then, in the browser:

1. Upload a question paper (PDF or image) and an answer sheet (PDF or image).
2. Click **Continue** and wait through the extraction/mapping steps.
3. Click any question on the left to see its answer highlighted on the sheet on the right.
4. Click **Grade all answers** for an AI-generated score and feedback per question, plus an
   overall summary.

### Production build

```bash
npm run build
npm run start
```

---

## 5. Deployment

The app has no server-side native dependencies (PDF rendering happens in the browser), so it
deploys to any Node-compatible host. The simplest path:

### Vercel (recommended)

1. Push this repository to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add the environment variable `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) in the
   project's Settings → Environment Variables.
4. Deploy — Vercel auto-detects Next.js, no extra config needed.

### Any other Node host (Render, Railway, Fly.io, etc.)

```bash
npm install
npm run build
npm run start   # serves on process.env.PORT, defaulting to 3000
```
Set `GEMINI_API_KEY` as an environment variable on the host.

---

## 6. Assumptions & limitations

- **No marking scheme is uploaded** — grading is done purely on the AI's subject-matter judgement
  against the extracted question text, out of a flat 10 marks per question. If a teacher has a
  specific rubric, plugging it into the grading prompt (`lib/gemini.ts` → `GRADING_PROMPT_HEADER`)
  is a natural next step.
- **One answer sheet per session** — the assignment scope is a single student's answer sheet
  against one question paper; there's no batch/multi-student mode (in-memory state only, no DB,
  per the assignment constraints).
- **Bounding-box precision** depends on the vision model's own detection quality; very cramped or
  overlapping handwriting can occasionally produce a slightly loose highlight box.
- **Question-number handwriting quality** drives the exact-match rate; the fuzzy text-similarity
  fallback (Jaccard token overlap) is intentionally simple and conservative (only claims a match
  above a similarity threshold) to avoid confidently mis-mapping answers.
- Large, many-page scans will take longer to process since all pages are sent to the model in a
  single request per document (this keeps context intact so multi-page answers are handled
  correctly, at the cost of a bigger single call).

---

## 7. Notes on the AI model / API used

- **Model:** Gemini (`gemini-1.5-flash` default, configurable via `GEMINI_MODEL`).
- **Where:** `lib/gemini.ts` is the only file that talks to the model — three functions:
  `extractQuestions`, `extractAnswers`, `gradeAnswers`. All enforce `responseMimeType:
  "application/json"` plus a defensive JSON-fence-stripping parser, since reliable structured
  output is what the rest of the pipeline depends on.
- Swapping providers (e.g. to OpenAI or Claude vision) only requires rewriting this one file — the
  rest of the app depends only on the `ExtractedQuestion` / `RawAnswerSegment` / `GradeOutput`
  shapes defined in `lib/types.ts`.
