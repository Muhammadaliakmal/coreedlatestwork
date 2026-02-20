import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createProject,
  listMyProjects,
} from "../controllers/projects.controllers.js";
const router = express.Router();

// Middleware
router.use(verifyJWT);

// http://localhost:8000/api/v1/project

//API endpoint to create a new project
router.route("/").post(createProject).get(listMyProjects);

export default router;
