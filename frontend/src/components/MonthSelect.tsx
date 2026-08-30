import { addMonths, currentMonth, monthLabel } from "@/lib/finance";

export default function MonthSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const months = Array.from({ length: 13 }, (_, index) => addMonths(currentMonth(), index - 6));
  return <label className="flex items-center gap-3" data-testid="month-selector-label"><span className="text-xs uppercase tracking-[0.14em] text-slate-500">Período</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-medium text-slate-100 outline-none transition-colors duration-200 focus:border-cyan-700" data-testid="month-selector"><option value={value}>{monthLabel(value)}</option>{months.filter((month) => month !== value).map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}</select></label>;
}
