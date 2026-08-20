import { readFile, readdir, writeFile, mkdir, stat, rm } from "node:fs/promises";
import path from "node:path";

/** Repo root — the app runs from `platform/`, the resume lives one level up. */
const ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(ROOT, "data");
const OVERRIDE_PDF = path.join(DATA_DIR, "resume.pdf");
const OVERRIDE_TXT = path.join(DATA_DIR, "resume.txt");

export interface ResumeDoc {
  text: string;
  source: string;
}

let cache: { doc: ResumeDoc; key: string } | null = null;

async function pdfToText(file: string): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const buf = await readFile(file);
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return String(text).replace(/\n{3,}/g, "\n\n").trim();
}

async function exists(file: string): Promise<boolean> {
  try {
    const info = await stat(file);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

/** Finds the resume: a pasted override, an uploaded PDF, or a *Resume*.pdf at the repo root. */
async function locate(): Promise<string | null> {
  if (await exists(OVERRIDE_TXT)) return OVERRIDE_TXT;
  if (await exists(OVERRIDE_PDF)) return OVERRIDE_PDF;
  // data/ wins over the repo root, so a resume you dropped in there is the one
  // every feature reads.
  for (const dir of [DATA_DIR, ROOT]) {
    try {
      const entries = await readdir(dir);
      const match =
        entries.find((f) => /resume/i.test(f) && f.toLowerCase().endsWith(".pdf")) ??
        entries.find((f) => /cv/i.test(f) && f.toLowerCase().endsWith(".pdf"));
      if (match) return path.join(dir, match);
    } catch {
      /* directory may not exist */
    }
  }
  return null;
}

export async function getResume(): Promise<ResumeDoc | null> {
  const file = await locate();
  if (!file) return null;
  if (cache?.key === file) return cache.doc;

  const text = file.endsWith(".pdf")
    ? await pdfToText(file)
    : (await readFile(file, "utf8")).trim();

  const doc: ResumeDoc = { text, source: path.relative(ROOT, file) };
  cache = { doc, key: file };
  return doc;
}

/** Saves an uploaded PDF as the active resume. */
export async function saveResumePdf(bytes: Uint8Array): Promise<ResumeDoc> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OVERRIDE_PDF, bytes);
  // A pasted override would shadow the new upload, so drop it.
  await rm(OVERRIDE_TXT, { force: true });
  cache = null;
  const doc = await getResume();
  if (!doc) throw new Error("Saved the PDF but could not read text back out of it.");
  return doc;
}

/** Saves resume text typed or pasted straight into the UI. */
export async function saveResumeText(text: string): Promise<ResumeDoc> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OVERRIDE_TXT, text.trim());
  cache = null;
  const doc = await getResume();
  if (!doc) throw new Error("Could not read the saved resume text back.");
  return doc;
}
