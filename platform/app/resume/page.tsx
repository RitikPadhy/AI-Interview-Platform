"use client";

import { useState } from "react";
import { FileText, Loader2, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import OutputPanel from "@/components/OutputPanel";
import ResumeStatus from "@/components/ResumeStatus";
import { useClaudeStream } from "@/lib/useClaudeStream";

export default function ResumePage() {
  const [jd, setJd] = useState("");
  const [out, setOut] = useState("");
  const { send, stop, running, tool } = useClaudeStream();

  const run = async () => {
    setOut("");
    await send(
      { mode: "resume", jobDescription: jd },
      {
        onDelta: (d) => setOut((prev) => prev + d),
        onError: (m) => toast.error(m),
      },
    );
  };

  return (
    <div className="split">
      <section className="panel">
        <header className="page-head compact">
          <h1>
            <FileText size={20} /> Resume Suggestions
          </h1>
          <p>Suggestions only — nothing in your resume file is touched.</p>
        </header>

        <label className="field">
          <span>Job description</span>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={20}
            placeholder="Paste the full job posting here…"
          />
        </label>

        <div className="row end">
          {running ? (
            <button className="btn-ghost" onClick={stop}>
              <Square size={13} /> Stop
            </button>
          ) : (
            <button className="btn-primary lg" onClick={run} disabled={jd.trim().length < 40}>
              <Sparkles size={15} /> Find the gaps
            </button>
          )}
          {running && <Loader2 size={16} className="spin" />}
        </div>

        <ResumeStatus />
      </section>

      <OutputPanel
        text={out}
        running={running}
        tool={tool}
        waitingLabel="Reading the JD…"
        placeholder="Paste a job description and the keyword gaps, line-level rewrites and honest blockers land here."
      />
    </div>
  );
}
