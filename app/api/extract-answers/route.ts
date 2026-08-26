import { NextRequest, NextResponse } from 'next/server';
import { extractAnswers } from '@/lib/gemini';
import { groupAnswerSegments } from '@/lib/matching';

export const runtime = 'nodejs';

/**
 * POST /api/extract-answers
 * body: { images: string[] }  -- base64 data URLs, one per page, in order
 * returns: { answers: ExtractedAnswer[] }
 *
 * We ask the model for raw per-region segments (see lib/gemini.ts) and then
 * group them server-side so that an answer split across multiple pages
 * arrives at the client already merged into a single answer with multiple
 * highlight boxes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const images: unknown = body?.images;

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty "images" array.' },
        { status: 400 }
      );
    }

    const segments = await extractAnswers(images as string[]);
    const answers = groupAnswerSegments(segments);
    return NextResponse.json({ answers });
  } catch (err) {
    console.error('extract-answers failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
