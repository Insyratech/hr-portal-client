'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/api/api';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

export default function SettingsPage() {
  const { data, isError } = useGetSettingsQuery();
  const [updateSettings, { isLoading }] = useUpdateSettingsMutation();
  const [selected, setSelected] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.data.workingDays) {
      setSelected(data.data.workingDays);
    }
  }, [data]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await updateSettings({ workingDays: selected }).unwrap();
      setMessage('Working days saved.');
    } catch {
      setMessage('Unable to save working days.');
    }
  }

  return (
    <>
      <PageHeader kicker="System" title="Settings" />
      {isError ? <p className="mb-4 text-sm">Unable to load settings.</p> : null}
      <form onSubmit={onSubmit} className="max-w-lg space-y-6">
        <fieldset>
          <legend className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">Working days</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DAYS.map((day) => (
              <label key={day} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(day)}
                  onChange={(event) => {
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, day]
                        : current.filter((value) => value !== day),
                    );
                  }}
                />
                {day}
              </label>
            ))}
          </div>
        </fieldset>
        {message ? <p className="text-sm">{message}</p> : null}
        <Button type="submit" disabled={isLoading || selected.length === 0}>
          Save
        </Button>
      </form>
    </>
  );
}
