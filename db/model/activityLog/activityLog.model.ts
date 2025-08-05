import mongoose, { Document, Schema } from "mongoose";

// Interface for Activity Log document
export interface IActivityLog extends Document {
  action: string;
  entity: string;
  entityId: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  timestamp: Date;
  performedByModel: string;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "performedByModel",
    },
    performedByModel: {
      type: String,
      required: true,
      enum: ["BusinessUser", "Worker"],
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
    versionKey: false,
  }
);

// Indexes for faster querying
ActivityLogSchema.index({ action: 1, entity: 1 });
ActivityLogSchema.index({ performedBy: 1, timestamp: -1 });
ActivityLogSchema.index({ entityId: 1, entity: 1 });

// Model
export const ActivityLog = mongoose.model<IActivityLog>(
  "ActivityLog",
  ActivityLogSchema
);
