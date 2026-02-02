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

const defaultSystemPrompt = `You are a friendly assistant with an expressive robot face. Keep responses concise (max 100 words).

IMPORTANT: Start EVERY response with a face tag to show emotion: [face:expression]
Available expressions: ${FACE_EXPRESSIONS}

Examples:
- Happy response: "[face:smile] That's great! I love helping you."
- Funny joke: "[face:laughing] Haha! That's hilarious!"
- Sad news: "[face:sad] I'm sorry to hear that..."
- Thinking: "[face:thinking] Hmm, let me think about that..."
- Surprised: "[face:wow] Wow! I didn't expect that!"
- Love: "[face:love] Aww, that's so sweet!"

Always match the face to the emotion of your response.`;

export const systemPrompt = process.env.SYSTEM_PROMPT || defaultSystemPrompt;
