"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy, Loader2 } from "lucide-react";
import Markdown from "@/components/Markdown";
import type { StageDef } from "@/lib/useStagedRun";

interface Props {
  stages: readonly StageDef[];
  outputs: string[];
  active: number;
  finished: boolean;
  placeholder: string;
}

/** One collapsible block per pass. The running pass is always open. */
export default function StageList({ stages, outputs, active, finished, placeholder }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  // Follow the run, then settle on the last pass, which holds the finished piece.
  useEffect(() => {
    if (active >= 0) setOpen(active);
    else if (finished) setOpen(stages.length - 1);
  }, [active, finished, stages.length]);

  const started = outputs.some((o) => o) || active >= 0;
  if (!started) {
    return (
      <section className="panel output-panel">
        <div className="panel-head">
          <h3>Output</h3>
        </div>
        <div className="panel-body scroll">
          <p className="placeholder">{placeholder}</p>
        </div>
      </section>
    );
  }

  const copy = async (i: number) => {
    await navigator.clipboard.writeText(outputs[i]);
    setCopied(i);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <section className="panel output-panel">
      <div className="panel-head">
        <h3>Output</h3>
        <span className="status-pill">
          {active >= 0 ? (
            <>
              <Loader2 size={13} className="spin" /> Pass {active + 1} of {stages.length}
            </>
          ) : (
            `${outputs.filter((o) => o).length} of ${stages.length} passes`
          )}
        </span>
      </div>

      <div className="panel-body scroll">
        {stages.map((stage, i) => {
          const text = outputs[i];
          const isOpen = open === i;
          const state = active === i ? "running" : text ? "done" : "todo";
          if (state === "todo" && active < i && !text) {
            return (
              <div key={stage.id} className="stage" data-state="todo">
                <div className="stage-head">
                  <span className="stage-num">{i + 1}</span>
                  <span className="stage-label">
                    {stage.label}
                    <em>{stage.blurb}</em>
                  </span>
                </div>
              </div>
            );
          }
          return (
            <div key={stage.id} className="stage" data-state={state} data-open={isOpen || undefined}>
              <button className="stage-head" onClick={() => setOpen(isOpen ? null : i)}>
                <span className="stage-num">
                  {state === "running" ? <Loader2 size={12} className="spin" /> : i + 1}
                </span>
                <span className="stage-label">
                  {stage.label}
                  <em>{stage.blurb}</em>
                </span>
                <ChevronDown size={14} className="stage-chevron" />
              </button>
              {isOpen && (
                <div className="stage-body">
                  {text ? <Markdown>{text}</Markdown> : <span className="placeholder">Working…</span>}
                  {text && (
                    <button className="btn-ghost stage-copy" onClick={() => copy(i)}>
                      {copied === i ? <Check size={14} /> : <Copy size={14} />}
                      {copied === i ? "Copied" : "Copy this pass"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
