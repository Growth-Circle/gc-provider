export type DiffOp = { kind: "add" | "del" | "ctx"; text: string };

/** Files above this size skip the diff and get a summary line instead. */
const MAX_DIFF_LINES = 4000;

export function diffLines(before: string, after: string): DiffOp[] {
  const a = splitLines(before);
  const b = splitLines(after);

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      ops.push({ kind: "ctx", text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ kind: "del", text: a[i] });
      i += 1;
    } else {
      ops.push({ kind: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < m) {
    ops.push({ kind: "del", text: a[i] });
    i += 1;
  }
  while (j < n) {
    ops.push({ kind: "add", text: b[j] });
    j += 1;
  }
  return ops;
}

/**
 * Renders the change as prefixed lines, keeping `context` unchanged lines
 * around each edit and collapsing the rest into a count so the user can see at
 * a glance that the untouched parts of their config stayed untouched.
 */
export function renderDiff(
  before: string | null,
  after: string,
  options: { context?: number } = {},
): string[] {
  const context = options.context ?? 2;

  if (before === null) {
    const lines = splitLines(after);
    return lines.map((line) => `+ ${line}`);
  }
  if (before === after) return [];

  const beforeLines = splitLines(before).length;
  const afterLines = splitLines(after).length;
  if (beforeLines > MAX_DIFF_LINES || afterLines > MAX_DIFF_LINES) {
    return [`~ file too large to diff (${beforeLines} -> ${afterLines} lines)`];
  }

  const ops = diffLines(before, after);
  const keep = new Array<boolean>(ops.length).fill(false);
  ops.forEach((op, index) => {
    if (op.kind === "ctx") return;
    for (let k = Math.max(0, index - context); k <= Math.min(ops.length - 1, index + context); k += 1) {
      keep[k] = true;
    }
  });

  const out: string[] = [];
  let skipped = 0;
  const flushSkipped = () => {
    if (skipped === 0) return;
    out.push(`  … ${skipped} baris lain tidak disentuh`);
    skipped = 0;
  };

  ops.forEach((op, index) => {
    if (!keep[index]) {
      skipped += 1;
      return;
    }
    flushSkipped();
    if (op.kind === "add") out.push(`+ ${op.text}`);
    else if (op.kind === "del") out.push(`- ${op.text}`);
    else out.push(`  ${op.text}`);
  });
  flushSkipped();

  return out;
}

function splitLines(text: string): string[] {
  const normalized = text.replace(/\r\n/gu, "\n");
  const lines = normalized.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}
