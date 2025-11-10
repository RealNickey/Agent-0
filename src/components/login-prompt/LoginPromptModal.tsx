/**
 * Login Prompt Modal
 *
 * Displays when anonymous users reach their usage limit.
 * Encourages sign-in for unlimited access.
 */

import { useClerk } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { RiLockLine, RiCheckLine, RiSparklingLine } from "react-icons/ri";

// Check if Clerk is properly configured
const getClerkKey = () => {
  if (typeof window === 'undefined') return undefined;
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
};

// Safe wrapper that always calls useClerk unconditionally
function useSafeClerk() {
  // Always call the hook unconditionally at the top level (Rules of Hooks requirement)
  const clerkData = useClerk();
  
  // Check if Clerk is actually configured
  const publishableKey = getClerkKey();
  const hasValidClerkKey = publishableKey && publishableKey.startsWith('pk_');
  
  // If Clerk is not configured, return safe defaults instead of the Clerk data
  if (!hasValidClerkKey) {
    return { openSignIn: undefined };
  }
  
  // Return Clerk data if configured
  return clerkData;
}

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingMessages?: number;
  messageLimit?: number;
}

export default function LoginPromptModal({
  open,
  onOpenChange,
  remainingMessages = 0,
  messageLimit = 10,
}: LoginPromptModalProps) {
  const { openSignIn } = useSafeClerk();

  const handleSignIn = () => {
    onOpenChange(false);
    try {
      openSignIn?.();
    } catch (error) {
      console.error("Error opening sign-in:", error);
      // Fallback to redirect
      window.location.href = "/";
    }
  };

  const handleContinueLater = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <RiLockLine className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            You&apos;ve reached your message limit
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            You&apos;ve used all {messageLimit} free messages. Sign in to
            continue with unlimited access!
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-3">
          <div className="text-sm font-medium mb-3 flex items-center gap-2">
            <RiSparklingLine className="h-4 w-4 text-primary" />
            <span>Benefits of signing in:</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 text-sm">
              <RiCheckLine className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Unlimited messages</strong> - No restrictions on
                conversations
              </span>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <RiCheckLine className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Conversation history</strong> - Access your chats from
                any device
              </span>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <RiCheckLine className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Personalized experience</strong> - Save preferences and
                settings
              </span>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <RiCheckLine className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Priority access</strong> - Get faster responses during
                peak times
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleContinueLater}
            className="w-full sm:w-auto"
          >
            Maybe later
          </Button>
          <Button onClick={handleSignIn} className="w-full sm:w-auto">
            Sign in to continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
