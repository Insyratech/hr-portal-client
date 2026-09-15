'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import {
  FISCAL_YEAR_MONTHS,
  INDIAN_STATES,
  SELECT_CLASS,
  optionalFormString,
  stateFromCode,
} from '@/features/finance/finance-constants';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import { useGetFinanceOrganizationQuery, useUpdateFinanceOrganizationMutation } from '@/store/api/api';

export function FinanceSettingsPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.FINANCE_ORG_MANAGE),
  );
  const { data, isLoading, isError } = useGetFinanceOrganizationQuery(undefined, { skip: !canManage });
  const [updateOrg, { isLoading: saving }] = useUpdateFinanceOrganizationMutation();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const org = data?.data;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    setError(null);
    setSaved(false);
    const form = new FormData(event.currentTarget);
    const { stateCode, stateName } = stateFromCode(String(form.get('stateCode') ?? ''));
    try {
      await updateOrg({
        legalName: String(form.get('legalName') ?? '').trim(),
        tradeName: String(form.get('tradeName') ?? '').trim(),
        gstin: optionalFormString(form.get('gstin')),
        gstRegistered: form.get('gstRegistered') === 'on',
        stateCode,
        stateName,
        addressLine1: String(form.get('addressLine1') ?? '').trim(),
        city: String(form.get('city') ?? '').trim(),
        postalCode: String(form.get('postalCode') ?? '').trim(),
        fiscalYearStartMonth: Number(form.get('fiscalYearStartMonth') ?? 4),
      }).unwrap();
      setSaved(true);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to save organisation profile.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Finance" title="Settings" />
        <p className="max-w-2xl text-sm text-muted">
          You need organisation manage permission to edit the finance profile.
        </p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={saving} />
      <PageHeader kicker="Finance" title="Organisation settings" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Legal name, GST registration, and fiscal year start used for document numbering and tax.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load organisation profile.</p> : null}
      {error ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {saved ? (
        <div className="mb-4">
          <StatusMessage tone="success">Organisation profile saved.</StatusMessage>
        </div>
      ) : null}

      {isLoading || !org ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <form key={org.updatedAt} onSubmit={onSubmit} className="max-w-xl space-y-4">
          <div>
            <Label htmlFor="legalName">Legal name</Label>
            <Input id="legalName" name="legalName" defaultValue={org.legalName} required />
          </div>
          <div>
            <Label htmlFor="tradeName">Trade name</Label>
            <Input id="tradeName" name="tradeName" defaultValue={org.tradeName} />
          </div>
          <div>
            <Label htmlFor="gstin">GSTIN</Label>
            <Input id="gstin" name="gstin" defaultValue={org.gstin ?? ''} placeholder="22AAAAA0000A1Z5" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="gstRegistered"
              defaultChecked={org.gstRegistered}
              className="h-4 w-4 rounded border-border"
            />
            GST registered
          </label>
          <div>
            <Label htmlFor="stateCode">State</Label>
            <select
              id="stateCode"
              name="stateCode"
              className={SELECT_CLASS}
              defaultValue={org.stateCode ?? ''}
              required
            >
              <option value="">Select state</option>
              {INDIAN_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="addressLine1">Address</Label>
            <Input id="addressLine1" name="addressLine1" defaultValue={org.addressLine1} required />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={org.city} required />
          </div>
          <div>
            <Label htmlFor="postalCode">Postal code</Label>
            <Input id="postalCode" name="postalCode" defaultValue={org.postalCode} />
          </div>
          <div>
            <Label htmlFor="fiscalYearStartMonth">Fiscal year start month</Label>
            <select
              id="fiscalYearStartMonth"
              name="fiscalYearStartMonth"
              className={SELECT_CLASS}
              defaultValue={org.fiscalYearStartMonth}
            >
              {FISCAL_YEAR_MONTHS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
