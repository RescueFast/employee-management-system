import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';
import { DEPARTMENTS } from '../../data/seedData';
import { registerAccount, requestPasswordReset, signIn } from '../../lib/supabase-auth';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { AccountProfile } from '../../types/auth';

type AuthPage = 'login' | 'register' | 'forgot';

interface AuthScreenProps {
  theme: string;
  onToggleTheme: () => void;
  onAuthenticated: (account: AccountProfile) => void;
}

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10';

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200';

export default function AuthScreen({ theme, onToggleTheme, onAuthenticated }: AuthScreenProps) {
  const [page, setPage] = useState<AuthPage>('login');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeId: '',
    department: DEPARTMENTS[0],
    designation: '',
    password: '',
    confirmPassword: '',
  });

  const changePage = (nextPage: AuthPage) => {
    setPage(nextPage);
    setError('');
    setNotice('');
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const account = await signIn(form.email, form.password);
      onAuthenticated(account);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const account = await registerAccount(form);
      if (account) {
        onAuthenticated(account);
      } else {
        setNotice('Check your inbox and confirm your email address to finish creating your account. Your role will be Employee until an administrator updates it.');
      }
    } catch (registrationError) {
      setError(registrationError instanceof Error ? registrationError.message : 'Unable to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await requestPasswordReset(form.email);
      setNotice('If an account exists for this email, Supabase has sent password recovery instructions.');
    } catch (recoveryError) {
      setError(recoveryError instanceof Error ? recoveryError.message : 'Unable to check the account. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <a href="#login" onClick={() => changePage('login')} className="inline-flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-lg shadow-teal-900/15 dark:bg-emerald-600">
            <Building2 className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-white">Nexus EMS</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Workforce portal</span>
          </span>
        </a>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-7xl items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              One place for your people operations
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-950 xl:text-5xl dark:text-white">
              Bring your workforce into focus.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
              Keep employee profiles, attendance, leave, and payroll information organized in one clear workspace.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Users, title: 'People directory', detail: 'Employee details and teams' },
                { icon: BriefcaseBusiness, title: 'Workforce insights', detail: 'Attendance and compensation' },
              ].map(item => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <h2 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
              Supabase authenticates accounts. Roles are assigned by database policies and administrator controls, not selected during sign-up.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
            <div className="mb-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 dark:bg-emerald-950 dark:text-emerald-300">
                {page === 'login' ? <LockKeyhole className="h-5 w-5" /> : page === 'register' ? <Users className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
              </span>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {page === 'login' ? 'Welcome back' : page === 'register' ? 'Create your account' : 'Recover your account'}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {page === 'login'
                  ? 'Sign in with your work account to continue.'
                  : page === 'register'
                    ? 'Add your employee details and choose a demo role.'
                    : 'Enter your work email to check the recovery process.'}
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
                {error}
              </div>
            )}
            {notice && (
              <div role="status" className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-5 text-teal-900 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
                {notice}
              </div>
            )}

            {page === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelClass} htmlFor="login-email">Work email</label>
                  <input id="login-email" className={fieldClass} type="email" autoComplete="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label className={labelClass + ' mb-0'} htmlFor="login-password">Password</label>
                    <button type="button" onClick={() => changePage('forgot')} className="text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-emerald-300 dark:hover:text-emerald-200">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input id="login-password" className={fieldClass + ' pr-12'} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" />
                    <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="primary-action flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-md shadow-teal-700/15 disabled:cursor-wait disabled:opacity-60 dark:shadow-emerald-700/15">
                  {isSubmitting ? 'Signing in…' : 'Sign in'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                </button>
                <p className="pt-2 text-center text-sm text-slate-600 dark:text-slate-400">
                  New to Nexus?{' '}
                  <button type="button" onClick={() => changePage('register')} className="font-semibold text-teal-700 hover:text-teal-900 dark:text-emerald-300 dark:hover:text-emerald-200">Create an account</button>
                </p>
              </form>
            )}

            {page === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="first-name">First name</label>
                    <input id="first-name" className={fieldClass} autoComplete="given-name" required value={form.firstName} onChange={event => setForm({ ...form, firstName: event.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="last-name">Last name</label>
                    <input id="last-name" className={fieldClass} autoComplete="family-name" required value={form.lastName} onChange={event => setForm({ ...form, lastName: event.target.value })} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="register-email">Work email</label>
                    <input id="register-email" className={fieldClass} type="email" autoComplete="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="employee-id">Employee ID</label>
                    <input id="employee-id" className={fieldClass} autoComplete="off" required value={form.employeeId} onChange={event => setForm({ ...form, employeeId: event.target.value })} placeholder="e.g. EMP-1008" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="register-department">Department</label>
                    <select id="register-department" className={fieldClass} value={form.department} onChange={event => setForm({ ...form, department: event.target.value })}>
                      {DEPARTMENTS.map(department => <option key={department}>{department}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="designation">Job title / designation</label>
                    <input id="designation" className={fieldClass} required value={form.designation} onChange={event => setForm({ ...form, designation: event.target.value })} placeholder="e.g. Software Engineer" />
                  </div>
                </div>
                <p className="rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-3 text-xs leading-5 text-teal-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200">
                  New accounts start with the Employee role. An administrator can assign an elevated role after verifying your account.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="register-password">Password</label>
                    <input id="register-password" className={fieldClass} type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use at least 8 characters.</p>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="confirm-password">Confirm password</label>
                    <input id="confirm-password" className={fieldClass} type="password" autoComplete="new-password" minLength={8} required value={form.confirmPassword} onChange={event => setForm({ ...form, confirmPassword: event.target.value })} />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="primary-action flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-md shadow-teal-700/15 disabled:cursor-wait disabled:opacity-60 dark:shadow-emerald-700/15">
                  {isSubmitting ? 'Creating account…' : 'Create account'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => changePage('login')} className="flex w-full items-center justify-center gap-2 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </button>
              </form>
            )}

            {page === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className={labelClass} htmlFor="recovery-email">Work email</label>
                  <input id="recovery-email" className={fieldClass} type="email" autoComplete="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="you@company.com" />
                </div>
                <button type="submit" className="primary-action flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-md shadow-teal-700/15 dark:shadow-emerald-700/15">
                  Check recovery options <ArrowRight className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => changePage('login')} className="flex w-full items-center justify-center gap-2 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </button>
              </form>
            )}

            <div className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700 dark:text-emerald-300" />
              {isSupabaseConfigured
                ? 'Authentication and account recovery are handled by Supabase. Database access is controlled by row-level security.'
                : 'Add Supabase URL and publishable key to .env.local before using authentication.'}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span>System Admin</span><span>HR Manager</span><span>Team Lead</span><span>Employee</span>
          </div>
        </section>
      </div>
    </main>
  );
}
