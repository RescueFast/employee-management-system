import type { Session, User } from '@supabase/supabase-js';
import { requireSupabase } from './supabase';
import type { AccountProfile } from '../types/auth';

interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  department: string;
  designation: string;
  role: AccountProfile['role'];
}

function getMetadataString(user: User, key: string, fallback = '') {
  const value: unknown = user.user_metadata[key];
  return typeof value === 'string' ? value : fallback;
}

export async function getAccountProfile(user: User): Promise<AccountProfile> {
  const client = requireSupabase();
  const { error: linkError } = await client.rpc('link_current_employee');
  if (linkError) {
    throw new Error(`Could not securely link your verified employee record: ${linkError.message}`);
  }
  const { data, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, employee_id, department, designation, role')
    .eq('id', user.id)
    .single();

  if (error) throw new Error(`Could not load your account profile: ${error.message}`);

  const profile = data as ProfileRow;
  return {
    id: profile.id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: user.email ?? '',
    employeeId: profile.employee_id,
    department: profile.department,
    designation: profile.designation,
    role: profile.role,
  };
}

export async function registerAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  password: string;
}) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: {
        first_name: input.firstName.trim(),
        last_name: input.lastName.trim(),
        employee_id: input.employeeId.trim().toUpperCase(),
        department: input.department,
        designation: input.designation.trim(),
      },
    },
  });

  if (error) throw error;
  if (!data.session || !data.user) return null;
  return getAccountProfile(data.user);
}

export async function signIn(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw error;
  return getAccountProfile(data.user);
}

export async function requestPasswordReset(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw error;
}

export async function profileFromSession(session: Session | null) {
  if (!session?.user) return null;
  return getAccountProfile(session.user);
}

export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}
