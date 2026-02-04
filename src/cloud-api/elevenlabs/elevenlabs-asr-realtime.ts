import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import {
  ElevenLabsClient,
  RealtimeEvents,
  AudioFormat,
} from "@elevenlabs/elevenlabs-js";
import { elevenlabs, ELEVENLABS_LANGUAGE_CODE } from "./elevenlabs";

// ═══════════════════════════════════════════════════════════════════════════
// COLORED LOGGING FOR ELEVENLABS SCRIBE V2 REALTIME
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

const LOG_PREFIX = `${COLORS.bgMagenta}${COLORS.white}${COLORS.bright} 🎤 SCRIBE ${COLORS.reset}`;

function logScribe(type: "event" | "data" | "error" | "warn" | "info" | "audio", message: string, data?: any) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1); // HH:MM:SS.sss
  const timeStr = `${COLORS.dim}[${timestamp}]${COLORS.reset}`;

  let typeLabel = "";
  switch (type) {
    case "event":
      typeLabel = `${COLORS.bgCyan}${COLORS.black} EVENT ${COLORS.reset}`;
      break;
    case "data":
      typeLabel = `${COLORS.bgGreen}${COLORS.black} DATA  ${COLORS.reset}`;
      break;
    case "error":
      typeLabel = `${COLORS.bgRed}${COLORS.white} ERROR ${COLORS.reset}`;
      break;
    case "warn":
      typeLabel = `${COLORS.bgYellow}${COLORS.black} WARN  ${COLORS.reset}`;
      break;
    case "info":
      typeLabel = `${COLORS.bgBlue}${COLORS.white} INFO  ${COLORS.reset}`;
      break;
    case "audio":
      typeLabel = `${COLORS.bgBlack}${COLORS.white} AUDIO ${COLORS.reset}`;
      break;
  }

  console.log(`${LOG_PREFIX} ${timeStr} ${typeLabel} ${message}`);

  if (data !== undefined) {
    const dataStr = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    const lines = dataStr.split('\n');
    const indent = "                                           "; // Align with message
    lines.forEach(line => {
      console.log(`${COLORS.dim}${indent}│${COLORS.reset} ${COLORS.cyan}${line}${COLORS.reset}`);
    });
  }
}

function logSeparator(label?: string) {
  const line = "═".repeat(60);
  if (label) {
    console.log(`${COLORS.magenta}╔${line}╗${COLORS.reset}`);
    console.log(`${COLORS.magenta}║${COLORS.reset} ${COLORS.bright}${label}${COLORS.reset}`);
    console.log(`${COLORS.magenta}╚${line}╝${COLORS.reset}`);
  } else {
    console.log(`${COLORS.dim}${"─".repeat(70)}${COLORS.reset}`);
  }
}

export interface RealtimeASRSession extends EventEmitter {
  start(): void;
  stop(): Promise<string>;
  sendAudioChunk(chunk: Buffer): void;
}

export class ElevenLabsRealtimeASR extends EventEmitter implements RealtimeASRSession {
  private connection: any = null;
  private recordingProcess: ChildProcess | null = null;
  private finalTranscript: string = "";
  private partialTranscript: string = "";
  private isConnected: boolean = false;
  private resolveStop: ((value: string) => void) | null = null;
  private audioChunkCount: number = 0;
  private totalAudioBytes: number = 0;

  // Audio buffering for capturing speech during WebSocket connection
  private audioBuffer: Buffer[] = [];
  private bufferedChunkCount: number = 0;
  private bufferedBytes: number = 0;

  constructor() {
    super();
  }

  async start(): Promise<void> {
    if (!elevenlabs) {
      logScribe("error", "ElevenLabs API key is not set!");
      return;
    }

    this.finalTranscript = "";
    this.partialTranscript = "";
    this.audioChunkCount = 0;
    this.totalAudioBytes = 0;
    this.audioBuffer = [];
    this.bufferedChunkCount = 0;
    this.bufferedBytes = 0;

    logSeparator("ELEVENLABS SCRIBE V2 REALTIME - SESSION START");

    // START RECORDING IMMEDIATELY - don't wait for WebSocket!
    logScribe("info", "🎙️ Starting audio recording IMMEDIATELY (will buffer until WebSocket ready)");
    this.startRecording();

    logScribe("info", "Connecting to ElevenLabs WebSocket in parallel...", {
      model: "scribe_v2_realtime",
      audioFormat: "PCM_16000",
      sampleRate: 16000,
      languageCode: ELEVENLABS_LANGUAGE_CODE || "(auto-detect)",
    });

    try {
      // Connect to realtime WebSocket (recording is already happening!)
      this.connection = await elevenlabs.speechToText.realtime.connect({
        modelId: "scribe_v2_realtime",
        audioFormat: AudioFormat.PCM_16000,
        sampleRate: 16000,
        ...(ELEVENLABS_LANGUAGE_CODE && { languageCode: ELEVENLABS_LANGUAGE_CODE }),
      });

      // Log ALL raw WebSocket events for debugging
      this.connection.on(RealtimeEvents.SESSION_STARTED, (data: any) => {
        logScribe("event", "SESSION_STARTED received", data);
        this.isConnected = true;

        // FLUSH THE BUFFER - send all audio captured during connection!
        this.flushAudioBuffer();

        this.emit("connected");
      });

      this.connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data: any) => {
        const text = data.text || "";
        const textPreview = text.length > 50 ? text.slice(0, 50) + "..." : text;
        logScribe("data", `PARTIAL_TRANSCRIPT: "${textPreview}"`, {
          text: data.text,
          textLength: text.length,
          rawData: data,
        });
        this.partialTranscript = text;
        this.emit("partial", this.partialTranscript);
      });

      this.connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data: any) => {
        this.finalTranscript = data.text || "";
        logSeparator();
        logScribe("event", "🎯 COMMITTED_TRANSCRIPT received!", {
          text: this.finalTranscript,
          textLength: this.finalTranscript.length,
          rawData: data,
        });
        logSeparator();
        this.emit("final", this.finalTranscript);

        if (this.resolveStop) {
          logScribe("info", "Resolving stop() promise with committed transcript");
          this.resolveStop(this.finalTranscript);
          this.resolveStop = null;
        }
      });

      this.connection.on(RealtimeEvents.ERROR, (error: any) => {
        logScribe("error", "WebSocket ERROR event", error);
        this.emit("error", error);
      });

      this.connection.on(RealtimeEvents.CLOSE, () => {
        logScribe("event", "WebSocket CLOSE event - connection closed");
        logScribe("info", `Session stats: ${this.audioChunkCount} chunks, ${this.totalAudioBytes} bytes sent (${this.bufferedChunkCount} were buffered)`);
        this.isConnected = false;
        this.emit("closed");
      });

      logScribe("info", "WebSocket connection established, waiting for SESSION_STARTED...");

    } catch (error) {
      logScribe("error", "Failed to connect to ElevenLabs realtime", error);
      this.emit("error", error);
    }
  }

  private startRecording(): void {
    logScribe("info", "Starting audio recording with sox", {
      format: "PCM 16-bit signed",
      sampleRate: "16000 Hz",
      channels: "mono",
      device: "alsa default",
    });

    // Record raw PCM audio at 16kHz, mono, 16-bit
    this.recordingProcess = spawn("sox", [
      "-t", "alsa", "default",
      "-t", "raw",
      "-c", "1",
      "-r", "16000",
      "-b", "16",
      "-e", "signed-integer",
      "-",  // output to stdout
    ]);

    this.recordingProcess.stdout?.on("data", (chunk: Buffer) => {
      this.sendAudioChunk(chunk);
    });

    this.recordingProcess.stderr?.on("data", (data) => {
      // Sox outputs info to stderr, ignore unless it's an error
      const msg = data.toString();
      if (msg.includes("FAIL") || msg.includes("error")) {
        logScribe("error", "Recording error from sox", msg);
      }
    });

    this.recordingProcess.on("error", (err) => {
      logScribe("error", "Recording process error", err);
      this.emit("error", err);
    });

    logScribe("info", "🎙️ Recording started - buffering audio until WebSocket is ready");
  }

  private flushAudioBuffer(): void {
    if (this.audioBuffer.length === 0) {
      logScribe("info", "No buffered audio to flush");
      return;
    }

    logScribe("info", `📤 Flushing ${this.audioBuffer.length} buffered audio chunks (${this.bufferedBytes} bytes)...`);

    for (const chunk of this.audioBuffer) {
      try {
        const base64Audio = chunk.toString("base64");
        this.connection.send({
          audioBase64: base64Audio,
          sampleRate: 16000,
        });
        this.audioChunkCount++;
        this.totalAudioBytes += chunk.length;
      } catch (error) {
        logScribe("error", "Error sending buffered audio chunk", error);
      }
    }

    logScribe("info", `✅ Buffer flushed! Now streaming live audio directly`);
    this.audioBuffer = []; // Clear the buffer
  }

  sendAudioChunk(chunk: Buffer): void {
    if (this.connection && this.isConnected) {
      // WebSocket is ready - send directly
      try {
        this.audioChunkCount++;
        this.totalAudioBytes += chunk.length;

        const base64Audio = chunk.toString("base64");
        this.connection.send({
          audioBase64: base64Audio,
          sampleRate: 16000,
        });

        // Log audio stats every 50 chunks (~1.6 seconds of audio at typical chunk sizes)
        if (this.audioChunkCount % 50 === 0) {
          logScribe("audio", `Streaming... chunks: ${this.audioChunkCount}, bytes: ${this.totalAudioBytes}, partial: "${this.partialTranscript.slice(-30)}..."`);
        }
      } catch (error) {
        logScribe("error", "Error sending audio chunk", error);
      }
    } else {
      // WebSocket not ready yet - BUFFER the audio!
      this.audioBuffer.push(chunk);
      this.bufferedChunkCount++;
      this.bufferedBytes += chunk.length;

      // Log buffering progress every 10 chunks
      if (this.bufferedChunkCount % 10 === 0) {
        logScribe("audio", `⏳ Buffering audio while connecting... ${this.bufferedChunkCount} chunks, ${this.bufferedBytes} bytes`);
      }
    }
  }

  async stop(): Promise<string> {
    return new Promise((resolve) => {
      logSeparator("STOP REQUESTED - BUTTON RELEASED");
      logScribe("info", "Stop called - waiting 300ms for final audio before commit", {
        audioChunksSent: this.audioChunkCount,
        totalBytesSent: this.totalAudioBytes,
        bufferedChunks: this.bufferedChunkCount,
        bufferedBytes: this.bufferedBytes,
        currentPartialTranscript: this.partialTranscript,
        currentFinalTranscript: this.finalTranscript,
        isConnected: this.isConnected,
      });

      this.resolveStop = resolve;

      // Wait 300ms to capture trailing audio, then stop and commit
      // This gives ElevenLabs time to process the final word boundaries
      setTimeout(() => {
        this.stopAndCommit();
      }, 300);
    });
  }

  private stopAndCommit(): void {
    logScribe("info", "300ms delay complete, now stopping recording...");

    // Stop recording
    if (this.recordingProcess) {
      logScribe("info", "Stopping sox recording process...");
      try {
        this.recordingProcess.kill("SIGINT");
      } catch (e) {
        logScribe("warn", "Error killing recording process", e);
      }
      this.recordingProcess = null;
      logScribe("info", "Recording process stopped");
    }

    // Commit the transcription
    if (this.connection && this.isConnected) {
      try {
        logScribe("event", "📤 Sending COMMIT to ElevenLabs WebSocket...");
        logScribe("info", "Waiting for COMMITTED_TRANSCRIPT response (3s timeout)...");
        this.connection.commit();

        // Set a timeout in case commit response doesn't come
        setTimeout(() => {
          if (this.resolveStop) {
            logSeparator();
            logScribe("warn", "⏰ TIMEOUT! No COMMITTED_TRANSCRIPT received after 3 seconds", {
              usingPartialTranscript: this.partialTranscript,
              finalTranscriptWas: this.finalTranscript,
              willReturn: this.partialTranscript || this.finalTranscript,
            });
            logSeparator();
            this.resolveStop(this.partialTranscript || this.finalTranscript);
            this.resolveStop = null;
            this.cleanup();
          }
        }, 3000);
      } catch (error) {
        logScribe("error", "Error calling commit()", error);
        logScribe("warn", "Falling back to partial transcript", this.partialTranscript);
        if (this.resolveStop) {
          this.resolveStop(this.partialTranscript || "");
          this.resolveStop = null;
        }
        this.cleanup();
      }
    } else {
      logScribe("warn", "No connection available for commit!", {
        hasConnection: !!this.connection,
        isConnected: this.isConnected,
      });
      if (this.resolveStop) {
        this.resolveStop("");
        this.resolveStop = null;
      }
      this.cleanup();
    }
  }

  private cleanup(): void {
    logScribe("info", "Cleaning up WebSocket connection...");
    if (this.connection) {
      try {
        this.connection.close();
        logScribe("info", "WebSocket connection closed");
      } catch (e) {
        logScribe("warn", "Error closing connection", e);
      }
      this.connection = null;
    }
    this.isConnected = false;
    logSeparator("SESSION ENDED");
  }
}

// Factory function to create a realtime ASR session
export function createRealtimeASRSession(): RealtimeASRSession {
  return new ElevenLabsRealtimeASR();
}
