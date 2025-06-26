import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== INTERFACES ======================

interface IExpenseItem {
  description: string; // e.g., "Diesel purchase", "Office rent"
  category: "transport" | "rent" | "utilities" | "supplies" | "salary" | "maintenance" | "other";
  amount: number;
  taxRate?: number; // Optional VAT
  vendor?: string; // Optional vendor name
}

interface IExpensePayment {
  paymentMethod: "cash" | "bankTransfer" | "eSewa" | "khalti" | "card" | "cheque";
  amountPaid: number;
  transactionId?: string;
  paymentDate: Date;
  status: "pending" | "completed" | "failed";
}

export interface IExpenseInvoice extends Document {
  invoiceNumber: string;
  referenceId?: string; // Optional external reference
  branch: Types.ObjectId;
  company: Types.ObjectId;

  // Expense Details
  items: IExpenseItem[];
  subtotal: number;
  totalTax: number;
  totalAmount: number;
  purpose: string; // Summary (e.g., "Monthly fuel purchase")
  expenseDate: Date;

  // Payment Info
  payments: IExpensePayment[];
  amountPaid: number;
  balanceDue: number;
  paymentStatus: "unpaid" | "partial" | "paid";

  // Optional Info
  vendorName?: string;
  notes?: string;

  // Metadata
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ====================== SUB-SCHEMAS ======================

const ExpenseItemSchema = new Schema<IExpenseItem>({
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ["transport", "rent", "utilities", "supplies", "salary", "maintenance", "other"],
    required: true,
  },
  amount: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  vendor: { type: String },
});

const ExpensePaymentSchema = new Schema<IExpensePayment>({
  paymentMethod: {
    type: String,
    enum: ["cash", "bankTransfer", "eSewa", "khalti", "card", "cheque"],
    required: true,
  },
  amountPaid: { type: Number, required: true },
  transactionId: { type: String },
  paymentDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
});

// ====================== MAIN SCHEMA ======================

const ExpenseInvoiceSchema = new Schema<IExpenseInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    referenceId: { type: String },

    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    company: { type: Schema.Types.ObjectId, ref: "Company", required: true },

    items: { type: [ExpenseItemSchema], required: true },
    subtotal: { type: Number, required: true },
    totalTax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    purpose: { type: String, required: true },
    expenseDate: { type: Date, default: Date.now },

    payments: [ExpensePaymentSchema],
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },

    vendorName: { type: String },
    notes: { type: String },

    createdBy: { type: Schema.Types.ObjectId, ref: "BusinessUser", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "BusinessUser" },
  },
  { timestamps: true }
);

// ====================== PRE-SAVE HOOK ======================

ExpenseInvoiceSchema.pre<IExpenseInvoice>("save", function (next) {
  this.balanceDue = this.totalAmount - this.amountPaid;

  if (this.balanceDue <= 0) {
    this.paymentStatus = "paid";
  } else if (this.amountPaid > 0) {
    this.paymentStatus = "partial";
  } else {
    this.paymentStatus = "unpaid";
  }

  next();
});

// ====================== INDEXES ======================
ExpenseInvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
ExpenseInvoiceSchema.index({ company: 1, branch: 1 });
ExpenseInvoiceSchema.index({ paymentStatus: 1 });
ExpenseInvoiceSchema.index({ expenseDate: 1 });

// ====================== MODEL ======================

export const ExpenseInvoice = mongoose.model<IExpenseInvoice>(
  "ExpenseInvoice",
  ExpenseInvoiceSchema
);
