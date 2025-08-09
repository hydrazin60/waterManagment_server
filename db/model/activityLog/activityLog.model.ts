// activity-log.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IActivityLog extends Document {
  action: string;
  entity: string;
  entityId: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  timestamp: Date;
  performedByModel: "BusinessUser" | "Worker" | "Admin"; // Explicit enum in interface
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    performedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "performedByModel",
    },
    performedByModel: {
      type: String,
      required: true,
      enum: ["BusinessUser", "Worker", "Admin"],
    },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Clear existing model if compiled before
if (mongoose.models.ActivityLog) {
  delete mongoose.models.ActivityLog;
}

export const ActivityLog = mongoose.model<IActivityLog>(
  "ActivityLog",
  ActivityLogSchema
);