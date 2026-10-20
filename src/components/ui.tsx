export function KpiCard({ title, value, icon: Icon, color, subtext, theme }) {
  const colorMap = {
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20'
  };

  return (
    <div className={`p-5 rounded-2xl border flex items-center justify-between ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div>
        <span className={`text-xs font-medium block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{title}</span>
        <span className={`text-2xl font-bold mt-1 block tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{value}</span>
        <span className={`text-[11px] mt-1 block ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{subtext}</span>
      </div>
      <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

export function FilterDropdown({ label, value, onChange, options, theme }) {
  return (
    <div className={`flex items-center gap-1.5 border rounded-xl px-2.5 py-1.5 text-xs ${
      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
    }`}>
      <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{label}:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-transparent focus:outline-none cursor-pointer font-medium"
      >
        <option value="All" className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>All</option>
        {options.map(opt => (
          <option key={opt} value={opt} className={theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export function StatusBadge({ status, theme }) {
  const styles = {
    Active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    'On Leave': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    Onboarding: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    Terminated: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${styles[status] || 'bg-slate-200 text-slate-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'Active' ? 'bg-emerald-500' : 
        status === 'On Leave' ? 'bg-amber-500' : 
        status === 'Onboarding' ? 'bg-indigo-500' : 'bg-rose-500'
      }`} />
      {status}
    </span>
  );
}

