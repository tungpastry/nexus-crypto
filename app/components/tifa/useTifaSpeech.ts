"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  pickVietnameseVoice,
  stripMarkdownForSpeech,
  type TifaSpeechVoice,
} from "./tifaSpeech";

// Speech backend adapter. Today this wraps the browser Web Speech API
// (free, no server cost); a future server Piper endpoint can replace the
// internals of speak/stop without touching components.

function readEngineVoices(): TifaSpeechVoice[] {
  if (typeof window === "undefined") return [];
  const synth = window.speechSynthesis;
  if (!synth) return [];
  try {
    return synth
      .getVoices()
      .map((voice) => ({ lang: voice.lang || "", name: voice.name || "" }));
  } catch {
    return [];
  }
}

function findEngineVoice(
  wanted: TifaSpeechVoice | null
): SpeechSynthesisVoice | null {
  if (!wanted || typeof window === "undefined") return null;
  const synth = window.speechSynthesis;
  if (!synth) return null;
  try {
    return (
      synth
        .getVoices()
        .find((voice) => voice.lang === wanted.lang && voice.name === wanted.name) ||
      null
    );
  } catch {
    return null;
  }
}

export function useTifaSpeech() {
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.speechSynthesis !== "undefined"
  );
  const [speaking, setSpeaking] = useState(false);
  const [hasVietnameseVoice, setHasVietnameseVoice] = useState(false);
  const voicesRef = useRef<TifaSpeechVoice[]>([]);
  const onEndRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!supported) return;

    const refresh = () => {
      const voices = readEngineVoices();
      voicesRef.current = voices;
      setHasVietnameseVoice(pickVietnameseVoice(voices) !== null);
    };

    refresh();
    const synth = window.speechSynthesis;
    synth.addEventListener?.("voiceschanged", refresh);
    return () => {
      synth.removeEventListener?.("voiceschanged", refresh);
      try {
        synth.cancel();
      } catch {
        // ignore cleanup errors
      }
      setSpeaking(false);
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
    onEndRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (rawText: string, onEnd?: () => void) => {
      if (typeof window === "undefined") return false;
      const synth = window.speechSynthesis;
      if (!synth) return false;

      const text = stripMarkdownForSpeech(rawText);
      if (!text) return false;

      try {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const wanted = pickVietnameseVoice(voicesRef.current);
        const engineVoice = findEngineVoice(wanted);
        if (engineVoice) utterance.voice = engineVoice;
        utterance.lang = wanted?.lang || "vi-VN";
        utterance.rate = 1;
        onEndRef.current = onEnd || null;
        utterance.onend = () => {
          setSpeaking(false);
          onEndRef.current?.();
          onEndRef.current = null;
        };
        utterance.onerror = () => {
          setSpeaking(false);
          onEndRef.current = null;
        };
        synth.speak(utterance);
        setSpeaking(true);
        return true;
      } catch {
        setSpeaking(false);
        return false;
      }
    },
    []
  );

  return { supported, speaking, hasVietnameseVoice, speak, stop };
}
