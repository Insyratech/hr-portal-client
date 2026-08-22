'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PERMISSIONS } from '@/types/permissions';
import { useLazyGetEmployeesQuery } from '@/store/api/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCommandPaletteOpen } from '@/store/slices/ui-slice';

export function CommandPalette() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const open = useAppSelector((state) => state.ui.commandPaletteOpen);
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canSearchEmployees =
    permissions.includes(PERMISSIONS.USERS_VIEW) || permissions.includes(PERMISSIONS.USERS_MANAGE);
  const [query, setQuery] = useState('');
  const [search, { data }] = useLazyGetEmployeesQuery();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        dispatch(setCommandPaletteOpen(true));
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  useEffect(() => {
    if (!open || !canSearchEmployees) {
      return;
    }

    const handle = window.setTimeout(() => {
      void search({ q: query.trim() || undefined });
    }, 200);

    return () => window.clearTimeout(handle);
  }, [canSearchEmployees, open, query, search]);

  const employees = data?.data ?? [];
  const results = useMemo(() => employees.slice(0, 8), [employees]);

  return (
    <Dialog open={open} onOpenChange={(next) => dispatch(setCommandPaletteOpen(next))}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Search</DialogTitle>
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Employee name or ID"
          className="mt-4"
        />
        <ul className="mt-4 max-h-64 overflow-y-auto">
          {canSearchEmployees ? (
            results.map((employee) => (
              <li key={employee.id}>
                <Link
                  href={`/admin/employees/${employee.id}`}
                  className="block px-2 py-2 text-sm hover:bg-surface"
                  onClick={() => {
                    dispatch(setCommandPaletteOpen(false));
                    router.push(`/admin/employees/${employee.id}`);
                  }}
                >
                  {employee.fullName}
                  <span className="ml-2 text-muted">{employee.employeeCode}</span>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-2 py-2 text-sm text-muted">Employee search is available to Admin.</li>
          )}
          {canSearchEmployees && results.length === 0 ? (
            <li className="px-2 py-2 text-sm text-muted">No employees match.</li>
          ) : null}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
