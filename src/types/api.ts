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
  companyId: string | null;
  joiningDate: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
  managerId: string | null;
  status: 'active' | 'inactive';
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  departmentName: string | null;
  designationName: string | null;
  companyName: string | null;
  roleCodes: string[];
};

export type Company = {
  id: string;
  name: string;
  address: string;
  logoStoragePath: string | null;
  logoUrl: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type CompanyLogoUpload = {
  path: string;
  token: string;
  uploadUrl: string;
};

export type Compensation = {
  id: string;
  employeeId: string;
  basic: number;
  da: number;
  hra: number;
  fuel: number;
  incentives: number;
  other: number;
  professionalTax: number;
  tds: number;
  employeeWelfare: number;
  kpi: number;
  otherDeductions: number;
  effectiveFrom: string;
  createdAt: string;
};

export type PaymentDetails = {
  employeeId: string;
  pan: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  ifsc: string | null;
  updatedAt: string;
};

export type EmployeePayroll = {
  current: Compensation | null;
  history: Compensation[];
  payment: PaymentDetails | null;
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

/** Working-day calendar only. Slip letterhead comes from the employee’s company, not this record. */
export type OrganizationSettings = {
  id: string;
  workingDays: string[];
  workUpdateReminderHour: number;
};

/** Super Admin work reminder + retention policy (Phase 8). */
export type WorkSettings = {
  id: string;
  /** IANA zone for reminder hours — Asia/Kolkata (IST). */
  timeZone?: string;
  reminderHour: number;
  secondReminderHour: number | null;
  retentionDays: 90 | 180 | 365;
  archiveBeforeDelete: boolean;
  notifyBeforePurge: boolean;
  purgeNotifyDaysBefore: number;
  legalHold: boolean;
};

export type WorkDayContext = {
  isoDate: string;
  required: boolean;
  status: 'COMPLETED' | 'MISSING' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND' | 'NOT_REQUIRED';
  onApprovedLeave: boolean;
  submitted: boolean;
};

export type WorkDayPriority = {
  id: string;
  title: string;
  type: string;
  projectId: string | null;
  projectName: string | null;
  milestoneId: string | null;
  milestoneName: string | null;
  isAdditional: boolean;
  status: string;
  approvalStatus?: WorkPriorityApprovalStatus;
};

export type WorkDayBoard = {
  context: WorkDayContext;
  formOpen: boolean;
  skipReason: string | null;
  approvalBlockReason?: string | null;
  prioritiesApproved?: boolean;
  week: { start: string; end: string };
  priorities: WorkDayPriority[];
  submitted: {
    dayId: string;
    entries: { id: string; category: string; priorityId: string | null; projectId: string | null; description: string }[];
    tomorrow: string;
    blocker: { id: string; category: string; description: string; priorityId: string | null } | null;
  } | null;
};

export type WorkHistoryMonth = {
  month: string;
  days: { isoDate: string; status: WorkDayContext['status']; required: boolean; mark: string }[];
  submitted: { date: string; status: string; entries: { category: string; description: string; priorityId: string | null }[] }[];
};

export type WorkProjectMember = {
  employeeId: string;
  fullName: string;
};

export type ProjectActiveMilestone = {
  id: string;
  name: string;
  goalName: string;
  targetDate: string | null;
};

export type ProjectMilestoneSummary = {
  initialCount: number;
  additionalCount: number;
  completedCount: number;
};

export type WorkProject = {
  id: string;
  name: string;
  code: string;
  status: string;
  leadEmployeeId?: string | null;
  leadName?: string | null;
  memberCount?: number;
  members?: WorkProjectMember[];
  activeMilestone?: ProjectActiveMilestone | null;
  milestoneSummary?: ProjectMilestoneSummary;
};

export type ProjectGoalListItem = Omit<ProjectGoal, 'milestones'>;

export type ProjectMilestoneListItem = ProjectMilestone & {
  goalName: string;
};

export type MilestoneStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type ProjectMilestone = {
  id: string;
  goalId: string;
  projectId: string;
  name: string;
  description: string;
  startDate: string | null;
  targetDate: string | null;
  status: MilestoneStatus;
  sequence: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectGoal = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  isPrimary: boolean;
  sequence: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  milestones: ProjectMilestone[];
};

export type ProjectPlan = {
  projectId: string;
  goals: ProjectGoal[];
};

export type MilestoneHistoryEntry = {
  id: string;
  milestoneId: string;
  version: number;
  changedField: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  changeReason: string;
};

export type LeadProjectSummary = {
  id: string;
  name: string;
  code: string;
  status: string;
  leadEmployeeId: string;
  memberCount: number;
};

export type ProjectUpdateTopic = 'PROGRESS' | 'RISK' | 'BLOCKER' | 'NEXT_STEPS' | 'OTHER';

export type ProjectStatusUpdate = {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  body: string;
  topic?: ProjectUpdateTopic | null;
  createdAt: string;
};

export type LeadDailyWorkEntry = {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  category: string;
  description: string;
  priorityId: string | null;
};

export type LeadDailyWorkBoard = {
  range: { start: string; end: string };
  entries: LeadDailyWorkEntry[];
};

export type LeadProjectDesk = {
  project: WorkProject & {
    leadEmployeeId: string;
    leadName: string;
    members: WorkProjectMember[];
    memberCount: number;
  };
  week: { start: string; end: string };
  activeMilestone: ProjectActiveMilestone | null;
  updates: ProjectStatusUpdate[];
  priorities: {
    id: string;
    employeeId: string;
    employeeName: string;
    title: string;
    type: string;
    status: string;
    approvalStatus: string;
    milestoneId: string | null;
    milestoneName: string | null;
    isAdditional: boolean;
  }[];
  prioritiesByMilestone: {
    milestoneId: string | null;
    milestoneName: string;
    items: LeadProjectDesk['priorities'];
  }[];
  dailyEntries: {
    id: string;
    date: string;
    employeeId: string;
    employeeName: string;
    category: string;
    description: string;
    priorityId: string | null;
  }[];
  reportingChain: ProjectReportingGoal[];
};

export type ProjectReportingDailyEntry = {
  id: string;
  date: string;
  category: string;
  description: string;
};

export type ProjectReportingPriority = {
  id: string;
  title: string;
  status: string;
  approvalStatus: string;
  isAdditional: boolean;
  dailyEntries: ProjectReportingDailyEntry[];
};

export type ProjectReportingEmployee = {
  employeeId: string;
  fullName: string;
  priorities: ProjectReportingPriority[];
};

export type ProjectReportingMilestone = {
  id: string;
  name: string;
  status: MilestoneStatus;
  employees: ProjectReportingEmployee[];
};

export type ProjectReportingGoal = {
  id: string;
  name: string;
  milestones: ProjectReportingMilestone[];
};

export type EmployeeWorkProjects = {
  employeeId: string;
  projects: WorkProject[];
};

export type WeeklyWorkUpdate = {
  id: string;
  employeeId: string;
  weekStart: string;
  weekEnd: string;
  originalFileName: string;
  systemFileName: string;
  contentType: string;
  sizeBytes: number;
  uploadCount: number;
  submittedAt: string;
  late: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyWorkUpdateBoard = {
  week: {
    start: string;
    end: string;
    saturday: string;
    deadlineLabel: string;
    lateAfterLabel: string;
  };
  current: WeeklyWorkUpdate | null;
  uploadsRemaining: number;
  maxUploads: number;
  maxBytes: number;
  stats: { onTime: number; late: number; missing: number; weeksTracked: number };
  weeks: {
    weekStart: string;
    weekEnd: string;
    status: 'on_time' | 'late' | 'missing' | 'pending';
    update: WeeklyWorkUpdate | null;
  }[];
};

export type WeeklyWorkUpdateUploadSession = {
  update: WeeklyWorkUpdate;
  uploadUrl: string;
  token: string;
  path: string;
  bucket: string;
};

export type WeeklyPptPersonStatus = 'on_time' | 'late' | 'missing' | 'pending';

export type WeeklyPptAdminBoard = {
  week: {
    start: string;
    end: string;
    saturday: string;
    deadlineLabel: string;
    lateAfterLabel: string;
  };
  counts: {
    expected: number;
    onTime: number;
    late: number;
    missing: number;
    pending: number;
    submitted: number;
  };
  people: {
    employeeId: string;
    fullName: string;
    email: string;
    status: WeeklyPptPersonStatus;
    update: WeeklyWorkUpdate | null;
  }[];
  shares: {
    id: string;
    weekStart: string;
    weekEnd: string;
    sharedBy: string;
    sharedByName: string;
    sharedAt: string;
    fileCount: number;
    note: string;
  }[];
};

export type WeeklyPptSharePackage = {
  id: string;
  weekStart: string;
  weekEnd: string;
  sharedBy: string;
  sharedByName: string;
  sharedAt: string;
  fileCount: number;
  note: string;
  files: {
    updateId: string;
    systemFileName: string;
    late: boolean;
    employeeName: string;
  }[];
};

export type WeeklyPptGmShares = {
  count: number;
  shares: WeeklyPptSharePackage[];
};

export type WorkPriorityApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RESUBMIT_REQUESTED';

export type WorkRegularSubtype =
  | 'TESTING'
  | 'PRODUCTION'
  | 'GENERAL_MANAGEMENT'
  | 'INVENTORY'
  | 'OTHER';

export type WorkPriority = {
  id: string;
  planId: string;
  employeeId: string;
  type: 'PROJECT' | 'REGULAR' | 'SKILL';
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  milestoneId: string | null;
  milestoneName: string | null;
  isAdditional: boolean;
  regularSubtype: WorkRegularSubtype | null;
  regularSubtypeLabel: string | null;
  title: string;
  description: string;
  expectedOutcome: string;
  successCriteria: string;
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status:
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'PARTIALLY_COMPLETED'
    | 'BLOCKED'
    | 'CANCELLED'
    | 'CARRIED_FORWARD';
  incompleteReason: string | null;
  assignedBy: string | null;
  carriedFromId: string | null;
  approvalStatus: WorkPriorityApprovalStatus;
  csoComment: string;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  resubmitRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Present when a project lead views another employee's week. */
  canApprove?: boolean;
};

export type WorkOverview = {
  today: string;
  planning: { start: string; end: string };
  wrapUp: boolean;
  actions: { setPriorities: boolean; todayUpdate: boolean };
  indicators: {
    completionPct: number;
    compliancePct: number;
    plannedCount: number;
    unplannedCount: number;
    carryForwardCount: number;
  };
  friday: {
    done: number;
    total: number;
    unplanned: string[];
    blockers: string[];
    carried: number;
  } | null;
  blockers: { description: string }[];
};

export type WorkWeekFeedback = {
  id: string;
  type: string;
  comment: string;
  actorId: string;
  actorName: string;
  createdAt: string;
};

export type WorkBoard = {
  date: string;
  range: { start: string; end: string };
  week: { start: string; end: string };
  today: { expected: number; submitted: number; missing: number; onLeave: number };
  weekCompletionPct: number;
  unplannedVolume: number;
  openBlockers: { id: string; employeeId: string; employeeName: string; description: string }[];
  people: {
    id: string;
    name: string;
    departmentName: string | null;
    todayStatus: string;
    todayLabel: string;
    weekCompletionPct: number;
    approvalStatus: 'none' | 'draft' | 'awaiting' | 'needs_resubmit' | 'approved';
    approvalLabel: string;
    pptStatus: 'on_time' | 'late' | 'missing' | 'pending';
    pptLabel: string;
  }[];
};

export type WorkPrioritiesQueueItem = {
  employeeId: string;
  employeeName: string;
  departmentId: string | null;
  departmentName: string | null;
  workGoalCount: number;
  skillCount: number;
  submittedCount: number;
  weekStart: string;
  weekEnd: string;
};

export type WorkPrioritiesQueue = {
  week: { start: string; end: string };
  items: WorkPrioritiesQueueItem[];
};

export type WorkPrioritiesApprovedItem = {
  employeeId: string;
  employeeName: string;
  departmentId: string | null;
  departmentName: string | null;
  workGoalCount: number;
  skillCount: number;
  approvedCount: number;
  weekStart: string;
  weekEnd: string;
};

export type WorkPrioritiesApproved = {
  week: { start: string; end: string };
  items: WorkPrioritiesApprovedItem[];
};

export type WorkAnalyticsTrend = {
  month: string;
  compliancePct: number;
  weeksWithPlanPct: number;
  weeksWithPlan: number;
  weeksTotal: number;
  requiredDays: number;
  submittedDays: number;
  completed: number;
  carriedForward: number;
  blocked: number;
  plannedEntries: number;
  unplannedEntries: number;
  unplannedSharePct: number;
  skillEntries: number;
  skillPrioritiesCompleted: number;
  skillPrioritiesTotal: number;
};

export type WorkAttentionLabel = {
  code: 'LOW_COMPLIANCE' | 'NO_WEEK_PLAN' | 'OPEN_BLOCKER' | 'PRIORITIES_BLOCKED' | 'HEAVY_CARRY';
  label: string;
  detail: string;
};

export type WorkAnalytics = {
  range: { from: string; to: string; start: string; end: string };
  attentionMonth: string;
  note: string;
  reliability: {
    compliancePct: number;
    weeksWithPlanPct: number;
    weeksWithPlan: number;
    weeksTotal: number;
    requiredDays: number;
    submittedDays: number;
  };
  execution: { completed: number; carriedForward: number; blocked: number };
  adaptability: { plannedEntries: number; unplannedEntries: number; unplannedSharePct: number };
  development: {
    skillEntries: number;
    skillPrioritiesCompleted: number;
    skillPrioritiesTotal: number;
  };
  trends: WorkAnalyticsTrend[];
  needsAttention: {
    employeeId: string;
    employeeName: string;
    departmentName: string | null;
    labels: WorkAttentionLabel[];
  }[];
};

export type WeeklyWorkBoard = {
  week: {
    planId: string;
    start: string;
    end: string;
    label: string;
    isLastWorkingDay: boolean;
  };
  priorities: WorkPriority[];
  projects: WorkProject[];
  feedback: WorkWeekFeedback[];
  softCap: number;
  overCap: boolean;
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
  paid: boolean;
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
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  projectLeadEmployeeId: string | null;
  projectLeadAccepted: boolean;
  hasProjectLeadStep: boolean;
  reviewerComment: string | null;
  attachmentUrl: string | null;
  status: string;
  createdAt: string;
};

export type LeaveProjectOption = {
  id: string;
  name: string;
  code: string;
  leadEmployeeId: string;
  leadName: string;
};

export type LeaveColleague = {
  id: string;
  fullName: string;
  available: boolean;
  leaveDates: string | null;
};

export type Holiday = {
  id: string;
  name: string;
  date: string;
  type: string;
  region: string;
  optional: boolean;
};

export type WorkPermission = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  permissionDate: string;
  minutes: number;
  slot: 'START' | 'END';
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  actorId: string | null;
  decidedAt: string | null;
  createdAt: string;
  remainingMinutes: number;
  monthLabel: string;
};

export type WorkPermissionMine = {
  quotaMinutes: number;
  items: WorkPermission[];
};

export type ShiftChangeRequest = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  projectId: string | null;
  projectName: string | null;
  projectCode: string | null;
  startDate: string;
  endDate: string;
  requestedShiftId: string;
  requestedShiftName: string | null;
  currentShiftId: string | null;
  currentShiftName: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  projectLeadEmployeeId: string | null;
  projectLeadName: string | null;
  projectLeadRequired: boolean;
  projectLeadAccepted: boolean;
  projectLeadActedAt: string | null;
  reviewerEmployeeId: string | null;
  reviewerComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
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
  published: boolean;
  period: string;
  monthLabel: string;
  message: string | null;
  records: {
    id: string;
    attendanceDate: string;
    actualIn: string | null;
    actualOut: string | null;
    status: string;
    workedMinutes: number | null;
  }[];
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

export type AttendanceImport = {
  id: string;
  period: string;
  fileName: string;
  storagePath: string | null;
  status: string;
  uploadedBy: string;
  confirmedAt: string | null;
  createdAt: string;
};

export type AttendanceReviewDay = {
  id: string;
  employeeId: string;
  attendanceDate: string;
  status: string;
  actualIn: string | null;
  actualOut: string | null;
  workedMinutes: number | null;
  lateMinutes: number;
  permissionMinutes: number;
  permissionCovered: boolean;
  leaveTypeName: string | null;
  leavePaid: boolean | null;
  leaveDuration: string | null;
  proposedLop: number | null;
  finalLop: number | null;
  hrAction: 'FULL_LOP' | 'HALF_LOP' | 'NO_LOP' | 'EXCLUDE' | null;
  reason: string | null;
  needsHrDecision: boolean;
  skippedFromLop: boolean;
  shiftName: string | null;
};

export type AttendanceReviewCard = {
  id: string;
  employeeId: string;
  employeeCode: string;
  fullName: string;
  companyName: string | null;
  shiftName: string | null;
  remainingLabel: string;
  permissionTakenMinutes: number;
  quotaMinutes: number;
  leaves: { date: string; typeName: string | null; paid: boolean | null; duration: string | null }[];
  permissions: { date: string; minutes: number }[];
  days: AttendanceReviewDay[];
  proposedLop: number;
  finalLop: number;
  payableDays: number;
  workingDaysCount: number;
  openFlags: number;
  needsDecision: boolean;
};

export type AttendanceImportDetail = {
  import: AttendanceImport;
  exceptions: { id: string; employeeCode: string; name: string; date: string; reason: string }[];
  openFlags: number;
  canConfirm: boolean;
  cards: AttendanceReviewCard[];
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

export type WorkWeek = {
  id: string;
  employeeId: string;
  pattern: 'SUNDAY_OFF' | 'WEEKEND_OFF' | 'SECOND_FOURTH_SATURDAY';
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

export type DirectoryEditRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'FULFILLED'
  | 'CANCELLED';

export type DirectoryEditRequest = {
  id: string;
  targetEmployeeId: string;
  targetName: string;
  targetCode: string;
  requesterId: string;
  requesterName: string;
  reason: string;
  fieldHints: string | null;
  status: DirectoryEditRequestStatus;
  decidedBy: string | null;
  decisionNote: string | null;
  unlockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  fulfilledAt: string | null;
};

export type DirectoryEditRequestForEmployee = {
  open: DirectoryEditRequest | null;
  canRequest: boolean;
  canEdit: boolean;
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
    lop: number;
    halfDay: number;
    onLeave: number;
    overtimeMinutes: number;
    published: boolean;
    companyId: string | null;
    byStatus: { status: string; count: number }[];
  };
  grievances: {
    open: number;
    resolved: number;
    averageResolutionHours: number | null;
    byCategory: { category: string; count: number }[];
  };
};

export type LeaveParticulars = {
  cl: number;
  sl: number;
  ml: number;
  el: number;
  maternityPaternity: number;
  missPunch: number;
  permissionsCount: number;
  permissionHours: number;
  lateDays: number;
  absent: number;
  totalLop: number;
};

export type PayrollRun = {
  id: string;
  period: string;
  attendanceImportId: string | null;
  status: string;
  calculatedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type ConfirmedPayrollImport = {
  importId: string;
  period: string;
  fileName: string;
  confirmedAt: string | null;
  payrollStatus: string | null;
  payrollLocked: boolean;
};

export type PayrollCompensationParts = {
  basic: number;
  da: number;
  hra: number;
  fuel: number;
  incentives: number;
  other: number;
  professionalTax: number;
  tds: number;
  employeeWelfare: number;
  kpi: number;
  otherDeductions: number;
};

export type PayrollPreviewEmployee = {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  companyName: string | null;
  lopDays: number;
  compensation: PayrollCompensationParts | null;
  ready: boolean;
  skipReason: string | null;
};

export type PayrollPreview = {
  importId: string;
  period: string;
  monthLabel: string;
  calendarDays: number;
  employees: PayrollPreviewEmployee[];
};

export type PayrollAdjustment = {
  employeeId: string;
  incentives?: number;
  other?: number;
  professionalTax?: number;
  tds?: number;
  employeeWelfare?: number;
  kpi?: number;
  otherDeductions?: number;
};

export type CalculatePayrollInput = {
  importId: string;
  adjustments?: PayrollAdjustment[];
};

export type SalarySlip = {
  id: string;
  runId: string;
  employeeId: string;
  period: string;
  monthLabel: string;
  employeeCode: string;
  employeeName: string;
  designationName: string | null;
  departmentName: string | null;
  companyName: string;
  companyAddress: string;
  companyLogoPath: string | null;
  companyLogoUrl: string | null;
  panMasked: string | null;
  bankAccountMasked: string | null;
  bankNameMasked: string | null;
  ifscMasked: string | null;
  basic: number;
  da: number;
  hra: number;
  fuel: number;
  incentives: number;
  other: number;
  professionalTax: number;
  tds: number;
  employeeWelfare: number;
  kpi: number;
  otherDeductions: number;
  calendarDays: number;
  gross: number;
  dailyRate: number;
  lopDays: number;
  lopAmount: number;
  net: number;
  particulars: LeaveParticulars;
};

export type PayrollRunDetail = {
  run: PayrollRun;
  companies: string[];
  slips: SalarySlip[];
  skipped?: { employeeId: string; name: string; reason: string }[];
};

