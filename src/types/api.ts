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
  thirdReminderHour: number | null;
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

/** A project the signed-in employee belongs to. Members get read access; only the lead can edit. */
export type MyProjectSummary = WorkProject & {
  leadName: string | null;
  memberCount: number;
  members: WorkProjectMember[];
  isLead: boolean;
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

export type LeadPermissionHistoryItem = {
  id: string;
  kind: 'leave' | 'shift_change';
  employeeName: string;
  projectName: string | null;
  projectCode: string | null;
  summary: string;
  detail: string | null;
  actedAt: string;
  requestStatus: string;
};

export type LeadPermissionsBoard = {
  pendingLeaves: LeaveApplication[];
  pendingShiftChanges: ShiftChangeRequest[];
  pendingPrioritiesCount: number;
  history: LeadPermissionHistoryItem[];
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

/**
 * How a weekly PPT landed against the Sunday deadline.
 * `on_time` up to Sun 22:59 IST, `last_hour` Sun 23:00–23:59 IST, `late` after that.
 */
export type WeeklyPptTiming = 'on_time' | 'last_hour' | 'late';

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
  timing: WeeklyPptTiming;
  /** Derived from `timing` — true only for submissions after Sunday 23:59 IST. */
  late: boolean;
  fileAvailable?: boolean;
  fileRemovedAt?: string | null;
  fileRemovedReason?: 'downloaded' | 'emailed' | 'deleted' | null;
  emailRecipient?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WeeklyWorkUpdateBoard = {
  week: {
    start: string;
    end: string;
    deadlineDate: string;
    deadlineLabel: string;
    lastHourAfterLabel: string;
  };
  current: WeeklyWorkUpdate | null;
  uploadsRemaining: number;
  maxUploads: number;
  maxBytes: number;
  stats: { onTime: number; lastHour: number; late: number; missing: number; weeksTracked: number };
  weeks: {
    weekStart: string;
    weekEnd: string;
    status: WeeklyPptPersonStatus;
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

export type JcPptStatus = 'uploaded' | 'with_gm' | 'downloaded' | 'emailed' | 'deleted';

export type JcPptItem = {
  id: string;
  employeeId: string;
  employeeName?: string;
  originalFileName: string;
  systemFileName: string;
  contentType: string;
  sizeBytes: number;
  status: JcPptStatus;
  fileAvailable: boolean;
  uploadedAt: string;
  transferredAt: string | null;
  transferredBy: string | null;
  transferredByName: string | null;
  consumedAt: string | null;
  consumedBy: string | null;
  consumedByName: string | null;
  emailRecipient: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JcPptEvent = {
  id: string;
  jcPptId: string;
  actorId: string | null;
  actorName: string | null;
  eventType: string;
  note: string;
  createdAt: string;
};

export type JcPptEmployeeBoard = {
  maxBytes: number;
  pending: JcPptItem | null;
  items: JcPptItem[];
  events: JcPptEvent[];
};

export type JcPptUploadSession = {
  item: JcPptItem;
  uploadUrl: string;
  token: string;
  path: string;
  bucket: string;
};

export type JcPptCsoBoard = {
  counts: { pending: number; withGm: number; completed: number; total: number };
  pending: JcPptItem[];
  withGm: JcPptItem[];
  history: JcPptItem[];
  events: JcPptEvent[];
};

export type JcPptGmBoard = {
  counts: { inbox: number; completed: number; total: number };
  inbox: JcPptItem[];
  history: JcPptItem[];
  events: JcPptEvent[];
};

export type JcPptConsumeResult = {
  item: JcPptItem;
  download: { fileName: string; contentType: string; contentBase64: string } | null;
};

export type WeeklyPptConsumeResult = {
  update: WeeklyWorkUpdate;
  download: { fileName: string; contentType: string; contentBase64: string } | null;
};

export type WeeklyPptPersonStatus = WeeklyPptTiming | 'missing' | 'pending';

export type WeeklyPptAdminBoard = {
  week: {
    start: string;
    end: string;
    deadlineDate: string;
    deadlineLabel: string;
    lastHourAfterLabel: string;
  };
  counts: {
    expected: number;
    onTime: number;
    lastHour: number;
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
  availableCount: number;
  files: {
    updateId: string;
    systemFileName: string;
    timing: WeeklyPptTiming;
    late: boolean;
    employeeName: string;
    fileAvailable: boolean;
    fileRemovedAt: string | null;
    fileRemovedReason: 'downloaded' | 'emailed' | 'deleted' | null;
    emailRecipient: string | null;
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
    pptStatus: WeeklyPptPersonStatus;
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
  /** True when either PL or HR approval is required. */
  requiresApproval: boolean;
  requiresPlApproval: boolean;
  requiresHrApproval: boolean;
  requiresHandover: boolean;
  requiresAttachment: boolean;
  allowHalfDay: boolean;
  allowMultipleDays: boolean;
  paid: boolean;
};

export type PolicyRules = {
  noticePeriod: { value: number; unit: 'hours' | 'days' };
  requiresApproval: boolean;
  requiresPlApproval: boolean;
  requiresHrApproval: boolean;
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
  hasHrManagerStep: boolean;
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
  unavailableReason?: string | null;
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

/** Signed-in employee's shift and working-week assignments (self-scoped). */
export type MyScheduleShift = {
  id: string;
  shiftId: string;
  shiftName: string;
  startTime: string | null;
  endTime: string | null;
  flexible: boolean;
  minimumDurationMinutes: number;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type MyScheduleWorkWeek = {
  id: string;
  pattern: WorkWeek['pattern'];
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type MySchedule = {
  shift: {
    current: MyScheduleShift | null;
    history: MyScheduleShift[];
  };
  workWeek: {
    current: MyScheduleWorkWeek | null;
    history: MyScheduleWorkWeek[];
  };
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
    byCompany: { id: string; name: string; active: number; inactive: number; total: number }[];
  };
  leave: {
    period: string;
    used: number;
    allocated: number;
    utilizationRate: number;
    pendingApprovals: number;
    byType: { name: string; used: number; allocated: number; available: number }[];
    byDepartment: { name: string; used: number }[];
    employeeStatus?: {
      id: string;
      employeeName: string;
      employeeCode: string;
      used: number;
      allocated: number;
      available: number;
      utilizationRate: number;
    }[];
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
  permissions: {
    pending: number;
    approvedThisPeriod: number;
    rejectedThisPeriod: number;
    minutesApprovedThisPeriod: number;
    byStatus: { status: string; count: number }[];
  };
  projects: {
    active: number;
    inactive: number;
    withActiveMilestone: number;
    statusUpdatesThisPeriod: number;
    items: {
      id: string;
      name: string;
      code: string;
      status: string;
      leadEmployeeId: string | null;
      leadName: string | null;
      memberCount: number;
      members: WorkProjectMember[];
      activeMilestoneName: string | null;
    }[];
    byStatus: { status: string; count: number }[];
  };
  work: {
    prioritiesPendingApproval: number;
    dailyUpdatesThisWeek: number;
    weekStart: string;
    prioritiesByApproval: { status: string; count: number }[];
  };
  queues: {
    pendingLeaves: number;
    pendingPermissions: number;
    pendingEditRequests: number;
    pendingShiftChanges: number;
    openGrievances: number;
    leaves?: {
      id: string;
      employeeName: string;
      employeeCode: string;
      leaveTypeName: string;
      leaveTypeCode: string | null;
      startDate: string;
      endDate: string;
      duration: string;
      quantity: number;
      reason: string | null;
      status: string;
      createdAt: string;
    }[];
    permissions?: {
      id: string;
      employeeName: string;
      employeeCode: string;
      permissionDate: string;
      minutes: number;
      slot: string;
      reason: string | null;
      status: string;
      createdAt: string;
    }[];
    shiftChanges?: {
      id: string;
      employeeName: string;
      employeeCode: string;
      projectName: string | null;
      projectCode: string | null;
      startDate: string;
      endDate: string;
      currentShiftName: string | null;
      requestedShiftName: string | null;
      reason: string;
      projectLeadRequired: boolean;
      projectLeadAccepted: boolean;
      status: string;
      createdAt: string;
    }[];
    editRequests?: {
      id: string;
      targetName: string;
      targetCode: string;
      requesterName: string;
      reason: string;
      fieldHints: string | null;
      status: string;
      createdAt: string;
    }[];
    grievances?: {
      id: string;
      subject: string;
      category: string;
      status: string;
      employeeName: string | null;
      employeeCode: string | null;
      createdAt: string;
    }[];
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

/** Finance Phase 0 */
export type FinanceOrganization = {
  id: string;
  legalName: string;
  tradeName: string;
  cin: string | null;
  pan: string | null;
  gstin: string | null;
  industry: string | null;
  countryCode: string;
  stateCode: string | null;
  stateName: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  baseCurrency: string;
  language: string;
  timeZone: string;
  fiscalYearStartMonth: number;
  gstRegistered: boolean;
  gstRegistrationType: 'regular' | 'composition' | 'unregistered' | null;
  setupCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceAccount = {
  id: string;
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  systemRole: string | null;
  isSystem: boolean;
  isActive: boolean;
  parentId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type FinanceTaxRate = {
  id: string;
  name: string;
  ratePercent: number;
  taxType: 'cgst' | 'sgst' | 'igst' | 'cess' | 'tds';
  isActive: boolean;
};

export type FinanceTaxGroup = {
  id: string;
  name: string;
  isActive: boolean;
  rateIds: string[];
  rates: FinanceTaxRate[];
};

export type FinanceTdsRate = {
  id: string;
  section: string;
  name: string;
  ratePercent: number;
  isActive: boolean;
};

export type FinanceCustomer = {
  id: string;
  displayName: string;
  companyName: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  pan: string | null;
  stateCode: string | null;
  stateName: string | null;
  billingAddress: string;
  shippingAddress: string;
  billingLine1: string;
  billingLine2: string;
  billingCity: string;
  billingPostalCode: string;
  billingCountry: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingStateCode: string | null;
  shippingStateName: string | null;
  shippingPostalCode: string;
  shippingCountry: string;
  shipToContactName: string;
  shipToCompanyName: string;
  paymentTermsDays: number;
  currencyCode: string;
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceCustomerChangeHistory = {
  id: string;
  customerId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string;
};

export type GstinLookupResult = {
  gstin: string;
  validFormat: boolean;
  stateCode: string | null;
  stateName: string | null;
  pan: string | null;
  legalName: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  source: 'parsed' | 'customer_master';
  message: string;
};

export type QuoteNextNumberPreview = {
  documentNumber: string;
  quoteDate: string;
  expiryDate: string;
  terms: string;
  notes: string;
};

export type FinanceVendor = {
  id: string;
  displayName: string;
  companyName: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  pan: string | null;
  stateCode: string | null;
  stateName: string | null;
  billingAddress: string;
  paymentTermsDays: number;
  currencyCode: string;
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceOrgGstProfile = {
  id: string;
  organizationId: string;
  label: string;
  gstin: string;
  legalName: string;
  tradeName: string;
  cin: string | null;
  pan: string | null;
  stateCode: string | null;
  stateName: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  logoStoragePath: string | null;
  logoUrl: string | null;
  registrationType: 'regular' | 'composition' | 'unregistered' | null;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceOrgAddress = {
  id: string;
  organizationId: string;
  label: string;
  addressType: 'registered' | 'operating' | 'billing' | 'shipping' | 'factory' | 'other';
  line1: string;
  line2: string;
  city: string;
  stateCode: string | null;
  stateName: string | null;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceOrgOfficer = {
  id: string;
  organizationId: string;
  role: 'ceo' | 'director' | 'other';
  fullName: string;
  designation: string;
  email: string | null;
  phone: string | null;
  din: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceVendorDocumentType =
  | 'income_tax'
  | 'sales_tax_license'
  | 'msme_ssi_license'
  | 'gst_certificate'
  | 'pan_card'
  | 'cancelled_cheque'
  | 'iso_certificate'
  | 'other';

export type FinanceVendorDocument = {
  id: string;
  vendorId: string;
  documentType: FinanceVendorDocumentType;
  fileName: string;
  storagePath: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string | null;
  createdAt: string;
};

export type FinanceVendorPrincipalCustomer = {
  id: string;
  vendorId: string;
  customerNameAddress: string;
  productSupplied: string;
  sortOrder: number;
};

export type FinanceVendorRegistration = {
  id: string;
  displayName: string;
  companyName: string;
  email: string | null;
  phone: string | null;
  telephone: string | null;
  fax: string | null;
  gstin: string | null;
  pan: string | null;
  stateCode: string | null;
  stateName: string | null;
  billingAddress: string;
  registeredAddress: string;
  factoryAddress: string;
  shippingAddress: string;
  paymentTermsDays: number;
  currencyCode: string;
  status: 'active' | 'inactive';
  notes: string;
  establishmentType: string;
  constitution: string;
  yearEstablished: string;
  salesTaxRegNo: string | null;
  factoryLicenseNo: string | null;
  businessProfile: string;
  bankNameAddress: string;
  bankAccountNo: string | null;
  ifsc: string | null;
  micr: string | null;
  creditLimit: number | null;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonMobile: string | null;
  declarationName: string;
  declarationDesignation: string;
  declarationPlace: string;
  declarationDate: string | null;
  vendorSignaturePath: string | null;
  orgGstProfileId: string | null;
  billingAddressId: string | null;
  shippingAddressId: string | null;
  officeInspectedBy: string;
  officeInspectionDate: string | null;
  vendorCode: string | null;
  officeApprovedBy: string;
  officeDecision: 'approved' | 'rejected' | 'pending' | null;
  principalCustomers: FinanceVendorPrincipalCustomer[];
  documents: FinanceVendorDocument[];
  orgGstProfile: FinanceOrgGstProfile | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceVendorPrintPayload = {
  vendor: FinanceVendorRegistration;
  letterhead: FinanceOrgGstProfile | null;
};

export type FinanceSignedUpload = {
  path: string;
  token: string;
  bucket: string;
};

export type FinanceItem = {
  id: string;
  code: string;
  name: string;
  itemType: 'goods' | 'service';
  hsnSac: string | null;
  unit: string;
  saleRate: number;
  purchaseRate: number;
  incomeAccountId: string | null;
  expenseAccountId: string | null;
  taxGroupId: string | null;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type FinanceNumberSeries = {
  id: string;
  documentType: string;
  prefix: string;
  padLength: number;
  nextNumber: number;
  fiscalYearLabel: string;
  resetYearly: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceSetupChecklist = {
  organizationReady: boolean;
  hasTaxGroups: boolean;
  hasAccounts: boolean;
  hasCustomer: boolean;
  hasVendor: boolean;
  hasItem: boolean;
  hasSeries: boolean;
  percentComplete: number;
  steps: { id: string; label: string; done: boolean; href: string }[];
};

/** Finance Phase 1 — procurement */
export type PurchaseIndentLine = {
  id: string;
  itemId?: string | null;
  description: string;
  quantity: number;
  unit?: string;
  estimatedRate: number;
  lineOrder: number;
  amount: number;
};

export type PurchaseIndent = {
  id: string;
  documentNumber: string;
  requestedBy: string;
  requesterName: string | null;
  departmentId: string | null;
  requiredDate: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  purpose: string;
  justification: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'cancelled' | 'converted';
  estimatedTotal: number;
  reviewerId: string | null;
  reviewerComment: string | null;
  decidedAt: string | null;
  lines: PurchaseIndentLine[];
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderLine = {
  id: string;
  itemId?: string | null;
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  taxPercent: number;
  lineOrder: number;
  amount: number;
  taxAmount: number;
  quantityReceived: number;
  quantityBilled: number;
};

export type PurchaseOrder = {
  id: string;
  documentNumber: string;
  vendorId: string;
  vendorName: string | null;
  indentId: string | null;
  rfqId: string | null;
  vendorQuoteId: string | null;
  orderDate: string;
  expectedDelivery: string | null;
  billingAddress: string;
  deliveryAddress: string;
  paymentTermsDays: number;
  notes: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  lines: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
};

export type PurchaseReceiptLine = {
  id: string;
  purchaseOrderLineId: string;
  quantityReceived: number;
  description: string;
};

export type PurchaseReceipt = {
  id: string;
  documentNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string | null;
  receiptDate: string;
  notes: string;
  status: string;
  lines: PurchaseReceiptLine[];
  createdAt: string;
};

export type VendorBillLine = {
  id: string;
  purchaseOrderLineId: string | null;
  itemId: string | null;
  expenseAccountId: string | null;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxPercent: number;
  amount: number;
  taxAmount: number;
  hsnSac?: string;
};

export type VendorBill = {
  id: string;
  documentNumber: string;
  vendorId: string;
  vendorName: string | null;
  purchaseOrderId: string | null;
  receiptId: string | null;
  billDate: string;
  dueDate: string | null;
  vendorInvoiceNumber: string | null;
  notes: string;
  status: string;
  matchStatus: string;
  matchNotes: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  placeOfSupplyState?: string | null;
  isIntraState?: boolean | null;
  tdsSection?: string;
  tdsPercent?: number;
  tdsAmount?: number;
  itcEligibility?: 'eligible' | 'ineligible' | 'claimed' | 'reversed';
  lines: VendorBillLine[];
  createdAt: string;
};

export type VendorPaymentAllocation = {
  billId: string;
  billNumber: string | null;
  amount: number;
};

export type VendorPayment = {
  id: string;
  documentNumber: string;
  vendorId: string;
  vendorName: string | null;
  paymentDate: string;
  amount: number;
  bankAccountId: string | null;
  method: string;
  reference: string;
  notes: string;
  status: string;
  allocations: VendorPaymentAllocation[];
  createdAt: string;
};

export type VendorCredit = {
  id: string;
  documentNumber: string;
  vendorId: string;
  vendorName: string | null;
  billId: string | null;
  creditDate: string;
  reason: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  lines: {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    taxPercent: number;
    amount: number;
    taxAmount: number;
  }[];
  createdAt: string;
};

export type Rfq = {
  id: string;
  documentNumber: string;
  indentId: string | null;
  title: string;
  status: string;
  notes: string;
  vendorIds: string[];
  lines: { id: string; itemId: string | null; description: string; quantity: number; unit: string }[];
  createdAt: string;
};

export type VendorQuote = {
  id: string;
  documentNumber: string;
  rfqId: string;
  vendorId: string;
  vendorName: string | null;
  quoteDate: string;
  deliveryDays: number;
  shippingAmount: number;
  notes: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  lines: {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    taxPercent: number;
    amount: number;
    taxAmount: number;
  }[];
  createdAt: string;
};

export type PurchaseOrderPrint = {
  organization: {
    legalName: string;
    tradeName: string;
    gstin: string | null;
    addressLine1: string;
    city: string;
    stateName: string | null;
    postalCode: string;
  };
  order: PurchaseOrder;
  vendor: {
    displayName: string;
    gstin: string | null;
    billingAddress: string;
    stateName: string | null;
  };
};

export type SalesQuoteLine = {
  id: string;
  itemId?: string | null;
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  taxPercent: number;
  catalogNo?: string;
  hsnSac?: string;
  lineOrder: number;
  amount: number;
  taxAmount: number;
};

export type SalesQuote = {
  id: string;
  documentNumber: string;
  customerId: string;
  customerName: string | null;
  quoteDate: string;
  expiryDate: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted' | 'cancelled';
  notes: string;
  terms: string;
  subject: string;
  referenceText: string;
  placeOfSupply: string;
  orgGstProfileId: string | null;
  billingAddressSnapshot: string;
  shippingAddressSnapshot: string;
  customerGstinSnapshot: string | null;
  shipToName: string;
  versionNumber: number;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  lines: SalesQuoteLine[];
  createdAt: string;
  updatedAt: string;
};

export type SalesQuoteVersion = {
  id: string;
  quoteId: string;
  versionNumber: number;
  changeNote: string;
  snapshot: SalesQuote;
  createdBy: string | null;
  createdAt: string;
};

export type SalesQuoteDetail = SalesQuote & {
  versions: SalesQuoteVersion[];
  letterhead: {
    id: string;
    label: string;
    gstin: string;
    legalName: string;
    tradeName: string;
    cin: string | null;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postalCode: string;
    stateName: string | null;
    logoUrl: string | null;
  } | null;
};

export type SalesOrderLine = {
  id: string;
  itemId?: string | null;
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  taxPercent: number;
  lineOrder: number;
  amount: number;
  taxAmount: number;
  quantityDelivered: number;
  quantityInvoiced: number;
};

export type SalesOrder = {
  id: string;
  documentNumber: string;
  customerId: string;
  customerName: string | null;
  quoteId: string | null;
  orderDate: string;
  expectedDelivery: string | null;
  billingAddress: string;
  shippingAddress: string;
  notes: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  lines: SalesOrderLine[];
  createdAt: string;
  updatedAt: string;
};

export type DeliveryNoteLine = {
  id: string;
  salesOrderLineId: string;
  quantityDelivered: number;
  description: string;
};

export type DeliveryNote = {
  id: string;
  documentNumber: string;
  salesOrderId: string;
  salesOrderNumber: string | null;
  customerId: string;
  customerName: string | null;
  deliveryDate: string;
  notes: string;
  status: string;
  lines: DeliveryNoteLine[];
  createdAt: string;
};

export type InvoiceLine = {
  id: string;
  salesOrderLineId: string | null;
  itemId: string | null;
  incomeAccountId: string | null;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  taxPercent: number;
  amount: number;
  taxAmount: number;
};

export type SalesInvoice = {
  id: string;
  documentNumber: string;
  customerId: string;
  customerName: string | null;
  salesOrderId: string | null;
  deliveryNoteId: string | null;
  quoteId: string | null;
  invoiceDate: string;
  dueDate: string | null;
  notes: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  journalId: string | null;
  lines: InvoiceLine[];
  createdAt: string;
  updatedAt: string;
};

export type CustomerPaymentAllocation = {
  id: string;
  invoiceId: string;
  invoiceNumber: string | null;
  amount: number;
};

export type CustomerPayment = {
  id: string;
  documentNumber: string;
  customerId: string;
  customerName: string | null;
  paymentDate: string;
  amount: number;
  bankAccountId: string | null;
  method: string;
  reference: string;
  notes: string;
  status: string;
  journalId: string | null;
  allocations: CustomerPaymentAllocation[];
  createdAt: string;
};

export type CreditNoteLine = {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  amount: number;
  taxAmount: number;
};

export type CustomerCreditNote = {
  id: string;
  documentNumber: string;
  customerId: string;
  customerName: string | null;
  invoiceId: string | null;
  creditDate: string;
  reason: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  journalId: string | null;
  lines: CreditNoteLine[];
  createdAt: string;
};

export type SalesDocumentPrint = {
  organization: {
    legalName: string;
    tradeName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    stateName?: string | null;
    gstin: string | null;
    cin?: string | null;
    logoUrl?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  customer: {
    displayName: string;
    gstin: string | null;
    billingAddress: string;
    shippingAddress?: string;
    shipToName?: string;
  };
  document: {
    type: 'quote' | 'invoice' | 'delivery_note';
    documentNumber: string;
    date: string;
    expiryDate?: string | null;
    subject?: string;
    referenceText?: string;
    placeOfSupply?: string;
    status: string;
    notes: string;
    terms?: string;
    amountInWords?: string;
    subtotal?: number;
    taxTotal?: number;
    grandTotal?: number;
    lines: Array<{
      description: string;
      quantity: number;
      unit?: string;
      rate?: number;
      taxPercent?: number;
      amount?: number;
      taxAmount?: number;
      catalogNo?: string;
      hsnSac?: string;
    }>;
    einvoice?: {
      irn: string;
      ackNumber: string | null;
      signedQr: string | null;
    } | null;
  };
};

export type ExpenseCategory = {
  id: string;
  name: string;
  expenseAccountId: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

export type DirectExpense = {
  id: string;
  documentNumber: string;
  expenseDate: string;
  categoryId: string | null;
  categoryName: string | null;
  vendorId: string | null;
  vendorName: string | null;
  expenseAccountId: string;
  description: string;
  amount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  paidThrough: 'cash' | 'bank' | 'accounts_payable';
  bankAccountId: string | null;
  vendorInvoiceNumber: string;
  receiptUrl: string;
  notes: string;
  status: 'draft' | 'posted' | 'void';
  journalId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseClaim = {
  id: string;
  documentNumber: string;
  employeeId: string;
  employeeName: string | null;
  departmentId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  expenseAccountId: string | null;
  claimDate: string;
  description: string;
  amount: number;
  taxPercent: number;
  taxAmount: number;
  grandTotal: number;
  vendorName: string;
  billNumber: string;
  receiptUrl: string;
  notes: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed' | 'cancelled';
  reviewerId: string | null;
  reviewerComment: string | null;
  decidedAt: string | null;
  amountReimbursed: number;
  amountDue: number;
  journalId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReimbursementAllocation = {
  id: string;
  claimId: string;
  claimNumber: string | null;
  amount: number;
};

export type ExpenseReimbursement = {
  id: string;
  documentNumber: string;
  employeeId: string;
  employeeName: string | null;
  paymentDate: string;
  amount: number;
  bankAccountId: string | null;
  method: string;
  reference: string;
  notes: string;
  status: 'draft' | 'posted' | 'void';
  journalId: string | null;
  allocations: ReimbursementAllocation[];
  createdAt: string;
};

export type JournalLine = {
  id: string;
  accountId: string;
  accountCode: string | null;
  accountName: string | null;
  description: string;
  debit: number;
  credit: number;
  lineOrder: number;
};

export type JournalEntry = {
  id: string;
  entryNumber: string;
  entryDate: string;
  memo: string;
  sourceType: string;
  sourceId: string | null;
  status: 'draft' | 'posted' | 'reversed';
  reversesJournalId: string | null;
  reversedByJournalId: string | null;
  lines: JournalLine[];
  createdAt: string;
  updatedAt: string;
};

export type LedgerLine = {
  journalId: string;
  entryNumber: string;
  entryDate: string;
  memo: string;
  sourceType: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
};

export type GeneralLedger = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  fromDate: string | null;
  toDate: string | null;
  openingBalance: number;
  lines: LedgerLine[];
  closingBalance: number;
};

export type TrialBalanceRow = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
};

export type TrialBalance = {
  asOfDate: string;
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
};

export type PeriodLock = {
  id: string;
  periodYear: number;
  periodMonth: number;
  lockedAt: string;
  lockedBy: string | null;
  lockedByName: string | null;
  notes: string;
};

export type OpeningBalanceLine = {
  id: string;
  accountId: string;
  accountCode: string | null;
  accountName: string | null;
  debit: number;
  credit: number;
};

export type OpeningBalanceSet = {
  id: string;
  asOfDate: string;
  memo: string;
  status: 'draft' | 'posted' | 'void';
  journalId: string | null;
  lines: OpeningBalanceLine[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
};

export type BankAccount = {
  id: string;
  glAccountId: string;
  glAccountCode: string | null;
  glAccountName: string | null;
  displayName: string;
  accountKind: 'bank' | 'cash';
  bankName: string;
  accountNumberMasked: string;
  currencyCode: string;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type BankTransaction = {
  id: string;
  documentNumber: string;
  bankAccountId: string;
  bankAccountName: string | null;
  transactionDate: string;
  description: string;
  reference: string;
  transactionType: 'credit' | 'debit';
  amount: number;
  source: 'manual' | 'import';
  importBatchId: string | null;
  status: 'unmatched' | 'matched' | 'categorized' | 'excluded';
  matchType: 'customer_payment' | 'vendor_payment' | 'expense' | 'expense_reimbursement' | 'transfer' | null;
  matchId: string | null;
  matchLabel: string | null;
  categoryAccountId: string | null;
  categoryAccountName: string | null;
  journalId: string | null;
  transferBankAccountId: string | null;
  notes: string;
  createdAt: string;
};

export type BankImportBatch = {
  id: string;
  bankAccountId: string;
  filename: string;
  importedAt: string;
  importedBy: string | null;
  rowCount: number;
  notes: string;
};

export type BankMatchCandidate = {
  id: string;
  type: 'customer_payment' | 'vendor_payment' | 'expense' | 'expense_reimbursement';
  documentNumber: string;
  date: string;
  amount: number;
  partyName: string | null;
  label: string;
};

export type BankReconciliationReport = {
  bankAccountId: string;
  bankAccountName: string;
  asOfDate: string;
  statementEndingBalance: number;
  bookEndingBalance: number;
  difference: number;
  matchedCount: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  categorizedCount: number;
  excludedCount: number;
  unmatchedTransactions: BankTransaction[];
};

export type BankReconciliation = {
  id: string;
  bankAccountId: string;
  bankAccountName: string | null;
  statementDate: string;
  statementEndingBalance: number;
  bookEndingBalance: number;
  difference: number;
  unmatchedCount: number;
  unmatchedAmount: number;
  matchedCount: number;
  status: 'draft' | 'completed';
  notes: string;
  completedAt: string | null;
  createdAt: string;
};

export type GstValidationIssue = {
  code: 'missing_party_state' | 'missing_org_state' | 'missing_gstin' | 'missing_hsn';
  message: string;
};

export type GstOutwardRow = {
  documentType: 'invoice' | 'credit_note';
  documentId: string;
  documentNumber: string;
  documentDate: string;
  customerId: string;
  customerName: string | null;
  customerGstin: string | null;
  placeOfSupplyState: string | null;
  isIntraState: boolean;
  supplyType: 'B2B' | 'B2C';
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  grandTotal: number;
  signedTaxableValue: number;
  signedTaxTotal: number;
  issues: GstValidationIssue[];
};

export type GstInwardRow = {
  documentType: 'vendor_bill';
  documentId: string;
  documentNumber: string;
  documentDate: string;
  vendorId: string;
  vendorName: string | null;
  vendorGstin: string | null;
  placeOfSupplyState: string | null;
  isIntraState: boolean;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  grandTotal: number;
  tdsSection: string;
  tdsPercent: number;
  tdsAmount: number;
  itcEligibility: 'eligible' | 'ineligible' | 'claimed' | 'reversed';
  itcAmount: number;
  issues: GstValidationIssue[];
};

export type GstItcRow = {
  billId: string;
  documentNumber: string;
  billDate: string;
  vendorName: string | null;
  vendorGstin: string | null;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  itcEligibility: 'eligible' | 'ineligible' | 'claimed' | 'reversed';
  itcAmount: number;
};

export type GstHsnSummaryRow = {
  hsnSac: string;
  direction: 'outward' | 'inward';
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  lineCount: number;
};

export type GstPeriodSummary = {
  fromDate: string;
  toDate: string;
  outwardTaxable: number;
  outwardTax: number;
  inwardTaxable: number;
  inwardTax: number;
  itcEligible: number;
  itcClaimed: number;
  netGstLiability: number;
  tdsDeducted: number;
};

export type GstWorkbookExport = {
  filename: string;
  contentType: string;
  csv: string;
  rowCount: number;
};

export type TdsDeductionRow = {
  billId: string;
  documentNumber: string;
  billDate: string;
  vendorName: string | null;
  tdsSection: string;
  tdsPercent: number;
  taxableValue: number;
  tdsAmount: number;
  status: string;
};

export type EinvoiceRecord = {
  id: string;
  invoiceId: string;
  invoiceNumber: string | null;
  providerMode: 'sandbox' | 'live';
  status: 'pending' | 'generated' | 'cancelled' | 'failed';
  irn: string | null;
  ackNumber: string | null;
  ackDate: string | null;
  signedQr: string | null;
  irpStatus: string;
  errorCode: string;
  errorMessage: string;
  generatedAt: string | null;
  createdAt: string;
};

export type EwayBillRecord = {
  id: string;
  sourceType: 'invoice' | 'delivery_note';
  sourceId: string;
  sourceNumber: string | null;
  providerMode: 'sandbox' | 'live';
  status: 'pending' | 'generated' | 'cancelled' | 'failed';
  ewbNumber: string | null;
  transporterId: string;
  transporterName: string;
  vehicleNumber: string;
  transportMode: 'road' | 'rail' | 'air' | 'ship';
  distanceKm: number;
  fromPlace: string;
  toPlace: string;
  validUntil: string | null;
  errorMessage: string;
  generatedAt: string | null;
  createdAt: string;
};

export type GstnSyncJob = {
  id: string;
  jobType: 'gstr1_push' | 'gstr2b_pull';
  periodYear: number;
  periodMonth: number;
  providerMode: 'sandbox' | 'live';
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  rowCount: number;
  referenceId: string;
  errorMessage: string;
  createdAt: string;
  finishedAt: string | null;
};

export type IntegrationSettings = {
  id: string;
  gspMode: 'sandbox' | 'live';
  paymentGatewayEnabled: boolean;
  paymentGatewayProvider: 'none' | 'razorpay' | 'stripe';
  bankFeedEnabled: boolean;
  bankFeedProvider: 'none' | 'account_aggregator' | 'manual_api';
  notes: string;
  env: {
    gspMode: 'sandbox' | 'live';
    gspCredentialsConfigured: boolean;
    paymentGatewayConfigured: boolean;
    bankFeedConfigured: boolean;
  };
  updatedAt: string;
};

export type PaymentCheckoutIntent = {
  id: string;
  invoiceId: string;
  invoiceNumber: string | null;
  customerId: string;
  amount: number;
  currencyCode: string;
  provider: string;
  status: 'created' | 'pending' | 'paid' | 'failed' | 'cancelled';
  providerReference: string;
  checkoutUrl: string;
  errorMessage: string;
  createdAt: string;
};

export type ReportDrillRef = {
  entityType: string;
  entityId: string;
  label: string;
  href: string;
};

export type MoneyRow = {
  key: string;
  label: string;
  amount: number;
  drill?: ReportDrillRef | null;
};

export type DashboardTrendPoint = { period: string; label: string; amount: number };

export type FinanceDashboard = {
  fromDate: string;
  toDate: string;
  asOfDate: string;
  receivables: { current: number; overdue: number; total: number };
  payables: { current: number; overdue: number; total: number };
  cashFlow: { inflow: number; outflow: number; net: number };
  incomeVsExpense: { income: number; expense: number; net: number };
  salesTrend: DashboardTrendPoint[];
  priorPeriod: {
    fromDate: string;
    toDate: string;
    receivablesTotal: number;
    payablesTotal: number;
    cashFlowNet: number;
    incomeVsExpenseNet: number;
  };
  attention: Array<{
    id: string;
    kind: string;
    label: string;
    count: number;
    href: string;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    label: string;
    amount: number;
    sourceType: string;
    href: string;
  }>;
  trialBalanceBalanced: boolean;
  trialBalanceTotalDebit: number;
  trialBalanceTotalCredit: number;
};

export type SalesOverview = {
  fromDate: string;
  toDate: string;
  invoicedTotal: number;
  invoicedCount: number;
  paymentsReceived: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  quotesOpen: number;
  ordersOpen: number;
  invoicesDraft: number;
  priorInvoicedTotal: number;
  trend: DashboardTrendPoint[];
  byStatus: Array<{ status: string; count: number; amount: number }>;
  topCustomers: NamedAmountRow[];
};

export type PurchaseOverview = {
  fromDate: string;
  toDate: string;
  billedTotal: number;
  billedCount: number;
  paymentsMade: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  indentsPending: number;
  posOpen: number;
  billsDraft: number;
  priorBilledTotal: number;
  trend: DashboardTrendPoint[];
  byStatus: Array<{ status: string; count: number; amount: number }>;
  topVendors: NamedAmountRow[];
};

export type ReportCatalogItem = {
  pack: string;
  packLabel: string;
  id: string;
  title: string;
  description: string;
  href: string;
};

export type ProfitAndLossReport = {
  fromDate: string;
  toDate: string;
  income: MoneyRow[];
  expenses: MoneyRow[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
};

export type BalanceSheetReport = {
  asOfDate: string;
  assets: MoneyRow[];
  liabilities: MoneyRow[];
  equity: MoneyRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
};

export type CashFlowReport = {
  fromDate: string;
  toDate: string;
  operating: MoneyRow[];
  investing: MoneyRow[];
  financing: MoneyRow[];
  netChange: number;
  openingCash: number;
  closingCash: number;
};

export type NamedAmountRow = {
  id: string;
  name: string;
  amount: number;
  count?: number;
  href?: string;
};

export type AgingBucket = {
  current: number;
  days1to30: number;
  days31to60: number;
  days61plus: number;
  total: number;
};

export type AgingPartyRow = {
  partyId: string;
  partyName: string;
  buckets: AgingBucket;
  href: string;
};

export type AgingReport = {
  asOfDate: string;
  totals: AgingBucket;
  rows: AgingPartyRow[];
};

export type InvoiceDetailRow = {
  id: string;
  documentNumber: string;
  invoiceDate: string;
  customerName: string | null;
  status: string;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  href: string;
};

export type PoStatusRow = {
  id: string;
  documentNumber: string;
  orderDate: string;
  vendorName: string | null;
  status: string;
  grandTotal: number;
  href: string;
};

export type BankingReconSummaryRow = {
  bankAccountId: string;
  bankAccountName: string;
  unmatchedCount: number;
  matchedCount: number;
  categorizedCount: number;
  href: string;
};

export type ActivityRow = {
  id: string;
  createdAt: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  href: string | null;
};

export type TaxSummaryReport = {
  fromDate: string;
  toDate: string;
  outwardTaxable: number;
  outwardTax: number;
  inwardTaxable: number;
  inwardTax: number;
  itcEligible: number;
  itcClaimed: number;
  netGstLiability: number;
  tdsDeducted: number;
  links: Array<{ label: string; href: string }>;
};

