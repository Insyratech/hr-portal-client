'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetWorkSettingsQuery, useUpdateWorkSettingsMutation } from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import type { WorkSettings } from '@/types/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00 IST`;
}

export function WorkRetentionSettings() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.WORK_SETTINGS),
  );
  const { data, isError, isLoading } = useGetWorkSettingsQuery(undefined, { skip: !canManage });
  const [updateSettings, { isLoading: saving }] = useUpdateWorkSettingsMutation();
  const [form, setForm] = useState<Omit<WorkSettings, 'id' | 'timeZone'> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const timeZone = data?.data.timeZone ?? 'Asia/Kolkata';

  useEffect(() => {
    if (!data?.data) return;
    const settings = data.data;
    setForm({
      reminderHour: settings.reminderHour,
      secondReminderHour: settings.secondReminderHour ?? 22,
      retentionDays: settings.retentionDays,
      archiveBeforeDelete: settings.archiveBeforeDelete,
      notifyBeforePurge: settings.notifyBeforePurge,
      purgeNotifyDaysBefore: settings.purgeNotifyDaysBefore,
      legalHold: settings.legalHold,
    });
  }, [data]);

  if (!canManage) {
    return (
      <section className="mt-12 max-w-lg">
        <Meta>Work reminders & retention</Meta>
        <p className="mt-2 text-sm text-muted">Only Super Admin can change reminder times and retention.</p>
      </section>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setMessage(null);
    try {
      await updateSettings({
        reminderHour: form.reminderHour,
        secondReminderHour: form.secondReminderHour ?? 22,
        retentionDays: form.retentionDays,
        archiveBeforeDelete: form.archiveBeforeDelete,
        notifyBeforePurge: form.notifyBeforePurge,
        purgeNotifyDaysBefore: form.purgeNotifyDaysBefore,
        legalHold: form.legalHold,
      }).unwrap();
      setMessage('Work settings saved.');
    } catch {
      setMessage('Unable to save work settings.');
    }
  }

  return (
    <section className="mt-12 max-w-lg space-y-6">
      <div>
        <Meta>Work reminders & retention</Meta>
        <p className="mt-2 text-sm text-muted">
          Reminder hours use {timeZone} (IST). Point cron at the matching local windows. Monday priority reminder
          is fixed at 16:00 IST (reminder only — submitting is not blocked after that hour). Retention is a rolling
          window (90 / 180 / 365 days) — never a calendar wipe.
        </p>
      </div>

      {isError ? <p className="text-sm">Unable to load work settings.</p> : null}
      {isLoading || !form ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="work-reminder-hour">Daily update reminder</Label>
            <select
              id="work-reminder-hour"
              className={selectClass}
              value={form.reminderHour}
              onChange={(event) => setForm({ ...form, reminderHour: Number(event.target.value) })}
            >
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {hourLabel(hour)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">Default 20:00 IST. Cron: POST /api/v1/jobs/work/daily-reminders</p>
          </div>

          <div>
            <Label htmlFor="work-second-hour">Second daily reminder</Label>
            <select
              id="work-second-hour"
              className={selectClass}
              value={form.secondReminderHour ?? 22}
              onChange={(event) => setForm({ ...form, secondReminderHour: Number(event.target.value) })}
            >
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {hourLabel(hour)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">Default 22:00 IST. Same job endpoint — cron must hit this hour too.</p>
          </div>

          <div>
            <Label htmlFor="work-retention">Keep live work data for</Label>
            <select
              id="work-retention"
              className={selectClass}
              value={form.retentionDays}
              onChange={(event) =>
                setForm({ ...form, retentionDays: Number(event.target.value) as WorkSettings['retentionDays'] })
              }
            >
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>365 days</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.archiveBeforeDelete}
              onChange={(event) => setForm({ ...form, archiveBeforeDelete: event.target.checked })}
            />
            Archive before delete
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.notifyBeforePurge}
              onChange={(event) => setForm({ ...form, notifyBeforePurge: event.target.checked })}
            />
            Notify Super Admins before purge
          </label>

          {form.notifyBeforePurge ? (
            <div>
              <Label htmlFor="work-notify-days">Days to wait after notice</Label>
              <Input
                id="work-notify-days"
                type="number"
                min={1}
                max={30}
                value={form.purgeNotifyDaysBefore}
                onChange={(event) => setForm({ ...form, purgeNotifyDaysBefore: Number(event.target.value) })}
              />
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.legalHold}
              onChange={(event) => setForm({ ...form, legalHold: event.target.checked })}
            />
            Legal hold (blocks all work data purge)
          </label>

          {message ? <p className="text-sm">{message}</p> : null}
          <Button type="submit" disabled={saving}>
            Save work settings
          </Button>
        </form>
      )}
    </section>
  );
}
