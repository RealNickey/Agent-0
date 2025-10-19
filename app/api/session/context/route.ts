/**
 * POST /api/session/context
 * Update session context (shorthand endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateContext, getSession } from '@/lib/sessionManager';
import type { SessionContext } from '@/types';

export const dynamic = 'force-dynamic';

// Helper to safely get userId from Clerk (returns undefined if Clerk not configured)
async function getSafeUserId(): Promise<string | undefined> {
  try {
    const { userId } = await auth();
    return userId || undefined;
  } catch (error) {
    // Clerk not configured - allow anonymous sessions
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSafeUserId();

    const body = await request.json();
    const { sessionId, context } = body as {
      sessionId: string;
      context: Partial<SessionContext>;
    };

    if (!sessionId || !context) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: sessionId, context',
        },
        { status: 400 }
      );
    }

    // Verify session exists and authorization
    const existingSession = await getSession(sessionId);
    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (userId && existingSession.userId && existingSession.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update context
    const updatedSession = await updateContext(sessionId, context);

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: 'Failed to update context' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      context: updatedSession.context,
    });
  } catch (error) {
    console.error('Update context error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update context',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
