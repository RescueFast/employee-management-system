export const ROLE_DETAILS = [
  {
    name: 'System Admin',
    summary: 'Oversees workforce records, system settings, permissions, and organization-wide reporting.',
    access: ['Manage employee records', 'Review compensation', 'Manage system roles', 'View all reports'],
  },
  {
    name: 'HR Manager',
    summary: 'Coordinates onboarding, employee updates, leave approvals, and people operations.',
    access: ['Onboard employees', 'Review employee records', 'Approve leave requests', 'View HR reports'],
  },
  {
    name: 'Team Lead',
    summary: 'Supports a team and reviews team leave and attendance information.',
    access: ['View team directory', 'Review team attendance', 'Approve team leave requests'],
  },
  {
    name: 'Employee',
    summary: 'Views personal employment details and submits attendance or leave information.',
    access: ['View personal profile', 'View personal payslips', 'Submit leave requests'],
  },
];

export const ROLE_NAMES = ROLE_DETAILS.map(role => role.name);
