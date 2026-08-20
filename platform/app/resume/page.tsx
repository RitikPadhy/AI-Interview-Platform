"use client";

import { useState } from "react";
import { FileText, Loader2, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import ResumeStatus from "@/components/ResumeStatus";
import StageList from "@/components/StageList";
import TargetPicker, { useTarget } from "@/components/TargetPicker";
import { RESUME_STAGES } from "@/lib/prompts";
import { useStagedRun } from "@/lib/useStagedRun";

export default function ResumePage() {
  const [jd, setJd] = useState("");
  const [target, setTarget] = useTarget();
  const { run, stop, running, outputs, active, finished } = useStagedRun(RESUME_STAGES);

  const start = () =>
    run({ mode: "resume", jobDescription: jd, target }).catch((e: Error) => toast.error(e.message));

  return (
    <div className="split">
      <section className="panel">
        <header className="page-head compact">
          <h1>
            <FileText size={20} /> Resume
          </h1>
          <p>Five passes: the recruiter skim, the rewrite, the score, the summary, the final resume.</p>
        </header>

        <TargetPicker target={target} onChange={setTarget} />

        <label className="field">
          <span>Job description</span>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={18}
            placeholder="Paste the full job posting here…"
          />
        </label>

        <div className="row end">
          {running ? (
            <button className="btn-ghost" onClick={stop}>
              <Square size={13} /> Stop
            </button>
          ) : (
            <button className="btn-primary lg" onClick={start} disabled={jd.trim().length < 40}>
              <Sparkles size={15} /> {finished ? "Run it again" : "Run all five passes"}
            </button>
          )}
          {running && <Loader2 size={16} className="spin" />}
        </div>

        <ol className="pass-list">
          {RESUME_STAGES.map((s, i) => (
            <li key={s.id} data-state={active === i ? "current" : outputs[i] ? "done" : "todo"}>
              <span>{i + 1}</span>
              {s.label}
            </li>
          ))}
        </ol>

        <p className="hint">
          Each pass feeds the next, so this takes a few minutes. Nothing in your resume file is
          touched; the final pass hands you a full document to paste.
        </p>

        <ResumeStatus />
      </section>

      <StageList
        stages={RESUME_STAGES}
        outputs={outputs}
        active={active}
        finished={finished}
        placeholder="Paste a job description. You get the red flags a screener sees in ten seconds, an experience section rewritten around measurable impact, a match score out of 100, three summaries, and the finished resume."
      />
    </div>
  );
}
