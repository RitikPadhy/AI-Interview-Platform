"use client";

import { useCallback, useRef, useState } from "react";

export interface StreamHandlers {
  onDelta?: (text: string) => void;
  onTool?: (name: string) => void;
  onSession?: (sessionId: string) => void;
  onDone?: (fullText: string) => void;
  onError?: (message: string) => void;
}

/** POSTs to /api/chat and consumes the SSE stream it returns. */
export function useClaudeStream() {
  const [running, setRunning] = useState(false);
  const [tool, setTool] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
    setTool(null);
  }, []);

  const send = useCallback(
    async (body: Record<string, unknown>, handlers: StreamHandlers = {}) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setRunning(true);
      setTool(null);

      let full = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const detail = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(detail.error ?? "Request failed.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk.trim();
            if (!line.startsWith("data:")) continue;
            let event: Record<string, string>;
            try {
              event = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }
            if (event.type === "delta") {
              full += event.text;
              handlers.onDelta?.(event.text);
            } else if (event.type === "tool") {
              setTool(event.name);
              handlers.onTool?.(event.name);
            } else if (event.type === "session") {
              handlers.onSession?.(event.sessionId);
            } else if (event.type === "error") {
              handlers.onError?.(event.message);
            }
          }
        }

        handlers.onDone?.(full);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handlers.onError?.((err as Error).message);
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setRunning(false);
        setTool(null);
      }

      return full;
    },
    [],
  );

  return { send, stop, running, tool };
}
