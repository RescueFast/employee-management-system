import { FileText } from 'lucide-react';

export default function EmployeeDocuments({ theme }: { theme: string }) {
  return (
    <section className={`rounded-2xl border p-6 ${
      theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          theme === 'dark' ? 'bg-slate-800 text-emerald-300' : 'bg-teal-50 text-teal-700'
        }`}>
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
            Employee documents
          </h3>
          <p className={`mt-1 text-sm leading-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Document storage is not configured. Employee records, leave, and account data continue to use Supabase.
          </p>
          <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
            Document uploads and downloads can be enabled later with a storage provider.
          </p>
        </div>
      </div>
    </section>
  );
}
