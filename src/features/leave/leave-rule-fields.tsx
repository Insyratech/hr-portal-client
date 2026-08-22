import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LeaveRuleFormDefaults } from '@/features/leave/leave-rule-form';

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
          <Input id={id('noticeValue')} name="noticeValue" type="number" min={0} defaultValue={defaults.noticeValue} />
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
            defaultValue={defaults.minimumServiceDays}
          />
        </div>
        <div>
          <Label htmlFor={id('maximumConsecutiveDays')}>Max consecutive days</Label>
          <Input
            id={id('maximumConsecutiveDays')}
            name="maximumConsecutiveDays"
            type="number"
            min={1}
            defaultValue={defaults.maximumConsecutiveDays}
          />
        </div>
        <div>
          <Label htmlFor={id('annualAllocation')}>Days per year</Label>
          <Input
            id={id('annualAllocation')}
            name="annualAllocation"
            type="number"
            min={0}
            defaultValue={defaults.annualAllocation}
            required
          />
        </div>
        <div>
          <Label htmlFor={id('carryForward')}>Carry forward</Label>
          <Input id={id('carryForward')} name="carryForward" type="number" min={0} defaultValue={defaults.carryForward} />
        </div>
      </div>
      <div className="grid gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="requiresApproval" defaultChecked={defaults.requiresApproval} /> Approval required
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
          <input type="checkbox" name="active" defaultChecked={defaults.active} /> Active
        </label>
      </div>
    </>
  );
}
