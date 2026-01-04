import mongoose from "mongoose";

/**
 * MongoDB connection URI from environment variables
 * @constant {string}
 */
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  throw new Error("Missing MONGODB_URI environment variable");
}

/**
 * Connect to MongoDB database using Mongoose
 * Implements singleton pattern to avoid multiple connections in development
 * 
 * @returns {Promise<void>} Resolves when connection is established
 * @throws {Error} If connection fails
 */
export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  await mongoose.connect(MONGO_URI);
}
