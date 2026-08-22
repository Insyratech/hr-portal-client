import type { PolicyRules } from '@/types/api';

export type LeaveRuleFormDefaults = {
  noticeValue: string;
  noticeUnit: string;
  minimumServiceDays: string;
  maximumConsecutiveDays: string;
  annualAllocation: string;
  carryForward: string;
  requiresApproval: boolean;
  requiresHandover: boolean;
  requiresAttachment: boolean;
  allowHalfDay: boolean;
  allowNegativeBalance: boolean;
  allowMultipleDays: boolean;
  active: boolean;
};

export function latestPolicyRules(policy: { activeVersion?: { rules: PolicyRules } | null; versions: { versionNumber: number; rules: PolicyRules }[] } | null | undefined): PolicyRules | undefined {
  if (!policy) return undefined;
  if (policy.activeVersion?.rules) return policy.activeVersion.rules;
  const newest = [...policy.versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
  return newest?.rules;
}

export function leaveRuleDefaults(
  rules: PolicyRules | undefined,
  flags?: { requiresApproval?: boolean; requiresHandover?: boolean; requiresAttachment?: boolean; allowHalfDay?: boolean; allowMultipleDays?: boolean; active?: boolean },
): LeaveRuleFormDefaults {
  return {
    noticeValue: String(rules?.noticePeriod.value ?? 24),
    noticeUnit: rules?.noticePeriod.unit ?? 'hours',
    minimumServiceDays: String(rules?.minimumServiceDays ?? 0),
    maximumConsecutiveDays: rules?.maximumConsecutiveDays != null ? String(rules.maximumConsecutiveDays) : '',
    annualAllocation: String(rules?.annualAllocation ?? 12),
    carryForward: String(rules?.carryForward ?? 0),
    requiresApproval: flags?.requiresApproval ?? rules?.requiresApproval ?? true,
    requiresHandover: flags?.requiresHandover ?? rules?.requiresHandover ?? false,
    requiresAttachment: flags?.requiresAttachment ?? rules?.requiresAttachment ?? false,
    allowHalfDay: flags?.allowHalfDay ?? rules?.allowHalfDay ?? true,
    allowNegativeBalance: rules?.allowNegativeBalance ?? false,
    allowMultipleDays: flags?.allowMultipleDays ?? true,
    active: flags?.active ?? true,
  };
}

export function rulesFromForm(form: FormData): Record<string, unknown> {
  return {
    notice_period: {
      value: Number(form.get('noticeValue') ?? 0),
      unit: String(form.get('noticeUnit') ?? 'hours'),
    },
    requires_approval: form.get('requiresApproval') === 'on',
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
