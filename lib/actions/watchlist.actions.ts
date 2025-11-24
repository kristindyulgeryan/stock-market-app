"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";

export const getWatchlistSymbolsByEmail = async (
  email: string
): Promise<string[]> => {
  try {
    if (!email) return [];

    // Connect to database
    await connectToDatabase();

    // Get the MongoDB connection
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error("Database connection not available");
      return [];
    }

    // Find user by email in the user collection
    const user = await db.collection("user").findOne({ email });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return [];
    }

    // Query watchlist by userId, return only symbols
    const watchlistItems = await Watchlist.find(
      { userId: user.id || user._id?.toString() },
      { symbol: 1, _id: 0 }
    ).lean();

    // Extract and return symbols as strings
    const symbols = watchlistItems.map((item) => item.symbol);
    return symbols;
  } catch (error) {
    console.error("Error fetching watchlist symbols by email:", error);
    return [];
  }
};
