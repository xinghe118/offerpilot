type ScoreCardProps = {
  label: string;
  value: number;
  detail: string;
  tone?: "green" | "amber" | "blue";
};

const tones = {
  green: "border-accent/20 bg-accent/5 text-accent",
  amber: "border-amber/20 bg-amber/5 text-amber",
  blue: "border-blue-700/20 bg-blue-700/5 text-blue-700",
};

export function ScoreCard({ label, value, detail, tone = "green" }: ScoreCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-0 opacity-80">{label}</p>
          <p className="mt-2 text-sm leading-6 text-ink">{detail}</p>
        </div>
        <div className="text-3xl font-bold">{value}</div>
      </div>
    </div>
  );
}
