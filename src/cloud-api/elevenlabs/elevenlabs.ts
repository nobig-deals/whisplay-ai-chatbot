import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.ELEVENLABS_API_KEY;

export const elevenlabs = apiKey ? new ElevenLabsClient({ apiKey }) : null;

// ASR (Speech-to-Text) settings
// Default model for Scribe
export const ELEVENLABS_SCRIBE_MODEL =
  process.env.ELEVENLABS_SCRIBE_MODEL || "scribe_v1";

// Optional language code (e.g., "en", "de", "es")
// If not set, ElevenLabs will auto-detect the language
export const ELEVENLABS_LANGUAGE_CODE =
  process.env.ELEVENLABS_LANGUAGE_CODE || undefined;

// TTS (Text-to-Speech) settings
// Voice ID - default is "Rachel" (21m00Tcm4TlvDq8ikWAM)
// Find more voices at: https://elevenlabs.io/app/voice-library
export const ELEVENLABS_VOICE_ID =
  process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

// TTS Model - eleven_multilingual_v2 supports 29 languages
// Options: eleven_multilingual_v2, eleven_turbo_v2_5, eleven_monolingual_v1
export const ELEVENLABS_TTS_MODEL =
  process.env.ELEVENLABS_TTS_MODEL || "eleven_multilingual_v2";

// Output format - mp3_44100_128 is good quality/size balance
export const ELEVENLABS_OUTPUT_FORMAT =
  process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";
