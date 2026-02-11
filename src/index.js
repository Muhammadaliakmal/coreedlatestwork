//----------------------------------------

import dotenv from "dotenv";
import app from "./app.js";
import connectMongoDb from "./db/connection.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 5000;

// Connect to MongoDB first, then start the server
connectMongoDb(process.env.MONGODB_URL)
  .then(() => {
    console.log("✅ MongoDB connected successfully!");

    // Start server after successful DB connection
    app.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log("❌ MongoDB connection failed:", error.message);
    process.exit(1); // Exit if DB connection fails
  });
