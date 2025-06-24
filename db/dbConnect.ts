// db/dbConnect.ts
import mongoose from "mongoose";

export const dbConnect = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      // Only connect if not already connected
      await mongoose.connect(process.env.MONGO_URL as string, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      });
      console.log("✅ MongoDB connected successfully");
    }
  } catch (error: any) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error; // Rethrow to be caught by error middleware
  }
};
