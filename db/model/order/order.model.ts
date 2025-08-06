import { Document, Types } from "mongoose";

// ====================== CORE TYPES ======================
interface IOrderItem {
  product: Types.ObjectId; // Ref: FinishedProduct.variants
  variantIndex: number; // Index in product.variants array
  quantity: number;
  unitPrice: number; // Snapshot of price at order time
  taxRate: number; // VAT 13% for Nepal
  discount: number; // Percentage or fixed amount
}

interface IDeliveryAddress {
  district: string;
  municipality: string;
  streetAddress: string;
  landmark?: string;
  gpsCoordinates?: [number, number]; // [longitude, latitude]
  contactPhone: string;
}

interface IPaymentInfo {
  method: "cash" | "esewa" | "khalti" | "credit";
  transactionId?: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  paidAt?: Date;
}

interface IDeliveryLog {
  status: "dispatched" | "in_transit" | "delivered" | "failed";
  timestamp: Date;
  location?: [number, number];
  notes?: string;
  handledBy: Types.ObjectId; // Ref: Admin/DeliveryPerson
}

// ====================== MAIN ORDER INTERFACE ======================
export interface IOrder extends Document {
  orderId: string; // Custom format: "ORD-2024-08-001"
  customer: Types.ObjectId; // Ref: Customer
  items: IOrderItem[];
  totalAmount: number;
  deliveryAddress: IDeliveryAddress;
  payment: IPaymentInfo;
  delivery: {
    logs: IDeliveryLog[];
    assignedDriver?: Types.ObjectId; // Ref: Admin/DeliveryPerson
    vehicleNumber?: string;
    estimatedDelivery: Date;
    actualDelivery?: Date;
  };
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  specialInstructions?: string;
  company: Types.ObjectId; // Ref: Company (for multi-tenant)
  branch: Types.ObjectId; // Ref: Branch
  createdAt: Date;
  updatedAt: Date;
}

// ====================== CORE TYPES ======================
interface IOrderItem {
  product: Types.ObjectId; // Ref: FinishedProduct.variants
  variantIndex: number; // Index in product.variants array
  quantity: number;
  unitPrice: number; // Snapshot of price at order time
  taxRate: number; // VAT 13% for Nepal
  discount: number; // Percentage or fixed amount
}

interface IDeliveryAddress {
  district: string;
  municipality: string;
  streetAddress: string;
  landmark?: string;
  gpsCoordinates?: [number, number]; // [longitude, latitude]
  contactPhone: string;
}

interface IPaymentInfo {
  method: "cash" | "esewa" | "khalti" | "credit";
  transactionId?: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  paidAt?: Date;
}

interface IDeliveryLog {
  status: "dispatched" | "in_transit" | "delivered" | "failed";
  timestamp: Date;
  location?: [number, number];
  notes?: string;
  handledBy: Types.ObjectId; // Ref: Admin/DeliveryPerson
}

// ====================== MAIN ORDER INTERFACE ======================
export interface IOrder extends Document {
  orderId: string; // Custom format: "ORD-2024-08-001"
  customer: Types.ObjectId; // Ref: Customer
  items: IOrderItem[];
  totalAmount: number;
  deliveryAddress: IDeliveryAddress;
  payment: IPaymentInfo;
  delivery: {
    logs: IDeliveryLog[];
    assignedDriver?: Types.ObjectId; // Ref: Admin/DeliveryPerson
    vehicleNumber?: string;
    estimatedDelivery: Date;
    actualDelivery?: Date;
  };
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  specialInstructions?: string;
  company: Types.ObjectId; // Ref: Company (for multi-tenant)
  branch: Types.ObjectId; // Ref: Branch
  createdAt: Date;
  updatedAt: Date;
}
