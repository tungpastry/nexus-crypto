import { describe, expect, it } from "vitest";
import {
  pickVietnameseVoice,
  stripMarkdownForSpeech,
} from "./tifaSpeech";

describe("tifa speech helpers", () => {
  describe("stripMarkdownForSpeech", () => {
    it("returns empty for empty input", () => {
      expect(stripMarkdownForSpeech("")).toBe("");
    });

    it("strips bullets, bold and headings but keeps Vietnamese", () => {
      const input =
        "## Tóm tắt\n- **BTC** đạt điểm 78.\n* Trạng thái *Ready*.";
      const output = stripMarkdownForSpeech(input);
      expect(output).toContain("Tóm tắt");
      expect(output).toContain("BTC đạt điểm 78.");
      expect(output).toContain("Trạng thái Ready.");
      expect(output).not.toContain("*");
      expect(output).not.toContain("#");
    });

    it("keeps code content without fences and links as text", () => {
      const output = stripMarkdownForSpeech(
        "Dùng `SMA20` và xem [docs](https://example.com/a) nhé."
      );
      expect(output).toBe("Dùng SMA20 và xem docs nhé.");
    });

    it("strips numbered lists and blockquotes", () => {
      const output = stripMarkdownForSpeech(
        "> Lưu ý:\n1. Quan sát ATR.\n2) Kiểm tra volume."
      );
      expect(output).toContain("Lưu ý:");
      expect(output).toContain("Quan sát ATR.");
      expect(output).not.toMatch(/^\d+[.)]/m);
      expect(output).not.toContain(">");
    });

    it("collapses excess whitespace", () => {
      expect(stripMarkdownForSpeech("a   b\n\n\nc")).toBe("a b\n\nc");
    });
  });

  describe("pickVietnameseVoice", () => {
    it("returns null when no voices", () => {
      expect(pickVietnameseVoice([])).toBeNull();
    });

    it("prefers exact vi-VN over other vi voices", () => {
      const voices = [
        { lang: "vi", name: "Vietnamese" },
        { lang: "en-US", name: "English" },
        { lang: "vi-VN", name: "Google Tiếng Việt" },
      ];
      expect(pickVietnameseVoice(voices)?.name).toBe("Google Tiếng Việt");
    });

    it("falls back to any vi voice, case-insensitive", () => {
      const voices = [
        { lang: "en-US", name: "English" },
        { lang: "VI", name: "Vietnamese" },
      ];
      expect(pickVietnameseVoice(voices)?.name).toBe("Vietnamese");
    });

    it("returns null when no Vietnamese voice exists", () => {
      expect(
        pickVietnameseVoice([{ lang: "en-US", name: "English" }])
      ).toBeNull();
    });
  });
});
