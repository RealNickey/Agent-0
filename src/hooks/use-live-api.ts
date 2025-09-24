/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GenAILiveClient } from "../lib/genai-live-client";
import { LiveClientOptions } from "../types";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import { connectionToasts } from "../lib/toast";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { LiveConnectConfig } from "@google/genai";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [model, setModel] = useState<string>(
    "models/gemini-live-2.5-flash-preview"
  );
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);

  // Audio pipeline monitoring
  const lastAudioTimeRef = useRef<number>(Date.now());
  const audioHealthCheckInterval = useRef<number | null>(null);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" })
        .then((audioCtx: AudioContext) => {
          audioStreamerRef.current = new AudioStreamer(audioCtx);
          audioStreamerRef.current
            .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
              setVolume(ev.data.volume);
            })
            .then(() => {
              // Successfully added worklet
            })
            .catch((error) => {
              console.error("Failed to add VU meter worklet:", error);
              connectionToasts.audioError("Failed to initialize audio worklet");
              // Attempt to recreate audio streamer on worklet failure
              setTimeout(() => {
                audioStreamerRef.current = null;
              }, 1000);
            });
        })
        .catch((error) => {
          console.error("Failed to create audio context:", error);
          connectionToasts.audioError("Failed to create audio context");
        });
    }
  }, [audioStreamerRef]);

  // Audio pipeline health monitoring functions
  const stopAudioHealthCheck = useCallback(() => {
    if (audioHealthCheckInterval.current) {
      clearInterval(audioHealthCheckInterval.current);
      audioHealthCheckInterval.current = null;
    }
  }, []);

  const startAudioHealthCheck = useCallback(() => {
    if (audioHealthCheckInterval.current) {
      stopAudioHealthCheck();
    }

    lastAudioTimeRef.current = Date.now();

    audioHealthCheckInterval.current = window.setInterval(() => {
      const now = Date.now();
      const timeSinceLastAudio = now - lastAudioTimeRef.current;

      // If we haven't received audio in a while during an active conversation,
      // this might indicate audio pipeline issues
      if (timeSinceLastAudio > 60000 && connected) {
        // 60 seconds
        console.warn(
          "Audio pipeline may be disconnected - no audio received recently"
        );
        connectionToasts.audioError("No audio received recently - pipeline may be disconnected");

        // Try to validate session
        if (!client.validateSession()) {
          console.log("Session validation failed during audio health check");
          connectionToasts.sessionValidationFailed();
        }

        // Try to recreate audio streamer as a recovery mechanism
        if (audioStreamerRef.current) {
          try {
            audioStreamerRef.current.stop();
            audioStreamerRef.current = null;
            // The useEffect will recreate it
          } catch (error) {
            console.error("Error during audio streamer recovery:", error);
          }
        }
      }
    }, 30000); // Check every 30 seconds
  }, [connected, client, stopAudioHealthCheck]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
      connectionToasts.connected();
      // Start audio pipeline monitoring when connected
      startAudioHealthCheck();
    };

    const onClose = () => {
      setConnected(false);
      connectionToasts.disconnected();
      // Stop audio pipeline monitoring when disconnected
      stopAudioHealthCheck();
    };

    const onError = (error: ErrorEvent) => {
      console.error("error", error);
      connectionToasts.connectionError(error.message);
      // Try to validate session and reconnect if needed
      if (!client.validateSession()) {
        console.log(
          "Session validation failed, connection may be unresponsive"
        );
        connectionToasts.sessionValidationFailed();
      }
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) => {
      // Update last audio received time for health monitoring
      lastAudioTimeRef.current = Date.now();
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));
    };

    // New event handlers for enhanced functionality
    const onFileData = (fileUri: string) => {
      console.log("File data received:", fileUri);
    };

    const onExecutableCode = (code: any) => {
      console.log("Executable code received:", code);
    };

    const onCodeExecutionResult = (result: any) => {
      console.log("Code execution result:", result);
    };

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio)
      .on("filedata", onFileData)
      .on("executablecode", onExecutableCode)
      .on("codeexecutionresult", onCodeExecutionResult);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .off("filedata", onFileData)
        .off("executablecode", onExecutableCode)
        .off("codeexecutionresult", onCodeExecutionResult)
        .disconnect();

      stopAudioHealthCheck();
    };
  }, [client, startAudioHealthCheck, stopAudioHealthCheck]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error("config has not been set");
    }
    try {
      connectionToasts.connecting();
      client.disconnect();
      await client.connect(model, config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      connectionToasts.connectionError(errorMessage);
      throw error;
    }
  }, [client, config, model]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
    stopAudioHealthCheck();
  }, [setConnected, client, stopAudioHealthCheck]);

  return {
    client,
    config,
    setConfig,
    model,
    setModel,
    connected,
    connect,
    disconnect,
    volume,
  };
}
