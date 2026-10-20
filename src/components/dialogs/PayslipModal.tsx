import { Download, FileText, X } from 'lucide-react';

export function PayslipModal({ theme, emp, onClose }) {
  const currency = emp.location.includes('Mumbai') || emp.location.includes('Bangalore') ? 'â‚¹' : '$';
  const grossMonthly = Math.round(((Number(emp.salary) || 0) + (Number(emp.bonus) || 0)) / 12);
  const deductionsMonthly = Math.round((Number(emp.deductions) || 0) / 12);
  const netPay = grossMonthly - deductionsMonthly;

  const printPayslip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`border-b pb-3 flex justify-between items-center ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <FileText className="w-5 h-5 text-indigo-500" />
              Official Salary Statement
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Pay Period: October 2026</p>
          </div>
          <button onClick={onClose} className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`space-y-2 text-xs p-3 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-800/40 border-slate-700/40' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex justify-between"><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Employee:</span> <strong className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>{emp.firstName} {emp.lastName}</strong></div>
          <div className="flex justify-between"><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Designation:</span> <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{emp.designation}</span></div>
          <div className="flex justify-between"><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Department:</span> <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{emp.department}</span></div>
          <div className="flex justify-between"><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Location:</span> <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{emp.location}</span></div>
          <div className="flex justify-between"><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Bank Account:</span> <span className="font-mono text-indigo-600 dark:text-indigo-300 font-semibold">{emp.bankAccount || 'HDFC-****-0012'}</span></div>
        </div>

        <div className="space-y-2 text-xs">
          <div className={`flex justify-between py-1 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Monthly Gross Salary</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{currency}{grossMonthly.toLocaleString()}</span>
          </div>
          <div className={`flex justify-between py-1 border-b ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Tax & Statutory Deductions</span>
            <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">-{currency}{deductionsMonthly.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-sm text-indigo-600 dark:text-indigo-400">
            <span>Net Take-Home Pay</span>
            <span>{currency}{netPay.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={printPayslip} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 ${
            theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}>
            <Download className="w-4 h-4" /> Print / Save PDF
          </button>
          <button onClick={onClose} className="primary-action px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 dark:shadow-emerald-600/20">Done</button>
        </div>
      </div>
    </div>
  );
}
