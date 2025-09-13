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

import {
  Content,
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
  TurnCoverage,
} from "@google/genai";

import { EventEmitter } from "eventemitter3";
import { difference } from "lodash";
import { LiveClientOptions, StreamingLog } from "../types";
import { base64ToArrayBuffer } from "./utils";

/**
 * WAV conversion options for audio processing
 */
interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

/**
 * Event types that can be emitted by the MultimodalLiveClient.
 * Each event corresponds to a specific message from GenAI or client state change.
 */
export interface LiveClientEventTypes {
  // Emitted when audio data is received
  audio: (data: ArrayBuffer) => void;
  // Emitted when the connection closes
  close: (event: CloseEvent) => void;
  // Emitted when content is received from the server
  content: (data: LiveServerContent) => void;
  // Emitted when an error occurs
  error: (error: ErrorEvent) => void;
  // Emitted when the server interrupts the current generation
  interrupted: () => void;
  // Emitted for logging events
  log: (log: StreamingLog) => void;
  // Emitted when the connection opens
  open: () => void;
  // Emitted when the initial setup is complete
  setupcomplete: () => void;
  // Emitted when a tool call is received
  toolcall: (toolCall: LiveServerToolCall) => void;
  // Emitted when a tool call is cancelled
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
  // Emitted when the current turn is complete
  turncomplete: () => void;
  // Emitted when file data is received
  filedata: (fileUri: string) => void;
  // Emitted when executable code is received
  executablecode: (code: any) => void;
  // Emitted when code execution results are received
  codeexecutionresult: (result: any) => void;
}

/**
 * A event-emitting class that manages the connection to the websocket and emits
 * events to the rest of the application.
 * If you dont want to use react you can still use this.
 */
export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  protected client: GoogleGenAI;

  private _status: "connected" | "disconnected" | "connecting" = "disconnected";
  public get status() {
    return this._status;
  }

  private _session: Session | null = null;
  public get session() {
    return this._session;
  }

  private _model: string | null = null;
  public get model() {
    return this._model;
  }

  protected config: LiveConnectConfig | null = null;

  // Health checking properties
  private healthCheckInterval: number | null = null;
  private lastPingTime: number = 0;
  private pingTimeoutId: number | null = null;
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly PING_TIMEOUT = 10000; // 10 seconds
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private reconnectTimeoutId: number | null = null;

  // Audio collection for WAV conversion
  private audioParts: string[] = [];

  // Response queue for message handling
  private responseQueue: LiveServerMessage[] = [];

  public getConfig() {
    return { ...this.config };
  }

  constructor(options: LiveClientOptions) {
    super();
    this.client = new GoogleGenAI(options);
    this.send = this.send.bind(this);
    this.onopen = this.onopen.bind(this);
    this.onerror = this.onerror.bind(this);
    this.onclose = this.onclose.bind(this);
    this.onmessage = this.onmessage.bind(this);
    this.startHealthCheck = this.startHealthCheck.bind(this);
    this.stopHealthCheck = this.stopHealthCheck.bind(this);
  }

  protected log(type: string, message: StreamingLog["message"]) {
    const log: StreamingLog = {
      date: new Date(),
      type,
      message,
    };
    this.emit("log", log);
  }

  async connect(model: string, config: LiveConnectConfig): Promise<boolean> {
    if (this._status === "connected" || this._status === "connecting") {
      return false;
    }

    this._status = "connecting";
    this.config = config;
    this._model = model;
    this.reconnectAttempts = 0;

    const callbacks: LiveCallbacks = {
      onopen: this.onopen,
      onmessage: this.onmessage,
      onerror: this.onerror,
      onclose: this.onclose,
    };

    try {
      this._session = await this.client.live.connect({
        model,
        config,
        callbacks,
      });
    } catch (e) {
      console.error("Error connecting to GenAI Live:", e);
      this._status = "disconnected";
      this.scheduleReconnect();
      return false;
    }

    this._status = "connected";
    this.startHealthCheck();
    return true;
  }

  public disconnect() {
    if (!this.session) {
      return false;
    }

    this.stopHealthCheck();
    this.clearReconnectTimeout();
    this.session?.close();
    this._session = null;
    this._status = "disconnected";

    this.log("client.close", `Disconnected`);
    return true;
  }

  protected onopen() {
    this.log("client.open", "Connected");
    this.reconnectAttempts = 0;
    this.emit("open");
  }

  protected onerror(e: ErrorEvent) {
    this.log("server.error", e.message);
    this.emit("error", e);

    // Enhanced error handling - attempt reconnection on connection errors
    if (this._status === "connected") {
      this.log(
        "client.reconnect",
        "Connection error detected, attempting recovery"
      );
      this.scheduleReconnect();
    }
  }

  protected onclose(e: CloseEvent) {
    this.stopHealthCheck();
    this._status = "disconnected";

    this.log(
      `server.close`,
      `disconnected ${e.reason ? `with reason: ${e.reason}` : ``}`
    );
    this.emit("close", e);

    // Attempt reconnection unless it was an intentional disconnect
    if (e.code !== 1000 && this.config && this._model) {
      this.log(
        "client.reconnect",
        "Unexpected disconnect, attempting reconnection"
      );
      this.scheduleReconnect();
    }
  }

  protected async onmessage(message: LiveServerMessage) {
    // Reset ping timer on any message received
    this.lastPingTime = Date.now();

    // Add message to response queue for advanced processing
    this.addToResponseQueue(message);

    if (message.setupComplete) {
      this.log("server.send", "setupComplete");
      this.emit("setupcomplete");
      return;
    }
    if (message.toolCall) {
      this.log("server.toolCall", message);
      this.handleToolCall(message.toolCall);
      this.emit("toolcall", message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      this.log("server.toolCallCancellation", message);
      this.emit("toolcallcancellation", message.toolCallCancellation);
      return;
    }

    // this json also might be `contentUpdate { interrupted: true }`
    // or contentUpdate { end_of_turn: true }
    if (message.serverContent) {
      const { serverContent } = message;
      if ("interrupted" in serverContent) {
        this.log("server.content", "interrupted");
        this.emit("interrupted");
        return;
      }
      if ("turnComplete" in serverContent) {
        this.log("server.content", "turnComplete");
        this.emit("turncomplete");
      }

      if ("modelTurn" in serverContent) {
        let parts: Part[] = serverContent.modelTurn?.parts || [];

        // Process each part according to its type
        for (const part of parts) {
          // Handle file data
          if (part.fileData && part.fileData.fileUri) {
            this.log("server.fileData", `File: ${part.fileData.fileUri}`);
            this.emit("filedata", part.fileData.fileUri);
          }

          // Handle executable code
          if (part.executableCode) {
            this.log(
              "server.executableCode",
              JSON.stringify(part.executableCode)
            );
            this.emit("executablecode", part.executableCode);
          }

          // Handle code execution results
          if (part.codeExecutionResult) {
            this.log(
              "server.codeExecutionResult",
              JSON.stringify(part.codeExecutionResult)
            );
            this.emit("codeexecutionresult", part.codeExecutionResult);
          }

          // Handle text content
          if (part.text) {
            this.log("server.text", part.text);
          }
        }

        // Handle audio data with collection for WAV conversion
        const audioParts = parts.filter(
          (p) => p.inlineData && p.inlineData.mimeType?.startsWith("audio/pcm")
        );
        const base64s = audioParts.map((p) => p.inlineData?.data);

        // Collect audio parts for potential WAV conversion
        base64s.forEach((b64) => {
          if (b64) {
            this.audioParts.push(b64);
            const data = base64ToArrayBuffer(b64);
            this.emit("audio", data);
            this.log(`server.audio`, `buffer (${data.byteLength})`);
          }
        });

        // Process audio parts for WAV conversion if needed
        // Note: WAV conversion utilities can be added later if needed

        // strip the audio parts out of the modelTurn for content emission
        const otherParts = difference(parts, audioParts);

        if (otherParts.length > 0) {
          const content: { modelTurn: Content } = {
            modelTurn: { parts: otherParts },
          };
          this.emit("content", content);
          this.log(`server.content`, message);
        }
      }
    } else {
      console.log("received unmatched message", message);
    }
  }

  /**
   * send realtimeInput, this is base64 chunks of "audio/pcm" and/or "image/jpg"
   */
  sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    let hasAudio = false;
    let hasVideo = false;
    for (const ch of chunks) {
      this.session?.sendRealtimeInput({ media: ch });
      if (ch.mimeType.includes("audio")) {
        hasAudio = true;
      }
      if (ch.mimeType.includes("image")) {
        hasVideo = true;
      }
      if (hasAudio && hasVideo) {
        break;
      }
    }
    const message =
      hasAudio && hasVideo
        ? "audio + video"
        : hasAudio
        ? "audio"
        : hasVideo
        ? "video"
        : "unknown";
    this.log(`client.realtimeInput`, message);
  }

  /**
   * Explicitly signal end of current audio stream segment (for VAD pauses)
   * Sends an audioStreamEnd event so the server can flush buffered audio.
   */
  endAudioStream() {
    try {
      this.session?.sendRealtimeInput({ audioStreamEnd: true });
      this.log("client.realtimeInput", "audioStreamEnd");
    } catch (e) {
      this.log("client.realtimeInput", `audioStreamEnd failed: ${e}`);
    }
  }

  /**
   *  send a response to a function call and provide the id of the functions you are responding to
   */
  sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (
      toolResponse.functionResponses &&
      toolResponse.functionResponses.length
    ) {
      this.session?.sendToolResponse({
        functionResponses: toolResponse.functionResponses,
      });
      this.log(`client.toolResponse`, toolResponse);
    }
  }

  /**
   * Send tool response with enhanced validation and error handling
   */
  sendToolResponseSafe(
    toolCall: LiveServerToolCall,
    responses: Array<{ id: string; name: string; response: any }>
  ): boolean {
    try {
      if (!toolCall.functionCalls || toolCall.functionCalls.length === 0) {
        this.log("client.toolResponse", "No function calls to respond to");
        return false;
      }

      const functionResponses = responses.map((response) => ({
        id: response.id,
        name: response.name,
        response: response.response,
      }));

      this.sendToolResponse({ functionResponses });
      return true;
    } catch (error) {
      this.log("client.toolResponse", `Error sending tool response: ${error}`);
      return false;
    }
  }

  /**
   * Create tool responses from tool call in the pattern shown in reference implementation
   */
  createToolResponsesFromCall(
    toolCall: LiveServerToolCall,
    responseData: any = { response: "Tool response handled by client" }
  ): Array<{ id: string; name: string; response: any }> {
    if (!toolCall.functionCalls) {
      return [];
    }

    return toolCall.functionCalls
      .filter((functionCall) => functionCall.id && functionCall.name)
      .map((functionCall) => ({
        id: functionCall.id!,
        name: functionCall.name!,
        response: responseData,
      }));
  }

  /**
   * send normal content parts such as { text }
   */
  send(parts: Part | Part[], turnComplete: boolean = true) {
    this.session?.sendClientContent({ turns: parts, turnComplete });
    this.log(`client.send`, {
      turns: Array.isArray(parts) ? parts : [parts],
      turnComplete,
    });
  }

  /**
   * Start health checking to detect unresponsive connections
   */
  private startHealthCheck() {
    if (this.healthCheckInterval) {
      this.stopHealthCheck();
    }

    this.lastPingTime = Date.now();

    this.healthCheckInterval = window.setInterval(() => {
      const now = Date.now();
      const timeSinceLastMessage = now - this.lastPingTime;

      // If we haven't received any message in the ping interval, check connection health
      if (timeSinceLastMessage > this.PING_INTERVAL) {
        this.checkConnectionHealth();
      }
    }, this.PING_INTERVAL);
  }

  /**
   * Stop health checking
   */
  private stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.pingTimeoutId) {
      clearTimeout(this.pingTimeoutId);
      this.pingTimeoutId = null;
    }
  }

  /**
   * Check connection health by sending a ping-like message
   */
  private checkConnectionHealth() {
    if (this._status !== "connected" || !this.session) {
      return;
    }

    // Send a minimal message to test connection responsiveness
    try {
      this.session.sendClientContent({
        turns: [{ text: "" }],
        turnComplete: false,
      });

      this.log("client.ping", "Health check sent");

      // Set timeout to detect if server doesn't respond
      this.pingTimeoutId = window.setTimeout(() => {
        this.log(
          "client.ping",
          "Health check timeout - connection appears unresponsive"
        );
        this.handleUnresponsiveConnection();
      }, this.PING_TIMEOUT);
    } catch (error) {
      this.log("client.ping", `Health check failed: ${error}`);
      this.handleUnresponsiveConnection();
    }
  }

  /**
   * Handle unresponsive connection by attempting reconnection
   */
  private handleUnresponsiveConnection() {
    this.log(
      "client.reconnect",
      "Connection unresponsive, attempting reconnection"
    );
    this.disconnect();
    this.scheduleReconnect();
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.log("client.reconnect", "Max reconnection attempts reached");
      return;
    }

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.log(
      "client.reconnect",
      `Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimeoutId = window.setTimeout(async () => {
      if (this.config && this._model && this._status === "disconnected") {
        this.log(
          "client.reconnect",
          `Attempting reconnection ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS}`
        );
        const success = await this.connect(this._model, this.config);

        if (!success) {
          this.log(
            "client.reconnect",
            "Reconnection failed, scheduling next attempt"
          );
          this.scheduleReconnect();
        } else {
          this.log("client.reconnect", "Reconnection successful");
        }
      }
    }, delay);
  }

  /**
   * Clear any pending reconnection timeout
   */
  private clearReconnectTimeout() {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Validate that the session is still active and responsive
   */
  public validateSession(): boolean {
    if (!this.session || this._status !== "connected") {
      return false;
    }

    // Check if we've received any messages recently
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastPingTime;

    if (timeSinceLastMessage > this.PING_INTERVAL * 2) {
      this.log("client.session", "Session appears inactive");
      return false;
    }

    return true;
  }

  /**
   * Get collected audio data as WAV buffer
   * This method converts collected audio parts to WAV format
   */
  public getAudioAsWav(mimeType: string): Buffer | null {
    if (this.audioParts.length === 0) {
      return null;
    }

    try {
      return this.convertToWav(this.audioParts, mimeType);
    } catch (error) {
      this.log(
        "client.audioConversion",
        `Failed to convert audio to WAV: ${error}`
      );
      return null;
    }
  }

  /**
   * Clear collected audio parts
   */
  public clearAudioParts(): void {
    this.audioParts = [];
  }

  /**
   * Add message to response queue for processing
   */
  public addToResponseQueue(message: LiveServerMessage): void {
    this.responseQueue.push(message);
  }

  /**
   * Wait for a message from the response queue (similar to reference implementation)
   */
  public async waitMessage(): Promise<LiveServerMessage | undefined> {
    return new Promise((resolve) => {
      const checkQueue = () => {
        const message = this.responseQueue.shift();
        if (message) {
          resolve(message);
        } else {
          setTimeout(checkQueue, 100);
        }
      };
      checkQueue();
    });
  }

  /**
   * Handle a complete turn (collection of messages until turnComplete)
   */
  public async handleTurn(): Promise<LiveServerMessage[]> {
    const turn: LiveServerMessage[] = [];
    let done = false;

    while (!done) {
      const message = await this.waitMessage();
      if (message) {
        turn.push(message);
        if (message.serverContent && message.serverContent.turnComplete) {
          done = true;
        }
      }
    }

    return turn;
  }

  /**
   * Handle tool calls with enhanced logging and processing
   */
  private handleToolCall(toolCall: LiveServerToolCall): void {
    if (toolCall.functionCalls) {
      toolCall.functionCalls.forEach((functionCall) => {
        this.log(
          "server.functionCall",
          `Execute function ${
            functionCall.name
          } with arguments: ${JSON.stringify(functionCall.args)}`
        );
      });

      // Enhanced logging for tool call processing
      this.log(
        "server.toolCall",
        `Received ${toolCall.functionCalls.length} function calls`
      );
    }
  }

  /**
   * Convert raw audio data to WAV format
   */
  private convertToWav(rawData: string[], mimeType: string): Buffer {
    const options = this.parseMimeType(mimeType);
    const dataLength = rawData.reduce((a, b) => a + b.length, 0);
    const wavHeader = this.createWavHeader(dataLength, options);
    const buffer = Buffer.concat(
      rawData.map((data) => Buffer.from(data, "base64"))
    );

    return Buffer.concat([wavHeader, buffer]);
  }

  /**
   * Parse MIME type to extract audio format options
   */
  private parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
    const [_, format] = fileType.split("/");

    const options: Partial<WavConversionOptions> = {
      numChannels: 1,
      bitsPerSample: 16,
    };

    if (format && format.startsWith("L")) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    }

    for (const param of params) {
      const [key, value] = param.split("=").map((s) => s.trim());
      if (key === "rate") {
        options.sampleRate = parseInt(value, 10);
      }
    }

    return options as WavConversionOptions;
  }

  /**
   * Create WAV file header
   */
  private createWavHeader(
    dataLength: number,
    options: WavConversionOptions
  ): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;

    // http://soundfile.sapp.org/doc/WaveFormat
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);

    buffer.write("RIFF", 0); // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
    buffer.write("WAVE", 8); // Format
    buffer.write("fmt ", 12); // Subchunk1ID
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22); // NumChannels
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(byteRate, 28); // ByteRate
    buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
    buffer.write("data", 36); // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size

    return buffer;
  }
}
