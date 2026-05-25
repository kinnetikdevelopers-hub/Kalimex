// ─── Kalimex Role Permission System ──────────────────────────────────────────
// Clear separation between what a bursar vs school admin can do

export type UserRole = 'super_admin' | 'school_admin' | 'bursar' | 'parent' | 'receptionist'

export const can = (role: UserRole | undefined) => ({
  // Fee structure — only admin can set/change fees
  editFeeStructure:    role === 'school_admin' || role === 'super_admin',
  // Invoices
  generateInvoices:    role === 'school_admin' || role === 'super_admin',
  waiveInvoice:        role === 'school_admin' || role === 'super_admin',
  // Expenses
  submitExpense:       role === 'bursar' || role === 'school_admin' || role === 'super_admin',
  approveExpense:      role === 'school_admin' || role === 'super_admin', // bursar CANNOT approve their own expenses
  // Discounts
  applyDiscount:       role === 'school_admin' || role === 'super_admin',
  removeDiscount:      role === 'school_admin' || role === 'super_admin',
  configureSiblingEngine: role === 'school_admin' || role === 'super_admin',
  // Payments — bursar can record, admin can also reverse
  recordPayment:       role !== 'parent',
  reversePayment:      role === 'school_admin' || role === 'super_admin',
  // Staff management
  addStaff:            role === 'school_admin' || role === 'super_admin',
  removeStaff:         role === 'school_admin' || role === 'super_admin',
  // Settings
  editSchoolProfile:   role === 'school_admin' || role === 'super_admin',
  editSmsSettings:     role === 'school_admin' || role === 'super_admin',
  editTermCalendar:    role === 'school_admin' || role === 'super_admin',
  // Reports
  viewFullReports:     role === 'school_admin' || role === 'super_admin',
  viewAuditLog:        role === 'school_admin' || role === 'super_admin',
  // Petty cash
  issuePettyCash:      role === 'school_admin' || role === 'super_admin',
  accountPettyCash:    role === 'school_admin' || role === 'super_admin',
  // Instalment plans
  createInstalmentPlan: role === 'bursar' || role === 'school_admin' || role === 'super_admin',
  cancelInstalmentPlan: role === 'school_admin' || role === 'super_admin',
})

// Human-readable role label
export const roleLabel: Record<UserRole, string> = {
  super_admin:  'Super Admin',
  school_admin: 'School Admin / Principal',
  bursar:       'Bursar',
  parent:       'Parent',
  receptionist: 'Receptionist',
}

// Role description shown in settings
export const roleDescription: Record<UserRole, string> = {
  super_admin:  'Full platform access across all schools',
  school_admin: 'Full school access — approve expenses, manage fees, staff, and all settings',
  bursar:       'Day-to-day finance — record payments, manage invoices, submit expenses for approval',
  parent:       'View balance, make payments, download receipts',
  receptionist: 'Record walk-in cash and cheque payments only',
}
