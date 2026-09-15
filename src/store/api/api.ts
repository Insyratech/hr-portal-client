import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clientEnv } from '@/lib/env';
import type {
  ApiSuccess,
  AttendanceDaySummary,
  AttendanceImport,
  AttendanceImportDetail,
  AttendanceMe,
  AttendanceReviewCard,
  AttendanceReviewDay,
  AuditLog,
  BankAccount,
  BankImportBatch,
  BankMatchCandidate,
  BankReconciliation,
  BankReconciliationReport,
  BankTransaction,
  ConfirmedPayrollImport,
  CalculatePayrollInput,
  PayrollPreview,
  Company,
  CompanyLogoUpload,
  Compensation,
  DirectoryEditRequest,
  DirectoryEditRequestForEmployee,
  DirectoryEditRequestStatus,
  Employee,
  EmployeePayroll,
  FinanceAccount,
  FinanceCustomer,
  FinanceItem,
  FinanceNumberSeries,
  FinanceOrganization,
  FinanceSetupChecklist,
  FinanceTaxGroup,
  FinanceTaxRate,
  FinanceTdsRate,
  FinanceVendor,
  PurchaseIndent,
  PurchaseOrder,
  PurchaseOrderPrint,
  PurchaseReceipt,
  Rfq,
  SalesDocumentPrint,
  SalesInvoice,
  SalesOrder,
  SalesQuote,
  DeliveryNote,
  CustomerPayment,
  CustomerCreditNote,
  DirectExpense,
  ExpenseCategory,
  ExpenseClaim,
  ExpenseReimbursement,
  GeneralLedger,
  JournalEntry,
  OpeningBalanceSet,
  PeriodLock,
  TrialBalance,
  VendorBill,
  VendorCredit,
  VendorPayment,
  VendorQuote,
  Grievance,
  GrievanceCounts,
  GrievanceDetail,
  GrievanceHandler,
  GrievanceUploadSession,
  HealthData,
  Holiday,
  HrPolicy,
  LeaveApplication,
  LeaveAllocation,
  LeaveBalance,
  LeaveColleague,
  LeaveProjectOption,
  LeavePolicy,
  LeaveType,
  MeData,
  MySchedule,
  NamedEntity,
  OrganizationSettings,
  PaymentDetails,
  PolicyAcknowledgementReport,
  PayrollRun,
  PayrollRunDetail,
  ReportsOverview,
  Role,
  SalarySlip,
  Shift,
  ShiftAssignment,
  WorkWeek,
  WeeklyWorkBoard,
  WorkOverview,
  WorkBoard,
  WorkPrioritiesQueue,
  WorkPrioritiesApproved,
  WorkAnalytics,
  WorkSettings,
  WorkPriority,
  WorkProject,
  EmployeeWorkProjects,
  MyProjectSummary,
  LeadProjectDesk,
  LeadDailyWorkBoard,
  LeadPermissionsBoard,
  ProjectStatusUpdate,
  ProjectUpdateTopic,
  ProjectPlan,
  ProjectGoal,
  ProjectGoalListItem,
  ProjectMilestone,
  ProjectMilestoneListItem,
  MilestoneHistoryEntry,
  WorkProjectMember,
  WorkDayBoard,
  WorkHistoryMonth,
  WeeklyWorkUpdateBoard,
  WeeklyWorkUpdateUploadSession,
  JcPptEmployeeBoard,
  JcPptUploadSession,
  JcPptCsoBoard,
  JcPptGmBoard,
  JcPptConsumeResult,
  JcPptItem,
  WeeklyPptConsumeResult,
  WeeklyPptAdminBoard,
  WeeklyPptGmShares,
  NotificationItem,
  WorkPermission,
  WorkPermissionMine,
  ShiftChangeRequest,
} from '@/types/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: clientEnv.apiUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: { accessToken: string | null } }).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Me',
    'Employees',
    'Companies',
    'Payroll',
    'PayrollRuns',
    'Departments',
    'Designations',
    'Roles',
    'Settings',
    'Audit',
    'LeaveTypes',
    'LeavePolicies',
    'LeaveBalances',
    'LeaveAllocations',
    'LeaveApplications',
    'Holidays',
    'Attendance',
    'AttendanceImports',
    'Shifts',
    'WorkWeeks',
    'MySchedule',
    'Grievances',
    'Policies',
    'Notifications',
    'Reports',
    'WorkPermissions',
    'ShiftChanges',
    'Work',
    'DirectoryEditRequests',
    'FinanceSetup',
    'FinanceOrganization',
    'FinanceAccounts',
    'FinanceTax',
    'FinanceCustomers',
    'FinanceVendors',
    'FinanceItems',
    'FinanceSeries',
    'FinanceIndents',
    'FinanceRfqs',
    'FinanceQuotes',
    'FinancePurchaseOrders',
    'FinanceReceipts',
    'FinanceBills',
    'FinancePayments',
    'FinanceCredits',
    'FinanceSalesQuotes',
    'FinanceSalesOrders',
    'FinanceDeliveryNotes',
    'FinanceInvoices',
    'FinanceCustomerPayments',
    'FinanceCreditNotes',
    'FinanceExpenseCategories',
    'FinanceExpenses',
    'FinanceExpenseClaims',
    'FinanceReimbursements',
    'FinanceJournals',
    'FinanceLedger',
    'FinanceTrialBalance',
    'FinancePeriodLocks',
    'FinanceOpeningBalances',
    'FinanceBankAccounts',
    'FinanceBankTransactions',
    'FinanceBankReconciliations',
  ],
  endpoints: (builder) => ({
    getHealth: builder.query<ApiSuccess<HealthData>, void>({
      query: () => '/health',
    }),
    getMe: builder.query<ApiSuccess<MeData>, void>({
      query: () => '/api/v1/me',
      providesTags: ['Me'],
    }),
    requestPasswordReset: builder.mutation<ApiSuccess<{ sent: true }>, { email: string }>({
      query: (body) => ({
        url: '/api/v1/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    getEmployees: builder.query<ApiSuccess<Employee[]>, { q?: string; status?: 'active' | 'inactive' } | void>({
      query: (arg) => ({
        url: '/api/v1/employees',
        params:
          arg && typeof arg === 'object'
            ? {
                ...(arg.q ? { q: arg.q } : {}),
                ...(arg.status ? { status: arg.status } : {}),
              }
            : undefined,
      }),
      providesTags: ['Employees'],
    }),
    getEmployee: builder.query<ApiSuccess<Employee>, string>({
      query: (id) => `/api/v1/employees/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Employees', id }],
    }),
    createEmployee: builder.mutation<
      ApiSuccess<Employee>,
      {
        employeeCode: string;
        fullName: string;
        email: string;
        phone?: string;
        departmentId?: string;
        designationId?: string;
        joiningDate: string;
        employmentType: Employee['employmentType'];
        password: string;
        emailVerificationToken: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/employees', method: 'POST', body }),
      invalidatesTags: ['Employees', 'Designations', 'Notifications'],
    }),
    sendWorkEmailOtp: builder.mutation<ApiSuccess<{ sent: true }>, { email: string }>({
      query: (body) => ({ url: '/api/v1/employees/email-otp', method: 'POST', body }),
    }),
    verifyWorkEmailOtp: builder.mutation<
      ApiSuccess<{ email: string; emailVerificationToken: string }>,
      { email: string; code: string }
    >({
      query: (body) => ({ url: '/api/v1/employees/email-otp/verify', method: 'POST', body }),
    }),
    updateEmployee: builder.mutation<
      ApiSuccess<Employee>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/employees/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Employees', 'Designations', 'Notifications'],
    }),
    updateEmployeeRoles: builder.mutation<
      ApiSuccess<Employee>,
      { id: string; roleIds: string[] }
    >({
      query: ({ id, roleIds }) => ({
        url: `/api/v1/employees/${id}/roles`,
        method: 'PATCH',
        body: { roleIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Employees', id }, 'Employees', 'Notifications'],
    }),
    updateEmployeeCompany: builder.mutation<
      ApiSuccess<Employee>,
      { id: string; companyId: string }
    >({
      query: ({ id, companyId }) => ({
        url: `/api/v1/employees/${id}/company`,
        method: 'PATCH',
        body: { companyId },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Employees', id }, 'Employees', 'Notifications'],
    }),
    deactivateEmployee: builder.mutation<ApiSuccess<Employee>, string>({
      query: (id) => ({ url: `/api/v1/employees/${id}/deactivate`, method: 'POST' }),
      invalidatesTags: ['Employees', 'Notifications'],
    }),
    activateEmployee: builder.mutation<ApiSuccess<Employee>, string>({
      query: (id) => ({ url: `/api/v1/employees/${id}/activate`, method: 'POST' }),
      invalidatesTags: ['Employees', 'Notifications'],
    }),
    deleteEmployee: builder.mutation<ApiSuccess<{ deleted: boolean }>, string>({
      query: (id) => ({ url: `/api/v1/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Employees', 'Notifications'],
    }),
    getEmployeeAudit: builder.query<ApiSuccess<AuditLog[]>, string>({
      query: (id) => `/api/v1/employees/${id}/audit`,
      providesTags: ['Audit'],
    }),
    getEmployeePayroll: builder.query<ApiSuccess<EmployeePayroll>, string>({
      query: (id) => `/api/v1/employees/${id}/payroll`,
      providesTags: (_result, _error, id) => [{ type: 'Payroll', id }],
    }),
    saveEmployeeCompensation: builder.mutation<
      ApiSuccess<Compensation>,
      { id: string; body: Record<string, number | string> }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/employees/${id}/compensation`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Payroll', id }],
    }),
    saveEmployeePayment: builder.mutation<
      ApiSuccess<PaymentDetails>,
      {
        id: string;
        body: { pan?: string; bankAccountNumber?: string; bankName?: string; ifsc?: string };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/employees/${id}/payment`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Payroll', id }, 'DirectoryEditRequests'],
    }),
    getDirectoryEditRequests: builder.query<
      ApiSuccess<DirectoryEditRequest[]>,
      { status?: DirectoryEditRequestStatus } | void
    >({
      query: (arg) => ({
        url: '/api/v1/directory-edit-requests',
        params: arg && 'status' in arg && arg.status ? { status: arg.status } : undefined,
      }),
      providesTags: ['DirectoryEditRequests'],
    }),
    getDirectoryEditRequestForEmployee: builder.query<ApiSuccess<DirectoryEditRequestForEmployee>, string>({
      query: (employeeId) => `/api/v1/directory-edit-requests/for-employee/${employeeId}`,
      providesTags: (_result, _error, employeeId) => [
        'DirectoryEditRequests',
        { type: 'DirectoryEditRequests', id: employeeId },
      ],
    }),
    createDirectoryEditRequest: builder.mutation<
      ApiSuccess<DirectoryEditRequest>,
      { targetEmployeeId: string; reason: string; fieldHints?: string | null }
    >({
      query: (body) => ({ url: '/api/v1/directory-edit-requests', method: 'POST', body }),
      invalidatesTags: ['DirectoryEditRequests', 'Notifications'],
    }),
    approveDirectoryEditRequest: builder.mutation<
      ApiSuccess<DirectoryEditRequest>,
      { id: string; body?: { note?: string | null; unlockHours?: number } }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/directory-edit-requests/${id}/approve`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['DirectoryEditRequests', 'Notifications', 'Employees'],
    }),
    rejectDirectoryEditRequest: builder.mutation<
      ApiSuccess<DirectoryEditRequest>,
      { id: string; body?: { note?: string | null } }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/directory-edit-requests/${id}/reject`,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['DirectoryEditRequests', 'Notifications'],
    }),
    cancelDirectoryEditRequest: builder.mutation<ApiSuccess<DirectoryEditRequest>, string>({
      query: (id) => ({ url: `/api/v1/directory-edit-requests/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['DirectoryEditRequests', 'Notifications'],
    }),
    fulfillDirectoryEditRequest: builder.mutation<ApiSuccess<DirectoryEditRequest>, string>({
      query: (id) => ({ url: `/api/v1/directory-edit-requests/${id}/fulfill`, method: 'POST' }),
      invalidatesTags: ['DirectoryEditRequests', 'Employees', 'Notifications'],
    }),
    getEmployeeWorkWeek: builder.query<ApiSuccess<WorkWeek[]>, string>({
      query: (id) => `/api/v1/employees/${id}/work-week`,
      providesTags: (_result, _error, id) => [{ type: 'WorkWeeks', id }],
    }),
    saveEmployeeWorkWeek: builder.mutation<
      ApiSuccess<WorkWeek>,
      { id: string; body: { pattern: WorkWeek['pattern']; effectiveFrom: string } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/employees/${id}/work-week`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'WorkWeeks', id }, 'MySchedule'],
    }),
    deleteEmployeeWorkWeek: builder.mutation<ApiSuccess<{ id: string }>, { employeeId: string; weekId: string }>({
      query: ({ employeeId, weekId }) => ({
        url: `/api/v1/employees/${employeeId}/work-week/${weekId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { employeeId }) => [{ type: 'WorkWeeks', id: employeeId }, 'MySchedule'],
    }),
    getCompanies: builder.query<ApiSuccess<Company[]>, void>({
      query: () => '/api/v1/companies',
      providesTags: ['Companies'],
    }),
    createCompany: builder.mutation<ApiSuccess<Company>, { name: string; address: string }>({
      query: (body) => ({ url: '/api/v1/companies', method: 'POST', body }),
      invalidatesTags: ['Companies'],
    }),
    updateCompany: builder.mutation<
      ApiSuccess<Company>,
      { id: string; body: { name?: string; address?: string; status?: 'active' | 'inactive' } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/companies/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Companies', 'Employees'],
    }),
    createCompanyLogo: builder.mutation<
      ApiSuccess<CompanyLogoUpload>,
      { id: string; fileName: string; contentType: string; sizeBytes: number }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/companies/${id}/logo`, method: 'POST', body }),
    }),

    getFinanceSetup: builder.query<ApiSuccess<FinanceSetupChecklist>, void>({
      query: () => '/api/v1/finance/setup',
      providesTags: ['FinanceSetup'],
    }),
    getFinanceOrganization: builder.query<ApiSuccess<FinanceOrganization>, void>({
      query: () => '/api/v1/finance/organization',
      providesTags: ['FinanceOrganization'],
    }),
    updateFinanceOrganization: builder.mutation<
      ApiSuccess<FinanceOrganization>,
      Partial<FinanceOrganization> & { markSetupComplete?: boolean }
    >({
      query: (body) => ({ url: '/api/v1/finance/organization', method: 'PATCH', body }),
      invalidatesTags: ['FinanceOrganization', 'FinanceSetup'],
    }),
    getFinanceAccounts: builder.query<ApiSuccess<FinanceAccount[]>, void>({
      query: () => '/api/v1/finance/accounts',
      providesTags: ['FinanceAccounts'],
    }),
    createFinanceAccount: builder.mutation<
      ApiSuccess<FinanceAccount>,
      { code: string; name: string; accountType: FinanceAccount['accountType']; sortOrder?: number }
    >({
      query: (body) => ({ url: '/api/v1/finance/accounts', method: 'POST', body }),
      invalidatesTags: ['FinanceAccounts', 'FinanceSetup'],
    }),
    updateFinanceAccount: builder.mutation<
      ApiSuccess<FinanceAccount>,
      { id: string; body: { name?: string; isActive?: boolean; sortOrder?: number } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/accounts/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceAccounts'],
    }),
    getFinanceTaxRates: builder.query<ApiSuccess<FinanceTaxRate[]>, void>({
      query: () => '/api/v1/finance/tax-rates',
      providesTags: ['FinanceTax'],
    }),
    getFinanceTaxGroups: builder.query<ApiSuccess<FinanceTaxGroup[]>, void>({
      query: () => '/api/v1/finance/tax-groups',
      providesTags: ['FinanceTax'],
    }),
    getFinanceTdsRates: builder.query<ApiSuccess<FinanceTdsRate[]>, void>({
      query: () => '/api/v1/finance/tds-rates',
      providesTags: ['FinanceTax'],
    }),
    getFinanceCustomers: builder.query<ApiSuccess<FinanceCustomer[]>, void>({
      query: () => '/api/v1/finance/customers',
      providesTags: ['FinanceCustomers'],
    }),
    createFinanceCustomer: builder.mutation<
      ApiSuccess<FinanceCustomer>,
      {
        displayName: string;
        companyName?: string;
        email?: string | null;
        phone?: string | null;
        gstin?: string | null;
        pan?: string | null;
        stateCode?: string | null;
        stateName?: string | null;
        billingAddress?: string;
        shippingAddress?: string;
        paymentTermsDays?: number;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/customers', method: 'POST', body }),
      invalidatesTags: ['FinanceCustomers', 'FinanceSetup'],
    }),
    updateFinanceCustomer: builder.mutation<
      ApiSuccess<FinanceCustomer>,
      { id: string; body: Partial<FinanceCustomer> }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/customers/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceCustomers'],
    }),
    getFinanceVendors: builder.query<ApiSuccess<FinanceVendor[]>, void>({
      query: () => '/api/v1/finance/vendors',
      providesTags: ['FinanceVendors'],
    }),
    createFinanceVendor: builder.mutation<
      ApiSuccess<FinanceVendor>,
      {
        displayName: string;
        companyName?: string;
        email?: string | null;
        phone?: string | null;
        gstin?: string | null;
        pan?: string | null;
        stateCode?: string | null;
        stateName?: string | null;
        billingAddress?: string;
        paymentTermsDays?: number;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/vendors', method: 'POST', body }),
      invalidatesTags: ['FinanceVendors', 'FinanceSetup'],
    }),
    updateFinanceVendor: builder.mutation<
      ApiSuccess<FinanceVendor>,
      { id: string; body: Partial<FinanceVendor> }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/vendors/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceVendors'],
    }),
    getFinanceItems: builder.query<ApiSuccess<FinanceItem[]>, void>({
      query: () => '/api/v1/finance/items',
      providesTags: ['FinanceItems'],
    }),
    createFinanceItem: builder.mutation<
      ApiSuccess<FinanceItem>,
      {
        code: string;
        name: string;
        itemType: 'goods' | 'service';
        hsnSac?: string | null;
        unit?: string;
        saleRate?: number;
        purchaseRate?: number;
        incomeAccountId?: string | null;
        expenseAccountId?: string | null;
        taxGroupId?: string | null;
        description?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/items', method: 'POST', body }),
      invalidatesTags: ['FinanceItems', 'FinanceSetup'],
    }),
    updateFinanceItem: builder.mutation<
      ApiSuccess<FinanceItem>,
      { id: string; body: Partial<FinanceItem> }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/items/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceItems'],
    }),
    getFinanceNumberSeries: builder.query<ApiSuccess<FinanceNumberSeries[]>, void>({
      query: () => '/api/v1/finance/number-series',
      providesTags: ['FinanceSeries'],
    }),
    updateFinanceNumberSeries: builder.mutation<
      ApiSuccess<FinanceNumberSeries>,
      { id: string; body: Partial<Pick<FinanceNumberSeries, 'prefix' | 'padLength' | 'nextNumber' | 'resetYearly'>> }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/number-series/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceSeries'],
    }),

    getFinanceIndents: builder.query<ApiSuccess<PurchaseIndent[]>, void>({
      query: () => '/api/v1/finance/indents',
      providesTags: ['FinanceIndents'],
    }),
    getFinanceIndent: builder.query<ApiSuccess<PurchaseIndent>, string>({
      query: (id) => `/api/v1/finance/indents/${id}`,
      providesTags: ['FinanceIndents'],
    }),
    createFinanceIndent: builder.mutation<
      ApiSuccess<PurchaseIndent>,
      {
        departmentId?: string | null;
        requiredDate?: string | null;
        priority?: PurchaseIndent['priority'];
        purpose: string;
        justification?: string;
        lines: {
          itemId?: string | null;
          description: string;
          quantity: number;
          unit?: string;
          estimatedRate: number;
        }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/indents', method: 'POST', body }),
      invalidatesTags: ['FinanceIndents'],
    }),
    updateFinanceIndent: builder.mutation<
      ApiSuccess<PurchaseIndent>,
      {
        id: string;
        body: {
          departmentId?: string | null;
          requiredDate?: string | null;
          priority?: PurchaseIndent['priority'];
          purpose?: string;
          justification?: string;
          lines?: {
            itemId?: string | null;
            description: string;
            quantity: number;
            unit?: string;
            estimatedRate: number;
          }[];
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/indents/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceIndents'],
    }),
    submitFinanceIndent: builder.mutation<ApiSuccess<PurchaseIndent>, string>({
      query: (id) => ({ url: `/api/v1/finance/indents/${id}/submit`, method: 'POST' }),
      invalidatesTags: ['FinanceIndents'],
    }),
    decideFinanceIndent: builder.mutation<
      ApiSuccess<PurchaseIndent>,
      { id: string; body: { decision: 'approve' | 'reject'; comment?: string } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/indents/${id}/decide`, method: 'POST', body }),
      invalidatesTags: ['FinanceIndents'],
    }),

    getFinanceRfqs: builder.query<ApiSuccess<Rfq[]>, void>({
      query: () => '/api/v1/finance/rfqs',
      providesTags: ['FinanceRfqs'],
    }),
    getFinanceRfq: builder.query<ApiSuccess<Rfq>, string>({
      query: (id) => `/api/v1/finance/rfqs/${id}`,
      providesTags: ['FinanceRfqs'],
    }),
    createFinanceRfqFromIndent: builder.mutation<
      ApiSuccess<Rfq>,
      { indentId: string; vendorIds: string[]; title?: string; notes?: string }
    >({
      query: (body) => ({ url: '/api/v1/finance/rfqs/from-indent', method: 'POST', body }),
      invalidatesTags: ['FinanceRfqs', 'FinanceIndents'],
    }),
    closeFinanceRfq: builder.mutation<ApiSuccess<Rfq>, string>({
      query: (id) => ({ url: `/api/v1/finance/rfqs/${id}/close`, method: 'POST' }),
      invalidatesTags: ['FinanceRfqs', 'FinanceQuotes'],
    }),

    getFinanceRfqQuotes: builder.query<ApiSuccess<VendorQuote[]>, string>({
      query: (rfqId) => `/api/v1/finance/rfqs/${rfqId}/quotes`,
      providesTags: ['FinanceQuotes'],
    }),
    createFinanceVendorQuote: builder.mutation<
      ApiSuccess<VendorQuote>,
      {
        rfqId: string;
        body: {
          vendorId: string;
          quoteDate?: string;
          deliveryDays?: number;
          shippingAmount?: number;
          notes?: string;
          lines: {
            rfqLineId?: string | null;
            description: string;
            quantity: number;
            unit?: string;
            rate: number;
            taxPercent: number;
          }[];
        };
      }
    >({
      query: ({ rfqId, body }) => ({ url: `/api/v1/finance/rfqs/${rfqId}/quotes`, method: 'POST', body }),
      invalidatesTags: ['FinanceQuotes', 'FinanceRfqs'],
    }),
    selectFinanceVendorQuote: builder.mutation<ApiSuccess<VendorQuote>, string>({
      query: (id) => ({ url: `/api/v1/finance/vendor-quotes/${id}/select`, method: 'POST' }),
      invalidatesTags: ['FinanceQuotes', 'FinanceRfqs'],
    }),

    getFinancePurchaseOrders: builder.query<ApiSuccess<PurchaseOrder[]>, void>({
      query: () => '/api/v1/finance/purchase-orders',
      providesTags: ['FinancePurchaseOrders'],
    }),
    getFinancePurchaseOrder: builder.query<ApiSuccess<PurchaseOrder>, string>({
      query: (id) => `/api/v1/finance/purchase-orders/${id}`,
      providesTags: ['FinancePurchaseOrders'],
    }),
    getFinancePurchaseOrderPrint: builder.query<ApiSuccess<PurchaseOrderPrint>, string>({
      query: (id) => `/api/v1/finance/purchase-orders/${id}/print`,
    }),
    createFinancePurchaseOrder: builder.mutation<
      ApiSuccess<PurchaseOrder>,
      {
        vendorId: string;
        indentId?: string | null;
        rfqId?: string | null;
        vendorQuoteId?: string | null;
        orderDate?: string;
        expectedDelivery?: string | null;
        billingAddress?: string;
        deliveryAddress?: string;
        paymentTermsDays?: number;
        notes?: string;
        lines: {
          itemId?: string | null;
          description: string;
          quantity: number;
          unit?: string;
          rate: number;
          taxPercent: number;
        }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/purchase-orders', method: 'POST', body }),
      invalidatesTags: ['FinancePurchaseOrders', 'FinanceIndents'],
    }),
    createFinancePurchaseOrderFromQuote: builder.mutation<
      ApiSuccess<PurchaseOrder>,
      {
        quoteId: string;
        orderDate?: string;
        expectedDelivery?: string | null;
        billingAddress?: string;
        deliveryAddress?: string;
        paymentTermsDays?: number;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/purchase-orders/from-quote', method: 'POST', body }),
      invalidatesTags: ['FinancePurchaseOrders', 'FinanceQuotes', 'FinanceRfqs', 'FinanceIndents'],
    }),
    approveFinancePurchaseOrder: builder.mutation<ApiSuccess<PurchaseOrder>, string>({
      query: (id) => ({ url: `/api/v1/finance/purchase-orders/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['FinancePurchaseOrders'],
    }),
    issueFinancePurchaseOrder: builder.mutation<ApiSuccess<PurchaseOrder>, string>({
      query: (id) => ({ url: `/api/v1/finance/purchase-orders/${id}/issue`, method: 'POST' }),
      invalidatesTags: ['FinancePurchaseOrders'],
    }),

    getFinanceReceipts: builder.query<ApiSuccess<PurchaseReceipt[]>, void>({
      query: () => '/api/v1/finance/receipts',
      providesTags: ['FinanceReceipts'],
    }),
    getFinanceReceipt: builder.query<ApiSuccess<PurchaseReceipt>, string>({
      query: (id) => `/api/v1/finance/receipts/${id}`,
      providesTags: ['FinanceReceipts'],
    }),
    createFinanceReceipt: builder.mutation<
      ApiSuccess<PurchaseReceipt>,
      {
        purchaseOrderId: string;
        receiptDate?: string;
        notes?: string;
        lines: { purchaseOrderLineId: string; quantityReceived: number; description?: string }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/receipts', method: 'POST', body }),
      invalidatesTags: ['FinanceReceipts', 'FinancePurchaseOrders'],
    }),
    postFinanceReceipt: builder.mutation<ApiSuccess<PurchaseReceipt>, string>({
      query: (id) => ({ url: `/api/v1/finance/receipts/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceReceipts', 'FinancePurchaseOrders'],
    }),

    getFinanceBills: builder.query<ApiSuccess<VendorBill[]>, void>({
      query: () => '/api/v1/finance/bills',
      providesTags: ['FinanceBills'],
    }),
    getFinanceBill: builder.query<ApiSuccess<VendorBill>, string>({
      query: (id) => `/api/v1/finance/bills/${id}`,
      providesTags: ['FinanceBills'],
    }),
    createFinanceBill: builder.mutation<
      ApiSuccess<VendorBill>,
      {
        purchaseOrderId: string;
        receiptId?: string | null;
        billDate?: string;
        dueDate?: string | null;
        vendorInvoiceNumber?: string | null;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/bills/from-purchase-order', method: 'POST', body }),
      invalidatesTags: ['FinanceBills', 'FinancePurchaseOrders'],
    }),
    postFinanceBill: builder.mutation<ApiSuccess<VendorBill>, string>({
      query: (id) => ({ url: `/api/v1/finance/bills/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceBills', 'FinancePurchaseOrders'],
    }),

    getFinancePayments: builder.query<ApiSuccess<VendorPayment[]>, void>({
      query: () => '/api/v1/finance/payments',
      providesTags: ['FinancePayments'],
    }),
    getFinancePayment: builder.query<ApiSuccess<VendorPayment>, string>({
      query: (id) => `/api/v1/finance/payments/${id}`,
      providesTags: ['FinancePayments'],
    }),
    createFinancePayment: builder.mutation<
      ApiSuccess<VendorPayment>,
      {
        vendorId: string;
        paymentDate?: string;
        amount: number;
        bankAccountId?: string | null;
        method?: string;
        reference?: string;
        notes?: string;
        allocations: { billId: string; amount: number }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/payments', method: 'POST', body }),
      invalidatesTags: ['FinancePayments', 'FinanceBills'],
    }),
    postFinancePayment: builder.mutation<ApiSuccess<VendorPayment>, string>({
      query: (id) => ({ url: `/api/v1/finance/payments/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinancePayments', 'FinanceBills'],
    }),

    getFinanceVendorCredits: builder.query<ApiSuccess<VendorCredit[]>, void>({
      query: () => '/api/v1/finance/vendor-credits',
      providesTags: ['FinanceCredits'],
    }),
    getFinanceVendorCredit: builder.query<ApiSuccess<VendorCredit>, string>({
      query: (id) => `/api/v1/finance/vendor-credits/${id}`,
      providesTags: ['FinanceCredits'],
    }),
    createFinanceVendorCredit: builder.mutation<
      ApiSuccess<VendorCredit>,
      {
        vendorId: string;
        billId?: string | null;
        creditDate?: string;
        reason?: string;
        lines: { description: string; quantity: number; rate: number; taxPercent: number }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/vendor-credits', method: 'POST', body }),
      invalidatesTags: ['FinanceCredits', 'FinanceBills'],
    }),
    postFinanceVendorCredit: builder.mutation<ApiSuccess<VendorCredit>, string>({
      query: (id) => ({ url: `/api/v1/finance/vendor-credits/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceCredits', 'FinanceBills'],
    }),

    getFinanceSalesQuotes: builder.query<ApiSuccess<SalesQuote[]>, void>({
      query: () => '/api/v1/finance/quotes',
      providesTags: ['FinanceSalesQuotes'],
    }),
    getFinanceSalesQuote: builder.query<ApiSuccess<SalesQuote>, string>({
      query: (id) => `/api/v1/finance/quotes/${id}`,
      providesTags: ['FinanceSalesQuotes'],
    }),
    getFinanceSalesQuotePrint: builder.query<ApiSuccess<SalesDocumentPrint>, string>({
      query: (id) => `/api/v1/finance/quotes/${id}/print`,
    }),
    createFinanceSalesQuote: builder.mutation<
      ApiSuccess<SalesQuote>,
      {
        customerId: string;
        quoteDate?: string;
        expiryDate?: string | null;
        notes?: string;
        terms?: string;
        lines: {
          itemId?: string | null;
          description: string;
          quantity: number;
          unit?: string;
          rate: number;
          taxPercent: number;
        }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/quotes', method: 'POST', body }),
      invalidatesTags: ['FinanceSalesQuotes'],
    }),
    updateFinanceSalesQuote: builder.mutation<
      ApiSuccess<SalesQuote>,
      {
        id: string;
        body: {
          quoteDate?: string;
          expiryDate?: string | null;
          notes?: string;
          terms?: string;
          lines?: {
            itemId?: string | null;
            description: string;
            quantity: number;
            unit?: string;
            rate: number;
            taxPercent: number;
          }[];
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/quotes/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceSalesQuotes'],
    }),
    sendFinanceSalesQuote: builder.mutation<ApiSuccess<SalesQuote>, string>({
      query: (id) => ({ url: `/api/v1/finance/quotes/${id}/send`, method: 'POST' }),
      invalidatesTags: ['FinanceSalesQuotes'],
    }),
    decideFinanceSalesQuote: builder.mutation<
      ApiSuccess<SalesQuote>,
      { id: string; decision: 'accept' | 'decline' }
    >({
      query: ({ id, decision }) => ({
        url: `/api/v1/finance/quotes/${id}/decide`,
        method: 'POST',
        body: { decision },
      }),
      invalidatesTags: ['FinanceSalesQuotes'],
    }),
    expireFinanceSalesQuote: builder.mutation<ApiSuccess<SalesQuote>, string>({
      query: (id) => ({ url: `/api/v1/finance/quotes/${id}/expire`, method: 'POST' }),
      invalidatesTags: ['FinanceSalesQuotes'],
    }),
    convertFinanceSalesQuoteToOrder: builder.mutation<ApiSuccess<SalesOrder>, string>({
      query: (id) => ({ url: `/api/v1/finance/quotes/${id}/convert-to-order`, method: 'POST' }),
      invalidatesTags: ['FinanceSalesQuotes', 'FinanceSalesOrders'],
    }),
    convertFinanceSalesQuoteToInvoice: builder.mutation<ApiSuccess<SalesInvoice>, string>({
      query: (id) => ({ url: `/api/v1/finance/quotes/${id}/convert-to-invoice`, method: 'POST' }),
      invalidatesTags: ['FinanceSalesQuotes', 'FinanceInvoices'],
    }),

    getFinanceSalesOrders: builder.query<ApiSuccess<SalesOrder[]>, void>({
      query: () => '/api/v1/finance/sales-orders',
      providesTags: ['FinanceSalesOrders'],
    }),
    getFinanceSalesOrder: builder.query<ApiSuccess<SalesOrder>, string>({
      query: (id) => `/api/v1/finance/sales-orders/${id}`,
      providesTags: ['FinanceSalesOrders'],
    }),
    createFinanceSalesOrder: builder.mutation<
      ApiSuccess<SalesOrder>,
      {
        customerId: string;
        quoteId?: string | null;
        orderDate?: string;
        expectedDelivery?: string | null;
        billingAddress?: string;
        shippingAddress?: string;
        notes?: string;
        lines: {
          itemId?: string | null;
          description: string;
          quantity: number;
          unit?: string;
          rate: number;
          taxPercent: number;
        }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/sales-orders', method: 'POST', body }),
      invalidatesTags: ['FinanceSalesOrders'],
    }),
    createFinanceSalesOrderFromQuote: builder.mutation<
      ApiSuccess<SalesOrder>,
      {
        quoteId: string;
        orderDate?: string;
        expectedDelivery?: string | null;
        billingAddress?: string;
        shippingAddress?: string;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/sales-orders/from-quote', method: 'POST', body }),
      invalidatesTags: ['FinanceSalesOrders', 'FinanceSalesQuotes'],
    }),
    confirmFinanceSalesOrder: builder.mutation<ApiSuccess<SalesOrder>, string>({
      query: (id) => ({ url: `/api/v1/finance/sales-orders/${id}/confirm`, method: 'POST' }),
      invalidatesTags: ['FinanceSalesOrders'],
    }),

    getFinanceDeliveryNotes: builder.query<ApiSuccess<DeliveryNote[]>, void>({
      query: () => '/api/v1/finance/delivery-notes',
      providesTags: ['FinanceDeliveryNotes'],
    }),
    getFinanceDeliveryNote: builder.query<ApiSuccess<DeliveryNote>, string>({
      query: (id) => `/api/v1/finance/delivery-notes/${id}`,
      providesTags: ['FinanceDeliveryNotes'],
    }),
    getFinanceDeliveryNotePrint: builder.query<ApiSuccess<SalesDocumentPrint>, string>({
      query: (id) => `/api/v1/finance/delivery-notes/${id}/print`,
    }),
    createFinanceDeliveryNoteFromSalesOrder: builder.mutation<
      ApiSuccess<DeliveryNote>,
      {
        salesOrderId: string;
        deliveryDate?: string;
        notes?: string;
        lines: { salesOrderLineId: string; quantityDelivered: number }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/delivery-notes/from-sales-order', method: 'POST', body }),
      invalidatesTags: ['FinanceDeliveryNotes', 'FinanceSalesOrders'],
    }),
    postFinanceDeliveryNote: builder.mutation<ApiSuccess<DeliveryNote>, string>({
      query: (id) => ({ url: `/api/v1/finance/delivery-notes/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceDeliveryNotes', 'FinanceSalesOrders'],
    }),

    getFinanceInvoices: builder.query<ApiSuccess<SalesInvoice[]>, void>({
      query: () => '/api/v1/finance/invoices',
      providesTags: ['FinanceInvoices'],
    }),
    getFinanceInvoice: builder.query<ApiSuccess<SalesInvoice>, string>({
      query: (id) => `/api/v1/finance/invoices/${id}`,
      providesTags: ['FinanceInvoices'],
    }),
    getFinanceInvoicePrint: builder.query<ApiSuccess<SalesDocumentPrint>, string>({
      query: (id) => `/api/v1/finance/invoices/${id}/print`,
    }),
    createFinanceInvoiceFromSalesOrder: builder.mutation<
      ApiSuccess<SalesInvoice>,
      {
        salesOrderId: string;
        deliveryNoteId?: string | null;
        invoiceDate?: string;
        dueDate?: string | null;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/invoices/from-sales-order', method: 'POST', body }),
      invalidatesTags: ['FinanceInvoices', 'FinanceSalesOrders'],
    }),
    createFinanceInvoiceFromQuote: builder.mutation<
      ApiSuccess<SalesInvoice>,
      {
        quoteId: string;
        invoiceDate?: string;
        dueDate?: string | null;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/invoices/from-quote', method: 'POST', body }),
      invalidatesTags: ['FinanceInvoices', 'FinanceSalesQuotes'],
    }),
    sendFinanceInvoice: builder.mutation<ApiSuccess<SalesInvoice>, string>({
      query: (id) => ({ url: `/api/v1/finance/invoices/${id}/send`, method: 'POST' }),
      invalidatesTags: ['FinanceInvoices'],
    }),
    postFinanceInvoice: builder.mutation<ApiSuccess<SalesInvoice>, string>({
      query: (id) => ({ url: `/api/v1/finance/invoices/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceInvoices', 'FinanceSalesOrders'],
    }),

    getFinanceCustomerPayments: builder.query<ApiSuccess<CustomerPayment[]>, void>({
      query: () => '/api/v1/finance/customer-payments',
      providesTags: ['FinanceCustomerPayments'],
    }),
    getFinanceCustomerPayment: builder.query<ApiSuccess<CustomerPayment>, string>({
      query: (id) => `/api/v1/finance/customer-payments/${id}`,
      providesTags: ['FinanceCustomerPayments'],
    }),
    createFinanceCustomerPayment: builder.mutation<
      ApiSuccess<CustomerPayment>,
      {
        customerId: string;
        paymentDate?: string;
        amount: number;
        bankAccountId: string;
        method?: string;
        reference?: string;
        notes?: string;
        allocations: { invoiceId: string; amount: number }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/customer-payments', method: 'POST', body }),
      invalidatesTags: ['FinanceCustomerPayments', 'FinanceInvoices'],
    }),
    postFinanceCustomerPayment: builder.mutation<ApiSuccess<CustomerPayment>, string>({
      query: (id) => ({ url: `/api/v1/finance/customer-payments/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceCustomerPayments', 'FinanceInvoices'],
    }),

    getFinanceCreditNotes: builder.query<ApiSuccess<CustomerCreditNote[]>, void>({
      query: () => '/api/v1/finance/credit-notes',
      providesTags: ['FinanceCreditNotes'],
    }),
    getFinanceCreditNote: builder.query<ApiSuccess<CustomerCreditNote>, string>({
      query: (id) => `/api/v1/finance/credit-notes/${id}`,
      providesTags: ['FinanceCreditNotes'],
    }),
    createFinanceCreditNote: builder.mutation<
      ApiSuccess<CustomerCreditNote>,
      {
        customerId: string;
        invoiceId?: string | null;
        creditDate?: string;
        reason?: string;
        lines: { description: string; quantity: number; rate: number; taxPercent: number }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/credit-notes', method: 'POST', body }),
      invalidatesTags: ['FinanceCreditNotes', 'FinanceInvoices'],
    }),
    postFinanceCreditNote: builder.mutation<ApiSuccess<CustomerCreditNote>, string>({
      query: (id) => ({ url: `/api/v1/finance/credit-notes/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceCreditNotes', 'FinanceInvoices'],
    }),

    getFinanceExpenseCategories: builder.query<ApiSuccess<ExpenseCategory[]>, void>({
      query: () => '/api/v1/finance/expense-categories',
      providesTags: ['FinanceExpenseCategories'],
    }),

    getFinanceExpenses: builder.query<ApiSuccess<DirectExpense[]>, void>({
      query: () => '/api/v1/finance/expenses',
      providesTags: ['FinanceExpenses'],
    }),
    getFinanceExpense: builder.query<ApiSuccess<DirectExpense>, string>({
      query: (id) => `/api/v1/finance/expenses/${id}`,
      providesTags: ['FinanceExpenses'],
    }),
    createFinanceExpense: builder.mutation<
      ApiSuccess<DirectExpense>,
      {
        expenseDate?: string;
        categoryId?: string | null;
        vendorId?: string | null;
        expenseAccountId?: string | null;
        description: string;
        amount: number;
        taxPercent?: number;
        paidThrough: 'cash' | 'bank' | 'accounts_payable';
        bankAccountId?: string | null;
        vendorInvoiceNumber?: string;
        receiptUrl?: string;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/expenses', method: 'POST', body }),
      invalidatesTags: ['FinanceExpenses'],
    }),
    updateFinanceExpense: builder.mutation<
      ApiSuccess<DirectExpense>,
      {
        id: string;
        body: {
          expenseDate?: string;
          categoryId?: string | null;
          vendorId?: string | null;
          expenseAccountId?: string | null;
          description?: string;
          amount?: number;
          taxPercent?: number;
          paidThrough?: 'cash' | 'bank' | 'accounts_payable';
          bankAccountId?: string | null;
          vendorInvoiceNumber?: string;
          receiptUrl?: string;
          notes?: string;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/expenses/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceExpenses'],
    }),
    postFinanceExpense: builder.mutation<ApiSuccess<DirectExpense>, string>({
      query: (id) => ({ url: `/api/v1/finance/expenses/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceExpenses'],
    }),

    getFinanceExpenseClaims: builder.query<ApiSuccess<ExpenseClaim[]>, void>({
      query: () => '/api/v1/finance/expense-claims',
      providesTags: ['FinanceExpenseClaims'],
    }),
    getFinanceExpenseClaim: builder.query<ApiSuccess<ExpenseClaim>, string>({
      query: (id) => `/api/v1/finance/expense-claims/${id}`,
      providesTags: ['FinanceExpenseClaims'],
    }),
    createFinanceExpenseClaim: builder.mutation<
      ApiSuccess<ExpenseClaim>,
      {
        categoryId?: string | null;
        claimDate?: string;
        description: string;
        amount: number;
        taxPercent?: number;
        vendorName?: string;
        billNumber?: string;
        receiptUrl?: string;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/expense-claims', method: 'POST', body }),
      invalidatesTags: ['FinanceExpenseClaims'],
    }),
    updateFinanceExpenseClaim: builder.mutation<
      ApiSuccess<ExpenseClaim>,
      {
        id: string;
        body: {
          categoryId?: string | null;
          claimDate?: string;
          description?: string;
          amount?: number;
          taxPercent?: number;
          vendorName?: string;
          billNumber?: string;
          receiptUrl?: string;
          notes?: string;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/expense-claims/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceExpenseClaims'],
    }),
    submitFinanceExpenseClaim: builder.mutation<ApiSuccess<ExpenseClaim>, string>({
      query: (id) => ({ url: `/api/v1/finance/expense-claims/${id}/submit`, method: 'POST' }),
      invalidatesTags: ['FinanceExpenseClaims'],
    }),
    decideFinanceExpenseClaim: builder.mutation<
      ApiSuccess<ExpenseClaim>,
      { id: string; body: { decision: 'approve' | 'reject'; comment?: string } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/expense-claims/${id}/decide`, method: 'POST', body }),
      invalidatesTags: ['FinanceExpenseClaims'],
    }),
    cancelFinanceExpenseClaim: builder.mutation<ApiSuccess<ExpenseClaim>, string>({
      query: (id) => ({ url: `/api/v1/finance/expense-claims/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['FinanceExpenseClaims'],
    }),

    getFinanceExpenseReimbursements: builder.query<ApiSuccess<ExpenseReimbursement[]>, void>({
      query: () => '/api/v1/finance/expense-reimbursements',
      providesTags: ['FinanceReimbursements'],
    }),
    getFinanceExpenseReimbursement: builder.query<ApiSuccess<ExpenseReimbursement>, string>({
      query: (id) => `/api/v1/finance/expense-reimbursements/${id}`,
      providesTags: ['FinanceReimbursements'],
    }),
    createFinanceExpenseReimbursement: builder.mutation<
      ApiSuccess<ExpenseReimbursement>,
      {
        employeeId: string;
        paymentDate?: string;
        amount: number;
        bankAccountId: string;
        method?: string;
        reference?: string;
        notes?: string;
        allocations: { claimId: string; amount: number }[];
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/expense-reimbursements', method: 'POST', body }),
      invalidatesTags: ['FinanceReimbursements', 'FinanceExpenseClaims'],
    }),
    postFinanceExpenseReimbursement: builder.mutation<ApiSuccess<ExpenseReimbursement>, string>({
      query: (id) => ({ url: `/api/v1/finance/expense-reimbursements/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceReimbursements', 'FinanceExpenseClaims'],
    }),

    getFinanceJournals: builder.query<
      ApiSuccess<JournalEntry[]>,
      { fromDate?: string; toDate?: string; status?: 'draft' | 'posted' | 'reversed' } | void
    >({
      query: (arg) => ({
        url: '/api/v1/finance/journals',
        params: arg
          ? {
              ...(arg.fromDate ? { fromDate: arg.fromDate } : {}),
              ...(arg.toDate ? { toDate: arg.toDate } : {}),
              ...(arg.status ? { status: arg.status } : {}),
            }
          : undefined,
      }),
      providesTags: ['FinanceJournals'],
    }),
    getFinanceJournal: builder.query<ApiSuccess<JournalEntry>, string>({
      query: (id) => `/api/v1/finance/journals/${id}`,
      providesTags: ['FinanceJournals'],
    }),
    createFinanceJournal: builder.mutation<
      ApiSuccess<JournalEntry>,
      {
        entryDate: string;
        memo?: string;
        lines: Array<{ accountId: string; description?: string; debit: number; credit: number }>;
        post?: boolean;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/journals', method: 'POST', body }),
      invalidatesTags: ['FinanceJournals', 'FinanceLedger', 'FinanceTrialBalance'],
    }),
    updateFinanceJournal: builder.mutation<
      ApiSuccess<JournalEntry>,
      {
        id: string;
        body: {
          entryDate?: string;
          memo?: string;
          lines?: Array<{ accountId: string; description?: string; debit: number; credit: number }>;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/journals/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceJournals', 'FinanceLedger', 'FinanceTrialBalance'],
    }),
    postFinanceJournal: builder.mutation<ApiSuccess<JournalEntry>, string>({
      query: (id) => ({ url: `/api/v1/finance/journals/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceJournals', 'FinanceLedger', 'FinanceTrialBalance'],
    }),
    reverseFinanceJournal: builder.mutation<ApiSuccess<JournalEntry>, string>({
      query: (id) => ({ url: `/api/v1/finance/journals/${id}/reverse`, method: 'POST' }),
      invalidatesTags: ['FinanceJournals', 'FinanceLedger', 'FinanceTrialBalance'],
    }),

    getFinanceLedger: builder.query<
      ApiSuccess<GeneralLedger>,
      { accountId: string; fromDate?: string; toDate?: string }
    >({
      query: ({ accountId, fromDate, toDate }) => ({
        url: '/api/v1/finance/ledger',
        params: {
          accountId,
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
      }),
      providesTags: ['FinanceLedger'],
    }),
    getFinanceTrialBalance: builder.query<ApiSuccess<TrialBalance>, { asOfDate: string }>({
      query: ({ asOfDate }) => ({
        url: '/api/v1/finance/trial-balance',
        params: { asOfDate },
      }),
      providesTags: ['FinanceTrialBalance'],
    }),

    getFinancePeriodLocks: builder.query<ApiSuccess<PeriodLock[]>, void>({
      query: () => '/api/v1/finance/period-locks',
      providesTags: ['FinancePeriodLocks'],
    }),
    lockFinancePeriod: builder.mutation<
      ApiSuccess<PeriodLock>,
      { periodYear: number; periodMonth: number; notes?: string }
    >({
      query: (body) => ({ url: '/api/v1/finance/period-locks', method: 'POST', body }),
      invalidatesTags: ['FinancePeriodLocks'],
    }),
    unlockFinancePeriod: builder.mutation<
      ApiSuccess<{ unlocked: true }>,
      { periodYear: number; periodMonth: number }
    >({
      query: ({ periodYear, periodMonth }) => ({
        url: `/api/v1/finance/period-locks/${periodYear}/${periodMonth}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FinancePeriodLocks'],
    }),

    getFinanceOpeningBalances: builder.query<ApiSuccess<OpeningBalanceSet[]>, void>({
      query: () => '/api/v1/finance/opening-balances',
      providesTags: ['FinanceOpeningBalances'],
    }),
    getFinanceOpeningBalance: builder.query<ApiSuccess<OpeningBalanceSet>, string>({
      query: (id) => `/api/v1/finance/opening-balances/${id}`,
      providesTags: ['FinanceOpeningBalances'],
    }),
    createFinanceOpeningBalance: builder.mutation<
      ApiSuccess<OpeningBalanceSet>,
      {
        asOfDate: string;
        memo?: string;
        lines: Array<{ accountId: string; debit: number; credit: number }>;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/opening-balances', method: 'POST', body }),
      invalidatesTags: ['FinanceOpeningBalances'],
    }),
    updateFinanceOpeningBalance: builder.mutation<
      ApiSuccess<OpeningBalanceSet>,
      {
        id: string;
        body: {
          asOfDate?: string;
          memo?: string;
          lines?: Array<{ accountId: string; debit: number; credit: number }>;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/opening-balances/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceOpeningBalances'],
    }),
    postFinanceOpeningBalance: builder.mutation<ApiSuccess<OpeningBalanceSet>, string>({
      query: (id) => ({ url: `/api/v1/finance/opening-balances/${id}/post`, method: 'POST' }),
      invalidatesTags: ['FinanceOpeningBalances', 'FinanceJournals', 'FinanceLedger', 'FinanceTrialBalance'],
    }),

    getFinanceBankAccounts: builder.query<ApiSuccess<BankAccount[]>, void>({
      query: () => '/api/v1/finance/bank-accounts',
      providesTags: ['FinanceBankAccounts'],
    }),
    getFinanceBankAccount: builder.query<ApiSuccess<BankAccount>, string>({
      query: (id) => `/api/v1/finance/bank-accounts/${id}`,
      providesTags: ['FinanceBankAccounts'],
    }),
    createFinanceBankAccount: builder.mutation<
      ApiSuccess<BankAccount>,
      {
        glAccountId: string;
        displayName: string;
        accountKind: 'bank' | 'cash';
        bankName?: string;
        accountNumberMasked?: string;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/bank-accounts', method: 'POST', body }),
      invalidatesTags: ['FinanceBankAccounts'],
    }),
    updateFinanceBankAccount: builder.mutation<
      ApiSuccess<BankAccount>,
      {
        id: string;
        body: {
          displayName?: string;
          accountKind?: 'bank' | 'cash';
          bankName?: string;
          accountNumberMasked?: string;
          notes?: string;
          isActive?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/finance/bank-accounts/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['FinanceBankAccounts'],
    }),

    getFinanceBankTransactions: builder.query<
      ApiSuccess<BankTransaction[]>,
      {
        bankAccountId?: string;
        status?: 'unmatched' | 'matched' | 'categorized' | 'excluded';
        fromDate?: string;
        toDate?: string;
      } | void
    >({
      query: (arg) => ({
        url: '/api/v1/finance/bank-transactions',
        params:
          arg && typeof arg === 'object'
            ? {
                ...(arg.bankAccountId ? { bankAccountId: arg.bankAccountId } : {}),
                ...(arg.status ? { status: arg.status } : {}),
                ...(arg.fromDate ? { fromDate: arg.fromDate } : {}),
                ...(arg.toDate ? { toDate: arg.toDate } : {}),
              }
            : undefined,
      }),
      providesTags: ['FinanceBankTransactions'],
    }),
    getFinanceBankTransaction: builder.query<ApiSuccess<BankTransaction>, string>({
      query: (id) => `/api/v1/finance/bank-transactions/${id}`,
      providesTags: ['FinanceBankTransactions'],
    }),
    createFinanceBankTransaction: builder.mutation<
      ApiSuccess<BankTransaction>,
      {
        bankAccountId: string;
        transactionDate: string;
        description?: string;
        reference?: string;
        transactionType: 'credit' | 'debit';
        amount: number;
        notes?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/bank-transactions', method: 'POST', body }),
      invalidatesTags: ['FinanceBankTransactions', 'FinanceBankReconciliations'],
    }),
    matchFinanceBankTransaction: builder.mutation<
      ApiSuccess<BankTransaction>,
      {
        id: string;
        body: {
          matchType:
            | 'customer_payment'
            | 'vendor_payment'
            | 'expense'
            | 'expense_reimbursement'
            | 'transfer';
          matchId?: string;
          transferBankAccountId?: string;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/finance/bank-transactions/${id}/match`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceBankTransactions', 'FinanceBankReconciliations'],
    }),
    unmatchFinanceBankTransaction: builder.mutation<ApiSuccess<BankTransaction>, string>({
      query: (id) => ({ url: `/api/v1/finance/bank-transactions/${id}/unmatch`, method: 'POST' }),
      invalidatesTags: ['FinanceBankTransactions', 'FinanceBankReconciliations'],
    }),
    categorizeFinanceBankTransaction: builder.mutation<
      ApiSuccess<BankTransaction>,
      { id: string; body: { categoryAccountId: string } }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/finance/bank-transactions/${id}/categorize`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FinanceBankTransactions', 'FinanceBankReconciliations', 'FinanceJournals', 'FinanceLedger'],
    }),
    excludeFinanceBankTransaction: builder.mutation<ApiSuccess<BankTransaction>, string>({
      query: (id) => ({ url: `/api/v1/finance/bank-transactions/${id}/exclude`, method: 'POST' }),
      invalidatesTags: ['FinanceBankTransactions', 'FinanceBankReconciliations'],
    }),
    unexcludeFinanceBankTransaction: builder.mutation<ApiSuccess<BankTransaction>, string>({
      query: (id) => ({ url: `/api/v1/finance/bank-transactions/${id}/unexclude`, method: 'POST' }),
      invalidatesTags: ['FinanceBankTransactions', 'FinanceBankReconciliations'],
    }),
    getFinanceBankMatchCandidates: builder.query<
      ApiSuccess<BankMatchCandidate[]>,
      { id: string; bankAccountId?: string }
    >({
      query: ({ id, bankAccountId }) => ({
        url: `/api/v1/finance/bank-transactions/${id}/match-candidates`,
        params: bankAccountId ? { bankAccountId } : undefined,
      }),
    }),
    importFinanceBankStatement: builder.mutation<
      ApiSuccess<{ batch: BankImportBatch; createdCount: number }>,
      { bankAccountId: string; filename?: string; csvText: string }
    >({
      query: (body) => ({ url: '/api/v1/finance/bank-imports', method: 'POST', body }),
      invalidatesTags: ['FinanceBankTransactions', 'FinanceBankReconciliations'],
    }),
    getFinanceBankReconciliationReport: builder.query<
      ApiSuccess<BankReconciliationReport>,
      { bankAccountId: string; asOfDate: string; statementEndingBalance: number }
    >({
      query: ({ bankAccountId, asOfDate, statementEndingBalance }) => ({
        url: '/api/v1/finance/bank-reconciliation',
        params: { bankAccountId, asOfDate, statementEndingBalance },
      }),
      providesTags: ['FinanceBankReconciliations'],
    }),
    getFinanceBankReconciliations: builder.query<ApiSuccess<BankReconciliation[]>, void>({
      query: () => '/api/v1/finance/bank-reconciliations',
      providesTags: ['FinanceBankReconciliations'],
    }),
    saveFinanceBankReconciliation: builder.mutation<
      ApiSuccess<BankReconciliation>,
      {
        bankAccountId: string;
        statementDate: string;
        statementEndingBalance: number;
        notes?: string;
        complete?: boolean;
      }
    >({
      query: (body) => ({ url: '/api/v1/finance/bank-reconciliations', method: 'POST', body }),
      invalidatesTags: ['FinanceBankReconciliations'],
    }),

    getDepartments: builder.query<ApiSuccess<NamedEntity[]>, void>({
      query: () => '/api/v1/departments',
      providesTags: ['Departments'],
    }),
    createDepartment: builder.mutation<ApiSuccess<NamedEntity>, { name: string; code: string }>({
      query: (body) => ({ url: '/api/v1/departments', method: 'POST', body }),
      invalidatesTags: ['Departments'],
    }),
    getDesignations: builder.query<ApiSuccess<NamedEntity[]>, void>({
      query: () => '/api/v1/designations',
      providesTags: ['Designations'],
    }),
    createDesignation: builder.mutation<ApiSuccess<NamedEntity>, { name: string; code: string }>({
      query: (body) => ({ url: '/api/v1/designations', method: 'POST', body }),
      invalidatesTags: ['Designations'],
    }),
    getRoles: builder.query<ApiSuccess<Role[]>, void>({
      query: () => '/api/v1/roles',
      providesTags: ['Roles'],
    }),
    getSettings: builder.query<ApiSuccess<OrganizationSettings>, void>({
      query: () => '/api/v1/organization/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation<ApiSuccess<OrganizationSettings>, { workingDays: string[] }>({
      query: (body) => ({ url: '/api/v1/organization/settings', method: 'PATCH', body }),
      invalidatesTags: ['Settings'],
    }),
    getAuditLogs: builder.query<ApiSuccess<AuditLog[]>, void>({
      query: () => '/api/v1/audit-logs',
      providesTags: ['Audit'],
    }),
    getLeaveTypes: builder.query<ApiSuccess<LeaveType[]>, void>({
      query: () => '/api/v1/leave-types',
      providesTags: ['LeaveTypes'],
    }),
    createLeaveType: builder.mutation<
      ApiSuccess<LeaveType>,
      {
        name: string;
        code: string;
        description?: string;
        requiresApproval?: boolean;
        requiresHandover?: boolean;
        requiresAttachment?: boolean;
        allowHalfDay?: boolean;
        allowMultipleDays?: boolean;
        paid?: boolean;
        rules?: Record<string, unknown>;
      }
    >({
      query: (body) => ({ url: '/api/v1/leave-types', method: 'POST', body }),
      invalidatesTags: ['LeaveTypes', 'LeavePolicies'],
    }),
    getLeavePolicies: builder.query<ApiSuccess<LeavePolicy[]>, void>({
      query: () => '/api/v1/leave-policies',
      providesTags: ['LeavePolicies'],
    }),
    createLeavePolicy: builder.mutation<
      ApiSuccess<LeavePolicy>,
      { name: string; leaveTypeId: string; rules: Record<string, unknown> }
    >({
      query: (body) => ({ url: '/api/v1/leave-policies', method: 'POST', body }),
      invalidatesTags: ['LeavePolicies'],
    }),
    publishLeavePolicy: builder.mutation<ApiSuccess<LeavePolicy>, string>({
      query: (id) => ({ url: `/api/v1/leave-policies/${id}/publish`, method: 'POST' }),
      invalidatesTags: ['LeavePolicies'],
    }),
    addLeavePolicyVersion: builder.mutation<
      ApiSuccess<LeavePolicy>,
      { id: string; rules: Record<string, unknown> }
    >({
      query: ({ id, rules }) => ({ url: `/api/v1/leave-policies/${id}/versions`, method: 'POST', body: { rules } }),
      invalidatesTags: ['LeavePolicies'],
    }),
    getLeaveBalances: builder.query<ApiSuccess<LeaveBalance[]>, void>({
      query: () => '/api/v1/leaves/balance',
      providesTags: ['LeaveBalances'],
    }),
    getLeaveAllocations: builder.query<ApiSuccess<LeaveAllocation[]>, { employeeId?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/leave-allocations',
        params: arg && 'employeeId' in arg && arg.employeeId ? { employeeId: arg.employeeId } : undefined,
      }),
      providesTags: ['LeaveAllocations'],
    }),
    createLeaveAllocation: builder.mutation<
      ApiSuccess<LeaveAllocation>,
      { employeeId: string; leaveTypeId: string; allocated: number; period?: string }
    >({
      query: (body) => ({ url: '/api/v1/leave-allocations', method: 'POST', body }),
      invalidatesTags: ['LeaveAllocations', 'LeaveBalances', 'Notifications'],
    }),
    setLeaveAllocation: builder.mutation<ApiSuccess<LeaveAllocation>, { id: string; allocated: number }>({
      query: ({ id, allocated }) => ({
        url: `/api/v1/leave-allocations/${id}`,
        method: 'PATCH',
        body: { allocated },
      }),
      invalidatesTags: ['LeaveAllocations', 'LeaveBalances', 'Notifications'],
    }),
    deleteLeaveAllocation: builder.mutation<ApiSuccess<{ id: string }>, string>({
      query: (id) => ({ url: `/api/v1/leave-allocations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['LeaveAllocations', 'LeaveBalances', 'Notifications'],
    }),
    getLeaveApplications: builder.query<ApiSuccess<LeaveApplication[]>, { status?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/leaves/applications',
        params: arg && 'status' in arg && arg.status ? { status: arg.status } : undefined,
      }),
      providesTags: ['LeaveApplications'],
    }),
    getLeaveApplication: builder.query<ApiSuccess<LeaveApplication>, string>({
      query: (id) => `/api/v1/leaves/applications/${id}`,
      providesTags: ['LeaveApplications'],
    }),
    applyLeave: builder.mutation<
      ApiSuccess<LeaveApplication>,
      {
        leaveTypeId: string;
        startDate: string;
        endDate: string;
        duration: 'full' | 'half';
        reason?: string;
        handover?: string;
        handoverEmployeeId?: string;
        attachmentUrl?: string;
        projectId?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/leaves/applications', method: 'POST', body }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    updateLeave: builder.mutation<
      ApiSuccess<LeaveApplication>,
      {
        id: string;
        body: {
          leaveTypeId: string;
          startDate: string;
          endDate: string;
          duration: 'full' | 'half';
          reason?: string;
          handover?: string;
          handoverEmployeeId?: string;
          attachmentUrl?: string;
          projectId?: string;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/leaves/applications/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    cancelLeave: builder.mutation<ApiSuccess<LeaveApplication>, string>({
      query: (id) => ({ url: `/api/v1/leaves/applications/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    approveLeave: builder.mutation<ApiSuccess<LeaveApplication>, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({ url: `/api/v1/leaves/${id}/approve`, method: 'POST', body: { comment } }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    rejectLeave: builder.mutation<ApiSuccess<LeaveApplication>, { id: string; comment?: string }>({
      query: ({ id, comment }) => ({ url: `/api/v1/leaves/${id}/reject`, method: 'POST', body: { comment } }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    requestLeaveChanges: builder.mutation<ApiSuccess<LeaveApplication>, { id: string; comment: string }>({
      query: ({ id, comment }) => ({ url: `/api/v1/leaves/${id}/request-changes`, method: 'POST', body: { comment } }),
      invalidatesTags: ['LeaveApplications', 'Notifications'],
    }),
    acceptLeaveHandover: builder.mutation<ApiSuccess<LeaveApplication>, string>({
      query: (id) => ({ url: `/api/v1/leaves/${id}/handover-accept`, method: 'POST' }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications'],
    }),
    acceptLeaveProjectLead: builder.mutation<ApiSuccess<LeaveApplication>, string>({
      query: (id) => ({ url: `/api/v1/leaves/${id}/project-lead-accept`, method: 'POST' }),
      invalidatesTags: ['LeaveApplications', 'LeaveBalances', 'Notifications', 'Work'],
    }),
    getLeaveProjects: builder.query<ApiSuccess<LeaveProjectOption[]>, void>({
      query: () => '/api/v1/leave-projects',
    }),
    getLeaveColleagues: builder.query<
      ApiSuccess<LeaveColleague[]>,
      { startDate?: string; endDate?: string } | void
    >({
      query: (arg) => ({
        url: '/api/v1/leave-colleagues',
        params:
          arg && (arg.startDate || arg.endDate)
            ? { startDate: arg.startDate, endDate: arg.endDate ?? arg.startDate }
            : undefined,
      }),
    }),
    getHolidays: builder.query<ApiSuccess<Holiday[]>, void>({
      query: () => '/api/v1/holidays',
      providesTags: ['Holidays'],
    }),
    createHoliday: builder.mutation<
      ApiSuccess<Holiday>,
      { name: string; date: string; type?: string; region?: string; optional?: boolean }
    >({
      query: (body) => ({ url: '/api/v1/holidays', method: 'POST', body }),
      invalidatesTags: ['Holidays', 'Notifications'],
    }),
    updateHoliday: builder.mutation<
      ApiSuccess<Holiday>,
      { id: string; body: { name?: string; date?: string; type?: string; region?: string; optional?: boolean } }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/holidays/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Holidays', 'Notifications'],
    }),
    getMyWorkPermissions: builder.query<ApiSuccess<WorkPermissionMine>, void>({
      query: () => '/api/v1/work-permissions/me',
      providesTags: ['WorkPermissions'],
    }),
    getWorkPermissions: builder.query<ApiSuccess<WorkPermission[]>, { status?: WorkPermission['status'] } | void>({
      query: (arg) => ({
        url: '/api/v1/work-permissions',
        params: arg?.status ? { status: arg.status } : undefined,
      }),
      providesTags: ['WorkPermissions'],
    }),
    applyWorkPermission: builder.mutation<
      ApiSuccess<WorkPermission>,
      { permissionDate: string; minutes: 60; slot: 'START' | 'END'; reason?: string }
    >({
      query: (body) => ({ url: '/api/v1/work-permissions', method: 'POST', body }),
      invalidatesTags: ['WorkPermissions', 'Notifications'],
    }),
    approveWorkPermission: builder.mutation<ApiSuccess<WorkPermission>, string>({
      query: (id) => ({ url: `/api/v1/work-permissions/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['WorkPermissions', 'Notifications'],
    }),
    rejectWorkPermission: builder.mutation<ApiSuccess<WorkPermission>, string>({
      query: (id) => ({ url: `/api/v1/work-permissions/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['WorkPermissions', 'Notifications'],
    }),
    getMyShiftChanges: builder.query<ApiSuccess<ShiftChangeRequest[]>, void>({
      query: () => '/api/v1/shift-changes/me',
      providesTags: ['ShiftChanges'],
    }),
    getShiftChangeLeadInbox: builder.query<ApiSuccess<ShiftChangeRequest[]>, void>({
      query: () => '/api/v1/shift-changes/lead-inbox',
      providesTags: ['ShiftChanges'],
    }),
    getShiftChanges: builder.query<
      ApiSuccess<ShiftChangeRequest[]>,
      { status?: ShiftChangeRequest['status'] } | void
    >({
      query: (arg) => ({
        url: '/api/v1/shift-changes',
        params: arg?.status ? { status: arg.status } : undefined,
      }),
      providesTags: ['ShiftChanges'],
    }),
    getShiftChangeProjects: builder.query<ApiSuccess<LeaveProjectOption[]>, void>({
      query: () => '/api/v1/shift-changes/projects',
      providesTags: ['ShiftChanges'],
    }),
    applyShiftChange: builder.mutation<
      ApiSuccess<ShiftChangeRequest>,
      {
        startDate: string;
        endDate: string;
        requestedShiftId: string;
        reason: string;
        projectId?: string;
      }
    >({
      query: (body) => ({ url: '/api/v1/shift-changes', method: 'POST', body }),
      invalidatesTags: ['ShiftChanges', 'Notifications'],
    }),
    acceptShiftChangeProjectLead: builder.mutation<ApiSuccess<ShiftChangeRequest>, string>({
      query: (id) => ({ url: `/api/v1/shift-changes/${id}/project-lead-accept`, method: 'POST' }),
      invalidatesTags: ['ShiftChanges', 'Notifications', 'Work'],
    }),
    approveShiftChange: builder.mutation<
      ApiSuccess<ShiftChangeRequest>,
      { id: string; comment?: string }
    >({
      query: ({ id, comment }) => ({
        url: `/api/v1/shift-changes/${id}/approve`,
        method: 'POST',
        body: comment ? { comment } : {},
      }),
      invalidatesTags: ['ShiftChanges', 'Notifications'],
    }),
    rejectShiftChange: builder.mutation<
      ApiSuccess<ShiftChangeRequest>,
      { id: string; comment?: string }
    >({
      query: ({ id, comment }) => ({
        url: `/api/v1/shift-changes/${id}/reject`,
        method: 'POST',
        body: comment ? { comment } : {},
      }),
      invalidatesTags: ['ShiftChanges', 'Notifications'],
    }),
    cancelShiftChange: builder.mutation<ApiSuccess<ShiftChangeRequest>, string>({
      query: (id) => ({ url: `/api/v1/shift-changes/${id}/cancel`, method: 'POST' }),
      invalidatesTags: ['ShiftChanges', 'Notifications'],
    }),
    updateLeaveType: builder.mutation<
      ApiSuccess<LeaveType>,
      {
        id: string;
        body: {
          name?: string;
          description?: string;
          active?: boolean;
          requiresApproval?: boolean;
          requiresHandover?: boolean;
          requiresAttachment?: boolean;
          allowHalfDay?: boolean;
          allowMultipleDays?: boolean;
          paid?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/leave-types/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['LeaveTypes', 'LeavePolicies'],
    }),
    getAttendanceMe: builder.query<ApiSuccess<AttendanceMe>, { period?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/attendance/me',
        params: arg && 'period' in arg && arg.period ? { period: arg.period } : undefined,
      }),
      providesTags: ['Attendance'],
    }),
    getMySchedule: builder.query<ApiSuccess<MySchedule>, void>({
      query: () => '/api/v1/me/schedule',
      providesTags: ['MySchedule'],
    }),
    getWorkDay: builder.query<ApiSuccess<WorkDayBoard>, string>({
      query: (date) => `/api/v1/work/days/${date}`,
      providesTags: ['Work'],
    }),
    submitWorkDay: builder.mutation<
      ApiSuccess<WorkDayBoard>,
      {
        date: string;
        body: {
          planned: { priorityId: string; description: string }[];
          unplanned?: { description: string }[];
          blocker?: { category: string; description: string } | null;
          tomorrow?: string;
        };
      }
    >({
      query: ({ date, body }) => ({ url: `/api/v1/work/days/${date}`, method: 'PUT', body }),
      invalidatesTags: ['Work'],
    }),
    getWorkHistory: builder.query<ApiSuccess<WorkHistoryMonth>, { month?: string; employeeId?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/history',
        params: arg
          ? {
              ...(arg.month ? { month: arg.month } : {}),
              ...(arg.employeeId ? { employeeId: arg.employeeId } : {}),
            }
          : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkOverview: builder.query<ApiSuccess<WorkOverview>, { employeeId?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/overview',
        params: arg && arg.employeeId ? { employeeId: arg.employeeId } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkBoard: builder.query<
      ApiSuccess<WorkBoard>,
      {
        date?: string;
        from?: string;
        to?: string;
        departmentId?: string;
        employeeId?: string;
        type?: string;
        category?: string;
        projectId?: string;
      } | void
    >({
      query: (arg) => ({
        url: '/api/v1/work/board',
        params: arg || undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkPrioritiesQueue: builder.query<ApiSuccess<WorkPrioritiesQueue>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/priorities/queue',
        params: arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkPrioritiesApproved: builder.query<ApiSuccess<WorkPrioritiesApproved>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/priorities/approved',
        params: arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkLeadPrioritiesQueue: builder.query<ApiSuccess<WorkPrioritiesQueue>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/priorities/lead-queue',
        params: arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkLeadPrioritiesApproved: builder.query<ApiSuccess<WorkPrioritiesApproved>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/priorities/lead-approved',
        params: arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkAnalytics: builder.query<
      ApiSuccess<WorkAnalytics>,
      {
        from?: string;
        to?: string;
        months?: number;
        departmentId?: string;
        employeeId?: string;
      } | void
    >({
      query: (arg) => ({
        url: '/api/v1/work/analytics',
        params: arg || undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkSettings: builder.query<ApiSuccess<WorkSettings>, void>({
      query: () => '/api/v1/work/settings',
      providesTags: ['Work'],
    }),
    updateWorkSettings: builder.mutation<
      ApiSuccess<WorkSettings>,
      {
        reminderHour?: number;
        secondReminderHour?: number | null;
        thirdReminderHour?: number | null;
        retentionDays?: 90 | 180 | 365;
        archiveBeforeDelete?: boolean;
        notifyBeforePurge?: boolean;
        purgeNotifyDaysBefore?: number;
        legalHold?: boolean;
      }
    >({
      query: (body) => ({ url: '/api/v1/work/settings', method: 'PATCH', body }),
      invalidatesTags: ['Work', 'Settings'],
    }),
    createWorkFeedback: builder.mutation<
      ApiSuccess<WeeklyWorkBoard>,
      { employeeId: string; type: string; comment: string }
    >({
      query: (body) => ({ url: '/api/v1/work/feedback', method: 'POST', body }),
      invalidatesTags: ['Work'],
    }),
    getWorkWeek: builder.query<ApiSuccess<WeeklyWorkBoard>, { employeeId?: string; date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/week',
        params:
          arg && (arg.employeeId || arg.date)
            ? {
                ...(arg.employeeId ? { employeeId: arg.employeeId } : {}),
                ...(arg.date ? { date: arg.date } : {}),
              }
            : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWorkProjects: builder.query<ApiSuccess<WorkProject[]>, void>({
      query: () => '/api/v1/work/projects',
      providesTags: ['Work'],
    }),
    getMyProjects: builder.query<ApiSuccess<MyProjectSummary[]>, void>({
      query: () => '/api/v1/work/my-projects',
      providesTags: ['Work'],
    }),
    getLeadProjectDesk: builder.query<
      ApiSuccess<LeadProjectDesk>,
      { projectId: string; date?: string }
    >({
      query: ({ projectId, date }) => ({
        url: `/api/v1/work/lead/projects/${projectId}`,
        params: date ? { date } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getLeadDailyWork: builder.query<
      ApiSuccess<LeadDailyWorkBoard>,
      { date?: string; from?: string; to?: string; projectId?: string }
    >({
      query: (params) => ({
        url: '/api/v1/work/lead/daily-work',
        params: {
          ...(params.date ? { date: params.date } : {}),
          ...(params.from ? { from: params.from } : {}),
          ...(params.to ? { to: params.to } : {}),
          ...(params.projectId ? { projectId: params.projectId } : {}),
        },
      }),
      providesTags: ['Work'],
    }),
    getLeadPermissions: builder.query<ApiSuccess<LeadPermissionsBoard>, void>({
      query: () => '/api/v1/work/lead/permissions',
      providesTags: ['Work', 'LeaveApplications', 'ShiftChanges'],
    }),
    getProjectStatusUpdates: builder.query<ApiSuccess<ProjectStatusUpdate[]>, string>({
      query: (projectId) => `/api/v1/work/projects/${projectId}/updates`,
      providesTags: ['Work'],
    }),
    createProjectStatusUpdate: builder.mutation<
      ApiSuccess<ProjectStatusUpdate>,
      { projectId: string; body: string; topic?: ProjectUpdateTopic }
    >({
      query: ({ projectId, body, topic }) => ({
        url: `/api/v1/work/projects/${projectId}/updates`,
        method: 'POST',
        body: topic ? { body, topic } : { body },
      }),
      invalidatesTags: ['Work'],
    }),
    getProjectMembers: builder.query<ApiSuccess<{ projectId: string; members: WorkProjectMember[] }>, string>({
      query: (id) => `/api/v1/work/projects/${id}/members`,
      providesTags: ['Work'],
    }),
    setProjectMembers: builder.mutation<
      ApiSuccess<{
        projectId: string;
        memberCount: number;
        members: WorkProjectMember[];
        leadEmployeeId: string;
        leadName: string | null;
      }>,
      { projectId: string; employeeIds: string[]; leadEmployeeId: string }
    >({
      query: ({ projectId, employeeIds, leadEmployeeId }) => ({
        url: `/api/v1/work/projects/${projectId}/members`,
        method: 'PUT',
        body: { employeeIds, leadEmployeeId },
      }),
      invalidatesTags: ['Work'],
    }),
    setWorkProjectStatus: builder.mutation<
      ApiSuccess<WorkProject>,
      { projectId: string; status: 'active' | 'inactive' }
    >({
      query: ({ projectId, status }) => ({
        url: `/api/v1/work/projects/${projectId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Work'],
    }),
    getEmployeeWorkProjects: builder.query<ApiSuccess<EmployeeWorkProjects>, string>({
      query: (employeeId) => `/api/v1/work/employees/${employeeId}/projects`,
      providesTags: ['Work'],
    }),
    setEmployeeWorkProjects: builder.mutation<
      ApiSuccess<EmployeeWorkProjects>,
      { employeeId: string; projectIds: string[] }
    >({
      query: ({ employeeId, projectIds }) => ({
        url: `/api/v1/work/employees/${employeeId}/projects`,
        method: 'PUT',
        body: { projectIds },
      }),
      invalidatesTags: ['Work'],
    }),
    getProjectPlan: builder.query<ApiSuccess<ProjectPlan>, string>({
      query: (projectId) => `/api/v1/work/projects/${projectId}/plan`,
      providesTags: ['Work'],
    }),
    getProjectGoals: builder.query<ApiSuccess<{ projectId: string; goals: ProjectGoalListItem[] }>, string>({
      query: (projectId) => `/api/v1/work/projects/${projectId}/goals`,
      providesTags: ['Work'],
    }),
    getProjectMilestones: builder.query<
      ApiSuccess<{ projectId: string; milestones: ProjectMilestoneListItem[] }>,
      string
    >({
      query: (projectId) => `/api/v1/work/projects/${projectId}/milestones`,
      providesTags: ['Work'],
    }),
    createProjectGoal: builder.mutation<
      ApiSuccess<ProjectGoal>,
      { projectId: string; name: string; description?: string; isPrimary?: boolean; sequence?: number }
    >({
      query: ({ projectId, ...body }) => ({
        url: `/api/v1/work/projects/${projectId}/goals`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Work'],
    }),
    updateProjectGoal: builder.mutation<
      ApiSuccess<ProjectGoal>,
      { goalId: string; body: { name?: string; description?: string; isPrimary?: boolean; sequence?: number } }
    >({
      query: ({ goalId, body }) => ({
        url: `/api/v1/work/goals/${goalId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Work'],
    }),
    deleteProjectGoal: builder.mutation<ApiSuccess<{ goalId: string }>, string>({
      query: (goalId) => ({ url: `/api/v1/work/goals/${goalId}`, method: 'DELETE' }),
      invalidatesTags: ['Work'],
    }),
    createProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      {
        goalId: string;
        name: string;
        description?: string;
        startDate?: string | null;
        targetDate?: string | null;
        status?: ProjectMilestone['status'];
        sequence?: number;
      }
    >({
      query: ({ goalId, ...body }) => ({
        url: `/api/v1/work/goals/${goalId}/milestones`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Work'],
    }),
    updateProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      {
        milestoneId: string;
        body: {
          name?: string;
          description?: string;
          startDate?: string | null;
          targetDate?: string | null;
          status?: ProjectMilestone['status'];
          sequence?: number;
          changeReason: string;
        };
      }
    >({
      query: ({ milestoneId, body }) => ({
        url: `/api/v1/work/milestones/${milestoneId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Work'],
    }),
    activateProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      { milestoneId: string; changeReason?: string }
    >({
      query: ({ milestoneId, changeReason }) => ({
        url: `/api/v1/work/milestones/${milestoneId}/activate`,
        method: 'POST',
        body: changeReason ? { changeReason } : {},
      }),
      invalidatesTags: ['Work'],
    }),
    completeProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      { milestoneId: string; changeReason?: string }
    >({
      query: ({ milestoneId, changeReason }) => ({
        url: `/api/v1/work/milestones/${milestoneId}/complete`,
        method: 'POST',
        body: changeReason ? { changeReason } : {},
      }),
      invalidatesTags: ['Work'],
    }),
    cancelProjectMilestone: builder.mutation<
      ApiSuccess<ProjectMilestone>,
      { milestoneId: string; changeReason?: string }
    >({
      query: ({ milestoneId, changeReason }) => ({
        url: `/api/v1/work/milestones/${milestoneId}/cancel`,
        method: 'POST',
        body: changeReason ? { changeReason } : {},
      }),
      invalidatesTags: ['Work'],
    }),
    deleteProjectMilestone: builder.mutation<ApiSuccess<{ milestoneId: string }>, string>({
      query: (milestoneId) => ({ url: `/api/v1/work/milestones/${milestoneId}`, method: 'DELETE' }),
      invalidatesTags: ['Work'],
    }),
    getMilestoneHistory: builder.query<ApiSuccess<{ milestoneId: string; items: MilestoneHistoryEntry[] }>, string>({
      query: (milestoneId) => `/api/v1/work/milestones/${milestoneId}/history`,
      providesTags: ['Work'],
    }),
    createWorkPriority: builder.mutation<
      ApiSuccess<{ priority: WorkPriority; overCap: boolean; warning: string | null }>,
      {
        employeeId?: string;
        type: WorkPriority['type'];
        projectId?: string | null;
        milestoneId?: string | null;
        regularSubtype?: WorkPriority['regularSubtype'];
        regularSubtypeLabel?: string | null;
        title: string;
        description?: string;
        expectedOutcome?: string;
        successCriteria?: string;
        level: WorkPriority['level'];
      }
    >({
      query: (body) => ({ url: '/api/v1/work/priorities', method: 'POST', body }),
      invalidatesTags: ['Work'],
    }),
    updateWorkPriority: builder.mutation<
      ApiSuccess<WorkPriority>,
      {
        id: string;
        body: {
          title?: string;
          description?: string;
          expectedOutcome?: string;
          successCriteria?: string;
          level?: WorkPriority['level'];
          regularSubtype?: WorkPriority['regularSubtype'];
          regularSubtypeLabel?: string | null;
          status?: WorkPriority['status'];
          incompleteReason?: string | null;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/work/priorities/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Work'],
    }),
    carryForwardWorkPriority: builder.mutation<
      ApiSuccess<{ original: WorkPriority; next: WorkPriority; nextWeek: { start: string; end: string } }>,
      { id: string; incompleteReason?: string | null }
    >({
      query: ({ id, incompleteReason }) => ({
        url: `/api/v1/work/priorities/${id}/carry-forward`,
        method: 'POST',
        body: { incompleteReason: incompleteReason ?? null },
      }),
      invalidatesTags: ['Work'],
    }),
    submitWorkPriority: builder.mutation<ApiSuccess<WorkPriority>, string>({
      query: (id) => ({ url: `/api/v1/work/priorities/${id}/submit`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    submitAllWorkPriorities: builder.mutation<
      ApiSuccess<{ submitted: WorkPriority[]; week: WeeklyWorkBoard }>,
      void
    >({
      query: () => ({ url: '/api/v1/work/priorities/submit-all', method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    approveWorkPriority: builder.mutation<ApiSuccess<WorkPriority>, string>({
      query: (id) => ({ url: `/api/v1/work/priorities/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    approveAllWorkPriorities: builder.mutation<
      ApiSuccess<{ approved: WorkPriority[]; week: WeeklyWorkBoard }>,
      { employeeId: string; date?: string }
    >({
      query: (body) => ({ url: '/api/v1/work/priorities/approve-all', method: 'POST', body }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    requestWorkPriorityResubmit: builder.mutation<ApiSuccess<WorkPriority>, { id: string; comment: string }>({
      query: ({ id, comment }) => ({
        url: `/api/v1/work/priorities/${id}/request-resubmit`,
        method: 'POST',
        body: { comment },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    getWeeklyWorkUpdateBoard: builder.query<ApiSuccess<WeeklyWorkUpdateBoard>, void>({
      query: () => '/api/v1/work/weekly-updates',
      providesTags: ['Work'],
    }),
    getWeeklyPptAdminBoard: builder.query<ApiSuccess<WeeklyPptAdminBoard>, { weekStart?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/work/weekly-updates/admin',
        params: arg && 'weekStart' in arg && arg.weekStart ? { weekStart: arg.weekStart } : undefined,
      }),
      providesTags: ['Work'],
    }),
    getWeeklyPptGmShares: builder.query<ApiSuccess<WeeklyPptGmShares>, void>({
      query: () => '/api/v1/work/weekly-updates/shares',
      providesTags: ['Work'],
    }),
    shareWeeklyPptToGm: builder.mutation<
      ApiSuccess<{ share: { id: string; weekStart: string; weekEnd: string; sharedAt: string; fileCount: number }; recipients: number }>,
      { weekStart?: string } | void
    >({
      query: (body) => ({
        url: '/api/v1/work/weekly-updates/share-to-gm',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    createWeeklyWorkUpdateUpload: builder.mutation<
      ApiSuccess<WeeklyWorkUpdateUploadSession>,
      { fileName: string; contentType: string; sizeBytes: number }
    >({
      query: (body) => ({ url: '/api/v1/work/weekly-updates/upload', method: 'POST', body }),
      invalidatesTags: ['Work'],
    }),
    getWeeklyWorkUpdateDownload: builder.query<
      ApiSuccess<{ url: string; fileName: string }>,
      { id: string; shareId?: string } | string
    >({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        const shareId = typeof arg === 'string' ? undefined : arg.shareId;
        return {
          url: `/api/v1/work/weekly-updates/${id}/download`,
          params: shareId ? { shareId } : undefined,
        };
      },
    }),
    getJcPptBoard: builder.query<ApiSuccess<JcPptEmployeeBoard>, void>({
      query: () => '/api/v1/work/jc',
      providesTags: ['Work'],
    }),
    createJcPptUpload: builder.mutation<
      ApiSuccess<JcPptUploadSession>,
      { fileName: string; contentType: string; sizeBytes: number }
    >({
      query: (body) => ({ url: '/api/v1/work/jc/upload', method: 'POST', body }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    getJcPptDownload: builder.query<ApiSuccess<{ url: string; fileName: string }>, string>({
      query: (id) => `/api/v1/work/jc/${id}/download`,
    }),
    getJcPptCsoBoard: builder.query<ApiSuccess<JcPptCsoBoard>, void>({
      query: () => '/api/v1/work/jc/admin',
      providesTags: ['Work'],
    }),
    getJcPptGmBoard: builder.query<ApiSuccess<JcPptGmBoard>, void>({
      query: () => '/api/v1/work/jc/gm',
      providesTags: ['Work'],
    }),
    transferJcPptToGm: builder.mutation<
      ApiSuccess<{ item: JcPptItem; recipients: number }>,
      string
    >({
      query: (id) => ({ url: `/api/v1/work/jc/${id}/transfer-to-gm`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    getJcPptPreview: builder.query<ApiSuccess<{ url: string; fileName: string }>, string>({
      query: (id) => `/api/v1/work/jc/${id}/preview`,
    }),
    gmDownloadJcPpt: builder.mutation<ApiSuccess<JcPptConsumeResult>, string>({
      query: (id) => ({ url: `/api/v1/work/jc/${id}/gm-download`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmEmailJcPpt: builder.mutation<ApiSuccess<JcPptConsumeResult>, { id: string; recipientEmail: string }>({
      query: ({ id, recipientEmail }) => ({
        url: `/api/v1/work/jc/${id}/gm-email`,
        method: 'POST',
        body: { recipientEmail },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDeleteJcPpt: builder.mutation<ApiSuccess<JcPptConsumeResult>, string>({
      query: (id) => ({ url: `/api/v1/work/jc/${id}/gm-delete`, method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDeleteAllJcPpts: builder.mutation<ApiSuccess<{ removed: number }>, void>({
      query: () => ({ url: '/api/v1/work/jc/gm-delete-all', method: 'POST' }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDownloadWeeklyPpt: builder.mutation<
      ApiSuccess<WeeklyPptConsumeResult>,
      { id: string; shareId: string }
    >({
      query: ({ id, shareId }) => ({
        url: `/api/v1/work/weekly-updates/${id}/gm-download`,
        method: 'POST',
        body: { shareId },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmEmailWeeklyPpt: builder.mutation<
      ApiSuccess<WeeklyPptConsumeResult>,
      { id: string; shareId: string; recipientEmail: string }
    >({
      query: ({ id, shareId, recipientEmail }) => ({
        url: `/api/v1/work/weekly-updates/${id}/gm-email`,
        method: 'POST',
        body: { shareId, recipientEmail },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDeleteWeeklyPpt: builder.mutation<
      ApiSuccess<WeeklyPptConsumeResult>,
      { id: string; shareId: string }
    >({
      query: ({ id, shareId }) => ({
        url: `/api/v1/work/weekly-updates/${id}/gm-delete`,
        method: 'POST',
        body: { shareId },
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    gmDeleteAllWeeklyPptsInShare: builder.mutation<ApiSuccess<{ removed: number }>, string>({
      query: (shareId) => ({
        url: `/api/v1/work/weekly-updates/shares/${shareId}/gm-delete-all`,
        method: 'POST',
      }),
      invalidatesTags: ['Work', 'Notifications'],
    }),
    createWorkProject: builder.mutation<
      ApiSuccess<WorkProject>,
      { name: string; code: string; leadEmployeeId: string; employeeIds?: string[] }
    >({
      query: (body) => ({ url: '/api/v1/work/projects', method: 'POST', body }),
      invalidatesTags: ['Work'],
    }),
    getAttendanceDay: builder.query<ApiSuccess<AttendanceDaySummary>, { date?: string } | void>({
      query: (arg) => ({
        url: '/api/v1/attendance',
        params: arg && 'date' in arg && arg.date ? { date: arg.date } : undefined,
      }),
      providesTags: ['Attendance'],
    }),
    getAttendanceImports: builder.query<ApiSuccess<AttendanceImport[]>, void>({
      query: () => '/api/v1/attendance/imports',
      providesTags: ['AttendanceImports'],
    }),
    getAttendanceImport: builder.query<ApiSuccess<AttendanceImportDetail>, string>({
      query: (id) => `/api/v1/attendance/imports/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AttendanceImports', id }],
    }),
    getAttendanceImportCard: builder.query<
      ApiSuccess<{ import: AttendanceImport; card: AttendanceReviewCard }>,
      { id: string; employeeId: string }
    >({
      query: ({ id, employeeId }) => `/api/v1/attendance/imports/${id}/employees/${employeeId}`,
      providesTags: (_r, _e, arg) => [{ type: 'AttendanceImports', id: arg.id }],
    }),
    uploadAttendanceImport: builder.mutation<
      ApiSuccess<AttendanceImportDetail>,
      { period: string; fileName: string; contentBase64: string }
    >({
      query: (body) => ({ url: '/api/v1/attendance/imports', method: 'POST', body }),
      invalidatesTags: ['AttendanceImports', 'Attendance'],
    }),
    decideAttendanceReview: builder.mutation<
      ApiSuccess<AttendanceReviewDay>,
      { id: string; action: 'FULL_LOP' | 'HALF_LOP' | 'NO_LOP' | 'EXCLUDE'; reason?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/attendance/reviews/${id}/decide`, method: 'POST', body }),
      invalidatesTags: ['AttendanceImports'],
    }),
    confirmAttendanceImport: builder.mutation<ApiSuccess<AttendanceImportDetail>, string>({
      query: (id) => ({ url: `/api/v1/attendance/imports/${id}/confirm`, method: 'POST' }),
      invalidatesTags: ['AttendanceImports', 'Attendance'],
    }),
    rejectAttendanceImport: builder.mutation<ApiSuccess<AttendanceImport>, string>({
      query: (id) => ({ url: `/api/v1/attendance/imports/${id}/reject`, method: 'POST' }),
      invalidatesTags: ['AttendanceImports', 'Attendance'],
    }),
    deleteAttendanceImport: builder.mutation<ApiSuccess<{ deleted: boolean }>, string>({
      query: (id) => ({ url: `/api/v1/attendance/imports/${id}`, method: 'DELETE' }),
      invalidatesTags: ['AttendanceImports', 'Attendance'],
    }),
    getPayrollRuns: builder.query<ApiSuccess<PayrollRun[]>, void>({
      query: () => '/api/v1/payroll/runs',
      providesTags: ['PayrollRuns'],
    }),
    getPayrollImports: builder.query<ApiSuccess<ConfirmedPayrollImport[]>, void>({
      query: () => '/api/v1/payroll/imports',
      providesTags: ['PayrollRuns'],
    }),
    getPayrollRun: builder.query<ApiSuccess<PayrollRunDetail>, string>({
      query: (id) => `/api/v1/payroll/runs/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PayrollRuns', id }],
    }),
    getPayrollPreview: builder.query<ApiSuccess<PayrollPreview>, string>({
      query: (importId) => `/api/v1/payroll/preview?importId=${encodeURIComponent(importId)}`,
    }),
    calculatePayroll: builder.mutation<ApiSuccess<PayrollRunDetail>, CalculatePayrollInput>({
      query: (body) => ({ url: '/api/v1/payroll/calculate', method: 'POST', body }),
      invalidatesTags: ['PayrollRuns'],
    }),
    publishPayroll: builder.mutation<ApiSuccess<PayrollRunDetail>, string>({
      query: (id) => ({ url: `/api/v1/payroll/runs/${id}/publish`, method: 'POST' }),
      invalidatesTags: ['PayrollRuns', 'Notifications'],
    }),
    getMyPayslips: builder.query<ApiSuccess<SalarySlip[]>, void>({
      query: () => '/api/v1/payroll/slips/me',
      providesTags: ['PayrollRuns'],
    }),
    getPayslip: builder.query<ApiSuccess<SalarySlip>, string>({
      query: (id) => `/api/v1/payroll/slips/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'PayrollRuns', id }],
    }),
    getShifts: builder.query<ApiSuccess<Shift[]>, void>({
      query: () => '/api/v1/shifts',
      providesTags: ['Shifts'],
    }),
    createShift: builder.mutation<
      ApiSuccess<Shift>,
      {
        name: string;
        startTime: string;
        endTime: string;
        minimumDurationMinutes: number;
        gracePeriodMinutes?: number;
        flexible?: boolean;
      }
    >({
      query: (body) => ({ url: '/api/v1/shifts', method: 'POST', body }),
      invalidatesTags: ['Shifts'],
    }),
    updateShift: builder.mutation<
      ApiSuccess<Shift>,
      {
        id: string;
        body: {
          name?: string;
          startTime?: string;
          endTime?: string;
          minimumDurationMinutes?: number;
          gracePeriodMinutes?: number;
          flexible?: boolean;
          active?: boolean;
        };
      }
    >({
      query: ({ id, body }) => ({ url: `/api/v1/shifts/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Shifts'],
    }),
    getShiftAssignments: builder.query<ApiSuccess<ShiftAssignment[]>, void>({
      query: () => '/api/v1/shift-assignments',
      providesTags: ['Shifts'],
    }),
    createShiftAssignment: builder.mutation<
      ApiSuccess<ShiftAssignment>,
      { employeeId: string; shiftId: string; effectiveFrom?: string }
    >({
      query: (body) => ({ url: '/api/v1/shift-assignments', method: 'POST', body }),
      invalidatesTags: ['Shifts', 'Notifications', 'MySchedule'],
    }),
    deleteShiftAssignment: builder.mutation<ApiSuccess<{ id: string }>, string>({
      query: (id) => ({ url: `/api/v1/shift-assignments/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Shifts', 'Notifications', 'MySchedule'],
    }),
    getGrievances: builder.query<
      ApiSuccess<Grievance[]>,
      { status?: string; scope?: 'mine' | 'assigned' | 'queue' } | void
    >({
      query: (arg) => ({
        url: '/api/v1/grievances',
        params:
          arg && typeof arg === 'object'
            ? {
                ...(arg.status ? { status: arg.status } : {}),
                ...(arg.scope ? { scope: arg.scope } : {}),
              }
            : undefined,
      }),
      providesTags: ['Grievances'],
    }),
    getGrievanceCounts: builder.query<
      ApiSuccess<GrievanceCounts>,
      { scope?: 'mine' | 'assigned' | 'queue' } | void
    >({
      query: (arg) => ({
        url: '/api/v1/grievance-counts',
        params: arg && arg.scope ? { scope: arg.scope } : undefined,
      }),
      providesTags: ['Grievances'],
    }),
    getGrievanceHandlers: builder.query<ApiSuccess<GrievanceHandler[]>, void>({
      query: () => '/api/v1/grievance-handlers',
    }),
    getGrievance: builder.query<ApiSuccess<GrievanceDetail>, string>({
      query: (id) => `/api/v1/grievances/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Grievances', id }],
    }),
    createGrievance: builder.mutation<
      ApiSuccess<Grievance>,
      { category: string; subject: string; description: string }
    >({
      query: (body) => ({ url: '/api/v1/grievances', method: 'POST', body }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    addGrievanceComment: builder.mutation<
      ApiSuccess<GrievanceDetail>,
      { id: string; body: string; visibility?: 'EMPLOYEE' | 'INTERNAL' }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/grievances/${id}/comments`, method: 'POST', body }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    assignGrievance: builder.mutation<ApiSuccess<GrievanceDetail>, { id: string; assigneeId: string }>({
      query: ({ id, assigneeId }) => ({
        url: `/api/v1/grievances/${id}/assign`,
        method: 'POST',
        body: { assigneeId },
      }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    changeGrievanceStatus: builder.mutation<ApiSuccess<GrievanceDetail>, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/v1/grievances/${id}/status`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    resolveGrievance: builder.mutation<ApiSuccess<GrievanceDetail>, { id: string; resolution: string }>({
      query: ({ id, resolution }) => ({
        url: `/api/v1/grievances/${id}/resolve`,
        method: 'POST',
        body: { resolution },
      }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    createGrievanceAttachment: builder.mutation<
      ApiSuccess<GrievanceUploadSession>,
      { id: string; fileName: string; contentType: string; sizeBytes: number }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/grievances/${id}/attachments`, method: 'POST', body }),
      invalidatesTags: ['Grievances', 'Notifications'],
    }),
    getGrievanceAttachmentUrl: builder.query<ApiSuccess<{ url: string }>, { id: string; attachmentId: string }>({
      query: ({ id, attachmentId }) => `/api/v1/grievances/${id}/attachments/${attachmentId}/url`,
    }),
    getPolicies: builder.query<ApiSuccess<HrPolicy[]>, void>({
      query: () => '/api/v1/policies',
      providesTags: ['Policies'],
    }),
    getPolicy: builder.query<ApiSuccess<HrPolicy>, string>({
      query: (id) => `/api/v1/policies/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Policies', id }],
    }),
    createPolicy: builder.mutation<
      ApiSuccess<HrPolicy>,
      {
        title: string;
        content: string;
        versionLabel?: string;
        effectiveDate?: string;
        acknowledgementRequired?: boolean;
      }
    >({
      query: (body) => ({ url: '/api/v1/policies', method: 'POST', body }),
      invalidatesTags: ['Policies'],
    }),
    publishPolicy: builder.mutation<
      ApiSuccess<HrPolicy>,
      {
        id: string;
        content?: string;
        versionLabel?: string;
        effectiveDate?: string;
        acknowledgementRequired?: boolean;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/api/v1/policies/${id}/publish`, method: 'POST', body }),
      invalidatesTags: ['Policies'],
    }),
    acknowledgePolicy: builder.mutation<ApiSuccess<HrPolicy>, string>({
      query: (id) => ({ url: `/api/v1/policies/${id}/acknowledge`, method: 'POST' }),
      invalidatesTags: ['Policies'],
    }),
    getPolicyAcknowledgements: builder.query<
      ApiSuccess<PolicyAcknowledgementReport>,
      { id: string; version?: string }
    >({
      query: ({ id, version }) => ({
        url: `/api/v1/policies/${id}/acknowledgements`,
        params: version ? { version } : undefined,
      }),
      providesTags: ['Policies'],
    }),
    getNotifications: builder.query<ApiSuccess<NotificationItem[]>, { unread?: boolean } | void>({
      query: (arg) => ({
        url: '/api/v1/notifications',
        params: arg && 'unread' in arg && arg.unread ? { unread: 'true' } : undefined,
      }),
      providesTags: ['Notifications'],
    }),
    getNotificationUnreadCount: builder.query<ApiSuccess<{ count: number }>, void>({
      query: () => '/api/v1/notifications/unread-count',
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation<ApiSuccess<NotificationItem>, string>({
      query: (id) => ({ url: `/api/v1/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation<ApiSuccess<{ updated: number }>, void>({
      query: () => ({ url: '/api/v1/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notifications'],
    }),
    subscribeWebPush: builder.mutation<
      ApiSuccess<{ subscribed: boolean }>,
      { endpoint: string; keys: { p256dh: string; auth: string } }
    >({
      query: (body) => ({ url: '/api/v1/web-push/subscribe', method: 'POST', body }),
    }),
    unsubscribeWebPush: builder.mutation<ApiSuccess<{ revoked: boolean }>, { endpoint: string }>({
      query: (body) => ({ url: '/api/v1/web-push/subscribe', method: 'DELETE', body }),
    }),
    getReportsOverview: builder.query<
      ApiSuccess<ReportsOverview>,
      { from?: string; to?: string; period?: string; companyId?: string } | void
    >({
      query: (arg) => ({
        url: '/api/v1/reports/overview',
        params: arg ?? undefined,
      }),
      providesTags: ['Reports'],
    }),
  }),
});

export const {
  useGetHealthQuery,
  useGetMeQuery,
  useRequestPasswordResetMutation,
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useSendWorkEmailOtpMutation,
  useVerifyWorkEmailOtpMutation,
  useUpdateEmployeeMutation,
  useUpdateEmployeeRolesMutation,
  useUpdateEmployeeCompanyMutation,
  useDeactivateEmployeeMutation,
  useActivateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetEmployeeAuditQuery,
  useGetEmployeePayrollQuery,
  useSaveEmployeeCompensationMutation,
  useSaveEmployeePaymentMutation,
  useGetDirectoryEditRequestsQuery,
  useGetDirectoryEditRequestForEmployeeQuery,
  useCreateDirectoryEditRequestMutation,
  useApproveDirectoryEditRequestMutation,
  useRejectDirectoryEditRequestMutation,
  useCancelDirectoryEditRequestMutation,
  useFulfillDirectoryEditRequestMutation,
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useCreateCompanyLogoMutation,
  useGetFinanceSetupQuery,
  useGetFinanceOrganizationQuery,
  useUpdateFinanceOrganizationMutation,
  useGetFinanceAccountsQuery,
  useCreateFinanceAccountMutation,
  useUpdateFinanceAccountMutation,
  useGetFinanceTaxRatesQuery,
  useGetFinanceTaxGroupsQuery,
  useGetFinanceTdsRatesQuery,
  useGetFinanceCustomersQuery,
  useCreateFinanceCustomerMutation,
  useUpdateFinanceCustomerMutation,
  useGetFinanceVendorsQuery,
  useCreateFinanceVendorMutation,
  useUpdateFinanceVendorMutation,
  useGetFinanceItemsQuery,
  useCreateFinanceItemMutation,
  useUpdateFinanceItemMutation,
  useGetFinanceNumberSeriesQuery,
  useUpdateFinanceNumberSeriesMutation,
  useGetFinanceIndentsQuery,
  useGetFinanceIndentQuery,
  useCreateFinanceIndentMutation,
  useUpdateFinanceIndentMutation,
  useSubmitFinanceIndentMutation,
  useDecideFinanceIndentMutation,
  useGetFinanceRfqsQuery,
  useGetFinanceRfqQuery,
  useCreateFinanceRfqFromIndentMutation,
  useCloseFinanceRfqMutation,
  useGetFinanceRfqQuotesQuery,
  useCreateFinanceVendorQuoteMutation,
  useSelectFinanceVendorQuoteMutation,
  useGetFinancePurchaseOrdersQuery,
  useGetFinancePurchaseOrderQuery,
  useGetFinancePurchaseOrderPrintQuery,
  useLazyGetFinancePurchaseOrderPrintQuery,
  useCreateFinancePurchaseOrderMutation,
  useCreateFinancePurchaseOrderFromQuoteMutation,
  useApproveFinancePurchaseOrderMutation,
  useIssueFinancePurchaseOrderMutation,
  useGetFinanceReceiptsQuery,
  useGetFinanceReceiptQuery,
  useCreateFinanceReceiptMutation,
  usePostFinanceReceiptMutation,
  useGetFinanceBillsQuery,
  useGetFinanceBillQuery,
  useCreateFinanceBillMutation,
  usePostFinanceBillMutation,
  useGetFinancePaymentsQuery,
  useGetFinancePaymentQuery,
  useCreateFinancePaymentMutation,
  usePostFinancePaymentMutation,
  useGetFinanceVendorCreditsQuery,
  useGetFinanceVendorCreditQuery,
  useCreateFinanceVendorCreditMutation,
  usePostFinanceVendorCreditMutation,
  useGetFinanceSalesQuotesQuery,
  useGetFinanceSalesQuoteQuery,
  useGetFinanceSalesQuotePrintQuery,
  useLazyGetFinanceSalesQuotePrintQuery,
  useCreateFinanceSalesQuoteMutation,
  useUpdateFinanceSalesQuoteMutation,
  useSendFinanceSalesQuoteMutation,
  useDecideFinanceSalesQuoteMutation,
  useExpireFinanceSalesQuoteMutation,
  useConvertFinanceSalesQuoteToOrderMutation,
  useConvertFinanceSalesQuoteToInvoiceMutation,
  useGetFinanceSalesOrdersQuery,
  useGetFinanceSalesOrderQuery,
  useCreateFinanceSalesOrderMutation,
  useCreateFinanceSalesOrderFromQuoteMutation,
  useConfirmFinanceSalesOrderMutation,
  useGetFinanceDeliveryNotesQuery,
  useGetFinanceDeliveryNoteQuery,
  useGetFinanceDeliveryNotePrintQuery,
  useLazyGetFinanceDeliveryNotePrintQuery,
  useCreateFinanceDeliveryNoteFromSalesOrderMutation,
  usePostFinanceDeliveryNoteMutation,
  useGetFinanceInvoicesQuery,
  useGetFinanceInvoiceQuery,
  useGetFinanceInvoicePrintQuery,
  useLazyGetFinanceInvoicePrintQuery,
  useCreateFinanceInvoiceFromSalesOrderMutation,
  useCreateFinanceInvoiceFromQuoteMutation,
  useSendFinanceInvoiceMutation,
  usePostFinanceInvoiceMutation,
  useGetFinanceCustomerPaymentsQuery,
  useGetFinanceCustomerPaymentQuery,
  useCreateFinanceCustomerPaymentMutation,
  usePostFinanceCustomerPaymentMutation,
  useGetFinanceCreditNotesQuery,
  useGetFinanceCreditNoteQuery,
  useCreateFinanceCreditNoteMutation,
  usePostFinanceCreditNoteMutation,
  useGetFinanceExpenseCategoriesQuery,
  useGetFinanceExpensesQuery,
  useGetFinanceExpenseQuery,
  useCreateFinanceExpenseMutation,
  useUpdateFinanceExpenseMutation,
  usePostFinanceExpenseMutation,
  useGetFinanceExpenseClaimsQuery,
  useGetFinanceExpenseClaimQuery,
  useCreateFinanceExpenseClaimMutation,
  useUpdateFinanceExpenseClaimMutation,
  useSubmitFinanceExpenseClaimMutation,
  useDecideFinanceExpenseClaimMutation,
  useCancelFinanceExpenseClaimMutation,
  useGetFinanceExpenseReimbursementsQuery,
  useGetFinanceExpenseReimbursementQuery,
  useCreateFinanceExpenseReimbursementMutation,
  usePostFinanceExpenseReimbursementMutation,
  useGetFinanceJournalsQuery,
  useGetFinanceJournalQuery,
  useCreateFinanceJournalMutation,
  useUpdateFinanceJournalMutation,
  usePostFinanceJournalMutation,
  useReverseFinanceJournalMutation,
  useGetFinanceLedgerQuery,
  useGetFinanceTrialBalanceQuery,
  useGetFinancePeriodLocksQuery,
  useLockFinancePeriodMutation,
  useUnlockFinancePeriodMutation,
  useGetFinanceOpeningBalancesQuery,
  useGetFinanceOpeningBalanceQuery,
  useCreateFinanceOpeningBalanceMutation,
  useUpdateFinanceOpeningBalanceMutation,
  usePostFinanceOpeningBalanceMutation,
  useGetFinanceBankAccountsQuery,
  useGetFinanceBankAccountQuery,
  useCreateFinanceBankAccountMutation,
  useUpdateFinanceBankAccountMutation,
  useGetFinanceBankTransactionsQuery,
  useGetFinanceBankTransactionQuery,
  useCreateFinanceBankTransactionMutation,
  useMatchFinanceBankTransactionMutation,
  useUnmatchFinanceBankTransactionMutation,
  useCategorizeFinanceBankTransactionMutation,
  useExcludeFinanceBankTransactionMutation,
  useUnexcludeFinanceBankTransactionMutation,
  useGetFinanceBankMatchCandidatesQuery,
  useImportFinanceBankStatementMutation,
  useGetFinanceBankReconciliationReportQuery,
  useGetFinanceBankReconciliationsQuery,
  useSaveFinanceBankReconciliationMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetDesignationsQuery,
  useCreateDesignationMutation,
  useGetRolesQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetAuditLogsQuery,
  useLazyGetEmployeesQuery,
  useGetLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useGetLeavePoliciesQuery,
  useCreateLeavePolicyMutation,
  usePublishLeavePolicyMutation,
  useAddLeavePolicyVersionMutation,
  useGetLeaveBalancesQuery,
  useGetLeaveAllocationsQuery,
  useCreateLeaveAllocationMutation,
  useSetLeaveAllocationMutation,
  useDeleteLeaveAllocationMutation,
  useGetLeaveApplicationsQuery,
  useGetLeaveApplicationQuery,
  useApplyLeaveMutation,
  useUpdateLeaveMutation,
  useCancelLeaveMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  useRequestLeaveChangesMutation,
  useAcceptLeaveHandoverMutation,
  useAcceptLeaveProjectLeadMutation,
  useGetLeaveProjectsQuery,
  useGetLeaveColleaguesQuery,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useGetMyWorkPermissionsQuery,
  useGetWorkPermissionsQuery,
  useApplyWorkPermissionMutation,
  useApproveWorkPermissionMutation,
  useRejectWorkPermissionMutation,
  useGetMyShiftChangesQuery,
  useGetShiftChangeLeadInboxQuery,
  useGetShiftChangesQuery,
  useGetShiftChangeProjectsQuery,
  useApplyShiftChangeMutation,
  useAcceptShiftChangeProjectLeadMutation,
  useApproveShiftChangeMutation,
  useRejectShiftChangeMutation,
  useCancelShiftChangeMutation,
  useGetAttendanceMeQuery,
  useGetMyScheduleQuery,
  useGetWorkDayQuery,
  useSubmitWorkDayMutation,
  useGetWorkHistoryQuery,
  useGetWorkOverviewQuery,
  useGetWorkBoardQuery,
  useGetWorkPrioritiesQueueQuery,
  useGetWorkPrioritiesApprovedQuery,
  useGetWorkLeadPrioritiesQueueQuery,
  useGetWorkLeadPrioritiesApprovedQuery,
  useGetWorkAnalyticsQuery,
  useGetWorkSettingsQuery,
  useUpdateWorkSettingsMutation,
  useCreateWorkFeedbackMutation,
  useGetWorkWeekQuery,
  useGetWorkProjectsQuery,
  useGetMyProjectsQuery,
  useGetLeadProjectDeskQuery,
  useGetLeadDailyWorkQuery,
  useGetLeadPermissionsQuery,
  useGetProjectStatusUpdatesQuery,
  useCreateProjectStatusUpdateMutation,
  useGetProjectMembersQuery,
  useSetProjectMembersMutation,
  useSetWorkProjectStatusMutation,
  useGetEmployeeWorkProjectsQuery,
  useSetEmployeeWorkProjectsMutation,
  useGetProjectPlanQuery,
  useGetProjectGoalsQuery,
  useGetProjectMilestonesQuery,
  useCreateProjectGoalMutation,
  useUpdateProjectGoalMutation,
  useDeleteProjectGoalMutation,
  useCreateProjectMilestoneMutation,
  useUpdateProjectMilestoneMutation,
  useActivateProjectMilestoneMutation,
  useCompleteProjectMilestoneMutation,
  useCancelProjectMilestoneMutation,
  useDeleteProjectMilestoneMutation,
  useGetMilestoneHistoryQuery,
  useCreateWorkPriorityMutation,
  useUpdateWorkPriorityMutation,
  useCarryForwardWorkPriorityMutation,
  useSubmitWorkPriorityMutation,
  useSubmitAllWorkPrioritiesMutation,
  useApproveWorkPriorityMutation,
  useApproveAllWorkPrioritiesMutation,
  useRequestWorkPriorityResubmitMutation,
  useGetWeeklyWorkUpdateBoardQuery,
  useGetWeeklyPptAdminBoardQuery,
  useGetWeeklyPptGmSharesQuery,
  useShareWeeklyPptToGmMutation,
  useCreateWeeklyWorkUpdateUploadMutation,
  useLazyGetWeeklyWorkUpdateDownloadQuery,
  useGetJcPptBoardQuery,
  useCreateJcPptUploadMutation,
  useLazyGetJcPptDownloadQuery,
  useGetJcPptCsoBoardQuery,
  useGetJcPptGmBoardQuery,
  useTransferJcPptToGmMutation,
  useLazyGetJcPptPreviewQuery,
  useGmDownloadJcPptMutation,
  useGmEmailJcPptMutation,
  useGmDeleteJcPptMutation,
  useGmDeleteAllJcPptsMutation,
  useGmDownloadWeeklyPptMutation,
  useGmEmailWeeklyPptMutation,
  useGmDeleteWeeklyPptMutation,
  useGmDeleteAllWeeklyPptsInShareMutation,
  useCreateWorkProjectMutation,
  useGetAttendanceDayQuery,
  useGetAttendanceImportsQuery,
  useGetAttendanceImportQuery,
  useGetAttendanceImportCardQuery,
  useUploadAttendanceImportMutation,
  useDecideAttendanceReviewMutation,
  useConfirmAttendanceImportMutation,
  useRejectAttendanceImportMutation,
  useDeleteAttendanceImportMutation,
  useGetPayrollRunsQuery,
  useGetPayrollImportsQuery,
  useGetPayrollRunQuery,
  useGetPayrollPreviewQuery,
  useCalculatePayrollMutation,
  usePublishPayrollMutation,
  useGetMyPayslipsQuery,
  useGetPayslipQuery,
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useGetShiftAssignmentsQuery,
  useCreateShiftAssignmentMutation,
  useDeleteShiftAssignmentMutation,
  useGetEmployeeWorkWeekQuery,
  useSaveEmployeeWorkWeekMutation,
  useDeleteEmployeeWorkWeekMutation,
  useGetGrievancesQuery,
  useGetGrievanceCountsQuery,
  useGetGrievanceHandlersQuery,
  useGetGrievanceQuery,
  useCreateGrievanceMutation,
  useAddGrievanceCommentMutation,
  useAssignGrievanceMutation,
  useChangeGrievanceStatusMutation,
  useResolveGrievanceMutation,
  useCreateGrievanceAttachmentMutation,
  useLazyGetGrievanceAttachmentUrlQuery,
  useGetPoliciesQuery,
  useGetPolicyQuery,
  useCreatePolicyMutation,
  usePublishPolicyMutation,
  useAcknowledgePolicyMutation,
  useGetPolicyAcknowledgementsQuery,
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useSubscribeWebPushMutation,
  useUnsubscribeWebPushMutation,
  useGetReportsOverviewQuery,
} = api;
