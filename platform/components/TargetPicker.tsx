"use client";

import { useEffect, useState } from "react";
import { DEFAULT_TARGET, type Target } from "@/lib/prompts";

const KEY = "copilot.target";

/**
 * Everything here is screened as an internship application, so the only thing
 * to pick is the term. It is sticky because it barely changes across a hunt.
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
    <label className="field">
      <span>
        Internship term <em>everything below is screened as an internship application</em>
      </span>
      <input
        className="target-term"
        value={target.term ?? ""}
        onChange={(e) => onChange({ term: e.target.value })}
        placeholder="Summer 2027"
      />
    </label>
  );
}
