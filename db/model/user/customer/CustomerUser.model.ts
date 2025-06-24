import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== ADDRESS INTERFACE ======================
interface IAddress {
  district: string;
  municipality?: string;
  city?: string;
  tole?: string;
  nearFamousPlace?: string;
  country: string;
  province: string;
  zip: string;
  coordinates?: [number, number];
}

// ====================== CUSTOMER USER ======================
export interface ICustomerUser extends Document {
  name?: string;
  email: string;
  password: string;
  phone?: string;
  role: "customer";
  customerType?: "new" | "occasional" | "regular" | "loyal";
  address?: IAddress;
  isActive: boolean;
  loyaltyPoints?: number;
  orders?: Types.ObjectId[];
  referBy?: Types.ObjectId;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  gifts?: Types.ObjectId[];
}

const CustomerUserSchema = new Schema<ICustomerUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true },
    role: { type: String, default: "customer", enum: ["customer"] },
    customerType: {
      type: String,
      enum: ["new", "occasional", "regular", "loyal"],
    },
    address: {
      district: { type: String },
      municipality: { type: String },
      city: { type: String },
      tole: { type: String },
      nearFamousPlace: { type: String },
      country: { type: String, default: "Nepal" },
      province: { type: String },
      zip: { type: String },
      coordinates: { type: [Number] },
    },
    isActive: { type: Boolean, default: true },
    loyaltyPoints: { type: Number, default: 0 },
    orders: [{ type: Types.ObjectId, ref: "Order" }],
    isVerified: { type: Boolean, default: false },
    referBy: { type: Types.ObjectId, ref: "CustomerUser" },
    gifts: [{ type: Types.ObjectId, ref: "Gift" }],
  },
  { timestamps: true }
);

export const CustomerUser = mongoose.model<ICustomerUser>(
  "CustomerUser",
  CustomerUserSchema
);

export default CustomerUser;
