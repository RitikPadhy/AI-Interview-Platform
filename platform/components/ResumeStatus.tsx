"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, TriangleAlert, Upload } from "lucide-react";
import { toast } from "sonner";

interface ResumeInfo {
  found: boolean;
  text?: string;
  source?: string;
  message?: string;
}

/**
 * Shows which resume every feature is currently using, and lets it be
 * swapped without leaving the page.
 */
export default function ResumeStatus() {
  const [info, setInfo] = useState<ResumeInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch("/api/resume");
    const data: ResumeInfo = await res.json();
    setInfo(data);
    setDraft(data.text ?? "");
  };

  useEffect(() => {
    load().catch(() => setInfo({ found: false, message: "Could not read the resume." }));
  }, []);

  const upload = async (file: File) => {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/resume", { method: "POST", body: form });
    const data = await res.json();
    setBusy(false);
    if (data.error) return toast.error(data.error);
    setInfo(data);
    setDraft(data.text ?? "");
    toast.success(`Now using ${data.source}`);
  };

  const saveText = async () => {
    setBusy(true);
    const res = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: draft }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) return toast.error(data.error);
    setInfo(data);
    toast.success("Resume text saved");
  };

  if (!info) return null;

  return (
    <div className="resume-status" data-open={open || undefined}>
      <button className="resume-status-head" onClick={() => setOpen((v) => !v)}>
        {info.found ? (
          <Check size={14} className="text-success-100" />
        ) : (
          <TriangleAlert size={14} className="text-destructive-100" />
        )}
        <span>
          {info.found ? (
            <>
              Resume loaded from <strong>{info.source}</strong>
              <em> · {info.text?.split(/\s+/).length ?? 0} words</em>
            </>
          ) : (
            info.message
          )}
        </span>
        <ChevronDown size={14} className="resume-chevron" />
      </button>

      {open && (
        <div className="resume-status-body">
          <p className="hint">
            This text is injected into every prompt. Edit it if the PDF extraction is messy.
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            rows={14}
            placeholder="Paste your resume text here…"
          />
          <div className="row">
            <button className="btn-ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload size={14} /> Upload PDF
            </button>
            <button className="btn-primary" onClick={saveText} disabled={busy || !draft.trim()}>
              Save text
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
