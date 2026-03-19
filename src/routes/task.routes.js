import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  requireProjectAdmin,
  requireProjectMember,
} from "../middlewares/project.middleware.js";
import {
  createTask,
  listTask,
  getTaskDetails,
  updateTask,
  deleteTask
} from "../controllers/task.controllers.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

// POST /api/v1/tasks/:projectId - Create a new task (admin only)
router
  .route("/:projectId")
  .post(requireProjectMember, requireProjectAdmin, createTask);

// GET /api/v1/tasks/:projectId - List all tasks in a project (member access)
router.route("/:projectId").get(requireProjectMember, listTask);

// GET /api/v1/tasks/:projectId/:taskId - Get task details (member access)
router.route("/:projectId/:taskId").get(requireProjectMember, getTaskDetails);

// PUT /api/v1/tasks/:projectId/:taskId - Update a task (admin only)
router
  .route("/:projectId/:taskId")
  .put(requireProjectMember, requireProjectAdmin, updateTask);

  router.route("/:projectId/:taskId").all(requireProjectMember, requireProjectAdmin).delete(deleteTask)

export default router;
