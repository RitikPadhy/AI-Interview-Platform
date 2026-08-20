import { NextRequest } from "next/server";
import { runClaude, toSSE } from "@/lib/claude";
import { getResume } from "@/lib/resume";
import {
  COVER_SYSTEM,
  COVER_STAGES,
  END_INTERVIEW,
  GRADE_ASSESSMENT,
  OUTREACH_SYSTEM,
  RESUME_SYSTEM,
  RESUME_STAGES,
  coverStagePrompt,
  interviewOpening,
  interviewSystem,
  outreachPrompt,
  resumeStagePrompt,
  type CoverStageId,
  type InterviewSetup,
  type ResumeStageId,
  type Target,
} from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 3600;

type Body = {
  mode: "interview" | "resume" | "cover" | "outreach";
  action?: "start" | "reply" | "end" | "grade";
  sessionId?: string;
  setup?: Omit<InterviewSetup, "resume">;
  target?: Target;
  /** Index into RESUME_STAGES / COVER_STAGES for the multi-pass modes. */
  stage?: number;
  message?: string;
  jobDescription?: string;
  jobTitle?: string;
  company?: string;
  highlights?: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const resume = (await getResume())?.text ?? "";

  let prompt: string;
  let systemPrompt: string | undefined;
  let tools: string[] = [];
  let persist = false;
  let resumeSessionId = body.sessionId;

  switch (body.mode) {
    case "interview": {
      persist = true;
      if (body.action === "start") {
        if (!body.setup) return Response.json({ error: "Missing interview setup." }, { status: 400 });
        const setup: InterviewSetup = { ...body.setup, resume };
        systemPrompt = interviewSystem(setup);
        prompt = interviewOpening(setup);
        resumeSessionId = undefined;
      } else if (body.action === "end") {
        prompt = END_INTERVIEW;
      } else if (body.action === "grade") {
        prompt = GRADE_ASSESSMENT.replace("{{ANSWERS}}", body.message ?? "");
      } else {
        prompt = body.message ?? "";
      }
      if (body.action !== "start" && !resumeSessionId) {
        return Response.json({ error: "No interview session to continue." }, { status: 400 });
      }
      break;
    }

    case "resume": {
      const stage = body.stage ?? 0;
      const step = RESUME_STAGES[stage];
      if (!step) return Response.json({ error: "Unknown resume pass." }, { status: 400 });

      // The whole chain is one conversation, so every pass can see the last.
      persist = true;
      if (stage === 0) {
        if (!body.jobDescription?.trim()) {
          return Response.json({ error: "Paste a job description first." }, { status: 400 });
        }
        systemPrompt = RESUME_SYSTEM;
        resumeSessionId = undefined;
      } else if (!resumeSessionId) {
        return Response.json({ error: "No run to continue." }, { status: 400 });
      }
      prompt = resumeStagePrompt(step.id as ResumeStageId, {
        jd: body.jobDescription ?? "",
        resume,
        target: body.target,
      });
      break;
    }

    case "cover": {
      const stage = body.stage ?? 0;
      const step = COVER_STAGES[stage];
      if (!step) return Response.json({ error: "Unknown cover letter pass." }, { status: 400 });

      persist = true;
      if (stage === 0) {
        if (!body.jobDescription?.trim()) {
          return Response.json({ error: "Paste a job description first." }, { status: 400 });
        }
        systemPrompt = COVER_SYSTEM;
        resumeSessionId = undefined;
      } else if (!resumeSessionId) {
        return Response.json({ error: "No run to continue." }, { status: 400 });
      }
      prompt = coverStagePrompt(step.id as CoverStageId, {
        jobTitle: body.jobTitle?.trim() || "this",
        company: body.company?.trim() || "the company",
        jd: body.jobDescription ?? "",
        resume,
        highlights: body.highlights ?? "",
        target: body.target,
      });
      break;
    }

    case "outreach": {
      if (!body.jobDescription?.trim()) {
        return Response.json({ error: "Paste a job description first." }, { status: 400 });
      }
      systemPrompt = OUTREACH_SYSTEM;
      tools = ["WebSearch", "WebFetch"];
      prompt = outreachPrompt({
        jd: body.jobDescription,
        resume,
        company: body.company ?? "",
        target: body.target,
      });
      break;
    }

    default:
      return Response.json({ error: "Unknown mode." }, { status: 400 });
  }

  const stream = toSSE(
    runClaude({ prompt, systemPrompt, tools, persist, resumeSessionId, signal: req.signal }),
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
