import { readFileSync, existsSync } from "fs";
import { openai, openaiVisionModel } from "./openai";
import { get } from "lodash";

export const analyzeImageDirectly = async (imagePath: string, prompt: string = "What do you see in this image? Describe it in detail."): Promise<string> => {
  if (!openai) {
    console.error("[Vision] OpenAI API key is not set.");
    return "I cannot analyze images - OpenAI API is not configured.";
  }

  if (!imagePath || !existsSync(imagePath)) {
    console.error("[Vision] Image not found:", imagePath);
    return "I cannot find the image to analyze.";
  }

  console.log(`[Vision] Analyzing image: ${imagePath}`);

  try {
    const fileData = readFileSync(imagePath, { encoding: "base64" });

    const response = await openai.chat.completions.create({
      model: openaiVisionModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${fileData}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const content = get(response, "choices[0].message.content", "");
    console.log(`[Vision] Analysis result: ${content}`);
    return content || "I couldn't analyze the image.";
  } catch (error) {
    console.error("[Vision] Error analyzing image:", error);
    return "Failed to analyze the image. Please try again.";
  }
};
