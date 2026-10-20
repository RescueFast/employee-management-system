import { useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { requireSupabase } from '../../lib/supabase';

export default function ChangePasswordForm({ theme }: { theme: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await requireSupabase().auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword('');
      setConfirmPassword('');
      setMessage('Your password has been updated.');
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Unable to update your password.');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass = `w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/10 ${
    theme === 'dark'
      ? 'border-slate-700 bg-slate-950 text-slate-100'
      : 'border-slate-200 bg-white text-slate-800'
  }`;

  return (
    <section className={`rounded-2xl border p-6 ${
      theme === 'dark' ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white shadow-sm'
    }`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-emerald-950 dark:text-emerald-300">
          <LockKeyhole className="h-5 w-5" />
        </span>
        <div>
          <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>Password and recovery</h3>
          <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            If you arrived here from a recovery email, set your new password below.
          </p>
        </div>
      </div>
      <form onSubmit={savePassword} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
          New password
          <input className={`${fieldClass} mt-1.5`} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} />
        </label>
        <label className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
          Confirm password
          <input className={`${fieldClass} mt-1.5`} type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
        </label>
        <button type="submit" disabled={isSaving} className="primary-action rounded-xl px-4 py-3 text-xs font-semibold disabled:opacity-60">
          {isSaving ? 'Updating…' : 'Update password'}
        </button>
      </form>
      {(error || message) && (
        <p role={error ? 'alert' : 'status'} className={`mt-3 text-xs ${error ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
          {error || message}
        </p>
      )}
    </section>
  );
}
