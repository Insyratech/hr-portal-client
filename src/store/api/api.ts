import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clientEnv } from '@/lib/env';
import type {
  ApiSuccess,
  AttendanceCorrection,
  AttendanceDaySummary,
  AttendanceMe,
  AttendanceRecord,
  AuditLog,
  Employee,
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
  LeavePolicy,
  LeaveType,
  MeData,
  NamedEntity,
  OrganizationSettings,
  PolicyAcknowledgementReport,
  ReportsOverview,
  Role,
  Shift,
  ShiftAssignment,
  NotificationItem,
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
    'Shifts',
    'Corrections',
    'Grievances',
    'Policies',
    'Notifications',
    'Reports',
  ],
  endpoints: (builder) => ({
    getHealth: builder.query<ApiSuccess<HealthData>, void>({
      query: () => '/health',
    }),
    getMe: builder.query<ApiSuccess<MeData>, void>({
      query: () => '/api/v1/me',
      providesTags: ['Me'],
    }),
    getEmployees: builder.query<ApiSuccess<Employee[]>, { q?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/employees',
        params: arg && 'q' in arg && arg.q ? { q: arg.q } : undefined,
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
        dateOfBirth?: string;
        departmentId?: string;
        designationId?: string;
        joiningDate: string;
        employmentType: Employee['employmentType'];
        roleId?: string;
        roleIds?: string[];
        password: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/employees', method: 'POST', body }),
      invalidatesTags: ['Employees', 'Designations', 'Notifications'],
    }),
    updateEmployee: builder.mutation<
      ApiSuccess<Employee>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/employees/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Employees', 'Designations', 'Notifications'],
    }),
    getEmployeeAudit: builder.query<ApiSuccess<AuditLog[]>, string>({
      query: (id) => `/api/v1/employees/${id}/audit`,
      providesTags: ['Audit'],
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
    getLeaveColleagues: builder.query<ApiSuccess<{ id: string; fullName: string }[]>, void>({
      query: () => '/api/v1/leave-colleagues',
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
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/leave-types/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['LeaveTypes', 'LeavePolicies'],
    }),
    getAttendanceMe: builder.query<ApiSuccess<AttendanceMe>, void>({
      query: () => '/api/v1/attendance/me',
      providesTags: ['Attendance'],
    }),
    punchIn: builder.mutation<ApiSuccess<AttendanceRecord>, { latitude?: number; longitude?: number } | void>({
      query: (body) => ({ url: '/api/v1/attendance/punch-in', method: 'POST', body: body ?? {} }),
      invalidatesTags: ['Attendance'],
    }),
    punchOut: builder.mutation<ApiSuccess<AttendanceRecord>, { latitude?: number; longitude?: number } | void>({
      query: (body) => ({ url: '/api/v1/attendance/punch-out', method: 'POST', body: body ?? {} }),
      invalidatesTags: ['Attendance'],
    }),
    getAttendanceDay: builder.query<ApiSuccess<AttendanceDaySummary>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/attendance',
        params: arg && 'date' in arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Attendance'],
    }),
    getAttendanceCorrections: builder.query<ApiSuccess<AttendanceCorrection[]>, { status?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/attendance/corrections',
        params: arg && 'status' in arg && arg.status ? { status: arg.status } : undefined,
      }),
      providesTags: ['Corrections'],
    }),
    submitAttendanceCorrection: builder.mutation<
      ApiSuccess<AttendanceCorrection>,
      { date: string; proposedIn: string; proposedOut: string; reason: string }
    >({
      query: (body) => ({ url: '/api/v1/attendance/corrections', method: 'POST', body }),
      invalidatesTags: ['Corrections', 'Attendance'],
    }),
    approveAttendanceCorrection: builder.mutation<ApiSuccess<AttendanceCorrection>, string>({
      query: (id) => ({ url: `/api/v1/attendance/corrections/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Corrections', 'Attendance'],
    }),
    rejectAttendanceCorrection: builder.mutation<ApiSuccess<AttendanceCorrection>, string>({
      query: (id) => ({ url: `/api/v1/attendance/corrections/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['Corrections', 'Attendance'],
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
    getReportsOverview: builder.query<
      ApiSuccess<ReportsOverview>,
      { from?: string; to?: string; period?: string } | void
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
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetEmployeeAuditQuery,
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
  useGetLeaveColleaguesQuery,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useGetAttendanceMeQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetAttendanceDayQuery,
  useGetAttendanceCorrectionsQuery,
  useSubmitAttendanceCorrectionMutation,
  useApproveAttendanceCorrectionMutation,
  useRejectAttendanceCorrectionMutation,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useGetShiftAssignmentsQuery,
  useCreateShiftAssignmentMutation,
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
  useGetReportsOverviewQuery,
} = api;
