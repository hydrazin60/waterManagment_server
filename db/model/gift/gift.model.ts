import mongoose, { Document, Schema, Types } from "mongoose";

export interface IGift extends Document {
  subject: string;
  GiftReason: string;
  description: string;
  pointsRequired: number;
  imageUrl?: string;
  isActive: boolean;
  quantityAvailable: number;
  expiryDate?: Date;
  createdBy?: Types.ObjectId; // Changed from customerName to createdBy
  createdAt: Date;
  updatedAt: Date;
}

const GiftSchema = new Schema<IGift>(
  {
    subject: { type: String, required: true },
    GiftReason: { type: String, required: true },
    description: { type: String, required: true },
    pointsRequired: { type: Number, min: 0 },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    quantityAvailable: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date },
    createdBy: {
      type: Types.ObjectId,
      ref: "CustomerUser",
      required: false, // Optional field
    },
  },
  { timestamps: true }
);

export const Gift = mongoose.model<IGift>("Gift", GiftSchema);

export default Gift;
