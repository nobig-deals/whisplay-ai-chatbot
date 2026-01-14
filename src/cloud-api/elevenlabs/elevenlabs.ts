import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.ELEVENLABS_API_KEY;

export const elevenlabs = apiKey ? new ElevenLabsClient({ apiKey }) : null;

// Default model for Scribe v2
export const ELEVENLABS_SCRIBE_MODEL =
  process.env.ELEVENLABS_SCRIBE_MODEL || "scribe_v1";

// Optional language code (e.g., "en", "de", "es")
// If not set, ElevenLabs will auto-detect the language
export const ELEVENLABS_LANGUAGE_CODE =
  process.env.ELEVENLABS_LANGUAGE_CODE || undefined;
