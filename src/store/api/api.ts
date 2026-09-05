import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clientEnv } from '@/lib/env';
import type {
  ApiSuccess,
  AttendanceDaySummary,
  AttendanceImport,
  AttendanceImportDetail,
  AttendanceMe,
  AttendanceReviewCard,
  AttendanceReviewDay,
  AuditLog,
  ConfirmedPayrollImport,
  CalculatePayrollInput,
  PayrollPreview,
  Company,
  CompanyLogoUpload,
  Compensation,
  DirectoryEditRequest,
  DirectoryEditRequestForEmployee,
  DirectoryEditRequestStatus,
  Employee,
  EmployeePayroll,
  Grievance,
  GrievanceCounts,
  GrievanceDetail,
  GrievanceHandler,
  GrievanceUploadSession,
  HealthData,
  Holiday,
  HrPolicy,
  LeaveApplication,
  LeaveAllocation,
  LeaveBalance,
  LeaveColleague,
  LeaveProjectOption,
  LeavePolicy,
  LeaveType,
  MeData,
  NamedEntity,
  OrganizationSettings,
  PaymentDetails,
  PolicyAcknowledgementReport,
  PayrollRun,
  PayrollRunDetail,
  ReportsOverview,
  Role,
  SalarySlip,
  Shift,
  ShiftAssignment,
  WorkWeek,
  WeeklyWorkBoard,
  WorkOverview,
  WorkBoard,
  WorkPrioritiesQueue,
  WorkPrioritiesApproved,
  WorkAnalytics,
  WorkSettings,
  WorkPriority,
  WorkProject,
  EmployeeWorkProjects,
  LeadProjectSummary,
  LeadProjectDesk,
  LeadDailyWorkBoard,
  LeadPermissionsBoard,
  ProjectStatusUpdate,
  ProjectUpdateTopic,
  ProjectPlan,
  ProjectGoal,
  ProjectGoalListItem,
  ProjectMilestone,
  ProjectMilestoneListItem,
  MilestoneHistoryEntry,
  WorkProjectMember,
  WorkDayBoard,
  WorkHistoryMonth,
  WeeklyWorkUpdateBoard,
  WeeklyWorkUpdateUploadSession,
  JcPptEmployeeBoard,
  JcPptUploadSession,
  JcPptCsoBoard,
  JcPptGmBoard,
  JcPptConsumeResult,
  JcPptItem,
  WeeklyPptConsumeResult,
  WeeklyPptAdminBoard,
  WeeklyPptGmShares,
  NotificationItem,
  WorkPermission,
  WorkPermissionMine,
  ShiftChangeRequest,
} from '@/types/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: clientEnv.apiUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: { accessToken: string | null } }).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Me',
    'Employees',
    'Companies',
    'Payroll',
    'PayrollRuns',
    'Departments',
    'Designations',
    'Roles',
    'Settings',
    'Audit',
    'LeaveTypes',
    'LeavePolicies',
    'LeaveBalances',
    'LeaveAllocations',
    'LeaveApplications',
    'Holidays',
    'Attendance',
    'AttendanceImports',
    'Shifts',
    'WorkWeeks',
    'Grievances',
    'Policies',
    'Notifications',
    'Reports',
    'WorkPermissions',
    'ShiftChanges',
    'Work',
    'DirectoryEditRequests',
  ],
  endpoints: (builder) => ({
    getHealth: builder.query<ApiSuccess<HealthData>, void>({
      query: () => '/health',
    }),
    getMe: builder.query<ApiSuccess<MeData>, void>({
      query: () => '/api/v1/me',
      providesTags: ['Me'],
    }),
    requestPasswordReset: builder.mutation<ApiSuccess<{ sent: true }>, { email: string }>({
      query: (body) => ({
        url: '/api/v1/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    getEmployees: builder.query<ApiSuccess<Employee[]>, { q?: string; status?: 'active' | 'inactive' } | void>({
      query: (arg) => ({
        url: '/api/v1/employees',
        params:
          arg && typeof arg === 'object'
            ? {
                ...(arg.q ? { q: arg.q } : {}),
                ...(arg.status ? { status: arg.status } : {}),
              }
            : undefined,
      }),
      providesTags: ['Employees'],
    }),
    getEmployee: builder.query<ApiSuccess<Employee>, string>({
      query: (id) => `/api/v1/employees/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Employees', id }],
    }),
    createEmployee: builder.mutation<
      ApiSuccess<Employee>,
      {
        employeeCode: string;
        fullName: string;
        email: string;
        phone?: string;
        departmentId?: string;
        designationId?: string;
        joiningDate: string;
        employmentType: Employee['employmentType'];
        password: string;
        emailVerificationToken: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/employees', method: 'POST', body }),
      invalidatesTags: ['Employees', 'Designations', 'Notifications'],
    }),
    sendWorkEmailOtp: builder.mutation<ApiSuccess<{ sent: true }>, { email: string }>({
      query: (body) => ({ url: '/api/v1/employees/email-otp', method: 'POST', body }),
    }),
    verifyWorkEmailOtp: builder.mutation<
      ApiSuccess<{ email: string; emailVerificationToken: string }>,
      { email: string; code: string }
    >({
      query: (body) => ({ url: '/api/v1/employees/email-otp/verify', method: 'POST', body }),
    }),
    updateEmployee: builder.mutation<
      ApiSuccess<Employee>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/employees/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Employees', 'Designations', 'Notifications'],
    }),
    updateEmployeeRoles: builder.mutation<
      ApiSuccess<Employee>,
      { id: string; roleIds: string[] }
    >({
      query: ({ id, roleIds }) => ({
        url: `/api/v1/employees/${id}/roles`,
        method: 'PATCH',
        body: { roleIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Employees', id }, 'Employees', 'Notifications'],
    }),
    updateEmployeeCompany: builder.mutation<
      ApiSuccess<Employee>,
      { id: string; companyId: string }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/v1/employees/${id}/company`,
        method: 'PATCH',
        body: { companyId },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Employees', id }, 'Employees', 'Notifications'],
    }),
    deactivateEmployee: builder.mutation<ApiSuccess<Employee>, string>({
      query: (id) => ({ url: `/api/v1/employees/${id}/deactivate`, method: 'POST' }),
      invalidatesTags: ['Employees', 'Notifications'],
    }),
    activateEmployee: builder.mutation<ApiSuccess<Employee>, string>({
      query: (id) => ({ url: `/api/v1/employees/${id}/activate`, method: 'POST' }),
      invalidatesTags: ['Employees', 'Notifications'],
    }),
    deleteEmployee: builder.mutation<ApiSuccess<{ deleted: boolean }>, string>({
      query: (id) => ({ url: `/api/v1/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Employees', 'Notifications'],
    }),
    getEmployeeAudit: builder.query<ApiSuccess<AuditLog[]>, string>({
      query: (id) => `/api/v1/employees/${id}/audit`,
      providesTags: ['Audit'],
    }),
    getEmployeePayroll: builder.query<ApiSuccess<EmployeePayroll>, string>({
      query: (id) => `/api/v1/employees/${id}/payroll`,
      providesTags: (_result, _error, id) => [{ type: 'Payroll', id }],
    }),
    saveEmployeeCompensation: builder.mutation<
      ApiSuccess<Compensation>,
      { id: string; body: Record<string, number | string> }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/employees/${id}/compensation`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Payroll', id }],
    }),
    saveEmployeePayment: builder.mutation<
      ApiSuccess<PaymentDetails>,
      {
        id: string;
        body: { pan?: string; bankAccountNumber?: string; bankName?: string; ifsc?: string };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/employees/${id}/payment`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Payroll', id }, 'DirectoryEditRequests'],
    }),
    getDirectoryEditRequests: builder.query<
      ApiSuccess<DirectoryEditRequest[]>,
      { status?: DirectoryEditRequestStatus } | void
    >({
      query: (arg) => ({
        url: '/api/v1/directory-edit-requests',
        params: arg && 'status' in arg && arg.status ? { status: arg.status } : undefined,
      }),
      providesTags: ['DirectoryEditRequests'],
    }),
    getDirectoryEditRequestForEmployee: builder.query<ApiSuccess<DirectoryEditRequestForEmployee>, string>({
      query: (employeeId) => `/api/v1/directory-edit-requests/for-employee/${employeeId}`,
      providesTags: (_result, _error, employeeId) => [
        'DirectoryEditRequests',
        { type: 'DirectoryEditRequests', id: employeeId },
      ],
    }),
    createDirectoryEditRequest: builder.mutation<
      ApiSuccess<DirectoryEditRequest>,
      { targetEmployeeId: string; reason: string; fieldHints?: string | null }
    >({
      query: (body) => ({ url: '/api/v1/directory-edit-requests', method: 'POST', body }),
      invalidatesTags: ['DirectoryEditRequests', 'Notifications'],
    }),
    approveDirectoryEditRequest: builder.mutation<
      ApiSuccess<DirectoryEditRequest>,
      { id: string; body?: { note?: string | null; unlockHours?: number } }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/directory-edit-requests/${id}/approve`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['DirectoryEditRequests', 'Notifications', 'Employees'],
    }),
    rejectDirectoryEditRequest: builder.mutation<
      ApiSuccess<DirectoryEditRequest>,
      { id: string; body?: { note?: string | null } }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/directory-edit-requests/${id}/reject`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['DirectoryEditRequests', 'Notifications'],
    }),
    cancelDirectoryEditRequest: builder.mutation<ApiSuccess<DirectoryEditRequest>, string>({
      query: (id) => ({ url: `/api/v1/directory-edit-requests/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['DirectoryEditRequests', 'Notifications'],
    }),
    fulfillDirectoryEditRequest: builder.mutation<ApiSuccess<DirectoryEditRequest>, string>({
      query: (id) => ({ url: `/api/v1/directory-edit-requests/${id}/fulfill`, method: 'POST' }),
      invalidatesTags: ['DirectoryEditRequests', 'Employees', 'Notifications'],
    }),
    getEmployeeWorkWeek: builder.query<ApiSuccess<WorkWeek[]>, string>({
      query: (id) => `/api/v1/employees/${id}/work-week`,
      providesTags: (_result, _error, id) => [{ type: 'WorkWeeks', id }],
    }),
    saveEmployeeWorkWeek: builder.mutation<
      ApiSuccess<WorkWeek>,
      { id: string; body: { pattern: WorkWeek['pattern']; effectiveFrom: string } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/employees/${id}/work-week`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'WorkWeeks', id }],
    }),
    getCompanies: builder.query<ApiSuccess<Company[]>, void>({
      query: () => '/api/v1/companies',
      providesTags: ['Companies'],
    }),
    createCompany: builder.mutation<ApiSuccess<Company>, { name: string; address: string }>({
      query: (body) => ({ url: '/api/v1/companies', method: 'POST', body }),
      invalidatesTags: ['Companies'],
    }),
    updateCompany: builder.mutation<
      ApiSuccess<Company>,
      { id: string; body: { name?: string; address?: string; status?: 'active' | 'inactive' } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/companies/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Companies', 'Employees'],
    }),
    createCompanyLogo: builder.mutation<
      ApiSuccess<CompanyLogoUpload>,
      { id: string; fileName: string; contentType: string; sizeBytes: number }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/companies/${id}/logo`, method: 'POST', body }),
    }),
    getDepartments: builder.query<ApiSuccess<NamedEntity[]>, void>({
      query: () => '/api/v1/departments',
      providesTags: ['Departments'],
    }),
    createDepartment: builder.mutation<ApiSuccess<NamedEntity>, { name: string; code: string }>({
      query: (body) => ({ url: '/api/v1/departments', method: 'POST', body }),
      invalidatesTags: ['Departments'],
    }),
    getDesignations: builder.query<ApiSuccess<NamedEntity[]>, void>({
      query: () => '/api/v1/designations',
      providesTags: ['Designations'],
    }),
    createDesignation: builder.mutation<ApiSuccess<NamedEntity>, { name: string; code: string }>({
      query: (body) => ({ url: '/api/v1/designations', method: 'POST', body }),
      invalidatesTags: ['Designations'],
    }),
    getRoles: builder.query<ApiSuccess<Role[]>, void>({
      query: () => '/api/v1/roles',
      providesTags: ['Roles'],
    }),
    getSettings: builder.query<ApiSuccess<OrganizationSettings>, void>({
      query: () => '/api/v1/organization/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<ApiSuccess<OrganizationSettings>, { workingDays: string[] }>({
      query: (body) => ({ url: '/api/v1/organization/settings', method: 'PATCH', body }),
      invalidatesTags: ['Settings'],
    }),
    getAuditLogs: builder.query<ApiSuccess<AuditLog[]>, void>({
      query: () => '/api/v1/audit-logs',
      providesTags: ['Audit'],
    }),
    getLeaveTypes: builder.query<ApiSuccess<LeaveType[]>, void>({
      query: () => '/api/v1/leave-types',
      providesTags: ['LeaveTypes'],
    }),
    createLeaveType: builder.mutation<
      ApiSuccess<LeaveType>,
      {
        name: string;
        code: string;
        description?: string;
        requiresApproval?: boolean;
        requiresHandover?: boolean;
        requiresAttachment?: boolean;
        allowHalfDay?: boolean;
        allowMultipleDays?: boolean;
        paid?: boolean;
        rules?: Record<string, unknown>;
      }
    >({
      query: (body) => ({ url: '/api/v1/leave-types', method: 'POST', body }),
      invalidatesTags: ['LeaveTypes', 'LeavePolicies'],
    }),
    getLeavePolicies: builder.query<ApiSuccess<LeavePolicy[]>, void>({
      query: () => '/api/v1/leave-policies',
      providesTags: ['LeavePolicies'],
    }),
    createLeavePolicy: builder.mutation<
      ApiSuccess<LeavePolicy>,
      { name: string; leaveTypeId: string; rules: Record<string, unknown> }
    >({
      query: (body) => ({ url: '/api/v1/leave-policies', method: 'POST', body }),
      invalidatesTags: ['LeavePolicies'],
    }),
    publishLeavePolicy: builder.mutation<ApiSuccess<LeavePolicy>, string>({
      query: (id) => ({ url: `/api/v1/leave-policies/${id}/publish`, method: 'POST' }),
      invalidatesTags: ['LeavePolicies'],
    }),
    addLeavePolicyVersion: builder.mutation<
      ApiSuccess<LeavePolicy>,
      { id: string; rules: Record<string, unknown> }
    >({
      query: ({ id, rules }) => ({ url: `/api/v1/leave-policies/${id}/versions`, method: 'POST', body: { rules } }),
      invalidatesTags: ['LeavePolicies'],
    }),
    getLeaveBalances: builder.query<ApiSuccess<LeaveBalance[]>, void>({
      query: () => '/api/v1/leaves/balance',
      providesTags: ['LeaveBalances'],
    }),
    getLeaveAllocations: builder.query<ApiSuccess<LeaveAllocation[]>, { employeeId?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/leave-allocations',
        params: arg && 'employeeId' in arg && arg.employeeId ? { employeeId: arg.employeeId } : undefined,
      }),
      providesTags: ['LeaveAllocations'],
    }),
    createLeaveAllocation: builder.mutation<
      ApiSuccess<LeaveAllocation>,
      { employeeId: string; leaveTypeId: string; allocated: number; period?: string }
    >({
      query: (body) => ({ url: '/api/v1/leave-allocations', method: 'POST', body }),
      invalidatesTags: ['LeaveAllocations', 'LeaveBalances', 'Notifications'],
    }),
    setLeaveAllocation: builder.mutation<ApiSuccess<LeaveAllocation>, { id: string; allocated: number }>({
      query: ({ id, allocated }) => ({
        url: `/api/v1/leave-allocations/${id}`,
        method: 'PATCH',
        body: { allocated },
      }),
      invalidatesTags: ['LeaveAllocations', 'LeaveBalances', 'Notifications'],
    }),
    deleteLeaveAllocation: builder.mutation<ApiSuccess<{ id: string }>, string>({
      query: (id) => ({ url: `/api/v1/leave-allocations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['LeaveAllocations', 'LeaveBalances', 'Notifications'],
    }),
    getLeaveApplications: builder.query<ApiSuccess<LeaveApplication[]>, { status?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/leaves/applications',
        params: arg && 'status' in arg && arg.status ? { status: arg.status } : undefined,
      }),
      providesTags: ['LeaveApplications'],
    }),
    getLeaveApplication: builder.query<ApiSuccess<LeaveApplication>, string>({
      query: (id) => `/api/v1/leaves/applications/${id}`,
      providesTags: ['LeaveApplications'],
    }),
    applyLeave: builder.mutation<
      ApiSuccess<LeaveApplication>,
      {
        leaveTypeId: string;
        startDate: string;
        endDate: string;
        duration: 'full' | 'half';
        reason?: string;
        handover?: string;
        handoverEmployeeId?: string;
        attachmentUrl?: string;
        projectId?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/leaves/applications', method: 'POST', body }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    updateLeave: builder.mutation<
      ApiSuccess<LeaveApplication>,
      {
        id: string;
        body: {
          leaveTypeId: string;
          startDate: string;
          endDate: string;
          duration: 'full' | 'half';
          reason?: string;
          handover?: string;
          handoverEmployeeId?: string;
          attachmentUrl?: string;
          projectId?: string;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/leaves/applications/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    cancelLeave: builder.mutation<ApiSuccess<LeaveApplication>, string>({
      query: (id) => ({ url: `/api/v1/leaves/applications/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    approveLeave: builder.mutation<ApiSuccess<LeaveApplication>, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({ url: `/api/v1/leaves/${id}/approve`, method: 'POST', body: { comment } }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    rejectLeave: builder.mutation<ApiSuccess<LeaveApplication>, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({ url: `/api/v1/leaves/${id}/reject`, method: 'POST', body: { comment } }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    requestLeaveChanges: builder.mutation<ApiSuccess<LeaveApplication>, { id: string; comment: string }>({
      query: ({ id, comment }) => ({ url: `/api/v1/leaves/${id}/request-changes`, method: 'POST', body: { comment } }),
      invalidatesTags: ['LeaveApplications', 'Notifications'],
    }),
    acceptLeaveHandover: builder.mutation<ApiSuccess<LeaveApplication>, string>({
      query: (id) => ({ url: `/api/v1/leaves/${id}/handover-accept`, method: 'POST' }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    acceptLeaveProjectLead: builder.mutation<ApiSuccess<LeaveApplication>, string>({
      query: (id) => ({ url: `/api/v1/leaves/${id}/project-lead-accept`, method: 'POST' }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications', 'Work'],
    }),
    getLeaveProjects: builder.query<ApiSuccess<LeaveProjectOption[]>, void>({
      query: () => '/api/v1/leave-projects',
    }),
    getLeaveColleagues: builder.query<
      ApiSuccess<LeaveColleague[]>,
      { startDate?: string; endDate?: string } | void
    >({
      query: (arg) => ({
        url: '/api/v1/leave-colleagues',
        params:
          arg && (arg.startDate || arg.endDate)
            ? { startDate: arg.startDate, endDate: arg.endDate ?? arg.startDate }
            : undefined,
      }),
    }),
    getHolidays: builder.query<ApiSuccess<Holiday[]>, void>({
      query: () => '/api/v1/holidays',
      providesTags: ['Holidays'],
    }),
    createHoliday: builder.mutation<
      ApiSuccess<Holiday>,
      { name: string; date: string; type?: string; region?: string; optional?: boolean }
    >({
      query: (body) => ({ url: '/api/v1/holidays', method: 'POST', body }),
      invalidatesTags: ['Holidays', 'Notifications'],
    }),
    updateHoliday: builder.mutation<
      ApiSuccess<Holiday>,
      { id: string; body: { name?: string; date?: string; type?: string; region?: string; optional?: boolean } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/holidays/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Holidays', 'Notifications'],
    }),
    getMyWorkPermissions: builder.query<ApiSuccess<WorkPermissionMine>, void>({
      query: () => '/api/v1/work-permissions/me',
      providesTags: ['WorkPermissions'],
    }),
    getWorkPermissions: builder.query<ApiSuccess<WorkPermission[]>, { status?: WorkPermission['status'] } | void>({
      query: (arg) => ({
        url: '/api/v1/work-permissions',
        params: arg?.status ? { status: arg.status } : undefined,
      }),
      providesTags: ['WorkPermissions'],
    }),
    applyWorkPermission: builder.mutation<
      ApiSuccess<WorkPermission>,
      { permissionDate: string; minutes: 60; slot: 'START' | 'END'; reason?: string }
    >({
      query: (body) => ({ url: '/api/v1/work-permissions', method: 'POST', body }),
      invalidatesTags: ['WorkPermissions', 'Notifications'],
    }),
    approveWorkPermission: builder.mutation<ApiSuccess<WorkPermission>, string>({
      query: (id) => ({ url: `/api/v1/work-permissions/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['WorkPermissions', 'Notifications'],
    }),
    rejectWorkPermission: builder.mutation<ApiSuccess<WorkPermission>, string>({
      query: (id) => ({ url: `/api/v1/work-permissions/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['WorkPermissions', 'Notifications'],
    }),
    getMyShiftChanges: builder.query<ApiSuccess<ShiftChangeRequest[]>, void>({
      query: () => '/api/v1/shift-changes/me',
      providesTags: ['ShiftChanges'],
    }),
    getShiftChangeLeadInbox: builder.query<ApiSuccess<ShiftChangeRequest[]>, void>({
      query: () => '/api/v1/shift-changes/lead-inbox',
      providesTags: ['ShiftChanges'],
    }),
    getShiftChanges: builder.query<
      ApiSuccess<ShiftChangeRequest[]>,
      { status?: ShiftChangeRequest['status'] } | void
    >({
      query: (arg) => ({
        url: '/api/v1/shift-changes',
        params: arg?.status ? { status: arg.status } : undefined,
      }),
      providesTags: ['ShiftChanges'],
    }),
    getShiftChangeProjects: builder.query<ApiSuccess<LeaveProjectOption[]>, void>({
      query: () => '/api/v1/shift-changes/projects',
      providesTags: ['ShiftChanges'],
    }),
    applyShiftChange: builder.mutation<
      ApiSuccess<ShiftChangeRequest>,
      {
        startDate: string;
        endDate: string;
        requestedShiftId: string;
        reason: string;
        projectId?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/shift-changes', method: 'POST', body }),
      invalidatesTags: ['ShiftChanges', 'Notifications'],
    }),
    acceptShiftChangeProjectLead: builder.mutation<ApiSuccess<ShiftChangeRequest>, string>({
      query: (id) => ({ url: `/api/v1/shift-changes/${id}/project-lead-accept`, method: 'POST' }),
      invalidatesTags: ['ShiftChanges', 'Notifications', 'Work'],
    }),
    approveShiftChange: builder.mutation<
      ApiSuccess<ShiftChangeRequest>,
      { id: string; comment?: string }
    >({
      query: ({ id, comment }) => ({
        url: `/api/v1/shift-changes/${id}/approve`,
        method: 'POST',
        body: comment ? { comment } : {},
      }),
      invalidatesTags: ['ShiftChanges', 'Notifications'],
    }),
    rejectShiftChange: builder.mutation<
      ApiSuccess<ShiftChangeRequest>,
      { id: string; comment?: string }
    >({
      query: ({ id, comment }) => ({
        url: `/api/v1/shift-changes/${id}/reject`,
        method: 'POST',
        body: comment ? { comment } : {},
      }),
      invalidatesTags: ['ShiftChanges', 'Notifications'],
    }),
    cancelShiftChange: builder.mutation<ApiSuccess<ShiftChangeRequest>, string>({
      query: (id) => ({ url: `/api/v1/shift-changes/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['ShiftChanges', 'Notifications'],
    }),
    updateLeaveType: builder.mutation<
      ApiSuccess<LeaveType>,
      {
        id: string;
        body: {
          name?: string;
          description?: string;
          active?: boolean;
          requiresApproval?: boolean;
          requiresHandover?: boolean;
          requiresAttachment?: boolean;
          allowHalfDay?: boolean;
          allowMultipleDays?: boolean;
          paid?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/leave-types/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['LeaveTypes', 'LeavePolicies'],
    }),
    getAttendanceMe: builder.query<ApiSuccess<AttendanceMe>, { period?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/attendance/me',
        params: arg && 'period' in arg && arg.period ? { period: arg.period } : undefined,
      }),
      providesTags: ['Attendance'],
    }),
    getWorkDay: builder.query<ApiSuccess<WorkDayBoard>, string>({
      query: (date) => `/api/v1/work/days/${date}`,
      providesTags: ['Work'],
    }),
    submitWorkDay: builder.mutation<
      ApiSuccess<WorkDayBoard>,
      {
        date: string;
        body: {
          planned: { priorityId: string; description: string }[];
          unplanned?: { description: string }[];
          blocker?: { category: string; description: string } | null;
          tomorrow?: string;
        };
      }
    >({
      query: ({ date, body }) => ({ url: `/api/v1/work/days/${date}`, method: 'PUT', body }),
      invalidatesTags: ['Work'],
    }),
    getWorkHistory: builder.query<ApiSuccess<WorkHistoryMonth>, { month?: string; employeeId?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/history',
        params: arg
          ? {
              ...(arg.month ? { month: arg.month } : {}),
              ...(arg.employeeId ? { employeeId: arg.employeeId } : {}),
            }
          : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkOverview: builder.query<ApiSuccess<WorkOverview>, { employeeId?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/overview',
        params: arg && arg.employeeId ? { employeeId: arg.employeeId } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkBoard: builder.query<
      ApiSuccess<WorkBoard>,
      {
        date?: string;
        from?: string;
        to?: string;
        departmentId?: string;
        employeeId?: string;
        type?: string;
        category?: string;
        projectId?: string;
      } | void
    >({
      query: (arg) => ({
        url: '/api/v1/work/board',
        params: arg || undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkPrioritiesQueue: builder.query<ApiSuccess<WorkPrioritiesQueue>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/priorities/queue',
        params: arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkPrioritiesApproved: builder.query<ApiSuccess<WorkPrioritiesApproved>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/priorities/approved',
        params: arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkLeadPrioritiesQueue: builder.query<ApiSuccess<WorkPrioritiesQueue>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/priorities/lead-queue',
        params: arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkLeadPrioritiesApproved: builder.query<ApiSuccess<WorkPrioritiesApproved>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/priorities/lead-approved',
        params: arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkAnalytics: builder.query<
      ApiSuccess<WorkAnalytics>,
      {
        from?: string;
        to?: string;
        months?: number;
        departmentId?: string;
        employeeId?: string;
      } | void
    >({
      query: (arg) => ({
        url: '/api/v1/work/analytics',
        params: arg || undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkSettings: builder.query<ApiSuccess<WorkSettings>, void>({
      query: () => '/api/v1/work/settings',
      providesTags: ['Work'],
    }),
    updateWorkSettings: builder.mutation<
      ApiSuccess<WorkSettings>,
      {
        reminderHour?: number;
        secondReminderHour?: number | null;
        retentionDays?: 90 | 180 | 365;
        archiveBeforeDelete?: boolean;
        notifyBeforePurge?: boolean;
        purgeNotifyDaysBefore?: number;
        legalHold?: boolean;
      }
    >({
      query: (body) => ({ url: '/api/v1/work/settings', method: 'PATCH', body }),
      invalidatesTags: ['Work', 'Settings'],
    }),
    createWorkFeedback: builder.mutation<
      ApiSuccess<WeeklyWorkBoard>,
      { employeeId: string; type: string; comment: string }
    >({
      query: (body) => ({ url: '/api/v1/work/feedback', method: 'POST', body }),
      invalidatesTags: ['Work'],
    }),
    getWorkWeek: builder.query<ApiSuccess<WeeklyWorkBoard>, { employeeId?: string; date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/week',
        params:
          arg && (arg.employeeId || arg.date)
            ? {
                ...(arg.employeeId ? { employeeId: arg.employeeId } : {}),
                ...(arg.date ? { date: arg.date } : {}),
              }
            : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkProjects: builder.query<ApiSuccess<WorkProject[]>, void>({
      query: () => '/api/v1/work/projects',
      providesTags: ['Work'],
    }),
    getLeadProjects: builder.query<ApiSuccess<LeadProjectSummary[]>, void>({
      query: () => '/api/v1/work/lead/projects',
      providesTags: ['Work'],
    }),
    getLeadProjectDesk: builder.query<
      ApiSuccess<LeadProjectDesk>,
      { projectId: string; date?: string }
    >({
      query: ({ projectId, date }) => ({
        url: `/api/v1/work/lead/projects/${projectId}`,
        params: date ? { date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getLeadDailyWork: builder.query<
      ApiSuccess<LeadDailyWorkBoard>,
      { date?: string; from?: string; to?: string; projectId?: string }
    >({
      query: (params) => ({
        url: '/api/v1/work/lead/daily-work',
        params: {
          ...(params.date ? { date: params.date } : {}),
          ...(params.from ? { from: params.from } : {}),
          ...(params.to ? { to: params.to } : {}),
          ...(params.projectId ? { projectId: params.projectId } : {}),
        },
      }),
      providesTags: ['Work'],
    }),
    getLeadPermissions: builder.query<ApiSuccess<LeadPermissionsBoard>, void>({
      query: () => '/api/v1/work/lead/permissions',
      providesTags: ['Work', 'LeaveApplications', 'ShiftChanges'],
    }),
    getProjectStatusUpdates: builder.query<ApiSuccess<ProjectStatusUpdate[]>, string>({
      query: (projectId) => `/api/v1/work/projects/${projectId}/updates`,
      providesTags: ['Work'],
    }),
    createProjectStatusUpdate: builder.mutation<
      ApiSuccess<ProjectStatusUpdate>,
      { projectId: string; body: string; topic?: ProjectUpdateTopic }
    >({
      query: ({ projectId, body, topic }) => ({
        url: `/api/v1/work/projects/${projectId}/updates`,
        method: 'POST',
        body: topic ? { body, topic } : { body },
      }),
      invalidatesTags: ['Work'],
    }),
    getProjectMembers: builder.query<ApiSuccess<{ projectId: string; members: WorkProjectMember[] }>, string>({
      query: (id) => `/api/v1/work/projects/${id}/members`,
      providesTags: ['Work'],
    }),
    setProjectMembers: builder.mutation<
      ApiSuccess<{
        projectId: string;
        memberCount: number;
        members: WorkProjectMember[];
        leadEmployeeId: string;
        leadName: string | null;
      }>,
      { projectId: string; employeeIds: string[]; leadEmployeeId: string }
    >({
      query: ({ projectId, employeeIds, leadEmployeeId }) => ({
        url: `/api/v1/work/projects/${projectId}/members`,
        method: 'PUT',
        body: { employeeIds, leadEmployeeId },
      }),
      invalidatesTags: ['Work'],
    }),
    setWorkProjectStatus: builder.mutation<
      ApiSuccess<WorkProject>,
      { projectId: string; status: 'active' | 'inactive' }
    >({
      query: ({ projectId, status }) => ({
        url: `/api/v1/work/projects/${projectId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Work'],
    }),
    getEmployeeWorkProjects: builder.query<ApiSuccess<EmployeeWorkProjects>, string>({
      query: (employeeId) => `/api/v1/work/employees/${employeeId}/projects`,
      providesTags: ['Work'],
    }),
    setEmployeeWorkProjects: builder.mutation<
      ApiSuccess<EmployeeWorkProjects>,
      { employeeId: string; projectIds: string[] }
    >({
      query: ({ employeeId, projectIds }) => ({
        url: `/api/v1/work/employees/${employeeId}/projects`,
        method: 'PUT',
        body: { projectIds },
      }),
      invalidatesTags: ['Work'],
    }),
    getProjectPlan: builder.query<ApiSuccess<ProjectPlan>, string>({
      query: (projectId) => `/api/v1/work/projects/${projectId}/plan`,
      providesTags: ['Work'],
    }),
    getProjectGoals: builder.query<ApiSuccess<{ projectId: string; goals: ProjectGoalListItem[] }>, string>({
      query: (projectId) => `/api/v1/work/projects/${projectId}/goals`,
      providesTags: ['Work'],
    }),
    getProjectMilestones: builder.query<
      ApiSuccess<{ projectId: string; milestones: ProjectMilestoneListItem[] }>,
      string
    >({
      query: (projectId) => `/api/v1/work/projects/${projectId}/milestones`,
      providesTags: ['Work'],
    }),
    createProjectGoal: builder.mutation<
      ApiSuccess<ProjectGoal>,
      { projectId: string; name: string; description?: string; isPrimary?: boolean; sequence?: number }
    >({
      query: ({ projectId, ...body }) => ({
        url: `/api/v1/work/projects/${projectId}/goals`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Work'],
    }),
    updateProjectGoal: builder.mutation<
      ApiSuccess<ProjectGoal>,
      { goalId: string; body: { name?: string; description?: string; isPrimary?: boolean; sequence?: number } }
    >({
      query: ({ goalId, body }) => ({
        url: `/api/v1/work/goals/${goalId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Work'],
    }),
    deleteProjectGoal: builder.mutation<ApiSuccess<{ goalId: string }>, string>({
      query: (goalId) => ({ url: `/api/v1/work/goals/${goalId}`, method: 'DELETE' }),
      invalidatesTags: ['Work'],
    }),
    createProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      {
        goalId: string;
        name: string;
        description?: string;
        startDate?: string | null;
        targetDate?: string | null;
        status?: ProjectMilestone['status'];
        sequence?: number;
      }
    >({
      query: ({ goalId, ...body }) => ({
        url: `/api/v1/work/goals/${goalId}/milestones`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Work'],
    }),
    updateProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      {
        milestoneId: string;
        body: {
          name?: string;
          description?: string;
          startDate?: string | null;
          targetDate?: string | null;
          status?: ProjectMilestone['status'];
          sequence?: number;
          changeReason: string;
        };
      }
    >({
      query: ({ milestoneId, body }) => ({
        url: `/api/v1/work/milestones/${milestoneId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Work'],
    }),
    activateProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      { milestoneId: string; changeReason?: string }
    >({
      query: ({ milestoneId, changeReason }) => ({
        url: `/api/v1/work/milestones/${milestoneId}/activate`,
        method: 'POST',
        body: changeReason ? { changeReason } : {},
      }),
      invalidatesTags: ['Work'],
    }),
    completeProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      { milestoneId: string; changeReason?: string }
    >({
      query: ({ milestoneId, changeReason }) => ({
        url: `/api/v1/work/milestones/${milestoneId}/complete`,
        method: 'POST',
        body: changeReason ? { changeReason } : {},
      }),
      invalidatesTags: ['Work'],
    }),
    cancelProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      { milestoneId: string; changeReason?: string }
    >({
      query: ({ milestoneId, changeReason }) => ({
        url: `/api/v1/work/milestones/${milestoneId}/cancel`,
        method: 'POST',
        body: changeReason ? { changeReason } : {},
      }),
      invalidatesTags: ['Work'],
    }),
    deleteProjectMilestone: builder.mutation<ApiSuccess<{ milestoneId: string }>, string>({
      query: (milestoneId) => ({ url: `/api/v1/work/milestones/${milestoneId}`, method: 'DELETE' }),
      invalidatesTags: ['Work'],
    }),
    getMilestoneHistory: builder.query<ApiSuccess<{ milestoneId: string; items: MilestoneHistoryEntry[] }>, string>({
      query: (milestoneId) => `/api/v1/work/milestones/${milestoneId}/history`,
      providesTags: ['Work'],
    }),
    createWorkPriority: builder.mutation<
      ApiSuccess<{ priority: WorkPriority; overCap: boolean; warning: string | null }>,
      {
        employeeId?: string;
        type: WorkPriority['type'];
        projectId?: string | null;
        milestoneId?: string | null;
        regularSubtype?: WorkPriority['regularSubtype'];
        regularSubtypeLabel?: string | null;
        title: string;
        description?: string;
        expectedOutcome?: string;
        successCriteria?: string;
        level: WorkPriority['level'];
      }
    >({
      query: (body) => ({ url: '/api/v1/work/priorities', method: 'POST', body }),
      invalidatesTags: ['Work'],
    }),
    updateWorkPriority: builder.mutation<
      ApiSuccess<WorkPriority>,
      {
        id: string;
        body: {
          title?: string;
          description?: string;
          expectedOutcome?: string;
          successCriteria?: string;
          level?: WorkPriority['level'];
          regularSubtype?: WorkPriority['regularSubtype'];
          regularSubtypeLabel?: string | null;
          status?: WorkPriority['status'];
          incompleteReason?: string | null;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/work/priorities/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Work'],
    }),
    carryForwardWorkPriority: builder.mutation<
      ApiSuccess<{ original: WorkPriority; next: WorkPriority; nextWeek: { start: string; end: string } }>,
      { id: string; incompleteReason?: string | null }
    >({
      query: ({ id, incompleteReason }) => ({
        url: `/api/v1/work/priorities/${id}/carry-forward`,
        method: 'POST',
        body: { incompleteReason: incompleteReason ?? null },
      }),
      invalidatesTags: ['Work'],
    }),
    submitWorkPriority: builder.mutation<ApiSuccess<WorkPriority>, string>({
      query: (id) => ({ url: `/api/v1/work/priorities/${id}/submit`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    submitAllWorkPriorities: builder.mutation<
      ApiSuccess<{ submitted: WorkPriority[]; week: WeeklyWorkBoard }>,
      void
    >({
      query: () => ({ url: '/api/v1/work/priorities/submit-all', method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    approveWorkPriority: builder.mutation<ApiSuccess<WorkPriority>, string>({
      query: (id) => ({ url: `/api/v1/work/priorities/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    approveAllWorkPriorities: builder.mutation<
      ApiSuccess<{ approved: WorkPriority[]; week: WeeklyWorkBoard }>,
      { employeeId: string; date?: string }
    >({
      query: (body) => ({ url: '/api/v1/work/priorities/approve-all', method: 'POST', body }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    requestWorkPriorityResubmit: builder.mutation<ApiSuccess<WorkPriority>, { id: string; comment: string }>({
      query: ({ id, comment }) => ({
        url: `/api/v1/work/priorities/${id}/request-resubmit`,
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    getWeeklyWorkUpdateBoard: builder.query<ApiSuccess<WeeklyWorkUpdateBoard>, void>({
      query: () => '/api/v1/work/weekly-updates',
      providesTags: ['Work'],
    }),
    getWeeklyPptAdminBoard: builder.query<ApiSuccess<WeeklyPptAdminBoard>, { weekStart?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/weekly-updates/admin',
        params: arg && 'weekStart' in arg && arg.weekStart ? { weekStart: arg.weekStart } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWeeklyPptGmShares: builder.query<ApiSuccess<WeeklyPptGmShares>, void>({
      query: () => '/api/v1/work/weekly-updates/shares',
      providesTags: ['Work'],
    }),
    shareWeeklyPptToGm: builder.mutation<
      ApiSuccess<{ share: { id: string; weekStart: string; weekEnd: string; sharedAt: string; fileCount: number }; recipients: number }>,
      { weekStart?: string } | void
    >({
      query: (body) => ({
        url: '/api/v1/work/weekly-updates/share-to-gm',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    createWeeklyWorkUpdateUpload: builder.mutation<
      ApiSuccess<WeeklyWorkUpdateUploadSession>,
      { fileName: string; contentType: string; sizeBytes: number }
    >({
      query: (body) => ({ url: '/api/v1/work/weekly-updates/upload', method: 'POST', body }),
      invalidatesTags: ['Work'],
    }),
    getWeeklyWorkUpdateDownload: builder.query<
      ApiSuccess<{ url: string; fileName: string }>,
      { id: string; shareId?: string } | string
    >({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        const shareId = typeof arg === 'string' ? undefined : arg.shareId;
        return {
          url: `/api/v1/work/weekly-updates/${id}/download`,
          params: shareId ? { shareId } : undefined,
        };
      },
    }),
    getJcPptBoard: builder.query<ApiSuccess<JcPptEmployeeBoard>, void>({
      query: () => '/api/v1/work/jc',
      providesTags: ['Work'],
    }),
    createJcPptUpload: builder.mutation<
      ApiSuccess<JcPptUploadSession>,
      { fileName: string; contentType: string; sizeBytes: number }
    >({
      query: (body) => ({ url: '/api/v1/work/jc/upload', method: 'POST', body }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    getJcPptDownload: builder.query<ApiSuccess<{ url: string; fileName: string }>, string>({
      query: (id) => `/api/v1/work/jc/${id}/download`,
    }),
    getJcPptCsoBoard: builder.query<ApiSuccess<JcPptCsoBoard>, void>({
      query: () => '/api/v1/work/jc/admin',
      providesTags: ['Work'],
    }),
    getJcPptGmBoard: builder.query<ApiSuccess<JcPptGmBoard>, void>({
      query: () => '/api/v1/work/jc/gm',
      providesTags: ['Work'],
    }),
    transferJcPptToGm: builder.mutation<
      ApiSuccess<{ item: JcPptItem; recipients: number }>,
      string
    >({
      query: (id) => ({ url: `/api/v1/work/jc/${id}/transfer-to-gm`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    getJcPptPreview: builder.query<ApiSuccess<{ url: string; fileName: string }>, string>({
      query: (id) => `/api/v1/work/jc/${id}/preview`,
    }),
    gmDownloadJcPpt: builder.mutation<ApiSuccess<JcPptConsumeResult>, string>({
      query: (id) => ({ url: `/api/v1/work/jc/${id}/gm-download`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmEmailJcPpt: builder.mutation<ApiSuccess<JcPptConsumeResult>, { id: string; recipientEmail: string }>({
      query: ({ id, recipientEmail }) => ({
        url: `/api/v1/work/jc/${id}/gm-email`,
        method: 'POST',
        body: { recipientEmail },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDeleteJcPpt: builder.mutation<ApiSuccess<JcPptConsumeResult>, string>({
      query: (id) => ({ url: `/api/v1/work/jc/${id}/gm-delete`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDeleteAllJcPpts: builder.mutation<ApiSuccess<{ removed: number }>, void>({
      query: () => ({ url: '/api/v1/work/jc/gm-delete-all', method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDownloadWeeklyPpt: builder.mutation<
      ApiSuccess<WeeklyPptConsumeResult>,
      { id: string; shareId: string }
    >({
      query: ({ id, shareId }) => ({
        url: `/api/v1/work/weekly-updates/${id}/gm-download`,
        method: 'POST',
        body: { shareId },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmEmailWeeklyPpt: builder.mutation<
      ApiSuccess<WeeklyPptConsumeResult>,
      { id: string; shareId: string; recipientEmail: string }
    >({
      query: ({ id, shareId, recipientEmail }) => ({
        url: `/api/v1/work/weekly-updates/${id}/gm-email`,
        method: 'POST',
        body: { shareId, recipientEmail },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDeleteWeeklyPpt: builder.mutation<
      ApiSuccess<WeeklyPptConsumeResult>,
      { id: string; shareId: string }
    >({
      query: ({ id, shareId }) => ({
        url: `/api/v1/work/weekly-updates/${id}/gm-delete`,
        method: 'POST',
        body: { shareId },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDeleteAllWeeklyPptsInShare: builder.mutation<ApiSuccess<{ removed: number }>, string>({
      query: (shareId) => ({
        url: `/api/v1/work/weekly-updates/shares/${shareId}/gm-delete-all`,
        method: 'POST',
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    createWorkProject: builder.mutation<
      ApiSuccess<WorkProject>,
      { name: string; code: string; leadEmployeeId: string; employeeIds?: string[] }
    >({
      query: (body) => ({ url: '/api/v1/work/projects', method: 'POST', body }),
      invalidatesTags: ['Work'],
    }),
    getAttendanceDay: builder.query<ApiSuccess<AttendanceDaySummary>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/attendance',
        params: arg && 'date' in arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Attendance'],
    }),
    getAttendanceImports: builder.query<ApiSuccess<AttendanceImport[]>, void>({
      query: () => '/api/v1/attendance/imports',
      providesTags: ['AttendanceImports'],
    }),
    getAttendanceImport: builder.query<ApiSuccess<AttendanceImportDetail>, string>({
      query: (id) => `/api/v1/attendance/imports/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AttendanceImports', id }],
    }),
    getAttendanceImportCard: builder.query<
      ApiSuccess<{ import: AttendanceImport; card: AttendanceReviewCard }>,
      { id: string; employeeId: string }
    >({
      query: ({ id, employeeId }) => `/api/v1/attendance/imports/${id}/employees/${employeeId}`,
      providesTags: (_r, _e, arg) => [{ type: 'AttendanceImports', id: arg.id }],
    }),
    uploadAttendanceImport: builder.mutation<
      ApiSuccess<AttendanceImportDetail>,
      { period: string; fileName: string; contentBase64: string }
    >({
      query: (body) => ({ url: '/api/v1/attendance/imports', method: 'POST', body }),
      invalidatesTags: ['AttendanceImports', 'Attendance'],
    }),
    decideAttendanceReview: builder.mutation<
      ApiSuccess<AttendanceReviewDay>,
      { id: string; action: 'FULL_LOP' | 'HALF_LOP' | 'NO_LOP' | 'EXCLUDE'; reason?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/attendance/reviews/${id}/decide`, method: 'POST', body }),
      invalidatesTags: ['AttendanceImports'],
    }),
    confirmAttendanceImport: builder.mutation<ApiSuccess<AttendanceImportDetail>, string>({
      query: (id) => ({ url: `/api/v1/attendance/imports/${id}/confirm`, method: 'POST' }),
      invalidatesTags: ['AttendanceImports', 'Attendance'],
    }),
    rejectAttendanceImport: builder.mutation<ApiSuccess<AttendanceImport>, string>({
      query: (id) => ({ url: `/api/v1/attendance/imports/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['AttendanceImports', 'Attendance'],
    }),
    deleteAttendanceImport: builder.mutation<ApiSuccess<{ deleted: boolean }>, string>({
      query: (id) => ({ url: `/api/v1/attendance/imports/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AttendanceImports', 'Attendance'],
    }),
    getPayrollRuns: builder.query<ApiSuccess<PayrollRun[]>, void>({
      query: () => '/api/v1/payroll/runs',
      providesTags: ['PayrollRuns'],
    }),
    getPayrollImports: builder.query<ApiSuccess<ConfirmedPayrollImport[]>, void>({
      query: () => '/api/v1/payroll/imports',
      providesTags: ['PayrollRuns'],
    }),
    getPayrollRun: builder.query<ApiSuccess<PayrollRunDetail>, string>({
      query: (id) => `/api/v1/payroll/runs/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PayrollRuns', id }],
    }),
    getPayrollPreview: builder.query<ApiSuccess<PayrollPreview>, string>({
      query: (importId) => `/api/v1/payroll/preview?importId=${encodeURIComponent(importId)}`,
    }),
    calculatePayroll: builder.mutation<ApiSuccess<PayrollRunDetail>, CalculatePayrollInput>({
      query: (body) => ({ url: '/api/v1/payroll/calculate', method: 'POST', body }),
      invalidatesTags: ['PayrollRuns'],
    }),
    publishPayroll: builder.mutation<ApiSuccess<PayrollRunDetail>, string>({
      query: (id) => ({ url: `/api/v1/payroll/runs/${id}/publish`, method: 'POST' }),
      invalidatesTags: ['PayrollRuns', 'Notifications'],
    }),
    getMyPayslips: builder.query<ApiSuccess<SalarySlip[]>, void>({
      query: () => '/api/v1/payroll/slips/me',
      providesTags: ['PayrollRuns'],
    }),
    getPayslip: builder.query<ApiSuccess<SalarySlip>, string>({
      query: (id) => `/api/v1/payroll/slips/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PayrollRuns', id }],
    }),
    getShifts: builder.query<ApiSuccess<Shift[]>, void>({
      query: () => '/api/v1/shifts',
      providesTags: ['Shifts'],
    }),
    createShift: builder.mutation<
      ApiSuccess<Shift>,
      {
        name: string;
        startTime: string;
        endTime: string;
        minimumDurationMinutes: number;
        gracePeriodMinutes?: number;
        flexible?: boolean;
      }
    >({
      query: (body) => ({ url: '/api/v1/shifts', method: 'POST', body }),
      invalidatesTags: ['Shifts'],
    }),
    updateShift: builder.mutation<
      ApiSuccess<Shift>,
      {
        id: string;
        body: {
          name?: string;
          startTime?: string;
          endTime?: string;
          minimumDurationMinutes?: number;
          gracePeriodMinutes?: number;
          flexible?: boolean;
          active?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/shifts/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Shifts'],
    }),
    getShiftAssignments: builder.query<ApiSuccess<ShiftAssignment[]>, void>({
      query: () => '/api/v1/shift-assignments',
      providesTags: ['Shifts'],
    }),
    createShiftAssignment: builder.mutation<
      ApiSuccess<ShiftAssignment>,
      { employeeId: string; shiftId: string; effectiveFrom?: string }
    >({
      query: (body) => ({ url: '/api/v1/shift-assignments', method: 'POST', body }),
      invalidatesTags: ['Shifts', 'Notifications'],
    }),
    getGrievances: builder.query<
      ApiSuccess<Grievance[]>,
      { status?: string; scope?: 'mine' | 'assigned' | 'queue' } | void
    >({
      query: (arg) => ({
        url: '/api/v1/grievances',
        params:
          arg && typeof arg === 'object'
            ? {
                ...(arg.status ? { status: arg.status } : {}),
                ...(arg.scope ? { scope: arg.scope } : {}),
              }
            : undefined,
      }),
      providesTags: ['Grievances'],
    }),
    getGrievanceCounts: builder.query<
      ApiSuccess<GrievanceCounts>,
      { scope?: 'mine' | 'assigned' | 'queue' } | void
    >({
      query: (arg) => ({
        url: '/api/v1/grievance-counts',
        params: arg && arg.scope ? { scope: arg.scope } : undefined,
      }),
      providesTags: ['Grievances'],
    }),
    getGrievanceHandlers: builder.query<ApiSuccess<GrievanceHandler[]>, void>({
      query: () => '/api/v1/grievance-handlers',
    }),
    getGrievance: builder.query<ApiSuccess<GrievanceDetail>, string>({
      query: (id) => `/api/v1/grievances/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Grievances', id }],
    }),
    createGrievance: builder.mutation<
      ApiSuccess<Grievance>,
      { category: string; subject: string; description: string }
    >({
      query: (body) => ({ url: '/api/v1/grievances', method: 'POST', body }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    addGrievanceComment: builder.mutation<
      ApiSuccess<GrievanceDetail>,
      { id: string; body: string; visibility?: 'EMPLOYEE' | 'INTERNAL' }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/grievances/${id}/comments`, method: 'POST', body }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    assignGrievance: builder.mutation<ApiSuccess<GrievanceDetail>, { id: string; assigneeId: string }>({
      query: ({ id, assigneeId }) => ({
        url: `/api/v1/grievances/${id}/assign`,
        method: 'POST',
        body: { assigneeId },
      }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    changeGrievanceStatus: builder.mutation<ApiSuccess<GrievanceDetail>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/v1/grievances/${id}/status`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    resolveGrievance: builder.mutation<ApiSuccess<GrievanceDetail>, { id: string; resolution: string }>({
      query: ({ id, resolution }) => ({
        url: `/api/v1/grievances/${id}/resolve`,
        method: 'POST',
        body: { resolution },
      }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    createGrievanceAttachment: builder.mutation<
      ApiSuccess<GrievanceUploadSession>,
      { id: string; fileName: string; contentType: string; sizeBytes: number }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/grievances/${id}/attachments`, method: 'POST', body }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    getGrievanceAttachmentUrl: builder.query<ApiSuccess<{ url: string }>, { id: string; attachmentId: string }>({
      query: ({ id, attachmentId }) => `/api/v1/grievances/${id}/attachments/${attachmentId}/url`,
    }),
    getPolicies: builder.query<ApiSuccess<HrPolicy[]>, void>({
      query: () => '/api/v1/policies',
      providesTags: ['Policies'],
    }),
    getPolicy: builder.query<ApiSuccess<HrPolicy>, string>({
      query: (id) => `/api/v1/policies/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Policies', id }],
    }),
    createPolicy: builder.mutation<
      ApiSuccess<HrPolicy>,
      {
        title: string;
        content: string;
        versionLabel?: string;
        effectiveDate?: string;
        acknowledgementRequired?: boolean;
      }
    >({
      query: (body) => ({ url: '/api/v1/policies', method: 'POST', body }),
      invalidatesTags: ['Policies'],
    }),
    publishPolicy: builder.mutation<
      ApiSuccess<HrPolicy>,
      {
        id: string;
        content?: string;
        versionLabel?: string;
        effectiveDate?: string;
        acknowledgementRequired?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/policies/${id}/publish`, method: 'POST', body }),
      invalidatesTags: ['Policies'],
    }),
    acknowledgePolicy: builder.mutation<ApiSuccess<HrPolicy>, string>({
      query: (id) => ({ url: `/api/v1/policies/${id}/acknowledge`, method: 'POST' }),
      invalidatesTags: ['Policies'],
    }),
    getPolicyAcknowledgements: builder.query<
      ApiSuccess<PolicyAcknowledgementReport>,
      { id: string; version?: string }
    >({
      query: ({ id, version }) => ({
        url: `/api/v1/policies/${id}/acknowledgements`,
        params: version ? { version } : undefined,
      }),
      providesTags: ['Policies'],
    }),
    getNotifications: builder.query<ApiSuccess<NotificationItem[]>, { unread?: boolean } | void>({
      query: (arg) => ({
        url: '/api/v1/notifications',
        params: arg && 'unread' in arg && arg.unread ? { unread: 'true' } : undefined,
      }),
      providesTags: ['Notifications'],
    }),
    getNotificationUnreadCount: builder.query<ApiSuccess<{ count: number }>, void>({
      query: () => '/api/v1/notifications/unread-count',
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation<ApiSuccess<NotificationItem>, string>({
      query: (id) => ({ url: `/api/v1/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation<ApiSuccess<{ updated: number }>, void>({
      query: () => ({ url: '/api/v1/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
    subscribeWebPush: builder.mutation<
      ApiSuccess<{ subscribed: boolean }>,
      { endpoint: string; keys: { p256dh: string; auth: string } }
    >({
      query: (body) => ({ url: '/api/v1/web-push/subscribe', method: 'POST', body }),
    }),
    unsubscribeWebPush: builder.mutation<ApiSuccess<{ revoked: boolean }>, { endpoint: string }>({
      query: (body) => ({ url: '/api/v1/web-push/subscribe', method: 'DELETE', body }),
    }),
    getReportsOverview: builder.query<
      ApiSuccess<ReportsOverview>,
      { from?: string; to?: string; period?: string; companyId?: string } | void
    >({
      query: (arg) => ({
        url: '/api/v1/reports/overview',
        params: arg ?? undefined,
      }),
      providesTags: ['Reports'],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetMeQuery,
  useRequestPasswordResetMutation,
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useSendWorkEmailOtpMutation,
  useVerifyWorkEmailOtpMutation,
  useUpdateEmployeeMutation,
  useUpdateEmployeeRolesMutation,
  useUpdateEmployeeCompanyMutation,
  useDeactivateEmployeeMutation,
  useActivateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetEmployeeAuditQuery,
  useGetEmployeePayrollQuery,
  useSaveEmployeeCompensationMutation,
  useSaveEmployeePaymentMutation,
  useGetDirectoryEditRequestsQuery,
  useGetDirectoryEditRequestForEmployeeQuery,
  useCreateDirectoryEditRequestMutation,
  useApproveDirectoryEditRequestMutation,
  useRejectDirectoryEditRequestMutation,
  useCancelDirectoryEditRequestMutation,
  useFulfillDirectoryEditRequestMutation,
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useCreateCompanyLogoMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetDesignationsQuery,
  useCreateDesignationMutation,
  useGetRolesQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetAuditLogsQuery,
  useLazyGetEmployeesQuery,
  useGetLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useGetLeavePoliciesQuery,
  useCreateLeavePolicyMutation,
  usePublishLeavePolicyMutation,
  useAddLeavePolicyVersionMutation,
  useGetLeaveBalancesQuery,
  useGetLeaveAllocationsQuery,
  useCreateLeaveAllocationMutation,
  useSetLeaveAllocationMutation,
  useDeleteLeaveAllocationMutation,
  useGetLeaveApplicationsQuery,
  useGetLeaveApplicationQuery,
  useApplyLeaveMutation,
  useUpdateLeaveMutation,
  useCancelLeaveMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  useRequestLeaveChangesMutation,
  useAcceptLeaveHandoverMutation,
  useAcceptLeaveProjectLeadMutation,
  useGetLeaveProjectsQuery,
  useGetLeaveColleaguesQuery,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useGetMyWorkPermissionsQuery,
  useGetWorkPermissionsQuery,
  useApplyWorkPermissionMutation,
  useApproveWorkPermissionMutation,
  useRejectWorkPermissionMutation,
  useGetMyShiftChangesQuery,
  useGetShiftChangeLeadInboxQuery,
  useGetShiftChangesQuery,
  useGetShiftChangeProjectsQuery,
  useApplyShiftChangeMutation,
  useAcceptShiftChangeProjectLeadMutation,
  useApproveShiftChangeMutation,
  useRejectShiftChangeMutation,
  useCancelShiftChangeMutation,
  useGetAttendanceMeQuery,
  useGetWorkDayQuery,
  useSubmitWorkDayMutation,
  useGetWorkHistoryQuery,
  useGetWorkOverviewQuery,
  useGetWorkBoardQuery,
  useGetWorkPrioritiesQueueQuery,
  useGetWorkPrioritiesApprovedQuery,
  useGetWorkLeadPrioritiesQueueQuery,
  useGetWorkLeadPrioritiesApprovedQuery,
  useGetWorkAnalyticsQuery,
  useGetWorkSettingsQuery,
  useUpdateWorkSettingsMutation,
  useCreateWorkFeedbackMutation,
  useGetWorkWeekQuery,
  useGetWorkProjectsQuery,
  useGetLeadProjectsQuery,
  useGetLeadProjectDeskQuery,
  useGetLeadDailyWorkQuery,
  useGetLeadPermissionsQuery,
  useGetProjectStatusUpdatesQuery,
  useCreateProjectStatusUpdateMutation,
  useGetProjectMembersQuery,
  useSetProjectMembersMutation,
  useSetWorkProjectStatusMutation,
  useGetEmployeeWorkProjectsQuery,
  useSetEmployeeWorkProjectsMutation,
  useGetProjectPlanQuery,
  useGetProjectGoalsQuery,
  useGetProjectMilestonesQuery,
  useCreateProjectGoalMutation,
  useUpdateProjectGoalMutation,
  useDeleteProjectGoalMutation,
  useCreateProjectMilestoneMutation,
  useUpdateProjectMilestoneMutation,
  useActivateProjectMilestoneMutation,
  useCompleteProjectMilestoneMutation,
  useCancelProjectMilestoneMutation,
  useDeleteProjectMilestoneMutation,
  useGetMilestoneHistoryQuery,
  useCreateWorkPriorityMutation,
  useUpdateWorkPriorityMutation,
  useCarryForwardWorkPriorityMutation,
  useSubmitWorkPriorityMutation,
  useSubmitAllWorkPrioritiesMutation,
  useApproveWorkPriorityMutation,
  useApproveAllWorkPrioritiesMutation,
  useRequestWorkPriorityResubmitMutation,
  useGetWeeklyWorkUpdateBoardQuery,
  useGetWeeklyPptAdminBoardQuery,
  useGetWeeklyPptGmSharesQuery,
  useShareWeeklyPptToGmMutation,
  useCreateWeeklyWorkUpdateUploadMutation,
  useLazyGetWeeklyWorkUpdateDownloadQuery,
  useGetJcPptBoardQuery,
  useCreateJcPptUploadMutation,
  useLazyGetJcPptDownloadQuery,
  useGetJcPptCsoBoardQuery,
  useGetJcPptGmBoardQuery,
  useTransferJcPptToGmMutation,
  useLazyGetJcPptPreviewQuery,
  useGmDownloadJcPptMutation,
  useGmEmailJcPptMutation,
  useGmDeleteJcPptMutation,
  useGmDeleteAllJcPptsMutation,
  useGmDownloadWeeklyPptMutation,
  useGmEmailWeeklyPptMutation,
  useGmDeleteWeeklyPptMutation,
  useGmDeleteAllWeeklyPptsInShareMutation,
  useCreateWorkProjectMutation,
  useGetAttendanceDayQuery,
  useGetAttendanceImportsQuery,
  useGetAttendanceImportQuery,
  useGetAttendanceImportCardQuery,
  useUploadAttendanceImportMutation,
  useDecideAttendanceReviewMutation,
  useConfirmAttendanceImportMutation,
  useRejectAttendanceImportMutation,
  useDeleteAttendanceImportMutation,
  useGetPayrollRunsQuery,
  useGetPayrollImportsQuery,
  useGetPayrollRunQuery,
  useGetPayrollPreviewQuery,
  useCalculatePayrollMutation,
  usePublishPayrollMutation,
  useGetMyPayslipsQuery,
  useGetPayslipQuery,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useGetShiftAssignmentsQuery,
  useCreateShiftAssignmentMutation,
  useGetEmployeeWorkWeekQuery,
  useSaveEmployeeWorkWeekMutation,
  useGetGrievancesQuery,
  useGetGrievanceCountsQuery,
  useGetGrievanceHandlersQuery,
  useGetGrievanceQuery,
  useCreateGrievanceMutation,
  useAddGrievanceCommentMutation,
  useAssignGrievanceMutation,
  useChangeGrievanceStatusMutation,
  useResolveGrievanceMutation,
  useCreateGrievanceAttachmentMutation,
  useLazyGetGrievanceAttachmentUrlQuery,
  useGetPoliciesQuery,
  useGetPolicyQuery,
  useCreatePolicyMutation,
  usePublishPolicyMutation,
  useAcknowledgePolicyMutation,
  useGetPolicyAcknowledgementsQuery,
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useSubscribeWebPushMutation,
  useUnsubscribeWebPushMutation,
  useGetReportsOverviewQuery,
} = api;
