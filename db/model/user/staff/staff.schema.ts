import mongoose, { Document, Schema, Types } from "mongoose";

export interface IStaff extends Document {
  name?: string;
  email: string;
  phone: string;
  age: number;
  password: string;
  phoneNumber?: string;
  accountType?: "staff";
  role: Array<
    | "manager"
    | "ceo"
    | "cbo"
    | "HR"
    | "director"
    | "accountent"
    | "cleaner"
    | "driver"
    | "marketer"
    | "factoryWorker"
    | "warehouseWorker"
    | "helper"
  >;
  gender?: "male" | "female" | "other";
  permanentAddress: {
    district: string;
    municipality?: string;
    city?: string;
    tole?: string;
    nearFamousPlace?: string;
    country: string;
    province: string;
    zip: string;
    cordinate?: [lat: number, long: number];
  };
  temparoryAddress?: {
    district: string;
    municipality?: string;
    city?: string;
    tole?: string;
    nearFamousPlace?: string;
    country: string;
    province: string;
    zip: string;
    cordinate?: [lat: number, long: number];
  };
  BaseSalary?: number;
  commission?: Types.ObjectId[];
  Deduction?: Types.ObjectId[];
  chats?: Types.ObjectId[];
  requiredWorkingTime?: number;
  totalWorkingTime?: number;
  loyaltyPoints?: number;
  OfficeTime?: string;
  Vehicle?: Types.ObjectId[];
  salesProduct?: Types.ObjectId[];
  totalSalesProduct?: number;
  todayTask?: Types.ObjectId[];
  StaffDocument?: {
    NationalID?: string;
    NationalIDPhoto?: string;
    passwordNumber?: string;
    passwordImage?: string;
    License?: string;
    LicensePhoto?: string;
    citizenShip?: string;
    citizenShipPhoto?: string; // Citizenship photo
    EmergencyContact?: string; // Emergency contact number
    EmergencyName?: string; // Emergency contact name
    EmergencyEmail?: string; // Emergency contact email
    AccountNumber?: string; // Bank account number
    bankName?: string; // Name of bank
    bankBranch?: string; // Bank branch location
    bankQRCode?: string; // Bank's QR code for payments
    e_SewaID?: string; // eSewa payment ID
    e_SewaQRCode?: string; // eSewa payment QR code
    khaltiID?: string; // Khalti payment ID
    KhaltiQRCode?: string;
  };
  photo?: string;
  company?: Types.ObjectId;
  branchId?: Types.ObjectId;
  salaryData?: Types.ObjectId[];
  attendance?: Types.ObjectId[];
  isActive: boolean;
  lastLogin: Date;
  logoutTime?: Date;
  isOnline: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const staffSchema = new Schema<IStaff>(
  {
    name: {
      type: String,
      required: true,
      comment: "Full name of the staff member",
    },
    age: {
      type: Number,
      comment: "Age of the staff member",
    },
    email: {
      type: String,
      unique: true,
      match: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
      comment: "Unique email address for login and communication",
    },
    accountType: {
      type: String,
      default: "staff",
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
      comment: "Primary contact number",
    },
    password: {
      type: String,
      required: true,
      comment: "Hashed password for authentication",
    },
    role: {
      type: [String],
      required: true,
      enum: [
        "manager",
        "ceo",
        "cbo",
        "HR",
        "director",
        "accountent",
        "cleaner",
        "driver",
        "marketer",
        "factoryWorker",
        "warehouseWorker",
        "helper",
      ],
      comment:
        "Array of roles assigned to the staff member (can have multiple roles)",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      comment: "Gender identity of the staff member",
    },
    permanentAddress: {
      district: {
        type: String,
        required: true,
        comment: "District of permanent residence",
      },
      municipality: {
        type: String,
        comment: "Municipality or rural municipality",
      },
      city: { type: String, comment: "City name if applicable" },
      tole: { type: String, comment: "Street or locality name" },
      nearFamousPlace: {
        type: String,
        comment: "Landmark for easier location",
      },
      country: {
        type: String,
        default: "Nepal",
        comment: "Country of residence",
      },
      province: {
        type: String,
        required: true,
        comment: "Province number or name",
      },
      zip: { type: String, comment: "Postal/ZIP code" },
      cordinate: {
        type: [Number],
        comment: "Geo coordinates [latitude, longitude] for mapping",
      },
    },
    temparoryAddress: {
      district: { type: String, comment: "District of temporary residence" },
      municipality: { type: String },
      city: { type: String },
      tole: { type: String },
      nearFamousPlace: { type: String },
      country: { type: String, default: "Nepal" },
      province: { type: String },
      zip: { type: String },
      cordinate: { type: [Number] },
    },
    BaseSalary: {
      type: Number,
      min: 0,
      comment: "Monthly base salary before deductions/additions",
    },
    commission: {
      type: [Types.ObjectId],
      ref: "Commission",
      default: [],
    },
    Deduction: [
      {
        type: Types.ObjectId,
        ref: "Deduction",
        comment: "Salary deduction records",
      },
    ],
    requiredWorkingTime: {
      type: Number,
      min: 0,
      comment: "Mandatory working hours per month",
    },
    totalWorkingTime: {
      type: Number,
      default: 0,
      comment: "Actual worked hours this month",
    },
    OfficeTime: {
      type: String,
      comment: "Standard office hours (e.g., '9AM-5PM')",
    },
    salaryData: [
      {
        type: Types.ObjectId,
        ref: "Salary",
        comment: "Historical salary payment records",
      },
    ],
    attendance: [
      {
        type: Types.ObjectId,
        ref: "Attendance",
        comment: "Attendance tracking records",
      },
    ],
    loyaltyPoints: {
      type: Number,
      default: 0,
      comment: "Reward points for long-term service",
    },
    salesProduct: [
      {
        type: Types.ObjectId,
        ref: "Product",
        comment: "Products assigned for sales/marketing",
      },
    ],
    totalSalesProduct: {
      type: Number,
      default: 0,
      comment: "Count of products sold by this staff",
    },
    todayTask: [
      {
        type: Types.ObjectId,
        ref: "Task",
        comment: "Daily assigned tasks",
      },
    ],
    Vehicle: [
      {
        type: Types.ObjectId,
        ref: "Vehicle",
        comment: "Assigned vehicles (for drivers)",
      },
    ],
    StaffDocument: {
      NationalID: { type: String, comment: "National identification number" },
      NationalIDPhoto: { type: String, comment: "National ID photo" },
      passwordNumber: { type: String, comment: "password number if available" },
      passwordImage: {
        type: String,
        comment: "passwordImage image for security",
      },
      License: { type: String, comment: "Driver's license number" },
      LicensePhoto: { type: String, comment: "Driver's license photo" },
      citizenShip: { type: String, comment: "Citizenship certificate number" },
      citizenShipPhoto: { type: String, comment: "Citizenship photo" },
      EmergencyContact: { type: String, comment: "Emergency contact number" },
      EmergencyName: { type: String, comment: "Emergency contact name" },
      EmergencyEmail: { type: String, comment: "Emergency contact email" },
      AccountNumber: { type: String, comment: "Bank account number" },
      bankName: { type: String, comment: "Name of bank" },
      bankBranch: { type: String, comment: "Bank branch location" },
      bankQRCode: { type: String, comment: "Bank's QR code for payments" },
      e_SewaQRCode: { type: String, comment: "eSewa payment QR code" },
      khaltiID: { type: String, comment: "Khalti payment ID" },
      KhaltiQRCode: { type: String, comment: "Khalti payment QR code" },
    },
    photo: {
      type: String,
      comment: "URL to staff profile photo",
    },
    company: {
      type: Types.ObjectId,
      ref: "Company",
      required: true,
      comment: "Reference to the company this staff belongs to",
    },
    branchId: {
      type: Types.ObjectId,
      ref: "Branch",
      required: true,
      comment: "Reference to the specific branch/location",
    },
    isActive: {
      type: Boolean,
      default: true,
      comment: "Whether the staff account is currently active",
    },
    lastLogin: {
      type: Date,
      comment: "Timestamp of last successful login",
    },
    logoutTime: {
      type: Date,
      comment: "Timestamp of last logout",
    },
    isOnline: {
      type: Boolean,
      default: false,
      comment: "Current online status",
    },
    passwordResetToken: {
      type: String,
      comment: "Temporary token for password reset",
    },
    passwordResetExpires: {
      type: Date,
      comment: "Expiration time for password reset token",
    },
    chats: [
      {
        type: Types.ObjectId,
        ref: "Chat",
        comment: "Chat conversations associated with this staff",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware to update totalSalesProduct when salesProduct changes
staffSchema.pre("save", function (next) {
  if (this.isModified("salesProduct")) {
    this.totalSalesProduct = this.salesProduct?.length || 0;
  }
  next();
});

// Also update when using findOneAndUpdate operations
staffSchema.post("findOneAndUpdate", async function (doc) {
  if (doc) {
    const salesCount = doc.salesProduct?.length || 0;
    if (doc.totalSalesProduct !== salesCount) {
      doc.totalSalesProduct = salesCount;
      await doc.save();
    }
  }
});

// Instance method to manually update the count
staffSchema.methods.updateSalesCount = function () {
  const newCount = this.salesProduct?.length || 0;
  if (this.totalSalesProduct !== newCount) {
    this.totalSalesProduct = newCount;
    return this.save();
  }
  return Promise.resolve(this);
};

staffSchema.index(
  {
    name: "text",
    email: "text",
    phone: "text",
  },
  {
    weights: {
      name: 3,
      email: 2,
      phone: 1,
    },
    name: "StaffTextIndex",
    default_language: "english",
  }
);

const StaffModel = mongoose.model<IStaff>("Staff", staffSchema);

export default StaffModel;

export const Staff = mongoose.model<IStaff>("Staff", staffSchema);
