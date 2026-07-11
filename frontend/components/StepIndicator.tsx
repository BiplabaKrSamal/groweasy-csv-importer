import { Step } from "@/lib/types";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "UPLOAD" },
  { key: "preview", label: "PREVIEW" },
  { key: "processing", label: "EXTRACT" },
  { key: "result", label: "RESULT" },
];

export function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-0 rounded border border-line bg-panel px-4 py-3 font-data text-xs shadow-bezel">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={
                  "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] " +
                  (active
                    ? "border-amber text-amber shadow-glow"
                    : done
                    ? "border-signal-ok/60 text-signal-ok"
                    : "border-line text-ink-faint")
                }
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={
                  "tracking-widest " +
                  (active ? "text-amber" : done ? "text-signal-ok" : "text-ink-faint")
                }
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={
                  "mx-3 h-px w-8 " + (i < currentIdx ? "bg-signal-ok/50" : "bg-line")
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
