import express from "express";
import cors from "cors";
import healthcheckroutes from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/projects.routes.js";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/api-error.js";
import projectMemberRouter from "./routes/projectMembers.routes.js";

const app = express();
//-------------------------------cookie parser
app.use(cookieParser());

//------------------------------- middleware
app.use(express.json({ limit: "16kb" })); // to make readable clients json.body
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // this will encode your url for safety reason
app.use(express.static("public")); // this tells express about never changing files/data

// ----------------------CORS
app.use(
  cors({
    origin: "http://localhost:3000", // More specific origin in development
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

//----------------------------------API
app.get("/", (req, res) => {
  res.end("Welcome to Project Management API!");
});

// API ROUTES
app.use("/api/v1/health-check", healthcheckroutes);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/projects/:projectId/members", projectMemberRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle ApiError specifically
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.error,
    });
  } else {
    // Default error handling for other errors
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: err.message,
    });
  }
});

export default app;
