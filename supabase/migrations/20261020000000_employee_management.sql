create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  employee_id text not null,
  department text not null default '',
  designation text not null default '',
  role text not null default 'Employee'
    check (role in ('System Admin', 'HR Manager', 'Team Lead', 'Employee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  employee_id text primary key,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null default '',
  designation text not null,
  role text not null default 'Employee'
    check (role in ('System Admin', 'HR Manager', 'Team Lead', 'Employee')),
  department text not null,
  location text not null default 'Remote / Flexible',
  status text not null default 'Active'
    check (status in ('Active', 'On Leave', 'Onboarding', 'Terminated')),
  joining_date date not null default current_date,
  employment_type text not null default 'Full-Time',
  skills text[] not null default '{}',
  leave_balance integer not null default 15 check (leave_balance >= 0),
  attendance_rate numeric(5, 2) not null default 100 check (attendance_rate between 0 and 100),
  check_in_time text not null default '---',
  check_out_time text not null default '---',
  shift text not null default 'General (09:00 - 18:00)',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_private_details (
  employee_id text primary key references public.employees (employee_id) on delete cascade,
  address text not null default '',
  emergency_contact text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_compensation (
  employee_id text primary key references public.employees (employee_id) on delete cascade,
  salary numeric(14, 2) not null default 0 check (salary >= 0),
  bonus numeric(14, 2) not null default 0 check (bonus >= 0),
  deductions numeric(14, 2) not null default 0 check (deductions >= 0),
  bank_account text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null references public.employees (employee_id) on delete cascade,
  leave_type text not null,
  start_date date not null,
  end_date date not null,
  days integer not null check (days > 0),
  status text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Rejected')),
  reason text not null default '',
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null references public.employees (employee_id) on delete cascade,
  uploaded_by uuid not null references auth.users (id) on delete restrict,
  pathname text not null unique,
  original_name text not null,
  content_type text not null
    check (content_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  category text not null default 'employee-files'
    check (category in ('employee-files', 'profile-images')),
  created_at timestamptz not null default now()
);

create index if not exists employees_department_idx on public.employees (department);
create index if not exists employees_auth_user_id_idx on public.employees (auth_user_id);
create unique index if not exists employees_email_lower_idx on public.employees (lower(email));
create index if not exists leave_requests_employee_id_idx on public.leave_requests (employee_id);
create index if not exists employee_documents_employee_id_idx on public.employee_documents (employee_id);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid())
$$;

create or replace function public.is_hr_or_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() in ('System Admin', 'HR Manager'), false)
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_employee_id text;
begin
  new_employee_id := upper(trim(coalesce(new.raw_user_meta_data ->> 'employee_id', '')));
  if new_employee_id = '' then
    raise exception 'Employee ID is required to create an account';
  end if;

  insert into public.profiles (id, first_name, last_name, employee_id, department, designation, role)
  values (
    new.id,
    trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')),
    trim(coalesce(new.raw_user_meta_data ->> 'last_name', '')),
    new_employee_id,
    trim(coalesce(new.raw_user_meta_data ->> 'department', '')),
    trim(coalesce(new.raw_user_meta_data ->> 'designation', '')),
    'Employee'
  );

  return new;
end;
$$;

create or replace function public.link_current_employee()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_email text;
  email_is_verified boolean;
begin
  select lower(coalesce(auth_user.email, '')), auth_user.email_confirmed_at is not null
    into current_email, email_is_verified
    from auth.users auth_user
    where auth_user.id = (select auth.uid());

  current_email := coalesce(current_email, '');
  email_is_verified := coalesce(email_is_verified, false);
  if current_email = '' or not email_is_verified then
    return;
  end if;

  update public.employees employee
    set auth_user_id = (select auth.uid()),
        updated_at = now()
    where employee.auth_user_id is null
      and lower(employee.email) = current_email
      and employee.employee_id = (
        select profile.employee_id from public.profiles profile
        where profile.id = (select auth.uid())
      );

  update public.profiles profile
    set department = employee.department,
        designation = employee.designation
    from public.employees employee
    where profile.id = (select auth.uid())
      and employee.auth_user_id = (select auth.uid())
      and profile.employee_id = employee.employee_id;
end;
$$;

revoke all on function public.link_current_employee() from public, anon;
grant execute on function public.link_current_employee() to authenticated;

drop trigger if exists on_auth_user_created_employee_profile on auth.users;
create trigger on_auth_user_created_employee_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.employee_compensation enable row level security;
alter table public.leave_requests enable row level security;
alter table public.employee_documents enable row level security;
alter table public.employee_private_details enable row level security;

revoke all on public.profiles, public.employees, public.employee_compensation,
  public.employee_private_details, public.leave_requests, public.employee_documents from anon;

grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant select, insert, update, delete on public.employees to authenticated;
grant select, insert, update, delete on public.employee_compensation to authenticated;
grant select, insert, update, delete on public.employee_private_details to authenticated;
grant select, insert, update on public.leave_requests to authenticated;
grant select, insert, delete on public.employee_documents to authenticated;

drop policy if exists "Users read own profile or HR reads all" on public.profiles;
create policy "Users read own profile or HR reads all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_hr_or_admin());

drop policy if exists "Users update own non-role profile fields" on public.profiles;
create policy "Users update own non-role profile fields"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Workforce directory access" on public.employees;
create policy "Workforce directory access"
  on public.employees for select to authenticated
  using (
    public.is_hr_or_admin()
    or auth_user_id = (select auth.uid())
    or (
      public.current_user_role() = 'Team Lead'
      and department = (
        select profile.department from public.profiles profile
        where profile.id = (select auth.uid())
      )
    )
  );

drop policy if exists "HR manage employee directory" on public.employees;
create policy "HR manage employee directory"
  on public.employees for all to authenticated
  using (public.is_hr_or_admin())
  with check (public.is_hr_or_admin());

drop policy if exists "Compensation visible to HR and employee" on public.employee_compensation;
create policy "Compensation visible to HR and employee"
  on public.employee_compensation for select to authenticated
  using (
    public.is_hr_or_admin()
    or exists (
      select 1 from public.employees employee
      where employee.employee_id = employee_compensation.employee_id
        and employee.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "HR manage compensation" on public.employee_compensation;
create policy "HR manage compensation"
  on public.employee_compensation for all to authenticated
  using (public.is_hr_or_admin())
  with check (public.is_hr_or_admin());

drop policy if exists "Private details visible to HR and employee" on public.employee_private_details;
create policy "Private details visible to HR and employee"
  on public.employee_private_details for select to authenticated
  using (
    public.is_hr_or_admin()
    or exists (
      select 1 from public.employees employee
      where employee.employee_id = employee_private_details.employee_id
        and employee.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "HR manage private employee details" on public.employee_private_details;
create policy "HR manage private employee details"
  on public.employee_private_details for all to authenticated
  using (public.is_hr_or_admin())
  with check (public.is_hr_or_admin());

drop policy if exists "Employee and HR read leave requests" on public.leave_requests;
create policy "Employee and HR read leave requests"
  on public.leave_requests for select to authenticated
  using (
    public.is_hr_or_admin()
    or exists (
      select 1 from public.employees employee
      where employee.employee_id = leave_requests.employee_id
        and employee.auth_user_id = (select auth.uid())
    )
    or (
      public.current_user_role() = 'Team Lead'
      and exists (
        select 1 from public.employees employee
        join public.profiles profile on profile.id = (select auth.uid())
        where employee.employee_id = leave_requests.employee_id
          and employee.department = profile.department
      )
    )
  );

drop policy if exists "Employees submit their own leave requests" on public.leave_requests;
create policy "Employees submit their own leave requests"
  on public.leave_requests for insert to authenticated
  with check (
    status = 'Pending'
    and exists (
      select 1 from public.employees employee
      where employee.employee_id = leave_requests.employee_id
        and employee.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "HR and team leads review leave requests" on public.leave_requests;
create policy "HR and team leads review leave requests"
  on public.leave_requests for update to authenticated
  using (
    public.is_hr_or_admin()
    or (
      public.current_user_role() = 'Team Lead'
      and exists (
        select 1 from public.employees employee
        join public.profiles profile on profile.id = (select auth.uid())
        where employee.employee_id = leave_requests.employee_id
          and employee.department = profile.department
      )
    )
  )
  with check (
    public.is_hr_or_admin()
    or (
      public.current_user_role() = 'Team Lead'
      and exists (
        select 1 from public.employees employee
        join public.profiles profile on profile.id = (select auth.uid())
        where employee.employee_id = leave_requests.employee_id
          and employee.department = profile.department
      )
    )
  );

drop policy if exists "Employees read own documents or HR reads all" on public.employee_documents;
create policy "Employees read own documents or HR reads all"
  on public.employee_documents for select to authenticated
  using (
    public.is_hr_or_admin()
    or exists (
      select 1 from public.employees employee
      where employee.employee_id = employee_documents.employee_id
        and employee.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "HR upload and delete employee documents" on public.employee_documents;
create policy "HR upload and delete employee documents"
  on public.employee_documents for insert to authenticated
  with check (public.is_hr_or_admin() and uploaded_by = (select auth.uid()));

drop policy if exists "Employees upload their own documents" on public.employee_documents;
create policy "Employees upload their own documents"
  on public.employee_documents for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and exists (
      select 1 from public.employees employee
      where employee.employee_id = employee_documents.employee_id
        and employee.auth_user_id = (select auth.uid())
    )
  );

create policy "HR delete employee documents"
  on public.employee_documents for delete to authenticated
  using (public.is_hr_or_admin());

-- Promote the initial administrator manually after creating the account and
-- verifying its email. Never expose an admin role selector in public signup.
-- update public.profiles
-- set role = 'System Admin'
-- where id = (select id from auth.users where email = 'admin@your-company.com');
