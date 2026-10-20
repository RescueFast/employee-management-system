export type UserRole = 'System Admin' | 'HR Manager' | 'Team Lead' | 'Employee';

export interface AccountProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  department: string;
  designation: string;
  role: UserRole;
}
