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

## Internship or full-time

Every page has an **Applying for** switch — *Internship* (with the term, e.g. `Summer 2027`) or
*Full-time*. It is not cosmetic: intern pipelines screen on completely different criteria, and the
choice is injected into every prompt.

Set to **Internship**, being mid-degree is treated as the qualification rather than an availability
problem, prior industry experience is judged against an intern pool instead of a senior bar,
coursework and projects count, a missing production tool is a project to build rather than a
blocker, and outreach puts university / early-career recruiters near the top. Set to **Full-time**,
you get the experienced-hire bar back.

The choice is remembered in the browser, so you pick it once per hunt.

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

### 2. Resume Suggestions
Paste a JD. You get the 20-second-screen read, a keyword table with *where in your resume each one
honestly fits*, line-level rewrites, restructuring advice, and the gaps you cannot keyword your way
out of.

It never edits your resume file and never suggests a claim you cannot back up.

### 3. Cover Letter
150 words. Hook / proof / close. Real metrics pulled from your resume, plain language, and a hard
ban on `passionate`, `synergy`, `spearheaded`, `leveraged`, and the rest of the tells.

It never invents experience, and it never argues against you either — no "I haven't used X yet".
Below the letter is a note for your eyes only: word count, the resume facts used, and every JD
requirement the letter stayed quiet about with the closest real thing to say if a screener asks.

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
3. any `*resume*.pdf` at the repo root ← this is the default

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
| `lib/prompts.ts` | Every system prompt and turn template, plus the track/round taxonomy |
| `lib/resume.ts` | Finds the resume, extracts PDF text, caches it, handles uploads |
| `lib/useClaudeStream.ts` | Client hook: POSTs and consumes the SSE stream |
| `app/api/chat/route.ts` | Routes each mode to its prompt, tools and session handling |
| `app/api/resume/route.ts` | Read / upload / paste the resume |

Sessions run with `--safe-mode`, so your CLAUDE.md, skills, hooks and MCP servers stay out of it.
Text-only features run with `--tools ""`; only **Who to Message** gets `WebSearch` and `WebFetch`.

## Stack

Next.js 15 (App Router) · React 19 · Tailwind v4 · `unpdf` · the Claude CLI. That is the whole
dependency list.
