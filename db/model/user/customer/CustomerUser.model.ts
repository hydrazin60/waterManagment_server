import mongoose, { Document, Schema, Types } from "mongoose";

// ====================== ADDRESS INTERFACE ======================
interface IAddress {
  district: string;
  tole?: string;
  nearFamousPlace?: string;
  country?: string;
  province?: string;
  coordinates?: [number, number];
}

// ====================== CUSTOMER USER ======================
export interface ICustomerUser extends Document {
  name?: string;
  email: string;
  password: string;
  phone?: string;
  accountType: "customer";
  role?: "new" | "occasional" | "regular" | "loyal";
  address?: IAddress;
  isActive: boolean;
  loyaltyPoints?: number;
  orders?: Types.ObjectId[];
  referBy?: Types.ObjectId;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  gifts?: Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  referralCount?: Types.ObjectId[];
  chats?: Types.ObjectId[];
}

const CustomerUserSchema = new Schema<ICustomerUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true },
    accountType: { type: String, default: "customer", enum: ["customer"] },
    role: {
      type: String,
      enum: ["new", "occasional", "regular", "loyal"],
      default: "new",
    },
    address: {
      district: { type: String },
      tole: { type: String },
      nearFamousPlace: { type: String },
      country: { type: String, default: "Nepal" },
      province: { type: String, default: "Bagmati" },
      zip: { type: String },
      coordinates: { type: [Number] },
    },
    isActive: { type: Boolean, default: true },
    loyaltyPoints: { type: Number, default: 0 },
    orders: [{ type: Types.ObjectId, ref: "Order" }],
    isVerified: { type: Boolean, default: false },
    referBy: { type: Types.ObjectId, ref: "CustomerUser" },
    gifts: [{ type: Types.ObjectId, ref: "Gift" }],
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    referralCount: [{ type: Types.ObjectId, ref: "CustomerUser" }],
    chats: [{ type: Types.ObjectId, ref: "Chat" }],
  },
  { timestamps: true }
);

export const CustomerUser = mongoose.model<ICustomerUser>(
  "CustomerUser",
  CustomerUserSchema
);

export default CustomerUser;
