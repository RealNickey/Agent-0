/**
 * GET /api/session/[sessionId]
 * Retrieve a session by ID
 * 
 * POST /api/session/[sessionId]
 * Update session context or preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSession, updateSession } from '@/lib/sessionManager';
import type { SessionUpdateOptions } from '@/types';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = await getSafeUserId();
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (userId && session.userId && session.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = await getSafeUserId();
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Verify session exists
    const existingSession = await getSession(sessionId);
    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (userId && existingSession.userId && existingSession.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse update options
    const body = await request.json();
    const updates = body as SessionUpdateOptions;

    // Update the session
    const updatedSession = await updateSession(sessionId, updates);

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
