"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import Markdown from "@/components/Markdown";

interface Props {
  text: string;
  running: boolean;
  tool: string | null;
  placeholder: string;
  /** Label shown while waiting for the first token. */
  waitingLabel?: string;
}

export default function OutputPanel({
  text,
  running,
  tool,
  placeholder,
  waitingLabel = "Thinking…",
}: Props) {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  // Follow the stream, but stop fighting the user once they scroll up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [text]);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const empty = !text && !running;

  return (
    <section className="panel output-panel">
      <div className="panel-head">
        <h3>Output</h3>
        <div className="panel-head-right">
          {running && (
            <span className="status-pill">
              <Loader2 size={13} className="spin" />
              {tool ? `${tool}…` : text ? "Writing…" : waitingLabel}
            </span>
          )}
          {text && (
            <button className="btn-ghost" onClick={copy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>

      <div
        className="panel-body scroll"
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {empty ? (
          <p className="placeholder">{placeholder}</p>
        ) : (
          <>
            <Markdown>{text}</Markdown>
            {running && <span className="caret" />}
          </>
        )}
      </div>
    </section>
  );
}
