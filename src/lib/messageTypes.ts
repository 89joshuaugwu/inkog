export interface MessageTypeConfig {
  key: string;
  title: string;
  prompt: string;
  placeholder: string;
  emoji: string;
  badgeColor: string;
  badgeBorder: string;
  badgeLabel: string;
  preText?: string;
  minChars?: number;
  validation?: "exactWords3" | "hasRating";
  inputType?: "text" | "textarea";
}

export const MESSAGE_TYPES: Record<string, MessageTypeConfig> = {
  general: {
    key: "general",
    title: "Anonymous Message",
    prompt: "Send me an anonymous message",
    placeholder: "Say anything... 👻",
    emoji: "👻",
    badgeColor: "rgba(139, 92, 246, 0.15)",
    badgeBorder: "rgba(139, 92, 246, 0.4)",
    badgeLabel: "General",
  },
  rate: {
    key: "rate",
    title: "Rate Me",
    prompt: "Rate me out of 10 and explain why",
    placeholder: "7/10 because...",
    emoji: "⭐",
    badgeColor: "rgba(6, 182, 212, 0.15)",
    badgeBorder: "rgba(6, 182, 212, 0.4)",
    badgeLabel: "Rate",
    validation: "hasRating",
    minChars: 5,
  },
  describe: {
    key: "describe",
    title: "Describe Me",
    prompt: "Describe me in exactly 3 words",
    placeholder: "Word1 Word2 Word3",
    emoji: "📝",
    badgeColor: "rgba(139, 92, 246, 0.15)",
    badgeBorder: "rgba(139, 92, 246, 0.4)",
    badgeLabel: "Describe",
    validation: "exactWords3",
    inputType: "text",
  },
  confess: {
    key: "confess",
    title: "Confess",
    prompt: "Confess something to me anonymously 🤫",
    placeholder: "I've always wanted to tell you...",
    emoji: "🤫",
    badgeColor: "rgba(139, 92, 246, 0.15)",
    badgeBorder: "rgba(139, 92, 246, 0.4)",
    badgeLabel: "Confess",
    minChars: 10,
  },
  ship: {
    key: "ship",
    title: "Ship Me",
    prompt: "Who would you ship me with and why? 💘",
    placeholder: "I'd ship you with...",
    emoji: "💘",
    badgeColor: "rgba(236, 72, 153, 0.15)",
    badgeBorder: "rgba(236, 72, 153, 0.4)",
    badgeLabel: "Ship",
  },
  surgery: {
    key: "surgery",
    title: "Surgery Me",
    prompt: "What would you add, remove, or fix about me? 😅",
    placeholder: "I'd add... / I'd remove... / I'd fix...",
    emoji: "😅",
    badgeColor: "rgba(139, 92, 246, 0.15)",
    badgeBorder: "rgba(139, 92, 246, 0.4)",
    badgeLabel: "Surgery",
  },
  savage: {
    key: "savage",
    title: "Savage Me",
    prompt: "Say the most savage honest thing about me 😈",
    placeholder: "No filter — go ahead...",
    emoji: "😈",
    badgeColor: "rgba(239, 68, 68, 0.15)",
    badgeBorder: "rgba(239, 68, 68, 0.4)",
    badgeLabel: "Savage",
  },
  db: {
    key: "db",
    title: "Deal Breaker",
    prompt: "They're a 10 but... (finish this about me)",
    placeholder: "",
    preText: "They're a 10 but ",
    emoji: "🚩",
    badgeColor: "rgba(239, 68, 68, 0.15)",
    badgeBorder: "rgba(239, 68, 68, 0.4)",
    badgeLabel: "Deal Breaker",
    minChars: 5,
  },
  gbas: {
    key: "gbas",
    title: "Hot Take",
    prompt: "Drop a hot take about me. No filter 🌶️",
    placeholder: "Unpopular opinion: you...",
    emoji: "🌶️",
    badgeColor: "rgba(239, 68, 68, 0.15)",
    badgeBorder: "rgba(239, 68, 68, 0.4)",
    badgeLabel: "Hot Take",
  },
  crush: {
    key: "crush",
    title: "Crush",
    prompt: "Do you have a crush on me? Confess it 👀",
    placeholder: "Okay fine... yes/no because...",
    emoji: "👀",
    badgeColor: "rgba(236, 72, 153, 0.15)",
    badgeBorder: "rgba(236, 72, 153, 0.4)",
    badgeLabel: "Crush",
  },
};

export function getMessageType(type?: string): MessageTypeConfig {
  if (!type || !MESSAGE_TYPES[type]) return MESSAGE_TYPES.general;
  return MESSAGE_TYPES[type];
}

export function getAvailableTypes(): MessageTypeConfig[] {
  return Object.values(MESSAGE_TYPES);
}
