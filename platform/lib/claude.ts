import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

/**
 * Thin bridge over the locally installed `claude` CLI.
 *
 * Everything in this app runs through the CLI in print mode, so no API key is
 * needed — it reuses whatever auth the terminal already has.
 */

export type ClaudeEvent =
  | { type: "delta"; text: string }
  | { type: "tool"; name: string; detail?: string }
  | { type: "session"; sessionId: string }
  | { type: "done"; sessionId: string }
  | { type: "error"; message: string };

export interface RunOptions {
  /** User-visible prompt for this turn. */
  prompt: string;
  /** Persona / rules for the whole session. Only applied on the first turn. */
  systemPrompt?: string;
  /** Resume an existing conversation instead of starting a new one. */
  resumeSessionId?: string;
  /** Built-in tools to expose. Empty array = pure text generation. */
  tools?: string[];
  /** Session lives on disk so later turns can `--resume` it. */
  persist?: boolean;
  /** Aborts the turn and kills the CLI — wired to the request signal. */
  signal?: AbortSignal;
}

const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";

function buildArgs(opts: RunOptions): { args: string[]; sessionId: string } {
  const sessionId = opts.resumeSessionId || randomUUID();
  const args = [
    "-p",
    "--output-format",
    "stream-json",
    "--include-partial-messages",
    "--verbose",
    // Skip CLAUDE.md, skills, hooks and MCP servers: this session is a product
    // surface, not a coding session, and they only add latency and noise.
    "--safe-mode",
  ];

  const tools = opts.tools ?? [];
  if (tools.length === 0) {
    args.push("--tools", "");
  } else {
    args.push("--tools", tools.join(","));
    args.push("--permission-mode", "bypassPermissions");
  }

  if (opts.resumeSessionId) {
    args.push("--resume", opts.resumeSessionId);
  } else {
    args.push("--session-id", sessionId);
    if (opts.systemPrompt) args.push("--append-system-prompt", opts.systemPrompt);
  }

  if (!opts.persist) args.push("--no-session-persistence");

  return { args, sessionId };
}

/** Runs one turn and yields events as the model produces them. */
export async function* runClaude(opts: RunOptions): AsyncGenerator<ClaudeEvent> {
  const { args, sessionId } = buildArgs(opts);

  const child = spawn(CLAUDE_BIN, args, {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, CLAUDE_CODE_ENTRYPOINT: "interview-copilot" },
  });

  child.stdin.write(opts.prompt);
  child.stdin.end();

  // A closed browser tab or a Stop click must not leave the CLI running.
  const kill = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  opts.signal?.addEventListener("abort", kill, { once: true });

  let stderr = "";
  child.stderr.on("data", (c) => {
    stderr += c.toString();
  });

  const queue: ClaudeEvent[] = [];
  let resolveNext: (() => void) | null = null;
  let finished = false;

  const push = (e: ClaudeEvent) => {
    queue.push(e);
    resolveNext?.();
    resolveNext = null;
  };

  // The process can exit before stdout has been fully drained, so the turn is
  // only over once both have landed — otherwise the last tokens are dropped.
  let stdoutEnded = false;
  let exited = false;
  const settle = () => {
    if (!stdoutEnded || !exited) return;
    finished = true;
    resolveNext?.();
    resolveNext = null;
  };

  let buffer = "";
  const consume = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      return;
    }
    for (const e of translate(msg, sessionId)) push(e);
  };

  child.stdout.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(consume);
  });

  child.stdout.on("end", () => {
    // The final message may arrive without a trailing newline.
    consume(buffer);
    buffer = "";
    stdoutEnded = true;
    settle();
  });

  child.on("error", (err) => {
    push({
      type: "error",
      message: `Could not start the \`claude\` CLI (${err.message}). Install it with \`npm i -g @anthropic-ai/claude-code\` or set CLAUDE_BIN.`,
    });
    stdoutEnded = true;
    exited = true;
    settle();
  });

  child.on("close", (code, signal) => {
    // A signal kill is our own abort, not a failure worth reporting.
    if (code !== 0 && !signal) {
      push({
        type: "error",
        message: stderr.trim() || `claude exited with code ${code}`,
      });
    }
    exited = true;
    // A kill leaves stdout half-open; do not wait on a stream that will never end.
    if (signal) stdoutEnded = true;
    settle();
  });

  try {
    while (!finished || queue.length > 0) {
      if (queue.length === 0) {
        await new Promise<void>((res) => {
          resolveNext = res;
        });
        continue;
      }
      yield queue.shift()!;
    }
    yield { type: "done", sessionId };
  } finally {
    opts.signal?.removeEventListener("abort", kill);
    kill();
  }
}

/** Maps one CLI stream-json message to zero or more UI events. */
function translate(msg: Record<string, unknown>, sessionId: string): ClaudeEvent[] {
  const type = msg.type as string;

  if (type === "system" && msg.subtype === "init") {
    return [{ type: "session", sessionId: (msg.session_id as string) || sessionId }];
  }

  if (type === "stream_event") {
    const event = msg.event as Record<string, unknown> | undefined;
    if (event?.type === "content_block_delta") {
      const delta = event.delta as Record<string, unknown>;
      if (delta?.type === "text_delta" && typeof delta.text === "string") {
        return [{ type: "delta", text: delta.text }];
      }
    }
    if (event?.type === "content_block_start") {
      const block = event.content_block as Record<string, unknown> | undefined;
      if (block?.type === "tool_use") {
        return [{ type: "tool", name: String(block.name ?? "tool") }];
      }
    }
    return [];
  }

  if (type === "result" && msg.is_error) {
    return [{ type: "error", message: String(msg.result ?? "Claude returned an error") }];
  }

  return [];
}

/** Wraps an event generator in a Server-Sent Events response body. */
export function toSSE(events: AsyncGenerator<ClaudeEvent>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const write = (event: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          return true;
        } catch {
          return false; // the client went away mid-stream
        }
      };

      try {
        for await (const event of events) {
          if (!write(event)) break;
        }
      } catch (err) {
        write({ type: "error", message: err instanceof Error ? err.message : String(err) });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed by a cancel */
        }
      }
    },
    cancel() {
      // Unwinds the generator's finally block, which kills the CLI process.
      void events.return(undefined as never);
    },
  });
}
