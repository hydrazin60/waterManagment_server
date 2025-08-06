import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== INTERFACES ======================

interface IAddress {
  district: string;
  tole?: string;
}

interface IPaymentInfo {
  paymentMethod:
    | "cash"
    | "card"
    | "bankTransfer"
    | "eSewa"
    | "khalti"
    | "credit";
  amountPaid: number;
  transactionId?: string;
  paymentDate?: Date;
  dueDate?: Date; // For credit payments
  isTotalPaid?: boolean;
  remainingAmount?: number;
  status: "pending" | "completed" | "failed" | "refunded";
}

interface ISalesInvoiceItem {
  product: Types.ObjectId; // Reference to FinishedProduct
  variantIndex: number; // Refers to variants array in FinishedProduct
  batchNumber?: string; // For batch tracking
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate?: number; // Nepal VAT
  discount?: number;
  totalAmount: number;
  waterQualityAtSale?: {
    phLevel?: number;
    tdsLevel?: number;
  };
}

// ====================== SALES INVOICE SCHEMA ======================
export interface ISalesInvoice extends Document {
  // **Invoice Identification**
  invoiceNumber: string; // Auto-generated (e.g., "WF-2023-001")
  customInvoiceId?: Types.ObjectId; // For external reference
  orderId?: Types.ObjectId; // Reference to SalesOrder (if applicable)

  // **Customer Information**
  customer: Types.ObjectId; // CustomerUser or Company
  customerModel: "CustomerUser" | "Company";
  customerName: string;
  customerPhone: string;
  customerAddress?: IAddress; // From Customer schema
  customerEmail?: string;

  // **Company & Branch Details**
  company: Types.ObjectId; // Reference to Company (Water Factory)
  branch: Types.ObjectId; // Reference to Branch
  salesPerson?: Types.ObjectId; // Reference to Worker/Sales Agent

  // **Invoice Details**
  invoiceDate: Date;
  dueDate?: Date; // For credit sales
  paymentTerms: "cash" | "7days" | "15days" | "30days";
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  deliveryCharge: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  expectedBalancePaymentDate?: Date;
  paymentStatus: "unpaid" | "partial" | "paid" | "overdue";

  // **Items Sold (Water Products)**
  items: ISalesInvoiceItem[];

  // **Payment Tracking**
  payments: IPaymentInfo[];

  // **Delivery Information**
  isDelivered: boolean;

  // **Water-Specific Fields**
  waterTestReport?: string; // Link to quality report (if applicable)
  returnableContainers?: {
    // For bottle/jar returns
    containerType: "jar" | "bottle" | "dispenser";
    quantity: number;
    depositRefunded?: number;
  }[];

  // **Approval & Status**
  status: "draft" | "confirmed" | "shipped" | "completed" | "cancelled";
  notes?: string;
  cancellationReason?: string;

  // **Metadata**
  createdBy: Types.ObjectId; // Reference to BusinessUser
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ====================== SUB-SCHEMAS ======================
const SalesInvoiceItemSchema = new Schema<ISalesInvoiceItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "FinishedProduct",
    required: true,
  },
  variantIndex: { type: Number, required: true },
  batchNumber: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 13 }, // Nepal VAT
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  waterQualityAtSale: {
    phLevel: { type: Number },
    tdsLevel: { type: Number },
  },
});

const PaymentInfoSchema = new Schema<IPaymentInfo>({
  paymentMethod: {
    type: String,
    required: true,
    enum: ["cash", "card", "bankTransfer", "eSewa", "khalti", "credit"],
  },
  amountPaid: { type: Number, required: true },
  transactionId: { type: String },
  paymentDate: { type: Date },
  dueDate: { type: Date }, // For credit sales
  isTotalPaid: { type: Boolean },
  remainingAmount: { type: Number },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
});

const ReturnableContainersSchema = new Schema({
  containerType: {
    type: String,
    enum: ["jar", "bottle", "dispenser"],
    required: true,
  },
  quantity: { type: Number, required: true },
  depositRefunded: { type: Number },
});

// ====================== MAIN SCHEMA ======================
const SalesInvoiceSchema = new Schema<ISalesInvoice>(
  {
    // **Invoice Identification**
    invoiceNumber: { type: String, required: true, unique: true },
    customInvoiceId: { type: Schema.Types.ObjectId },
    orderId: { type: Schema.Types.ObjectId, ref: "SalesOrder" },

    // **Customer Information**
    customer: {
      type: Schema.Types.ObjectId,
      refPath: "customerModel",
      required: true,
    },
    customerModel: {
      type: String,
      required: true,
      enum: ["CustomerUser", "Company"],
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: {
      district: { type: String },
      municipality: { type: String },
      tole: { type: String },
      province: { type: String },
    },
    customerEmail: { type: String },

    // **Company & Branch Details**
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    salesPerson: { type: Schema.Types.ObjectId, ref: "Worker" },

    // **Invoice Details**
    invoiceDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    paymentTerms: {
      type: String,
      enum: ["cash", "7days", "15days", "30days"],
      default: "cash",
    },
    subtotal: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true },
    expectedBalancePaymentDate: { type: Date },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overdue"],
      default: "unpaid",
    },

    // **Items Sold (Water Products)**
    items: [SalesInvoiceItemSchema],

    // **Payment Tracking**
    payments: [PaymentInfoSchema],

    isDelivered: { type: Boolean, default: false },

    // **Water-Specific Fields**
    waterTestReport: { type: String },
    returnableContainers: [ReturnableContainersSchema],

    // **Approval & Status**
    status: {
      type: String,
      enum: ["draft", "confirmed", "shipped", "completed", "cancelled"],
      default: "draft",
    },
    notes: { type: String },
    cancellationReason: { type: String },

    // **Metadata**
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "BusinessUser" },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
SalesInvoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
SalesInvoiceSchema.index({ customer: 1 });
SalesInvoiceSchema.index({ company: 1, branch: 1 });
SalesInvoiceSchema.index({ "items.product": 1 });
SalesInvoiceSchema.index({ paymentStatus: 1 });
SalesInvoiceSchema.index({ status: 1 });
SalesInvoiceSchema.index({ invoiceDate: 1 });

// ====================== PRE-SAVE HOOK ======================
SalesInvoiceSchema.pre<ISalesInvoice>("save", function (next) {
  // Auto-calculate balance due
  this.balanceDue = this.grandTotal - this.amountPaid;

  // Update payment status
  if (this.balanceDue <= 0) {
    this.paymentStatus = "paid";
  } else if (this.amountPaid > 0) {
    this.paymentStatus = "partial";
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.paymentStatus = "overdue";
  } else {
    this.paymentStatus = "unpaid";
  }

  next();
});

// ====================== MODEL ======================
export const SalesInvoice = mongoose.model<ISalesInvoice>(
  "SalesInvoice",
  SalesInvoiceSchema
);
