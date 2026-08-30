import type { LucideIcon } from "lucide-react";

export default function MetricCard({ label, value, detail, icon: Icon, tone = "cyan" }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: "cyan" | "emerald" | "rose" }) {
  const tones = { cyan: "text-cyan-400 bg-cyan-950/60", emerald: "text-emerald-400 bg-emerald-950/50", rose: "text-rose-400 bg-rose-950/40" };
  return <div className="group rounded-xl border border-slate-800 bg-slate-900/85 p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-700" data-testid={`metric-${label.toLowerCase().replaceAll(" ", "-")}`}>
    <div className="flex items-start justify-between"><span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500" data-testid={`${label.toLowerCase().replaceAll(" ", "-")}-label`}>{label}</span><span className={`flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon size={17} /></span></div>
    <p className="mt-5 font-heading text-2xl font-semibold tracking-tight text-slate-50" data-testid={`${label.toLowerCase().replaceAll(" ", "-")}-value`}>{value}</p>
    <p className="mt-1 text-xs text-slate-500" data-testid={`${label.toLowerCase().replaceAll(" ", "-")}-detail`}>{detail}</p>
  </div>;
}
