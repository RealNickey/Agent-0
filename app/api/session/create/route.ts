/**
 * POST /api/session/create
 * Create a new Agent-0 session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSession } from '@/lib/sessionManager';
import type { SessionCreateOptions } from '@/types';

export const dynamic = 'force-dynamic';

// Helper to safely get userId from Clerk (returns undefined if Clerk not configured)
async function getSafeUserId(): Promise<string | undefined> {
  try {
    const { userId } = await auth();
    return userId || undefined;
  } catch (error) {
    // Clerk not configured or middleware not set up - allow anonymous sessions
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from Clerk (or undefined for anonymous sessions)
    const userId = await getSafeUserId();

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { conversationId, preferences } = body as {
      conversationId?: string;
      preferences?: SessionCreateOptions['preferences'];
    };

    // Create session options
    const options: SessionCreateOptions = {
      userId,
      conversationId,
      preferences,
    };

    // Create the session
    const session = await createSession(options);

    return NextResponse.json(
      {
        success: true,
        session: {
          sessionId: session.sessionId,
          conversationId: session.conversationId,
          createdAt: session.createdAt,
          userId: session.userId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
