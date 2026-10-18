import { z } from 'zod';
import { tripCategories } from './ledger';
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => !Number.isNaN(Date.parse(s)) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s, 'Enter a valid date');
const amount = z.number().int().min(1).max(100000000000), nonnegative = z.number().int().min(0).max(100000000000), ref = z.string().min(1).max(100), notes = z.string().max(2000).optional().default('');
const shared = { id: ref, version: z.number().int().optional(), notes };
const trip = z.object({ ...shared, kind: z.literal('trip'), name: z.string().min(1).max(150), customer: z.string().max(150).default(''), phone: z.string().max(30).default(''), vehicleId: ref, start: date, end: date, odoStart: z.number().nonnegative(), odoEnd: z.number().nonnegative().nullable(), amount: nonnegative, status: z.enum(['upcoming', 'in_progress', 'completed', 'cancelled']), opening: z.boolean().optional() }).superRefine((t, c) => { if (t.end < t.start)
    c.addIssue({ code: 'custom', message: 'End date must be on or after start date' }); if (t.odoEnd != null && t.odoEnd < t.odoStart)
    c.addIssue({ code: 'custom', message: 'Ending odometer must be at least the starting reading' }); if (t.status === 'completed' && t.odoEnd == null && !t.opening)
    c.addIssue({ code: 'custom', message: 'Enter ending odometer to complete the trip' }); });
const expense = z.object({ ...shared, kind: z.literal('expense'), category: z.enum(['diesel', 'driver', 'permit', 'tripOther', 'insurance', 'roadTax', 'emi', 'fine', 'maintenance', 'other']), description: z.string().min(1).max(200), amount, date, expenseMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(), paymentDate: date.optional(), paid: z.boolean(), tripId: ref.optional(), vehicleId: ref.optional(), loanId: ref.optional(), installment: z.number().int().min(0).optional(), principal: nonnegative.nullable().optional(), interest: nonnegative.nullable().optional(), dueDate: date.optional(), nextDue: date.optional(), repeat: z.enum(['none', 'monthly', 'fortnightly', 'quarterly', 'yearly']).optional(), linkedDueId: ref.optional() }).superRefine((e, c) => { if (tripCategories.includes(e.category) && e.category !== 'fine' && !e.tripId)
    c.addIssue({ code: 'custom', message: 'Select a trip for this expense' }); if (e.category === 'emi' && (!e.loanId || e.installment == null))
    c.addIssue({ code: 'custom', message: 'Select a loan and instalment' }); if (e.category === 'emi' && e.paid === false)
    c.addIssue({ code: 'custom', message: 'Record an actual EMI payment; the loan already tracks its schedule.' }); if (e.principal != null && e.interest != null && e.principal + e.interest !== e.amount)
    c.addIssue({ code: 'custom', message: 'Principal and interest must add up to the EMI payment' }); if (e.nextDue && e.nextDue <= e.date)
    c.addIssue({ code: 'custom', message: 'Next due date must be after the expense date' }); });
export const entrySchema = z.union([trip, expense,
    z.object({ ...shared, kind: z.literal('payment'), tripId: ref, amount, date, type: z.enum(['receipt', 'refund']), method: z.enum(['UPI', 'Bank transfer', 'Cash', 'Other']) }),
    z.object({ ...shared, kind: z.literal('partner'), name: z.string().min(1).max(100), openingAmount: nonnegative }),
    z.object({ ...shared, kind: z.literal('partnerTx'), partnerId: ref, amount, date, type: z.enum(['contribution', 'repayment', 'distribution']) }),
    z.object({ ...shared, kind: z.literal('loan'), name: z.string().min(1).max(120), vehicleId: ref, planType: z.enum(['vehicle', 'purchase']).optional(), downPayment: nonnegative.optional(), downPaymentDate: date.optional(), start: date, firstDue: date, emi: amount, total: z.number().int().min(1).max(600), openingPaid: z.number().int().min(0), principal: nonnegative.nullable().optional() }).superRefine((l, c) => { if (l.downPayment && !l.downPaymentDate) c.addIssue({ code: 'custom', message: 'Enter the down payment date' }); if (l.openingPaid > l.total)
        c.addIssue({ code: 'custom', message: 'Paid instalments cannot exceed total instalments' }); if (l.firstDue < l.start)
        c.addIssue({ code: 'custom', message: 'First EMI cannot be before loan start' }); }),
    z.object({ ...shared, kind: z.literal('vehicle'), name: z.string().min(1).max(100), registration: z.string().min(1).max(30) }),
    z.object({ ...shared, kind: z.literal('due'), name: z.string().min(1).max(150), category: z.enum(['insurance', 'roadTax', 'fine', 'maintenance', 'other']), amount, dueDate: date, vehicleId: ref.optional(), repeat: z.enum(['none', 'monthly', 'fortnightly', 'quarterly', 'yearly']), paidDate: date.optional() }),
]);
export const settingsSchema = z.object({ name: z.string().min(1).max(100), startDate: date, openingCash: z.number().int().min(-100000000000).max(100000000000), reserve: nonnegative });
export const memberSchema = z.object({ email: z.string().email().transform(x => x.trim().toLowerCase()), name: z.string().min(1).max(100), role: z.enum(['owner', 'partner']), active: z.number().int().min(0).max(1) });
