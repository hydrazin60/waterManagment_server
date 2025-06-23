import mongoose, { Document, Schema, Types } from "mongoose";

interface IAdminAccess {
  dashboard: boolean;
  userManagement: boolean;
  businessApproval: boolean;
  contentModeration: boolean;
  analytics: boolean;
  settings: boolean;
  supportTickets: boolean;
  productManagement: boolean;
  orderManagement: boolean;
  paymentManagement: boolean;
}

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "superadmin" | "admin" | "moderator" | "support" | "developer";
  isActive: boolean;
  lastLogin?: Date;
  lastLogout?: Date;
  loginIP?: string;
  permissions: IAdminAccess;
  twoFactorEnabled: boolean;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  // Relations
  managedBusinesses?: Types.ObjectId[]; // Businesses this admin oversees
  createdBy?: Types.ObjectId; // For tracking admin creation hierarchy
}

const AdminAccessSchema = new Schema<IAdminAccess>({
  dashboard: { type: Boolean, default: true },
  userManagement: { type: Boolean, default: false },
  businessApproval: { type: Boolean, default: false },
  contentModeration: { type: Boolean, default: false },
  analytics: { type: Boolean, default: false },
  settings: { type: Boolean, default: false },
  supportTickets: { type: Boolean, default: false },
  productManagement: { type: Boolean, default: false },
  orderManagement: { type: Boolean, default: false },
  paymentManagement: { type: Boolean, default: false },
});

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["superadmin", "admin", "moderator", "support"],
      default: "admin",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    lastLogout: { type: Date },
    loginIP: { type: String },
    permissions: { type: AdminAccessSchema, default: () => ({}) },
    twoFactorEnabled: { type: Boolean, default: false },
    profileImage: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    managedBusinesses: [{ type: Types.ObjectId, ref: "BusinessUser" }],
    createdBy: { type: Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

// Indexes for faster queries
AdminSchema.index({ email: 1, role: 1, isActive: 1 });

export const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
