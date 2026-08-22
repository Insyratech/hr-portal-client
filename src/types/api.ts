export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

export type HealthData = {
  status: 'ok';
  service: string;
  phase: number;
  supabaseConfigured: boolean;
};

export type MeData = {
  employeeId: string;
  authUserId: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
};

export type Employee = {
  id: string;
  userId: string | null;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  notificationEmail?: string | null;
  dateOfBirth: string | null;
  departmentId: string | null;
  designationId: string | null;
  joiningDate: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  managerId: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  departmentName: string | null;
  designationName: string | null;
  roleCodes: string[];
};

export type NamedEntity = {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive';
};

export type Role = {
  id: string;
  code: string;
  name: string;
};

export type OrganizationSettings = {
  id: string;
  workingDays: string[];
};

export type AuditLog = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
};

export type LeaveType = {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
  requiresApproval: boolean;
  requiresHandover: boolean;
  requiresAttachment: boolean;
  allowHalfDay: boolean;
  allowMultipleDays: boolean;
};

export type PolicyRules = {
  noticePeriod: { value: number; unit: 'hours' | 'days' };
  requiresApproval: boolean;
  requiresHandover: boolean;
  requiresAttachment: boolean;
  allowHalfDay: boolean;
  allowNegativeBalance: boolean;
  minimumServiceDays: number;
  maximumConsecutiveDays: number | null;
  annualAllocation: number;
  carryForward: number;
};

export type LeavePolicy = {
  id: string;
  name: string;
  leaveTypeId: string;
  leaveTypeName: string | null;
  leaveTypeCode: string | null;
  versions: {
    id: string;
    versionNumber: number;
    status: string;
    publishedAt: string | null;
    rules: PolicyRules;
  }[];
  activeVersion: {
    id: string;
    versionNumber: number;
    status: string;
    rules: PolicyRules;
  } | null;
};

export type LeaveBalance = {
  leaveTypeId: string;
  code: string;
  name: string;
  period: string;
  allocated: number;
  used: number;
  available: number;
};

export type LeaveAllocation = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  leaveTypeId: string;
  leaveTypeCode: string | null;
  leaveTypeName: string | null;
  period: string;
  allocated: number;
  carriedForward: number;
  adjusted: number;
  used: number;
  available: number;
};

export type LeaveApplication = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  leaveTypeId: string;
  leaveTypeName: string | null;
  leaveTypeCode: string | null;
  policyVersionId: string;
  startDate: string;
  endDate: string;
  duration: 'full' | 'half';
  quantity: number;
  reason: string | null;
  handover: string | null;
  handoverEmployeeId: string | null;
  handoverEmployeeName: string | null;
  handoverAccepted: boolean;
  reviewerComment: string | null;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
};

export type Holiday = {
  id: string;
  name: string;
  date: string;
  type: string;
  region: string;
  optional: boolean;
};

export type Shift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  minimumDurationMinutes: number;
  gracePeriodMinutes: number;
  lateThresholdMinutes: number;
  earlyExitThresholdMinutes: number;
  flexible: boolean;
  active: boolean;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  attendanceDate: string;
  shiftId: string | null;
  shiftName: string | null;
  scheduledIn: string | null;
  scheduledOut: string | null;
  actualIn: string | null;
  actualOut: string | null;
  workedMinutes: number | null;
  status: string;
  lateMinutes: number;
  earlyExitMinutes: number;
  overtimeMinutes: number;
};

export type AttendanceMe = {
  today: AttendanceRecord;
  shift: Shift | null;
  history: AttendanceRecord[];
};

export type AttendanceDaySummary = {
  date: string;
  counts: {
    present: number;
    late: number;
    absent: number;
    onLeave: number;
    missingPunch: number;
  };
  records: AttendanceRecord[];
};

export type AttendanceCorrection = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  attendanceDate: string;
  proposedIn: string;
  proposedOut: string;
  reason: string;
  status: string;
  createdAt: string;
};

export type ShiftAssignment = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  shiftId: string;
  shiftName: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type GrievanceCategory =
  | 'WORKPLACE'
  | 'SALARY'
  | 'MANAGER'
  | 'ATTENDANCE'
  | 'POLICY'
  | 'OTHER';

export type GrievanceStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'CLOSED';

export type Grievance = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  category: GrievanceCategory;
  subject: string;
  description: string;
  status: GrievanceStatus;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GrievanceComment = {
  id: string;
  authorId: string;
  authorName: string | null;
  body: string;
  visibility: 'EMPLOYEE' | 'INTERNAL';
  createdAt: string;
};

export type GrievanceAttachment = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

export type GrievanceAssignment = {
  id: string;
  assigneeId: string;
  assigneeName: string | null;
  assignedBy: string;
  active: boolean;
  createdAt: string;
};

export type GrievanceDetail = Grievance & {
  comments: GrievanceComment[];
  attachments: GrievanceAttachment[];
  assignments: GrievanceAssignment[];
};

export type GrievanceCounts = {
  byStatus: {
    OPEN: number;
    UNDER_REVIEW: number;
    INVESTIGATING: number;
    RESOLVED: number;
    CLOSED: number;
  };
  total: number;
};

export type GrievanceHandler = {
  employeeId: string;
  fullName: string;
  role: string;
};

export type GrievanceUploadSession = {
  attachment: GrievanceAttachment;
  uploadUrl: string;
  token: string;
  path: string;
};

export type HrPolicyVersionSummary = {
  id: string;
  versionLabel: string;
  effectiveDate: string | null;
  acknowledgementRequired: boolean;
  status: 'draft' | 'published';
  publishedAt: string | null;
};

export type HrPolicyVersion = HrPolicyVersionSummary & {
  content: string;
  createdAt: string;
};

export type HrPolicy = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: HrPolicyVersionSummary | null;
  draftVersion: HrPolicyVersion | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  versions: HrPolicyVersion[];
  content?: string;
};

export type PolicyAcknowledgementReport = {
  policyId: string;
  version: HrPolicyVersion;
  acknowledgedCount: number;
  pendingCount: number;
  employees: {
    employeeId: string;
    fullName: string;
    email: string;
    acknowledged: boolean;
    acceptedAt: string | null;
  }[];
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceType: string | null;
  referenceId: string | null;
  readAt: string | null;
  createdAt: string;
  unread: boolean;
};

export type ReportsOverview = {
  period: string;
  attendanceRange: { from: string; to: string };
  employees: {
    total: number;
    active: number;
    inactive: number;
    byDepartment: { name: string; count: number }[];
    byDesignation: { name: string; count: number }[];
  };
  leave: {
    period: string;
    used: number;
    allocated: number;
    utilizationRate: number;
    pendingApprovals: number;
    byType: { name: string; used: number; allocated: number; available: number }[];
    byDepartment: { name: string; used: number }[];
  };
  attendance: {
    from: string;
    to: string;
    present: number;
    absent: number;
    late: number;
    missingPunches: number;
    halfDay: number;
    onLeave: number;
    overtimeMinutes: number;
    byStatus: { status: string; count: number }[];
  };
  grievances: {
    open: number;
    resolved: number;
    averageResolutionHours: number | null;
    byCategory: { category: string; count: number }[];
  };
};

