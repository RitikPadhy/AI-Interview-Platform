"use client";

import { useState } from "react";
import { Loader2, Mail, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import OutputPanel from "@/components/OutputPanel";
import ResumeStatus from "@/components/ResumeStatus";
import { useClaudeStream } from "@/lib/useClaudeStream";

export default function CoverLetterPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [highlights, setHighlights] = useState("");
  const [jd, setJd] = useState("");
  const [out, setOut] = useState("");
  const { send, stop, running, tool } = useClaudeStream();

  const ready = jd.trim().length >= 40 && jobTitle.trim() && company.trim();

  const run = async () => {
    setOut("");
    await send(
      { mode: "cover", jobTitle, company, highlights, jobDescription: jd },
      { onDelta: (d) => setOut((prev) => prev + d), onError: (m) => toast.error(m) },
    );
  };

  return (
    <div className="split">
      <section className="panel">
        <header className="page-head compact">
          <h1>
            <Mail size={20} /> Cover Letter
          </h1>
          <p>Under 175 words. Hook, proof, close. No buzzwords.</p>
        </header>

        <div className="field-row">
          <label className="field">
            <span>Job title</span>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Data Platform Engineer"
            />
          </label>
          <label className="field">
            <span>Company</span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Databricks"
            />
          </label>
        </div>

        <label className="field">
          <span>
            Resume points to lean on <em>optional</em>
          </span>
          <textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            rows={3}
            placeholder="Leave blank and it picks the two strongest bullets for this JD itself."
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
            <button className="btn-primary lg" onClick={run} disabled={!ready}>
              <Sparkles size={15} /> Write the letter
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
        waitingLabel="Drafting…"
        placeholder="Fill in the role and paste the JD. The letter appears here, ready to copy."
      />
    </div>
  );
}
