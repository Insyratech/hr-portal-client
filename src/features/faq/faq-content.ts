import { primaryRoleCode } from '@/features/auth/role-access';

export type FaqQuestion = {
  id: string;
  question: string;
  answer: string;
};

export type FaqCategory = {
  id: string;
  label: string;
  description: string;
  questions: FaqQuestion[];
};

const SHARED_BASICS: FaqCategory = {
  id: 'portal-basics',
  label: 'Portal basics',
  description: 'Sign-in, profile, notifications, and navigation',
  questions: [
    {
      id: 'basics-login',
      question: 'How do I sign in and reset my password?',
      answer:
        'Use your work email on the login page. If you forget your password, use Forgot password to receive a reset link. After signing in, open More → Password to change it while logged in.',
    },
    {
      id: 'basics-profile',
      question: 'Where do I update my profile details?',
      answer:
        'Open More → Profile to review your directory information. Some fields are managed by HR or Super Admin; request changes through Help → Contact if something looks wrong.',
    },
    {
      id: 'basics-notify',
      question: 'How do notifications work?',
      answer:
        'The bell in the top bar lists portal alerts (approvals, leave, work, and more). Unread items stay highlighted until you open them. You can also allow browser push prompts when offered.',
    },
    {
      id: 'basics-nav',
      question: 'Why does my menu look different from a colleague’s?',
      answer:
        'Menus follow your assigned role (Employee, HR, GM, CSO, Finance, or Super Admin). You only see modules you are permitted to use.',
    },
  ],
};

const EMPLOYEE_CATEGORIES: FaqCategory[] = [
  SHARED_BASICS,
  {
    id: 'leave',
    label: 'Leave & attendance',
    description: 'Apply leave, balances, and attendance',
    questions: [
      {
        id: 'leave-apply',
        question: 'How do I apply for leave?',
        answer:
          'Go to Leave → Apply. Choose the leave type, dates, and reason. Submit for project-lead / HR review as configured. Track status on the same Leave screens.',
      },
      {
        id: 'leave-balance',
        question: 'Where can I see my leave balance?',
        answer:
          'Open Leave to view balances by leave type. Allocations and usage update after approvals and payroll-related adjustments.',
      },
      {
        id: 'attendance-me',
        question: 'How do I check my attendance?',
        answer:
          'Open Attendance (or your schedule views) to review day summaries. If a day looks incorrect, contact HR through Help → Contact with the date and concern.',
      },
      {
        id: 'shift-change',
        question: 'How do I request a shift change?',
        answer:
          'Use Shift change to submit a request. Your lead reviews it first; follow the status on the same page.',
      },
    ],
  },
  {
    id: 'work',
    label: 'Work & priorities',
    description: 'Weekly priorities, daily updates, and projects',
    questions: [
      {
        id: 'work-priorities',
        question: 'How do weekly priorities work?',
        answer:
          'Under Work, set weekly priorities and submit them for project lead review. Once a priority is approved, add daily updates against that line — you do not need every priority approved first. Approved leave can pause reminder expectations for those days.',
      },
      {
        id: 'work-projects',
        question: 'Where do I see my projects?',
        answer:
          'Open My projects / Work desk for goals, milestones, and status updates assigned to you. Leads manage membership and milestones from their project desk.',
      },
    ],
  },
  {
    id: 'pay-docs',
    label: 'Payslips & policies',
    description: 'Compensation documents and company policies',
    questions: [
      {
        id: 'payslips',
        question: 'Where are my payslips?',
        answer:
          'Open Payslips to download published slips. If a month is missing, Finance or Super Admin may not have published that run yet—contact Finance through Help if needed.',
      },
      {
        id: 'policies',
        question: 'How do I read and acknowledge policies?',
        answer:
          'Open Policies, read the published version, then acknowledge when required. Pending acknowledgements may appear until you complete them.',
      },
      {
        id: 'grievance',
        question: 'How do I raise a grievance?',
        answer:
          'Use Grievance to create a case, add comments, and attach files. Handlers update status; you can follow progress in the same module.',
      },
      {
        id: 'expense-claim',
        question: 'How do I submit an expense claim?',
        answer:
          'Open Expense claims, create a claim with lines and receipts (URL), then submit for Finance approval. Status stays on that list.',
      },
      {
        id: 'indent',
        question: 'How do purchase indents work for me?',
        answer:
          'Use Indents to raise a purchase need. Procurement / Finance continues the RFQ and PO flow after your indent is accepted into the process.',
      },
    ],
  },
];

const HR_CATEGORIES: FaqCategory[] = [
  SHARED_BASICS,
  {
    id: 'hr-people',
    label: 'People & directory',
    description: 'Employees, onboarding, and profiles',
    questions: [
      {
        id: 'hr-directory',
        question: 'How do I manage the employee directory?',
        answer:
          'From the HR workspace, open Employees to search profiles, review leave/attendance panels, and support onboarding fields. Role assignment rules depend on Super Admin policy.',
      },
      {
        id: 'hr-leave-queue',
        question: 'Where do I review leave applications?',
        answer:
          'Use Leave review queues to approve or reject applications in the configured journey (lead → HR as applicable). Always check balances and overlapping dates before deciding.',
      },
      {
        id: 'hr-attendance',
        question: 'How does attendance import / review work?',
        answer:
          'Attendance imports and day reviews live under Attendance admin tools. Confirm or reject imported batches carefully—confirmed data feeds payroll and reports.',
      },
      {
        id: 'hr-policies',
        question: 'How do I publish policies?',
        answer:
          'Create a policy draft, set the effective version, publish it, then monitor acknowledgements. Employees see only published versions.',
      },
    ],
  },
  {
    id: 'hr-ops',
    label: 'Schedules & grievances',
    description: 'Shifts, holidays, and employee cases',
    questions: [
      {
        id: 'hr-shifts',
        question: 'How do shifts and work weeks work?',
        answer:
          'Define shifts, assign them to employees, and set work-week patterns. These drive schedule views and attendance expectations.',
      },
      {
        id: 'hr-grievance',
        question: 'How do I handle grievances?',
        answer:
          'Open Grievances to assign handlers, change status, comment, and resolve. Keep communication inside the case so history stays auditable.',
      },
    ],
  },
];

const GM_CATEGORIES: FaqCategory[] = [
  SHARED_BASICS,
  {
    id: 'gm-oversight',
    label: 'Approvals & oversight',
    description: 'Leave, work, and operational reviews',
    questions: [
      {
        id: 'gm-leave',
        question: 'How do I see who is out?',
        answer:
          'Open Who’s out (also on the GM overview) to see approved leave covering today and upcoming pending or approved leave. HR Manager approves requests; this view is for coverage only.',
      },
      {
        id: 'gm-work',
        question: 'How do I review weekly work and JC materials?',
        answer:
          'GM Work areas cover weekly PPT shares and JC PPT boards transferred for your review, including download and email actions where enabled.',
      },
      {
        id: 'gm-reports',
        question: 'Where are operational reports?',
        answer:
          'Use Reports / overview dashboards available to GM for attendance and workforce snapshots. Filters follow the period controls on each page.',
      },
    ],
  },
];

const CSO_CATEGORIES: FaqCategory[] = [
  SHARED_BASICS,
  {
    id: 'cso-work',
    label: 'CSO work desk',
    description: 'JC packs, weekly updates, and coordination',
    questions: [
      {
        id: 'cso-jc',
        question: 'How do JC PPT uploads work?',
        answer:
          'On the CSO JC board, upload JC presentations for the required cadence. Transfer to GM when ready so leadership can review from the GM JC board.',
      },
      {
        id: 'cso-weekly',
        question: 'How do weekly update PPTs work for CSO?',
        answer:
          'Use CSO weekly updates to collect and share weekly PPT packs. Status badges show what is pending, shared, or completed for the week.',
      },
      {
        id: 'cso-projects',
        question: 'Can CSO see project progress?',
        answer:
          'CSO work navigation includes project and priority visibility configured for your role. Drill into project desks for milestones and member updates.',
      },
    ],
  },
];

const FINANCE_CATEGORIES: FaqCategory[] = [
  SHARED_BASICS,
  {
    id: 'fin-masters',
    label: 'Setup & masters',
    description: 'Organization, tax, items, and series',
    questions: [
      {
        id: 'fin-settings',
        question: 'Where do I set company GST and addresses?',
        answer:
          'Open Finance → Settings for organization GST registrations, addresses, and officers. Mark defaults carefully—documents pick them up when creating sales/purchase records.',
      },
      {
        id: 'fin-coa',
        question: 'How do chart of accounts and tax groups work?',
        answer:
          'Use Accounts and Tax screens to maintain COA, tax groups/rates, and TDS rates before posting operational documents.',
      },
      {
        id: 'fin-series',
        question: 'What are number series?',
        answer:
          'Number series allocate document numbers (quotes, invoices, POs, etc.). Configure prefixes and next numbers under Series before go-live posting.',
      },
    ],
  },
  {
    id: 'fin-sales-purchase',
    label: 'Sales & purchase',
    description: 'Customers, vendors, quotes, and orders',
    questions: [
      {
        id: 'fin-customer',
        question: 'How do I register a customer with GST?',
        answer:
          'Create a customer and use Look up on GSTIN when available to enrich legal name and address. Complete required steps, then save. Quotes can link the customer afterward.',
      },
      {
        id: 'fin-vendor',
        question: 'How does vendor registration work?',
        answer:
          'Use Vendor registration for compliance documents and profiles, then Vendors for operational purchase counterparts. Print/export when you need a PDF pack.',
      },
      {
        id: 'fin-quote',
        question: 'How do sales quotes work?',
        answer:
          'Create a quote, add lines with tax, and save versions as needed. Convert along the sales path (order → delivery → invoice) according to your process.',
      },
      {
        id: 'fin-indent-po',
        question: 'How do indents become purchase orders?',
        answer:
          'Employee indents feed procurement (RFQ → vendor quote → PO → receipt → bill). Finance manages each stage from the Purchase menus.',
      },
    ],
  },
  {
    id: 'fin-posting',
    label: 'Posting, GST & banking',
    description: 'Expenses, journals, GST workbooks, bank recon',
    questions: [
      {
        id: 'fin-expense',
        question: 'How do expenses and claims post?',
        answer:
          'Direct expenses and approved claims post journals (expense / payable / bank as designed). Reimbursements clear employee payable against bank.',
      },
      {
        id: 'fin-gst',
        question: 'Where are GST reports and workbooks?',
        answer:
          'GST menus cover outward/inward summaries, HSN, ITC views, and workbook exports for the selected period.',
      },
      {
        id: 'fin-bank',
        question: 'How does bank reconciliation work?',
        answer:
          'Import bank transactions, match candidates, and complete reconciliations from Banking. Keep the period consistent with locked books.',
      },
    ],
  },
];

const SA_CATEGORIES: FaqCategory[] = [
  SHARED_BASICS,
  {
    id: 'sa-access',
    label: 'Access & directory',
    description: 'Roles, unlocks, and organization controls',
    questions: [
      {
        id: 'sa-roles',
        question: 'Who can assign roles?',
        answer:
          'Super Admin assigns operational roles (Employee, HR, GM, CSO, Finance, Inventory). Super Admin itself is not assignable through normal profile flows. Prefer least privilege.',
      },
      {
        id: 'sa-directory-edit',
        question: 'How do directory edit unlocks work?',
        answer:
          'Sensitive directory edits may require an approved unlock request. Review pending requests before enabling edits on a profile.',
      },
      {
        id: 'sa-org',
        question: 'Where are companies, departments, and designations?',
        answer:
          'Organization settings cover companies and structure used across HR and Finance masters. Changes affect dropdowns portal-wide.',
      },
    ],
  },
  {
    id: 'sa-ops',
    label: 'Platform operations',
    description: 'Payroll, reports, audit, and work admin',
    questions: [
      {
        id: 'sa-payroll',
        question: 'How is payroll published?',
        answer:
          'Payroll runs are calculated and published from Payroll admin. Employees only see payslips after publish. Confirm attendance imports before final runs.',
      },
      {
        id: 'sa-audit',
        question: 'Where is the audit trail?',
        answer:
          'Audit logs record sensitive actions (including Help contact emails). Use Audit screens when investigating who changed what.',
      },
      {
        id: 'sa-work-admin',
        question: 'How do I administer work priorities?',
        answer:
          'Work admin boards let Super Admin review priorities, approvals, and retention settings across employees and projects.',
      },
    ],
  },
];

const INVENTORY_CATEGORIES: FaqCategory[] = [
  SHARED_BASICS,
  {
    id: 'inv-workspace',
    label: 'Inventory workspace',
    description: 'Overview and what comes next',
    questions: [
      {
        id: 'inv-home',
        question: 'Where do I land after login?',
        answer:
          'As Inventory Manager you open the Inventory workspace at /inventory. Receive measured lots and bought reagents, run Prep for lab-made reagents, receive plastic boxes and print station QR labels, and manage Locations / Catalog / Authorizations (receipt and prep). Scan URLs are public kiosk cards — no login; pick your name and submit. Lot aliquots use the parent QR; plastics use the station picker.',
      },
      {
        id: 'inv-prep',
        question: 'How do lab-made reagents work?',
        answer:
          'Open Prep, choose a Reagents catalog item and target volume, issue Chemicals/Solvents into the session, then Complete to create one parent QR lot. Expense reports use the component costs, not a second reagent purchase. Bought reagents still use Receive with purchase cost.',
      },
      {
        id: 'inv-plastic',
        question: 'How do plastic wares (gloves, tips) work?',
        answer:
          'Receive boxes under Plastic (type, manufacturer, size). Create a Station QR for the stock-room location and print it. Anyone scanning that QR picks item + size + box count. Stock deducts whole boxes only — no per-glove counting.',
      },
      {
        id: 'inv-alerts',
        question: 'How do stock and expiry alerts work?',
        answer:
          'Set reorder qty, velocity days, and expiry lead days on Categories (defaults) or Catalog items. Open Alerts to see what is firing now. A daily job emails Inventory Managers and creates in-app notifications with links to the lot or plastic SKU. The same lot/kind is notified at most once per day.',
      },
      {
        id: 'inv-scan-camera',
        question: 'How do I scan a label without a separate QR app?',
        answer:
          'On a lab phone open /scan (or Inventory → Scan while signed in). Tap Scan with camera, allow camera access, and point at a printed lot or station label. The portal opens the public usage card. No login and no IM usage grant — pick your name and quantity, then submit. Labels also work if the phone camera opens the URL directly.',
      },
      {
        id: 'inv-scan-offline',
        question: 'What if the phone is offline when I submit usage?',
        answer:
          'Usage is not recorded offline. The kiosk shows a clear offline banner and disables Submit. Reconnect to lab Wi‑Fi, refresh the card, and submit again. Do not assume stock was deducted until you see a success message.',
      },
      {
        id: 'inv-reports',
        question: 'Where do I see spend and usage for last month?',
        answer:
          'Open Reports. Choose Last month (or another period) and Run report. You get purchase spend by category/location/item, usage leaderboards, and adjustments. Super Admin has the same figures on System → Inventory. Export Audit CSV from Reports for inventory audit_log rows in a date range.',
      },
      {
        id: 'inv-employee',
        question: 'Can I still use employee self-service?',
        answer:
          'Yes. Use Employee Features in the sidebar for leave, attendance, payslips, and your own work loop. Inventory modules stay under Inventory Responsibility.',
      },
      {
        id: 'inv-contact',
        question: 'Who do I contact for access issues?',
        answer:
          'Ask Super Admin to confirm your Inventory Manager role on your profile. Use Help → Contact to reach HR or Super Admin if login or permissions look wrong.',
      },
    ],
  },
];

const BY_ROLE: Record<string, FaqCategory[]> = {
  EMPLOYEE: EMPLOYEE_CATEGORIES,
  HR_MANAGER: HR_CATEGORIES,
  GENERAL_MANAGER: GM_CATEGORIES,
  CSO: CSO_CATEGORIES,
  FINANCE_MANAGER: FINANCE_CATEGORIES,
  INVENTORY_MANAGER: INVENTORY_CATEGORIES,
  SUPER_ADMIN: SA_CATEGORIES,
};

export function faqCategoriesForRoles(roles: string[]): FaqCategory[] {
  const primary = primaryRoleCode(roles);
  return BY_ROLE[primary] ?? EMPLOYEE_CATEGORIES;
}

export function faqRoleLabel(roles: string[]): string {
  const primary = primaryRoleCode(roles);
  switch (primary) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'HR_MANAGER':
      return 'HR Manager';
    case 'GENERAL_MANAGER':
      return 'General Manager';
    case 'CSO':
      return 'CSO';
    case 'FINANCE_MANAGER':
      return 'Finance Manager';
    case 'INVENTORY_MANAGER':
      return 'Inventory Manager';
    default:
      return 'Employee';
  }
}
