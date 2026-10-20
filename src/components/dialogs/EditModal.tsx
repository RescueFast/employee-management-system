import { useState } from 'react';
import { DEPARTMENTS, LOCATIONS, ROLES } from '../../data/seedData';

export function EditModal({ theme, emp, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...emp });

  const inputClass = `w-full p-2.5 rounded-lg border text-xs ${
    theme === 'dark' 
      ? 'bg-slate-950 border-slate-800 text-white' 
      : 'bg-slate-50 border-slate-300 text-slate-900'
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Edit Employee Information</h3>
        <div className="space-y-3 text-xs">
          <div>
            <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Designation</label>
            <input type="text" className={inputClass} value={formData.designation} onChange={e=>setFormData({...formData, designation: e.target.value})} />
          </div>
          <div>
            <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Role / Access Level</label>
            <select className={inputClass} value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Department</label>
            <select className={inputClass} value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Location Branch</label>
            <select className={inputClass} value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})}>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Status</label>
            <select className={inputClass} value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})}>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className={`px-3 py-2 rounded-xl text-xs font-medium ${
            theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
          }`}>
            Cancel
          </button>
          <button onClick={() => onSave(formData)} className="primary-action px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 dark:shadow-emerald-600/20">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// 4. PAYSLIP MODAL
