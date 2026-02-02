require("dotenv").config();

// default 5 minutes
export const CHAT_HISTORY_RESET_TIME = parseInt(process.env.CHAT_HISTORY_RESET_TIME || "300" , 10) * 1000; // convert to milliseconds

export let lastMessageTime = 0;

export const updateLastMessageTime = (): void => {
  lastMessageTime = Date.now();
}

export const shouldResetChatHistory = (): boolean => {
  return Date.now() - lastMessageTime > CHAT_HISTORY_RESET_TIME;
}

// Available face expressions for the robot display
const FACE_EXPRESSIONS = [
  "smile", "happy", "laughing", "love", "heart", "kiss", "cool", "party",  // positive
  "thinking", "hmm", "confused",  // thinking
  "surprised", "astonished", "wow",  // surprise
  "sad", "cry", "sob",  // sad
  "angry", "rage",  // angry
  "sleep", "tired",  // sleep
  "grimace", "awkward", "sneeze", "sick", "dizzy", "hypnotized", "robot", "poop"  // other
].join(", ");

// Face instructions that get appended to any system prompt
const faceInstructions = `

IMPORTANT: Start EVERY response with a face tag to show your emotion: [face:expression]
Available faces: ${FACE_EXPRESSIONS}
Examples: "[face:smile] Hello!", "[face:laughing] That's funny!", "[face:sad] Sorry to hear that.", "[face:thinking] Let me think..."
Always match the face to your response emotion.`;

const defaultSystemPrompt = `You are a friendly assistant. Keep responses concise (max 100 words). Use emoji.`;

// Always append face instructions to ensure AI uses face tags
export const systemPrompt = (process.env.SYSTEM_PROMPT || defaultSystemPrompt) + faceInstructions;
