# Interview Copilot

A local web app for landing the job: run mock interviews, tighten your resume against a job
description, write the cover letter, and find the people worth messaging.

Everything runs through the **`claude` CLI already installed on your machine**. There is no API key,
no Firebase, no cloud account, and no bill — the app shells out to `claude -p` and streams the
answer back into the browser.

```bash
./run.sh          # http://localhost:3000
```

---

## Everything is an internship application

Every page has an **Internship term** field, prefilled `Summer 2027`. There is no full-time mode —
intern pipelines screen on completely different criteria, and getting that wrong is worse than
useless, so the internship framing is wired into every prompt:

Being mid-degree is treated as the qualification rather than an availability problem, availability is
stated as a fact and never as wanting a role, prior industry experience is judged against an intern
pool instead of a senior bar, coursework and projects count, a missing production tool is a project
to build rather than a blocker, interviews are graded on twelve-weeks-with-a-mentor readiness, and
outreach puts university / early-career recruiters near the top with the pipeline calendar.

The term is remembered in the browser, so you set it once.

## What it does

### 1. Mock Interview
Pick a track → pick the round → paste the job description → choose the format.

- **Tracks:** Data Science / AI & ML, Quantitative Finance, Software Engineering.
- **Rounds** are specific to the track — ML system design and case studies for DS, brainteasers and
  market intuition for quant, DSA and system design for SWE, plus the screens and behaviorals.
- **Mock interview** runs as a real conversation: one question at a time, follow-ups when your
  answer is thin, no coaching mid-answer. Hit **End & get feedback** for the honest internal
  write-up — verdict, question-by-question, and the three things to drill next.
- **Online assessment** generates a timed paper instead. Write your answers, submit once, get marked
  with the answer a strong candidate would have given.
- A clock runs from the first question, and **Copy transcript** puts the whole round — questions,
  your answers, the feedback — on the clipboard as markdown so you can keep it.

The conversation is a real multi-turn Claude session (`--session-id` on the first turn, `--resume`
after), so it remembers everything you said.

### 2. Resume
Paste a JD and it runs five passes over your resume as one conversation, so each pass sees the last:

1. **Recruiter skim** - read the way a screener actually reads, hunting for reasons to say no. Out
   comes the 10-second read and the three red flags, with the exact text on the page that causes
   each one.
2. **Experience rewrite** - every bullet led by measurable impact on the Google XYZ shape
   (accomplished X as measured by Y by doing Z), every generic phrase stripped, a different action
   verb on every line, and `[N]` wherever you need to supply a real number.
3. **ATS + hiring manager** - a match score out of 100, which keywords parse and which are missing,
   then section by section whether a human reading 200 resumes reads, skims or skips it. Everything
   skimmed or skipped gets rewritten.
4. **Summary rewrite** - three versions built so that passing on you feels like a mistake, sized to
   two lines on the page, with one marked as the one to send.
5. **Final resume** - the whole document assembled, plus a **Before you send this** list of every
   claim you need to confirm and every `[N]` still to fill.

It never edits your resume file. The last pass hands you a document to paste.

### 3. Cover Letter
The same treatment in four passes: why a screener would bin your application, a draft built on
hook / proof / close with real metrics, a score out of 100 with a line-by-line read/skim/skip pass,
then the final letter under 175 words.

It never invents experience and it never argues against you - no "I haven't used X yet". Below the
letter is a note for your eyes only: word count, the resume facts used, the requirements the letter
deliberately stayed quiet about with the closest real thing to say if a screener asks, and the one
change that would raise the score most.

### 4. Who to Message
The only feature that touches the internet. It runs live `WebSearch` / `WebFetch` through the CLI to
find the hiring manager, the recruiter and the engineers on the team, then hands you clickable
LinkedIn search URLs, a connection request under 300 characters, the follow-up message, and a cold
email. Unverified people are labelled as search patterns rather than invented.

---

## Your resume

The app looks for a resume in this order:

1. `data/resume.txt` — text you pasted in the UI
2. `data/resume.pdf` — a PDF you uploaded in the UI
3. any `*resume*.pdf` in `data/` ← put your current resume here
4. any `*resume*.pdf` at the repo root

The PDF is parsed with `unpdf` and the extracted text is injected into every prompt. The **Resume
loaded from…** bar at the bottom of each page shows what is in play and lets you fix bad extraction
or swap the file without leaving the page.

`data/` and all PDFs are gitignored — your resume stays on your machine.

---

## Setup

You need the Claude CLI signed in:

```bash
npm i -g @anthropic-ai/claude-code
claude            # sign in once, then quit
```

Then:

```bash
./run.sh
```

First run installs dependencies. After that it just starts the dev server on
[localhost:3000](http://localhost:3000).

To point at a CLI somewhere unusual, set `CLAUDE_BIN=/path/to/claude`.

---

## How it works

```
browser ──POST /api/chat──▶ spawn `claude -p --output-format stream-json`
        ◀────── SSE ──────  text deltas parsed out of the CLI's JSON stream
```

| Path | Role |
| --- | --- |
| `lib/claude.ts` | Spawns the CLI, parses `stream-json`, exposes an event generator + SSE wrapper |
| `lib/prompts.ts` | Every system prompt and turn template, the track/round taxonomy, and the resume/cover pass chains |
| `lib/useStagedRun.ts` | Client hook: runs a pass chain as one session, streaming each pass separately |
| `components/StageList.tsx` | The collapsible per-pass output |
| `lib/resume.ts` | Finds the resume, extracts PDF text, caches it, handles uploads |
| `lib/useClaudeStream.ts` | Client hook: POSTs and consumes the SSE stream |
| `app/api/chat/route.ts` | Routes each mode to its prompt, tools and session handling |
| `app/api/resume/route.ts` | Read / upload / paste the resume |

Sessions run with `--safe-mode`, so your CLAUDE.md, skills, hooks and MCP servers stay out of it.
Text-only features run with `--tools ""`; only **Who to Message** gets `WebSearch` and `WebFetch`.

## Stack

Next.js 15 (App Router) · React 19 · Tailwind v4 · `unpdf` · the Claude CLI. That is the whole
dependency list.
