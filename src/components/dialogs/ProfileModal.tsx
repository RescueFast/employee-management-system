import { X } from 'lucide-react';
import { StatusBadge } from '../ui';

export function ProfileModal({ theme, emp, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {emp.firstName[0]}{emp.lastName[0]}
            </div>
            <div>
              <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{emp.firstName} {emp.lastName}</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">{emp.id}</p>
              <StatusBadge status={emp.status} theme={theme} />
            </div>
          </div>
          <button onClick={onClose} className={theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`space-y-3 text-xs p-4 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-800/40 border-slate-700/40' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="grid grid-cols-2 gap-3">
            <div><span className={`block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Designation</span><strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>{emp.designation}</strong></div>
            <div><span className={`block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Role / Access</span><strong className="text-indigo-600 dark:text-indigo-400">{emp.role}</strong></div>
            <div><span className={`block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Department</span><strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>{emp.department}</strong></div>
            <div><span className={`block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Office Location</span><strong className="text-purple-600 dark:text-purple-400">{emp.location}</strong></div>
            <div><span className={`block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Joining Date</span><strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>{emp.joiningDate}</strong></div>
            <div><span className={`block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Employment Type</span><strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}>{emp.employmentType}</strong></div>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Skills & Expertise:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(emp.skills || []).map(s => (
              <span key={s} className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px]">
                {s}
              </span>
            ))}
          </div>
        </div>

        <button onClick={onClose} className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors ${
          theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
        }`}>
          Close Profile
        </button>
      </div>
    </div>
  );
}

// 3. EDIT EMPLOYEE MODAL
