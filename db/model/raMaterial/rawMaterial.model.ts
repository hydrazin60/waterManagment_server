import { Document, Schema, model, Types } from "mongoose";

// ====================== INTERFACES ======================
interface IMaterialSupplier {
  supplierId: Types.ObjectId; // Reference only
  supplierName: string;
  costPerUnit: number;
  minOrderQuantity: number;
}

export interface IRawMaterial extends Document {
  name: string;
  materialType: "filter" | "chemical" | "packaging" | "other";
  description?: string;
  totalStock: number;
  unit: "kg" | "L" | "pcs" | "roll" | "sheet";
  batchNumber: string;
  totalCostPerUnit: number;
  suppliers: IMaterialSupplier[];
  qualityStandards: {
    pHRange?: [number, number]; // for chemicals
    purity?: number; // for chemicals
    certification?: string; // for all
    toxicityLevel?: string; // chemical-specific
    solubility?: string; // chemical-specific

    micronRating?: number; // filter-specific
    flowRate?: number; // filter-specific
    material?: string; // filter-specific

    elasticity?: number; // packaging (jar rubber)
    materialType?: string; // packaging
    temperatureResistance?: string; // packaging
  };

  isAvailable: boolean;
  company: Types.ObjectId;
  branch: Types.ObjectId;
  rawMaterialUploadBy?: Types.ObjectId;
  rawMaterialUploadByModel: "Admin" | "BusinessUser";
  createdAt: Date;
  updatedAt: Date;
}

// ====================== SUB SCHEMAS ======================
const MaterialSupplierSchema = new Schema<IMaterialSupplier>(
  {
    supplierId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },
    costPerUnit: {
      type: Number,
      required: true,
      min: 0.01,
    },
    minOrderQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: false,
  }
);

const QualityStandardsSchema = new Schema(
  {
    pHRange: {
      type: [Number],
      validate: {
        validator: (v: number[]) => v.length === 2 && v[0] < v[1],
        message: "pH range must be [min, max]",
      },
    },
    purity: {
      type: Number,
      min: 0,
      max: 100,
    },
    certification: {
      type: String,
      trim: true,
    },

    // Additional for chemical
    toxicityLevel: {
      type: String,
      enum: ["low", "moderate", "high"],
    },
    solubility: {
      type: String,
      trim: true,
    },

    // Additional for filter
    micronRating: {
      type: Number, // e.g. 0.5, 1, 5, 10 microns
      min: 0,
    },
    flowRate: {
      type: Number, // L/min or m³/h depending
    },
    material: {
      type: String,
      trim: true,
    },

    // Additional for packaging (jar rubber)
    elasticity: {
      type: Number, // e.g., Shore A hardness or elongation %
      min: 0,
    },
    materialType: {
      type: String,
      trim: true,
    },
    temperatureResistance: {
      type: String, // e.g., "-10°C to 80°C"
    },
  },
  { _id: false }
);

// ====================== MAIN SCHEMA ======================
const RawMaterialSchema = new Schema<IRawMaterial>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    materialType: {
      type: String,
      required: true,
      enum: ["filter", "chemical", "packaging", "other"],
    },
    description: {
      type: String,
      maxlength: 500,
    },
    unit: {
      type: String,
      required: true,
      enum: ["kg", "L", "pcs", "roll", "sheet"],
    },
    batchNumber: {
      type: String,
      required: true,
      match: /^BATCH-RAW-\d{4}-\d{3}$/,
      uppercase: true,
    },
    totalCostPerUnit: {
      type: Number,
      required: true,
      min: 0.01,
    },
    suppliers: [MaterialSupplierSchema],
    qualityStandards: QualityStandardsSchema,
    isAvailable: {
      type: Boolean,
      default: true,
    },
    totalStock: {
      type: Number,
      default: 0,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    rawMaterialUploadBy: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "rawMaterialUploadByModel",
    },
    rawMaterialUploadByModel: {
      type: String,
      required: true,
      enum: ["Admin", "BusinessUser"],
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
RawMaterialSchema.index({ name: 1, company: 1 }, { unique: true });
RawMaterialSchema.index({ batchNumber: 1 });

// ====================== MODEL ======================
export const RawMaterial = model<IRawMaterial>(
  "RawMaterial",
  RawMaterialSchema
);
