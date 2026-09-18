import type { PolicyRules } from '@/types/api';

export type LeaveRuleFormDefaults = {
  noticeValue: string;
  noticeUnit: string;
  minimumServiceDays: string;
  maximumConsecutiveDays: string;
  annualAllocation: string;
  carryForward: string;
  requiresPlApproval: boolean;
  requiresHrApproval: boolean;
  requiresHandover: boolean;
  requiresAttachment: boolean;
  allowHalfDay: boolean;
  allowNegativeBalance: boolean;
  allowMultipleDays: boolean;
  active: boolean;
  paid: boolean;
};

export function latestPolicyRules(policy: { activeVersion?: { rules: PolicyRules } | null; versions: { versionNumber: number; rules: PolicyRules }[] } | null | undefined): PolicyRules | undefined {
  if (!policy) return undefined;
  if (policy.activeVersion?.rules) return policy.activeVersion.rules;
  const newest = [...policy.versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
  return newest?.rules;
}

function resolveApprovalDefaults(
  rules: PolicyRules | undefined,
  flags?: {
    requiresApproval?: boolean;
    requiresPlApproval?: boolean;
    requiresHrApproval?: boolean;
  },
): { requiresPlApproval: boolean; requiresHrApproval: boolean } {
  const legacy =
    flags?.requiresApproval ??
    rules?.requiresApproval ??
    true;
  return {
    requiresPlApproval:
      flags?.requiresPlApproval ??
      rules?.requiresPlApproval ??
      legacy,
    requiresHrApproval:
      flags?.requiresHrApproval ??
      rules?.requiresHrApproval ??
      legacy,
  };
}

export function leaveRuleDefaults(
  rules: PolicyRules | undefined,
  flags?: {
    requiresApproval?: boolean;
    requiresPlApproval?: boolean;
    requiresHrApproval?: boolean;
    requiresHandover?: boolean;
    requiresAttachment?: boolean;
    allowHalfDay?: boolean;
    allowMultipleDays?: boolean;
    active?: boolean;
    paid?: boolean;
  },
): LeaveRuleFormDefaults {
  const approval = resolveApprovalDefaults(rules, flags);
  return {
    noticeValue: rules ? String(rules.noticePeriod.value) : '',
    noticeUnit: rules?.noticePeriod.unit ?? 'hours',
    minimumServiceDays: rules ? String(rules.minimumServiceDays) : '',
    maximumConsecutiveDays: rules?.maximumConsecutiveDays != null ? String(rules.maximumConsecutiveDays) : '',
    annualAllocation: rules ? String(rules.annualAllocation) : '',
    carryForward: rules ? String(rules.carryForward) : '',
    requiresPlApproval: approval.requiresPlApproval,
    requiresHrApproval: approval.requiresHrApproval,
    requiresHandover: flags?.requiresHandover ?? rules?.requiresHandover ?? false,
    requiresAttachment: flags?.requiresAttachment ?? rules?.requiresAttachment ?? false,
    allowHalfDay: flags?.allowHalfDay ?? rules?.allowHalfDay ?? true,
    allowNegativeBalance: rules?.allowNegativeBalance ?? false,
    allowMultipleDays: flags?.allowMultipleDays ?? true,
    active: flags?.active ?? true,
    paid: flags?.paid ?? true,
  };
}

export function rulesFromForm(form: FormData): Record<string, unknown> {
  const requiresPlApproval = form.get('requiresPlApproval') === 'on';
  const requiresHrApproval = form.get('requiresHrApproval') === 'on';
  return {
    notice_period: {
      value: Number(form.get('noticeValue') ?? 0),
      unit: String(form.get('noticeUnit') ?? 'hours'),
    },
    requires_approval: requiresPlApproval || requiresHrApproval,
    requires_pl_approval: requiresPlApproval,
    requires_hr_approval: requiresHrApproval,
    requires_handover: form.get('requiresHandover') === 'on',
    requires_attachment: form.get('requiresAttachment') === 'on',
    allow_half_day: form.get('allowHalfDay') === 'on',
    allow_negative_balance: form.get('allowNegativeBalance') === 'on',
    minimum_service_days: Number(form.get('minimumServiceDays') ?? 0),
    maximum_consecutive_days: form.get('maximumConsecutiveDays') ? Number(form.get('maximumConsecutiveDays')) : null,
    annual_allocation: Number(form.get('annualAllocation') ?? 0),
    carry_forward: Number(form.get('carryForward') ?? 0),
  };
}
