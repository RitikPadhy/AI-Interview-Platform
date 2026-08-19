"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Copy,
  Loader2,
  MessagesSquare,
  RotateCcw,
  Send,
  Square,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import Markdown from "@/components/Markdown";
import ResumeStatus from "@/components/ResumeStatus";
import { ROUNDS, TRACKS, type TrackId } from "@/lib/prompts";
import { useClaudeStream } from "@/lib/useClaudeStream";

type Format = "interview" | "assessment";
type Turn = { role: "interviewer" | "me"; text: string };

export default function InterviewPage() {
  const [step, setStep] = useState(0);
  const [track, setTrack] = useState<TrackId | null>(null);
  const [round, setRound] = useState<string | null>(null);
  const [jd, setJd] = useState("");
  const [format, setFormat] = useState<Format>("interview");

  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const { send, stop, running } = useClaudeStream();
  const logRef = useRef<HTMLDivElement>(null);

  // Real rounds are timed, so this one is too — it starts when the first
  // question (or the assessment paper) is on screen and stops at feedback.
  useEffect(() => {
    if (startedAt === null || finished) return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt, finished]);

  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;

  const trackLabel = TRACKS.find((t) => t.id === track)?.label ?? "";
  const roundLabel = track ? ROUNDS[track].find((r) => r.id === round)?.label ?? "" : "";
  const started = turns.length > 0;

  /** Appends streamed text onto the interviewer's current turn. */
  const streamInto = (delta: string) =>
    setTurns((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "interviewer") next[next.length - 1] = { ...last, text: last.text + delta };
      return next;
    });

  const autoScroll = () => {
    requestAnimationFrame(() => {
      logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const begin = async () => {
    if (!track || !round) return;
    setTurns([{ role: "interviewer", text: "" }]);
    setFinished(false);
    autoScroll();
    await send(
      {
        mode: "interview",
        action: "start",
        setup: { track: trackLabel, round: roundLabel, jobDescription: jd, format },
      },
      {
        onSession: setSessionId,
        onDelta: streamInto,
        onDone: () => {
          autoScroll();
          setStartedAt((t) => t ?? Date.now());
        },
        onError: (m) => {
          toast.error(m);
          // Never strand the user in an empty room — send them back to the wizard.
          setTurns([]);
          setSessionId(null);
        },
      },
    );
  };

  const reply = async (action: "reply" | "end" | "grade", message?: string) => {
    if (!sessionId) return;
    if (action !== "end") {
      setTurns((prev) => [...prev, { role: "me", text: message ?? "" }]);
    }
    setTurns((prev) => [...prev, { role: "interviewer", text: "" }]);
    autoScroll();
    if (action === "end" || action === "grade") setFinished(true);

    await send(
      { mode: "interview", action, sessionId, message },
      { onDelta: streamInto, onDone: autoScroll, onError: (m) => toast.error(m) },
    );
  };

  const submitDraft = () => {
    const text = draft.trim();
    if (!text || running) return;
    setDraft("");
    reply(format === "assessment" && !finished ? "grade" : "reply", text);
  };

  const restart = () => {
    stop();
    setTurns([]);
    setSessionId(null);
    setFinished(false);
    setDraft("");
    setStartedAt(null);
    setElapsed(0);
    setStep(0);
  };

  /** The whole round as markdown, so a good feedback write-up can be kept. */
  const copyTranscript = async () => {
    const header = `# ${format === "assessment" ? "Online Assessment" : roundLabel} — ${trackLabel}\n\nTime taken: ${clock}\n`;
    const body = turns
      .filter((t) => t.text.trim())
      .map((t) => `\n---\n\n**${t.role === "me" ? "You" : "Interviewer"}**\n\n${t.text.trim()}`)
      .join("\n");
    await navigator.clipboard.writeText(header + body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    toast.success("Transcript copied");
  };

  /* ---------------- setup wizard ---------------- */

  if (!started) {
    return (
      <div className="wizard">
        <header className="page-head">
          <h1>
            <MessagesSquare size={22} /> Mock Interview
          </h1>
          <p>Four quick choices, then you are in the room.</p>
        </header>

        <ol className="steps">
          {["Track", "Round", "Job description", "Format"].map((label, i) => (
            <li key={label} data-state={i === step ? "current" : i < step ? "done" : "todo"}>
              <span>{i + 1}</span>
              {label}
            </li>
          ))}
        </ol>

        <section className="panel wizard-panel">
          {step === 0 && (
            <>
              <h2>What are you interviewing for?</h2>
              <div className="choice-grid">
                {TRACKS.map((t) => (
                  <button
                    key={t.id}
                    className="choice"
                    data-active={track === t.id || undefined}
                    onClick={() => {
                      setTrack(t.id);
                      setRound(null);
                      setStep(1);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && track && (
            <>
              <h2>Which round are you in?</h2>
              <div className="choice-grid two">
                {ROUNDS[track].map((r) => (
                  <button
                    key={r.id}
                    className="choice"
                    data-active={round === r.id || undefined}
                    onClick={() => {
                      setRound(r.id);
                      setFormat(r.id === "oa" ? "assessment" : "interview");
                      setStep(2);
                    }}
                  >
                    <strong>{r.label}</strong>
                    <em>{r.blurb}</em>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Paste the job description</h2>
              <p className="hint">
                Everything is calibrated off this — the difficulty, the topics, the follow-ups.
              </p>
              <textarea
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={14}
                placeholder="Paste the full job posting here…"
              />
              <div className="row end">
                <button className="btn-primary" disabled={jd.trim().length < 40} onClick={() => setStep(3)}>
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>How do you want to run it?</h2>
              <div className="choice-grid">
                <button
                  className="choice"
                  data-active={format === "interview" || undefined}
                  onClick={() => setFormat("interview")}
                >
                  <strong>Mock interview</strong>
                  <em>Back and forth, one question at a time, follow-ups when you are vague.</em>
                </button>
                <button
                  className="choice"
                  data-active={format === "assessment" || undefined}
                  onClick={() => setFormat("assessment")}
                >
                  <strong>Online assessment</strong>
                  <em>A timed paper. Write your answers, submit once, get marked.</em>
                </button>
              </div>
              <div className="summary">
                <span>{trackLabel}</span>
                <span>{roundLabel}</span>
                <span>{jd.trim().split(/\s+/).length} words of JD</span>
              </div>
              <div className="row end">
                <button className="btn-primary lg" onClick={begin} disabled={running}>
                  {running ? <Loader2 size={15} className="spin" /> : null}
                  {format === "assessment" ? "Generate the assessment" : "Start the interview"}
                </button>
              </div>
            </>
          )}

          {step > 0 && (
            <button className="btn-back" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </section>

        <ResumeStatus />
      </div>
    );
  }

  /* ---------------- live room ---------------- */

  return (
    <div className="room">
      <header className="room-head">
        <div>
          <h1>{format === "assessment" ? "Online Assessment" : roundLabel}</h1>
          <p>{trackLabel}</p>
        </div>
        <div className="row">
          {startedAt !== null && (
            <span className="status-pill" title="Time on this round">
              <Timer size={13} /> {clock}
            </span>
          )}
          {format === "interview" && !finished && (
            <button className="btn-ghost" onClick={() => reply("end")} disabled={running || !sessionId}>
              <ClipboardCheck size={14} /> End & get feedback
            </button>
          )}
          <button className="btn-ghost" onClick={copyTranscript} disabled={running}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy transcript"}
          </button>
          <button className="btn-ghost" onClick={restart}>
            <RotateCcw size={14} /> New round
          </button>
        </div>
      </header>

      <div className="transcript scroll" ref={logRef}>
        {turns.map((turn, i) => (
          <article key={i} className="turn" data-role={turn.role}>
            <span className="turn-label">{turn.role === "me" ? "You" : "Interviewer"}</span>
            <div className="turn-body">
              {turn.text ? (
                <Markdown>{turn.text}</Markdown>
              ) : (
                <span className="status-pill">
                  <Loader2 size={13} className="spin" /> Thinking…
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="composer">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitDraft();
            }
          }}
          rows={format === "assessment" && !finished ? 10 : 3}
          placeholder={
            finished
              ? "Ask a follow-up about the feedback…"
              : format === "assessment"
                ? "Write all of your answers here, numbered to match the questions, then submit for marking…"
                : "Your answer… (⌘/Ctrl + Enter to send)"
          }
        />
        <div className="composer-actions">
          {running ? (
            <button className="btn-ghost" onClick={stop}>
              <Square size={13} /> Stop
            </button>
          ) : (
            <button className="btn-primary" onClick={submitDraft} disabled={!draft.trim()}>
              <Send size={14} />
              {format === "assessment" && !finished ? "Submit for marking" : "Send"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
