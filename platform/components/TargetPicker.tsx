"use client";

import { useEffect, useState } from "react";
import { DEFAULT_TARGET, TARGETS, type Target } from "@/lib/prompts";

const KEY = "copilot.target";

/**
 * Internship and full-time applications are screened on different criteria, so
 * every feature needs to know which one this is. The choice is sticky because
 * it barely changes across a hunt — you are in one pipeline or the other.
 */
export function useTarget() {
  const [target, setTarget] = useState<Target>(DEFAULT_TARGET);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setTarget({ ...DEFAULT_TARGET, ...JSON.parse(raw) });
    } catch {
      /* ignore unreadable storage */
    }
  }, []);

  const update = (next: Target) => {
    setTarget(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore unwritable storage */
    }
  };

  return [target, update] as const;
}

interface Props {
  target: Target;
  onChange: (next: Target) => void;
}

export default function TargetPicker({ target, onChange }: Props) {
  return (
    <div className="field">
      <span>
        Applying for <em>changes how everything below is judged</em>
      </span>
      <div className="target-picker">
        {TARGETS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="target-option"
            data-active={target.kind === t.id || undefined}
            onClick={() => onChange({ ...target, kind: t.id })}
          >
            {t.label}
            <em>{t.hint}</em>
          </button>
        ))}
        {target.kind === "internship" && (
          <input
            className="target-term"
            value={target.term ?? ""}
            onChange={(e) => onChange({ ...target, term: e.target.value })}
            placeholder="Summer 2027"
            aria-label="Internship term"
          />
        )}
      </div>
    </div>
  );
}
