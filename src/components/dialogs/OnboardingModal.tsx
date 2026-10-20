import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { DEPARTMENTS, LOCATIONS, ROLES } from '../../data/seedData';

export function OnboardingModal({ theme, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: 'Senior Data Analyst',
    role: 'Employee',
    department: 'Engineering',
    location: 'Mumbai HQ',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time',
    salary: 850000,
    bonus: 50000,
    deductions: 25000,
    bankAccount: 'HDFC-****-9900',
    skillsInput: 'React, Python, SQL',
    address: ''
  });

  const inputClass = `w-full p-2.5 rounded-lg border text-xs ${
    theme === 'dark' 
      ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
  }`;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEmp = {
      ...formData,
      id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Active',
      skills: formData.skillsInput.split(',').map(s => s.trim()).filter(Boolean),
      leaveBalance: 15,
      attendanceRate: 100.0,
      salary: Number(formData.salary),
      bonus: Number(formData.bonus),
      deductions: Number(formData.deductions)
    };
    onAdd(newEmp);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`p-5 border-b flex justify-between items-center sticky top-0 z-10 ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <h3 className={`text-base font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <UserPlus className="w-5 h-5 text-indigo-500" />
              Employee Onboarding Wizard
            </h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Fill in mandatory details for Designation, Role, Dept, Location, & Compensation</p>
          </div>
          <button onClick={onClose} className={`p-1 ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {/* Section 1 */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">1. Basic Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>First Name *</label>
                <input required type="text" className={inputClass} value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Last Name *</label>
                <input required type="text" className={inputClass} value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Work Email *</label>
                <input required type="email" className={inputClass} value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Phone Number</label>
                <input type="text" className={inputClass} value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">2. Explicit Organizational Fields</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Designation *</label>
                <input required type="text" placeholder="e.g. Lead Engineer" className={inputClass} value={formData.designation} onChange={e=>setFormData({...formData, designation: e.target.value})} />
              </div>
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Role / Access Level *</label>
                <select className={inputClass} value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Department *</label>
                <select className={inputClass} value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Location / Office Branch *</label>
                <select className={inputClass} value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})}>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">3. Compensation & Skills</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Base Salary</label>
                <input type="number" className={inputClass} value={formData.salary} onChange={e=>setFormData({...formData, salary: Number(e.target.value)})} />
              </div>
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Annual Bonus</label>
                <input type="number" className={inputClass} value={formData.bonus} onChange={e=>setFormData({...formData, bonus: Number(e.target.value)})} />
              </div>
              <div>
                <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Estimated Deductions</label>
                <input type="number" className={inputClass} value={formData.deductions} onChange={e=>setFormData({...formData, deductions: Number(e.target.value)})} />
              </div>
            </div>
            <div>
              <label className={`block mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Skills (comma separated)</label>
              <input type="text" placeholder="React, Python, SQL..." className={inputClass} value={formData.skillsInput} onChange={e=>setFormData({...formData, skillsInput: e.target.value})} />
            </div>
          </div>

          <div className={`pt-4 border-t flex justify-end gap-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-xl text-xs font-medium ${
              theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}>
              Cancel
            </button>
            <button type="submit" className="primary-action px-5 py-2 rounded-xl font-medium text-xs shadow-md shadow-teal-600/20 dark:shadow-emerald-600/20">
              Complete Onboarding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. PROFILE VIEW MODAL
