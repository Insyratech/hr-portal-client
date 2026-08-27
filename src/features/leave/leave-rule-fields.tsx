import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LeaveRuleFormDefaults } from '@/features/leave/leave-rule-form';

function FieldHint({ children }: { children: string }) {
  return <p className="mt-1 text-xs text-muted">{children}</p>;
}

export function LeaveRuleFields({
  defaults,
  idPrefix = '',
}: {
  defaults: LeaveRuleFormDefaults;
  idPrefix?: string;
}) {
  const id = (name: string) => `${idPrefix}${name}`;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={id('noticeValue')}>Notice</Label>
          <Input
            id={id('noticeValue')}
            name="noticeValue"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="e.g. 24"
            defaultValue={defaults.noticeValue}
            required
          />
          <FieldHint>Minimum time before the leave start date. Enforced by the system (calendar start of the day, not shift clock-in).</FieldHint>
        </div>
        <div>
          <Label htmlFor={id('noticeUnit')}>Notice unit</Label>
          <select
            id={id('noticeUnit')}
            name="noticeUnit"
            className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
            defaultValue={defaults.noticeUnit}
          >
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
        <div>
          <Label htmlFor={id('minimumServiceDays')}>Minimum service days</Label>
          <Input
            id={id('minimumServiceDays')}
            name="minimumServiceDays"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            defaultValue={defaults.minimumServiceDays}
          />
          <FieldHint>Days since joining before this leave can be used. 0 = available from day one.</FieldHint>
        </div>
        <div>
          <Label htmlFor={id('maximumConsecutiveDays')}>Max consecutive days</Label>
          <Input
            id={id('maximumConsecutiveDays')}
            name="maximumConsecutiveDays"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Optional"
            defaultValue={defaults.maximumConsecutiveDays}
          />
          <FieldHint>Max working days in one application. Leave blank for no cap. ML uses 1 (one day per request).</FieldHint>
        </div>
        <div>
          <Label htmlFor={id('annualAllocation')}>Days per year</Label>
          <Input
            id={id('annualAllocation')}
            name="annualAllocation"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="e.g. 12"
            defaultValue={defaults.annualAllocation}
            required
          />
        </div>
        <div>
          <Label htmlFor={id('carryForward')}>Carry forward</Label>
          <Input
            id={id('carryForward')}
            name="carryForward"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            defaultValue={defaults.carryForward}
          />
        </div>
      </div>
      <div className="grid gap-2 text-sm">
        <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="flex items-center gap-2">
            <input type="checkbox" name="requiresApproval" defaultChecked={defaults.requiresApproval} /> Approval required
          </span>
          <span className="text-xs font-normal text-muted">
            Off = auto-approved; HR still gets an awareness mail. On = HR must approve before it counts.
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="requiresHandover" defaultChecked={defaults.requiresHandover} /> Handover required
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="requiresAttachment" defaultChecked={defaults.requiresAttachment} /> Attachment required
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowHalfDay" defaultChecked={defaults.allowHalfDay} /> Allow half day
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowMultipleDays" defaultChecked={defaults.allowMultipleDays} /> Allow multiple days
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="allowNegativeBalance" defaultChecked={defaults.allowNegativeBalance} /> Allow negative
          balance (LOP)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="paid" defaultChecked={defaults.paid} /> Paid (uncheck for LOP)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={defaults.active} /> Active
        </label>
      </div>
    </>
  );
}
