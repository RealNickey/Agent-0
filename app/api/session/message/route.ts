/**
 * POST /api/session/message
 * Add a message to an existing session
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { addMessage, getSession } from '@/lib/sessionManager';
import type { SessionMessage, MessageType } from '@/types';

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
    // Get authenticated user (or undefined for anonymous sessions)
    const userId = await getSafeUserId();

    // Parse request body
    const body = await request.json();
    const {
      sessionId,
      role,
      content,
      type = 'text',
      metadata,
    } = body as {
      sessionId: string;
      role: SessionMessage['role'];
      content: string;
      type?: MessageType;
      metadata?: SessionMessage['metadata'];
    };

    // Validate required fields
    if (!sessionId || !role || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: sessionId, role, content',
        },
        { status: 400 }
      );
    }

    // Verify session exists and belongs to user (if authenticated)
    const existingSession = await getSession(sessionId);
    if (!existingSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
        },
        { status: 404 }
      );
    }

    // Check authorization - session must belong to the user or be anonymous
    if (userId && existingSession.userId && existingSession.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access to session',
        },
        { status: 403 }
      );
    }

    // Add the message
    const updatedSession = await addMessage(sessionId, {
      role,
      content,
      type,
      metadata,
    });

    if (!updatedSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to add message',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageCount: updatedSession.messages.length,
      lastMessage: updatedSession.messages[updatedSession.messages.length - 1],
    });
  } catch (error) {
    console.error('Add message error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
