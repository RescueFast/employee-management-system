# Nexus Employee Management System

A React, TypeScript, Vite, and Tailwind CSS employee management dashboard for
organizing employee details and workforce operations.

## Requirements

- Node.js 18 or newer
- npm

## Getting started

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build, run:

```bash
npm run build
npm run preview
```

## Project structure

```text
src/
  components/
    auth/          Supabase sign-in, registration, and account recovery
    dialogs/       Separate employee onboarding, profile, edit, and payslip dialogs
    settings/      Document storage placeholder and password updates
    ui.tsx         Reusable dashboard cards, filters, and status badges
  data/            Roles, leave types, and directory options
  lib/             Supabase auth and employee data access
  types/           Account and role types
  utils/           Spreadsheet-safe CSV exports
  App.tsx          Application state and dashboard screens
  index.css        Tailwind layers and global styles
  main.tsx         React application entry point
supabase/
  migrations/      PostgreSQL schema, triggers, and row-level security
```

Supabase Auth handles login, registration, sessions, and email password resets.
Employee and leave data are fetched from Supabase Postgres under row-level
security policies. Compensation and private contact details are stored in
separate protected tables. New accounts receive the `Employee` role; users
cannot promote themselves from the client. Theme and sidebar preferences remain
in browser local storage.

## Environment setup

1. Copy `.env.example` to `.env.local` and fill in your Supabase Project URL and
   publishable key. Never put a database password or `service_role` key in a
   `VITE_` variable.
2. In the Supabase SQL Editor, run
   `supabase/migrations/20261020000000_employee_management.sql`.
3. In Supabase Authentication settings, enable email/password, decide whether
   email confirmation is required, set the site URL to your deployed URL, and
   add `http://localhost:5173` plus the deployed URL to allowed redirect URLs.
   Employee linking checks the confirmed email directly against Supabase Auth
   and the employee record; it does not rely on a client-provided verification
   flag.
4. Create the first account using the app. In the SQL Editor, verify the email
   and promote that account to the initial administrator:

   ```sql
   update public.profiles
   set role = 'System Admin'
   where id = (select id from auth.users where email = 'your-admin@company.com');
   ```

5. Sign in as that administrator and add employee records before employees
   register. An employee account links only when the verified sign-in email and
   employee ID both match the pre-created employee record.
6. Add the two Supabase environment variables from `.env.example` to Vercel
   and deploy. `npm run dev` runs the Vite client locally.

Employee document metadata remains in the Supabase schema, but file upload and
download are currently disabled because no document storage provider is
configured. The document area in **System & Roles** indicates this status. You
can add a storage provider later without changing employee, leave, or sign-in
data. The role-matrix screen is informational; change roles only through a
trusted admin workflow or the Supabase SQL Editor.
