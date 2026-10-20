import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Building2, MapPin, ShieldCheck, Briefcase, 
  Search, Filter, Edit2, Trash2, Eye, CheckCircle2, XCircle, 
  Clock, DollarSign, BarChart3, FileText, Download, 
  Calendar, ChevronRight, ChevronLeft, UserCheck, AlertCircle, X,
  Sun, Moon, LayoutDashboard, Settings, Shield, Check, Sparkles,
  FileSpreadsheet, Menu, Award, LogOut
} from 'lucide-react';

import { DEPARTMENTS, LOCATIONS, ROLES } from './data/seedData';
import { ROLE_DETAILS } from './data/roles';
import { FilterDropdown, KpiCard, StatusBadge } from './components/ui';
import { EditModal, OnboardingModal, PayslipModal, ProfileModal } from './components/dialogs';
import AuthScreen from './components/auth/AuthScreen';
import EmployeeDocuments from './components/settings/EmployeeDocuments';
import ChangePasswordForm from './components/settings/ChangePasswordForm';
import type { AccountProfile } from './types/auth';
import { createCsv } from './utils/csv';
import { deleteEmployee, listEmployees, listLeaveRequests, updateEmployee, updateLeaveStatus, createEmployee } from './lib/employeeRepository';
import { profileFromSession, signOut as supabaseSignOut } from './lib/supabase-auth';
import { supabase } from './lib/supabase';
import type { Employee, LeaveRequest } from './lib/employeeRepository';

export default function App() {
  // --- STATE PERSISTENCE ---
  const [theme, setTheme] = useState(() => localStorage.getItem('ems_theme') || 'dark');
  const [currentUser, setCurrentUser] = useState<AccountProfile | null>(() => {
    return null;
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('ems_sidebar_collapsed') === 'true');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [locFilter, setLocFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Action Drawer states
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedEmpProfile, setSelectedEmpProfile] = useState(null);
  const [editingEmp, setEditingEmp] = useState(null);
  const [payrollEmp, setPayrollEmp] = useState(null);
  const [quickCheckInDone, setQuickCheckInDone] = useState(false);

  // Activity Feed state
  const [activityFeed, setActivityFeed] = useState([
    { id: 1, text: 'Aarav Sharma requested 2 days Casual Leave', time: '10 mins ago', type: 'leave' },
    { id: 2, text: 'Lucas Meyer onboarded to Engineering', time: '1 hour ago', type: 'onboard' },
    { id: 3, text: 'Monthly payroll batch for New York Office approved', time: '3 hours ago', type: 'payroll' }
  ]);

  // Sync state changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('ems_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleAuthenticated = (account: AccountProfile) => {
    setCurrentUser(account);
  };

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let isActive = true;
    const applySession = async (session) => {
      try {
        const profile = await profileFromSession(session);
        if (isActive) {
          setCurrentUser(profile);
          setDataError('');
        }
      } catch (error) {
        if (isActive) {
          setCurrentUser(null);
          setDataError(error instanceof Error ? error.message : 'Unable to load your Supabase profile.');
          await supabase.auth.signOut();
        }
      } finally {
        if (isActive) setAuthLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setDataError(`Could not read Supabase session: ${error.message}`);
        setAuthLoading(false);
        return;
      }
      void applySession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setEmployees([]);
        setLeaveRequests([]);
        setAuthLoading(false);
      } else if (session) {
        queueMicrotask(() => void applySession(session));
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabaseSignOut();
      setCurrentUser(null);
      setActiveTab('dashboard');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to sign out.');
    }
  };

  useEffect(() => {
    localStorage.setItem('ems_sidebar_collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!currentUser) return;
    let isActive = true;

    Promise.all([listEmployees(), listLeaveRequests()])
      .then(([employeeRows, leaveRows]) => {
        if (!isActive) return;
        setEmployees(employeeRows);
        setLeaveRequests(leaveRows);
        setDataError('');
      })
      .catch(error => {
        if (!isActive) return;
        setEmployees([]);
        setLeaveRequests([]);
        setDataError(error instanceof Error ? error.message : 'Unable to load workforce data.');
      });

    return () => {
      isActive = false;
    };
  }, [currentUser]);

  // Handle employee delete
  const handleDeleteEmployee = (id) => {
    if (confirm('Are you sure you want to permanently delete or archive this employee record?')) {
      void deleteEmployee(id).then(() => {
        setEmployees(prev => prev.filter(e => e.id !== id));
        addActivity(`Employee ${id} was removed from directory`, 'delete');
      }).catch(error => {
        window.alert(error instanceof Error ? error.message : 'Unable to delete employee.');
      });
    }
  };

  // Helper for activity log
  const addActivity = (text, type = 'info') => {
    setActivityFeed(prev => [{ id: Date.now(), text, time: 'Just now', type }, ...prev]);
  };

  // Leave Action Handlers
  const handleLeaveAction = (id, newStatus) => {
    void updateLeaveStatus(id, newStatus).then(() => {
      setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
      addActivity(`Leave request ${id} marked as ${newStatus}`, 'leave');
    }).catch(error => {
      window.alert(error instanceof Error ? error.message : 'Unable to update leave request.');
    });
  };

  // CSV Export Function
  const exportToCSV = () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Designation', 'Role', 'Department', 'Location', 'Status', 'Salary'];
    const rows = filteredEmployees.map(e => [
      e.id, e.firstName, e.lastName, e.email, e.phone, e.designation,
      e.role, e.department, e.location, e.status, e.salary
    ]);
    const csvBlob = new Blob([createCsv(headers, rows)], { type: 'text/csv;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.setAttribute('href', downloadUrl);
    link.setAttribute('download', `EMS_Employee_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    addActivity('Exported employee directory as CSV', 'export');
  };

  // Filtered List Memoization
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const fullSearch = `${emp.firstName} ${emp.lastName} ${emp.designation} ${emp.email} ${emp.id} ${emp.skills ? emp.skills.join(' ') : ''}`.toLowerCase();
      const matchSearch = fullSearch.includes(searchTerm.toLowerCase());
      const matchDept = deptFilter === 'All' || emp.department === deptFilter;
      const matchLoc = locFilter === 'All' || emp.location === locFilter;
      const matchRole = roleFilter === 'All' || emp.role === roleFilter;
      const matchStatus = statusFilter === 'All' || emp.status === statusFilter;

      return matchSearch && matchDept && matchLoc && matchRole && matchStatus;
    });
  }, [employees, searchTerm, deptFilter, locFilter, roleFilter, statusFilter]);

  // Calculated Stats
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'Active').length;
    const onLeave = employees.filter(e => e.status === 'On Leave').length;
    const onboarding = employees.filter(e => e.status === 'Onboarding').length;
    const totalPayroll = employees.reduce((acc, curr) => acc + (Number(curr.salary) || 0) + (Number(curr.bonus) || 0) - (Number(curr.deductions) || 0), 0);
    return { total, active, onLeave, onboarding, totalPayroll };
  }, [employees]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        Connecting to Supabase…
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  const profileRole = ROLE_DETAILS.find(role => role.name === currentUser.role);

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* SIDEBAR NAVIGATION (COLLAPSIBLE / EXPANDABLE) */}
      <aside className={`fixed md:sticky top-0 z-40 h-screen transition-all duration-300 border-r flex flex-col ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      } ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* BRAND HEADER WITH FLOATING TOGGLE BUTTON (Red Circle Area in Screenshot) */}
        <div className="h-16 px-4 border-b border-slate-700/30 flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fadeIn whitespace-nowrap">
                <h1 className={`font-bold text-sm tracking-tight flex items-center gap-1.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Nexus EMS
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold px-1.5 py-0.5 rounded border border-indigo-500/20">
                    PRO
                  </span>
                </h1>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Enterprise Workforce</p>
              </div>
            )}
          </div>

          {/* EXACT CIRCULAR TOGGLE BUTTON CENTERED ON RIGHT SIDEBAR BORDER (Matches Red Circle) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className={`hidden md:flex items-center justify-center absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border shadow-md transition-all duration-200 z-50 ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-indigo-500'
                : 'bg-white border-slate-300 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 hover:border-indigo-400'
            }`}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* NAVIGATION ITEMS */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'directory', label: 'Employee Directory', icon: Users },
            { id: 'attendance', label: 'Attendance & Leaves', icon: Clock },
            { id: 'payroll', label: 'Payroll & Salary', icon: DollarSign },
            { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
            { id: 'settings', label: 'System & Roles', icon: Settings },
            { id: 'profile', label: 'My Account', icon: UserCheck }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all group relative ${
                  isActive
                    ? 'primary-action shadow-md shadow-teal-600/25 dark:shadow-emerald-600/25 font-semibold'
                    : theme === 'dark' 
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : theme === 'dark'
                      ? 'text-slate-400 group-hover:text-indigo-400'
                      : 'text-slate-500 group-hover:text-indigo-600'
                }`} />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* USER PROFILE & LIGHT/DARK TOGGLE */}
        <div className={`p-3 border-t space-y-2 shrink-0 ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-700 text-amber-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 shrink-0 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 shrink-0 text-indigo-600" />
            )}
            {!sidebarCollapsed && (
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>

          {/* User Profile */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            title="Open my account"
            className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
            theme === 'dark' ? 'bg-slate-800/40 border-slate-700/40' : 'bg-slate-100/70 border-slate-200'
          }`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-teal-600 to-cyan-600 text-xs font-bold text-white dark:from-emerald-600 dark:to-teal-700">
              {currentUser.firstName[0]}{currentUser.lastName[0]}
            </span>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className={`text-xs font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className={`text-[10px] truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentUser.role}
                </p>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className={`md:hidden flex items-center justify-between p-4 border-b sticky top-0 z-30 ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 text-slate-400">
            <Menu className="w-6 h-6" />
          </button>
          <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Nexus EMS Portal</span>
        </div>
        {['System Admin', 'HR Manager'].includes(currentUser.role) && (
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="primary-action p-2 rounded-lg text-xs font-medium flex items-center gap-1"
            aria-label="Onboard employee"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR / ACTION HEADER */}
        <header className={`px-6 h-16 border-b flex items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md ${
          theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'
        }`}>
          <div>
            <h2 className={`text-lg font-bold tracking-tight capitalize ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {activeTab.replace('-', ' ')}
            </h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage workforce, track departments, locations, and salary operations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setQuickCheckInDone(!quickCheckInDone);
                addActivity(quickCheckInDone ? 'Admin Checked-Out for the day' : 'Admin Checked-In at office branch', 'attendance');
              }}
              className={`text-xs px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-all border ${
                quickCheckInDone 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                  : theme === 'dark'
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {quickCheckInDone ? 'Checked-In (09:00 AM)' : 'Simulate Check-In'}
            </button>

            <button
              onClick={() => setIsOnboardingOpen(true)}
              disabled={!['System Admin', 'HR Manager'].includes(currentUser.role)}
              title={!['System Admin', 'HR Manager'].includes(currentUser.role) ? 'Only HR Managers and System Admins can onboard employees.' : undefined}
              className="primary-action font-medium px-4 py-2 rounded-xl flex items-center gap-2 text-xs shadow-md shadow-teal-600/20 dark:shadow-emerald-600/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Onboard Employee
            </button>
            <button
              onClick={handleSignOut}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
                theme === 'dark'
                  ? 'border-slate-700 bg-slate-900 text-slate-300 hover:border-rose-800 hover:bg-rose-950/30 hover:text-rose-300'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* WORKSPACE CONTENT AREA */}
        <main className="p-6 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          {dataError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
              {dataError}
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* KPI STAT CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total Staff" value={stats.total} icon={Users} color="indigo" subtext="Across all 5 branches" theme={theme} />
                <KpiCard title="Active Workforce" value={stats.active} icon={UserCheck} color="emerald" subtext={`${Math.round((stats.active/stats.total)*100 || 0)}% present today`} theme={theme} />
                <KpiCard title="On Leave / Absent" value={stats.onLeave} icon={Clock} color="amber" subtext={`${leaveRequests.filter(l=>l.status==='Pending').length} pending approvals`} theme={theme} />
                <KpiCard title="Total Monthly Payroll" value={`$${Math.round(stats.totalPayroll/12).toLocaleString()}`} icon={DollarSign} color="purple" subtext="Net estimated monthly cost" theme={theme} />
              </div>

              {/* MIDDLE ROW: DEPT BREAKDOWN & ACTIVITY FEED */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Department Distribution Progress Bars */}
                <div className={`lg:col-span-2 p-5 rounded-2xl border ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-semibold text-sm flex items-center gap-2 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Building2 className="w-4 h-4 text-indigo-500" />
                      Department Headcount Breakdown
                    </h3>
                    <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{DEPARTMENTS.length} Active Depts</span>
                  </div>
                  <div className="space-y-4">
                    {DEPARTMENTS.map(dept => {
                      const count = employees.filter(e => e.department === dept).length;
                      const pct = Math.round((count / (employees.length || 1)) * 100);
                      return (
                        <div key={dept} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>{dept}</span>
                            <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{count} staff ({pct}%)</span>
                          </div>
                          <div className={`w-full h-2.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent System Activity Stream */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div>
                    <h3 className={`font-semibold text-sm mb-4 flex items-center gap-2 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Recent System Activity
                    </h3>
                    <div className="space-y-3">
                      {activityFeed.slice(0, 5).map(act => (
                        <div key={act.id} className={`flex items-start gap-3 text-xs p-2.5 rounded-xl border ${
                          theme === 'dark' ? 'bg-slate-800/40 border-slate-700/30' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                          <div className="flex-1">
                            <p className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{act.text}</p>
                            <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{act.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('directory')} 
                    className={`mt-4 w-full py-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1 transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-800/60 hover:bg-slate-800 text-indigo-400 border-slate-700/50'
                        : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200'
                    }`}
                  >
                    View Directory <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* BRANCH LOCATIONS HIGHLIGHT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {LOCATIONS.map(loc => {
                  const count = employees.filter(e => e.location === loc).length;
                  return (
                    <div key={loc} className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-purple-500 shrink-0" />
                        <span className={`text-xs font-medium truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{loc}</span>
                      </div>
                      <span className="text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYEE DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* FILTERS & SEARCH CONTROL BAR */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search by Name, Designation, Department, Skill, ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                      theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                  <FilterDropdown label="Dept" value={deptFilter} onChange={setDeptFilter} options={DEPARTMENTS} theme={theme} />
                  <FilterDropdown label="Location" value={locFilter} onChange={setLocFilter} options={LOCATIONS} theme={theme} />
                  <FilterDropdown label="Role" value={roleFilter} onChange={setRoleFilter} options={ROLES} theme={theme} />
                  <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={['Active', 'On Leave', 'Onboarding', 'Terminated']} theme={theme} />
                  
                  <button
                    onClick={exportToCSV}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 font-medium transition-all shadow-sm"
                    title="Export Current Filtered List as CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>

              {/* DATA TABLE */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${
                        theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100/80 border-slate-200 text-slate-700'
                      }`}>
                        <th className="p-4">Employee</th>
                        <th className="p-4">Designation & Role</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Skills & Badges</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-xs ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-400">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                            No employee records match the given criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map(emp => (
                          <tr key={emp.id} className={`transition-colors group ${
                            theme === 'dark' ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                          }`}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow shrink-0">
                                  {emp.firstName[0]}{emp.lastName[0]}
                                </div>
                                <div>
                                  <div className={`font-semibold text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                                    theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                                  }`}>
                                    {emp.firstName} {emp.lastName}
                                  </div>
                                  <div className={`text-[11px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{emp.id} â€¢ {emp.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{emp.designation}</div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mt-1">
                                <ShieldCheck className="w-3 h-3" />
                                {emp.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {emp.department}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1.5 text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                                <MapPin className="w-3.5 h-3.5 text-purple-500" />
                                {emp.location}
                              </span>
                            </td>
                            <td className="p-4 max-w-xs">
                              <div className="flex flex-wrap gap-1">
                                {(emp.skills || []).slice(0, 3).map(skill => (
                                  <span key={skill} className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                    theme === 'dark' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {skill}
                                  </span>
                                ))}
                                {(emp.skills || []).length > 3 && (
                                  <span className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>+{emp.skills.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <StatusBadge status={emp.status} theme={theme} />
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setSelectedEmpProfile(emp)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    theme === 'dark' ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                                  }`}
                                  title="View Profile"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setEditingEmp(emp)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    theme === 'dark' ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-500 hover:text-amber-600 hover:bg-slate-100'
                                  }`}
                                  title="Edit Employee"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    theme === 'dark' ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                                  }`}
                                  title="Delete Employee"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE & LEAVES */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* LEAVE APPROVAL WORKFLOW BANNER */}
              <div className={`p-5 rounded-2xl border ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Leave Request Approvals Workflow
                </h3>
                
                <div className="space-y-3">
                  {leaveRequests.map(req => (
                    <div key={req.id} className={`flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border text-xs ${
                      theme === 'dark' ? 'bg-slate-800/40 border-slate-700/40' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <div className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{req.empName} ({req.empId})</div>
                        <div className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>{req.type} â€¢ {req.startDate} to {req.endDate} ({req.days} days)</div>
                        <div className={`italic mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>"{req.reason}"</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                          req.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                          'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}>
                          {req.status}
                        </span>

                        {req.status === 'Pending' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleLeaveAction(req.id, 'Approved')}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs"
                              title="Approve Leave"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleLeaveAction(req.id, 'Rejected')}
                              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs"
                              title="Reject Leave"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DAILY ATTENDANCE & SHIFTS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map(emp => (
                  <div key={emp.id} className={`p-4 rounded-2xl border space-y-3 ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-semibold text-xs ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{emp.firstName} {emp.lastName}</h4>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">{emp.designation}</p>
                        <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{emp.department} â€¢ {emp.location}</p>
                      </div>
                      <StatusBadge status={emp.status} theme={theme} />
                    </div>

                    <div className={`grid grid-cols-2 gap-2 pt-2 border-t text-xs ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                        <span className={`text-[10px] block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Check-In</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{emp.checkInTime || '09:00 AM'}</span>
                      </div>
                      <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                        <span className={`text-[10px] block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Check-Out</span>
                        <span className={`font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{emp.checkOutTime || '06:00 PM'}</span>
                      </div>
                    </div>

                    <div className={`flex justify-between items-center text-[11px] pt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>Shift: <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>{emp.shift || 'General'}</strong></span>
                      <span>Leaves: <strong className="text-amber-600 dark:text-amber-400">{emp.leaveBalance || 15} Days</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PAYROLL & SALARY */}
          {activeTab === 'payroll' && (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-5 rounded-2xl border flex flex-wrap justify-between items-center gap-4 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Payroll & Compensation Dashboard</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Automated gross salary calculations with base pay, bonuses, and tax deductions</p>
                </div>
                <FilterDropdown label="Dept" value={deptFilter} onChange={setDeptFilter} options={DEPARTMENTS} theme={theme} />
              </div>

              {/* PAYROLL SUMMARY TABLE */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b font-semibold uppercase tracking-wider ${
                      theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}>
                      <th className="p-4">Employee & Designation</th>
                      <th className="p-4">Base Annual Salary</th>
                      <th className="p-4">Annual Bonus</th>
                      <th className="p-4">Est. Deductions</th>
                      <th className="p-4">Est. Net Monthly</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {filteredEmployees.map(emp => {
                      const currency = emp.location.includes('Mumbai') || emp.location.includes('Bangalore') ? 'â‚¹' : '$';
                      const grossAnnual = (Number(emp.salary) || 0) + (Number(emp.bonus) || 0);
                      const netAnnual = grossAnnual - (Number(emp.deductions) || 0);
                      const netMonthly = Math.round(netAnnual / 12);

                      return (
                        <tr key={emp.id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                          <td className="p-4">
                            <div className={`font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{emp.firstName} {emp.lastName}</div>
                            <div className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{emp.designation} ({emp.location})</div>
                          </td>
                          <td className="p-4 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                            {currency}{(Number(emp.salary) || 0).toLocaleString()}
                          </td>
                          <td className="p-4 font-mono text-indigo-600 dark:text-indigo-400">
                            +{currency}{(Number(emp.bonus) || 0).toLocaleString()}
                          </td>
                          <td className="p-4 font-mono text-rose-600 dark:text-rose-400">
                            -{currency}{(Number(emp.deductions) || 0).toLocaleString()}
                          </td>
                          <td className={`p-4 font-mono font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {currency}{netMonthly.toLocaleString()} / mo
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setPayrollEmp(emp)}
                              className="bg-teal-600/10 hover:bg-teal-600/20 text-teal-700 dark:bg-emerald-600/10 dark:hover:bg-emerald-600/20 dark:text-emerald-300 border border-teal-500/30 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" /> Generate Payslip
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS & REPORTS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Organizational Distribution Analytics</h3>
                <button
                  onClick={exportToCSV}
                  className="primary-action text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-medium shadow-md shadow-teal-600/20 dark:shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" /> Download Complete HR Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Department Wise Expense */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Payroll Expense by Department</h4>
                  {DEPARTMENTS.map(dept => {
                    const deptEmps = employees.filter(e => e.department === dept);
                    const totalCost = deptEmps.reduce((a, b) => a + (Number(b.salary) || 0), 0);
                    return (
                      <div key={dept} className={`flex justify-between items-center text-xs border-b pb-2 ${
                        theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                      }`}>
                        <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{dept}</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">${(totalCost/1000).toFixed(0)}k / yr</span>
                      </div>
                    );
                  })}
                </div>

                {/* Role / Access Matrix Distribution */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className="font-semibold text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">Headcount by Access Role</h4>
                  {ROLES.map(role => {
                    const count = employees.filter(e => e.role === role).length;
                    return (
                      <div key={role} className={`flex justify-between items-center text-xs border-b pb-2 ${
                        theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                      }`}>
                        <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{role}</span>
                        <span className={`font-mono px-2.5 py-0.5 rounded font-bold ${
                          theme === 'dark' ? 'bg-slate-800 text-purple-300' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>{count}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Location Headcount */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h4 className="font-semibold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">Branch Office Headcount</h4>
                  {LOCATIONS.map(loc => {
                    const count = employees.filter(e => e.location === loc).length;
                    return (
                      <div key={loc} className={`flex justify-between items-center text-xs border-b pb-2 ${
                        theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
                      }`}>
                        <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{loc}</span>
                        <span className={`font-mono px-2.5 py-0.5 rounded font-bold ${
                          theme === 'dark' ? 'bg-slate-800 text-amber-300' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS & SYSTEM ROLES MATRIX */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn max-w-4xl">
              <div className={`p-6 rounded-2xl border space-y-6 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    <Shield className="w-5 h-5 text-indigo-500" />
                    System Access Control & Roles Matrix
                  </h3>
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Configure permissions for Admin, HR Managers, Team Leads, and Employees
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b font-semibold uppercase ${
                        theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-700'
                      }`}>
                        <th className="p-3">Permission Capability</th>
                        <th className="p-3 text-center">System Admin</th>
                        <th className="p-3 text-center">HR Manager</th>
                        <th className="p-3 text-center">Team Lead</th>
                        <th className="p-3 text-center">Employee</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-slate-200'}`}>
                      {[
                        'Onboard & Create Employee Records',
                        'View Full Salary & Compensation',
                        'Approve Leave Requests',
                        'Generate Payroll Slips',
                        'Edit Role & Access Levels'
                      ].map((perm, idx) => (
                        <tr key={idx}>
                          <td className={`p-3 font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{perm}</td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                          <td className="p-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                          <td className="p-3 text-center">{idx === 2 ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-400 mx-auto" />}</td>
                          <td className="p-3 text-center"><X className="w-4 h-4 text-slate-400 mx-auto" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-5xl space-y-6 animate-fadeIn">
              <section className={`overflow-hidden rounded-2xl border ${
                theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'
              }`}>
                <div className="h-28 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-700 dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-900" />
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    <div className={`-mt-14 flex h-20 w-20 items-center justify-center rounded-2xl border-4 text-2xl font-bold text-white shadow-lg ${
                      theme === 'dark' ? 'border-slate-900 bg-emerald-700' : 'border-white bg-teal-700'
                    }`}>
                      {currentUser.firstName[0]}{currentUser.lastName[0]}
                    </div>
                    <div className="pb-1">
                      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>
                        {currentUser.firstName} {currentUser.lastName}
                      </h3>
                      <p className={theme === 'dark' ? 'text-sm text-slate-400' : 'text-sm text-slate-500'}>
                        {currentUser.designation} · {currentUser.department}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <ShieldCheck className="h-4 w-4" /> {currentUser.role}
                  </span>
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className={`rounded-2xl border p-6 ${
                  theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'
                }`}>
                  <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>Employment information</h3>
                  <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    {[
                      ['Work email', currentUser.email],
                      ['Employee ID', currentUser.employeeId],
                      ['Department', currentUser.department],
                      ['Job title', currentUser.designation],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</dt>
                        <dd className={`mt-1 text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                    Employment details are stored in Supabase and managed through the Employee Directory by users with the appropriate access.
                  </p>
                </section>

                <section className={`rounded-2xl border p-6 ${
                  theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <Shield className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>Role and access</h3>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Prototype role overview, not enforced permissions</p>
                    </div>
                  </div>
                  <h4 className="mt-5 text-sm font-semibold text-teal-800 dark:text-emerald-300">{profileRole?.name}</h4>
                  <p className={`mt-1 text-sm leading-6 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{profileRole?.summary}</p>
                  <ul className="mt-4 space-y-2">
                    {(profileRole?.access ?? []).map(permission => (
                      <li key={permission} className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 dark:text-emerald-400" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    Roles are not selectable during registration. An administrator assigns elevated roles, and Supabase row-level security controls data access.
                  </p>
                </section>
              </div>
              <EmployeeDocuments theme={theme} />
              <ChangePasswordForm theme={theme} />
            </div>
          )}

        </main>
      </div>

      {/* --- MODAL 1: ONBOARDING WIZARD --- */}
      {isOnboardingOpen && (
        <OnboardingModal
          theme={theme}
          onClose={() => setIsOnboardingOpen(false)}
          onAdd={(newEmp) => {
            void createEmployee(newEmp).then(() => {
              setEmployees(prev => [newEmp, ...prev]);
              addActivity(`New Employee ${newEmp.firstName} ${newEmp.lastName} onboarded as ${newEmp.designation}`, 'onboard');
              setIsOnboardingOpen(false);
            }).catch(error => {
              window.alert(error instanceof Error ? error.message : 'Unable to create employee.');
            });
          }}
        />
      )}

      {/* --- MODAL 2: VIEW FULL PROFILE --- */}
      {selectedEmpProfile && (
        <ProfileModal
          theme={theme}
          emp={selectedEmpProfile}
          onClose={() => setSelectedEmpProfile(null)}
        />
      )}

      {/* --- MODAL 3: EDIT EMPLOYEE --- */}
      {editingEmp && (
        <EditModal
          theme={theme}
          emp={editingEmp}
          onClose={() => setEditingEmp(null)}
          onSave={(updated) => {
            void updateEmployee(updated).then(() => {
              setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
              addActivity(`Updated profile details for ${updated.firstName} ${updated.lastName}`, 'edit');
              setEditingEmp(null);
            }).catch(error => {
              window.alert(error instanceof Error ? error.message : 'Unable to update employee.');
            });
          }}
        />
      )}

      {/* --- MODAL 4: PAYSLIP PREVIEW --- */}
      {payrollEmp && (
        <PayslipModal
          theme={theme}
          emp={payrollEmp}
          onClose={() => setPayrollEmp(null)}
        />
      )}

    </div>
  );
}

// --- HELPER COMPONENTS ---
