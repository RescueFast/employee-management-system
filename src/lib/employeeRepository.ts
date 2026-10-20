import { requireSupabase } from './supabase';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  role: string;
  department: string;
  location: string;
  status: string;
  joiningDate: string;
  employmentType: string;
  salary: number;
  bonus: number;
  deductions: number;
  bankAccount: string;
  address: string;
  emergencyContact: string;
  skills: string[];
  leaveBalance: number;
  attendanceRate: number;
  checkInTime: string;
  checkOutTime: string;
  shift: string;
}

export interface LeaveRequest {
  id: string;
  empId: string;
  empName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string;
}

interface EmployeeRow {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  designation: string;
  role: string;
  department: string;
  location: string;
  status: string;
  joining_date: string;
  employment_type: string;
  skills: string[];
  leave_balance: number;
  attendance_rate: number;
  check_in_time: string;
  check_out_time: string;
  shift: string;
}

interface PrivateDetailsRow {
  employee_id: string;
  address: string;
  emergency_contact: string;
}

interface CompensationRow {
  employee_id: string;
  salary: number;
  bonus: number;
  deductions: number;
  bank_account: string;
}

interface LeaveRow {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string;
  employee?: Pick<EmployeeRow, 'first_name' | 'last_name'> | Pick<EmployeeRow, 'first_name' | 'last_name'>[] | null;
}

function throwDatabaseError(error: { message: string } | null) {
  if (error) throw new Error(`Supabase request failed: ${error.message}`);
}

function toEmployee(
  row: EmployeeRow,
  compensation?: CompensationRow,
  privateDetails?: PrivateDetailsRow,
): Employee {
  return {
    id: row.employee_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    designation: row.designation,
    role: row.role,
    department: row.department,
    location: row.location,
    status: row.status,
    joiningDate: row.joining_date,
    employmentType: row.employment_type,
    salary: Number(compensation?.salary ?? 0),
    bonus: Number(compensation?.bonus ?? 0),
    deductions: Number(compensation?.deductions ?? 0),
    bankAccount: compensation?.bank_account ?? '',
    address: privateDetails?.address ?? '',
    emergencyContact: privateDetails?.emergency_contact ?? '',
    skills: row.skills ?? [],
    leaveBalance: row.leave_balance,
    attendanceRate: Number(row.attendance_rate),
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    shift: row.shift,
  };
}

function toEmployeeRow(employee: Employee) {
  return {
    employee_id: employee.id,
    first_name: employee.firstName,
    last_name: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? '',
    designation: employee.designation,
    role: employee.role,
    department: employee.department,
    location: employee.location,
    status: employee.status,
    joining_date: employee.joiningDate,
    employment_type: employee.employmentType,
    skills: employee.skills ?? [],
    leave_balance: employee.leaveBalance ?? 15,
    attendance_rate: employee.attendanceRate ?? 100,
    check_in_time: employee.checkInTime ?? '---',
    check_out_time: employee.checkOutTime ?? '---',
    shift: employee.shift ?? 'General (09:00 - 18:00)',
  };
}

function toPrivateDetailsRow(employee: Employee) {
  return {
    employee_id: employee.id,
    address: employee.address ?? '',
    emergency_contact: employee.emergencyContact ?? '',
  };
}

function toCompensationRow(employee: Employee) {
  return {
    employee_id: employee.id,
    salary: Number(employee.salary) || 0,
    bonus: Number(employee.bonus) || 0,
    deductions: Number(employee.deductions) || 0,
    bank_account: employee.bankAccount ?? '',
  };
}

export async function listEmployees(): Promise<Employee[]> {
  const client = requireSupabase();
  const [employeesResult, compensationResult, privateDetailsResult] = await Promise.all([
    client.from('employees').select('*').order('first_name'),
    client.from('employee_compensation').select('*'),
    client.from('employee_private_details').select('*'),
  ]);
  throwDatabaseError(employeesResult.error);
  throwDatabaseError(compensationResult.error);
  throwDatabaseError(privateDetailsResult.error);

  const compensationById = new Map(
    ((compensationResult.data ?? []) as CompensationRow[]).map(row => [row.employee_id, row]),
  );
  const detailsById = new Map(
    ((privateDetailsResult.data ?? []) as PrivateDetailsRow[]).map(row => [row.employee_id, row]),
  );
  return ((employeesResult.data ?? []) as EmployeeRow[]).map(row =>
    toEmployee(row, compensationById.get(row.employee_id), detailsById.get(row.employee_id)),
  );
}

export async function listLeaveRequests(): Promise<LeaveRequest[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('leave_requests')
    .select('id, employee_id, leave_type, start_date, end_date, days, status, reason, employee:employees(first_name,last_name)')
    .order('start_date', { ascending: false });
  throwDatabaseError(error);

  return ((data ?? []) as unknown as LeaveRow[]).map(row => {
    const employee = Array.isArray(row.employee) ? row.employee[0] : row.employee;
    return {
      id: row.id,
      empId: row.employee_id,
      empName: employee ? `${employee.first_name} ${employee.last_name}` : row.employee_id,
      type: row.leave_type,
      startDate: row.start_date,
      endDate: row.end_date,
      days: row.days,
      status: row.status,
      reason: row.reason,
    };
  });
}

export async function createEmployee(employee: Employee) {
  const client = requireSupabase();
  const { error } = await client.from('employees').insert(toEmployeeRow(employee));
  throwDatabaseError(error);
  const { error: detailsError } = await client
    .from('employee_private_details')
    .insert(toPrivateDetailsRow(employee));
  throwDatabaseError(detailsError);
  const { error: compensationError } = await client
    .from('employee_compensation')
    .insert(toCompensationRow(employee));
  throwDatabaseError(compensationError);
}

export async function updateEmployee(employee: Employee) {
  const client = requireSupabase();
  const { error } = await client
    .from('employees')
    .update(toEmployeeRow(employee))
    .eq('employee_id', employee.id);
  throwDatabaseError(error);
  const { error: detailsError } = await client
    .from('employee_private_details')
    .upsert(toPrivateDetailsRow(employee), { onConflict: 'employee_id' });
  throwDatabaseError(detailsError);
  const { error: compensationError } = await client
    .from('employee_compensation')
    .upsert(toCompensationRow(employee), { onConflict: 'employee_id' });
  throwDatabaseError(compensationError);
}

export async function deleteEmployee(employeeId: string) {
  const { error } = await requireSupabase()
    .from('employees')
    .delete()
    .eq('employee_id', employeeId);
  throwDatabaseError(error);
}

export async function updateLeaveStatus(id: string, status: string) {
  const { error } = await requireSupabase()
    .from('leave_requests')
    .update({ status })
    .eq('id', id);
  throwDatabaseError(error);
}
