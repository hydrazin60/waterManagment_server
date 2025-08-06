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
  batchNumber?: string; // optional, for raw materials
  expiryDate?: Date; // optional, for perishable items
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
  receivedBy: Types.ObjectId; // Worker reference
  storageLocation: Types.ObjectId; // WarehouseLocation reference
  transportConditions?: {
    temperature?: string;
    humidity?: string;
  };
}

export interface IPurchaseInvoice extends Document {
  invoiceNumber: string; // Invoice number from supplier
  ownInvoiceNumber: string; // Internal invoice number, unique
  supplier: Types.ObjectId;
  supplierName: string; // Supplier reference (Supplier model)
  supplierModel: "Supplier" | "Company";
  branch: Types.ObjectId; // Branch reference (Branch model)
  department?: string; // Optional

  invoiceDate: Date;
  deliveryDate: Date;
  dueDate: Date;
  paymentTerms: string; // e.g., "Net 15", "Immediate"

  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  shippingCost: number;
  otherCharges: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;

  items: IInvoiceItem[];

  payments: IPaymentInfo[];
  paymentStatus: "unpaid" | "partial" | "paid" | "overdue";

  shipment: IShipmentInfo;
  isReceived: boolean;
  receiptNotes?: string;
  expectedBalancePaymentDate: Date;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedBy?: Types.ObjectId; // BusinessUser reference
  approvalDate?: Date;

  createdBy: Types.ObjectId; // BusinessUser reference
  updatedBy?: Types.ObjectId; // BusinessUser reference
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
  taxRate: { type: Number, default: 13 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  batchNumber: { type: String },
  expiryDate: { type: Date },
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
    ref: "WarehouseLocation", // ✅ Correct if it's a separate model
    required: true,
  },
  transportConditions: {
    temperature: { type: String },
    humidity: { type: String },
  },
});

// ====================== MAIN SCHEMA ======================
const PurchaseInvoiceSchema = new Schema<IPurchaseInvoice>(
  {
    invoiceNumber: { type: String, required: true },
    ownInvoiceNumber: { type: String, required: true, unique: true },

    supplier: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "supplierModel",
    },
    supplierModel: {
      type: String,
      required: true,
      enum: ["Supplier", "Company"],
    },
    branch: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    supplierName: { type: String, required: true },
    department: { type: String },

    invoiceDate: { type: Date, required: true, default: Date.now },
    deliveryDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    paymentTerms: { type: String, default: "Immediate" },

    subtotal: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalDiscount: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true },
    expectedBalancePaymentDate: { type: Date },
    items: [InvoiceItemSchema],

    payments: [PaymentInfoSchema],
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overdue"],
      default: "unpaid",
    },

    shipment: { type: ShipmentInfoSchema, required: true },
    isReceived: { type: Boolean, default: false },
    receiptNotes: { type: String },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "BusinessUser" },
    approvalDate: { type: Date },

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
  this.balanceDue = this.grandTotal - this.amountPaid;

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
