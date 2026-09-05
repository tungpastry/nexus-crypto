// Pure, DOM-free helpers for Tifa text-to-speech.
// The actual speech backend (Web Speech API now, server Piper later) is
// hidden behind useTifaSpeech so components never touch it directly.

export type TifaSpeechVoice = {
  lang: string;
  name: string;
};

// Keep assistant answers listenable: Tifa replies are markdown-heavy
// (bullets, bold, code). Speech engines read raw markup aloud, so strip it
// while preserving Vietnamese diacritics and sentence flow.
export function stripMarkdownForSpeech(input: string): string {
  if (!input) return "";

  return (
    input
      // fenced code blocks -> keep inner text only
      .replace(/```[\s\S]*?```/g, (block) =>
        block
          .replace(/```\w*\n?/, "")
          .replace(/```$/, "")
      )
      // line-level markup first (before inline emphasis can eat markers)
      // headings
      .replace(/^#{1,6}\s+/gm, "")
      // list markers and blockquotes at line start
      .replace(/^\s*(>\s*|[-*+]\s+|\d+[.)]\s+)/gm, "")
      // horizontal rules
      .replace(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/gm, "")
      // inline code
      .replace(/`([^`]+)`/g, "$1")
      // images ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // bold / italic / strikethrough
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/~~(.*?)~~/g, "$1")
      // collapse whitespace
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

// Prefer a Vietnamese voice: exact vi-VN first, then any vi-*, else null
// (caller falls back to the engine default and should warn the user).
export function pickVietnameseVoice(
  voices: TifaSpeechVoice[]
): TifaSpeechVoice | null {
  if (!voices.length) return null;

  const byLang = (lang: string) =>
    voices.find((voice) => voice.lang.toLowerCase() === lang);
  const byPrefix = (prefix: string) =>
    voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix));

  return byLang("vi-vn") || byPrefix("vi") || null;
}
