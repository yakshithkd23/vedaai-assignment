import { NextRequest, NextResponse } from 'next/server';
import { extractQuestions } from '@/lib/gemini';

export const runtime = 'nodejs';

/**
 * POST /api/extract-questions
 * body: { images: string[] }  -- base64 data URLs, one per page, in order
 * returns: { questions: ExtractedQuestion[] }
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

    const questions = await extractQuestions(images as string[]);
    return NextResponse.json({ questions });
  } catch (err) {
    console.error('extract-questions failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
