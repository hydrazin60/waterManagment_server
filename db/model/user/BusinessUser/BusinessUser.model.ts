import mongoose, { Document, Schema, Types } from "mongoose";

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

export interface IBusinessUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "retailer" | "distributor" | "manufacturer";
  businessName: string;
  businessRegistrationNumber: string;
  businessType: string;
  taxIdentificationNumber?: string;
  businessAddress: IAddress;
  businessVerified: boolean;
  isActive: boolean;
  products?: Types.ObjectId[];
  warehouses?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BusinessUserSchema = new Schema<IBusinessUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["retailer", "distributor", "manufacturer"],
    },
    businessName: { type: String, required: true },
    businessRegistrationNumber: { type: String, required: true },
    businessType: { type: String, required: true },
    taxIdentificationNumber: { type: String },
    businessAddress: {
      district: { type: String, required: true },
      municipality: { type: String },
      city: { type: String },
      tole: { type: String },
      nearFamousPlace: { type: String },
      country: { type: String, default: "Nepal" },
      province: { type: String, required: true },
      zip: { type: String, required: true },
      coordinates: { type: [Number] },
    },
    businessVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    products: [{ type: Types.ObjectId, ref: "Product" }],
    warehouses: [{ type: Types.ObjectId, ref: "Warehouse" }],
  },
  { timestamps: true }
);

export const BusinessUser = mongoose.model<IBusinessUser>(
  "BusinessUser",
  BusinessUserSchema
);