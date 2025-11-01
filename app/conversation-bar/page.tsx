import { ConversationBarClient } from "./conversation-bar-client";

export default function ConversationBarPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col gap-6 pb-12 pt-10">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-3xl font-semibold">Gemini Live Conversation Bar</h1>
        <p className="text-muted-foreground">
          Demo of a compact conversation bar UI powered by Google Gemini Live API.
          Start a voice or text conversation with Gemini using this sleek interface.
        </p>
      </div>
      <ConversationBarClient />
      <div className="max-w-2xl space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Features</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Real-time voice conversation with Gemini</li>
            <li>Live audio waveform visualization</li>
            <li>Text input support with keyboard toggle</li>
            <li>Microphone mute/unmute controls</li>
            <li>Session management (connect/disconnect)</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">How to Use</h2>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Click the phone icon to start a conversation</li>
            <li>Grant microphone permissions when prompted</li>
            <li>Speak naturally or use the keyboard icon for text input</li>
            <li>Use the mic icon to mute/unmute your microphone</li>
            <li>Click the X icon to end the session</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
