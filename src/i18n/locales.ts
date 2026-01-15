export interface Locale {
  // Status texts
  idle: string;
  listening: string;
  recognizing: string;
  answering: string;
  thinking: string;

  // UI texts
  listeningText: string;
  pressButtonText: string;
  pressButtonWithCameraText: string;
  waitingForMessage: string;
  hello: string;
}

export const locales: Record<string, Locale> = {
  en: {
    idle: "idle",
    listening: "listening",
    recognizing: "recognizing",
    answering: "answering",
    thinking: "Thinking",

    listeningText: "Listening...",
    pressButtonText: "Long Press the button to say something.",
    pressButtonWithCameraText: "Long Press the button to say something,\ndouble click to launch camera.",
    waitingForMessage: "Waiting for message...",
    hello: "Hello",
  },

  cs: {
    idle: "nečinný",
    listening: "naslouchám",
    recognizing: "rozpoznávám",
    answering: "odpovídám",
    thinking: "Přemýšlím",

    listeningText: "Poslouchám...",
    pressButtonText: "Dlouze stiskni tlačítko pro mluvení.",
    pressButtonWithCameraText: "Dlouze stiskni tlačítko pro mluvení,\ndvojklik pro kameru.",
    waitingForMessage: "Čekám na zprávu...",
    hello: "Ahoj",
  },

  de: {
    idle: "Leerlauf",
    listening: "Zuhören",
    recognizing: "Erkennung",
    answering: "Antworten",
    thinking: "Denken",

    listeningText: "Ich höre zu...",
    pressButtonText: "Lange drücken zum Sprechen.",
    pressButtonWithCameraText: "Lange drücken zum Sprechen,\nDoppelklick für Kamera.",
    waitingForMessage: "Warte auf Nachricht...",
    hello: "Hallo",
  },
};

export type LocaleKey = keyof Locale;
