'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import {
  useGetEmployeesQuery,
  useGetWorkBoardQuery,
  useGetWorkProjectsQuery,
} from '@/store/api/api';

export function CsoEmployeesPage() {
  const { data: employeesData, isFetching, isError } = useGetEmployeesQuery({ status: 'active' });
  const { data: projectsData } = useGetWorkProjectsQuery();
  const { data: boardData } = useGetWorkBoardQuery({});

  const projectsByEmployee = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const project of projectsData?.data ?? []) {
      for (const member of project.members ?? []) {
        const list = map.get(member.employeeId) ?? [];
        list.push(project.code);
        map.set(member.employeeId, list);
      }
    }
    return map;
  }, [projectsData?.data]);

  const boardById = useMemo(() => {
    const map = new Map(
      (boardData?.data.people ?? []).map((person) => [
        person.id,
        {
          todayLabel: person.todayLabel,
          approvalLabel: person.approvalLabel,
          pptLabel: person.pptLabel,
        },
      ]),
    );
    return map;
  }, [boardData?.data.people]);

  const rows = useMemo(
    () =>
      (employeesData?.data ?? []).map((person) => {
        const board = boardById.get(person.id);
        const codes = projectsByEmployee.get(person.id) ?? [];
        return {
          id: person.id,
          employeeCode: person.employeeCode,
          fullName: person.fullName,
          email: person.email,
          departmentName: person.departmentName,
          projectCodes: codes,
          todayLabel: board?.todayLabel ?? 'Not in work loop',
          approvalLabel: board?.approvalLabel ?? '—',
          pptLabel: board?.pptLabel ?? '—',
        };
      }),
    [boardById, employeesData?.data, projectsByEmployee],
  );

  return (
    <>
      <PageHeader kicker="Work" title="Employees" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        All active staff. Open someone to assign projects and review week / priorities / PPT status. You can also
        assign people from Projects.
      </p>
      {isError ? <p className="mb-4 text-sm">Unable to load employees.</p> : null}
      <DataTable
        columns={[
          { id: 'code', header: 'ID', cell: (row) => row.employeeCode },
          {
            id: 'name',
            header: 'Name',
            cell: (row) => (
              <Link href={`/cso/work/employees/${row.id}`} className="hover:underline">
                {row.fullName}
              </Link>
            ),
          },
          { id: 'dept', header: 'Department', cell: (row) => row.departmentName ?? '—' },
          {
            id: 'projects',
            header: 'Projects',
            cell: (row) => (row.projectCodes.length ? row.projectCodes.join(', ') : '—'),
          },
          { id: 'today', header: 'Today', cell: (row) => row.todayLabel },
          { id: 'approval', header: 'Priorities', cell: (row) => row.approvalLabel },
          { id: 'ppt', header: 'Weekly PPT', cell: (row) => row.pptLabel },
        ]}
        rows={rows}
        loading={isFetching}
        emptyTitle="No active employees"
        emptyDescription={isFetching ? 'Fetching the directory.' : 'Ask Super Admin to create accounts.'}
      />
    </>
  );
}
