/**
 * Clerk configuration utilities
 * 
 * Shared utilities for checking if Clerk is properly configured.
 */

// Check if Clerk is properly configured at module level
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Returns true if Clerk is configured with a valid publishable key
 */
export const hasValidClerkKey = typeof publishableKey === 'string' && publishableKey.startsWith('pk_');
