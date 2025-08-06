import { Document, Types, Schema } from "mongoose";

interface IProductVariant {
  name: string; // "20L Jar", "1L Bottle"
  unit: string; // "jar", "bottle", "L"
  capacity: number; // Volume in liters (e.g., 20)
  unitPrice: number; // Base price (NPR)
  productionCost: number; // Cost per unit (NPR)
  currentStock: number;
  batchNumber: string; // "BATCH-2024-08-001"
  waterSource: "Groundwater" | "Municipal" | "Himalayan";
  rawMaterials: {
    material: Types.ObjectId; // Reference to RawMaterial
    quantity: number; // e.g., 1.5L per bottle
    cost: number; // Material cost per unit (NPR)
  }[];
}

interface IWaterQuality {
  pHLevel: number;
  tdsLevel: number; // ppm
  testedAt: Date;
  testedBy: Types.ObjectId; // Admin/QC staff
}

export interface IFinishedProduct extends Document {
  company: Types.ObjectId; // Water factory
  branch: Types.ObjectId; // Production branch
  name: string; // "Himalayan Spring Water"
  description: string;
  variants: IProductVariant[];
  waterQuality: IWaterQuality[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
const ProductVariantSchema = new Schema<IProductVariant>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  unit: {
    type: String,
    required: true,
    enum: ["jar", "bottle", "L", "gallon", "can"],
  },
  capacity: {
    type: Number,
    required: true,
    min: 0.5, // Minimum 0.5L
    max: 100, // Maximum 100L
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 10, // NPR 10 minimum
  },
  productionCost: {
    type: Number,
    required: true,
    min: 0,
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0,
  },
  batchNumber: {
    type: String,
    required: true,
    match: /^BATCH-\d{4}-\d{2}-\d{3}$/,
  },
  waterSource: {
    type: String,
    required: true,
    enum: ["Groundwater", "Municipal", "Himalayan"],
  },
  rawMaterials: [
    {
      material: {
        type: Schema.Types.ObjectId,
        ref: "RawMaterial",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0.01, // e.g., 1.5L per bottle
      },
      cost: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  ],
});

const WaterQualitySchema = new Schema<IWaterQuality>({
  pHLevel: {
    type: Number,
    required: true,
    min: 6,
    max: 8.5,
  },
  tdsLevel: {
    type: Number,
    required: true,
    min: 50,
    max: 500, // ppm
  },
  testedAt: {
    type: Date,
    default: Date.now,
  },
  testedBy: {
    type: Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
});

const FinishedProductSchema = new Schema<IFinishedProduct>(
  {
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
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    variants: [ProductVariantSchema],
    waterQuality: [WaterQualitySchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast querying
FinishedProductSchema.index({ company: 1, branch: 1 });
FinishedProductSchema.index({ "variants.sku": 1 }, { unique: true });
FinishedProductSchema.index({ "variants.batchNumber": 1 });
