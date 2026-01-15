import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import {
  ElevenLabsClient,
  RealtimeEvents,
  AudioFormat,
} from "@elevenlabs/elevenlabs-js";
import { elevenlabs, ELEVENLABS_LANGUAGE_CODE } from "./elevenlabs";

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

  constructor() {
    super();
  }

  async start(): Promise<void> {
    if (!elevenlabs) {
      console.error("ElevenLabs API key is not set.");
      return;
    }

    this.finalTranscript = "";
    this.partialTranscript = "";

    try {
      // Connect to realtime WebSocket
      this.connection = await elevenlabs.speechToText.realtime.connect({
        modelId: "scribe_v2_realtime",
        audioFormat: AudioFormat.PCM_16000,
        sampleRate: 16000,
        ...(ELEVENLABS_LANGUAGE_CODE && { languageCode: ELEVENLABS_LANGUAGE_CODE }),
      });

      this.connection.on(RealtimeEvents.SESSION_STARTED, (data: any) => {
        console.log("ElevenLabs realtime session started");
        this.isConnected = true;
        this.emit("connected");
        this.startRecording();
      });

      this.connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data: any) => {
        this.partialTranscript = data.text || "";
        this.emit("partial", this.partialTranscript);
      });

      this.connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data: any) => {
        this.finalTranscript = data.text || "";
        console.log("ElevenLabs committed transcript:", this.finalTranscript);
        this.emit("final", this.finalTranscript);

        if (this.resolveStop) {
          this.resolveStop(this.finalTranscript);
          this.resolveStop = null;
        }
      });

      this.connection.on(RealtimeEvents.ERROR, (error: any) => {
        console.error("ElevenLabs realtime error:", error);
        this.emit("error", error);
      });

      this.connection.on(RealtimeEvents.CLOSE, () => {
        console.log("ElevenLabs realtime connection closed");
        this.isConnected = false;
        this.emit("closed");
      });

    } catch (error) {
      console.error("Failed to connect to ElevenLabs realtime:", error);
      this.emit("error", error);
    }
  }

  private startRecording(): void {
    const soundCardIndex = process.env.SOUND_CARD_INDEX || "1";

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
        console.error("Recording error:", msg);
      }
    });

    this.recordingProcess.on("error", (err) => {
      console.error("Recording process error:", err);
      this.emit("error", err);
    });

    console.log("Started streaming audio to ElevenLabs");
  }

  sendAudioChunk(chunk: Buffer): void {
    if (this.connection && this.isConnected) {
      try {
        const base64Audio = chunk.toString("base64");
        this.connection.send({
          audioBase64: base64Audio,
          sampleRate: 16000,
        });
      } catch (error) {
        console.error("Error sending audio chunk:", error);
      }
    }
  }

  async stop(): Promise<string> {
    return new Promise((resolve) => {
      this.resolveStop = resolve;

      // Stop recording
      if (this.recordingProcess) {
        try {
          this.recordingProcess.kill("SIGINT");
        } catch (e) {}
        this.recordingProcess = null;
      }

      // Commit the transcription
      if (this.connection && this.isConnected) {
        try {
          this.connection.commit();

          // Set a timeout in case commit response doesn't come
          setTimeout(() => {
            if (this.resolveStop) {
              console.log("Timeout waiting for final transcript, using partial");
              this.resolveStop(this.partialTranscript || this.finalTranscript);
              this.resolveStop = null;
              this.cleanup();
            }
          }, 3000);
        } catch (error) {
          console.error("Error committing transcription:", error);
          resolve(this.partialTranscript || "");
          this.cleanup();
        }
      } else {
        resolve("");
        this.cleanup();
      }
    });
  }

  private cleanup(): void {
    if (this.connection) {
      try {
        this.connection.close();
      } catch (e) {}
      this.connection = null;
    }
    this.isConnected = false;
  }
}

// Factory function to create a realtime ASR session
export function createRealtimeASRSession(): RealtimeASRSession {
  return new ElevenLabsRealtimeASR();
}
