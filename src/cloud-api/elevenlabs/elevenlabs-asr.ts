import fs from "fs";
import {
  elevenlabs,
  ELEVENLABS_SCRIBE_MODEL,
  ELEVENLABS_LANGUAGE_CODE,
} from "./elevenlabs";

export const recognizeAudio = async (
  audioFilePath: string
): Promise<string> => {
  if (!elevenlabs) {
    console.error("ElevenLabs API key is not set.");
    return "";
  }

  if (!fs.existsSync(audioFilePath)) {
    console.error("Audio file does not exist:", audioFilePath);
    return "";
  }

  try {
    const transcription = await elevenlabs.speechToText.convert({
      file: fs.createReadStream(audioFilePath),
      modelId: ELEVENLABS_SCRIBE_MODEL,
      ...(ELEVENLABS_LANGUAGE_CODE && { languageCode: ELEVENLABS_LANGUAGE_CODE }),
    });

    // Handle both single-channel and multi-channel responses
    let text = "";
    if ("text" in transcription) {
      text = transcription.text;
    } else if ("transcripts" in transcription && transcription.transcripts?.length > 0) {
      // Multi-channel response - concatenate all transcripts
      text = transcription.transcripts.map((t) => t.text).join(" ");
    }

    console.log("ElevenLabs transcription result:", text);
    return text || "";
  } catch (error) {
    console.error("ElevenLabs audio recognition failed:", error);
    return "";
  }
};
