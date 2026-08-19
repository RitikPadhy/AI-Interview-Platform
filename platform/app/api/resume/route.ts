import { NextRequest } from "next/server";
import { getResume, saveResumePdf, saveResumeText } from "@/lib/resume";

export const runtime = "nodejs";

export async function GET() {
  const doc = await getResume();
  if (!doc) {
    return Response.json({
      found: false,
      message:
        "No resume found. Drop a PDF with 'resume' in the filename at the repo root, or upload one here.",
    });
  }
  return Response.json({ found: true, ...doc });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return Response.json({ error: "No file uploaded." }, { status: 400 });
      }
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        return Response.json({ error: "Upload a PDF." }, { status: 400 });
      }
      const doc = await saveResumePdf(new Uint8Array(await file.arrayBuffer()));
      return Response.json({ found: true, ...doc });
    }

    const { text } = (await req.json()) as { text?: string };
    if (!text?.trim()) {
      return Response.json({ error: "Resume text is empty." }, { status: 400 });
    }
    const doc = await saveResumeText(text);
    return Response.json({ found: true, ...doc });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the resume.";
    return Response.json({ error: message }, { status: 500 });
  }
}
