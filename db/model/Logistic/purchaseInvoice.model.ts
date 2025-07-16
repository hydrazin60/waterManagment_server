import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== INTERFACES ======================
interface IInvoiceItem {
  itemType: "rawMaterial" | "packaging" | "equipment" | "other";
  item: Types.ObjectId; // Reference to RawMaterial, FinishedProduct, or Equipment
  itemModel: "RawMaterial" | "FinishedProduct" | "Equipment";
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discount: number;
  totalAmount: number;
  batchNumber?: string; // For raw materials
  expiryDate?: Date; // For perishable items
  waterQualityParams?: {
    phLevel?: number;
    tdsLevel?: number;
    turbidity?: number;
  };
}

interface IPaymentInfo {
  paymentMethod: "cash" | "cheque" | "bankTransfer" | "digitalWallet";
  paymentDate?: Date;
  amountPaid: number;
  dueDate: Date;
  bankTransactionRef?: string;
  digitalWalletRef?: string;
  chequeNumber?: string;
}

interface IShipmentInfo {
  deliveryDate: Date;
  carrier?: string;
  trackingNumber?: string;
  receivedBy: Types.ObjectId; // Reference to Worker
  storageLocation: Types.ObjectId; // Reference to WarehouseLocation
  transportConditions?: {
    temperature?: string;
    humidity?: string;
  };
}

// ====================== PURCHASE INVOICE SCHEMA ======================
export interface IPurchaseInvoice extends Document {
  // Invoice Identification
  invoiceNumber: string;
  ownInvoiceNumber: string; // Internal reference number
  supplierInvoiceNumber?: string;
  isProforma: boolean;

  // Supplier Information
  supplier: Types.ObjectId; // Reference to Supplier or Company
  supplierModel: "Supplier" | "Company";
  supplierContactPerson?: string;
  supplierContactPhone?: string;

  // Company Information
  company: Types.ObjectId; // Reference to Company
  branch: Types.ObjectId; // Reference to Branch
  department?: string;

  // Transaction Details
  invoiceDate: Date;
  deliveryDate: Date;
  dueDate: Date;
  paymentTerms: string;
  currency: string;
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  shippingCost: number;
  otherCharges: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;

  // Items Purchased
  items: IInvoiceItem[];

  // Water-Specific Purchases
  waterTestReports?: string[]; // Links to test reports
  certificationDocuments?: string[]; // Links to certs

  // Payment Information
  payments: IPaymentInfo[];
  paymentStatus: "unpaid" | "partial" | "paid" | "overdue";

  // Shipping/Receiving
  shipment: IShipmentInfo;
  isReceived: boolean;
  receiptNotes?: string;

  // Quality Control
  qualityCheck?: {
    passed: boolean;
    checkedBy: Types.ObjectId; // Reference to Worker
    checkDate: Date;
    notes?: string;
  };

  // Approval Workflow
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId; // Reference to BusinessUser
  approvalDate?: Date;

  // Metadata
  createdBy: Types.ObjectId; // Reference to BusinessUser
  updatedBy?: Types.ObjectId; // Reference to BusinessUser
  notes?: string;
}

// ====================== SUB-SCHEMAS ======================
const InvoiceItemSchema = new Schema<IInvoiceItem>({
  itemType: {
    type: String,
    required: true,
    enum: ["rawMaterial", "packaging", "equipment", "other"],
  },
  item: {
    type: Schema.Types.ObjectId,
    refPath: "items.itemModel",
    required: true,
  },
  itemModel: {
    type: String,
    required: true,
    enum: ["RawMaterial", "FinishedProduct", "Equipment"],
  },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 13 }, // Default VAT rate for Nepal
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  batchNumber: { type: String },
  expiryDate: { type: Date },
  waterQualityParams: {
    phLevel: { type: Number },
    tdsLevel: { type: Number },
    turbidity: { type: Number },
  },
});

const PaymentInfoSchema = new Schema<IPaymentInfo>({
  paymentMethod: {
    type: String,
    required: true,
    enum: ["cash", "cheque", "bankTransfer", "digitalWallet"],
  },
  paymentDate: { type: Date },
  amountPaid: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  bankTransactionRef: { type: String },
  digitalWalletRef: { type: String },
  chequeNumber: { type: String },
});

const ShipmentInfoSchema = new Schema<IShipmentInfo>({
  deliveryDate: { type: Date, required: true },
  carrier: { type: String },
  trackingNumber: { type: String },
  receivedBy: {
    type: Schema.Types.ObjectId,
    ref: "Worker",
    required: true,
  },
  storageLocation: {
    type: Schema.Types.ObjectId,
    ref: "WarehouseLocation",
    required: true,
  },
  transportConditions: {
    temperature: { type: String },
    humidity: { type: String },
  },
});

const QualityCheckSchema = new Schema({
  passed: { type: Boolean, required: true },
  checkedBy: {
    type: Schema.Types.ObjectId,
    ref: "Worker",
    required: true,
  },
  checkDate: { type: Date, required: true },
  notes: { type: String },
});

// ====================== MAIN SCHEMA ======================
const PurchaseInvoiceSchema = new Schema<IPurchaseInvoice>(
  {
    // Invoice Identification
    invoiceNumber: { type: String, required: true },
    ownInvoiceNumber: { type: String, required: true, unique: true },
    supplierInvoiceNumber: { type: String },
    isProforma: { type: Boolean, default: false },

    // Supplier Information
    supplier: {
      type: Schema.Types.ObjectId,
      refPath: "supplierModel",
      required: true,
    },
    supplierModel: {
      type: String,
      required: true,
      enum: ["Supplier", "Company"],
    },
    supplierContactPerson: { type: String },
    supplierContactPhone: { type: String },

    // Company Information
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
    department: { type: String },

    // Transaction Details
    invoiceDate: { type: Date, required: true, default: Date.now },
    deliveryDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    paymentTerms: { type: String, default: "Immediate" },
    currency: { type: String, default: "NPR" },
    subtotal: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalDiscount: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true },

    // Items Purchased
    items: [InvoiceItemSchema],

    // Water-Specific Purchases
    waterTestReports: [{ type: String }],
    certificationDocuments: [{ type: String }],

    // Payment Information
    payments: [PaymentInfoSchema],
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overdue"],
      default: "unpaid",
    },

    // Shipping/Receiving
    shipment: { type: ShipmentInfoSchema, required: true },
    isReceived: { type: Boolean, default: false },
    receiptNotes: { type: String },

    // Quality Control
    qualityCheck: { type: QualityCheckSchema },

    // Approval Workflow
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "BusinessUser" },
    approvalDate: { type: Date },

    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "BusinessUser",
      required: true,
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "BusinessUser" },
    notes: { type: String },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
PurchaseInvoiceSchema.index({ ownInvoiceNumber: 1 }, { unique: true });
PurchaseInvoiceSchema.index({ invoiceNumber: 1, supplier: 1 });
PurchaseInvoiceSchema.index({ supplier: 1 });
PurchaseInvoiceSchema.index({ branch: 1 });
PurchaseInvoiceSchema.index({ invoiceDate: 1 });
PurchaseInvoiceSchema.index({ dueDate: 1 });
PurchaseInvoiceSchema.index({ paymentStatus: 1 });
PurchaseInvoiceSchema.index({ approvalStatus: 1 });
PurchaseInvoiceSchema.index({ "items.item": 1 });
PurchaseInvoiceSchema.index({ "shipment.receivedBy": 1 });

// ====================== HOOKS ======================
PurchaseInvoiceSchema.pre<IPurchaseInvoice>("save", function (next) {
  // Calculate balance due before saving
  this.balanceDue = this.grandTotal - this.amountPaid;

  // Update payment status
  if (this.balanceDue <= 0) {
    this.paymentStatus = "paid";
  } else if (this.amountPaid > 0) {
    this.paymentStatus = "partial";
  } else if (new Date() > this.dueDate) {
    this.paymentStatus = "overdue";
  } else {
    this.paymentStatus = "unpaid";
  }

  next();
});

// ====================== MODEL ======================
export const PurchaseInvoice = mongoose.model<IPurchaseInvoice>(
  "PurchaseInvoice",
  PurchaseInvoiceSchema
);
