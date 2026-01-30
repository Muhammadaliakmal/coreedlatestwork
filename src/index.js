
//----------------------------------------

import dotenv from 'dotenv'
import app from './app.js'
import connectMongoDb from './db/connection.js'


dotenv.config({
  path: './.env'
})

const port = process.env.PORT  || 5000

// Start server regardless of MongoDB connection status
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);

  // Attempt MongoDB connection separately without blocking server startup
  connectMongoDb()
    .then(() => {
      console.log("✅ MongoDB  connected successfully! later use hoga abhi nahi!");
    })
    .catch((error) => {
      console.log("⚠️  MongoDB connection failed, but server is running:", error.message);
    });
});



