// Load environment variables from .env file
require("dotenv").config();

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

async function testDatabaseConnection() {
  console.log("🔍 Testing MongoDB Connection...\n");
  console.log(
    `📌 Connection URI: ${
      MONGODB_URI ? MONGODB_URI.substring(0, 50) + "..." : "NOT SET"
    }\n`
  );

  if (!MONGODB_URI) {
    console.error("❌ ERROR: MONGODB_URI is not set in your .env file");
    process.exit(1);
  }

  try {
    console.log("⏳ Connecting to MongoDB...");
    const conn = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });

    console.log("✅ Successfully connected to MongoDB!");
    console.log(`\n📊 Connection Details:`);
    console.log(`   - Host: ${conn.connection.host}`);
    console.log(`   - Port: ${conn.connection.port}`);
    console.log(`   - Database: ${conn.connection.db.databaseName}`);
    console.log(
      `   - Ready State: ${
        conn.connection.readyState === 1 ? "Connected" : "Disconnected"
      }`
    );
    console.log(
      `   - Collections: ${Object.keys(conn.connection.collections).length}`
    );

    // Try a test operation
    console.log("\n⏳ Testing a sample operation...");
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(
      `✅ Found ${collections.length} collection(s): ${
        collections.map((c) => c.name).join(", ") || "None yet"
      }`
    );

    await mongoose.connection.close();
    console.log("\n✅ Connection closed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed!\n");
    console.error(`Error: ${error.message}`);
    if (error.name === "MongoNetworkError") {
      console.error(
        "\n💡 Tip: Check your internet connection and MongoDB Atlas network access"
      );
    }
    if (error.name === "MongoAuthenticationError") {
      console.error("\n💡 Tip: Check your credentials in MONGODB_URI");
    }
    process.exit(1);
  }
}

testDatabaseConnection();
