"use client";

import { useState } from "react";
import { Loader2, Search, Square, Users } from "lucide-react";
import { toast } from "sonner";
import OutputPanel from "@/components/OutputPanel";
import ResumeStatus from "@/components/ResumeStatus";
import { useClaudeStream } from "@/lib/useClaudeStream";

export default function OutreachPage() {
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [out, setOut] = useState("");
  const { send, stop, running, tool } = useClaudeStream();

  const run = async () => {
    setOut("");
    await send(
      { mode: "outreach", company, jobDescription: jd },
      { onDelta: (d) => setOut((prev) => prev + d), onError: (m) => toast.error(m) },
    );
  };

  return (
    <div className="split">
      <section className="panel">
        <header className="page-head compact">
          <h1>
            <Users size={20} /> Who to Message
          </h1>
          <p>Searches the web for real people on the team, then drafts what to send them.</p>
        </header>

        <label className="field">
          <span>
            Company <em>helps the search a lot</em>
          </span>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Databricks"
          />
        </label>

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
            <button className="btn-primary lg" onClick={run} disabled={jd.trim().length < 40}>
              <Search size={15} /> Find the people
            </button>
          )}
          {running && <Loader2 size={16} className="spin" />}
        </div>

        <p className="hint">
          This is the one feature that reaches the internet — it runs live web searches through the
          Claude CLI, so it takes a minute or two.
        </p>

        <ResumeStatus />
      </section>

      <OutputPanel
        text={out}
        running={running}
        tool={tool}
        waitingLabel="Searching the web…"
        placeholder="Names, titles, LinkedIn search links, and the connection request to send show up here."
      />
    </div>
  );
}
