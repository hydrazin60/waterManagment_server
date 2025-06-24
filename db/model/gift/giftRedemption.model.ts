import mongoose, { Document, Schema, Types } from "mongoose";

export interface IGiftRedemption extends Document {
  gift: Types.ObjectId;
  customer: Types.ObjectId;
  redeemedAt: Date;
  pointsUsed: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const GiftRedemptionSchema = new Schema<IGiftRedemption>(
  {
    gift: { type: Schema.Types.ObjectId, ref: "Gift", required: true },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "CustomerUser",
      required: true,
    },
    redeemedAt: { type: Date, default: Date.now },
    pointsUsed: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const GiftRedemption = mongoose.model<IGiftRedemption>(
  "GiftRedemption",
  GiftRedemptionSchema
);

export default GiftRedemption;
