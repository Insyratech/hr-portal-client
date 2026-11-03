# HR Portal — Web

Next.js app for the 30M Genomics HR / ERP portal. Screens live here. Decisions live in the API.

```
Browser
   │
   ├── Supabase Auth (anon key)     password, session, reset
   │
   └── Next.js 15  (:3000)
            │
            │  Redux Toolkit Query
            │  Authorization: Bearer <access token>
            ▼
       Fastify API  (:3001)          see ../Backend/README.md
            │
            ▼
       Supabase Postgres + Storage
```

The service-role key never ships to this app. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the only Supabase secret in the browser, and it can only sign in.

## How a screen loads

```
Route group  (hr) (gm) (cso) (finance) (inventory) (employee) (super-admin) (scan)
        │
        ▼
layout.tsx  →  role shell (sidebar + top bar)
        │
        ├── isPathAllowed(roles, pathname)?
        │         └── no → home of the highest hat
        ▼
page.tsx  →  feature component in src/features/<segment>
        │
        ▼
useXxxQuery / mutation in src/store/api/api.ts
        │
        ▼
GET/POST /api/v1/...     { success, data, meta }
        │
        ▼
table, form, queue, or empty state
```

`SessionBootstrap` restores the Supabase session, stores the access token, and loads `GET /api/v1/me` (roles and permissions). A password sign-in is asked again after 7 days (`src/lib/session-policy.ts`).

Login destination is the highest hat, unless `?next=` is a safe in-app path:

```
SUPER_ADMIN        →  /super-admin
HR_MANAGER         →  /hr
GENERAL_MANAGER    →  /gm
CSO                →  /cso/work
FINANCE_MANAGER    →  /finance
INVENTORY_MANAGER  →  /inventory
EMPLOYEE           →  /dashboard
```

A person can hold more than one managerial hat. The sidebar then shows one Responsibility block per hat, plus the personal Employee section. Super Admin does not get employee self-service. `/admin/*` bookmarks redirect to the General Manager desk.

Navigation lists: `src/constants/nav.ts`. Role gates: `src/features/auth/role-access.ts`.

## Portals

```
                         ┌──────────────┐
                         │    Login     │
                         └──────┬───────┘
        ┌──────────┬────────┬───┴───┬──────────┬───────────┬────────────┐
        ▼          ▼        ▼       ▼          ▼           ▼            ▼
   Super Admin    HR       GM      CSO      Finance    Inventory    Employee
   accounts     staffing  clock   projects   books       stock       my work
```

### Employee — my work

Bottom nav: Dashboard, Work, Permission, Attendance, More.

```
/dashboard          today’s leave balance, shortcuts
/work               daily note  (needs this week’s priorities APPROVED)
/work/priorities    goals for the org week → project lead
/work/weekly-update weekly PPT (Tue–Mon week, opens Sat 14:00 IST)
/work/jc            Journal Club PPT → General Manager
/work/trends        own history charts
/work/history       past days
/permission         1 hour, start or end of shift, twice a month
/attendance         confirmed month from the biometric import (read-only)
/schedule           own shift
/leave              apply, balances, cancel
/leave/holidays     holiday list
/shift-change       ask for another shift
/payslips           published slips only
/grievance          own cases
/policies           read and acknowledge
/indents            purchase indent
/expense-claims     claim → Finance
/more/profile       profile
/more/password      change password
```

Project lead extras, only when they lead an active project:

```
/work/projects            members, project notes, status
/work/priorities/review   team priorities
/work/team-permissions    leave, shift change, and comp-off waiting on them
```

Members who are not the lead get a read-only `/work/projects`.

HR, GM, CSO, Finance, and Inventory also see My dashboard and My work, except Super Admin. CSO still completes priorities, the daily note, and the PPTs. The other managerial hats skip that personal loop.

### HR — staffing and people decisions

```
/hr                     overview
/hr/employees           company, shift, leave, pay, bank
/hr/companies
/hr/departments
/hr/designations
/hr/leaves              leave queue (after handover and project lead, when those steps exist)
/hr/comp-off            compensatory work queue
/hr/leave-types         which steps each type requires
/hr/holidays
/hr/settings            working days
/hr/shifts              shift catalog and assignments
/hr/permissions         1-hour permission queue
/hr/shift-changes       shift-change queue
/hr/grievances
/hr/salary-slips        published slips (read)
/hr/work                team week (read)
/hr/monthly-report
```

### General Manager — clock, pay, and the weekly files

```
/gm                     overview
/gm/employees           directory read
/gm/attendance          upload the biometric workbook, review flags, confirm the month
/gm/payroll             calculate → review lines → publish
/gm/reports
/gm/permissions         permission status
/gm/shift-changes       shift-change status
/gm/leave-status        who’s out
/gm/holidays
/gm/weekly-updates      weekly PPT inbox (files arrive here directly)
/gm/jc                  Journal Club inbox
/gm/monthly-report
```

### CSO — projects and the work desk

```
/cso/work                   team week
/cso/work/priorities        team priorities
/cso/work/weekly-updates    PPT status (the file itself is in the GM inbox)
/cso/work/jc                team Journal Club status
/cso/work/projects          create projects, set the lead
/cso/work/employees
/cso/work/insights
/cso/work/monthly-report
/cso/shift-changes
```

### Finance — books

```
Sales        /finance/quotes → sales-orders → delivery-notes → invoices
             → payments-received → credit-notes
             customers on /finance/customers

Purchases    /finance/indents → rfqs → purchase-orders → receipts
             → bills → payments → vendor-credits
             vendors on /finance/vendors

Expenses     /finance/expenses, expense-claims, reimbursements

Bank         /finance/banking → transactions → import → reconciliation

GST          /finance/gst/outward, inward, hsn, workbooks, tds
             /finance/integrations   (e-invoice / e-way; sandbox until live keys)

Books        /finance/accounts, journals, ledger, trial-balance
             opening-balances, period-locks, tax, series

Setup        /finance/settings, /finance/items
Reports      /finance/reports
```

### Inventory — stock and QR

```
/inventory                  overview
/inventory/scan             staff scanner
/inventory/receive          new material / chemical / solvent / reagent lot
/inventory/lots             on-hand lots and labels
/inventory/prep             mix a session; completing it creates a lot
/inventory/plastic          boxes
/inventory/stations         station QR labels
/inventory/locations
/inventory/categories
/inventory/catalog
/inventory/authorizations   who may issue
/inventory/alerts
/inventory/reports
```

Public scan does not use the shell. `/scan` and `/scan/[token]` open the lot or station card for a phone camera. Issuing from that card still goes through the API’s public scan route.

### Super Admin — accounts

```
/super-admin                  overview
/super-admin/employees        create the person and the login (Employee only)
/super-admin/employees/:id    assign HR / GM / CSO / Finance / Inventory later
/super-admin/edit-requests    unlock one person so HR can change personal fields
/super-admin/roles            role catalog (assignment happens on the profile)
/super-admin/hr-policies      policy files
/super-admin/inventory        inventory oversight
/super-admin/settings
/super-admin/audit
/super-admin/profile
```

## Flows the screens follow

### Sign in

```
/login
  email + password
        │
        ▼
Supabase signInWithPassword
        │
        ▼
token saved in the auth slice
        │
        ▼
GET /api/v1/me
        │
        ▼
homePathForRoles → that portal’s overview
```

Forgot password sends the API reset mail. `/reset-password` sets the new password through Supabase, then returns to `/login`.

### Leave

```
/leave  →  type, dates, reason
        │
        ├── type wants a handover colleague → pick one
        ├── type wants a project lead and they belong to a led project → pick the project
        └── attachment when the type requires it
        │
        ▼
Waiting row shows the current step
  colleague  →  project lead (/work/team-permissions or /leave/lead)
             →  HR (/hr/leaves)
        │
        ▼
Approved or rejected, with the reviewer’s comment
```

### Permission, shift change, comp-off

```
Permission                         Shift change                      Comp-off
/permission                        /shift-change                     /leave  (comp-off section)
date + start or end of shift       dates + shift + project           holiday / week-off work date
        │                                  │                                  │
        ▼                                  ▼                                  ▼
HR /hr/permissions                 Project lead, then HR             Project lead, then HR,
                                   /hr/shift-changes                 then work-day confirm
        │                                  │                                  │
        ▼                                  ▼                                  ▼
Hour covers that attendance day    Those dates use the new shift     COMP balance credited
```

### Attendance and payroll

```
GM  /gm/attendance
   upload Excel  →  unmatched names and flags  →  confirm month
        │
        ├─ Employee /attendance?period=YYYY-MM   in, out, status
        │
        ▼
GM  /gm/payroll
   calculate  →  adjust a line if needed  →  publish
        │
        ├─ Employee /payslips          own slip, print
        └─ HR /hr/salary-slips         published slips
```

The employee attendance page stays empty until that month is confirmed. A published payroll month cannot be imported again.

### Weekly work

```
/work/priorities
   one or more work goals (skill lines are optional)
        │
        ▼
Project lead  /work/priorities/review
   approve or send back
        │
        ▼
/work
   daily note each working day
        │
        ▼
/work/weekly-update
   PPT between Saturday 14:00 IST and Sunday 23:59 IST
   on time · last hour (Sunday 23:00) · late (Monday of that Tue–Mon week)
        │
        ▼
GM /gm/weekly-updates
   inbox for the week

/work/jc  →  GM /gm/jc
   download or email removes the file from the inbox
```

Monday 16:00 IST is a reminder only. Someone on leave that Monday submits after they are back.

### Purchase indent and expense claim

```
Employee /indents                         Employee /expense-claims
        │                                          │
        ▼                                          ▼
Finance /finance/indents                  Finance /finance/expense-claims
   approve → RFQ → PO → receipt → bill      approve → reimbursement
```

### Inventory issue

```
/inventory/receive  or  /inventory/plastic/receive
        │
        ▼
Print QR
        │
        ├── /inventory/scan     signed-in issue
        └── /scan/[token]       phone camera, no shell
                │
                ▼
        remaining quantity on the lot or station
```

## Layout

| Area | Path |
|---|---|
| Route groups | `src/app/(employee|hr|gm|cso|finance|inventory|super-admin|auth|scan)/` |
| Feature UI | `src/features/<segment>/` |
| All HTTP calls | `src/store/api/api.ts` |
| Shell, sidebar, mobile nav | `src/components/layout/` |
| Nav tables | `src/constants/nav.ts` |
| Role gates | `src/features/auth/role-access.ts` |
| Browser env | `src/lib/env.ts` |
| Supabase browser client | `src/lib/supabase.ts` |

Shared widgets (buttons, dialogs, tables) sit in `src/components/`. A feature folder owns the page behaviour for one segment and is reused by every portal that shows that segment.

## Setup

```bash
cd "HR Portal/Client"
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3000
```

The API must already be running. See [`../Backend/README.md`](../Backend/README.md).

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# optional, for Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

## Verify

```bash
npm run typecheck
npm run lint
npm run test:e2e
```

## What this app does not do

Password checks, leave balances, LOP, payroll math, and QR stock movements are API rules. This app renders the result and sends the form. A new field belongs in `src/store/api/api.ts` and the feature folder together, matching the `/api/v1` contract in the Backend.
