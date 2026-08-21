"use client";

import { useState } from "react";
import { Loader2, Mail, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import ResumeStatus from "@/components/ResumeStatus";
import StageList from "@/components/StageList";
import TargetPicker, { useTarget } from "@/components/TargetPicker";
import { COVER_STAGES } from "@/lib/prompts";
import { useStagedRun } from "@/lib/useStagedRun";

export default function CoverLetterPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [highlights, setHighlights] = useState("");
  const [jd, setJd] = useState("");
  const [target, setTarget] = useTarget();
  const { run, stop, running, outputs, active, finished } = useStagedRun(COVER_STAGES);

  const ready = jd.trim().length >= 40 && jobTitle.trim() && company.trim();

  const start = () =>
    run({ mode: "cover", jobTitle, company, highlights, jobDescription: jd, target }).catch(
      (e: Error) => toast.error(e.message),
    );

  return (
    <div className="split">
      <section className="panel">
        <header className="page-head compact">
          <h1>
            <Mail size={20} /> Cover Letter
          </h1>
          <p>Five passes, ending in 150 words plus the note for your eyes only.</p>
        </header>

        <TargetPicker target={target} onChange={setTarget} />

        <div className="field-row">
          <label className="field">
            <span>Job title</span>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Data Engineering Intern"
            />
          </label>
          <label className="field">
            <span>Company</span>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Stripe" />
          </label>
        </div>

        <label className="field">
          <span>
            Resume points to lean on <em>optional</em>
          </span>
          <textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            rows={2}
            placeholder="Leave blank and it picks the strongest ones for this JD itself."
          />
        </label>

        <label className="field">
          <span>Job description</span>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={12}
            placeholder="Paste the full job posting here…"
          />
        </label>

        <div className="row end">
          {running ? (
            <button className="btn-ghost" onClick={stop}>
              <Square size={13} /> Stop
            </button>
          ) : (
            <button className="btn-primary lg" onClick={start} disabled={!ready}>
              <Sparkles size={15} /> {finished ? "Run it again" : `Run all ${COVER_STAGES.length} passes`}
            </button>
          )}
          {running && <Loader2 size={16} className="spin" />}
        </div>

        <ol className="pass-list">
          {COVER_STAGES.map((s, i) => (
            <li key={s.id} data-state={active === i ? "current" : outputs[i] ? "done" : "todo"}>
              <span>{i + 1}</span>
              {s.label}
            </li>
          ))}
        </ol>

        <ResumeStatus />
      </section>

      <StageList
        stages={COVER_STAGES}
        outputs={outputs}
        active={active}
        finished={finished}
        placeholder="Fill in the role and paste the JD. You get why a screener would bin you, a draft, a score out of 100, and the final letter with a private note on what it stayed quiet about."
      />
    </div>
  );
}
