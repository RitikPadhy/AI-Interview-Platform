"use client";

import { useCallback, useRef, useState } from "react";
import { useClaudeStream } from "@/lib/useClaudeStream";

export interface StageDef {
  id: string;
  label: string;
  blurb: string;
}

/**
 * Runs a chain of prompts as one Claude conversation: pass 1 opens the session,
 * every later pass resumes it, so each one can see what the last one produced.
 * Streams into a separate buffer per pass so the UI can show the work as it
 * happens rather than one wall of text at the end.
 */
export function useStagedRun(stages: readonly StageDef[]) {
  const [outputs, setOutputs] = useState<string[]>(() => stages.map(() => ""));
  const [active, setActive] = useState(-1);
  const [finished, setFinished] = useState(false);
  const { send, stop: stopStream, running, tool } = useClaudeStream();
  const sessionRef = useRef<string | null>(null);
  const cancelRef = useRef(false);

  const stop = useCallback(() => {
    cancelRef.current = true;
    stopStream();
    setActive(-1);
  }, [stopStream]);

  const run = useCallback(
    async (base: Record<string, unknown>) => {
      cancelRef.current = false;
      sessionRef.current = null;
      setOutputs(stages.map(() => ""));
      setFinished(false);

      for (let i = 0; i < stages.length; i++) {
        if (cancelRef.current) break;
        setActive(i);
        let failed = false;

        await send(
          i === 0 ? { ...base, stage: 0 } : { ...base, stage: i, sessionId: sessionRef.current },
          {
            onSession: (id) => {
              sessionRef.current = id;
            },
            onDelta: (delta) =>
              setOutputs((prev) => {
                const next = [...prev];
                next[i] += delta;
                return next;
              }),
            onError: (message) => {
              failed = true;
              setOutputs((prev) => {
                const next = [...prev];
                next[i] += `\n\n**This pass failed:** ${message}`;
                return next;
              });
            },
          },
        );

        // Without a session id the later passes have nothing to resume.
        if (failed || cancelRef.current || !sessionRef.current) break;
      }

      setActive(-1);
      setFinished(true);
    },
    [send, stages],
  );

  return { run, stop, running, tool, outputs, active, finished };
}
