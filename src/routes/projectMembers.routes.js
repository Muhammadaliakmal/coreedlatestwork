// src\routes\projectMembers.routes.js
import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { listProjectMember,addProjectMember } from "../controllers/projectMembers.controllers.js";
import { requireProjectMember ,requireProjectAdmin} from "../middlewares/project.middleware.js";
const router = express.Router();

// Middleware
router.use(verifyJWT);//  you are login

// /api/projects/:projectId/members
router.use(requireProjectMember);// you are same project member

// API routes
router.route("/:projectId/members").get(listProjectMember);// this will list all the members of a project

router.route("/:projectId/members").post(requireProjectAdmin,addProjectMember);// this will add a member to a project

export default router;
