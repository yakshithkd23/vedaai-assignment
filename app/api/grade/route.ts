import { NextRequest, NextResponse } from 'next/server';
import { gradeAnswers, type GradeInput } from '@/lib/gemini';

export const runtime = 'nodejs';

/**
 * POST /api/grade
 * body: { items: { id: string, questionText: string, answerText: string }[] }
 * returns: { grades: GradeOutput[] }
 *
 * Only answered questions should be sent here — grading unanswered/unmatched
 * rows is meaningless, so the client filters those out before calling this.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: unknown = body?.items;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Request body must include an "items" array.' },
        { status: 400 }
      );
    }

    const grades = await gradeAnswers(items as GradeInput[]);
    return NextResponse.json({ grades });
  } catch (err) {
    console.error('grade failed:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
