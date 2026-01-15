import mp3Duration from "mp3-duration";
import { TTSResult } from "../../type";
import {
  elevenlabs,
  ELEVENLABS_VOICE_ID,
  ELEVENLABS_TTS_MODEL,
  ELEVENLABS_OUTPUT_FORMAT,
} from "./elevenlabs";
import type { TextToSpeechConvertRequestOutputFormat } from "@elevenlabs/elevenlabs-js/api";

const elevenlabsTTS = async (text: string): Promise<TTSResult> => {
  if (!elevenlabs) {
    console.error("ElevenLabs API key is not set.");
    return { duration: 0 };
  }

  try {
    const audioStream = await elevenlabs.textToSpeech.convert(
      ELEVENLABS_VOICE_ID,
      {
        text,
        modelId: ELEVENLABS_TTS_MODEL,
        outputFormat: ELEVENLABS_OUTPUT_FORMAT as TextToSpeechConvertRequestOutputFormat,
      }
    );

    // Convert the stream to a Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Calculate duration from the mp3 buffer
    const duration = await mp3Duration(buffer);

    console.log(`ElevenLabs TTS generated ${buffer.length} bytes, ${duration}s`);
    return { buffer, duration: duration * 1000 };
  } catch (error) {
    console.error("ElevenLabs TTS failed:", error);
    return { duration: 0 };
  }
};

export default elevenlabsTTS;
